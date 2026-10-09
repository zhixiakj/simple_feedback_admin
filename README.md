# simple_feedback_admin

[simple_feedback](../simple_feedback) Flutter 组件的用户反馈管理后台。读取 Firestore `feedback` collection，支持查看、筛选、搜索、标记处理状态、删除反馈和图片预览。

技术栈：Next.js (App Router) + React + Tailwind CSS + firebase-admin（Admin SDK 绕过客户端只写规则，可读可写）。

## 功能

- 🔐 密码登录（`ADMIN_PASSWORD`），middleware 保护所有页面与 API
- 📊 统计概览：总数、今日新增、待处理、按类型分布
- 🔍 筛选（类型 / 平台 / 状态）+ 关键词搜索（内容、邮箱、用户 ID、设备 ID、来源）
- 📋 列表分页 + 点击查看详情（右侧抽屉）
- 🖼️ 图片预览：支持内嵌 Blob 模式和 Cloud Storage 路径模式，可放大查看
- ✅ 标记已处理 / 重新打开（写入 `status` / `resolvedAt` 字段，不影响 Flutter 端）
- 🗑️ 删除反馈（二次确认）

## 首次配置

### 1. 放置 Firebase service account 密钥

Firebase 控制台 → 项目设置 → 服务账号 → 「生成新的私钥」，把下载的 JSON 保存为项目根目录的 `firebase-adminsdk.json`。

该文件已在 `.gitignore` 中，不会被提交。也可以改用环境变量 `FIREBASE_SERVICE_ACCOUNT` 直接传入 JSON 字符串（部署到 Vercel 等平台时推荐）。

### 2. 配置环境变量

复制 `.env.example` 为 `.env.local` 并修改：

```bash
cp .env.example .env.local
```

- `ADMIN_PASSWORD`：登录后台的密码
- `AUTH_SECRET`：session 签名密钥，用 `openssl rand -hex 32` 生成

### 3. 安装依赖并启动

```bash
npm install
npm run dev
```

打开 http://localhost:3000，输入密码登录即可。

## 说明

- **列表与统计基于最近 1000 条**：为支持关键词子串搜索（Firestore 原生不支持）并避免复合索引，服务端一次拉取最近 1000 条（排除 `imgs` 大字段）在内存中筛选和统计，界面上有标注。
- **图片按需加载**：详情里的图片通过 `/api/feedback/[id]/image?index=n` 逐张加载，不随列表传输。
- **Storage 模式**：若 Flutter 端配置了 `FeedbackImageStorage.storage`（`imgs` 存路径），默认按 `<project_id>.appspot.com` 推导 bucket；非默认 bucket 时请设置 `FIREBASE_STORAGE_BUCKET`。
- **状态字段是后台新增的**：`status`（open/resolved）和 `resolvedAt` 仅由本后台写入，Flutter 端的安全规则禁止客户端读取，互不影响。

## 部署（可选）

以 Vercel 为例：

1. 环境变量设置 `ADMIN_PASSWORD`、`AUTH_SECRET`、`FIREBASE_SERVICE_ACCOUNT`（service account JSON 的完整字符串）；
2. 如需 Storage 图片预览，再设置 `FIREBASE_STORAGE_BUCKET`。

生产环境 cookie 自动启用 `secure`，必须通过 HTTPS 访问。
