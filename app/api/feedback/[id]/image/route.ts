import { NextRequest, NextResponse } from "next/server";
import { adminApp, adminDb, getStorageBucketName } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sniffImageType(bytes: Uint8Array): string {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 4 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "image/png";
  }
  if (bytes.length >= 3 && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
    return "image/gif";
  }
  if (
    bytes.length >= 12 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }
  return "application/octet-stream";
}

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const index = Number.parseInt(new URL(request.url).searchParams.get("index") ?? "0", 10) || 0;

  try {
    const doc = await adminDb.collection("feedback").doc(id).get();
    if (!doc.exists) {
      return new NextResponse("反馈不存在", { status: 404 });
    }
    const imgs = doc.data()?.imgs;
    if (!Array.isArray(imgs) || index < 0 || index >= imgs.length) {
      return new NextResponse("图片不存在", { status: 404 });
    }

    const item = imgs[index];
    let bytes: Uint8Array;
    if (typeof item === "string") {
      // Storage 模式：imgs 存的是 Cloud Storage 路径
      const bucketName = getStorageBucketName();
      if (!bucketName) {
        return new NextResponse(
          "无法确定 Storage bucket：请在环境变量中配置 FIREBASE_STORAGE_BUCKET",
          { status: 500 }
        );
      }
      const [buffer] = await adminApp.storage().bucket(bucketName).file(item).download();
      bytes = new Uint8Array(buffer);
    } else {
      // 默认模式： imgs 存的是内嵌 Blob
      bytes = new Uint8Array(item as Uint8Array);
    }

    // 拷贝为纯 ArrayBuffer，避免 TS 的 Uint8Array<ArrayBufferLike> 与 BodyInit 不兼容
    const body = new ArrayBuffer(bytes.byteLength);
    new Uint8Array(body).set(bytes);
    return new NextResponse(body, {
      headers: {
        "Content-Type": sniffImageType(bytes),
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("[api/feedback/:id/image] failed:", error);
    const message = error instanceof Error ? error.message : String(error);
    return new NextResponse(`加载图片失败：${message}`, { status: 500 });
  }
}
