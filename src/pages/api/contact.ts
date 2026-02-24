import type { APIRoute } from 'astro';
import { z } from 'zod';
import { createClient } from '@sanity/client';
import { sendLeadEmail } from '../../lib/resend';

export const prerender = false;

// ─────────────────────────────────────────────────────────────
// Rate limiter — in-memory, per IP, max 3 requests / 10 min
// ─────────────────────────────────────────────────────────────
const WINDOW_MS = 10 * 60 * 1000;
const MAX_HITS  = 3;
const ipHits    = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now  = Date.now();
  const slot = ipHits.get(ip);
  if (!slot || now > slot.resetAt) {
    ipHits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  if (slot.count >= MAX_HITS) return true;
  slot.count += 1;
  return false;
}

// ─────────────────────────────────────────────────────────────
// HTML sanitizer
// ─────────────────────────────────────────────────────────────
function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, '').trim();
}

// ─────────────────────────────────────────────────────────────
// Map contact-form service label → Sanity lead interest value
// ─────────────────────────────────────────────────────────────
function mapServiceToInterest(service?: string): string {
  const map: Record<string, string> = {
    'Automatizaciones': 'automatizacion',
    'Diseño Web':       'sitio_web',
    'IA & Chatbots':    'chatbot',
    'Integraciones':    'integracion',
    'Analytics':        'otro',
    'Email Marketing':  'otro',
    'Otro':             'otro',
  };
  return (service && map[service]) ? map[service] : 'otro';
}

// ─────────────────────────────────────────────────────────────
// Validation schema
// ─────────────────────────────────────────────────────────────
const VALID_SERVICES = [
  'Automatizaciones', 'Diseño Web', 'IA & Chatbots',
  'Integraciones', 'Analytics', 'Email Marketing', 'Otro', '',
] as const;

const contactSchema = z.object({
  name:    z.string({ required_error: 'El nombre es requerido' }).min(2).max(100),
  email:   z.string({ required_error: 'El email es requerido' }).email().max(254),
  message: z.string({ required_error: 'El mensaje es requerido' }).min(10).max(2000),
  company: z.string().max(100).optional(),
  service: z.enum(VALID_SERVICES, { message: 'Servicio no válido' }).optional(),
  website: z.string().max(0, 'Bot detected').optional(), // honeypot
});

// ─────────────────────────────────────────────────────────────
// POST handler
// ─────────────────────────────────────────────────────────────
export const POST: APIRoute = async ({ request, clientAddress }) => {
  if (request.method !== 'POST') return json({ success: false, error: 'Method not allowed' }, 405);

  const ip = clientAddress ?? 'unknown';
  if (isRateLimited(ip)) return json({ success: false, error: 'Demasiados intentos. Intenta en unos minutos.' }, 429);

  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) return json({ success: false, error: 'Content-Type debe ser application/json' }, 415);

  let body: unknown;
  try { body = await request.json(); }
  catch { return json({ success: false, error: 'Cuerpo JSON inválido' }, 400); }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) return json({ success: false, error: 'Datos inválidos. Revisá los campos e intentá de nuevo.' }, 422);

  // Honeypot: silently succeed so bots don't retry
  if (parsed.data.website && parsed.data.website.length > 0) return json({ success: true }, 200);

  const safe = {
    ...parsed.data,
    name:    stripHtml(parsed.data.name),
    message: stripHtml(parsed.data.message),
    company: parsed.data.company ? stripHtml(parsed.data.company) : undefined,
  };

  // ── PRIMARY: Save lead to Sanity ──────────────────────────
  const token = process.env.SANITY_API_TOKEN;
  if (!token) {
    console.error('[contact] SANITY_API_TOKEN not set');
    return json({ success: false, error: 'Ocurrió un error. Intentá de nuevo más tarde.' }, 500);
  }

  try {
    const sanity = createClient({
      projectId: 'dbxx60js',
      dataset:   'production',
      apiVersion: '2024-01-01',
      token,
      useCdn: false,
    });

    await sanity.create({
      _type:       'lead',
      name:        safe.name,
      email:       safe.email,
      company:     safe.company ?? '',
      interest:    mapServiceToInterest(safe.service),
      notes:       safe.message,
      source:      'contact_form',
      capturedAt:  new Date().toISOString(),
    });
  } catch (err) {
    console.error('[contact] Failed to save lead to Sanity:', err);
    return json({ success: false, error: 'Ocurrió un error. Intentá de nuevo más tarde.' }, 500);
  }

  // ── SECONDARY: Send email notification (non-blocking) ────
  sendLeadEmail(safe).catch((err) => {
    console.error('[contact] Email notification failed (non-blocking):', err);
  });

  return json({ success: true }, 200);
};

export const ALL: APIRoute = () =>
  json({ success: false, error: 'Method not allowed' }, 405, { Allow: 'POST' });

function json(data: unknown, status: number, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...extra },
  });
}
