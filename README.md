# 颐安 · 智慧养老综合监测平台

三创赛银发经济主题的单页面前端原型。Next.js App Router + React + TypeScript，使用 shadcn/ui 的 Button、Dialog、Tooltip 和 Animate UI 的 CountingNumber，图表使用 Recharts。

## 启动

需要 Node.js 20.9+ 和 pnpm。在项目根目录执行：

```powershell
pnpm --dir app install
pnpm --dir app dev
```

打开 http://localhost:3000。生产模式执行 `pnpm --dir app build`，然后 `pnpm --dir app start`。

## 演示内容

- 全院关键指标、健康趋势、照护完成率、设备在线状态。
- A/B 栋与四个楼层切换、房间状态与模拟读数详情。
- 待处理/已处理预警切换、定位房间、标记已处理；状态在指标和房间平面图间同步。
- 今日/本周趋势、自动刷新与暂停、刷新间隔设置、CSV 导出、全屏展示。
- 默认每 12 秒刷新环境与健康模拟读数；隐藏页面时停止刷新。
- 桌面大屏布局，小屏自动改为纵向排列。

所有数据均为模拟，初始种子固定以保持首次渲染一致，后续刷新改变种子。固定演示预警不会自动新增，处理状态与设置刷新页面后重置。时钟显示上海时区。尚未接入后端、摄像头、真实设备或医疗诊断功能。

## 代码与验证

业务代码集中于 `app/src/features/dashboard/`；`app/src/app/` 负责页面组装；第三方分发组件位于 `app/src/components/`。

```powershell
pnpm --dir app format
pnpm --dir app lint
pnpm --dir app typecheck
pnpm --dir app build
pnpm --dir app format:check
pnpm --dir app exec playwright install chromium
pnpm --dir app test:e2e
```

组件来源：[shadcn/ui](https://ui.shadcn.com/)、[Animate UI](https://animate-ui.com/)、[Recharts](https://recharts.github.io/)。
