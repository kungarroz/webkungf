import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import react from "@astrojs/react";

import tailwind from "@astrojs/tailwind";

// https://astro.build/config
export default defineConfig({
  site: 'https://kungfundidos.com',
  integrations: [mdx(), sitemap(), react(), tailwind()],
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es', 'zh-cn'],
    routing: {
      prefixDefaultLocale: true,
      redirectToDefaultLocale: false
    }
  },
  markdown: {
    shikiConfig: {
      theme: 'dark-plus'
    }
  }
});