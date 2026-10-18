import type {
  DeviceKind,
  AlertLevel,
  AlertStatus,
  ActivityStatus,
  Room,
} from "@/types/domain";

export const deviceLabels: Record<DeviceKind, string> = {
  bed: "智能床垫",
  environment: "环境传感器",
  radar: "毫米波雷达",
  wearable: "健康手环",
};
export const alertLabels: Record<AlertLevel, string> = {
  urgent: "紧急",
  attention: "关注",
  device: "设备",
};
export const alertStatusLabels: Record<AlertStatus, string> = {
  pending: "待处理",
  processing: "处理中",
  resolved: "已处理",
};
export const activityLabels: Record<ActivityStatus, string> = {
  ongoing: "进行中",
  scheduled: "已排期",
  finished: "已结束",
};
export function timeText(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}
export function dateText(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}
export function locationText(room: Room | undefined) {
  return room
    ? `${room.building} 栋 · ${room.floor}F · ${room.number} 室`
    : "位置未登记";
}
export function seeded(seed: number) {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return value - Math.floor(value);
}
export function exportCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows
    .map((row) =>
      row
        .map((value) => {
          const text = String(value);
          const safe = /^[=+@\-]/.test(text) ? `'${text}` : text;
          return `"${safe.replaceAll('"', '""')}"`;
        })
        .join(","),
    )
    .join("\r\n");
  const url = URL.createObjectURL(
    new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
