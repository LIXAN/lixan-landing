import { defineField, defineType } from 'sanity';

/**
 * FAQ items — each document is one question + answer pair.
 * Order them with the `order` field (lower = first).
 */
export const faqSchema = defineType({
  name: 'faq',
  title: 'Preguntas Frecuentes',
  type: 'document',
  fields: [
    defineField({
      name: 'question',
      title: 'Pregunta',
      type: 'string',
      validation: (Rule) => Rule.required().max(200),
    }),
    defineField({
      name: 'answer',
      title: 'Respuesta',
      type: 'text',
      rows: 4,
      validation: (Rule) => Rule.required().max(1000),
    }),
    defineField({
      name: 'order',
      title: 'Orden',
      description: 'Número menor aparece primero. Ej: 1, 2, 3…',
      type: 'number',
      initialValue: 99,
      validation: (Rule) => Rule.required().min(0),
    }),
  ],
  orderings: [
    {
      title: 'Orden de aparición',
      name: 'orderAsc',
      by: [{ field: 'order', direction: 'asc' }],
    },
  ],
  preview: {
    select: { title: 'question', subtitle: 'order' },
    prepare({ title, subtitle }) {
      return { title, subtitle: `Orden: ${subtitle}` };
    },
  },
});
