import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { SESSION_COOKIE, SESSION_TTL_SECONDS, createSessionValue } from "@/lib/auth";

export const runtime = "nodejs";

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) {
    // 比较一次自身，避免因长度不同造成明显的时间差
    timingSafeEqual(bufA, bufA);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

export async function POST(request: Request) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return NextResponse.json(
      { error: "ADMIN_PASSWORD 未配置，请在 .env.local 中设置后重启" },
      { status: 500 }
    );
  }

  const body = (await request.json().catch(() => null)) as { password?: unknown } | null;
  if (!body || typeof body.password !== "string" || !safeEqual(body.password, expected)) {
    return NextResponse.json({ error: "密码错误" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, await createSessionValue(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  return response;
}
