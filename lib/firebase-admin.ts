import * as admin from "firebase-admin";
import fs from "fs";
import path from "path";

// 缓存原始 service account JSON，用于推导默认 Storage bucket（project_id.appspot.com）
let cachedServiceAccount: Record<string, unknown> | null = null;

function loadServiceAccount(): Record<string, unknown> | null {
  // 1) FIREBASE_SERVICE_ACCOUNT：JSON 字符串或文件路径（部署到 Vercel 等平台时推荐用 JSON 字符串）
  const env = process.env.FIREBASE_SERVICE_ACCOUNT?.trim();
  if (env) {
    if (env.startsWith("{")) {
      return JSON.parse(env);
    }
    const envPath = path.resolve(env);
    if (fs.existsSync(envPath)) {
      return JSON.parse(fs.readFileSync(envPath, "utf8"));
    }
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT is set but is neither a JSON string nor an existing file path."
    );
  }

  // 2) 项目根目录的 firebase-adminsdk.json
  const rootPath = path.resolve(process.cwd(), "firebase-adminsdk.json");
  if (fs.existsSync(rootPath)) {
    return JSON.parse(fs.readFileSync(rootPath, "utf8"));
  }

  return null;
}

function initFirebaseAdmin(): admin.app.App {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const serviceAccount = loadServiceAccount();
  if (serviceAccount) {
    cachedServiceAccount = serviceAccount;
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    });
  }

  // 3) 回退到 Application Default Credentials（如 GOOGLE_APPLICATION_CREDENTIALS）
  console.warn(
    "[firebase-admin] No service account found: set FIREBASE_SERVICE_ACCOUNT or place " +
      "firebase-adminsdk.json at the project root. Falling back to default credentials."
  );
  return admin.initializeApp();
}

export const adminApp = initFirebaseAdmin();
export const adminDb = admin.firestore(adminApp);

export function getStorageBucketName(): string {
  if (process.env.FIREBASE_STORAGE_BUCKET) {
    return process.env.FIREBASE_STORAGE_BUCKET;
  }
  const projectId =
    (cachedServiceAccount?.project_id as string | undefined) ??
    (cachedServiceAccount?.projectId as string | undefined);
  return projectId ? `${projectId}.appspot.com` : "";
}
