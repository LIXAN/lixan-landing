import { defineType, defineField } from 'sanity';

/**
 * lead.ts
 * Schema for leads captured via the AI chat widget.
 * Visible in Sanity Studio under "Prospectos (Chat)".
 */
export const leadSchema = defineType({
  name: 'lead',
  title: 'Prospectos (Chat)',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Nombre',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
    }),
    defineField({
      name: 'phone',
      title: 'Teléfono',
      type: 'string',
    }),
    defineField({
      name: 'interest',
      title: 'Servicio de interés',
      type: 'string',
      options: {
        list: [
          { title: 'Landing Page', value: 'landing_page' },
          { title: 'Sitio Web', value: 'sitio_web' },
          { title: 'Automatizaciones', value: 'automatizacion' },
          { title: 'IA & Chatbots', value: 'chatbot' },
          { title: 'CMS & Dashboard', value: 'cms' },
          { title: 'Integraciones', value: 'integracion' },
          { title: 'Otro', value: 'otro' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'notes',
      title: 'Necesidad / problema',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'source',
      title: 'Fuente',
      type: 'string',
      readOnly: true,
      initialValue: 'chat_widget',
    }),
    defineField({
      name: 'capturedAt',
      title: 'Fecha de captura',
      type: 'datetime',
      readOnly: true,
    }),
  ],
  orderings: [
    {
      title: 'Más recientes',
      name: 'capturedAtDesc',
      by: [{ field: 'capturedAt', direction: 'desc' }],
    },
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'interest',
      description: 'notes',
    },
    prepare({ title, subtitle, description }) {
      const labels: Record<string, string> = {
        landing_page: 'Landing Page',
        sitio_web: 'Sitio Web',
        automatizacion: 'Automatizaciones',
        chatbot: 'IA & Chatbots',
        cms: 'CMS & Dashboard',
        integracion: 'Integraciones',
        otro: 'Otro',
      };
      return {
        title: title ?? 'Sin nombre',
        subtitle: labels[subtitle] ?? subtitle,
        description,
      };
    },
  },
});
