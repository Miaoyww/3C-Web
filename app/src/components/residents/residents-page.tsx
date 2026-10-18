"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowUpRight, Download } from "lucide-react";
import { useFacility } from "@/components/providers/facility-provider";
import {
  PageHeading,
  Status,
  SearchField,
  Pagination,
  EmptyState,
  Avatar,
} from "@/components/shared/display";
import { Button } from "@/components/ui/button";
import { ResidentDetail } from "./resident-detail";
import { facilityStats, healthState, latestReading } from "@/utils/selectors";
import { exportCsv, locationText, timeText } from "@/utils/format";

export function ResidentsPage() {
  const { data } = useFacility();
  const params = useSearchParams();
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [building, setBuilding] = useState("all");
  const [health, setHealth] = useState("all");
  const [page, setPage] = useState(1);
  const stats = facilityStats(data);
  const filtered = data.residents.filter((r) => {
    const room = data.rooms.find((x) => x.id === r.roomId)!;
    return (
      (building === "all" || room.building === building) &&
      (health === "all" || healthState(r, data) === health) &&
      `${r.name} ${r.id} ${locationText(room)}`
        .toLowerCase()
        .includes(query.toLowerCase())
    );
  });
  const currentPage = Math.min(
    page,
    Math.max(1, Math.ceil(filtered.length / 12)),
  );
  const selectedId = selected ?? params.get("resident") ?? "";
  return (
    <>
      <PageHeading
        eyebrow="PEOPLE · INDIVIDUAL CARE"
        title="每一位长者，都有自己的记录。"
        description="人员信息与个人健康监测 · 读数对应到人，照护落实到人"
        action={
          <Button
            variant="outline"
            onClick={() =>
              exportCsv("颐安-人员信息-模拟数据.csv", [
                [
                  "编号",
                  "姓名",
                  "年龄",
                  "房间",
                  "照护等级",
                  "健康服务",
                  "个人心率",
                ],
                ...filtered.map((r) => [
                  r.id,
                  r.name,
                  r.age,
                  locationText(data.rooms.find((x) => x.id === r.roomId)),
                  r.careLevel,
                  healthState(r, data),
                  latestReading(data, r.id)?.heartRate ?? "—",
                ]),
              ])
            }
          >
            <Download />
            导出人员
          </Button>
        }
      />
      <div className="inline-stats">
        <div>
          <strong>{data.residents.length}</strong>
          <span>在院长者</span>
        </div>
        <div>
          <strong>{stats.subscribed}</strong>
          <span>自愿开通健康服务</span>
        </div>
        <div>
          <strong className="info-text">{stats.activeHealth}</strong>
          <span>佩戴在线设备，采集中</span>
        </div>
        <div>
          <strong>
            {data.residents.filter((r) => r.careLevel === "专业照护").length}
          </strong>
          <span>专业照护</span>
        </div>
      </div>
      <section className="list-section">
        <div className="list-toolbar">
          <div>
            <h2>
              人员名录 <span>{filtered.length}</span>
            </h2>
            <p>
              健康读数位于每位长者所在行 · 采样时间 {timeText(data.capturedAt)}
            </p>
          </div>
          <div className="filters">
            <SearchField
              value={query}
              onChange={(v) => {
                setQuery(v);
                setPage(1);
              }}
              placeholder="搜索姓名、编号或房间"
            />
            <select
              aria-label="人员楼栋"
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
            <select
              aria-label="健康服务筛选"
              value={health}
              onChange={(e) => {
                setHealth(e.target.value);
                setPage(1);
              }}
            >
              {["all", "采集中", "未开通", "未佩戴", "设备离线"].map((s) => (
                <option key={s} value={s}>
                  {s === "all" ? "全部健康服务" : s}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="table-scroll">
          <table className="data-table resident-table">
            <thead>
              <tr>
                <th>#</th>
                <th>姓名 / 人员编号</th>
                <th>房间 / 床位</th>
                <th>照护等级</th>
                <th>自选健康服务</th>
                <th>个人心率</th>
                <th>呼吸 / 血氧</th>
                <th>最近上报</th>
                <th>
                  <span className="sr-only">操作</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered
                .slice((currentPage - 1) * 12, currentPage * 12)
                .map((r, index) => {
                  const reading = latestReading(data, r.id);
                  const state = healthState(r, data);
                  return (
                    <tr key={r.id}>
                      <td className="row-number">
                        {(currentPage - 1) * 12 + index + 1}
                      </td>
                      <td>
                        <button
                          className="person-button"
                          onClick={() => setSelected(r.id)}
                        >
                          <Avatar name={r.name} />
                          <span>
                            <strong>
                              {r.name}
                              <small>
                                {r.gender} · {r.age} 岁
                              </small>
                            </strong>
                            <span className="muted mono">{r.id}</span>
                          </span>
                        </button>
                      </td>
                      <td>
                        <strong>{r.roomId.replace("-", " 栋 · ")} 室</strong>
                        <small>{r.bed} 号床</small>
                      </td>
                      <td>
                        {r.careLevel}
                        <small>护理员 {r.caregiver}</small>
                      </td>
                      <td>
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
                      </td>
                      <td>
                        <span
                          className={`table-vital ${reading && reading.heartRate > 100 ? "danger-text" : ""}`}
                        >
                          {reading?.heartRate ?? "—"}
                        </span>
                        {reading && <small>次/分</small>}
                      </td>
                      <td>
                        {reading ? (
                          <>
                            <strong>
                              {reading.respiration} 次/分{" "}
                              <span className="column-divider">/</span>{" "}
                              {reading.oxygen}%
                            </strong>
                            <small>个人实时读数</small>
                          </>
                        ) : (
                          <span className="muted">暂无采集</span>
                        )}
                      </td>
                      <td className="mono muted">
                        {reading ? timeText(reading.recordedAt) : "—"}
                      </td>
                      <td>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`查看${r.name}的个人数据`}
                          onClick={() => setSelected(r.id)}
                        >
                          <ArrowUpRight />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
        {!filtered.length && <EmptyState>没有符合筛选条件的人员</EmptyState>}
        <Pagination
          page={currentPage}
          total={filtered.length}
          pageSize={12}
          onChange={setPage}
        />
      </section>
      <p className="service-note">
        健康监测为自愿付费可选服务。未开通、未佩戴或设备离线时，不生成个人读数。所有姓名与信息均为虚构。
      </p>
      {selectedId && (
        <ResidentDetail id={selectedId} onClose={() => setSelected("")} />
      )}
    </>
  );
}
