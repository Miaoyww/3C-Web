export type Alert = {
  id: number;
  title: string;
  room: string;
  floor: number;
  level: "紧急" | "关注" | "设备";
  time: string;
  detail: string;
  handled: boolean;
};

export const initialAlerts: Alert[] = [
  {
    id: 1,
    title: "疑似跌倒，请及时核实",
    room: "208",
    floor: 2,
    level: "紧急",
    time: "14:32",
    detail:
      "房间毫米波传感器检测到异常姿态，持续 18 秒。请值班护理员前往现场核实。此信息为模拟事件，不构成医疗判断。",
    handled: false,
  },
  {
    id: 2,
    title: "心率持续偏高",
    room: "305",
    floor: 3,
    level: "关注",
    time: "14:28",
    detail:
      "模拟穿戴设备连续 5 分钟上报心率 106 次/分，高于演示阈值。请核对设备读数并进行人工关怀。",
    handled: false,
  },
  {
    id: 3,
    title: "离床时间较长",
    room: "212",
    floor: 2,
    level: "关注",
    time: "14:21",
    detail: "床垫传感器检测到离床超过 30 分钟，请核实长者位置与活动安排。",
    handled: false,
  },
  {
    id: 4,
    title: "房间传感器离线",
    room: "116",
    floor: 1,
    level: "设备",
    time: "14:16",
    detail:
      "环境传感器超过 10 分钟未上报。请检查设备电源与网络连接，离线期间不提供环境读数。",
    handled: false,
  },
];

// Deterministic first render avoids server/client hydration differences.
export function seeded(seed: number) {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return value - Math.floor(value);
}

export type HealthEnrollment = {
  consented: boolean;
  paid: boolean;
  wearing: boolean;
  online: boolean;
};

export function canRecordHealth(enrollment: HealthEnrollment) {
  return (
    enrollment.consented &&
    enrollment.paid &&
    enrollment.wearing &&
    enrollment.online
  );
}

// Simulated subscriptions only: no payment processing or real personal data.
export const healthResidents = Array.from({ length: 128 }, (_, index) => {
  const building = index < 64 ? "A" : "B";
  const floor = Math.floor((index % 64) / 16) + 1;
  const room = `${floor}${String((index % 16) + 1).padStart(2, "0")}`;
  const start = Math.floor((index * 168) / 128);
  const occupied = Math.floor(((index + 1) * 168) / 128) - start;
  return Array.from({ length: occupied }, (_, person) => {
    const id = start + person;
    const rank = (id * 37) % 168;
    const enrollment = {
      consented: rank < 72,
      paid: rank < 72,
      wearing: rank < 68,
      online: rank < 66,
    };
    return {
      id,
      building,
      floor,
      room,
      ...enrollment,
      heartRate: canRecordHealth(enrollment)
        ? building === "A" && room === "305"
          ? 106
          : Math.round(65 + seeded(id + 4) * 20)
        : null,
    };
  });
}).flat();

export const activeHealthResidents = healthResidents.filter(canRecordHealth);
export const healthService = {
  subscribed: healthResidents.filter((r) => r.paid && r.consented).length,
  wearing: healthResidents.filter((r) => r.paid && r.consented && r.wearing)
    .length,
  active: activeHealthResidents.length,
};

export function makeRooms(floor: number, building: string) {
  return Array.from({ length: 16 }, (_, i) => {
    const number = `${floor}${String(i + 1).padStart(2, "0")}`;
    const seed = floor * 100 + i + (building === "B" ? 31 : 0);
    const index = (building === "B" ? 64 : 0) + (floor - 1) * 16 + i;
    const residents = healthResidents.filter(
      (r) => r.building === building && r.room === number,
    );
    const monitored = residents.filter(canRecordHealth);
    return {
      number,
      beds: 2,
      occupied:
        Math.floor(((index + 1) * 168) / 128) - Math.floor((index * 168) / 128),
      temperature: +(22 + seeded(seed + 2) * 4).toFixed(1),
      humidity: Math.round(43 + seeded(seed + 3) * 13),
      healthSubscribers: residents.filter((r) => r.paid && r.consented).length,
      healthActive: monitored.length,
      heartRate: monitored.length
        ? Math.round(
            monitored.reduce((sum, r) => sum + r.heartRate!, 0) /
              monitored.length,
          )
        : null,
    };
  });
}

export function makeTrend(period: "day" | "week", tick: number) {
  const length = period === "day" ? 13 : 7;
  return Array.from({ length }, (_, i) => ({
    label:
      period === "day"
        ? `${String(i * 2).padStart(2, "0")}:00`
        : ["周一", "周二", "周三", "周四", "周五", "周六", "周日"][i],
    heart: Math.round(
      activeHealthResidents.reduce(
        (sum, r) => sum + 65 + seeded(r.id + i + tick * 13) * 20,
        0,
      ) / activeHealthResidents.length,
    ),
    breath: Math.round(
      activeHealthResidents.reduce(
        (sum, r) => sum + 15 + seeded(r.id + i + tick * 13 + 6) * 5,
        0,
      ) / activeHealthResidents.length,
    ),
  }));
}

export const devices = [
  { name: "智能床垫", online: 178, total: 180, label: "床位感知" },
  {
    name: "健康手环",
    online: healthService.active,
    total: healthService.wearing,
    label: "可选服务 · 已佩戴设备",
  },
  { name: "环境传感器", online: 94, total: 96, label: "温湿度监测" },
  { name: "毫米波雷达", online: 47, total: 48, label: "行为感知" },
];
