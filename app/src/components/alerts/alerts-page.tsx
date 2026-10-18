"use client";
import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Bell,
  ArrowRight,
  Check,
  ShieldCheck,
  MapPin,
  Radio,
} from "lucide-react";
import { useFacility } from "@/components/providers/facility-provider";
import {
  PageHeading,
  Status,
  SearchField,
  EmptyState,
} from "@/components/shared/display";
import { Button } from "@/components/ui/button";
import {
  alertLabels,
  alertStatusLabels,
  locationText,
  timeText,
} from "@/utils/format";
import type { AlertStatus } from "@/types/domain";
export function AlertsPage() {
  const { data, updateAlert } = useFacility();
  const params = useSearchParams();
  const [selected, setSelected] = useState(
    params.get("alert") ?? data.alerts[0]?.id ?? "",
  );
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [level, setLevel] = useState("all");
  const filtered = data.alerts.filter(
    (a) =>
      (status === "all" || a.status === status) &&
      (level === "all" || a.level === level) &&
      `${a.title} ${a.id} ${locationText(data.rooms.find((r) => r.id === a.roomId))} ${data.residents.find((r) => r.id === a.residentId)?.name ?? ""}`.includes(
        query,
      ),
  );
  const alert = filtered.find((a) => a.id === selected) ?? filtered[0];
  const room = data.rooms.find((r) => r.id === alert?.roomId);
  const person = data.residents.find((r) => r.id === alert?.residentId);
  const device = data.devices.find((d) => d.id === alert?.deviceId);
  function handleStatus(next: AlertStatus) {
    if (alert) updateAlert(alert.id, next);
  }
  return (
    <>
      <PageHeading
        eyebrow="ALERTS · RESPONSE & FOLLOW-UP"
        title="让预警有依据，让处理有回音。"
        description="从触发读数、房间位置到现场核实，查看每一条事件的完整信息"
      />
      <div className="inline-stats">
        {(["pending", "processing", "resolved"] as const).map((s) => (
          <button
            className={status === s ? "selected-stat" : ""}
            key={s}
            onClick={() => setStatus(status === s ? "all" : s)}
          >
            <strong className={s === "pending" ? "danger-text" : ""}>
              {data.alerts.filter((a) => a.status === s).length}
            </strong>
            <span>{alertStatusLabels[s]}</span>
          </button>
        ))}
        <div>
          <strong className="danger-text">
            {
              data.alerts.filter(
                (a) => a.level === "urgent" && a.status !== "resolved",
              ).length
            }
          </strong>
          <span>紧急待核实</span>
        </div>
      </div>
      <div className="alert-workspace">
        <section className="panel alert-list-panel">
          <div className="panel-heading">
            <h2>
              预警事件 <span className="muted">{filtered.length}</span>
            </h2>
            <Bell size={18} />
          </div>
          <div className="alert-filters">
            <SearchField
              value={query}
              onChange={setQuery}
              placeholder="搜索事件、房间或人员"
            />
            <div className="filters">
              <select
                aria-label="预警处理状态"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="all">全部处理状态</option>
                {Object.entries(alertStatusLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
              <select
                aria-label="预警级别"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
              >
                <option value="all">全部级别</option>
                {Object.entries(alertLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="event-list">
            {filtered.map((a) => (
              <button
                key={a.id}
                className={`event-row ${alert?.id === a.id ? "selected" : ""}`}
                onClick={() => setSelected(a.id)}
              >
                <div className="event-row-top">
                  <Status
                    tone={
                      a.status === "resolved"
                        ? "success"
                        : a.level === "urgent"
                          ? "danger"
                          : "info"
                    }
                  >
                    {alertLabels[a.level]} · {alertStatusLabels[a.status]}
                  </Status>
                  <time>{timeText(a.occurredAt)}</time>
                </div>
                <strong>{a.title}</strong>
                <p>{locationText(data.rooms.find((r) => r.id === a.roomId))}</p>
                <span className="event-evidence">{a.evidence}</span>
                <ArrowRight size={16} />
              </button>
            ))}
          </div>
          {!filtered.length && <EmptyState>当前筛选下没有预警</EmptyState>}
        </section>
        <section className="panel alert-detail" aria-label="预警详情">
          {alert ? (
            <>
              <div className="panel-heading">
                <span className="eyebrow">EVENT / {alert.id}</span>
                <Status
                  tone={
                    alert.status === "resolved"
                      ? "success"
                      : alert.level === "urgent"
                        ? "danger"
                        : "info"
                  }
                >
                  {alertStatusLabels[alert.status]}
                </Status>
              </div>
              <h2 className="event-title">{alert.title}</h2>
              <div className="event-context">
                <span>
                  <MapPin size={15} />
                  {locationText(room)}
                </span>
                <span>发生于 {timeText(alert.occurredAt)}</span>
              </div>
              <div className="evidence-block">
                <span className="section-label">触发依据 · 模拟设备记录</span>
                <strong>{alert.evidence}</strong>
                <p>触发规则：{alert.rule}</p>
              </div>
              <div className="detail-grid">
                <div>
                  <span>关联人员</span>
                  {person ? (
                    <Link
                      className="text-link"
                      href={`/residents?resident=${person.id}`}
                    >
                      {person.name} · {person.id} ↗
                    </Link>
                  ) : (
                    <strong>房间级事件，待现场核实</strong>
                  )}
                </div>
                <div>
                  <span>设备来源</span>
                  <Link
                    className="text-link mono"
                    href={`/devices?device=${alert.deviceId}`}
                  >
                    {alert.deviceId} ↗
                  </Link>
                </div>
                <div>
                  <span>安装位置</span>
                  <strong>{device?.installation}</strong>
                </div>
                <div>
                  <span>责任护理员</span>
                  <strong>{person?.caregiver ?? "楼层值班护理组"}</strong>
                </div>
              </div>
              <div className="guidance-block">
                <ShieldCheck size={18} />
                <div>
                  <h3>建议核实步骤</h3>
                  <p>{alert.guidance}</p>
                </div>
              </div>
              <div className="section-label">
                处理记录 <span>{alert.history.length} 条</span>
              </div>
              <ol className="event-history">
                {alert.history.map((item, index) => (
                  <li key={`${item.at}-${index}`}>
                    <i />
                    <time>{timeText(item.at)}</time>
                    <div>
                      <strong>{item.action}</strong>
                      <small>{item.actor}</small>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="alert-actions">
                {alert.status === "pending" && (
                  <Button
                    variant="outline"
                    onClick={() => handleStatus("processing")}
                  >
                    接手处理
                  </Button>
                )}
                {alert.status !== "resolved" ? (
                  <Button onClick={() => handleStatus("resolved")}>
                    <Check />
                    标记为已处理
                  </Button>
                ) : (
                  <Status tone="success">已完成模拟核实</Status>
                )}
              </div>
              <p className="small muted evidence-disclaimer">
                <Radio size={13} />{" "}
                演示事件与规则不构成医疗判断；真实现场需人工核实。
              </p>
            </>
          ) : (
            <EmptyState>选择预警后查看触发依据和处理记录</EmptyState>
          )}
        </section>
      </div>
    </>
  );
}
