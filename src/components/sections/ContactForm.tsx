/**
 * ContactForm.tsx
 * Interactive lead capture form.
 * Uses React Hook Form + Zod for validation.
 * Submits to /api/contact and shows status feedback.
 *
 * Usage in .astro file:
 *   <ContactForm client:load />
 */
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';

// ─────────────────────────────────────────────────────────────
// Validation schema (mirrors the server-side schema in api/contact.ts)
// ─────────────────────────────────────────────────────────────
const schema = z.object({
  name: z
    .string({ required_error: 'El nombre es requerido' })
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'Nombre demasiado largo'),
  email: z
    .string({ required_error: 'El email es requerido' })
    .email('Ingresa un email válido'),
  company: z
    .string()
    .max(100, 'Nombre de empresa demasiado largo')
    .optional(),
  service: z
    .string()
    .optional(),
  message: z
    .string({ required_error: 'El mensaje es requerido' })
    .min(10, 'El mensaje debe tener al menos 10 caracteres')
    .max(2000, 'Mensaje demasiado largo'),
  // Honeypot — hidden from real users, filled by bots
  website: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const SERVICE_OPTIONS = [
  { value: '', label: 'Selecciona un servicio (opcional)' },
  { value: 'Automatizaciones', label: 'Automatizaciones' },
  { value: 'Diseño Web', label: 'Diseño Web' },
  { value: 'IA & Chatbots', label: 'IA & Chatbots' },
  { value: 'Integraciones', label: 'Integraciones' },
  { value: 'Analytics', label: 'Analytics' },
  { value: 'Email Marketing', label: 'Email Marketing' },
  { value: 'Otro', label: 'Otro / No sé aún' },
];

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────
export default function ContactForm() {
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setSubmitStatus('loading');
    setServerError(null);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const json = (await res.json()) as { success: boolean; error?: string };

      if (json.success) {
        setSubmitStatus('success');
        reset();
      } else {
        setSubmitStatus('error');
        setServerError(json.error ?? 'Error desconocido. Intenta nuevamente.');
      }
    } catch {
      setSubmitStatus('error');
      setServerError('No se pudo enviar el mensaje. Verifica tu conexión e intenta de nuevo.');
    }
  };

  // ── Success state ──
  if (submitStatus === 'success') {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-brand-500/20 flex items-center justify-center text-3xl">
          🎉
        </div>
        <h3 className="text-xl font-bold text-text-primary">¡Mensaje enviado!</h3>
        <p className="text-text-secondary max-w-sm">
          Recibimos tu consulta. Te responderemos en menos de 24 horas hábiles.
        </p>
        <button
          type="button"
          onClick={() => setSubmitStatus('idle')}
          className="mt-2 text-sm text-brand-400 hover:text-brand-300 underline transition-colors"
        >
          Enviar otro mensaje
        </button>
      </div>
    );
  }

  const inputBase =
    'w-full rounded-xl border bg-surface-800 px-4 py-3 text-sm text-text-primary placeholder:text-text-muted transition-colors duration-200 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/50';
  const inputNormal = `${inputBase} border-surface-600`;
  const inputError = `${inputBase} border-red-500/60`;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      aria-label="Formulario de contacto"
      className="space-y-5"
    >
      {/* ── Row 1: Name + Company ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-text-primary mb-1.5">
            Nombre <span className="text-brand-400">*</span>
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            placeholder="Tu nombre completo"
            {...register('name')}
            className={errors.name ? inputError : inputNormal}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'name-error' : undefined}
          />
          {errors.name && (
            <p id="name-error" className="mt-1.5 text-xs text-red-400" role="alert">
              {errors.name.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="company" className="block text-sm font-medium text-text-primary mb-1.5">
            Empresa <span className="text-text-muted font-normal">(opcional)</span>
          </label>
          <input
            id="company"
            type="text"
            autoComplete="organization"
            placeholder="Nombre de tu empresa"
            {...register('company')}
            className={errors.company ? inputError : inputNormal}
          />
          {errors.company && (
            <p className="mt-1.5 text-xs text-red-400" role="alert">
              {errors.company.message}
            </p>
          )}
        </div>
      </div>

      {/* ── Email ── */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-1.5">
          Email <span className="text-brand-400">*</span>
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="tu@empresa.com"
          {...register('email')}
          className={errors.email ? inputError : inputNormal}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'email-error' : undefined}
        />
        {errors.email && (
          <p id="email-error" className="mt-1.5 text-xs text-red-400" role="alert">
            {errors.email.message}
          </p>
        )}
      </div>

      {/* ── Service select ── */}
      <div>
        <label htmlFor="service" className="block text-sm font-medium text-text-primary mb-1.5">
          Servicio de interés
        </label>
        <select
          id="service"
          {...register('service')}
          className={`${inputNormal} appearance-none cursor-pointer`}
        >
          {SERVICE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* ── Message ── */}
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-text-primary mb-1.5">
          Mensaje <span className="text-brand-400">*</span>
        </label>
        <textarea
          id="message"
          rows={5}
          placeholder="Cuéntanos tu proyecto o problema de negocio…"
          {...register('message')}
          className={`${errors.message ? inputError : inputNormal} resize-none`}
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? 'message-error' : undefined}
        />
        {errors.message && (
          <p id="message-error" className="mt-1.5 text-xs text-red-400" role="alert">
            {errors.message.message}
          </p>
        )}
      </div>

      {/* ── Server error ── */}
      {submitStatus === 'error' && serverError && (
        <div
          className="p-4 rounded-xl border border-red-500/40 bg-red-500/10 text-red-300 text-sm"
          role="alert"
        >
          {serverError}
        </div>
      )}

      {/* ── Honeypot (anti-bot) — visually hidden, should stay empty ── */}
      <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0, overflow: 'hidden' }}>
        <label htmlFor="website">Website</label>
        <input id="website" type="text" tabIndex={-1} autoComplete="off" {...register('website')} />
      </div>

      {/* ── Submit ── */}
      <button
        type="submit"
        disabled={submitStatus === 'loading'}
        className="w-full py-4 px-6 rounded-pill bg-brand-500 hover:bg-brand-400 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-base transition-all duration-200 shadow-lg shadow-brand-500/30 hover:shadow-brand-400/40 hover:-translate-y-0.5 disabled:hover:translate-y-0 flex items-center justify-center gap-2"
      >
        {submitStatus === 'loading' ? (
          <>
            <svg
              className="w-5 h-5 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Enviando…
          </>
        ) : (
          'Enviar mensaje'
        )}
      </button>

      <p className="text-xs text-center text-text-muted">
        Al enviar aceptas nuestra{' '}
        <a href="/privacidad" className="text-brand-400 hover:underline">
          política de privacidad
        </a>
        . Respondemos en menos de 24h.
      </p>
    </form>
  );
}
