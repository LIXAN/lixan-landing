import { Resend } from 'resend';

// Lazy-init: the client is created on first use so that the module can be
// imported at build time without requiring RESEND_API_KEY to be present.
let _resend: Resend | null = null;

function getResendClient(): Resend {
  if (!_resend) {
    const apiKey = import.meta.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is not set.');
    }
    _resend = new Resend(apiKey);
  }
  return _resend;
}

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
export interface LeadEmailPayload {
  name: string;
  email: string;
  message: string;
  company?: string;
  service?: string; // service of interest selected in the form
}

interface SendEmailResult {
  success: boolean;
  error?: string;
}

// ─────────────────────────────────────────────────────────────
// Helper: format the HTML email body
// ─────────────────────────────────────────────────────────────
function buildLeadHtml(payload: LeadEmailPayload): string {
  const { name, email, message, company, service } = payload;
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
    <body style="font-family: ui-sans-serif, system-ui, sans-serif; background: #f9f9fb; padding: 32px;">
      <div style="max-width: 560px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 32px; border: 1px solid #e5e7eb;">
        <h1 style="margin: 0 0 24px; font-size: 20px; color: #111;">
          🚀 New Lead from Lixan
        </h1>
        <table style="width: 100%; border-collapse: collapse; font-size: 15px; color: #374151;">
          <tr>
            <td style="padding: 8px 0; font-weight: 600; width: 130px;">Name</td>
            <td style="padding: 8px 0;">${escapeHtml(name)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600;">Email</td>
            <td style="padding: 8px 0;"><a href="mailto:${escapeHtml(email)}" style="color: #6d3df7;">${escapeHtml(email)}</a></td>
          </tr>
          ${company ? `
          <tr>
            <td style="padding: 8px 0; font-weight: 600;">Company</td>
            <td style="padding: 8px 0;">${escapeHtml(company)}</td>
          </tr>
          ` : ''}
          ${service ? `
          <tr>
            <td style="padding: 8px 0; font-weight: 600;">Service</td>
            <td style="padding: 8px 0;">${escapeHtml(service)}</td>
          </tr>
          ` : ''}
        </table>
        <hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;" />
        <p style="font-weight: 600; margin: 0 0 8px; color: #111;">Message</p>
        <p style="margin: 0; color: #374151; white-space: pre-wrap;">${escapeHtml(message)}</p>
        <p style="margin: 32px 0 0; font-size: 12px; color: #9ca3af;">Sent via the contact form at ${import.meta.env.PUBLIC_SITE_URL ?? 'lixantech.com'}</p>
      </div>
    </body>
    </html>
  `;
}

/** Minimal HTML escaping to prevent XSS in email content. */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────

/**
 * Sends a lead notification email to the configured recipient.
 * Called from the /api/contact API route.
 */
export async function sendLeadEmail(payload: LeadEmailPayload): Promise<SendEmailResult> {
  const from = import.meta.env.RESEND_FROM_EMAIL ?? 'noreply@lixantech.com';
  const to = import.meta.env.LEAD_RECIPIENT_EMAIL ?? 'admin.2026@lixantech.com';

  try {
    const resend = getResendClient();
    const { error } = await resend.emails.send({
      from,
      to: [to],
      replyTo: payload.email,
      subject: `New lead from ${payload.name}${payload.company ? ` · ${payload.company}` : ''}`,
      html: buildLeadHtml(payload),
    });

    if (error) {
      console.error('[resend] Send error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[resend] Unexpected error:', message);
    return { success: false, error: message };
  }
}
