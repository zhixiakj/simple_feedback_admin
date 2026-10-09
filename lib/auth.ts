// Session cookie 签发与验证（HMAC-SHA256，Web Crypto 实现，Edge / Node 均可用）

export const SESSION_COOKIE = "sfa_session";
export const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 天

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is not set. Add it to .env.local (see .env.example).");
  }
  return secret;
}

async function hmac(value: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function createSessionValue(now = Date.now()): Promise<string> {
  const exp = now + SESSION_TTL_SECONDS * 1000;
  const sig = await hmac(String(exp), getSecret());
  return `${exp}.${sig}`;
}

export async function verifySessionValue(value: string | undefined | null): Promise<boolean> {
  if (!value) return false;
  const dot = value.indexOf(".");
  if (dot <= 0) return false;
  const expStr = value.slice(0, dot);
  const sig = value.slice(dot + 1);
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  const expected = await hmac(expStr, getSecret());
  if (expected.length !== sig.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  }
  return mismatch === 0;
}
