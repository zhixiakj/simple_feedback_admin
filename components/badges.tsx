"use client";

import { useTranslations } from "next-intl";
import { PLATFORM_LABELS } from "@/lib/types";

export function TypeBadge({ type }: { type: string }) {
  const t = useTranslations("types");
  const label = t.has(type) ? t(type) : type;
  const styles: Record<string, string> = {
    bug: "bg-red-50 text-red-700 ring-red-200",
    suggestion: "bg-blue-50 text-blue-700 ring-blue-200",
    other: "bg-gray-100 text-gray-600 ring-gray-200",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
        styles[type] ?? styles.other
      }`}
    >
      {label}
    </span>
  );
}

export function StatusBadge({ status }: { status: "open" | "resolved" }) {
  const t = useTranslations("badges");
  return status === "open" ? (
    <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-200">
      {t("open")}
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
      {t("resolved")}
    </span>
  );
}

export function PlatformTag({ platform }: { platform: string }) {
  return (
    <span className="inline-flex items-center rounded-md bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">
      {PLATFORM_LABELS[platform] ?? platform}
    </span>
  );
}
