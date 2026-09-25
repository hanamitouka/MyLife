import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** 是否已配置 Supabase（.env 里有 URL 和 anon key） */
export const isSupabaseConfigured = Boolean(url && anonKey);

/** 未配置时为 null；配置了才创建客户端 */
export const supabase = isSupabaseConfigured ? createClient(url!, anonKey!) : null;

export async function signIn(email: string, password: string) {
  return supabase!.auth.signInWithPassword({ email, password });
}

export async function signUp(email: string, password: string) {
  return supabase!.auth.signUp({ email, password });
}

export async function signOut() {
  return supabase!.auth.signOut();
}
