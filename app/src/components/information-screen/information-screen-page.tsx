"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Activity as ActivityIcon,
  ArrowUpRight,
  CalendarDays,
  ClipboardCheck,
  Maximize,
  Minimize,
  Monitor,
  Pause,
  Play,
  Users,
} from "lucide-react";
import { useFacility } from "@/components/providers/facility-provider";
import { FloorPlan } from "@/components/dashboard/floor-plan";
import { PageHeading, Panel, Status } from "@/components/shared/display";
import { Button } from "@/components/ui/button";
import {
  activityLabels,
  alertLabels,
  alertStatusLabels,
  dateText,
  deviceLabels,
  locationText,
  timeText,
} from "@/utils/format";
import { facilityStats, healthState } from "@/utils/selectors";
import type {
  Activity as ActivityItem,
  BuildingId,
  DeviceKind,
  FacilitySnapshot,
} from "@/types/domain";

const deviceKinds: DeviceKind[] = ["bed", "environment", "radar", "wearable"];
const healthStates = ["采集中", "设备离线", "未佩戴", "未开通"] as const;

function occupancyByFloor(data: FacilitySnapshot) {
  return (["A", "B"] as BuildingId[]).flatMap((building) =>
    [1, 2, 3, 4].map((floor) => {
      const rooms = data.rooms.filter(
        (room) => room.building === building && room.floor === floor,
      );
      const roomIds = new Set(rooms.map((room) => room.id));
      return {
        building,
        floor,
        rooms: rooms.length,
        beds: rooms.reduce((sum, room) => sum + room.capacity, 0),
        residents: data.residents.filter((resident) =>
          roomIds.has(resident.roomId),
        ).length,
        offline: data.devices.filter(
          (device) => roomIds.has(device.roomId) && device.status === "offline",
        ).length,
        alerts: data.alerts.filter(
          (alert) => roomIds.has(alert.roomId) && alert.status !== "resolved",
        ).length,
      };
    }),
  );
}

function activityTone(activity: ActivityItem) {
  if (activity.status === "ongoing") return "success";
  if (activity.status === "scheduled") return "info";
  return "neutral";
}

export function InformationScreenPage() {
  const { data, paused, setPaused } = useFacility();
  const screenRef = useRef<HTMLDivElement>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [error, setError] = useState("");
  const stats = facilityStats(data);
  const beds = data.rooms.reduce((sum, room) => sum + room.capacity, 0);
  const occupancy = beds ? (100 * data.residents.length) / beds : 0;
  const offlineDevices = data.devices
    .filter((device) => device.status === "offline")
    .sort((a, b) => a.lastSeenAt.localeCompare(b.lastSeenAt));
  const currentAlerts = data.alerts
    .filter((alert) => alert.status !== "resolved")
    .sort((a, b) => {
      const priority = { urgent: 0, attention: 1, device: 2 };
      return (
        priority[a.level] - priority[b.level] ||
        b.occurredAt.localeCompare(a.occurredAt)
      );
    });
  const activities = [...data.activities].sort((a, b) =>
    a.startsAt.localeCompare(b.startsAt),
  );
  const floors = useMemo(() => occupancyByFloor(data), [data]);
  const healthSummary = data.residents.reduce(
    (summary, resident) => {
      summary[healthState(resident, data)] += 1;
      return summary;
    },
    { 采集中: 0, 设备离线: 0, 未佩戴: 0, 未开通: 0 },
  );
  const enrolled = data.residents.filter(
    (resident) => resident.health.consented && resident.health.paid,
  ).length;
  const wearing = data.residents.filter(
    (resident) =>
      resident.health.consented &&
      resident.health.paid &&
      resident.health.wearing,
  ).length;

  useEffect(() => {
    const update = () =>
      setFullscreen(document.fullscreenElement === screenRef.current);
    document.addEventListener("fullscreenchange", update);
    return () => document.removeEventListener("fullscreenchange", update);
  }, []);

  async function toggleFullscreen() {
    const element = screenRef.current;
    if (!element) return;
    try {
      if (document.fullscreenElement === element) {
        await document.exitFullscreen();
      } else {
        await element.requestFullscreen();
      }
      setError("");
    } catch {
      setError("浏览器暂时无法进入全屏，请使用 F11。 ");
    }
  }

  return (
    <div className="information-screen" ref={screenRef}>
      <PageHeading
        eyebrow="FACILITY · LIVE OVERVIEW"
        title="综合信息屏"
        description="人员、房间、照护、活动、预警与设备状态 · 全院模拟数据"
        action={
          <>
            <Button
              variant="outline"
              onClick={() => setPaused(!paused)}
              aria-label={paused ? "恢复自动更新" : "暂停自动更新"}
            >
              {paused ? <Play /> : <Pause />}
              {paused ? "恢复更新" : "暂停更新"}
            </Button>
            <Button onClick={toggleFullscreen}>
              {fullscreen ? <Minimize /> : <Maximize />}
              {fullscreen ? "退出大屏" : "大屏展示"}
            </Button>
          </>
        }
      />
      {error && (
        <p className="screen-error" role="status">
          {error}
        </p>
      )}

      <div className="screen-snapshot-line">
        <span>
          颐安养老中心 <b>全院</b>
        </span>
        <span>
          <Status tone={paused ? "neutral" : "success"}>
            {paused ? "自动更新已暂停" : "数据每 12 秒更新"}
          </Status>
          <time>
            演示快照 {dateText(data.capturedAt)} {timeText(data.capturedAt)}
          </time>
        </span>
      </div>

      <div className="screen-summary-grid">
        <Link className="screen-summary-card" href="/residents">
          <span className="screen-summary-label">
            在院长者 <Users size={17} />
          </span>
          <strong>
            {data.residents.length}
            <small> / {beds} 床</small>
          </strong>
          <span className="screen-summary-note">
            入住率 {occupancy.toFixed(1)}%
          </span>
        </Link>
        <Link className="screen-summary-card" href="/devices">
          <span className="screen-summary-label">
            设备在线 <Monitor size={17} />
          </span>
          <strong>
            {stats.online}
            <small> / {stats.totalDevices} 台</small>
          </strong>
          <span className="screen-summary-note">
            <i className="danger-text">{offlineDevices.length} 台离线</i>
            {" · "}
            {stats.totalDevices
              ? ((100 * stats.online) / stats.totalDevices).toFixed(1)
              : "0.0"}
            % 在线
          </span>
        </Link>
        <Link className="screen-summary-card" href="/alerts">
          <span className="screen-summary-label">
            待处理预警 <ActivityIcon size={17} />
          </span>
          <strong className={stats.pending ? "danger-text" : ""}>
            {stats.pending}
            <small> 条</small>
          </strong>
          <span className="screen-summary-note">
            {stats.urgent} 条紧急 ·{" "}
            {data.alerts.filter((a) => a.status === "resolved").length} 条已处理
          </span>
        </Link>
        <div className="screen-summary-card screen-summary-static">
          <span className="screen-summary-label">
            今日照护 <ClipboardCheck size={17} />
          </span>
          <strong>
            {stats.careDone}
            <small> / {stats.careTotal} 项</small>
          </strong>
          <span className="screen-summary-note">
            完成率 {stats.careRate.toFixed(1)}%
          </span>
        </div>
      </div>

      <div className="screen-primary-grid">
        <div className="screen-floor-wrap">
          <FloorPlan />
        </div>

        <div className="screen-rail">
          <Panel
            title="待处理预警"
            eyebrow="ALERTS"
            className="screen-panel"
            action={
              <Link className="screen-panel-link" href="/alerts">
                全部 <ArrowUpRight size={14} />
              </Link>
            }
          >
            {currentAlerts.length ? (
              <ul className="screen-alert-list">
                {currentAlerts.map((alert) => {
                  const resident = data.residents.find(
                    (item) => item.id === alert.residentId,
                  );
                  const tone =
                    alert.level === "urgent"
                      ? "danger"
                      : alert.level === "attention"
                        ? "info"
                        : "neutral";
                  return (
                    <li key={alert.id}>
                      <Link
                        className="screen-alert-row"
                        href={`/alerts?alert=${alert.id}`}
                      >
                        <span className="screen-alert-meta">
                          <Status tone={tone}>
                            {alertLabels[alert.level]}
                          </Status>
                          <time>{timeText(alert.occurredAt)}</time>
                        </span>
                        <strong>{alert.title}</strong>
                        <span className="screen-alert-context">
                          {locationText(
                            data.rooms.find((room) => room.id === alert.roomId),
                          )}
                          {resident ? ` · ${resident.name}` : ""}
                          {` · ${alertStatusLabels[alert.status]}`}
                        </span>
                        <span className="screen-alert-evidence">
                          {alert.evidence} · {alert.deviceId}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="screen-empty">当前没有待处理预警</p>
            )}
          </Panel>

          <Panel
            title="自选健康监测"
            eyebrow="OPTIONAL SERVICE"
            className="screen-panel screen-health-panel"
            action={
              <Link className="screen-panel-link" href="/residents">
                人员页 <ArrowUpRight size={14} />
              </Link>
            }
          >
            <div className="screen-health-totals">
              <span>
                <b>{enrolled}</b> 已开通
              </span>
              <span>
                <b>{wearing}</b> 已佩戴
              </span>
              <span>
                <b>{stats.activeHealth}</b> 在线采集
              </span>
            </div>
            <div className="screen-health-breakdown">
              {healthStates.map((state) => (
                <div key={state}>
                  <span>{state}</span>
                  <b>{healthSummary[state]}</b>
                </div>
              ))}
            </div>
            <p className="screen-note">
              仅显示服务与连接状态；个人健康读数请在人员页查看。
            </p>
          </Panel>
        </div>
      </div>

      <div className="screen-floor-summary-grid">
        <Panel
          title="各楼层入住与设备"
          eyebrow="BUILDING STATUS"
          className="screen-panel screen-floor-summary-panel"
          action={
            <Link className="screen-panel-link" href="/">
              楼层平面图 <ArrowUpRight size={14} />
            </Link>
          }
        >
          <div className="screen-floor-summary">
            <div className="screen-floor-head" aria-hidden="true">
              <span>楼栋 / 楼层</span>
              <span>入住人数 / 床位</span>
              <span>离线设备</span>
              <span>待处理预警</span>
            </div>
            {floors.map((item) => (
              <div
                className="screen-floor-row"
                key={`${item.building}-${item.floor}`}
              >
                <strong>
                  {item.building} 栋 · {item.floor}F
                </strong>
                <span>
                  {item.residents} / {item.beds} 人
                </span>
                <span className={item.offline ? "danger-text" : "success-text"}>
                  {item.offline} 台
                </span>
                <span className={item.alerts ? "danger-text" : "muted"}>
                  {item.alerts} 条
                </span>
              </div>
            ))}
          </div>
          <p className="screen-note">
            每层 {floors[0]?.rooms ?? 0}{" "}
            间居室；点开上方平面图可查看房间、入住人员、环境读数与关联设备。
          </p>
        </Panel>
      </div>

      <div className="screen-secondary-grid">
        <Panel
          title="照护计划进度"
          eyebrow="CARE TASKS"
          className="screen-panel screen-care-panel"
        >
          <div className="screen-care-list">
            {data.careTasks.map((task) => {
              const progress = task.total
                ? (100 * task.completed) / task.total
                : 0;
              return (
                <div className="screen-care-row" key={task.id}>
                  <div className="screen-care-top">
                    <strong>{task.name}</strong>
                    <span>
                      {task.completed} / {task.total}
                    </span>
                  </div>
                  <div
                    className="screen-progress-track"
                    role="progressbar"
                    aria-label={`${task.name}完成进度`}
                    aria-valuemin={0}
                    aria-valuemax={task.total}
                    aria-valuenow={task.completed}
                  >
                    <i style={{ width: `${progress}%` }} />
                  </div>
                  <span className="screen-care-detail">
                    {task.time} · {task.owner}
                  </span>
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel
          title="活动安排"
          eyebrow="ACTIVITY SCHEDULE"
          className="screen-panel screen-activities-panel"
          action={
            <Link className="screen-panel-link" href="/activities">
              活动页 <ArrowUpRight size={14} />
            </Link>
          }
        >
          <div className="screen-activity-list">
            {activities.map((activity) => (
              <article className="screen-activity-row" key={activity.id}>
                <div className="screen-activity-time">
                  <time>{dateText(activity.startsAt)}</time>
                  <strong>{timeText(activity.startsAt)}</strong>
                  <span>— {timeText(activity.endsAt)}</span>
                </div>
                <div className="screen-activity-body">
                  <div className="screen-activity-title">
                    <strong>{activity.title}</strong>
                    <Status tone={activityTone(activity)}>
                      {activityLabels[activity.status]}
                    </Status>
                  </div>
                  <p>{activity.description}</p>
                  <span>
                    {activity.location} · {activity.host} ·{" "}
                    {activity.participants}/{activity.capacity} 人
                  </span>
                </div>
              </article>
            ))}
          </div>
        </Panel>

        <Panel
          title="设备台账概览"
          eyebrow="DEVICE FLEET"
          className="screen-panel screen-devices-panel"
          action={
            <Link className="screen-panel-link" href="/devices">
              设备页 <ArrowUpRight size={14} />
            </Link>
          }
        >
          <div className="screen-device-kinds">
            {deviceKinds.map((kind) => {
              const devices = data.devices.filter(
                (device) => device.kind === kind,
              );
              const online = devices.filter(
                (device) => device.status === "online",
              ).length;
              return (
                <div className="screen-device-kind" key={kind}>
                  <span>{deviceLabels[kind]}</span>
                  <strong>
                    {online}
                    <small> / {devices.length}</small>
                  </strong>
                  <span className="screen-device-kind-note">
                    {devices.length - online} 台离线
                  </span>
                </div>
              );
            })}
          </div>
          <div className="screen-offline-heading">
            <strong>离线设备清单</strong>
            <span>{offlineDevices.length} 台</span>
          </div>
          {offlineDevices.length ? (
            <ul className="screen-offline-list">
              {offlineDevices.map((device) => (
                <li key={device.id}>
                  <Link
                    className="screen-offline-row"
                    href={`/devices?device=${encodeURIComponent(device.id)}`}
                  >
                    <span>
                      <strong>{device.name}</strong>
                      <small>
                        {device.id} ·{" "}
                        {locationText(
                          data.rooms.find((room) => room.id === device.roomId),
                        )}
                      </small>
                    </span>
                    <span className="screen-offline-meta">
                      <b>
                        {device.battery === null
                          ? "外接电源"
                          : `${device.battery}%`}
                      </b>
                      <small>
                        {dateText(device.lastSeenAt)}{" "}
                        {timeText(device.lastSeenAt)}
                      </small>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="screen-empty">当前没有离线设备</p>
          )}
        </Panel>
      </div>

      <p className="screen-disclaimer">
        <CalendarDays size={14} />
        所有人员、环境、设备、健康服务、预警、照护与活动信息均为模拟数据；演示排期基准为
        2026 年 10 月 18 日 14:32。
      </p>
    </div>
  );
}
