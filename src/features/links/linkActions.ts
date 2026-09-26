import { useLifeStore } from '../activities/activityStore';
import { useTodoStore } from '../todos/todoStore';

/**
 * 模块联动（协调层）。
 *
 * 集中处理「跨模块」的操作，让各个 store 保持独立、互不 import，
 * 从而避免循环依赖。组件只调用这里导出的函数。
 */

const DEFAULT_COLOR = '#7aa2f7';
const DEFAULT_DURATION = 30;

/** 待办 → 卡牌：把待办转成一张可拖到时间轴的活动卡牌 */
export function convertTodoToCard(todoId: string) {
  const todo = useTodoStore.getState().todos.find((t) => t.id === todoId);
  if (!todo || todo.activityId) return; // 已经转过了
  const activityId = useLifeStore.getState().addActivity({
    title: todo.title,
    color: DEFAULT_COLOR,
    durationMinutes: DEFAULT_DURATION,
    todoId,
  });
  useTodoStore.getState().setActivityId(todoId, activityId);
}

/** 目标 / 子目标 → 待办 */
export function goalToTodo(goalId: string, title: string) {
  useTodoStore.getState().addTodo({ title, priority: 0, goalId });
}

/** 目标 / 子目标 → 卡牌 */
export function goalToCard(goalId: string, title: string) {
  useLifeStore.getState().addActivity({
    title,
    color: DEFAULT_COLOR,
    durationMinutes: DEFAULT_DURATION,
    goalId,
  });
}
