import type { APIRoute } from 'astro';
import { z } from 'zod';
import { sendLeadEmail } from '../../lib/resend';

export const prerender = false;

// ─────────────────────────────────────────────────────────────
// Rate limiter — in-memory, per IP, max 3 requests / 10 min
// ─────────────────────────────────────────────────────────────
const WINDOW_MS   = 10 * 60 * 1000; // 10 minutes
const MAX_HITS    = 3;

const ipHits = new Map<string, { count: number; resetAt: number }>();

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
// HTML sanitizer — strip tags before saving/sending
// ─────────────────────────────────────────────────────────────
function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, '').trim();
}

// ─────────────────────────────────────────────────────────────
// Allowed service values (enum — bots submitting random values fail here)
// ─────────────────────────────────────────────────────────────
const VALID_SERVICES = [
  'Automatizaciones',
  'Diseño Web',
  'IA & Chatbots',
  'Integraciones',
  'Analytics',
  'Email Marketing',
  'Otro',
  '',
] as const;

// ─────────────────────────────────────────────────────────────
// Validation schema
// ─────────────────────────────────────────────────────────────
const contactSchema = z.object({
  name: z
    .string({ required_error: 'El nombre es requerido' })
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'Nombre demasiado largo'),
  email: z
    .string({ required_error: 'El email es requerido' })
    .email('Email inválido')
    .max(254, 'Email demasiado largo'),
  message: z
    .string({ required_error: 'El mensaje es requerido' })
    .min(10, 'El mensaje debe tener al menos 10 caracteres')
    .max(2000, 'Mensaje demasiado largo'),
  company: z
    .string()
    .max(100, 'Nombre de empresa demasiado largo')
    .optional(),
  service: z
    .enum(VALID_SERVICES, { message: 'Servicio no válido' })
    .optional(),
  // Honeypot — must be empty; bots fill it, humans don't see it
  website: z.string().max(0, 'Bot detected').optional(),
});

// ─────────────────────────────────────────────────────────────
// POST handler
// ─────────────────────────────────────────────────────────────
export const POST: APIRoute = async ({ request, clientAddress }) => {
  // ── Method guard (belt-and-suspenders, ALL handler below also covers this)
  if (request.method !== 'POST') {
    return json({ success: false, error: 'Method not allowed' }, 405);
  }

  // ── Rate limiting
  const ip = clientAddress ?? 'unknown';
  if (isRateLimited(ip)) {
    return json({ success: false, error: 'Demasiados intentos. Intenta en unos minutos.' }, 429);
  }

  // ── Content-Type check
  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    return json({ success: false, error: 'Content-Type debe ser application/json' }, 415);
  }

  // ── Parse body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ success: false, error: 'Cuerpo JSON inválido' }, 400);
  }

  // ── Validate with Zod
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    // Don't expose internal field names to the outside; just signal failure
    return json({ success: false, error: 'Datos inválidos. Revisá los campos e intentá de nuevo.' }, 422);
  }

  // ── Honeypot: silently accept but don't process
  if (parsed.data.website && parsed.data.website.length > 0) {
    return json({ success: true }, 200); // fake success so bots don't retry
  }

  // ── Sanitize inputs
  const safe = {
    ...parsed.data,
    name:    stripHtml(parsed.data.name),
    message: stripHtml(parsed.data.message),
    company: parsed.data.company ? stripHtml(parsed.data.company) : undefined,
  };

  // ── Send via Resend
  let result: { success: boolean; error?: string };
  try {
    result = await sendLeadEmail(safe);
  } catch {
    // Log on server, never expose internals to client
    console.error('[contact] sendLeadEmail threw unexpectedly');
    return json({ success: false, error: 'Ocurrió un error. Intentá de nuevo más tarde.' }, 500);
  }

  if (!result.success) {
    console.error('[contact] sendLeadEmail failed:', result.error);
    return json({ success: false, error: 'Ocurrió un error. Intentá de nuevo más tarde.' }, 500);
  }

  return json({ success: true }, 200);
};

// Reject all other HTTP methods
export const ALL: APIRoute = () =>
  json({ success: false, error: 'Method not allowed' }, 405, { Allow: 'POST' });

// ─── helper ──────────────────────────────────────────────────
function json(
  data: unknown,
  status: number,
  extra: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...extra },
  });
}
