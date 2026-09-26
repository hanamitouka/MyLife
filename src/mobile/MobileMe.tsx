import { useState } from 'react';
import { AchievementsView } from '../features/achievements/AchievementsView';
import { SettingsModal } from '../features/settings/SettingsModal';
import { isSupabaseConfigured, signOut } from '../lib/supabase';
import { reloadAll } from './reload';

interface Props {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

/** 「我」页：成就 + 主题切换 + 设置（备份/恢复）+ 退出登录。 */
export function MobileMe({ theme, onToggleTheme }: Props) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);

  function handleSync() {
    setSyncing(true);
    void reloadAll().finally(() => setSyncing(false));
  }

  return (
    <div className="mob-me">
      <header className="mob-page__head">
        <h2>我的</h2>
        <div className="mob-me__actions">
          <button type="button" className="btn-ghost" onClick={handleSync} title="同步">
            {syncing ? '⟳' : '↻'}
          </button>
          <button type="button" className="btn-ghost" onClick={onToggleTheme}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button type="button" className="btn-ghost" onClick={() => setSettingsOpen(true)}>
            ⚙️
          </button>
          {isSupabaseConfigured && (
            <button type="button" className="btn-ghost" onClick={() => void signOut()}>
              退出
            </button>
          )}
        </div>
      </header>

      <div className="mob-me__body">
        <AchievementsView />
      </div>

      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}
