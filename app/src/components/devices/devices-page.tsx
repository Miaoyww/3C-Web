"use client";
import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowUpRight, Monitor, Battery, Plug } from "lucide-react";
import { useFacility } from "@/components/providers/facility-provider";
import {
  PageHeading,
  Status,
  SearchField,
  Pagination,
  EmptyState,
} from "@/components/shared/display";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { deviceLabels, locationText, timeText, dateText } from "@/utils/format";
import { facilityStats } from "@/utils/selectors";
export function DevicesPage() {
  const { data } = useFacility();
  const params = useSearchParams();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [kind, setKind] = useState("all");
  const [building, setBuilding] = useState("all");
  const [roomFilter, setRoomFilter] = useState(params.get("room") ?? "");
  const [page, setPage] = useState(1);
  const [selection, setSelection] = useState<string | null>(null);
  const stats = facilityStats(data);
  const selectedId = selection ?? params.get("device");
  const device = data.devices.find((d) => d.id === selectedId);
  const deviceRoom = data.rooms.find((r) => r.id === device?.roomId);
  const resident = data.residents.find((r) => r.id === device?.residentId);
  const filtered = data.devices
    .filter((d) => {
      const room = data.rooms.find((r) => r.id === d.roomId);
      return (
        (status === "all" || d.status === status) &&
        (kind === "all" || d.kind === kind) &&
        (building === "all" || room?.building === building) &&
        (!roomFilter || d.roomId === roomFilter) &&
        `${d.name} ${d.id} ${locationText(room)} ${d.installation}`
          .toLowerCase()
          .includes(query.toLowerCase())
      );
    })
    .sort((a, b) =>
      a.status === b.status
        ? a.id.localeCompare(b.id)
        : a.status === "offline"
          ? -1
          : 1,
    );
  const currentPage = Math.min(
    page,
    Math.max(1, Math.ceil(filtered.length / 12)),
  );
  return (
    <>
      <PageHeading
        eyebrow="DEVICES · CONNECTED SPACES"
        title="每一台设备，都有明确的位置。"
        description="逐台查看安装位置、绑定人员、通信状态和最近上报 · 离线设备优先显示"
      />
      <div className="inline-stats">
        <div>
          <strong>{stats.totalDevices}</strong>
          <span>已登记设备</span>
        </div>
        <div>
          <strong className="success-text">{stats.online}</strong>
          <span>正常在线</span>
        </div>
        <div>
          <strong className="danger-text">
            {stats.totalDevices - stats.online}
          </strong>
          <span>设备离线</span>
        </div>
        <div>
          <strong>
            {((stats.online / stats.totalDevices) * 100).toFixed(1)}
            <small>%</small>
          </strong>
          <span>在线率</span>
        </div>
      </div>
      <section className="list-section">
        <div className="list-toolbar">
          <div>
            <h2>
              设备台账 <span>{filtered.length}</span>
            </h2>
            <p>随身设备位置为登记房间，不代表实时定位</p>
          </div>
          <div className="filters">
            <SearchField
              value={query}
              onChange={(v) => {
                setQuery(v);
                setPage(1);
              }}
              placeholder="搜索设备编号、位置或名称"
            />
            <select
              aria-label="设备类型"
              value={kind}
              onChange={(e) => {
                setKind(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">全部类型</option>
              {Object.entries(deviceLabels).map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
            <select
              aria-label="设备状态"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">全部状态</option>
              <option value="offline">离线</option>
              <option value="online">在线</option>
            </select>
            <select
              aria-label="设备楼栋"
              value={building}
              onChange={(e) => {
                setBuilding(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">全部楼栋</option>
              <option value="A">A 栋</option>
              <option value="B">B 栋</option>
            </select>
          </div>
        </div>
        {roomFilter && (
          <div className="filter-note">
            已定位：{locationText(data.rooms.find((r) => r.id === roomFilter))}
            <Button size="sm" variant="ghost" onClick={() => setRoomFilter("")}>
              清除房间筛选 ×
            </Button>
          </div>
        )}
        <div className="table-scroll">
          <table className="data-table device-table">
            <thead>
              <tr>
                <th>设备 / 编号</th>
                <th>设备类型</th>
                <th>具体位置</th>
                <th>状态</th>
                <th>电量 / 供电</th>
                <th>最近上报</th>
                <th>
                  <span className="sr-only">详情</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered
                .slice((currentPage - 1) * 12, currentPage * 12)
                .map((d) => (
                  <tr key={d.id}>
                    <td>
                      <button
                        className="device-name"
                        onClick={() => setSelection(d.id)}
                      >
                        <span className="device-icon">
                          <Monitor size={18} />
                        </span>
                        <span>
                          <strong>{d.name}</strong>
                          <small className="mono">{d.id}</small>
                        </span>
                      </button>
                    </td>
                    <td>
                      {deviceLabels[d.kind]}
                      <small>{d.model}</small>
                    </td>
                    <td>
                      <strong>
                        {locationText(
                          data.rooms.find((r) => r.id === d.roomId),
                        )}
                      </strong>
                      <small>{d.installation}</small>
                    </td>
                    <td>
                      <Status
                        tone={d.status === "online" ? "success" : "danger"}
                      >
                        {d.status === "online" ? "在线" : "离线"}
                      </Status>
                    </td>
                    <td>
                      <span className="power-label">
                        {d.battery === null ? (
                          <>
                            <Plug size={14} /> 外接电源
                          </>
                        ) : (
                          <>
                            <Battery size={16} />
                            {d.battery}%
                          </>
                        )}
                      </span>
                    </td>
                    <td className="mono">
                      <strong>{timeText(d.lastSeenAt)}</strong>
                      <small>{dateText(d.lastSeenAt)}</small>
                    </td>
                    <td>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`查看设备 ${d.id}`}
                        onClick={() => setSelection(d.id)}
                      >
                        <ArrowUpRight />
                      </Button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {!filtered.length && <EmptyState>没有符合筛选条件的设备</EmptyState>}
        <Pagination
          page={currentPage}
          total={filtered.length}
          pageSize={12}
          onChange={setPage}
        />
      </section>
      {device && (
        <Dialog
          open
          onOpenChange={(open) => {
            if (!open) setSelection("");
          }}
        >
          <DialogContent className="detail-dialog">
            <DialogHeader>
              <DialogTitle>{device.name} · 设备详情</DialogTitle>
              <DialogDescription>
                {device.id} · {deviceLabels[device.kind]} · {device.model}
              </DialogDescription>
            </DialogHeader>
            <div className="detail-grid">
              <div>
                <span>通信状态</span>
                <Status
                  tone={device.status === "online" ? "success" : "danger"}
                >
                  {device.status === "online" ? "在线" : "离线"}
                </Status>
              </div>
              <div>
                <span>最近上报</span>
                <strong>
                  {dateText(device.lastSeenAt)} {timeText(device.lastSeenAt)}
                </strong>
              </div>
              <div>
                <span>
                  {device.kind === "wearable" ? "登记房间" : "所在房间"}
                </span>
                <strong>{locationText(deviceRoom)}</strong>
              </div>
              <div>
                <span>精确安装点</span>
                <strong>{device.installation}</strong>
              </div>
              <div>
                <span>电量 / 供电</span>
                <strong>
                  {device.battery === null ? "外接电源" : `${device.battery}%`}
                </strong>
              </div>
              <div>
                <span>绑定人员</span>
                {resident ? (
                  <Link
                    className="text-link"
                    href={`/residents?resident=${resident.id}`}
                  >
                    {resident.name} · {resident.id} ↗
                  </Link>
                ) : (
                  <strong>房间公共设备</strong>
                )}
              </div>
            </div>
            {device.kind === "wearable" && (
              <p className="service-note">
                随身设备按入住信息登记房间，本演示未接入实时人员定位。
              </p>
            )}
            <div className="section-label">关联预警</div>
            {data.alerts.filter((a) => a.deviceId === device.id).length ? (
              data.alerts
                .filter((a) => a.deviceId === device.id)
                .map((a) => (
                  <Link
                    className="related-link"
                    key={a.id}
                    href={`/alerts?alert=${a.id}`}
                  >
                    {a.title}
                    <span>查看 ↗</span>
                  </Link>
                ))
            ) : (
              <p className="muted">暂无关联预警记录</p>
            )}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
