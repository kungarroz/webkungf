// Place any global data in this file.
// You can import this data from anywhere in your site by using the `import` keyword.

import { type Multilingual } from "@/i18n";

export const SITE_TITLE: string | Multilingual = "Kungfundidos";

export const SITE_DESCRIPTION: string | Multilingual = {
  en: "Moments of China",
  es: "Momentos de China",
  "zh-cn": "中国的时刻",
};

export const X_ACCOUNT: string | Multilingual = "@kungfundidos";

export const NOT_TRANSLATED_CAUTION: string | Multilingual = {
  en: "This page is not available in your language.",
  es: "Esta página no está disponible en su idioma.",
  "zh-cn": "此页面不支持您的语言。",
};
