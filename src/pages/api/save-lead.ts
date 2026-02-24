/**
 * /api/save-lead
 * Saves a chat-captured lead to Sanity CMS.
 *
 * POST body: { name, email?, phone?, interest, notes }
 * Response:  { ok: true } | { ok: false, error?: string }
 *
 * Called internally from /api/chat when the AI triggers the
 * capturar_prospecto tool.
 */
import type { APIRoute } from 'astro';
import { createClient } from '@sanity/client';

export const POST: APIRoute = async ({ request }) => {
  const token = import.meta.env.SANITY_API_TOKEN;

  if (!token) {
    // Graceful degradation: no token configured, skip save
    return new Response(
      JSON.stringify({ ok: false, error: 'CMS token not configured.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let body: {
    name?: string;
    email?: string;
    phone?: string;
    interest?: string;
    notes?: string;
  };

  try {
    body = await request.json() as typeof body;
  } catch {
    return new Response(
      JSON.stringify({ ok: false, error: 'Invalid JSON.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Always use a write client (never CDN)
  const client = createClient({
    projectId: import.meta.env.SANITY_PROJECT_ID,
    dataset: import.meta.env.SANITY_DATASET ?? 'production',
    apiVersion: '2024-01-01',
    token,
    useCdn: false,
  });

  try {
    await client.create({
      _type: 'lead',
      name: body.name ?? 'Sin nombre',
      ...(body.email  && { email: body.email }),
      ...(body.phone  && { phone: body.phone }),
      interest: body.interest ?? 'otro',
      notes: body.notes ?? '',
      source: 'chat_widget',
      capturedAt: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('[/api/save-lead] Sanity error:', err);
    return new Response(
      JSON.stringify({ ok: false, error: 'Could not save lead.' }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
