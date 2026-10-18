"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  BedDouble,
  Bell,
  Building2,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clock3,
  Download,
  Droplets,
  Fullscreen,
  Heart,
  HeartPulse,
  LayoutDashboard,
  Leaf,
  Maximize2,
  Monitor,
  Pause,
  Play,
  Radio,
  RefreshCw,
  Settings2,
  ShieldCheck,
  Thermometer,
  TriangleAlert,
  Users,
  WifiOff,
  Wind,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CountingNumber } from "@/components/animate-ui/primitives/texts/counting-number";
import {
  initialAlerts,
  makeRooms,
  makeTrend,
  seeded,
  devices,
  type Alert,
} from "./mock-data";
import { TrendChart } from "./trend-chart";

type Room = ReturnType<typeof makeRooms>[number];
function MetricNumber(props: React.ComponentProps<typeof CountingNumber>) {
  const reducedMotion = useReducedMotion();
  return reducedMotion ? (
    <span>{props.number.toFixed(props.decimalPlaces ?? 0)}</span>
  ) : (
    <CountingNumber {...props} />
  );
}
type Modal =
  | { type: "room"; room: Room; building: string; floor: number }
  | { type: "alert"; alert: Alert }
  | { type: "settings" }
  | { type: "help" }
  | { type: "devices" }
  | null;

function IconButton({
  icon: Icon,
  label,
  onClick,
  className = "",
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className={className}
            onClick={onClick}
            aria-label={label}
          />
        }
      >
        <Icon size={18} />
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
function SectionTitle({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="section-title">
      <div className="section-heading">
        <Icon size={16} />
        <h2>{title}</h2>
        {subtitle && <span className="section-subtitle">{subtitle}</span>}
      </div>
      {children}
    </div>
  );
}

export function Dashboard() {
  const [floor, setFloor] = useState(2);
  const [building, setBuilding] = useState("A");
  const [period, setPeriod] = useState<"day" | "week">("day");
  const [alerts, setAlerts] = useState(initialAlerts);
  const [alertTab, setAlertTab] = useState<"pending" | "handled">("pending");
  const [modal, setModal] = useState<Modal>(null);
  const [live, setLive] = useState(true);
  const [interval, setRefreshInterval] = useState(12);
  const [tick, setTick] = useState(0);
  const [clock, setClock] = useState<Date | null>(null);
  const [toast, setToast] = useState("");
  const [activeSection, setActiveSection] = useState("overview");
  const reduceMotion = useReducedMotion();
  const pending = alerts.filter((a) => !a.handled);
  const rooms = useMemo(() => makeRooms(floor, building), [floor, building]);
  const trendSummary = useMemo(() => {
    const points = makeTrend(period, tick);
    return {
      heart: Math.round(
        points.reduce((sum, p) => sum + p.heart, 0) / points.length,
      ),
      breath: Math.round(
        points.reduce((sum, p) => sum + p.breath, 0) / points.length,
      ),
    };
  }, [period, tick]);
  const visibleAlerts = alerts.filter((a) =>
    alertTab === "pending" ? !a.handled : a.handled,
  );
  const occupied = rooms.reduce((total, room) => total + room.occupied, 0);
  const totalOnline = devices.reduce((sum, device) => sum + device.online, 0);
  const totalDevices = devices.reduce((sum, device) => sum + device.total, 0);
  useEffect(() => {
    const update = () => setClock(new Date());
    update();
    const id = window.setInterval(update, 1000);
    return () => window.clearInterval(id);
  }, []);
  useEffect(() => {
    if (!live) return;
    const id = window.setInterval(() => {
      if (!document.hidden) setTick((t) => t + 1);
    }, interval * 1000);
    return () => window.clearInterval(id);
  }, [live, interval]);
  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(id);
  }, [toast]);
  const roomAlert = (number: string, currentBuilding = building) =>
    currentBuilding === "A"
      ? pending.find((a) => a.room === number)
      : undefined;
  const handleAlert = (id: number) => {
    setAlerts((previous) =>
      previous.map((a) => (a.id === id ? { ...a, handled: true } : a)),
    );
    setModal(null);
    setToast("模拟预警已处理，已同步更新房间状态");
  };
  const navigate = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({
      behavior: reduceMotion ? "instant" : "smooth",
      block: "center",
    });
  };
  const fullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      setToast("当前浏览器不支持全屏，请使用 F11 展示");
    }
  };
  const exportReport = () => {
    const lines = [
      "类型,项目,数值,说明",
      "概览,在院长者,168,模拟数据",
      `概览,待处理预警,${pending.length},模拟数据`,
      `设备,在线设备,${totalOnline}/${totalDevices},模拟数据`,
      ...alerts.map(
        (a) =>
          `预警,${a.title},${a.handled ? "已处理" : "待处理"},A栋${a.room}室`,
      ),
    ];
    const url = URL.createObjectURL(
      new Blob(["\uFEFF" + lines.join("\r\n")], {
        type: "text/csv;charset=utf-8;",
      }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "养老院运行概览-模拟数据.csv";
    link.click();
    URL.revokeObjectURL(url);
    setToast("模拟数据报告已导出");
  };
  return (
    <TooltipProvider delay={200}>
      <div className="dashboard-shell">
        <aside className="sidebar" aria-label="页面分区导航">
          <a href="#overview" className="brand-mark" aria-label="颐安首页">
            <Leaf size={25} strokeWidth={1.7} />
          </a>
          <div className="sidebar-divider" />
          <nav>
            {(
              [
                { id: "overview", icon: LayoutDashboard, label: "运行总览" },
                { id: "health", icon: HeartPulse, label: "健康趋势" },
                { id: "rooms", icon: Building2, label: "房间监测" },
                { id: "alerts", icon: Bell, label: "预警中心" },
                { id: "devices", icon: Monitor, label: "设备状态" },
              ] as const
            ).map(({ id, icon: Icon, label }) => (
              <IconButton
                key={id}
                icon={Icon}
                label={label}
                onClick={() => navigate(id)}
                className={`nav-icon ${activeSection === id ? "active" : ""}`}
              />
            ))}
          </nav>
          <div className="sidebar-bottom">
            <IconButton
              icon={CircleHelp}
              label="演示说明"
              onClick={() => setModal({ type: "help" })}
            />
            <IconButton
              icon={Settings2}
              label="展示设置"
              onClick={() => setModal({ type: "settings" })}
            />
            <div className="avatar" title="模拟值班账户">
              林
            </div>
          </div>
        </aside>
        <div className="workspace" id="overview">
          <header className="topbar">
            <div className="wordmark">
              颐安
              <span className="wordmark-line" />
              <span>智慧养老</span>
              <span className="platform-label">综合监测平台</span>
            </div>
            <div className="topbar-right">
              <span className="system-state">
                <i className="status-dot" />
                演示系统运行中
              </span>
              <span className="topbar-divider" />
              <span className="date-text">
                {clock
                  ? clock
                      .toLocaleDateString("zh-CN", {
                        timeZone: "Asia/Shanghai",
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                      })
                      .replaceAll("/", ".")
                  : "—"}
              </span>
              <time className="digital-clock">
                {clock
                  ? clock.toLocaleTimeString("zh-CN", {
                      timeZone: "Asia/Shanghai",
                      hour12: false,
                    })
                  : "--:--:--"}
              </time>
              <IconButton
                icon={Maximize2}
                label="切换全屏"
                onClick={fullscreen}
              />
            </div>
          </header>
          <main>
            <div className="page-heading">
              <div>
                <div className="eyebrow">
                  <span />
                  CARE · CONNECT · COMPANION
                </div>
                <h1>
                  让每一份关怀，都被看见
                  <span className="heading-period">.</span>
                </h1>
                <p>
                  养老院智能监测总览<span className="inline-dot">·</span>
                  守护日常，安心常在
                </p>
              </div>
              <div className="heading-actions">
                <span className="demo-badge">
                  <Radio size={12} />
                  模拟数据
                </span>
                <Button variant="outline" onClick={exportReport}>
                  <Download />
                  导出概览
                </Button>
                <Button className="display-button" onClick={fullscreen}>
                  <Fullscreen />
                  大屏展示
                </Button>
              </div>
            </div>
            <div className="overview-context">
              <span>
                <Building2 size={14} />
                颐安康养中心 <span className="context-tag">全院</span>
              </span>
              <span className="update-label">
                <i className={`status-dot ${live ? "pulse" : "paused"}`} />
                {live ? `每 ${interval} 秒自动更新` : "自动更新已暂停"}
                <button
                  onClick={() => setLive((v) => !v)}
                  aria-label={live ? "暂停自动更新" : "恢复自动更新"}
                >
                  {live ? <Pause size={12} /> : <Play size={12} />}
                </button>
              </span>
            </div>
            <section className="stats-grid" aria-label="全院关键指标">
              <article className="stat-card">
                <div className="stat-label">
                  在院长者
                  <Users size={17} />
                </div>
                <div className="stat-value">
                  <MetricNumber number={168} initiallyStable />
                  <span>人</span>
                </div>
                <div className="stat-bottom">
                  <span>
                    <ArrowUpRight size={13} />
                    较上月 +8 人
                  </span>
                  <span className="muted">床位入住率 65.6%</span>
                </div>
                <div className="mini-progress">
                  <span style={{ width: "65.6%" }} />
                </div>
              </article>
              <article className="stat-card">
                <div className="stat-label">
                  健康监测覆盖
                  <HeartPulse size={17} />
                </div>
                <div className="stat-value">
                  <MetricNumber
                    number={98.8}
                    decimalPlaces={1}
                    initiallyStable
                  />
                  <span>%</span>
                  <span className="stat-inline-tag">持续守护</span>
                </div>
                <div className="stat-bottom">
                  <span>166 / 168 人佩戴设备</span>
                  <span className="tiny-wave">▁▂▁▃▆▂▁▂▅▂▁</span>
                </div>
                <div className="mini-progress">
                  <span style={{ width: "98.8%" }} />
                </div>
              </article>
              <article className="stat-card alert-stat">
                <div className="stat-label">
                  待处理预警
                  <TriangleAlert size={17} />
                </div>
                <div className="stat-value">
                  <MetricNumber number={pending.length} initiallyStable />
                  <span>条</span>
                  <button
                    onClick={() => navigate("alerts")}
                    className="stat-link"
                    aria-label="查看待处理预警"
                  >
                    <ArrowUpRight size={23} />
                  </button>
                </div>
                <div className="stat-bottom">
                  <span className="strong">
                    {pending.filter((a) => a.level === "紧急").length}{" "}
                    条紧急待核实
                  </span>
                  <span className="muted">其余请及时关注</span>
                </div>
                <div className="mini-progress segments">
                  {Array.from({ length: 18 }, (_, i) => (
                    <span
                      key={i}
                      className={i < pending.length * 3 ? "lit" : ""}
                    />
                  ))}
                </div>
              </article>
              <article className="stat-card">
                <div className="stat-label">
                  今日护理完成
                  <ShieldCheck size={17} />
                </div>
                <div className="stat-value">
                  <MetricNumber
                    number={92.5}
                    decimalPlaces={1}
                    initiallyStable
                  />
                  <span>%</span>
                </div>
                <div className="stat-bottom">
                  <span>
                    <CheckCheck size={13} />
                    已完成 148 项
                  </span>
                  <span className="muted">共 160 项计划</span>
                </div>
                <div className="mini-progress">
                  <span style={{ width: "92.5%" }} />
                </div>
              </article>
            </section>
            <div className="primary-grid">
              <section className="panel floor-panel" id="rooms">
                <SectionTitle
                  icon={Building2}
                  title="院区实时监测"
                  subtitle="SPATIAL OVERVIEW"
                >
                  <label className="select-wrap">
                    <select
                      aria-label="选择楼栋"
                      value={building}
                      onChange={(e) => setBuilding(e.target.value)}
                    >
                      <option value="A">A 栋 · 颐养楼</option>
                      <option value="B">B 栋 · 康养楼</option>
                    </select>
                    <ChevronDown size={13} />
                  </label>
                </SectionTitle>
                <div className="floor-toolbar">
                  <div
                    className="floor-tabs"
                    role="tablist"
                    aria-label="选择楼层"
                  >
                    {[1, 2, 3, 4].map((f) => (
                      <button
                        key={f}
                        role="tab"
                        aria-selected={f === floor}
                        className={f === floor ? "selected" : ""}
                        onClick={() => setFloor(f)}
                      >
                        {f}F
                        <span>
                          {
                            ["活力生活", "安心颐养", "专业照护", "康复疗养"][
                              f - 1
                            ]
                          }
                        </span>
                      </button>
                    ))}
                  </div>
                  <span className="floor-count">
                    {occupied}
                    <span> / 32 床入住</span>
                  </span>
                </div>
                <div className="floor-map">
                  <div className="map-corner corner-tl" />
                  <div className="map-corner corner-br" />
                  <div className="map-label">
                    <span>
                      {building} / {String(floor).padStart(2, "0")}
                    </span>
                    <span>楼层感知平面图</span>
                  </div>
                  <div className="floor-plan">
                    <div className="plan-side">
                      <div className="staircase">
                        <span>疏散楼梯</span>
                        <div className="stairs" />
                      </div>
                      <div className="nurse-station">
                        <ShieldCheck size={21} />
                        <span>护理站</span>
                        <small>NURSE STATION</small>
                      </div>
                      <div className="lift">
                        <span>电梯厅</span>
                        <span>↑ ↓</span>
                      </div>
                    </div>
                    <div className="room-wing">
                      <div className="room-row">
                        {rooms.slice(0, 8).map((room) => (
                          <RoomCell
                            key={room.number}
                            room={room}
                            alert={roomAlert(room.number)}
                            onClick={() =>
                              setModal({ type: "room", room, building, floor })
                            }
                          />
                        ))}
                      </div>
                      <div className="corridor">
                        <span className="corridor-line" />
                        <span>
                          <span className="live-pin" />
                          公共活动走廊
                        </span>
                        <span className="corridor-line" />
                        <ArrowRight size={14} />
                      </div>
                      <div className="room-row bottom-row">
                        {rooms.slice(8).map((room) => (
                          <RoomCell
                            key={room.number}
                            room={room}
                            alert={roomAlert(room.number)}
                            onClick={() =>
                              setModal({ type: "room", room, building, floor })
                            }
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="map-caption">
                    <span>
                      <i className="legend-square normal" />
                      正常监测
                    </span>
                    <span>
                      <i className="legend-square attention" />
                      需要关注
                    </span>
                    <span>
                      <i className="legend-square offline" />
                      设备离线
                    </span>
                    <span className="map-hint">
                      点击房间查看详情 <ArrowUpRight size={12} />
                    </span>
                  </div>
                </div>
                <div className="environment-strip">
                  <div>
                    <Thermometer />
                    <span>
                      楼层均温
                      <strong>
                        {(
                          rooms.reduce((sum, r) => sum + r.temperature, 0) /
                            rooms.length +
                          (tick ? seeded(tick) * 0.2 : 0)
                        ).toFixed(1)}
                        <small> °C</small>
                      </strong>
                    </span>
                    <span className="env-status">舒适</span>
                  </div>
                  <div>
                    <Droplets />
                    <span>
                      相对湿度
                      <strong>
                        {Math.round(
                          rooms.reduce((sum, r) => sum + r.humidity, 0) /
                            rooms.length,
                        )}
                        <small> %</small>
                      </strong>
                    </span>
                    <span className="env-status">适宜</span>
                  </div>
                  <div>
                    <Wind />
                    <span>
                      空气质量 · PM2.5
                      <strong>
                        {Math.round(12 + seeded(tick + floor) * 5)}
                        <small> μg/m³</small>
                      </strong>
                    </span>
                    <span className="env-status">优</span>
                  </div>
                </div>
              </section>
              <section className="panel alerts-panel" id="alerts">
                <SectionTitle icon={Bell} title="实时预警">
                  <span className="count-badge">{pending.length}</span>
                </SectionTitle>
                <div
                  className="alert-tabs"
                  role="tablist"
                  aria-label="预警状态"
                >
                  <button
                    role="tab"
                    aria-selected={alertTab === "pending"}
                    className={alertTab === "pending" ? "selected" : ""}
                    onClick={() => setAlertTab("pending")}
                  >
                    待处理 <span>{pending.length}</span>
                  </button>
                  <button
                    role="tab"
                    aria-selected={alertTab === "handled"}
                    className={alertTab === "handled" ? "selected" : ""}
                    onClick={() => setAlertTab("handled")}
                  >
                    已处理 <span>{alerts.filter((a) => a.handled).length}</span>
                  </button>
                </div>
                <div className="alert-list">
                  {visibleAlerts.length ? (
                    visibleAlerts.map((alert) => (
                      <button
                        key={alert.id}
                        className={`alert-item ${alert.level === "紧急" && !alert.handled ? "urgent" : ""}`}
                        onClick={() => setModal({ type: "alert", alert })}
                      >
                        <div className="alert-symbol">
                          {alert.handled ? (
                            <Check size={17} />
                          ) : alert.level === "设备" ? (
                            <WifiOff size={17} />
                          ) : alert.level === "紧急" ? (
                            <TriangleAlert size={17} />
                          ) : (
                            <Activity size={17} />
                          )}
                        </div>
                        <div className="alert-copy">
                          <div>
                            <span className="alert-level">
                              {alert.handled ? "已处理" : alert.level}
                            </span>
                            <time>{alert.time}</time>
                          </div>
                          <h3>{alert.title}</h3>
                          <p>
                            A 栋 · {alert.floor}F · {alert.room} 室
                          </p>
                        </div>
                        <ChevronRight size={15} className="alert-chevron" />
                      </button>
                    ))
                  ) : (
                    <div className="empty-state">
                      <ShieldCheck size={30} />
                      <strong>
                        {alertTab === "pending"
                          ? "所有预警已处理"
                          : "暂无已处理预警"}
                      </strong>
                      <p>
                        {alertTab === "pending"
                          ? "感谢您的每一次及时关怀"
                          : "处理后的模拟预警将在这里展示"}
                      </p>
                    </div>
                  )}
                </div>
                <div className="alert-footer">
                  <ShieldCheck size={13} />
                  <span>模拟事件仅供演示，现场情况请人工核实</span>
                </div>
              </section>
            </div>
            <div className="secondary-grid">
              <section className="panel health-panel" id="health">
                <SectionTitle icon={HeartPulse} title="长者健康趋势">
                  <div className="segmented-control">
                    <button
                      className={period === "day" ? "selected" : ""}
                      onClick={() => setPeriod("day")}
                      aria-pressed={period === "day"}
                    >
                      今日
                    </button>
                    <button
                      className={period === "week" ? "selected" : ""}
                      onClick={() => setPeriod("week")}
                      aria-pressed={period === "week"}
                    >
                      本周
                    </button>
                  </div>
                </SectionTitle>
                <div className="health-summary">
                  <div>
                    <span className="chart-legend solid" />
                    平均心率<strong>{trendSummary.heart}</strong>
                    <span>次/分</span>
                  </div>
                  <div>
                    <span className="chart-legend dashed" />
                    平均呼吸
                    <strong>{trendSummary.breath}</strong>
                    <span>次/分</span>
                  </div>
                  <span className="health-note">
                    全院佩戴设备长者 · 模拟均值
                  </span>
                </div>
                <TrendChart
                  period={period}
                  tick={tick}
                  reducedMotion={!!reduceMotion}
                />
              </section>
              <section className="panel care-panel">
                <SectionTitle icon={Heart} title="今日照护计划">
                  <span className="quiet-tag">全院</span>
                </SectionTitle>
                <div className="care-total">
                  <div>
                    <strong>
                      148<span>/160</span>
                    </strong>
                    <p>已完成照护任务</p>
                  </div>
                  <div
                    className="care-ring"
                    role="img"
                    aria-label="今日照护计划完成率92.5%"
                  >
                    <span>
                      92.5<small>%</small>
                    </span>
                  </div>
                </div>
                <div className="care-items">
                  {[
                    { name: "日常巡房", done: 64, total: 64 },
                    { name: "健康测量", done: 42, total: 48 },
                    { name: "用药提醒", done: 28, total: 32 },
                    { name: "康复训练", done: 14, total: 16 },
                  ].map((item) => (
                    <div className="care-item" key={item.name}>
                      <span>{item.name}</span>
                      <div className="care-progress">
                        <span
                          style={{
                            width: `${(item.done / item.total) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="care-fraction">
                        {item.done}
                        <small> / {item.total}</small>
                      </span>
                      {item.done === item.total ? (
                        <Check size={12} />
                      ) : (
                        <Clock3 size={12} />
                      )}
                    </div>
                  ))}
                </div>
              </section>
              <section className="panel device-panel" id="devices">
                <SectionTitle icon={Monitor} title="设备运行状态">
                  <IconButton
                    icon={ArrowUpRight}
                    label="查看设备汇总"
                    onClick={() => setModal({ type: "devices" })}
                  />
                </SectionTitle>
                <div className="device-total">
                  <div>
                    <strong>
                      {((totalOnline / totalDevices) * 100).toFixed(1)}
                      <span>%</span>
                    </strong>
                    <p>
                      <i className="status-dot" />
                      设备在线率
                    </p>
                  </div>
                  <div className="device-bars" aria-hidden="true">
                    {Array.from({ length: 24 }, (_, i) => (
                      <span
                        key={i}
                        className={i > 22 ? "dim" : ""}
                        style={{ height: `${20 + seeded(i + 5) * 26}px` }}
                      />
                    ))}
                  </div>
                </div>
                <div className="device-items">
                  {devices.map((device) => (
                    <div key={device.name}>
                      <span>
                        <i className="device-dot" />
                        {device.name}
                      </span>
                      <span>
                        {device.online}
                        <small> / {device.total}</small>
                        <span className="device-offline">
                          {device.total - device.online} 离线
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
            <footer className="dashboard-footer">
              <span>
                <Leaf size={12} />
                颐安 YI&apos;AN<span className="footer-slash">/</span>
                科技有温度，养老有安心
              </span>
              <span>
                <i className="status-dot" />
                本地模拟演示<span className="footer-slash">·</span>
                数据不用于实际监护决策
              </span>
              <span>
                三创赛 · 银发经济主题项目
                <span className="version-label">DEMO 1.0</span>
              </span>
            </footer>
          </main>
        </div>
        <Dialog
          open={!!modal}
          onOpenChange={(open) => {
            if (!open) setModal(null);
          }}
        >
          <DialogContent className="dashboard-dialog sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {modal?.type === "room"
                  ? `${modal.building} 栋 · ${modal.room.number} 室`
                  : modal?.type === "alert"
                    ? "预警详情"
                    : modal?.type === "settings"
                      ? "展示设置"
                      : modal?.type === "devices"
                        ? "设备汇总"
                        : "关于此演示"}
              </DialogTitle>
              <DialogDescription>颐安智慧养老 · 模拟数据演示</DialogDescription>
            </DialogHeader>
            {modal?.type === "room" && (
              <>
                <div className="detail-status">
                  <BedDouble size={18} />
                  <span>
                    入住 {modal.room.occupied} 人 / {modal.room.beds} 床
                  </span>
                  <span className="quiet-tag">
                    {roomAlert(modal.room.number, modal.building)
                      ? "需要关注"
                      : "正常监测"}
                  </span>
                </div>
                <div className="detail-grid">
                  <div>
                    <span>室内温度</span>
                    <strong>
                      {roomAlert(modal.room.number, modal.building)?.level ===
                      "设备"
                        ? "—"
                        : `${modal.room.temperature} °C`}
                    </strong>
                  </div>
                  <div>
                    <span>相对湿度</span>
                    <strong>
                      {roomAlert(modal.room.number, modal.building)?.level ===
                      "设备"
                        ? "—"
                        : `${modal.room.humidity}%`}
                    </strong>
                  </div>
                  <div>
                    <span>模拟平均心率</span>
                    <strong>
                      {modal.building === "A" &&
                      modal.room.number === "305" &&
                      roomAlert("305", "A")
                        ? 106
                        : modal.room.heartRate}{" "}
                      次/分
                    </strong>
                  </div>
                  <div>
                    <span>楼层责任岗位</span>
                    <strong>{modal.floor}F 护理站</strong>
                  </div>
                </div>
                {roomAlert(modal.room.number, modal.building) && (
                  <Button
                    onClick={() =>
                      setModal({
                        type: "alert",
                        alert: roomAlert(modal.room.number, modal.building)!,
                      })
                    }
                  >
                    查看关联预警
                    <ArrowRight />
                  </Button>
                )}
                <p className="dialog-note">
                  读数由模拟器生成。房间布局为示意，不代表实际院区。
                </p>
              </>
            )}
            {modal?.type === "alert" && (
              <>
                <div className="detail-status">
                  <TriangleAlert size={18} />
                  <strong>{modal.alert.title}</strong>
                  <span className="quiet-tag">
                    {modal.alert.handled ? "已处理" : modal.alert.level}
                  </span>
                </div>
                <p className="alert-detail-text">{modal.alert.detail}</p>
                <div className="detail-grid">
                  <div>
                    <span>发生位置</span>
                    <strong>A 栋 {modal.alert.room} 室</strong>
                  </div>
                  <div>
                    <span>演示事件时间</span>
                    <strong>{modal.alert.time}</strong>
                  </div>
                </div>
                <div className="dialog-actions">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setBuilding("A");
                      setFloor(modal.alert.floor);
                      setModal(null);
                      navigate("rooms");
                    }}
                  >
                    定位房间
                    <Building2 />
                  </Button>
                  {!modal.alert.handled && (
                    <Button onClick={() => handleAlert(modal.alert.id)}>
                      <CheckCheck />
                      标记为已处理
                    </Button>
                  )}
                </div>
              </>
            )}
            {modal?.type === "settings" && (
              <>
                <div className="settings-row">
                  <div>
                    <strong>自动刷新模拟读数</strong>
                    <p>暂停后仍可使用页面内交互</p>
                  </div>
                  <Button variant="outline" onClick={() => setLive((v) => !v)}>
                    {live ? <Pause /> : <Play />}
                    {live ? "暂停" : "开启"}
                  </Button>
                </div>
                <label className="settings-row">
                  <span>数据刷新间隔</span>
                  <select
                    value={interval}
                    onChange={(e) => setRefreshInterval(Number(e.target.value))}
                  >
                    <option value={5}>5 秒</option>
                    <option value={12}>12 秒</option>
                    <option value={30}>30 秒</option>
                  </select>
                </label>
                <Button
                  variant="outline"
                  onClick={() => {
                    setTick((t) => t + 1);
                    setToast("模拟读数已刷新");
                  }}
                >
                  <RefreshCw />
                  立即刷新
                </Button>
                <p className="dialog-note">
                  页面隐藏时自动停止模拟数据刷新。此设置仅在本次打开期间生效。
                </p>
              </>
            )}
            {modal?.type === "devices" && (
              <>
                <p className="alert-detail-text">
                  全院共 {totalDevices} 台模拟设备，{totalOnline} 台在线，
                  {totalDevices - totalOnline} 台离线。
                </p>
                <div className="device-details">
                  {devices.map((d) => (
                    <div key={d.name}>
                      <Monitor size={18} />
                      <div>
                        <strong>{d.name}</strong>
                        <p>{d.label}</p>
                      </div>
                      <span>
                        {d.online} / {d.total} 在线
                      </span>
                    </div>
                  ))}
                </div>
                <p className="dialog-note">
                  设备列表为类型汇总，尚未连接真实物联网设备。
                </p>
              </>
            )}
            {modal?.type === "help" && (
              <>
                <p className="alert-detail-text">
                  此页面是银发经济主题的养老院智能监控原型。可切换楼栋和楼层、点击房间查看模拟读数、处理预警，并导出概览。
                </p>
                <div className="help-points">
                  <p>
                    <Radio size={16} />
                    所有人员、读数、任务与预警均为模拟数据。
                  </p>
                  <p>
                    <ShieldCheck size={16} />
                    “已处理”仅改变本次演示状态，刷新页面会重置。
                  </p>
                  <p>
                    <Fullscreen size={16} />
                    点击“大屏展示”进入全屏，按 Esc 退出。
                  </p>
                </div>
                <p className="dialog-note">
                  当前范围为单页面前端原型，无真实监护、视频接入或医疗诊断能力。
                </p>
              </>
            )}
          </DialogContent>
        </Dialog>
        {toast && (
          <div role="status" className="toast">
            <Check size={16} />
            {toast}
            <button onClick={() => setToast("")} aria-label="关闭提示">
              <X size={14} />
            </button>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
function RoomCell({
  room,
  alert,
  onClick,
}: {
  room: Room;
  alert?: Alert;
  onClick: () => void;
}) {
  return (
    <button
      className={`room-cell ${alert?.level === "设备" ? "offline-room" : alert ? "attention-room" : ""}`}
      onClick={onClick}
      aria-label={`${room.number}室，${room.occupied}人入住，${alert ? alert.title : "正常监测"}`}
    >
      <div className="room-number">
        {room.number}
        {alert &&
          (alert.level === "设备" ? (
            <WifiOff size={11} />
          ) : (
            <TriangleAlert size={11} />
          ))}
      </div>
      <div className="bed-icons">
        <BedDouble size={19} strokeWidth={1.1} />
        <BedDouble
          size={19}
          strokeWidth={1.1}
          className={room.occupied < 2 ? "empty-bed" : ""}
        />
      </div>
      <span className="room-status">
        {alert
          ? alert.level === "设备"
            ? "设备离线"
            : "待关注"
          : `${room.occupied} 人入住`}
      </span>
      <span className="room-door" />
    </button>
  );
}
