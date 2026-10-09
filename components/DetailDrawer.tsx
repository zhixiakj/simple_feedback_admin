"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Check,
  CheckCircle2,
  ImageOff,
  Loader2,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";
import type { FeedbackDetail } from "@/lib/types";
import { apiErrorMessage, type ApiErrorBody } from "@/lib/api-error";
import { formatDateTime } from "@/lib/format";
import { PlatformTag, StatusBadge, TypeBadge } from "@/components/badges";
import ImageLightbox from "@/components/ImageLightbox";

export default function DetailDrawer({
  id,
  onClose,
  onStatusChange,
  onDeleted,
}: {
  id: string;
  onClose: () => void;
  onStatusChange: (id: string, status: "open" | "resolved") => void;
  onDeleted: (id: string) => void;
}) {
  const t = useTranslations("detail");
  const tCommon = useTranslations("common");
  const tErr = useTranslations("errors");

  const [detail, setDetail] = useState<FeedbackDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setDetail(null);
    setError(null);
    setConfirmDelete(false);
    (async () => {
      try {
        const res = await fetch(`/api/feedback/${id}`, { cache: "no-store" });
        const data = (await res.json().catch(() => null)) as ApiErrorBody;
        if (cancelled) return;
        if (!res.ok) {
          setError(apiErrorMessage(tErr, data, res.status));
          return;
        }
        setDetail(data as FeedbackDetail);
      } catch {
        if (!cancelled) setError(tErr("network_error"));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, tErr]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !lightboxSrc) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, lightboxSrc]);

  const changeStatus = useCallback(
    async (status: "open" | "resolved") => {
      setActionBusy(true);
      try {
        const res = await fetch(`/api/feedback/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as ApiErrorBody;
          alert(apiErrorMessage(tErr, data, res.status));
          return;
        }
        setDetail((prev) => (prev ? { ...prev, status } : prev));
        onStatusChange(id, status);
      } catch {
        alert(t("actionFailed"));
      } finally {
        setActionBusy(false);
      }
    },
    [id, onStatusChange, t, tErr]
  );

  const deleteFeedback = useCallback(async () => {
    setActionBusy(true);
    try {
      const res = await fetch(`/api/feedback/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as ApiErrorBody;
        alert(apiErrorMessage(tErr, data, res.status));
        return;
      }
      onDeleted(id);
    } catch {
      alert(t("deleteFailed"));
      setActionBusy(false);
    }
  }, [id, onDeleted, t, tErr]);

  const imageUrl = (index: number) => `/api/feedback/${id}/image?index=${index}`;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-gray-900/30" onClick={onClose} />
      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-gray-200 px-5 py-3.5">
          <h2 className="text-sm font-semibold text-gray-900">{t("title")}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            aria-label={t("close")}
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          {!detail && !error && (
            <div className="flex items-center justify-center gap-2 py-24 text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">{tCommon("loading")}</span>
            </div>
          )}

          {detail && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <TypeBadge type={detail.type} />
                <StatusBadge status={detail.status} />
                <PlatformTag platform={detail.platform} />
                <span className="ml-auto text-xs tabular-nums text-gray-400">
                  {formatDateTime(detail.createdAt)}
                </span>
              </div>

              <section>
                <SectionTitle>{t("contentTitle")}</SectionTitle>
                <p className="whitespace-pre-wrap break-words rounded-lg bg-gray-50 px-4 py-3 text-sm leading-relaxed text-gray-900">
                  {detail.content || tCommon("empty")}
                </p>
              </section>

              <section className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
                <Field label={t("source")} value={detail.source} />
                <Field
                  label={t("resolvedAt")}
                  value={detail.status === "resolved" ? formatDateTime(detail.resolvedAt) : "—"}
                />
                <Field label={t("email")} value={detail.email} copyable />
                <Field label={t("userId")} value={detail.userId} copyable />
                <Field label={t("deviceId")} value={detail.deviceId} copyable mono />
                <Field label={t("docId")} value={detail.id} copyable mono />
              </section>

              {detail.sourceData && (
                <section>
                  <SectionTitle>{t("contextTitle")}</SectionTitle>
                  <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-gray-900 px-4 py-3 text-xs leading-relaxed text-gray-100">
                    {detail.sourceData}
                  </pre>
                </section>
              )}

              {Object.keys(detail.extraFields).length > 0 && (
                <section>
                  <SectionTitle>{t("extraFieldsTitle")}</SectionTitle>
                  <dl className="space-y-1.5 rounded-lg bg-gray-50 px-4 py-3 text-sm">
                    {Object.entries(detail.extraFields).map(([key, value]) => (
                      <div key={key} className="flex gap-3">
                        <dt className="w-28 shrink-0 text-gray-500">{key}</dt>
                        <dd className="min-w-0 break-all text-gray-900">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              )}

              <section>
                <SectionTitle>
                  {t("imagesTitle")}
                  {detail.imgs.length > 0 && (
                    <span className="ml-1 text-gray-400">{t("imageCount", { count: detail.imgs.length })}</span>
                  )}
                </SectionTitle>
                {detail.imgs.length === 0 ? (
                  <div className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-gray-200 py-8 text-sm text-gray-400">
                    <ImageOff className="h-4 w-4" />
                    {t("noImages")}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {detail.imgs.map((img) => (
                      <button
                        key={img.index}
                        type="button"
                        onClick={() => setLightboxSrc(imageUrl(img.index))}
                        className="group aspect-square overflow-hidden rounded-lg ring-1 ring-gray-200"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={imageUrl(img.index)}
                          alt={t("imageAlt", { index: img.index + 1 })}
                          loading="lazy"
                          className="h-full w-full object-cover transition group-hover:brightness-90"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}
        </div>

        {detail && (
          <footer className="flex items-center gap-2 border-t border-gray-200 px-5 py-3">
            {detail.status === "open" ? (
              <button
                type="button"
                disabled={actionBusy}
                onClick={() => changeStatus("resolved")}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
                {t("markResolved")}
              </button>
            ) : (
              <button
                type="button"
                disabled={actionBusy}
                onClick={() => changeStatus("open")}
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-amber-600 disabled:opacity-50"
              >
                <RotateCcw className="h-4 w-4" />
                {t("reopen")}
              </button>
            )}

            <div className="ml-auto">
              {confirmDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{t("confirmHint")}</span>
                  <button
                    type="button"
                    disabled={actionBusy}
                    onClick={deleteFeedback}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
                  >
                    {actionBusy ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    {t("confirmDelete")}
                  </button>
                  <button
                    type="button"
                    disabled={actionBusy}
                    onClick={() => setConfirmDelete(false)}
                    className="rounded-lg px-2.5 py-2 text-sm text-gray-500 hover:bg-gray-100"
                  >
                    {t("cancel")}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-red-600 transition hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                  {t("delete")}
                </button>
              )}
            </div>
          </footer>
        )}
      </aside>

      <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
    </>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-2 text-xs font-semibold tracking-wide text-gray-400">{children}</h3>;
}

function Field({
  label,
  value,
  copyable = false,
  mono = false,
}: {
  label: string;
  value?: string;
  copyable?: boolean;
  mono?: boolean;
}) {
  const tCommon = useTranslations("common");

  return (
    <div className="min-w-0">
      <dt className="text-xs text-gray-400">{label}</dt>
      <dd className="mt-0.5 flex items-center gap-1">
        <span
          className={`min-w-0 truncate text-gray-900 ${mono ? "font-mono text-xs" : ""}`}
          title={value ?? ""}
        >
          {value || "—"}
        </span>
        {copyable && value && (
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(value).catch(() => {})}
            className="shrink-0 rounded px-1 text-xs text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            title={tCommon("copy")}
          >
            {tCommon("copy")}
          </button>
        )}
      </dd>
    </div>
  );
}
