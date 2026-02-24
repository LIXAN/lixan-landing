import { defineField, defineType } from 'sanity';

/**
 * Singleton document for the home page editable content.
 * Only one instance should exist — use fixed _id "homePage" in queries.
 * Covers: Hero section + HowItWorks section.
 */
export const homePageSchema = defineType({
  name: 'homePage',
  title: 'Página Principal',
  type: 'document',
  groups: [
    { name: 'hero',    title: 'Hero' },
    { name: 'process', title: 'Cómo trabajamos' },
  ],
  fields: [
    // ── Hero ──────────────────────────────────────────────────
    defineField({
      name: 'heroHeadline',
      title: 'Titular (línea 1)',
      description: 'Primera línea del titular grande. Ej: "Haz que tu negocio"',
      type: 'string',
      group: 'hero',
      initialValue: 'Haz que tu negocio',
      validation: (Rule) => Rule.required().max(80),
    }),
    defineField({
      name: 'heroAccent',
      title: 'Titular (línea 2 — texto con color)',
      description: 'Segunda línea en degradado violeta. Ej: "trabaje solo"',
      type: 'string',
      group: 'hero',
      initialValue: 'trabaje solo',
      validation: (Rule) => Rule.required().max(60),
    }),
    defineField({
      name: 'heroSubtitle',
      title: 'Subtítulo del Hero',
      description: 'Párrafo descriptivo debajo del titular.',
      type: 'text',
      rows: 3,
      group: 'hero',
      initialValue:
        'Construimos automatizaciones y sitios web que capturan leads y procesan tareas sin que intervenga nadie. Cosas concretas, bien hechas, que se entregan.',
      validation: (Rule) => Rule.required().max(300),
    }),
    defineField({
      name: 'heroCta1',
      title: 'Botón primario (texto)',
      description: 'Ej: "Cuéntanos tu proyecto →"',
      type: 'string',
      group: 'hero',
      initialValue: 'Cuéntanos tu proyecto →',
      validation: (Rule) => Rule.required().max(60),
    }),
    defineField({
      name: 'heroCta2',
      title: 'Botón secundario (texto)',
      description: 'Ej: "Ver proyectos"',
      type: 'string',
      group: 'hero',
      initialValue: 'Ver proyectos',
      validation: (Rule) => Rule.max(60),
    }),

    // ── HowItWorks ────────────────────────────────────────────
    defineField({
      name: 'processSteps',
      title: 'Pasos del proceso',
      description: 'Los 4 pasos de "Cómo trabajamos". Arrastra para reordenar.',
      type: 'array',
      group: 'process',
      of: [
        {
          type: 'object',
          name: 'step',
          title: 'Paso',
          fields: [
            defineField({
              name: 'number',
              title: 'Número',
              description: 'Ej: 01, 02, 03…',
              type: 'string',
              validation: (Rule) => Rule.required().max(4),
            }),
            defineField({
              name: 'icon',
              title: 'Ícono (emoji)',
              description: 'Un emoji representativo. Ej: 🎯',
              type: 'string',
              validation: (Rule) => Rule.required().max(4),
            }),
            defineField({
              name: 'title',
              title: 'Título del paso',
              type: 'string',
              validation: (Rule) => Rule.required().max(60),
            }),
            defineField({
              name: 'description',
              title: 'Descripción',
              type: 'text',
              rows: 3,
              validation: (Rule) => Rule.required().max(400),
            }),
          ],
          preview: {
            select: { title: 'title', subtitle: 'number', media: 'icon' },
            prepare({ title, subtitle }) {
              return { title: `${subtitle}. ${title}` };
            },
          },
        },
      ],
      validation: (Rule) => Rule.required().min(1).max(6),
    }),
  ],
  preview: {
    prepare() {
      return { title: 'Página Principal' };
    },
  },
});
