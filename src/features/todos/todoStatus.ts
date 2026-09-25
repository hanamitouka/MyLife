import type { Todo } from '../../types';

export interface DdlStatus {
  /** 是否已逾期 */
  overdue: boolean;
  /** 是否在催办窗口内（临近截止） */
  remind: boolean;
  /** 展示文案，如「还有 3 天 2 小时」「已逾期 1 天」 */
  text: string;
}

/** 计算 DDL 的倒计时 / 逾期 / 催办状态；没有截止时间返回 null */
export function getDdlStatus(todo: Todo, now: Date): DdlStatus | null {
  if (!todo.dueAt) return null;

  const due = new Date(todo.dueAt);
  const diffMs = due.getTime() - now.getTime();
  const overdue = diffMs < 0;
  const absMs = Math.abs(diffMs);

  // 催办窗口：未逾期，且距离截止时间 ≤ 提前量
  let remind = false;
  if (todo.remindBeforeMinutes && !overdue) {
    remind = diffMs <= todo.remindBeforeMinutes * 60_000;
  }

  const days = Math.floor(absMs / 86_400_000);
  const hours = Math.floor((absMs % 86_400_000) / 3_600_000);
  const mins = Math.floor((absMs % 3_600_000) / 60_000);

  let text: string;
  if (overdue) {
    text =
      days > 0 ? `已逾期 ${days} 天` : hours > 0 ? `已逾期 ${hours} 小时` : `已逾期 ${mins} 分钟`;
  } else {
    text =
      days > 0
        ? `还有 ${days} 天 ${hours} 小时`
        : hours > 0
          ? `还有 ${hours} 小时 ${mins} 分钟`
          : `还有 ${mins} 分钟`;
  }

  return { overdue, remind, text };
}

/** 排序：未完成在前 → 置顶 → 优先级降序 → 创建时间升序 */
export function sortTodos(todos: Todo[]): Todo[] {
  return [...todos].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    if (a.priority !== b.priority) return b.priority - a.priority;
    return a.createdAt - b.createdAt;
  });
}
