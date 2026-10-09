import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  // 用户 home 目录存在无关的 package-lock.json，显式指定项目根，避免 Turbopack 误判
  turbopack: {
    root: __dirname,
  },
};

export default withNextIntl(nextConfig);
