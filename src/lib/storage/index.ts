import type { Storage } from './Storage';
import { localStorageStorage } from './localStorage';
import { supabaseStorage } from './supabase';
import { isSupabaseConfigured } from '../supabase';

/**
 * 这里决定「当前用哪个存储实现」。
 * 配置了 Supabase（.env 里有 URL 和 anon key）就自动用云端同步，
 * 否则退回本地 localStorage —— 上层功能代码零改动。
 */
export const storage: Storage = isSupabaseConfigured ? supabaseStorage : localStorageStorage;

export type { Storage };
