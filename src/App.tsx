import { useEffect, useLayoutEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Dashboard } from './features/dashboard/Dashboard';
import { HabitView } from './features/habits/HabitView';
import { TodoView } from './features/todos/TodoView';
import { GoalView } from './features/goals/GoalView';
import { AchievementsView } from './features/achievements/AchievementsView';
import { AuthScreen } from './features/auth/AuthScreen';
import { SettingsModal } from './features/settings/SettingsModal';
import { supabase, isSupabaseConfigured, signOut } from './lib/supabase';
import { useLifeStore } from './features/activities/activityStore';
import { useTodoStore } from './features/todos/todoStore';
import { useGoalStore } from './features/goals/goalStore';

type View = 'dashboard' | 'todos' | 'habits' | 'goals' | 'achievements';
type Theme = 'light' | 'dark';

const TABS: { key: View; label: string }[] = [
  { key: 'dashboard', label: '主界面' },
  { key: 'todos', label: '待办' },
  { key: 'habits', label: '习惯打卡' },
  { key: 'goals', label: '目标' },
  { key: 'achievements', label: '成就' },
];

export default function App() {
  const load = useLifeStore((s) => s.load);
  const loadTodos = useTodoStore((s) => s.load);
  const loadGoals = useGoalStore((s) => s.load);

  const [view, setView] = useState<View>('dashboard');
  const [theme, setTheme] = useState<Theme>(() =>
    localStorage.getItem('mylife.theme') === 'light' ? 'light' : 'dark'
  );
  const [session, setSession] = useState<Session | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // 应用并持久化主题（useLayoutEffect 避免首屏闪烁）
  useLayoutEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('mylife.theme', theme);
  }, [theme]);

  // 检查登录状态（未配置 Supabase 则直接跳过，走本地模式）
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setAuthChecked(true);
      return;
    }
    supabase!.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthChecked(true);
    });
    const { data: sub } = supabase!.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  // 登录后（或本地模式）加载数据
  useEffect(() => {
    if (!authChecked) return;
    if (isSupabaseConfigured && !session) return;
    void load();
    void loadTodos();
    void loadGoals();
  }, [authChecked, session, load, loadTodos, loadGoals]);

  // 切回本设备窗口时自动拉取最新（跨设备同步）
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const onFocus = () => {
      if (session) {
        void load();
        void loadTodos();
        void loadGoals();
      }
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [session, load, loadTodos, loadGoals]);

  if (!authChecked) return <div className="loading">加载中…</div>;
  if (isSupabaseConfigured && !session) return <AuthScreen />;

  return (
    <div className="app-shell">
      <nav className="topnav">
        <span className="topnav__brand">MyLife</span>
        <div className="topnav__right">
          <div className="topnav__tabs">
            {TABS.map((t) => (
              <button
                key={t.key}
                className={`tab ${view === t.key ? 'is-active' : ''}`}
                onClick={() => setView(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>
          <button
            className="theme-toggle"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title={theme === 'dark' ? '切换到浅色' : '切换到深色'}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button className="theme-toggle" onClick={() => setSettingsOpen(true)} title="设置">
            ⚙️
          </button>
          {isSupabaseConfigured && (
            <button className="btn-ghost btn-sm" onClick={() => void signOut()} title="退出登录">
              退出
            </button>
          )}
        </div>
      </nav>

      {view === 'dashboard' && <Dashboard onNavigate={setView} />}
      {view === 'todos' && <TodoView />}
      {view === 'habits' && <HabitView />}
      {view === 'goals' && <GoalView />}
      {view === 'achievements' && <AchievementsView />}
      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}
