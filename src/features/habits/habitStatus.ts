import type { HabitConfig } from '../../types';

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** 两个日期相差的「自然日」数（忽略时分秒）。0 = 同一天，1 = 昨天，以此类推。 */
function dayDiff(from: Date, to: Date): number {
  return Math.round((startOfDay(to) - startOfDay(from)) / 86_400_000);
}

export interface HabitStatus {
  /** 距上次打卡的天数；null 表示从未打过卡 */
  since: number | null;
  /** 是否该提醒打卡 */
  due: boolean;
  /** 今天已打卡次数 */
  countToday: number;
}

/**
 * 计算一个习惯的当前状态。
 *
 * 提醒（due）规则：
 *   - strict（强制）：从未打卡，或距上次已 ≥ intervalDays 天 → 提醒
 *   - semi（半强制）：同上（intervalDays 是「底线天数」）→ 超过才提醒
 *   - none（非强制）：永不提醒，只记录
 *
 * 说明：strict 和 semi 的判定公式相同，区别在于 intervalDays 的语义
 * （频率 vs 底线）以及界面文案，这里统一成一个公式，简单好懂。
 */
export function getHabitStatus(habit: HabitConfig, now: Date): HabitStatus {
  const since = habit.lastDoneAt ? dayDiff(new Date(habit.lastDoneAt), now) : null;

  const today = startOfDay(now);
  const countToday = habit.doneLog.filter((t) => startOfDay(new Date(t)) === today).length;

  const due = habit.mode !== 'none' && (since === null || since >= habit.intervalDays);

  return { since, due, countToday };
}
