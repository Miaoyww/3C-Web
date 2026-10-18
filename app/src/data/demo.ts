import type {
  FacilitySnapshot,
  Room,
  Resident,
  Device,
  DeviceKind,
  AlertEvent,
  Activity,
} from "@/types/domain";
import { seeded } from "@/utils/format";
import { canRecordHealth } from "@/utils/selectors";

export const DEMO_TIME = "2026-10-18T14:32:00+08:00";
export function createDemoSnapshot(): FacilitySnapshot {
  const rooms: Room[] = Array.from({ length: 128 }, (_, index) => {
    const building = index < 64 ? "A" : "B";
    const floor = Math.floor((index % 64) / 16) + 1;
    const number = `${floor}${String((index % 16) + 1).padStart(2, "0")}`;
    return {
      id: `${building}-${number}`,
      building,
      floor,
      number,
      capacity: 2,
      temperature: +(22 + seeded(index + 2) * 4).toFixed(1),
      humidity: Math.round(43 + seeded(index + 3) * 13),
    };
  });
  const surnames = [
    "陈",
    "王",
    "李",
    "张",
    "刘",
    "赵",
    "周",
    "吴",
    "徐",
    "孙",
    "朱",
    "林",
    "何",
    "郭",
    "马",
    "高",
    "罗",
    "郑",
    "梁",
    "宋",
    "唐",
  ];
  const names = [
    "国华",
    "淑兰",
    "建明",
    "秀英",
    "志远",
    "桂芳",
    "文清",
    "玉珍",
  ];
  const residents: Resident[] = rooms.flatMap((room, index) => {
    const start = Math.floor((index * 168) / 128);
    const count = Math.floor(((index + 1) * 168) / 128) - start;
    return Array.from({ length: count }, (_, bed) => {
      const index = start + bed;
      const rank = (index * 37) % 168;
      const id = `R${String(index + 1).padStart(4, "0")}`;
      return {
        id,
        name:
          surnames[index % surnames.length] +
          names[Math.floor(index / surnames.length)],
        gender: index % 2 === 0 ? "男" : "女",
        age: 65 + (index % 29),
        roomId: room.id,
        bed: bed + 1,
        careLevel:
          index % 5 === 0 ? "专业照护" : index % 3 === 0 ? "协助照护" : "自理",
        caregiver: ["林晓", "王敏", "陈洁", "李悦"][index % 4],
        admittedAt: `2025-${String(1 + (index % 9)).padStart(2, "0")}-12`,
        health: {
          consented: rank < 72,
          paid: rank < 72,
          wearing: rank < 68,
          deviceId: rank < 68 ? `W-${id}` : null,
        },
      };
    });
  });
  const devices: Device[] = rooms.flatMap((room, index) => {
    const kinds: DeviceKind[] = ["bed", "bed", "environment", "radar"];
    return kinds.map((kind, slot) => {
      const prefix =
        kind === "bed" ? "BED" : kind === "environment" ? "ENV" : "RAD";
      const id = `${prefix}-${room.id}${kind === "bed" ? `-${slot + 1}` : ""}`;
      const offline =
        id === "ENV-A-116" ||
        id === "ENV-B-409" ||
        id === "RAD-B-208" ||
        (kind === "bed" && slot === 1 && [12, 47, 91].includes(index));
      return {
        id,
        name:
          kind === "bed"
            ? `${slot + 1} 号床感知垫`
            : kind === "environment"
              ? "温湿度采集器"
              : "房间行为雷达",
        kind,
        roomId: room.id,
        installation:
          kind === "bed"
            ? `${slot + 1} 号床 · 床垫下方`
            : kind === "environment"
              ? "房门内侧 · 东墙 1.5m"
              : "房间中央 · 顶部 2.6m",
        residentId:
          kind === "bed"
            ? (residents.find((r) => r.roomId === room.id && r.bed === slot + 1)
                ?.id ?? null)
            : null,
        status: offline ? "offline" : "online",
        battery:
          kind === "radar"
            ? null
            : Math.round(40 + seeded(index * 4 + slot) * 60),
        lastSeenAt: offline ? "2026-10-18T14:05:00+08:00" : DEMO_TIME,
        model:
          kind === "bed"
            ? "YC-B200"
            : kind === "environment"
              ? "YC-E100"
              : "YC-R300",
      };
    });
  });
  residents
    .filter((r) => r.health.wearing)
    .forEach((r) => {
      const index = Number(r.id.slice(1)) - 1;
      const offline = (index * 37) % 168 >= 66;
      devices.push({
        id: r.health.deviceId!,
        name: `${r.name}的健康手环`,
        kind: "wearable",
        roomId: r.roomId,
        installation: "随身佩戴 · 登记房间",
        residentId: r.id,
        status: offline ? "offline" : "online",
        battery: Math.round(25 + seeded(index + 30) * 75),
        lastSeenAt: offline ? "2026-10-18T13:58:00+08:00" : DEMO_TIME,
        model: "YC-W100",
      });
    });
  const healthReadings = residents.flatMap((r) => {
    if (
      !canRecordHealth(
        r.health,
        devices.find((d) => d.id === r.health.deviceId)?.status === "online",
      )
    )
      return [];
    const index = Number(r.id.slice(1));
    const elevated = r.roomId === "A-305";
    return Array.from({ length: 12 }, (_, i) => ({
      residentId: r.id,
      deviceId: r.health.deviceId!,
      recordedAt: new Date(
        new Date(DEMO_TIME).getTime() - (11 - i) * 5 * 60000,
      ).toISOString(),
      heartRate: elevated
        ? 101 + Math.round(seeded(index + i) * 8)
        : 65 + Math.round(seeded(index + i) * 20),
      respiration: 15 + Math.round(seeded(index + i + 6) * 5),
      oxygen: 96 + Math.round(seeded(index + i + 8) * 3),
    }));
  });
  const definitions = [
    {
      roomId: "A-208",
      level: "urgent",
      title: "疑似跌倒 · 异常姿态持续",
      deviceId: "RAD-A-208",
      occurredAt: "2026-10-18T14:32:00+08:00",
      evidence: "检测到人体高度由 1.4m 降至 0.3m，低位姿态持续 18 秒",
      rule: "低位姿态持续超过 15 秒且未恢复站立",
      guidance:
        "立即前往 208 室核实，确认意识与现场情况，必要时联系值班医护。房间雷达无法识别具体人员，需现场确认。",
      identify: false,
    },
    {
      roomId: "A-305",
      level: "attention",
      title: "个人心率持续偏高",
      deviceId: "",
      occurredAt: "2026-10-18T14:28:00+08:00",
      evidence: "个人手环心率 106 次/分，连续 5 分钟高于演示阈值",
      rule: "个人心率 > 100 次/分持续 5 分钟（演示规则）",
      guidance:
        "先确认佩戴与设备读数，再询问长者活动情况，联系护理员进行人工复核。",
      identify: true,
    },
    {
      roomId: "A-212",
      level: "attention",
      title: "1 号床离床时间较长",
      deviceId: "BED-A-212-1",
      occurredAt: "2026-10-18T14:21:00+08:00",
      evidence: "1 号床持续无压力信号，离床时间已达 32 分钟",
      rule: "照护时段离床超过 30 分钟（演示规则）",
      guidance: "核对活动排期并联系责任护理员，确认长者当前位置与安全情况。",
      identify: true,
    },
    {
      roomId: "A-116",
      level: "device",
      title: "环境传感器通信中断",
      deviceId: "ENV-A-116",
      occurredAt: "2026-10-18T14:16:00+08:00",
      evidence: "最后上报 14:05，触发时已连续 11 分钟未收到心跳",
      rule: "环境传感器超过 10 分钟未上报",
      guidance:
        "检查房门内侧东墙采集器电源及网络；恢复上报前暂停显示该设备环境读数。",
      identify: false,
    },
  ] as const;
  const alerts: AlertEvent[] = definitions.map((a, index) => {
    const resident = a.identify
      ? residents.find(
          (r) => r.roomId === a.roomId && (index !== 1 || r.health.deviceId),
        )
      : null;
    return {
      ...a,
      id: `AL-${String(index + 1).padStart(3, "0")}`,
      status: "pending",
      residentId: resident?.id ?? null,
      deviceId: index === 1 ? resident!.health.deviceId! : a.deviceId,
      history: [
        {
          at: a.occurredAt,
          actor: "监测系统",
          action: "触发预警，等待人工核实",
        },
      ],
    };
  });
  const activities: Activity[] = [
    {
      id: "AC-001",
      title: "午后八段锦",
      category: "轻运动",
      status: "ongoing",
      startsAt: "2026-10-18T14:00:00+08:00",
      endsAt: "2026-10-18T15:00:00+08:00",
      location: "A 栋 · 1F · 康复活动室",
      host: "康复师 · 许晨",
      participants: 18,
      capacity: 24,
      description: "坐式与站式分组练习，护理员全程陪同。",
    },
    {
      id: "AC-002",
      title: "记忆里的老歌",
      category: "文娱",
      status: "ongoing",
      startsAt: "2026-10-18T14:15:00+08:00",
      endsAt: "2026-10-18T15:15:00+08:00",
      location: "B 栋 · 1F · 多功能厅",
      host: "社工 · 沈宁",
      participants: 26,
      capacity: 32,
      description: "老歌分享与合唱，提供大字歌词。",
    },
    {
      id: "AC-003",
      title: "秋日书法小聚",
      category: "兴趣",
      status: "scheduled",
      startsAt: "2026-10-18T15:30:00+08:00",
      endsAt: "2026-10-18T16:30:00+08:00",
      location: "A 栋 · 1F · 阅读室",
      host: "志愿者 · 郑老师",
      participants: 12,
      capacity: 16,
      description: "毛笔基础与作品分享，材料由活动室提供。",
    },
    {
      id: "AC-004",
      title: "花园慢步与陪伴",
      category: "户外",
      status: "scheduled",
      startsAt: "2026-10-18T16:00:00+08:00",
      endsAt: "2026-10-18T16:45:00+08:00",
      location: "院区 · 中心花园 · 南侧集合点",
      host: "护理组 · 王敏",
      participants: 16,
      capacity: 20,
      description: "按步行能力分组，行动辅助器具提前检查。",
    },
    {
      id: "AC-005",
      title: "周一手作工坊",
      category: "手工",
      status: "scheduled",
      startsAt: "2026-10-19T09:30:00+08:00",
      endsAt: "2026-10-19T10:30:00+08:00",
      location: "B 栋 · 2F · 共享活动室",
      host: "社工 · 沈宁",
      participants: 9,
      capacity: 18,
      description: "制作秋叶拼贴，适合坐姿完成。",
    },
    {
      id: "AC-006",
      title: "晨间舒展",
      category: "轻运动",
      status: "finished",
      startsAt: "2026-10-18T08:30:00+08:00",
      endsAt: "2026-10-18T09:00:00+08:00",
      location: "A 栋 · 1F · 康复活动室",
      host: "康复师 · 许晨",
      participants: 21,
      capacity: 24,
      description: "晨间关节舒展与呼吸练习。",
    },
  ];
  return {
    schemaVersion: 1,
    source: "simulation",
    capturedAt: DEMO_TIME,
    rooms,
    residents,
    devices,
    healthReadings,
    alerts,
    activities,
    careTasks: [
      {
        id: "C1",
        name: "日常巡房",
        completed: 64,
        total: 64,
        time: "08:00—20:00",
        owner: "全体护理员",
      },
      {
        id: "C2",
        name: "健康测量",
        completed: 42,
        total: 48,
        time: "07:00 / 15:00",
        owner: "健康管理组",
      },
      {
        id: "C3",
        name: "用药协助",
        completed: 28,
        total: 32,
        time: "三餐后",
        owner: "责任护理员",
      },
      {
        id: "C4",
        name: "康复训练",
        completed: 14,
        total: 16,
        time: "09:00 / 14:00",
        owner: "康复组",
      },
    ],
  };
}
