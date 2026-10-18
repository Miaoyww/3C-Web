export type BuildingId = "A" | "B";
export type DeviceKind = "bed" | "environment" | "radar" | "wearable";
export type DeviceStatus = "online" | "offline";
export type AlertLevel = "urgent" | "attention" | "device";
export type AlertStatus = "pending" | "processing" | "resolved";
export type ActivityStatus = "ongoing" | "scheduled" | "finished";
export type Tone = "neutral" | "success" | "danger" | "info";

export interface Room {
  id: string;
  building: BuildingId;
  floor: number;
  number: string;
  capacity: number;
  temperature: number;
  humidity: number;
}
export interface HealthEnrollment {
  consented: boolean;
  paid: boolean;
  wearing: boolean;
  deviceId: string | null;
}
export interface Resident {
  id: string;
  name: string;
  gender: "男" | "女";
  age: number;
  roomId: string;
  bed: number;
  careLevel: "自理" | "协助照护" | "专业照护";
  caregiver: string;
  admittedAt: string;
  health: HealthEnrollment;
}
export interface HealthReading {
  residentId: string;
  deviceId: string;
  recordedAt: string;
  heartRate: number;
  respiration: number;
  oxygen: number;
}
export interface Device {
  id: string;
  name: string;
  kind: DeviceKind;
  roomId: string;
  installation: string;
  residentId: string | null;
  status: DeviceStatus;
  battery: number | null;
  lastSeenAt: string;
  model: string;
}
export interface AlertEvent {
  id: string;
  title: string;
  level: AlertLevel;
  status: AlertStatus;
  roomId: string;
  residentId: string | null;
  deviceId: string;
  occurredAt: string;
  evidence: string;
  rule: string;
  guidance: string;
  history: { at: string; actor: string; action: string }[];
}
export interface CareTaskGroup {
  id: string;
  name: string;
  completed: number;
  total: number;
  time: string;
  owner: string;
}
export interface Activity {
  id: string;
  title: string;
  category: string;
  status: ActivityStatus;
  startsAt: string;
  endsAt: string;
  location: string;
  host: string;
  participants: number;
  capacity: number;
  description: string;
}
/** Backend boundary: ISO 8601 times, stable IDs and explicit nullable readings. */
export interface FacilitySnapshot {
  schemaVersion: 1;
  source: "simulation";
  capturedAt: string;
  rooms: Room[];
  residents: Resident[];
  devices: Device[];
  healthReadings: HealthReading[];
  alerts: AlertEvent[];
  activities: Activity[];
  careTasks: CareTaskGroup[];
}
