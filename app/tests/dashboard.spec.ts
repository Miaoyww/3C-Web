import { expect, test } from "@playwright/test";
import {
  canRecordHealth,
  healthResidents,
  healthService,
  makeRooms,
} from "../src/features/dashboard/mock-data";

test("health collection requires consent, payment and a worn online device", () => {
  const enabled = { consented: true, paid: true, wearing: true, online: true };
  expect(canRecordHealth(enabled)).toBe(true);
  for (const key of ["consented", "paid", "wearing", "online"] as const) {
    expect(canRecordHealth({ ...enabled, [key]: false })).toBe(false);
  }
  expect(healthService.active).toBeLessThan(healthService.wearing);
  expect(healthService.wearing).toBeLessThan(healthService.subscribed);
  expect(healthService.subscribed).toBeLessThan(168);
  for (const resident of healthResidents.filter((r) => !canRecordHealth(r))) {
    expect(resident.heartRate).toBeNull();
  }
  expect(
    makeRooms(2, "B").find((room) => room.number === "203")?.heartRate,
  ).toBeNull();
  expect(
    makeRooms(3, "A").find((room) => room.number === "305")?.heartRate,
  ).toBe(106);
});

test("Magic UI toggles and persists the theme with one fullscreen entry", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(page.getByRole("button", { name: "切换全屏" })).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "大屏展示", exact: true }),
  ).toHaveCount(1);
  await page.getByRole("button", { name: "切换至明亮主题" }).click();
  await expect(page.locator("html")).toHaveClass(/light/);
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/light/);
  await page.getByRole("button", { name: "切换至深色主题" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(page.locator("html")).not.toHaveAttribute(
    "data-magicui-theme-vt",
  );
  await page.getByRole("button", { name: "大屏展示", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "退出大屏", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "退出大屏", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "大屏展示", exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("theme toggle falls back without view transitions and honors reduced motion", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() =>
    Object.defineProperty(document, "startViewTransition", {
      value: undefined,
      configurable: true,
    }),
  );
  await page.goto("/");
  await page.getByRole("button", { name: "切换至明亮主题" }).click();
  await expect(page.locator("html")).toHaveClass(/light/);
  await expect(page.locator("html")).not.toHaveAttribute(
    "data-magicui-theme-vt",
  );
  expect(errors).toEqual([]);
});

test("reduced motion skips the available View Transitions API without hydration errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() =>
    Object.defineProperty(document, "startViewTransition", {
      value: () => {
        throw new Error("View transitions must not run with reduced motion");
      },
      configurable: true,
    }),
  );
  await page.goto("/");
  await page.getByRole("button", { name: "切换至明亮主题" }).click();
  await expect(page.locator("html")).toHaveClass(/light/);
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/light/);
  await page.getByRole("button", { name: "切换至深色主题" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  expect(errors).toEqual([]);
});

test("nonparticipants have no room health readings and optional service scope is visible", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".health-stat")).toContainText("72");
  await expect(page.locator(".health-stat")).toContainText(
    "68 人佩戴 · 66 人采集中",
  );
  await expect(page.locator(".health-service-note")).toContainText(
    "可选付费服务",
  );
  await page.getByLabel("选择楼栋").selectOption("B");
  await page.getByRole("button", { name: /^203室/ }).click();
  await expect(page.getByRole("dialog")).toContainText(
    "未开通自选健康监测，不采集健康数据",
  );
  await expect(
    page
      .getByRole("dialog")
      .locator(".detail-grid > div")
      .filter({ hasText: "自选服务 · 模拟平均心率" })
      .locator("strong"),
  ).toHaveText("—");
});

test("room alert handling stays consistent across dashboard", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "让每一份关怀",
  );
  await page.getByRole("button", { name: /^208室/ }).click();
  await expect(page.getByRole("dialog")).toContainText("需要关注");
  await page.getByRole("button", { name: "查看关联预警" }).click();
  await expect(page.getByRole("dialog")).toContainText("疑似跌倒");
  await page.getByRole("button", { name: "标记为已处理" }).click();
  await expect(page.getByRole("tab", { name: "待处理 3" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: /^208室/ }),
  ).toHaveAccessibleName(/正常监测/);
  await page.getByRole("tab", { name: "已处理 1" }).click();
  await expect(page.locator(".alert-list")).toContainText("疑似跌倒");
  expect(errors).toEqual([]);
});

test("floor selection, building scope, trends, pause and export work", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("tab", { name: /3F/ }).click();
  await expect(
    page.getByRole("button", { name: /^305室/ }),
  ).toHaveAccessibleName(/心率持续偏高/);
  await page.getByLabel("选择楼栋").selectOption("B");
  await expect(
    page.getByRole("button", { name: /^305室/ }),
  ).toHaveAccessibleName(/正常监测/);
  await page.getByRole("button", { name: "本周", exact: true }).click();
  await expect(page.getByRole("img", { name: /本周平均/ })).toBeVisible();
  await page.getByRole("button", { name: "暂停自动更新" }).click();
  await expect(page.getByText("自动更新已暂停")).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "导出概览" }).click();
  expect((await downloadPromise).suggestedFilename()).toContain("模拟数据.csv");
});

for (const theme of ["dark", "light"])
  test(`supported screen sizes have no overflowing content (${theme})`, async ({
    page,
  }) => {
    await page.addInitScript(
      (theme) => localStorage.setItem("yian-theme", theme),
      theme,
    );
    for (const width of [320, 375, 414, 768, 1440, 1920]) {
      await page.setViewportSize({ width, height: width >= 1440 ? 1080 : 900 });
      await page.goto("/");
      await expect(
        page.getByRole("heading", { name: "院区实时监测" }),
      ).toBeVisible();
      const overflow = await page.evaluate(() => ({
        width: innerWidth,
        scroll: document.documentElement.scrollWidth,
        out: [...document.querySelectorAll("main *")]
          .filter((e) => e.getBoundingClientRect().right > innerWidth + 1)
          .map((e) => e.className)
          .filter((c) => typeof c === "string")
          .slice(0, 8),
      }));
      expect(overflow.scroll, JSON.stringify(overflow)).toBeLessThanOrEqual(
        width,
      );
      expect(overflow.out, JSON.stringify(overflow)).toEqual([]);
      if (width === 1920) {
        expect(
          await page
            .locator("footer")
            .evaluate((e) => e.getBoundingClientRect().bottom),
        ).toBeLessThanOrEqual(1080);
      }
    }
  });
