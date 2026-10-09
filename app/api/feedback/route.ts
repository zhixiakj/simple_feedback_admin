import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import type { FeedbackListItem, FeedbackListResponse } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 为支持任意关键词子串搜索并绕开复合索引限制，
// 一次拉取最近 SCAN_LIMIT 条（投影排除 imgs 大字段）在内存中筛选/统计。
const SCAN_LIMIT = 1000;
const SCAN_FIELDS = [
  "type",
  "content",
  "source",
  "deviceId",
  "platform",
  "createdAt",
  "userId",
  "email",
  "status",
  "resolvedAt",
];

function toIso(value: unknown): string | null {
  if (value && typeof (value as { toDate?: unknown }).toDate === "function") {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return null;
}

function countBy(rows: FeedbackListItem[], pick: (row: FeedbackListItem) => string) {
  const result: Record<string, number> = {};
  for (const row of rows) {
    const key = pick(row);
    result[key] = (result[key] ?? 0) + 1;
  }
  return result;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") ?? "";
    const platform = searchParams.get("platform") ?? "";
    const status = searchParams.get("status") ?? "";
    const q = (searchParams.get("q") ?? "").trim().toLowerCase();
    const page = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1);
    const pageSize = Math.min(
      100,
      Math.max(1, Number.parseInt(searchParams.get("pageSize") ?? "20", 10) || 20)
    );

    const snapshot = await adminDb
      .collection("feedback")
      .orderBy("createdAt", "desc")
      .limit(SCAN_LIMIT)
      .select(...SCAN_FIELDS)
      .get();

    const rows: FeedbackListItem[] = snapshot.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        type: d.type === "bug" || d.type === "suggestion" ? d.type : "other",
        content: typeof d.content === "string" ? d.content : "",
        source: typeof d.source === "string" ? d.source : "",
        deviceId: typeof d.deviceId === "string" ? d.deviceId : "",
        platform: typeof d.platform === "string" ? d.platform : "unknown",
        createdAt: toIso(d.createdAt),
        userId: typeof d.userId === "string" ? d.userId : undefined,
        email: typeof d.email === "string" ? d.email : undefined,
        status: d.status === "resolved" ? "resolved" : "open",
        resolvedAt: toIso(d.resolvedAt),
      };
    });

    // 统计基于筛选前的全量扫描结果
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const stats = {
      scanned: rows.length,
      todayCount: rows.filter((r) => r.createdAt && new Date(r.createdAt) >= startOfDay).length,
      pendingCount: rows.filter((r) => r.status === "open").length,
      byType: countBy(rows, (r) => r.type),
      byPlatform: countBy(rows, (r) => r.platform),
    };

    let filtered = rows;
    if (type) filtered = filtered.filter((r) => r.type === type);
    if (platform) filtered = filtered.filter((r) => r.platform === platform);
    if (status === "open" || status === "resolved") {
      filtered = filtered.filter((r) => r.status === status);
    }
    if (q) {
      filtered = filtered.filter((r) =>
        [r.content, r.email, r.userId, r.deviceId, r.source].some(
          (v) => v && v.toLowerCase().includes(q)
        )
      );
    }

    const payload: FeedbackListResponse = {
      items: filtered.slice((page - 1) * pageSize, page * pageSize),
      total: filtered.length,
      page,
      pageSize,
      stats,
    };
    return NextResponse.json(payload);
  } catch (error) {
    console.error("[api/feedback] list failed:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: "read_failed", detail: message }, { status: 500 });
  }
}
