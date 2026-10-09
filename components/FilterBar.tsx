"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Search, X } from "lucide-react";
import { PLATFORM_LABELS, TYPE_KEYS } from "@/lib/types";

export interface FilterState {
  type: string;
  platform: string;
  status: string;
  q: string;
}

export default function FilterBar({
  filters,
  onChange,
}: {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}) {
  const t = useTranslations("filters");
  const tTypes = useTranslations("types");
  const tBadges = useTranslations("badges");

  // 关键词本地防抖，停止输入 400ms 后才上抛触发请求
  const [qInput, setQInput] = useState(filters.q);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setQInput(filters.q);
  }, [filters.q]);

  function handleQChange(value: string) {
    setQInput(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onChange({ ...filters, q: value });
    }, 400);
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const hasActiveFilter = filters.type || filters.platform || filters.status || filters.q;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={qInput}
          onChange={(e) => handleQChange(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="w-64 rounded-lg border border-gray-300 bg-white py-1.5 pl-8 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />
      </div>

      <Select
        value={filters.type}
        onChange={(v) => onChange({ ...filters, type: v })}
        placeholder={t("allTypes")}
        options={TYPE_KEYS.map((key) => [key, tTypes(key)] as [string, string])}
      />
      <Select
        value={filters.platform}
        onChange={(v) => onChange({ ...filters, platform: v })}
        placeholder={t("allPlatforms")}
        options={Object.entries(PLATFORM_LABELS)}
      />
      <Select
        value={filters.status}
        onChange={(v) => onChange({ ...filters, status: v })}
        placeholder={t("allStatuses")}
        options={[
          ["open", tBadges("open")],
          ["resolved", tBadges("resolved")],
        ]}
      />

      {hasActiveFilter && (
        <button
          type="button"
          onClick={() => onChange({ type: "", platform: "", status: "", q: "" })}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
        >
          <X className="h-4 w-4" />
          {t("clear")}
        </button>
      )}
    </div>
  );
}

function Select({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: [string, string][];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`rounded-lg border bg-white py-1.5 pl-2.5 pr-8 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 ${
        value ? "border-indigo-400 text-indigo-700" : "border-gray-300 text-gray-600"
      }`}
    >
      <option value="">{placeholder}</option>
      {options.map(([key, label]) => (
        <option key={key} value={key}>
          {label}
        </option>
      ))}
    </select>
  );
}
