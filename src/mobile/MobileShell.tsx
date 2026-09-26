import { useState } from 'react';
import { MobileToday } from './MobileToday';
import { MobileTodos } from './MobileTodos';
import { MobileHabits } from './MobileHabits';
import { MobileGoals } from './MobileGoals';
import { MobileMe } from './MobileMe';
import './mobile.css';

type Tab = 'today' | 'todos' | 'habits' | 'goals' | 'me';

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'today', label: '今天', icon: '📅' },
  { key: 'todos', label: '待办', icon: '✅' },
  { key: 'habits', label: '习惯', icon: '🔥' },
  { key: 'goals', label: '目标', icon: '🎯' },
  { key: 'me', label: '我', icon: '👤' },
];

interface Props {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

/** 移动端外壳：底部 Tab Bar + 各 tab 内容（与桌面端共用同一批 store）。 */
export function MobileShell({ theme, onToggleTheme }: Props) {
  const [tab, setTab] = useState<Tab>('today');

  return (
    <div className="mobile-app">
      <div className="mob-content">
        {tab === 'today' && <MobileToday />}
        {tab === 'todos' && <MobileTodos />}
        {tab === 'habits' && <MobileHabits />}
        {tab === 'goals' && <MobileGoals />}
        {tab === 'me' && <MobileMe theme={theme} onToggleTheme={onToggleTheme} />}
      </div>

      <nav className="mob-tabbar">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`mob-tabbar__item ${tab === t.key ? 'is-active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            <span className="mob-tabbar__icon">{t.icon}</span>
            <span className="mob-tabbar__label">{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
