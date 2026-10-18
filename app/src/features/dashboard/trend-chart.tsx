"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { makeTrend } from "./mock-data";

export function TrendChart({
  period,
  tick,
  reducedMotion,
}: {
  period: "day" | "week";
  tick: number;
  reducedMotion: boolean;
}) {
  return (
    <div
      className="trend-chart"
      role="img"
      aria-label={
        period === "day"
          ? "今日平均心率与呼吸趋势，仅含已同意采集、付费开通且佩戴在线设备的参与者，模拟数据"
          : "本周平均心率与呼吸趋势，仅含已同意采集、付费开通且佩戴在线设备的参与者，模拟数据"
      }
    >
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <ComposedChart
          data={makeTrend(period, tick)}
          margin={{ top: 16, right: 12, left: -24, bottom: 0 }}
        >
          <defs>
            <linearGradient id="heart-fill" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor="var(--status-info)"
                stopOpacity={0.13}
              />
              <stop
                offset="100%"
                stopColor="var(--status-info)"
                stopOpacity={0}
              />
            </linearGradient>
          </defs>
          <CartesianGrid
            vertical={false}
            stroke="var(--border)"
            strokeDasharray="3 5"
          />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            minTickGap={22}
            tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
            dy={8}
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
          />
          <Tooltip
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: "var(--muted-foreground)", marginBottom: 6 }}
            formatter={(value, name) => [`${value} 次/分`, name]}
          />
          <Area
            type="monotone"
            dataKey="heart"
            name="平均心率"
            stroke="var(--status-info)"
            strokeWidth={2}
            fill="url(#heart-fill)"
            isAnimationActive={!reducedMotion}
            animationDuration={600}
          />
          <Line
            type="monotone"
            dataKey="breath"
            name="平均呼吸"
            stroke="var(--status-success)"
            strokeWidth={1.5}
            strokeDasharray="4 5"
            dot={false}
            isAnimationActive={!reducedMotion}
            animationDuration={600}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
