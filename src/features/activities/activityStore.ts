import { create } from 'zustand';
import { storage } from '../../lib/storage';
import type { Activity, HabitConfig, HabitMode, ScheduleEvent } from '../../types';

function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** 可写的活动字段（id、createdAt 由系统生成） */
type ActivityPatch = Partial<Omit<Activity, 'id' | 'createdAt'>>;

interface ActivityInput {
  title: string;
  color: string;
  durationMinutes: number;
  /** emoji 图标 */
  emoji?: string;
  /** 备注 */
  note?: string;
  /** 关联待办（从待办「转为卡牌」而来） */
  todoId?: string;
  /** 关联目标（从目标「生成卡牌」而来） */
  goalId?: string;
}

interface HabitInput {
  title: string;
  color: string;
  mode: HabitMode;
  intervalDays: number;
}

interface LifeStore {
  activities: Activity[];
  events: ScheduleEvent[];

  load: () => Promise<void>;

  addActivity: (input: ActivityInput) => string;
  updateActivity: (id: string, patch: ActivityPatch) => void;
  deleteActivity: (id: string) => void;

  addHabit: (input: HabitInput) => void;
  checkIn: (activityId: string) => void;
  removeHabit: (activityId: string) => void;

  addEvent: (input: { activityId: string; start: string; end: string }) => void;
  updateEvent: (id: string, patch: { start: string; end: string }) => void;
  setEventDone: (id: string, done: boolean) => void;
  deleteEvent: (id: string) => void;
  replaceAll: (data: { activities: Activity[]; events: ScheduleEvent[] }) => void;
}

/**
 * 全局状态中枢：负责「内存状态 + 写回存储」的联动。
 * 组件只调用这些方法，不需要关心数据最终存在 localStorage 还是 Supabase。
 */
export const useLifeStore = create<LifeStore>((set, get) => ({
  activities: [],
  events: [],

  async load() {
    const [activities, events] = await Promise.all([
      storage.loadActivities(),
      storage.loadEvents(),
    ]);
    set({ activities, events });
  },

  addActivity(input) {
    const activity: Activity = { id: genId(), createdAt: Date.now(), ...input };
    void storage.saveActivity(activity);
    set((s) => ({ activities: [...s.activities, activity] }));
    return activity.id;
  },

  updateActivity(id, patch) {
    set((s) => ({
      activities: s.activities.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    }));
    const updated = get().activities.find((a) => a.id === id);
    if (updated) void storage.saveActivity(updated);
  },

  deleteActivity(id) {
    void storage.deleteActivity(id);
    set((s) => ({ activities: s.activities.filter((a) => a.id !== id) }));
  },

  addHabit(input) {
    const habit: HabitConfig = {
      mode: input.mode,
      intervalDays: input.intervalDays,
      doneLog: [],
    };
    const activity: Activity = {
      id: genId(),
      createdAt: Date.now(),
      title: input.title,
      color: input.color,
      durationMinutes: 30,
      habit,
    };
    void storage.saveActivity(activity);
    set((s) => ({ activities: [...s.activities, activity] }));
  },

  checkIn(activityId) {
    const a = get().activities.find((x) => x.id === activityId);
    if (!a?.habit) return;
    const now = new Date().toISOString();
    const habit: HabitConfig = {
      ...a.habit,
      lastDoneAt: now,
      doneLog: [...a.habit.doneLog, now],
    };
    get().updateActivity(activityId, { habit });
  },

  removeHabit(activityId) {
    get().updateActivity(activityId, { habit: undefined });
  },

  addEvent(input) {
    const activity = get().activities.find((a) => a.id === input.activityId);
    if (!activity) return;
    const event: ScheduleEvent = {
      id: genId(),
      activityId: activity.id,
      title: activity.title,
      color: activity.color,
      start: input.start,
      end: input.end,
    };
    void storage.saveEvent(event);
    set((s) => ({ events: [...s.events, event] }));
  },

  updateEvent(id, patch) {
    set((s) => ({
      events: s.events.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    }));
    const updated = get().events.find((e) => e.id === id);
    if (updated) void storage.saveEvent(updated);
  },

  setEventDone(id, done) {
    set((s) => ({ events: s.events.map((e) => (e.id === id ? { ...e, done } : e)) }));
    const updated = get().events.find((e) => e.id === id);
    if (updated) void storage.saveEvent(updated);
  },

  deleteEvent(id) {
    void storage.deleteEvent(id);
    set((s) => ({ events: s.events.filter((e) => e.id !== id) }));
  },

  replaceAll(data) {
    for (const a of get().activities) void storage.deleteActivity(a.id);
    for (const e of get().events) void storage.deleteEvent(e.id);
    for (const a of data.activities) void storage.saveActivity(a);
    for (const e of data.events) void storage.saveEvent(e);
    set({ activities: data.activities, events: data.events });
  },
}));
