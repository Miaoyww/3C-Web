import { expect, test } from "@playwright/test";

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

test("supported screen sizes have no overflowing content", async ({ page }) => {
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
