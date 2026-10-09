import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionValue } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const session = request.cookies.get(SESSION_COOKIE)?.value;
  if (await verifySessionValue(session)) {
    return NextResponse.next();
  }

  if (request.nextUrl.pathname.startsWith("/api")) {
    return NextResponse.json({ error: "未登录或会话已过期" }, { status: 401 });
  }

  const loginUrl = new URL("/login", request.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // 排除：Next 静态资源、favicon、登录页、登录 API
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|login|api/auth/login).*)"],
};
