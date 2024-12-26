// Place any global data in this file.
// You can import this data from anywhere in your site by using the `import` keyword.

import { type Multilingual } from "@/i18n";

export const SITE_TITLE: string | Multilingual = "Astro i18n Starter";

export const SITE_DESCRIPTION: string | Multilingual = {
  en: "A starter template for Astro with i18n support.",
  es: "street photo",
  "zh-cn": "具有 i18n 支持的 Astro 入门模板。",
};

export const X_ACCOUNT: string | Multilingual = "@psephopaiktes";

export const NOT_TRANSLATED_CAUTION: string | Multilingual = {
  en: "This page is not available in your language.",
  es: "no en tu idioma",
  "zh-cn": "此页面不支持您的语言。",
};
