import type { Activity, ScheduleEvent, Todo, Goal } from '../../types';

/**
 * 数据层的「抽象接口」（端口）。
 *
 * 应用代码只依赖这个接口，不关心数据具体存在哪。
 * 以后要接入 Supabase 实现双端同步，只需新增一个实现了本接口的类，
 * 然后在 `index.ts` 里换一行引用即可 —— 上层功能代码一行都不用改。
 * 这就是「模块化」最核心的好处：换存储不换业务。
 */
export interface Storage {
  loadActivities(): Promise<Activity[]>;
  loadEvents(): Promise<ScheduleEvent[]>;
  loadTodos(): Promise<Todo[]>;
  loadGoals(): Promise<Goal[]>;

  saveActivity(activity: Activity): Promise<void>;
  deleteActivity(id: string): Promise<void>;

  saveEvent(event: ScheduleEvent): Promise<void>;
  deleteEvent(id: string): Promise<void>;

  saveTodo(todo: Todo): Promise<void>;
  deleteTodo(id: string): Promise<void>;

  saveGoal(goal: Goal): Promise<void>;
  deleteGoal(id: string): Promise<void>;
}
