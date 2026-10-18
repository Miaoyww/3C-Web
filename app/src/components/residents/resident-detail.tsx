"use client";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useFacility } from "@/components/providers/facility-provider";
import { Avatar, Status } from "@/components/shared/display";
import { HealthChart } from "./health-chart";
import {
  healthState,
  latestReading,
  residentReadings,
} from "@/utils/selectors";
import { locationText, timeText } from "@/utils/format";
export function ResidentDetail({
  id,
  onClose,
}: {
  id: string;
  onClose: () => void;
}) {
  const { data } = useFacility();
  const person = data.residents.find((r) => r.id === id);
  const room = data.rooms.find((r) => r.id === person?.roomId);
  if (!person) return null;
  const state = healthState(person, data);
  const reading = latestReading(data, id);
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="detail-dialog">
        <DialogHeader>
          <div className="identity">
            <Avatar name={person.name} />
            <div>
              <DialogTitle>{person.name} · 人员详情</DialogTitle>
              <DialogDescription>
                {person.id} · {person.gender} · {person.age} 岁 ·{" "}
                {locationText(room)} · {person.bed} 号床
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="detail-grid">
          <div>
            <span>照护等级</span>
            <strong>{person.careLevel}</strong>
          </div>
          <div>
            <span>责任护理员</span>
            <strong>{person.caregiver}</strong>
          </div>
          <div>
            <span>健康服务</span>
            <Status
              tone={
                state === "采集中"
                  ? "info"
                  : state === "设备离线"
                    ? "danger"
                    : "neutral"
              }
            >
              {state}
            </Status>
          </div>
          <div>
            <span>佩戴设备</span>
            {person.health.deviceId ? (
              <Link
                className="text-link"
                href={`/devices?device=${person.health.deviceId}`}
              >
                {person.health.deviceId} ↗
              </Link>
            ) : (
              <strong>未绑定</strong>
            )}
          </div>
        </div>
        <p className="service-note">
          自愿付费可选服务 ·
          仅在同意采集、已开通并佩戴在线设备时记录个人健康信息。
        </p>
        {reading ? (
          <>
            <div className="personal-vitals">
              <div>
                <span>个人心率</span>
                <strong
                  className={reading.heartRate > 100 ? "danger-text" : ""}
                >
                  {reading.heartRate}
                  <small> 次/分</small>
                </strong>
              </div>
              <div>
                <span>呼吸频率</span>
                <strong>
                  {reading.respiration}
                  <small> 次/分</small>
                </strong>
              </div>
              <div>
                <span>血氧饱和度</span>
                <strong>
                  {reading.oxygen}
                  <small> %</small>
                </strong>
              </div>
            </div>
            <div className="section-label">
              个人心率 · 最近 12 次采样{" "}
              <span>最近上报 {timeText(reading.recordedAt)}</span>
            </div>
            <HealthChart
              readings={residentReadings(data, id)}
              name={person.name}
            />
          </>
        ) : (
          <div className="empty-state">
            <p>
              {state === "未开通"
                ? "未开通自选健康监测，不采集健康数据"
                : state === "未佩戴"
                  ? "已开通但未佩戴设备，暂无健康读数"
                  : "佩戴设备离线，暂停健康采集"}
            </p>
          </div>
        )}
        <p className="muted small">
          模拟个人数据，仅用于界面演示，不构成医疗判断。
        </p>
      </DialogContent>
    </Dialog>
  );
}
