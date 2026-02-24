import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';

import {
  postSchema,
  caseStudySchema,
  serviceSchema,
  testimonialSchema,
  siteConfigSchema,
  leadSchema,
} from './schemas';

// Read from environment variables (must be set in .env)
const projectId = process.env.SANITY_PROJECT_ID ?? '';
const dataset = process.env.SANITY_DATASET ?? 'production';

export default defineConfig({
  name: 'lixan-studio',
  title: 'Lixan Studio',

  projectId,
  dataset,

  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Content')
          .items([
            // Singleton: Site Config
            S.listItem()
              .title('Site Configuration')
              .id('siteConfig')
              .child(
                S.document()
                  .schemaType('siteConfig')
                  .documentId('siteConfig')
              ),

            S.divider(),

            // Regular document types
            S.listItem().title('Blog Posts').schemaType('post').child(S.documentTypeList('post')),
            S.listItem().title('Case Studies').schemaType('caseStudy').child(S.documentTypeList('caseStudy')),
            S.listItem().title('Services').schemaType('service').child(S.documentTypeList('service')),
            S.listItem().title('Testimonials').schemaType('testimonial').child(S.documentTypeList('testimonial')),

            S.divider(),

            S.listItem().title('Prospectos (Chat)').schemaType('lead').child(S.documentTypeList('lead')),
          ]),
    }),
    // GROQ query playground — remove in production if desired
    visionTool(),
  ],

  schema: {
    types: [postSchema, caseStudySchema, serviceSchema, testimonialSchema, siteConfigSchema, leadSchema],
  },
});
