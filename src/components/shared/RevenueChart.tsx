"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

export type RevenuePoint = { date: string; revenue: number };

/** Compact gold sparkline used inside the navy hero card. */
export function RevenueSparkline({ data }: { data: RevenuePoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="sparkGold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c8a84b" stopOpacity={0.6} />
            <stop offset="100%" stopColor="#c8a84b" stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#f0c94a"
          strokeWidth={2}
          fill="url(#sparkGold)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/** Full revenue area chart for the dashboard panel. */
export function RevenueArea({ data }: { data: RevenuePoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ left: 8, right: 16, top: 10 }}>
        <defs>
          <linearGradient id="revArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0d1f4e" stopOpacity={0.18} />
            <stop offset="100%" stopColor="#0d1f4e" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "#8a8d9b" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#8a8d9b" }}
          tickFormatter={(v: number) => `D${v}`}
          axisLine={false}
          tickLine={false}
          width={48}
        />
        <Tooltip
          formatter={(v: number) => formatCurrency(v)}
          contentStyle={{
            borderRadius: 10,
            border: "1px solid #e5e7eb",
            fontSize: 12,
          }}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#0d1f4e"
          strokeWidth={2.5}
          fill="url(#revArea)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
