"use client";
import { useReducedMotion } from "motion/react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { HealthReading } from "@/types/domain";
import { timeText } from "@/utils/format";
export function HealthChart({
  readings,
  name,
}: {
  readings: HealthReading[];
  name: string;
}) {
  const reduced = useReducedMotion();
  return (
    <div
      className="health-chart"
      role="img"
      aria-label={`${name}的个人心率趋势，模拟数据`}
    >
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <LineChart
          data={readings.map((r) => ({ ...r, time: timeText(r.recordedAt) }))}
          margin={{ top: 10, right: 14, left: -24, bottom: 0 }}
        >
          <CartesianGrid
            vertical={false}
            stroke="var(--border)"
            strokeDasharray="3 5"
          />
          <XAxis
            dataKey="time"
            axisLine={false}
            tickLine={false}
            minTickGap={35}
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
          />
          <YAxis
            domain={[50, 120]}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
          />
          <Tooltip
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: 6,
              fontSize: 12,
            }}
            formatter={(value) => [`${value} 次/分`, "个人心率"]}
          />
          <Line
            dataKey="heartRate"
            name="个人心率"
            type="monotone"
            dot={false}
            stroke="var(--status-info)"
            strokeWidth={2}
            isAnimationActive={!reduced}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
