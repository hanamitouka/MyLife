import type { Activity, Todo, Goal } from '../../types';
import { getGoalProgress } from '../goals/goalStatus';

/** "YYYY-MM-DD"（本地时区） */
export function dateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** 统计每天「活跃事件」的数量（习惯打卡 + 待办完成 + 目标日志/完成） */
export function collectActivityDays(
  activities: Activity[],
  todos: Todo[],
  goals: Goal[]
): Map<string, number> {
  const map = new Map<string, number>();
  const add = (ts?: number) => {
    if (!ts) return;
    const key = dateKey(new Date(ts));
    map.set(key, (map.get(key) ?? 0) + 1);
  };

  for (const a of activities) {
    if (a.habit) for (const t of a.habit.doneLog) add(new Date(t).getTime());
  }
  for (const t of todos) if (t.done && t.completedAt) add(t.completedAt);
  for (const g of goals) collectGoalEvents(g, add);

  return map;
}

function collectGoalEvents(goal: Goal, add: (ts: number) => void) {
  for (const l of goal.logs) add(l.createdAt);
  if (goal.completedAt) add(goal.completedAt);
  for (const sg of goal.subGoals) collectGoalEvents(sg, add);
}

export interface HabitStat {
  title: string;
  color: string;
  total: number; // 累计打卡次数
  streak: number; // 当前连续天数
}

/** 每个习惯的累计打卡 + 连续天数 */
export function computeHabitStats(activities: Activity[], now: Date): HabitStat[] {
  return activities
    .filter((a) => a.habit)
    .map((a) => ({
      title: a.title,
      color: a.color,
      total: a.habit!.doneLog.length,
      streak: computeStreak(a.habit!.doneLog, now),
    }));
}

function computeStreak(doneLog: string[], now: Date): number {
  if (doneLog.length === 0) return 0;
  const days = new Set(doneLog.map((t) => dateKey(new Date(t))));
  const cursor = new Date(now);
  if (!days.has(dateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!days.has(dateKey(cursor))) return 0; // 今天和昨天都没打卡
  }
  let streak = 0;
  while (days.has(dateKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export interface GoalStat {
  title: string;
  percent: number;
  done: boolean;
}

/** 每个目标的完成度 */
export function computeGoalStats(goals: Goal[]): GoalStat[] {
  return goals.map((g) => ({
    title: g.title,
    percent: getGoalProgress(g).percent,
    done: g.done,
  }));
}

export interface RecentEvent {
  ts: number;
  label: string;
}

/** 最近的活跃事件（时间倒序），用于「时间戳记录」 */
export function collectRecentEvents(
  activities: Activity[],
  todos: Todo[],
  goals: Goal[],
  limit: number
): RecentEvent[] {
  const events: RecentEvent[] = [];
  const push = (ts: number | undefined, label: string) => {
    if (ts) events.push({ ts, label });
  };

  for (const a of activities) {
    if (a.habit) for (const t of a.habit.doneLog) push(new Date(t).getTime(), `打卡「${a.title}」`);
  }
  for (const t of todos) if (t.done && t.completedAt) push(t.completedAt, `完成待办「${t.title}」`);
  for (const g of goals) {
    push(g.completedAt, `完成目标「${g.title}」`);
    collectGoalFeed(g, push);
  }

  return events.sort((a, b) => b.ts - a.ts).slice(0, limit);
}

function collectGoalFeed(goal: Goal, push: (ts: number | undefined, label: string) => void) {
  for (const l of goal.logs) push(l.createdAt, `目标「${goal.title}」日志：${l.content}`);
  for (const sg of goal.subGoals) {
    push(sg.completedAt, `完成子目标「${sg.title}」`);
    collectGoalFeed(sg, push);
  }
}
