"use client";
import { useState } from "react";
import { CalendarDays, Clock, MapPin, Users, ArrowUpRight } from "lucide-react";
import { useFacility } from "@/components/providers/facility-provider";
import { PageHeading, Status, EmptyState } from "@/components/shared/display";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { activityLabels, timeText, dateText } from "@/utils/format";
export function ActivitiesPage() {
  const { data } = useFacility();
  const [status, setStatus] = useState("active");
  const [selected, setSelected] = useState("");
  const filtered = data.activities
    .filter((a) =>
      status === "active"
        ? a.status !== "finished"
        : status === "all" || a.status === status,
    )
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const activity = data.activities.find((a) => a.id === selected);
  return (
    <>
      <PageHeading
        eyebrow="ACTIVITIES · A DAY WELL SPENT"
        title="让每一天，都有值得期待的相聚。"
        description="正在进行与已排期活动 · 演示排期基准：2026 年 10 月 18 日 14:32"
      />
      <div className="inline-stats">
        <div>
          <strong className="success-text">
            {data.activities.filter((a) => a.status === "ongoing").length}
          </strong>
          <span>正在进行</span>
        </div>
        <div>
          <strong>
            {data.activities.filter((a) => a.status === "scheduled").length}
          </strong>
          <span>已排期</span>
        </div>
        <div>
          <strong>
            {data.activities
              .filter((a) => a.status === "ongoing")
              .reduce((n, a) => n + a.participants, 0)}
          </strong>
          <span>正在参与人次</span>
        </div>
        <div>
          <strong>
            {data.activities.filter((a) => a.status === "finished").length}
          </strong>
          <span>今日已完成</span>
        </div>
      </div>
      <div className="list-toolbar activity-toolbar">
        <div>
          <h2>活动日程</h2>
          <p>以状态和排期查看，点击活动了解安排</p>
        </div>
        <div className="segmented" role="group" aria-label="活动状态筛选">
          {[
            { id: "active", label: "进行中与已排期" },
            { id: "ongoing", label: "进行中" },
            { id: "scheduled", label: "已排期" },
            { id: "all", label: "全部" },
          ].map((s) => (
            <button
              key={s.id}
              aria-pressed={status === s.id}
              onClick={() => setStatus(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
      <div className="activities-grid">
        {filtered.map((a) => (
          <button
            className={`activity-card ${a.status === "ongoing" ? "ongoing" : ""}`}
            key={a.id}
            onClick={() => setSelected(a.id)}
          >
            <div className="activity-top">
              <span className="eyebrow">
                {a.category} / {a.id}
              </span>
              <Status
                tone={
                  a.status === "ongoing"
                    ? "success"
                    : a.status === "scheduled"
                      ? "info"
                      : "neutral"
                }
              >
                {activityLabels[a.status]}
              </Status>
            </div>
            <div className="activity-date">
              <CalendarDays size={17} />
              {dateText(a.startsAt)}
              <span>
                {timeText(a.startsAt)} — {timeText(a.endsAt)}
              </span>
            </div>
            <h2>{a.title}</h2>
            <p className="activity-description">{a.description}</p>
            <div className="activity-place">
              <MapPin size={15} />
              {a.location}
            </div>
            <div className="activity-host">
              <span>负责人</span>
              <strong>{a.host}</strong>
            </div>
            <div className="activity-attendance">
              <span>
                <Users size={15} />
                {a.participants} / {a.capacity} 人
              </span>
              <span>
                {a.status === "ongoing" ? "现场参与" : "已报名"}
                <ArrowUpRight size={16} />
              </span>
            </div>
            <div className="progress-track">
              <i style={{ width: `${(a.participants / a.capacity) * 100}%` }} />
            </div>
          </button>
        ))}
      </div>
      {!filtered.length && <EmptyState>暂无该状态的活动</EmptyState>}
      {activity && (
        <Dialog
          open
          onOpenChange={(open) => {
            if (!open) setSelected("");
          }}
        >
          <DialogContent className="detail-dialog">
            <DialogHeader>
              <DialogTitle>{activity.title}</DialogTitle>
              <DialogDescription>
                {activity.id} · {activity.category} ·{" "}
                {activityLabels[activity.status]}
              </DialogDescription>
            </DialogHeader>
            <div className="detail-grid">
              <div>
                <span>
                  <Clock size={14} /> 活动时间
                </span>
                <strong>
                  {dateText(activity.startsAt)} {timeText(activity.startsAt)}—
                  {timeText(activity.endsAt)}
                </strong>
              </div>
              <div>
                <span>活动地点</span>
                <strong>{activity.location}</strong>
              </div>
              <div>
                <span>负责人</span>
                <strong>{activity.host}</strong>
              </div>
              <div>
                <span>参与人数 / 容量</span>
                <strong>
                  {activity.participants} / {activity.capacity} 人
                </strong>
              </div>
            </div>
            <p>{activity.description}</p>
            <p className="service-note">
              当前为活动展示与排期演示，未接入真实报名或签到。
            </p>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
