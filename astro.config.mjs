import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'webfinal-theta.vercel.app',
  integrations: [mdx(), sitemap()],
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es', 'zh-cn'],
    routing: {
      prefixDefaultLocale: true,
      redirectToDefaultLocale: false,
    },
  },
  markdown: {
    shikiConfig: {
      theme: 'red',
    },
  },
});
