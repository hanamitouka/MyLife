import { useLifeStore } from '../features/activities/activityStore';
import { useTodoStore } from '../features/todos/todoStore';
import { useGoalStore } from '../features/goals/goalStore';

/** 拉取全部模块的最新数据（跨设备同步）。 */
export async function reloadAll(): Promise<void> {
  await Promise.all([
    useLifeStore.getState().load(),
    useTodoStore.getState().load(),
    useGoalStore.getState().load(),
  ]);
}
