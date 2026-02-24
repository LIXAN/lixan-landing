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
  homePageSchema,
  faqSchema,
} from './sanity/schemas';

// These values are public (used in astro.config.mjs as well)
const projectId = 'dbxx60js';
const dataset   = 'production';

export default defineConfig({
  name:  'lixan-studio',
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
              .title('Configuración del sitio')
              .id('siteConfig')
              .child(
                S.document()
                  .schemaType('siteConfig')
                  .documentId('siteConfig')
              ),

            // Singleton: Home Page content
            S.listItem()
              .title('Página Principal (Hero + Proceso)')
              .id('homePage')
              .child(
                S.document()
                  .schemaType('homePage')
                  .documentId('homePage')
              ),

            S.divider(),

            // Regular document types
            S.listItem().title('Blog Posts').schemaType('post').child(S.documentTypeList('post')),
            S.listItem().title('Casos de Estudio').schemaType('caseStudy').child(S.documentTypeList('caseStudy')),
            S.listItem().title('Servicios').schemaType('service').child(S.documentTypeList('service')),
            S.listItem().title('Testimonios').schemaType('testimonial').child(S.documentTypeList('testimonial')),
            S.listItem().title('Preguntas Frecuentes').schemaType('faq').child(S.documentTypeList('faq')),

            S.divider(),

            S.listItem().title('Prospectos').schemaType('lead').child(S.documentTypeList('lead')),
          ]),
    }),
    visionTool(),
  ],

  schema: {
    types: [
      postSchema,
      caseStudySchema,
      serviceSchema,
      testimonialSchema,
      siteConfigSchema,
      leadSchema,
      homePageSchema,
      faqSchema,
    ],
  },
});
