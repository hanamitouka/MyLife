import { supabase } from '../supabase';
import type { Storage } from './Storage';
import type { Activity, ScheduleEvent, Todo, Goal } from '../../types';

type Kind = 'activity' | 'event' | 'todo' | 'goal';

function client() {
  if (!supabase) throw new Error('Supabase 未配置');
  return supabase;
}

async function loadAll<T>(kind: Kind): Promise<T[]> {
  const { data, error } = await client().from('documents').select('data').eq('kind', kind);
  if (error) throw error;
  return (data ?? []).map((r) => r.data as T);
}

async function upsert<T extends { id: string }>(kind: Kind, doc: T): Promise<void> {
  const { error } = await client()
    .from('documents')
    .upsert({ id: doc.id, kind, data: doc });
  if (error) throw error;
}

async function remove(kind: Kind, id: string): Promise<void> {
  const { error } = await client().from('documents').delete().eq('kind', kind).eq('id', id);
  if (error) throw error;
}

/**
 * 云端存储实现：数据存在 Supabase 的 `documents` 表（每行一个 JSONB 文档）。
 * 双端同步：所有设备登录同一个账号，读写同一个表，行级安全保证只能看到自己的数据。
 */
export const supabaseStorage: Storage = {
  async loadActivities() {
    return loadAll<Activity>('activity');
  },
  async loadEvents() {
    return loadAll<ScheduleEvent>('event');
  },
  async loadTodos() {
    return loadAll<Todo>('todo');
  },
  async loadGoals() {
    return loadAll<Goal>('goal');
  },

  async saveActivity(a) {
    await upsert('activity', a);
  },
  async deleteActivity(id) {
    await remove('activity', id);
  },

  async saveEvent(e) {
    await upsert('event', e);
  },
  async deleteEvent(id) {
    await remove('event', id);
  },

  async saveTodo(t) {
    await upsert('todo', t);
  },
  async deleteTodo(id) {
    await remove('todo', id);
  },

  async saveGoal(g) {
    await upsert('goal', g);
  },
  async deleteGoal(id) {
    await remove('goal', id);
  },
};
