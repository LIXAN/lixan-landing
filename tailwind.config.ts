/**
 * tailwind.config.ts
 *
 * NOTE: This project uses Tailwind CSS v4, which is primarily configured via
 * CSS using @theme in src/styles/global.css. This file is kept for reference
 * and IDE tooling purposes. Plugin configuration (e.g. @tailwindcss/typography)
 * would be added here.
 *
 * In Tailwind v4, content paths are auto-detected – no explicit `content`
 * array is required.
 */
import type { Config } from 'tailwindcss';

const config: Config = {
  // Content is auto-detected in Tailwind v4, but you can add explicit paths:
  content: [
    './src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}',
    './sanity/**/*.{ts,tsx}',
  ],
  // Theme extensions are handled via @theme in global.css (Tailwind v4 approach).
  // Use this object for plugin-specific config if needed.
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
