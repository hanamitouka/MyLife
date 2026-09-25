import type { Goal } from '../../types';

export interface GoalProgress {
  doneCount: number;
  total: number;
  /** 0-100 */
  percent: number;
  /** 下一步最小行动：最深的一条未完成叶子，没有则 null */
  nextAction: string | null;
}

/** 递归找到「下一步」：沿着第一条未完成子目标一路下钻到叶子 */
function nextLeafAction(goal: Goal): string | null {
  if (goal.done) return null;
  const firstUndone = goal.subGoals.find((sg) => !sg.done);
  if (!firstUndone) return null;
  return nextLeafAction(firstUndone) ?? firstUndone.title;
}

/** 计算目标进度：已完成直接子目标数 / 直接子目标总数（等权重）。 */
export function getGoalProgress(goal: Goal): GoalProgress {
  const total = goal.subGoals.length;
  const doneCount = goal.subGoals.filter((sg) => sg.done).length;
  const percent = total === 0 ? (goal.done ? 100 : 0) : Math.round((doneCount / total) * 100);
  return { doneCount, total, percent, nextAction: nextLeafAction(goal) };
}

/** 排序：进行中在前，按创建时间升序。 */
export function sortGoals(goals: Goal[]): Goal[] {
  return [...goals].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    return a.createdAt - b.createdAt;
  });
}

/** 相对时间：刚刚 / X 分钟前 / X 小时前 / X 天前 / 具体日期 */
export function formatRelativeTime(ts: number, now: number): string {
  const diff = now - ts;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return '刚刚';
  if (mins < 60) return `${mins} 分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} 天前`;
  return new Date(ts).toLocaleDateString('zh-CN');
}

/** 把 "YYYY-MM-DD" 格式化成 "YYYY年M月D日" */
export function formatDate(d: string): string {
  const [y, m, day] = d.split('-');
  return `${y}年${Number(m)}月${Number(day)}日`;
}
