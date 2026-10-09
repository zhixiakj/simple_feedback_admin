export type FeedbackType = "bug" | "suggestion" | "other";
export type FeedbackStatus = "open" | "resolved";

/** 列表条目（不含 imgs 等大字段） */
export interface FeedbackListItem {
  id: string;
  type: FeedbackType;
  content: string;
  source: string;
  deviceId: string;
  platform: string;
  createdAt: string | null; // ISO
  userId?: string;
  email?: string;
  status: FeedbackStatus;
  resolvedAt: string | null; // ISO
}

/** 详情里的图片引用，内容按需通过 /api/feedback/[id]/image?index=n 加载 */
export interface FeedbackImageRef {
  index: number;
  kind: "blob" | "storage";
  path?: string;
}

export interface FeedbackDetail extends FeedbackListItem {
  sourceData?: string;
  imgs: FeedbackImageRef[];
  /** metadata 平铺进文档的非标准字段（如 appVersion），序列化为字符串 */
  extraFields: Record<string, string>;
}

export interface FeedbackStats {
  scanned: number;
  todayCount: number;
  pendingCount: number;
  byType: Record<string, number>;
  byPlatform: Record<string, number>;
}

export interface FeedbackListResponse {
  items: FeedbackListItem[];
  total: number;
  page: number;
  pageSize: number;
  stats: FeedbackStats;
}

export const TYPE_LABELS: Record<string, string> = {
  bug: "Bug",
  suggestion: "建议",
  other: "其他",
};

export const PLATFORM_LABELS: Record<string, string> = {
  ios: "iOS",
  android: "Android",
  macos: "macOS",
  windows: "Windows",
  linux: "Linux",
  web: "Web",
};
