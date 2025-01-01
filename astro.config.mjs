import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://webfinal-git-main-arrozibericos-projects.vercel.app',
  integrations: [mdx(), sitemap(), image()],
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
      theme: 'dark-plus',
    },
  },
});
