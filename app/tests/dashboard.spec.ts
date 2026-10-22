import { expect, test } from "@playwright/test";
import { createDemoSnapshot } from "../src/data/demo";
import {
  canRecordHealth,
  facilityStats,
  healthState,
  latestReading,
} from "../src/utils/selectors";
import {
  changeAlertStatus,
  refreshFacility,
} from "../src/services/facility-service";

const demo = createDemoSnapshot();
test("snapshot IDs connect people, rooms, devices and alerts without anonymous averages", () => {
  expect(demo.residents).toHaveLength(168);
  expect(demo.rooms).toHaveLength(128);
  for (const records of [
    demo.residents,
    demo.rooms,
    demo.devices,
    demo.alerts,
    demo.activities,
  ]) {
    expect(new Set(records.map((r) => r.id)).size).toBe(records.length);
  }
  for (const person of demo.residents) {
    expect(demo.rooms.some((r) => r.id === person.roomId)).toBe(true);
    if (person.health.deviceId)
      expect(
        demo.devices.find((d) => d.id === person.health.deviceId)?.residentId,
      ).toBe(person.id);
    const readings = demo.healthReadings.filter(
      (r) => r.residentId === person.id,
    );
    expect(readings).toHaveLength(
      healthState(person, demo) === "采集中" ? 12 : 0,
    );
  }
  for (const alert of demo.alerts) {
    const device = demo.devices.find((d) => d.id === alert.deviceId);
    expect(device?.roomId).toBe(alert.roomId);
    if (alert.residentId)
      expect(
        demo.residents.find((r) => r.id === alert.residentId)?.roomId,
      ).toBe(alert.roomId);
  }
  expect(facilityStats(demo)).toMatchObject({
    subscribed: 72,
    activeHealth: 66,
    pending: 4,
    careDone: 148,
    careTotal: 160,
    totalDevices: 580,
    online: 572,
  });
});
test("consent, payment, wearing and connectivity gate individual health records", () => {
  const enrollment = {
    consented: true,
    paid: true,
    wearing: true,
    deviceId: "W-test",
  };
  expect(canRecordHealth(enrollment, true)).toBe(true);
  for (const key of ["consented", "paid", "wearing"] as const)
    expect(canRecordHealth({ ...enrollment, [key]: false }, true)).toBe(false);
  expect(canRecordHealth(enrollment, false)).toBe(false);
  let refreshed = demo;
  for (let i = 0; i < 30; i++) refreshed = refreshFacility(refreshed);
  expect(refreshed.healthReadings).toHaveLength(66 * 12);
  for (const reading of refreshed.healthReadings) {
    const person = refreshed.residents.find(
      (r) => r.id === reading.residentId,
    )!;
    expect(healthState(person, refreshed)).toBe("采集中");
    expect(reading.deviceId).toBe(person.health.deviceId);
  }
  expect(
    new Date(refreshed.capturedAt).getTime() -
      new Date(demo.capturedAt).getTime(),
  ).toBe(30 * 12000);
});
test("alert updates preserve evidence and history without mutating the source snapshot", () => {
  const processing = changeAlertStatus(demo, "AL-001", "processing");
  const resolved = changeAlertStatus(processing, "AL-001", "resolved");
  expect(demo.alerts[0].status).toBe("pending");
  expect(resolved.alerts[0].history).toHaveLength(3);
  expect(resolved.alerts[0].evidence).toBe(demo.alerts[0].evidence);
  expect(facilityStats(resolved).pending).toBe(3);
  expect(
    changeAlertStatus(resolved, "AL-001", "resolved").alerts[0].history,
  ).toHaveLength(3);
});
test("dashboard has four coherent summaries and a sixteen-room architectural floor plan", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".overview-card")).toHaveCount(4);
  await expect(page.locator(".care-overview")).toContainText("今日照护计划");
  await expect(page.locator(".care-compact>div")).toHaveCount(4);
  await expect(page.getByText("自选健康监测", { exact: true })).toHaveCount(0);
  await expect(page.getByText("平均心率")).toHaveCount(0);
  await expect(page.locator(".event-list")).toHaveCount(0);
  await expect(page.locator(".floor-svg [role=button]")).toHaveCount(16);
  await page.getByRole("tab", { name: /2F/ }).click();
  await page.getByRole("button", { name: /208室/ }).click();
  await expect(page.getByRole("dialog")).toContainText("疑似跌倒");
  await page.keyboard.press("Escape");
  await page.getByLabel("选择楼栋").selectOption("B");
  await expect(
    page.getByRole("button", { name: /208室/ }),
  ).toHaveAccessibleName(/设备离线/);
});
test("comprehensive information screen summarizes facility data and links to exact records", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/screen");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "综合信息屏",
  );
  await expect(page.locator(".screen-summary-card")).toHaveCount(4);
  await expect(page.locator(".screen-floor-row")).toHaveCount(8);
  await expect(page.locator(".screen-alert-row")).toHaveCount(4);
  await expect(page.locator(".screen-care-row")).toHaveCount(4);
  await expect(page.locator(".screen-activity-row")).toHaveCount(6);
  await expect(page.locator(".screen-offline-row")).toHaveCount(8);
  await expect(page.locator(".screen-health-totals")).toContainText("66");
  await page.locator(".screen-alert-row").first().click();
  await expect(page).toHaveURL(/\/alerts\?alert=AL-001/);
  await page.goto("/screen");
  await page.getByRole("link", { name: /YC-E100.*ENV-A-116/ }).click();
  await expect(page).toHaveURL(/\/devices\?device=ENV-A-116/);
  await expect(page.getByRole("dialog")).toContainText("环境传感器");
  for (const width of [320, 375, 414, 768]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/screen");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
      `/screen at ${width}`,
    ).toBeLessThanOrEqual(width);
  }
  expect(errors).toEqual([]);
});
test("processing an alert updates dashboard counts and room status across client navigation", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "预警监测", exact: true })
    .click();
  await expect(page.locator(".alert-detail")).toContainText(
    "低位姿态持续 18 秒",
  );
  await expect(page.locator(".alert-detail")).toContainText("RAD-A-208");
  await page.getByRole("button", { name: "接手处理", exact: true }).click();
  await expect(page.locator(".event-history")).toContainText("已接手");
  await page.getByRole("button", { name: "标记为已处理", exact: true }).click();
  await expect(page.locator(".event-history li")).toHaveCount(3);
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "Dashboard", exact: true })
    .click();
  await expect(page.locator(".alert-overview .big-metric")).toContainText("3");
  await page.getByRole("tab", { name: /2F/ }).click();
  await expect(
    page.getByRole("button", { name: /208室/ }),
  ).toHaveAccessibleName(/正常监测/);
  expect(errors).toEqual([]);
});
test("personnel rows show that person's readings and nonparticipants have none", async ({
  page,
}) => {
  const person = demo.residents.find(
    (r) => r.roomId === "A-305" && healthState(r, demo) === "采集中",
  )!;
  await page.goto("/residents");
  await page
    .getByRole("textbox", { name: "搜索姓名、编号或房间" })
    .fill(person.id);
  const row = page.locator("tbody tr");
  await expect(row).toHaveCount(1);
  await expect(row.locator(".table-vital")).toHaveText(
    String(latestReading(demo, person.id)?.heartRate),
  );
  await page
    .getByRole("button", { name: `查看${person.name}的个人数据` })
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    `${person.name} · 人员详情`,
  );
  await expect(
    page.getByRole("img", { name: `${person.name}的个人心率趋势，模拟数据` }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  const inactive = demo.residents.find(
    (r) => healthState(r, demo) === "未开通",
  )!;
  await page
    .getByRole("textbox", { name: "搜索姓名、编号或房间" })
    .fill(inactive.id);
  await expect(page.locator("tbody .table-vital")).toHaveText("—");
  await page
    .getByRole("button", { name: `查看${inactive.name}的个人数据` })
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "未开通自选健康监测，不采集健康数据",
  );
});
test("device registry exposes exact installation and its related alert", async ({
  page,
}) => {
  await page.goto("/devices");
  await page
    .getByRole("textbox", { name: "搜索设备编号、位置或名称" })
    .fill("ENV-A-116");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await expect(page.locator("tbody")).toContainText("A 栋 · 1F · 116 室");
  await expect(page.locator("tbody")).toContainText("房门内侧 · 东墙 1.5m");
  await expect(page.locator("tbody .status")).toHaveText("离线");
  await page
    .getByRole("button", { name: "查看设备 ENV-A-116", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("link", { name: /环境传感器通信中断/ })
    .click();
  await expect(page.locator(".alert-detail")).toContainText("ENV-A-116");
  await expect(page.locator(".alert-detail")).toContainText("最后上报 14:05");
});
test("alert health event links to the matching individual and wearable device", async ({
  page,
}) => {
  const alert = demo.alerts[1];
  const person = demo.residents.find((r) => r.id === alert.residentId)!;
  await page.goto("/alerts?alert=AL-002");
  await expect(page.locator(".alert-detail")).toContainText(person.name);
  await page
    .locator(".alert-detail")
    .getByRole("link", { name: new RegExp(person.name) })
    .click();
  await expect(page.getByRole("dialog")).toContainText(person.id);
  await page
    .getByRole("dialog")
    .getByRole("link", { name: new RegExp(alert.deviceId) })
    .click();
  await expect(page.getByRole("dialog")).toContainText("健康手环");
  await expect(page.getByRole("dialog")).toContainText(person.name);
});
test("activity schedule filters ongoing and scheduled events and exposes time and location", async ({
  page,
}) => {
  await page.goto("/activities");
  await expect(page.locator(".activity-card")).toHaveCount(5);
  await page.getByRole("button", { name: "进行中", exact: true }).click();
  await expect(page.locator(".activity-card")).toHaveCount(2);
  await page.locator(".activity-card").first().click();
  await expect(page.getByRole("dialog")).toContainText(
    "A 栋 · 1F · 康复活动室",
  );
  await expect(page.getByRole("dialog")).toContainText("14:00—15:00");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "已排期", exact: true }).click();
  await expect(page.locator(".activity-card")).toHaveCount(3);
});
test("theme, reduced motion, fullscreen, pause and export remain available", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() =>
    Object.defineProperty(document, "startViewTransition", {
      value: () => {
        throw new Error("Reduced motion must skip view transitions");
      },
      configurable: true,
    }),
  );
  await page.goto("/");
  await page.getByRole("button", { name: "切换至明亮主题" }).click();
  await expect(page.locator("html")).toHaveClass(/light/);
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/light/);
  await expect(
    page.getByRole("button", { name: "大屏展示", exact: true }),
  ).toHaveCount(1);
  await page.getByRole("button", { name: "大屏展示", exact: true }).click();
  await page.getByRole("button", { name: "退出大屏", exact: true }).click();
  await page.getByRole("button", { name: "暂停自动更新" }).click();
  await expect(page.getByText("自动更新已暂停")).toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "导出概览" }).click();
  expect((await download).suggestedFilename()).toContain("模拟数据.csv");
  expect(errors).toEqual([]);
});
for (const theme of ["dark", "light"])
  test(`all six routes remain within the viewport (${theme})`, async ({
    page,
  }) => {
    await page.addInitScript(
      (theme) => localStorage.setItem("yian-theme", theme),
      theme,
    );
    for (const width of [320, 768, 1440, 1920]) {
      await page.setViewportSize({ width, height: width >= 1440 ? 1080 : 900 });
      for (const route of [
        "/",
        "/screen",
        "/residents",
        "/alerts",
        "/activities",
        "/devices",
      ]) {
        await page.goto(route);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth),
          `${route} at ${width}`,
        ).toBeLessThanOrEqual(width);
        if (width === 1920 && route === "/")
          expect(
            await page
              .locator("footer")
              .evaluate((e) => e.getBoundingClientRect().bottom),
          ).toBeLessThanOrEqual(1080);
      }
    }
  });
test("capture the floorplan, personnel list and alert page", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.addInitScript(() => localStorage.setItem("yian-theme", "light"));
  for (const [route, file] of [
    ["/", "dashboard"],
    ["/screen", "information-screen"],
    ["/residents", "residents"],
    ["/alerts", "alerts"],
    ["/devices", "devices"],
    ["/activities", "activities"],
  ]) {
    await page.goto(route);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.screenshot({
      path: `test-results/previews/${file}.png`,
      fullPage: true,
      caret: "initial",
    });
  }
  expect(errors).toEqual([]);
});
