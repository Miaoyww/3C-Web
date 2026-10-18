"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Maximize,
  Minimize,
  Download,
  Users,
  Monitor,
  Bell,
  HeartHandshake,
  Pause,
  Play,
} from "lucide-react";
import { useFacility } from "@/components/providers/facility-provider";
import { PageHeading, MetricNumber, Status } from "@/components/shared/display";
import { Button } from "@/components/ui/button";
import { FloorPlan } from "./floor-plan";
import { facilityStats } from "@/utils/selectors";
import { exportCsv, deviceLabels } from "@/utils/format";

export function DashboardPage() {
  const { data, paused, setPaused } = useFacility();
  const stats = facilityStats(data);
  const [fullscreen, setFullscreen] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const update = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", update);
    return () => document.removeEventListener("fullscreenchange", update);
  }, []);
  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      setError("浏览器暂时无法进入全屏，请使用 F11。");
    }
  }
  return (
    <>
      <PageHeading
        eyebrow="CARE · CONNECT · COMPANION"
        title="让每一份关怀，都被看见。"
        description="养老院智能监测总览 · 守护日常，安心常在"
        action={
          <>
            <Button
              variant="outline"
              onClick={() =>
                exportCsv("颐安-院区概览-模拟数据.csv", [
                  ["指标", "数值"],
                  ["在院长者", data.residents.length],
                  ["设备在线", stats.online],
                  ["设备总数", stats.totalDevices],
                  ["待处理预警", stats.pending],
                  ["照护完成", stats.careDone],
                  ["照护计划", stats.careTotal],
                ])
              }
            >
              <Download />
              导出概览
            </Button>
            <Button onClick={toggleFullscreen}>
              {fullscreen ? <Minimize /> : <Maximize />}
              {fullscreen ? "退出大屏" : "大屏展示"}
            </Button>
          </>
        }
      />
      {error && <p role="status">{error}</p>}
      <div className="scope-bar">
        <span>
          颐安养老中心 <b>全院</b>
        </span>
        <div>
          <Status tone="success">
            {paused ? "自动更新已暂停" : "每 12 秒自动更新"}
          </Status>
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label={paused ? "恢复自动更新" : "暂停自动更新"}
            onClick={() => setPaused(!paused)}
          >
            {paused ? <Play /> : <Pause />}
          </Button>
        </div>
      </div>
      <div className="overview-grid">
        <section className="overview-card">
          <div className="card-label">
            在院长者
            <Users size={18} />
          </div>
          <div className="big-metric">
            <MetricNumber value={data.residents.length} />
            <small>人</small>
          </div>
          <div className="metric-meta">
            <span>双人居室 {data.rooms.length} 间</span>
            <span>入住率 65.6%</span>
          </div>
          <div className="progress-track">
            <i style={{ width: "65.6%" }} />
          </div>
        </section>
        <section className="overview-card device-overview">
          <div className="card-label">
            设备运行状态
            <Monitor size={18} />
          </div>
          <Link className="metric-link" href="/devices">
            <div className="big-metric">
              <MetricNumber
                value={(stats.online / stats.totalDevices) * 100}
                decimals={1}
              />
              <small>% 在线</small>
            </div>
            <ArrowUpRight size={20} />
          </Link>
          <div className="metric-meta">
            <Status tone="danger">
              {stats.totalDevices - stats.online} 台离线
            </Status>
            <span>
              {stats.online} / {stats.totalDevices} 台
            </span>
          </div>
          <div className="device-mini-breakdown">
            {Object.entries(deviceLabels).map(([kind, label]) => (
              <span key={kind}>
                {label}
                <b>
                  {
                    data.devices.filter(
                      (d) => d.kind === kind && d.status === "online",
                    ).length
                  }
                  <small>
                    /{data.devices.filter((d) => d.kind === kind).length}
                  </small>
                </b>
              </span>
            ))}
          </div>
        </section>
        <section className="overview-card alert-overview">
          <div className="card-label">
            待处理预警
            <Bell size={18} />
          </div>
          <Link href="/alerts" className="metric-link">
            <div className={`big-metric ${stats.pending ? "danger-text" : ""}`}>
              <MetricNumber value={stats.pending} />
              <small>条</small>
            </div>
            <ArrowUpRight size={22} />
          </Link>
          <div className="metric-meta">
            <Status tone={stats.urgent ? "danger" : "success"}>
              {stats.urgent} 条紧急待核实
            </Status>
            <span>前往预警监测</span>
          </div>
          <div className="alert-ticks">
            {Array.from({ length: 20 }, (_, i) => (
              <i key={i} className={i < stats.pending * 4 ? "filled" : ""} />
            ))}
          </div>
        </section>
        <section className="overview-card care-overview">
          <div className="card-label">
            今日照护计划
            <HeartHandshake size={18} />
          </div>
          <div className="care-summary">
            <div className="big-metric">
              <MetricNumber value={stats.careDone} />
              <small>/ {stats.careTotal} 项</small>
            </div>
            <strong className="mono">
              {stats.careRate.toFixed(1)}
              <small>% 完成</small>
            </strong>
          </div>
          <div className="care-compact">
            {data.careTasks.map((task) => (
              <div key={task.id}>
                <span title={`${task.time} · ${task.owner}`}>{task.name}</span>
                <div className="progress-track">
                  <i
                    style={{ width: `${(task.completed / task.total) * 100}%` }}
                  />
                </div>
                <b>
                  {task.completed}
                  <small>/{task.total}</small>
                </b>
              </div>
            ))}
          </div>
        </section>
      </div>
      <FloorPlan />
    </>
  );
}
