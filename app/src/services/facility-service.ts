import { createDemoSnapshot } from "@/data/demo";
import type { FacilitySnapshot, AlertStatus } from "@/types/domain";
import { seeded } from "@/utils/format";

/** Replace these operations with API calls; pages consume only FacilitySnapshot. */
export function loadFacility(): FacilitySnapshot {
  return createDemoSnapshot();
}
export function refreshFacility(data: FacilitySnapshot): FacilitySnapshot {
  const at = new Date(
    new Date(data.capturedAt).getTime() + 12000,
  ).toISOString();
  const histories = new Map<string, typeof data.healthReadings>();
  for (const reading of data.healthReadings) {
    const history = histories.get(reading.residentId) ?? [];
    history.push(reading);
    histories.set(reading.residentId, history);
  }
  const current = [...histories.values()].map((history) => history.at(-1)!);
  const next = current.map((reading) => ({
    ...reading,
    recordedAt: at,
    heartRate: Math.max(
      60,
      Math.min(
        110,
        reading.heartRate +
          Math.round(
            seeded(
              new Date(at).getTime() + Number(reading.residentId.slice(1)),
            ) * 4,
          ) -
          2,
      ),
    ),
  }));
  return {
    ...data,
    capturedAt: at,
    devices: data.devices.map((d) =>
      d.status === "online" ? { ...d, lastSeenAt: at } : d,
    ),
    healthReadings: [
      ...[...histories.values()].flatMap((history) => history.slice(-11)),
      ...next,
    ],
  };
}
export function changeAlertStatus(
  data: FacilitySnapshot,
  id: string,
  status: AlertStatus,
): FacilitySnapshot {
  return {
    ...data,
    alerts: data.alerts.map((alert) =>
      alert.id === id && alert.status !== status
        ? {
            ...alert,
            status,
            history: [
              ...alert.history,
              {
                at: data.capturedAt,
                actor: "值班员（演示）",
                action:
                  status === "processing"
                    ? "已接手，安排现场核实"
                    : "已完成现场核实，标记为已处理（模拟操作）",
              },
            ],
          }
        : alert,
    ),
  };
}
