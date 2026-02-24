// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';
import sanity from '@sanity/astro';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: process.env.PUBLIC_SITE_URL || 'https://www.lixantech.com',
  output: 'server',
  adapter: vercel(),

  integrations: [
    react(),

    // Sitemap — only includes pages with `prerender = true` in server mode.
    // Add `export const prerender = true` to blog/caso pages once Sanity is connected.
    sitemap({
      changefreq: 'weekly',
      priority: 1.0,
      lastmod: new Date(),
    }),

    // Sanity Studio embedded at /studio
    sanity({
      projectId: 'dbxx60js',
      dataset: process.env.SANITY_DATASET || 'production',
      useCdn: false,
      apiVersion: '2024-01-01',
      studioBasePath: '/studio',
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
  },

  build: {
    inlineStylesheets: 'auto',
  },

  compressHTML: true,
});
