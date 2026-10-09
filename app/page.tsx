"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, LogOut, RefreshCw, TriangleAlert } from "lucide-react";
import type { FeedbackListResponse } from "@/lib/types";
import { apiErrorMessage, type ApiErrorBody } from "@/lib/api-error";
import StatsCards from "@/components/StatsCards";
import FilterBar, { type FilterState } from "@/components/FilterBar";
import FeedbackTable from "@/components/FeedbackTable";
import DetailDrawer from "@/components/DetailDrawer";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function HomePage() {
  const router = useRouter();
  const t = useTranslations("home");
  const tCommon = useTranslations("common");
  const tErr = useTranslations("errors");
  const [data, setData] = useState<FeedbackListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({ type: "", platform: "", status: "", q: "" });
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const reqIdRef = useRef(0);

  const load = useCallback(async () => {
    const reqId = ++reqIdRef.current;
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ page: String(page), pageSize: "20" });
    if (filters.type) params.set("type", filters.type);
    if (filters.platform) params.set("platform", filters.platform);
    if (filters.status) params.set("status", filters.status);
    if (filters.q) params.set("q", filters.q);
    try {
      const res = await fetch(`/api/feedback?${params.toString()}`, { cache: "no-store" });
      if (res.status === 401) {
        router.replace("/login");
        return;
      }
      const json = (await res.json().catch(() => null)) as ApiErrorBody;
      if (!res.ok) {
        if (reqId !== reqIdRef.current) return;
        setError(apiErrorMessage(tErr, json, res.status));
        return;
      }
      if (reqId !== reqIdRef.current) return;
      setData(json as FeedbackListResponse);
    } catch {
      if (reqId !== reqIdRef.current) return;
      setError(tErr("network_error"));
    } finally {
      if (reqId === reqIdRef.current) setLoading(false);
    }
  }, [filters, page, router, tErr]);

  useEffect(() => {
    load();
  }, [load]);

  function handleFilterChange(next: FilterState) {
    setFilters(next);
    setPage(1); // 筛选变化后回到第一页
  }

  function handleStatusChange(_id: string, _status: "open" | "resolved") {
    load(); // 刷新列表里的状态与统计
  }

  function handleDeleted(id: string) {
    setSelectedId(null);
    load();
    void id;
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    router.replace("/login");
    router.refresh();
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <main className="mx-auto max-w-7xl px-6 py-6">
      <header className="mb-5 flex items-center gap-3">
        <h1 className="text-xl font-semibold">{tCommon("appTitle")}</h1>
        <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">
          Firestore: feedback
        </span>
        {data && (
          <span className="text-xs text-gray-400" title={t("basedOnTitle")}>
            {t("basedOn", { count: data.stats.scanned })}
          </span>
        )}
        <div className="ml-auto flex items-center gap-1">
          <LanguageSwitcher />
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
            title={tCommon("refresh")}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            {tCommon("refresh")}
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <LogOut className="h-4 w-4" />
            {tCommon("logout")}
          </button>
        </div>
      </header>

      <div className="space-y-4">
        <StatsCards stats={data?.stats ?? null} />

        {error && (
          <div className="flex items-start gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-medium">{t("loadFailed")}</p>
              <p className="mt-0.5 break-all">{error}</p>
              <p className="mt-1 text-xs text-red-600/80">{t("credHint")}</p>
            </div>
          </div>
        )}

        <FilterBar filters={filters} onChange={handleFilterChange} />

        {!error && (
          <FeedbackTable
            items={data?.items ?? []}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        )}

        {data && data.total > 0 && (
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>{t("paginationSummary", { total: data.total, page: data.page, totalPages })}</span>
            <div className="flex items-center gap-1">
              <PaginationButton disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
                {t("prevPage")}
              </PaginationButton>
              <PaginationButton
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => p + 1)}
              >
                {t("nextPage")}
                <ChevronRight className="h-4 w-4" />
              </PaginationButton>
            </div>
          </div>
        )}
      </div>

      {selectedId && (
        <DetailDrawer
          id={selectedId}
          onClose={() => setSelectedId(null)}
          onStatusChange={handleStatusChange}
          onDeleted={handleDeleted}
        />
      )}
    </main>
  );
}

function PaginationButton({
  disabled,
  onClick,
  children,
}: {
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1.5 ring-1 ring-gray-200 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}
