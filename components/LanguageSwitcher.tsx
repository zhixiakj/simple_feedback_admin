"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { LOCALE_COOKIE, locales } from "@/i18n/config";

/** 语言切换：写入 NEXT_LOCALE cookie 后 router.refresh()，保留页面内筛选/页码状态 */
export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("common");

  function switchTo(next: string) {
    if (next === locale) return;
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }

  return (
    <div
      className="inline-flex items-center overflow-hidden rounded-lg text-xs font-medium ring-1 ring-gray-200"
      title={t("language")}
    >
      {locales.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => switchTo(l)}
          className={`px-2 py-1 transition ${
            l === locale
              ? "bg-indigo-50 text-indigo-700"
              : "bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700"
          }`}
        >
          {l === "zh" ? "中" : "EN"}
        </button>
      ))}
    </div>
  );
}
