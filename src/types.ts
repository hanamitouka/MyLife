// 全局共享的数据类型 —— 各模块之间靠这些「契约」沟通。
// 想加字段时，从这里改起，类型会帮你查漏。

export type HabitMode = 'strict' | 'semi' | 'none';

/** 习惯配置（挂在 Activity 上的可选字段，有它 = 这也是一个习惯） */
export interface HabitConfig {
  mode: HabitMode;
  /** strict=每几天一次；semi=底线几天；none=忽略 */
  intervalDays: number;
  /** 上次打卡时间（ISO 字符串），从未打卡则没有 */
  lastDoneAt?: string;
  /** 打卡历史（时间戳列表，支持一天多次） */
  doneLog: string[];
}

/** 一个可复用的「活动模块」，例如「健身」「洗衣服」「背单词」 */
export interface Activity {
  id: string;
  title: string;
  /** 卡片颜色，同时也会作为时间轴上这条安排的颜色 */
  color: string;
  /** emoji 图标（可选） */
  emoji?: string;
  /** 备注（可选，显示在卡片上） */
  note?: string;
  /** 拖到时间轴上时的默认时长（分钟） */
  durationMinutes: number;
  /** 创建时间戳 */
  createdAt: number;
  /** 有它 = 这个活动同时也是一个「习惯」，会出现在习惯打卡里 */
  habit?: HabitConfig;
  /** 关联的待办（从待办「转为卡牌」而来） */
  todoId?: string;
  /** 关联的目标（从目标「生成卡牌」而来） */
  goalId?: string;
}

/** 一条已经落到时间轴上的「安排」，由某个活动模块拖拽生成 */
export interface ScheduleEvent {
  id: string;
  /** 对应哪个活动模块 */
  activityId: string;
  /** 冗余存一份标题，方便直接显示 */
  title: string;
  /** 冗余存一份颜色 */
  color: string;
  /** 开始时间，ISO 字符串 */
  start: string;
  /** 结束时间，ISO 字符串 */
  end: string;
  /** 是否已完成（完成后可回写关联待办） */
  done?: boolean;
}

/** 待办；带 dueAt（截止时间）就是一条 DDL */
export interface Todo {
  id: string;
  title: string;
  /** 优先级：0=无，1=低，2=中，3=高 */
  priority: number;
  /** 置顶 */
  pinned: boolean;
  done: boolean;
  createdAt: number;
  completedAt?: number;
  /** 截止时间（ISO 字符串），有它就是 DDL */
  dueAt?: string;
  /** 提前提醒分钟数（催办） */
  remindBeforeMinutes?: number;
  /** 关联的活动卡牌（「转为卡牌」后回填） */
  activityId?: string;
  /** 关联的目标（从目标「生成待办」而来） */
  goalId?: string;
}

/** 目标日志（进度 / 感想，带时间戳） */
export interface GoalLog {
  id: string;
  content: string;
  createdAt: number;
}

/**
 * 目标（递归结构）：总目标和子目标 / 小目标都用这个类型。
 * 每个目标都有自己的 logs，并可嵌套 subGoals（任意深度）。
 * description / dueAt 一般只用于「总目标」。
 */
export interface Goal {
  id: string;
  title: string;
  description?: string;
  /** 截止日期，date-only 字符串 "YYYY-MM-DD" */
  dueAt?: string;
  done: boolean;
  createdAt: number;
  completedAt?: number;
  subGoals: Goal[];
  logs: GoalLog[];
}
