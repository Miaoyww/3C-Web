"use client";
import Link from "next/link";
import { useState } from "react";
import type { BuildingId } from "@/types/domain";
import { useFacility } from "@/components/providers/facility-provider";
import { Panel, Status, Avatar } from "@/components/shared/display";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { locationText } from "@/utils/format";

export function FloorPlan() {
  const { data } = useFacility();
  const [building, setBuilding] = useState<BuildingId>("A");
  const [floor, setFloor] = useState(1);
  const [selected, setSelected] = useState("");
  const rooms = data.rooms.filter(
    (r) => r.building === building && r.floor === floor,
  );
  const people = data.residents.filter((r) =>
    rooms.some((room) => room.id === r.roomId),
  );
  const room = data.rooms.find((r) => r.id === selected);
  const members = data.residents.filter((r) => r.roomId === selected);
  const roomAlerts = data.alerts.filter(
    (a) => a.roomId === selected && a.status !== "resolved",
  );
  const environment = data.devices.find(
    (d) => d.roomId === selected && d.kind === "environment",
  );
  return (
    <Panel
      title="院区实时监测"
      eyebrow="FLOOR PLAN · 楼层平面示意"
      className="floor-panel"
      action={
        <select
          aria-label="选择楼栋"
          value={building}
          onChange={(e) => setBuilding(e.target.value as BuildingId)}
        >
          <option value="A">A 栋 · 颐养楼</option>
          <option value="B">B 栋 · 康宁楼</option>
        </select>
      }
    >
      <div className="floor-toolbar">
        <div className="segmented" role="tablist" aria-label="楼层选择">
          {["活力生活", "安心颐养", "专业照护", "康复疗养"].map(
            (label, index) => (
              <button
                role="tab"
                aria-selected={floor === index + 1}
                key={label}
                onClick={() => setFloor(index + 1)}
              >
                {index + 1}F <span>{label}</span>
              </button>
            ),
          )}
        </div>
        <span className="muted">
          <strong className="mono">{people.length}</strong> / 32 床入住
        </span>
      </div>
      <div className="floor-canvas">
        <div className="map-caption">
          <span>
            {building} / {String(floor).padStart(2, "0")} <b>居住层平面图</b>
          </span>
          <span>示意布局 · 非建筑施工图</span>
        </div>
        <div className="floor-scroll">
          <svg
            className="floor-svg"
            viewBox="0 0 1420 610"
            aria-label={`${building} 栋 ${floor} 楼建筑平面图，16 间居室`}
          >
            <defs>
              <pattern
                id="floor-grid"
                width="20"
                height="20"
                patternUnits="userSpaceOnUse"
              >
                <circle cx="1" cy="1" r="0.7" fill="var(--map-dot)" />
              </pattern>
            </defs>
            <rect width="1420" height="610" fill="url(#floor-grid)" />
            <path
              className="building-fill"
              d="M180 65 H1340 V545 H180 V405 H35 V205 H180 Z"
            />
            <rect
              className="corridor-fill"
              x="180"
              y="260"
              width="1160"
              height="90"
            />
            <path
              className="outer-wall"
              d="M180 205 V65 H1340 V545 H180 V405 H35 V205 H180"
            />
            <path
              className="wall"
              d="M180 205 V260 M180 350 V405 M35 305 H180 M110 205 V305 M110 350 V405"
            />
            <text className="map-label" x="74" y="225">
              楼梯
            </text>
            {Array.from({ length: 8 }, (_, i) => (
              <path
                key={i}
                className="stair-line"
                d={`M46 ${236 + i * 7} H98`}
              />
            ))}
            <path className="map-arrow" d="M73 291 V244 m-5 6 5-6 5 6" />
            <rect x="122" y="231" width="44" height="48" className="fixture" />
            <path
              className="fixture-line"
              d="M144 232 V279 M126 236 l18 19 M162 236 l-18 19"
            />
            <text className="map-tiny" x="144" y="294">
              电梯
            </text>
            <text className="map-label" x="73" y="345">
              护理站
            </text>
            <path
              className="fixture-line"
              d="M50 359 H96 V388 H50 Z M50 370 H96"
            />
            <text className="map-tiny" x="145" y="380">
              茶水间
            </text>
            <text className="corridor-label" x="755" y="310">
              公 共 走 廊　　/　　无 障 碍 通 行
            </text>
            <path
              className="corridor-guide"
              d="M220 305 H450 M1070 305 H1300 m-8-5 8 5-8 5"
            />
            {rooms.map((room, index) => {
              const top = index < 8;
              const x = 180 + (index % 8) * 145;
              const y = top ? 65 : 350;
              const h = 195;
              const residents = data.residents.filter(
                (r) => r.roomId === room.id,
              );
              const alerts = data.alerts.filter(
                (a) => a.roomId === room.id && a.status !== "resolved",
              );
              const offline = data.devices.some(
                (d) => d.roomId === room.id && d.status === "offline",
              );
              const status = alerts.length
                ? "需要关注"
                : offline
                  ? "设备离线"
                  : "正常监测";
              const doorY = top ? y + h : y;
              const doorEnd = top ? doorY - 35 : doorY + 35;
              return (
                <g
                  key={room.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`${room.number}室，${residents.length}人入住，${status}`}
                  className={`plan-room ${alerts.length ? "has-alert" : ""}`}
                  onClick={() => setSelected(room.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelected(room.id);
                    }
                  }}
                >
                  <title>{`${room.number} 室 · ${residents.map((r) => r.name).join("、")} · ${status}`}</title>
                  <rect
                    className="room-floor"
                    x={x + 3}
                    y={y + 3}
                    width="139"
                    height="189"
                  />
                  <path
                    className="wall"
                    d={
                      top
                        ? `M${x} ${y + h} V${y} H${x + 145} V${y + h} H${x + 130} M${x + 95} ${y + h} H${x}`
                        : `M${x} ${y} V${y + h} H${x + 145} V${y} H${x + 130} M${x + 95} ${y} H${x}`
                    }
                  />
                  <path
                    className="window-cut"
                    d={`M${x + 25} ${top ? y : y + h} H${x + 85}`}
                  />
                  <path
                    className="window-line"
                    d={`M${x + 25} ${top ? y : y + h} H${x + 85}`}
                  />
                  <path
                    className="door-line"
                    d={`M${x + 95} ${doorY} V${doorEnd} M${x + 130} ${doorY} A35 35 0 0 ${top ? 0 : 1} ${x + 95} ${doorEnd}`}
                  />
                  <path
                    className="fixture-line"
                    d={
                      top
                        ? `M${x + 103} ${y} V${y + 58} H${x + 145} M${x + 103} ${y + 32} H${x + 126}`
                        : `M${x + 103} ${y + h} V${y + h - 58} H${x + 145} M${x + 103} ${y + h - 32} H${x + 126}`
                    }
                  />
                  <text
                    className="map-tiny"
                    x={x + 124}
                    y={top ? y + 21 : y + h - 15}
                  >
                    卫
                  </text>
                  {[0, 1].map((bed) => (
                    <g
                      key={bed}
                      transform={`translate(${x + 17 + bed * 43} ${top ? y + 84 : y + 65})`}
                    >
                      <rect
                        className={`bed-fixture ${bed >= residents.length ? "empty-bed" : ""}`}
                        width="28"
                        height="47"
                        rx="2"
                      />
                      <path
                        className="fixture-line"
                        d="M0 12 H28 M4 4 H24 V10 H4 Z"
                      />
                    </g>
                  ))}
                  <text
                    className="room-number"
                    x={x + 17}
                    y={top ? y + 32 : y + 35}
                  >
                    {room.number}
                  </text>
                  <circle
                    cx={x + 21}
                    cy={top ? y + 161 : y + 150}
                    r="3"
                    fill={
                      alerts.length || offline
                        ? "var(--status-danger)"
                        : "var(--status-success)"
                    }
                  />
                  <text
                    className="map-tiny room-occupancy"
                    x={x + 31}
                    y={top ? y + 165 : y + 154}
                  >
                    {residents.length} 人{offline ? " · 离线" : "入住"}
                  </text>
                  {alerts.length > 0 && (
                    <text
                      className="room-alert-icon"
                      x={x + 122}
                      y={top ? y + 160 : y + 112}
                    >
                      !
                    </text>
                  )}
                </g>
              );
            })}
            <path className="entrance" d="M35 305 H180 M35 299 H180" />
            <text className="map-tiny" x="105" y="325">
              ← 楼层入口
            </text>
            <path className="north-marker" d="M1380 113 V75 m-6 12 6-12 6 12" />
            <text className="map-label" x="1380" y="60">
              N
            </text>
            <path
              className="dimension-line"
              d="M180 575 H1340 M180 569 V581 M1340 569 V581"
            />
            <text className="map-tiny" x="760" y="596">
              16 间双人居室 · 外墙 / 门洞 / 窗 / 卫生间 / 床位
            </text>
          </svg>
        </div>
        <div className="map-legend">
          <span>
            <i className="legend-dot success" />
            正常监测
          </span>
          <span>
            <i className="legend-dot danger" />
            需要关注 / 离线
          </span>
          <span>
            <i className="legend-line" />
            墙体与门洞
          </span>
          <small>点击房间查看人员与设备 ↗</small>
        </div>
      </div>
      <div className="floor-summary">
        <div>
          <span>当前楼层</span>
          <strong>
            {building} 栋 · {floor}F
          </strong>
        </div>
        <div>
          <span>在住长者</span>
          <strong>
            {people.length}
            <small> 人</small>
          </strong>
        </div>
        <div>
          <span>待核实预警</span>
          <Link href="/alerts" className="text-link">
            {
              data.alerts.filter(
                (a) =>
                  rooms.some((r) => r.id === a.roomId) &&
                  a.status !== "resolved",
              ).length
            }
            <small> 条 ↗</small>
          </Link>
        </div>
        <div>
          <span>监测设备在线</span>
          <strong>
            {
              data.devices.filter(
                (d) =>
                  rooms.some((r) => r.id === d.roomId) && d.status === "online",
              ).length
            }
            <small>
              {" "}
              /{" "}
              {
                data.devices.filter((d) => rooms.some((r) => r.id === d.roomId))
                  .length
              }
            </small>
          </strong>
        </div>
      </div>
      {room && (
        <Dialog
          open
          onOpenChange={(open) => {
            if (!open) setSelected("");
          }}
        >
          <DialogContent className="detail-dialog">
            <DialogHeader>
              <DialogTitle>{room.number} 室 · 房间详情</DialogTitle>
              <DialogDescription>
                {locationText(room)} · 双人居室 · {members.length} /{" "}
                {room.capacity} 床入住
              </DialogDescription>
            </DialogHeader>
            <div className="detail-grid">
              <div>
                <span>环境温度</span>
                <strong>
                  {environment?.status === "online"
                    ? `${room.temperature} ℃`
                    : "—"}
                </strong>
              </div>
              <div>
                <span>相对湿度</span>
                <strong>
                  {environment?.status === "online"
                    ? `${room.humidity} %`
                    : "—"}
                </strong>
              </div>
            </div>
            {environment?.status === "offline" && (
              <p className="danger-text small">
                环境采集器离线，暂停显示环境读数。
              </p>
            )}
            <div className="section-label">
              入住人员 <span>健康信息请查看对应人员</span>
            </div>
            <div className="linked-people">
              {members.map((r) => (
                <Link key={r.id} href={`/residents?resident=${r.id}`}>
                  <Avatar name={r.name} />
                  <span>
                    <strong>{r.name}</strong>
                    <small>
                      {r.bed} 号床 · {r.careLevel}
                    </small>
                  </span>
                  <span className="text-link">个人信息 ↗</span>
                </Link>
              ))}
            </div>
            <div className="section-label">关联预警与设备</div>
            {roomAlerts.length ? (
              roomAlerts.map((a) => (
                <Link
                  key={a.id}
                  className="related-link"
                  href={`/alerts?alert=${a.id}`}
                >
                  <Status tone="danger">待核实</Status>
                  {a.title}
                  <span>↗</span>
                </Link>
              ))
            ) : (
              <p className="muted">当前没有待处理预警</p>
            )}
            <Link href={`/devices?room=${room.id}`} className="text-link">
              查看本房间全部设备及安装位置 ↗
            </Link>
          </DialogContent>
        </Dialog>
      )}
    </Panel>
  );
}
