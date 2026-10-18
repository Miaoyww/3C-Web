# 颐安 · 智慧养老综合监测平台

三创赛银发经济主题的养老院监测前端。Next.js App Router + React + TypeScript，使用 shadcn/ui 的 Button、Dialog、Tooltip、Animate UI 的 CountingNumber 和 Magic UI 的 Animated Theme Toggler，个人趋势图使用 Recharts。

## 启动

需要 Node.js 20.9+ 和 pnpm。在项目根目录执行：

```powershell
pnpm --dir app install
pnpm --dir app dev
```

打开 http://localhost:3000。生产模式执行 `pnpm --dir app build`，然后 `pnpm --dir app start`。

## 页面与演示内容

- `/` 总览：在院人数、逐台台账计算的设备在线率、待处理预警、合并后的今日照护计划；中心展示 A/B 栋四层、每层 16 间居室的建筑平面示意，包含外墙、隔墙、门洞、窗、卫生间与床位。支持房间详情及关联人员/设备跳转。移除右侧预警列表和全院平均健康读数。
- `/residents` 人员信息：168 位虚构长者的横向列表，展示房间床位、照护等级、护理员、个人心率/呼吸/血氧与上报时间。支持搜索、楼栋及健康服务筛选、分页、导出和个人趋势详情。
- 健康监测为自愿付费可选服务：72 人开通、68 人佩戴、66 人佩戴在线设备并采集中。只有同意采集、已付费且佩戴在线设备者才生成个人健康读数，其他人员不生成记录。没有全院或房间平均心率，也不包含实际支付或授权办理。
- `/alerts` 预警监测：可筛选的事件列表与详情面板，展示精确房间、关联人员（可识别时）、触发读数/规则、来源设备、现场核实建议及处理记录。支持接手和标记已处理，客户端切换页面时与首页数量、房间状态同步。
- `/activities` 活动：进行中和已排期活动，展示具体时间、地点、负责人、参与人数与容量，并可查看详情。演示活动基准固定为 2026-10-18 14:32，状态不代表现实活动进度。
- `/devices` 设备：580 台具体设备，逐台记录编号、型号、楼栋/楼层/房间、精确安装点、绑定人员、状态、电量及最近上报。支持类型、楼栋、状态、房间筛选、搜索和分页，离线设备优先显示。随身手环的房间为登记房间，并非实时定位。
- 右上角使用 Magic UI Animated Theme Toggler 切换明亮/深色主题，使用 next-themes 保存主题选择；不支持 View Transitions 或启用减少动态效果时直接切换。
- 黑白灰为主，红色用于异常/离线，绿色用于正常/在线，蓝色用于可选健康服务及趋势数据。
- 首页保留 CSV 概览导出、全屏展示和自动刷新暂停。每 12 秒推进模拟时钟和个人心率/设备在线心跳，隐藏浏览器页面时暂停；每位参与者最多保留最近 12 条健康采样。
- 桌面大屏布局，小屏自动改为纵向排列。

所有数据均为模拟，初始种子固定以保持首次渲染一致。固定演示预警不会自动新增；处理状态跨客户端导航保留，刷新浏览器后重置。顶栏显示上海实时时钟，采样使用独立的演示时间。尚未接入后端、摄像头、真实设备、报名签到或医疗诊断。

## 数据与目录

- `app/src/types/domain.ts`：集中定义 `FacilitySnapshot`、人员、房间、个人采样、设备、预警、活动、照护计划及状态枚举。
- `app/src/data/demo.ts`：统一创建确定性模拟记录。通过 `residentId`、`roomId`、`deviceId` 关联，不用显示名称作为关联键。
- `app/src/services/facility-service.ts`：读取快照、刷新采样和修改预警状态的统一入口。后续接入后台可在此替换数据操作，并调整 Provider 的异步加载状态。
- `app/src/utils/`：数据查询、展示文案、时间、CSV、种子和样式合并工具。
- `app/src/components/`：按布局、共享控件、人员、预警、活动、设备、总览分类组件；`app/src/app/` 仅组装五个路由。根布局 Provider 维护页面共用状态。
- 快照带 `schemaVersion: 1`、`source: "simulation"` 和 `capturedAt`；时间字段采用 ISO 8601，年龄为岁、心率与呼吸为次/分、血氧与电量为百分比、温度为摄氏度。未知绑定使用 `null`，不符合采集条件者没有健康采样；设备通信状态与预警处理状态分别存储，处理事件不会把离线设备改为在线。

## 代码与验证

自动化验证覆盖数据关联、采集条件、历史条数上限、预警跨页同步、个人读数、设备安装点、活动筛选、主题与全屏，以及五个页面在明暗主题和不同宽度下的布局。

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
