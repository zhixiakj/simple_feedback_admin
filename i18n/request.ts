import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";
import { LOCALE_COOKIE, defaultLocale, locales, type Locale } from "./config";

/** locale 决策顺序：NEXT_LOCALE cookie（用户手动切换过）→ Accept-Language（zh* → zh，其余 → en）→ 兜底中文 */
async function resolveLocale(): Promise<Locale> {
  const store = await cookies();
  const saved = store.get(LOCALE_COOKIE)?.value;
  if ((locales as readonly string[]).includes(saved ?? "")) {
    return saved as Locale;
  }

  const acceptLanguage = (await headers()).get("accept-language") ?? "";
  const primary = acceptLanguage.split(",")[0]?.trim().toLowerCase() ?? "";
  if (primary.startsWith("zh")) return "zh";
  if (primary.length > 0) return "en";
  return defaultLocale;
}

export default getRequestConfig(async () => {
  const locale = await resolveLocale();
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
