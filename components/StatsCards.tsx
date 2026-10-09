"use client";

import { Inbox, CalendarDays, Hourglass, PieChart } from "lucide-react";
import type { FeedbackStats } from "@/lib/types";
import { TYPE_LABELS } from "@/lib/types";

export default function StatsCards({ stats }: { stats: FeedbackStats | null }) {
  if (!stats) {
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-white ring-1 ring-gray-200" />
        ))}
      </div>
    );
  }

  const typeEntries = Object.entries(stats.byType).sort((a, b) => b[1] - a[1]);

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard icon={<Inbox className="h-4 w-4" />} label="反馈总数" value={stats.scanned} />
      <StatCard icon={<CalendarDays className="h-4 w-4" />} label="今日新增" value={stats.todayCount} />
      <StatCard
        icon={<Hourglass className="h-4 w-4" />}
        label="待处理"
        value={stats.pendingCount}
        highlight={stats.pendingCount > 0}
      />
      <div className="rounded-xl bg-white p-4 ring-1 ring-gray-200">
        <div className="flex items-center gap-2 text-gray-500">
          <PieChart className="h-4 w-4" />
          <span className="text-xs font-medium">按类型</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {typeEntries.length === 0 && <span className="text-lg font-semibold">0</span>}
          {typeEntries.map(([type, count]) => (
            <span
              key={type}
              className="inline-flex items-baseline gap-1 rounded-md bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600"
            >
              {TYPE_LABELS[type] ?? type}
              <span className="font-semibold text-gray-900">{count}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-xl bg-white p-4 ring-1 ring-gray-200">
      <div className="flex items-center gap-2 text-gray-500">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className={`mt-2 text-2xl font-semibold ${highlight ? "text-amber-600" : "text-gray-900"}`}>
        {value}
      </p>
    </div>
  );
}
