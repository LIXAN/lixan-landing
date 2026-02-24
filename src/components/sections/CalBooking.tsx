/**
 * CalBooking.tsx
 * Cal.com appointment booking component.
 *
 * Renders two options controlled by the `mode` prop:
 *   - "inline"  → embeds the full calendar directly on the page (best for a dedicated section)
 *   - "popup"   → renders a styled button that opens a Cal.com modal on click
 *
 * Usage in .astro files:
 *   <!-- Inline (full calendar embedded) -->
 *   <CalBooking mode="inline" client:load />
 *
 *   <!-- Popup button -->
 *   <CalBooking mode="popup" label="Agendar llamada gratis" client:load />
 *
 * Environment variables required (set in .env):
 *   PUBLIC_CAL_USERNAME   — your Cal.com username
 *   PUBLIC_CAL_EVENT_SLUG — the event-type slug (e.g. "consulta-gratuita")
 */
import Cal, { getCalApi } from '@calcom/embed-react';
import { useEffect } from 'react';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
interface CalBookingProps {
  /** "inline" embeds the calendar; "popup" shows a button that opens a modal */
  mode?: 'inline' | 'popup';
  /** Label for the popup button (ignored when mode="inline") */
  label?: string;
  /** Extra CSS class names for the popup button */
  className?: string;
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

/** Reads PUBLIC_CAL_* env vars and builds the cal link ("username/event-slug") */
function getCalLink(): string {
  // In Astro, PUBLIC_ vars are exposed via import.meta.env at build time
  const username =
    (typeof import.meta !== 'undefined' && (import.meta.env as Record<string, string>).PUBLIC_CAL_USERNAME) ??
    'lixan';
  const slug =
    (typeof import.meta !== 'undefined' && (import.meta.env as Record<string, string>).PUBLIC_CAL_EVENT_SLUG) ??
    'consulta-gratuita';
  return `${username}/${slug}`;
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────
export default function CalBooking({
  mode = 'popup',
  label = 'Agendar llamada gratis',
  className = '',
}: CalBookingProps) {
  const calLink = getCalLink();
  const namespace = 'lixan-booking'; // unique key for this embed instance

  useEffect(() => {
    // Initialise the Cal.com API for both inline and popup modes
    getCalApi({ namespace }).then((cal) => {
      cal('ui', {
        // Branding / theme options — see https://cal.com/docs/embedding/embed-snippet-generator
        theme: 'dark',
        hideEventTypeDetails: false,
        layout: 'month_view',
        styles: {
          branding: {
            brandColor: '#6d3df7', // matches --color-brand-500
          },
        },
      });
    });
  }, [mode]);

  // ── Inline mode: Cal.com renders the calendar directly ──
  if (mode === 'inline') {
    return (
      <div className="w-full overflow-hidden rounded-brand border border-surface-700" style={{ minHeight: '640px' }}>
        <Cal
          namespace={namespace}
          calLink={calLink}
          style={{ width: '100%', height: '100%', minHeight: '640px', overflow: 'scroll' }}
          config={{
            layout: 'month_view',
            theme: 'dark',
          }}
        />
      </div>
    );
  }

  // ── Popup mode: button opens the Cal.com modal ──
  const baseClasses =
    'inline-flex items-center justify-center gap-2 px-8 py-4 rounded-pill bg-brand-500 hover:bg-brand-400 text-white font-semibold text-base transition-all duration-200 shadow-lg shadow-brand-500/30 hover:shadow-brand-400/40 hover:-translate-y-0.5 cursor-pointer';

  return (
    <button
      type="button"
      data-cal-namespace={namespace}
      data-cal-link={calLink}
      data-cal-config={JSON.stringify({ layout: 'month_view' })}
      className={`${baseClasses} ${className}`.trim()}
      aria-label={label}
    >
      {/* Calendar icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-5 h-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
      {label}
    </button>
  );
}
