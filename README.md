# MyLife · 我的生活管家

一个帮你管理时间的个人工具。当前进度：主界面三区布局、时间轴、习惯打卡、待办 / DDL 已上线，数据暂存本地浏览器。

> 设计原则：**顺着 P 人的节奏走**——把「随手记」的成本压到最低，把「认真规划」的空间留足。

## 现在能做什么

- 「主界面」三区布局：时间轴 + 便捷待办打卡（DDL 提醒/待办/习惯打卡）+ 当前目标
- 左侧创建「活动模块」（名字 / 颜色 / 默认时长 / emoji 图标 / 备注），支持增删改查，双击卡片编辑
- 把活动卡片**拖**到右侧时间轴 → 自动生成一条时间安排（靠近整点/半小时/当前时间自动磁吸）
- 拖动已有安排调整时间；点击安排可删除
- 「习惯打卡」：强制 / 半强制 / 非强制三种模式，记录「距上次多久」，到期提醒
- 「待办 / DDL」：待办优先级/置顶/完成；带截止日期的 DDL 显示倒计时、逾期标红、催办提醒
- 「目标追踪」：添加目标、子目标可任意嵌套、进度计算、每层目标/子目标日志（含「下一步最小行动」）
- 「模块联动」：待办转卡牌、目标生成待办/卡牌、时间轴完成回写待办
- 「个人成就」：每日热度图、习惯连续天数、目标完成度、最近活动时间戳
- 数据存在浏览器 localStorage，刷新不丢（暂未双端同步）

## 快速开始

```bash
npm install
npm run dev
```

浏览器打开 http://localhost:5173

## 目录结构（模块化地图）

```
mylife/
├── src/
│   ├── types.ts                 # 全局数据类型（各模块之间的「契约」）
│   ├── lib/
│   │   ├── palette.ts           #   共享色板
│   │   └── storage/             # ★ 数据层（可插拔，见下）
│   │       ├── Storage.ts       #   抽象接口
│   │       ├── localStorage.ts  #   本地实现（现在用）
│   │       ├── supabase.ts      #   云端实现（以后用，模板已写好）
│   │       └── index.ts         #   决定「当前用哪个」
│   └── features/                # ★ 功能按模块拆分，互不干扰
│       ├── activities/          #   「活动模块」功能
│       │   ├── activityStore.ts #   状态中枢（活动 + 习惯 + 日程）
│       │   ├── ActivityCard.tsx #   单张卡片
│       │   ├── ActivityList.tsx #   左侧栏 + 拖拽源
│       │   └── ActivityManager.tsx # 管理弹窗（增删改）
│       ├── calendar/
│       │   └── TimelineCalendar.tsx # 时间轴 + 拖拽目标 + 磁吸
│       ├── habits/
│       │   ├── habitStatus.ts   #   习惯状态计算（纯函数）
│       │   └── HabitView.tsx    #   习惯打卡视图
│       ├── todos/
│       │   ├── todoStore.ts     #   待办状态中枢
│       │   ├── todoStatus.ts    #   DDL 倒计时/排序（纯函数）
│       │   └── TodoView.tsx     #   待办 + DDL 视图
│       ├── dashboard/
│       │   ├── Dashboard.tsx    #   主界面三区布局
│       │   └── QuickPanel.tsx   #   便捷待办打卡面板
│       ├── goals/
│       │   ├── goalStore.ts     #   目标状态中枢
│       │   ├── goalStatus.ts    #   进度/排序/时间（纯函数）
│       │   └── GoalView.tsx     #   目标视图
│       └── achievements/
│           ├── stats.ts         #   统计（纯函数，从现有数据派生）
│           └── AchievementsView.tsx # 个人成就视图
└── ...
```

**记住两条主线**：

1. **状态主线**：组件 → `activityStore.ts`（zustand）→ `storage`（数据层）
2. **功能主线**：每个功能一个 `features/xxx` 文件夹，想加「习惯打卡」就新建 `features/habits/`，不动其它模块。

## 数据层：本地 → 双端同步（Supabase）

应用只依赖 `Storage` 接口，不关心数据到底存哪。

- **默认**：本地 localStorage（零配置，单机可用）
- **配置了 Supabase 后**：自动切换到云端同步（`.env` 里填 URL 和 anon key 即可），并启用邮箱登录

`src/lib/storage/` 下有三个文件：

- `Storage.ts` —— 抽象接口
- `localStorage.ts` —— 本地实现
- `supabase.ts` —— 云端实现（`documents` 表 + JSONB）

**上层功能代码一行都不用改** —— 这就是模块化的价值。完整接入步骤见 `docs/SUPABASE.md`。

## 技术栈

| 层 | 选型 | 作用 |
|---|---|---|
| 界面 | React + Vite + TypeScript | 现代前端，教程多，类型帮你查漏 |
| 日历/时间轴 | FullCalendar | 日历 + 拖拽全部现成，不造轮子 |
| 状态管理 | Zustand | 极轻量，把状态从组件里抽出来 |
| 数据 | localStorage（现）→ Supabase（后） | 本地先跑通，云端再同步 |

## 路线图

- **MVP 1**：日历 + 时间轴 + 活动拖拽 + 本地存储 ✅
- **MVP 2**：习惯打卡 + 「上一次做这件事是多久前」+ 提醒 ✅
- **MVP 3**：待办清单 + DDL（倒计时 / 逾期 / 催办）✅
- **MVP 4**：主界面三区布局 ✅
- **MVP 5**：目标追踪（子目标 / 进度 / 日志）✅
- **MVP 6**：模块联动（待办↔卡牌↔目标↔时间轴）✅
- **MVP 7**：个人成就（每日热度图 + 习惯/目标统计）✅
- **MVP 8**：Supabase 双端同步（账号登录 + 云端存储）✅（代码就绪，待配置）
- **下一步**：Obsidian/Anki 联动
