import type {
  FacilitySnapshot,
  Resident,
  HealthEnrollment,
} from "@/types/domain";

export function canRecordHealth(enrollment: HealthEnrollment, online: boolean) {
  return (
    enrollment.consented && enrollment.paid && enrollment.wearing && online
  );
}
export function healthState(resident: Resident, data: FacilitySnapshot) {
  const enrollment = resident.health;
  if (!enrollment.consented || !enrollment.paid) return "未开通";
  if (!enrollment.wearing) return "未佩戴";
  return data.devices.find((d) => d.id === enrollment.deviceId)?.status ===
    "online"
    ? "采集中"
    : "设备离线";
}
export function residentReadings(data: FacilitySnapshot, residentId: string) {
  return data.healthReadings
    .filter((reading) => reading.residentId === residentId)
    .sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
}
export function latestReading(data: FacilitySnapshot, residentId: string) {
  return residentReadings(data, residentId).at(-1);
}
export function facilityStats(data: FacilitySnapshot) {
  const online = data.devices.filter((d) => d.status === "online").length;
  const careDone = data.careTasks.reduce((sum, t) => sum + t.completed, 0);
  const careTotal = data.careTasks.reduce((sum, t) => sum + t.total, 0);
  return {
    online,
    totalDevices: data.devices.length,
    pending: data.alerts.filter((a) => a.status !== "resolved").length,
    urgent: data.alerts.filter(
      (a) => a.status !== "resolved" && a.level === "urgent",
    ).length,
    careDone,
    careTotal,
    careRate: (100 * careDone) / careTotal,
    subscribed: data.residents.filter(
      (r) => r.health.consented && r.health.paid,
    ).length,
    activeHealth: data.residents.filter(
      (r) => healthState(r, data) === "采集中",
    ).length,
  };
}
