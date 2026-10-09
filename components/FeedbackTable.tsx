"use client";

import { FileImage } from "lucide-react";
import type { FeedbackListItem } from "@/lib/types";
import { formatDateTime } from "@/lib/format";
import { PlatformTag, StatusBadge, TypeBadge } from "@/components/badges";

export default function FeedbackTable({
  items,
  selectedId,
  onSelect,
}: {
  items: FeedbackListItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl bg-white ring-1 ring-gray-200">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50 text-xs text-gray-500">
            <th className="px-4 py-2.5 font-medium">时间</th>
            <th className="px-4 py-2.5 font-medium">类型</th>
            <th className="px-4 py-2.5 font-medium">状态</th>
            <th className="px-4 py-2.5 font-medium">内容</th>
            <th className="px-4 py-2.5 font-medium">平台</th>
            <th className="px-4 py-2.5 font-medium">来源</th>
            <th className="px-4 py-2.5 font-medium">联系方式</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={`cursor-pointer border-b border-gray-100 transition last:border-b-0 hover:bg-indigo-50/40 ${
                selectedId === item.id ? "bg-indigo-50/60" : ""
              }`}
            >
              <td className="whitespace-nowrap px-4 py-2.5 tabular-nums text-gray-500">
                {formatDateTime(item.createdAt)}
              </td>
              <td className="px-4 py-2.5">
                <TypeBadge type={item.type} />
              </td>
              <td className="px-4 py-2.5">
                <StatusBadge status={item.status} />
              </td>
              <td className="max-w-md px-4 py-2.5">
                <p className="truncate text-gray-900" title={item.content}>
                  {item.content || "（空）"}
                </p>
              </td>
              <td className="px-4 py-2.5">
                <PlatformTag platform={item.platform} />
              </td>
              <td className="whitespace-nowrap px-4 py-2.5 text-gray-500">{item.source || "—"}</td>
              <td className="max-w-[180px] px-4 py-2.5">
                <p className="truncate text-gray-500" title={item.email ?? item.userId ?? ""}>
                  {item.email ?? item.userId ?? "—"}
                </p>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {items.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-16 text-gray-400">
          <FileImage className="h-8 w-8" />
          <p className="text-sm">没有符合条件的反馈</p>
        </div>
      )}
    </div>
  );
}
