import { useLifeStore } from '../features/activities/activityStore';
import { useTodoStore } from '../features/todos/todoStore';
import { useGoalStore } from '../features/goals/goalStore';
import type { Activity, ScheduleEvent, Todo, Goal } from '../types';

interface BackupData {
  version: number;
  exportedAt: string;
  activities: Activity[];
  events: ScheduleEvent[];
  todos: Todo[];
  goals: Goal[];
}

function createBackup(): BackupData {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    activities: useLifeStore.getState().activities,
    events: useLifeStore.getState().events,
    todos: useTodoStore.getState().todos,
    goals: useGoalStore.getState().goals,
  };
}

/** 导出备份：下载一个 JSON 文件 */
export function downloadBackup() {
  const data = createBackup();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const date = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `mylife-backup-${date}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** 从备份 JSON 恢复（覆盖当前数据）。成功返回 null，失败返回错误信息 */
export function restoreBackup(json: string): string | null {
  try {
    const data = JSON.parse(json) as BackupData;
    const { activities, events, todos, goals } = data;
    if (![activities, events, todos, goals].every((x) => Array.isArray(x))) {
      return '备份文件格式不正确';
    }
    useLifeStore.getState().replaceAll({ activities, events });
    useTodoStore.getState().replaceAll(todos);
    useGoalStore.getState().replaceAll(goals);
    return null;
  } catch (e) {
    return e instanceof Error ? e.message : '解析失败';
  }
}
