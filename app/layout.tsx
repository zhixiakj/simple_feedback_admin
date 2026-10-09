import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "反馈管理后台",
  description: "simple_feedback 用户反馈管理",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  );
}
