import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import type { FeedbackDetail, FeedbackImageRef } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// simple_feedback 组件写入的标准字段；其余字段（metadata 平铺，如 appVersion）归入 extraFields
const KNOWN_FIELDS = new Set([
  "type",
  "content",
  "source",
  "deviceId",
  "platform",
  "createdAt",
  "userId",
  "email",
  "sourceData",
  "imgs",
  "status",
  "resolvedAt",
]);

function toIso(value: unknown): string | null {
  if (value && typeof (value as { toDate?: unknown }).toDate === "function") {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return null;
}

function serializeImages(imgs: unknown): FeedbackImageRef[] {
  if (!Array.isArray(imgs)) return [];
  return imgs.map((item, index) =>
    typeof item === "string"
      ? { index, kind: "storage" as const, path: item }
      : { index, kind: "blob" as const }
  );
}

function buildDetail(id: string, data: Record<string, unknown>): FeedbackDetail {
  const extraFields: Record<string, string> = {};
  for (const [key, value] of Object.entries(data)) {
    if (KNOWN_FIELDS.has(key)) continue;
    if (value === null || value === undefined) {
      extraFields[key] = "null";
    } else if (value && typeof (value as { toDate?: unknown }).toDate === "function") {
      extraFields[key] = toIso(value) ?? "";
    } else if (typeof value === "object") {
      extraFields[key] = JSON.stringify(value);
    } else {
      extraFields[key] = String(value);
    }
  }

  return {
    id,
    type: data.type === "bug" || data.type === "suggestion" ? data.type : "other",
    content: typeof data.content === "string" ? data.content : "",
    source: typeof data.source === "string" ? data.source : "",
    deviceId: typeof data.deviceId === "string" ? data.deviceId : "",
    platform: typeof data.platform === "string" ? data.platform : "unknown",
    createdAt: toIso(data.createdAt),
    userId: typeof data.userId === "string" ? data.userId : undefined,
    email: typeof data.email === "string" ? data.email : undefined,
    status: data.status === "resolved" ? "resolved" : "open",
    resolvedAt: toIso(data.resolvedAt),
    sourceData: typeof data.sourceData === "string" ? data.sourceData : undefined,
    imgs: serializeImages(data.imgs),
    extraFields,
  };
}

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  try {
    const doc = await adminDb.collection("feedback").doc(id).get();
    if (!doc.exists) {
      return NextResponse.json({ error: "反馈不存在" }, { status: 404 });
    }
    return NextResponse.json(buildDetail(doc.id, doc.data()!));
  } catch (error) {
    console.error("[api/feedback/:id] get failed:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: `读取反馈失败：${message}` }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as { status?: unknown } | null;
  if (!body || (body.status !== "open" && body.status !== "resolved")) {
    return NextResponse.json({ error: "status 必须为 open 或 resolved" }, { status: 400 });
  }

  try {
    const update =
      body.status === "resolved"
        ? { status: "resolved", resolvedAt: FieldValue.serverTimestamp() }
        : { status: "open", resolvedAt: FieldValue.delete() };
    await adminDb.collection("feedback").doc(id).update(update);
    return NextResponse.json({ ok: true, status: body.status });
  } catch (error) {
    console.error("[api/feedback/:id] patch failed:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: `更新状态失败：${message}` }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  try {
    await adminDb.collection("feedback").doc(id).delete();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/feedback/:id] delete failed:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: `删除失败：${message}` }, { status: 500 });
  }
}
