/** API 错误响应载荷：error 为错误码，detail 为底层异常原文（可为空） */
export type ApiErrorBody = { error?: unknown; detail?: unknown } | null;

const KNOWN_ERROR_CODES = new Set([
  "unauthorized",
  "invalid_password",
  "admin_password_missing",
  "not_found",
  "read_failed",
  "update_failed",
  "delete_failed",
  "invalid_status",
  "network_error",
]);

/**
 * 把 API 错误响应转成用户可读文案：
 * 已知错误码走 errors 命名空间翻译，未知错误码/裸消息原样展示，末尾附带服务端 detail。
 */
export function apiErrorMessage(
  t: (code: string) => string,
  body: ApiErrorBody,
  status: number
): string {
  const code = typeof body?.error === "string" ? body.error : "";
  const detail = typeof body?.detail === "string" ? body.detail.trim() : "";
  const base = KNOWN_ERROR_CODES.has(code)
    ? t(code)
    : code || (detail ? "" : `HTTP ${status}`);
  return detail ? `${base} · ${detail}` : base;
}
