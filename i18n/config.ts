/** 客户端/服务端共用的 locale 常量（不含 next/headers 依赖，可安全在客户端引用） */
export const LOCALE_COOKIE = "NEXT_LOCALE";
export const locales = ["zh", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "zh";
