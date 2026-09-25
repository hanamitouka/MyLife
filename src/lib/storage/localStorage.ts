import type { Storage } from './Storage';
import type { Activity, ScheduleEvent, Todo, Goal } from '../../types';

const ACTIVITIES_KEY = 'mylife.activities';
const EVENTS_KEY = 'mylife.events';
const TODOS_KEY = 'mylife.todos';
const GOALS_KEY = 'mylife.goals';

function read<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function write<T>(key: string, items: T[]): void {
  localStorage.setItem(key, JSON.stringify(items));
}

/**
 * 本地存储实现：数据存在浏览器 localStorage 里，刷新不丢。
 *
 * 优点：零配置、离线可用、最适合「先跑通」。
 * 缺点：只在当前这台设备的当前浏览器上，无法双端同步。
 *       之后由 SupabaseStorage 补上同步能力。
 */
export const localStorageStorage: Storage = {
  async loadActivities() {
    return read<Activity>(ACTIVITIES_KEY);
  },

  async loadEvents() {
    return read<ScheduleEvent>(EVENTS_KEY);
  },

  async loadTodos() {
    return read<Todo>(TODOS_KEY);
  },

  async loadGoals() {
    return read<Goal>(GOALS_KEY);
  },

  async saveActivity(activity) {
    const list = read<Activity>(ACTIVITIES_KEY);
    const idx = list.findIndex((a) => a.id === activity.id);
    if (idx >= 0) list[idx] = activity;
    else list.push(activity);
    write(ACTIVITIES_KEY, list);
  },

  async deleteActivity(id) {
    write(
      ACTIVITIES_KEY,
      read<Activity>(ACTIVITIES_KEY).filter((a) => a.id !== id)
    );
  },

  async saveEvent(event) {
    const list = read<ScheduleEvent>(EVENTS_KEY);
    const idx = list.findIndex((e) => e.id === event.id);
    if (idx >= 0) list[idx] = event;
    else list.push(event);
    write(EVENTS_KEY, list);
  },

  async deleteEvent(id) {
    write(
      EVENTS_KEY,
      read<ScheduleEvent>(EVENTS_KEY).filter((e) => e.id !== id)
    );
  },

  async saveTodo(todo) {
    const list = read<Todo>(TODOS_KEY);
    const idx = list.findIndex((t) => t.id === todo.id);
    if (idx >= 0) list[idx] = todo;
    else list.push(todo);
    write(TODOS_KEY, list);
  },

  async deleteTodo(id) {
    write(
      TODOS_KEY,
      read<Todo>(TODOS_KEY).filter((t) => t.id !== id)
    );
  },

  async saveGoal(goal) {
    const list = read<Goal>(GOALS_KEY);
    const idx = list.findIndex((g) => g.id === goal.id);
    if (idx >= 0) list[idx] = goal;
    else list.push(goal);
    write(GOALS_KEY, list);
  },

  async deleteGoal(id) {
    write(
      GOALS_KEY,
      read<Goal>(GOALS_KEY).filter((g) => g.id !== id)
    );
  },
};
