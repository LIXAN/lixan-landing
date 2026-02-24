import { defineField, defineType } from 'sanity';

/**
 * Singleton document for global site configuration.
 * Only one instance should exist — enforce this via access control
 * or by using a fixed document ID in your GROQ queries: *[_id == "siteConfig"][0]
 */
export const siteConfigSchema = defineType({
  name: 'siteConfig',
  title: 'Site Configuration',
  type: 'document',
  fields: [
    defineField({
      name: 'siteName',
      title: 'Site Name',
      type: 'string',
      initialValue: 'Lixan',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'tagline',
      title: 'Tagline',
      description: 'Short tagline shown in meta description and hero.',
      type: 'string',
      validation: (Rule) => Rule.required().max(160),
    }),
    defineField({
      name: 'email',
      title: 'Contact Email',
      type: 'string',
      validation: (Rule) => Rule.required().email(),
    }),
    defineField({
      name: 'phone',
      title: 'Phone Number',
      description: 'International format, e.g. +1 (555) 000-0000',
      type: 'string',
    }),
    defineField({
      name: 'whatsapp',
      title: 'WhatsApp Number',
      description: 'Number only, no spaces or symbols, e.g. 15550000000',
      type: 'string',
    }),
    defineField({
      name: 'linkedin',
      title: 'LinkedIn URL',
      type: 'url',
    }),
    defineField({
      name: 'instagram',
      title: 'Instagram URL',
      type: 'url',
    }),
    defineField({
      name: 'twitter',
      title: 'Twitter / X URL',
      type: 'url',
    }),
    defineField({
      name: 'logoLight',
      title: 'Logo (Light / Dark Backgrounds)',
      type: 'image',
      options: { hotspot: false },
    }),
    defineField({
      name: 'ogImage',
      title: 'Default OG Image',
      description: 'Used when pages do not specify their own Open Graph image.',
      type: 'image',
      options: { hotspot: false },
    }),
  ],
  preview: {
    select: { title: 'siteName', subtitle: 'tagline' },
  },
});
