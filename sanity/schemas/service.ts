import { defineField, defineType } from 'sanity';

export const serviceSchema = defineType({
  name: 'service',
  title: 'Service',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Service Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'name', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'shortDescription',
      title: 'Short Description',
      description: 'Used in cards and sections (max 120 chars).',
      type: 'string',
      validation: (Rule) => Rule.required().max(120),
    }),
    defineField({
      name: 'fullDescription',
      title: 'Full Description',
      type: 'text',
      rows: 5,
    }),
    defineField({
      name: 'icon',
      title: 'Icon Name',
      description: 'Name of the icon (e.g. "bolt", "chart", "code") — mapped to SVG icons in the frontend.',
      type: 'string',
      options: {
        list: [
          { title: 'Automation / Bolt', value: 'bolt' },
          { title: 'Web Design / Globe', value: 'globe' },
          { title: 'Analytics / Chart', value: 'chart' },
          { title: 'Integrations / Puzzle', value: 'puzzle' },
          { title: 'AI / Sparkles', value: 'sparkles' },
          { title: 'Email / Envelope', value: 'envelope' },
          { title: 'Code / Terminal', value: 'terminal' },
          { title: 'Rocket', value: 'rocket' },
        ],
      },
    }),
    defineField({
      name: 'features',
      title: 'Key Features',
      description: 'Bullet points shown in the service detail (max 8).',
      type: 'array',
      of: [{ type: 'string' }],
      validation: (Rule) => Rule.max(8),
    }),
    defineField({
      name: 'order',
      title: 'Display Order',
      description: 'Lower numbers appear first.',
      type: 'number',
      initialValue: 0,
    }),
    defineField({
      name: 'highlighted',
      title: 'Highlighted (Most Popular)',
      type: 'boolean',
      initialValue: false,
    }),
  ],
  orderings: [
    {
      title: 'Display Order',
      name: 'orderAsc',
      by: [{ field: 'order', direction: 'asc' }],
    },
  ],
  preview: {
    select: { title: 'name', subtitle: 'shortDescription' },
  },
});
