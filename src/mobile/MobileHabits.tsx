import { useState } from 'react';
import { useLifeStore } from '../features/activities/activityStore';
import { getHabitStatus } from '../features/habits/habitStatus';
import { PALETTE } from '../lib/palette';
import { Sheet } from './Sheet';
import { usePullToRefresh } from './usePullToRefresh';
import { reloadAll } from './reload';
import type { HabitMode } from '../types';

const MODE_LABEL: Record<HabitMode, string> = { strict: '强制', semi: '半强制', none: '非强制' };

function modeHint(mode: HabitMode, intervalDays: number): string {
  if (mode === 'strict') return `每 ${intervalDays} 天`;
  if (mode === 'semi') return `底线 ${intervalDays} 天`;
  return '无底线';
}

function sinceText(since: number | null): string {
  if (since === null) return '从未打卡';
  if (since === 0) return '今天';
  if (since === 1) return '昨天';
  return `${since} 天前`;
}

function HabitAddSheet({ onClose }: { onClose: () => void }) {
  const addHabit = useLifeStore((s) => s.addHabit);
  const [title, setTitle] = useState('');
  const [color, setColor] = useState(PALETTE[0]);
  const [mode, setMode] = useState<HabitMode>('strict');
  const [interval, setInterval] = useState(1);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    addHabit({ title: title.trim(), color, mode, intervalDays: interval });
    onClose();
  }

  return (
    <Sheet title="添加习惯" onClose={onClose}>
      <form className="mob-form" onSubmit={submit}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="例如：吃药 / 洗澡 / 背单词"
          autoFocus
        />
        <div className="mob-form__row">
          <select value={mode} onChange={(e) => setMode(e.target.value as HabitMode)}>
            <option value="strict">强制 · 每 X 天必须</option>
            <option value="semi">半强制 · X 天底线</option>
            <option value="none">非强制 · 只记录</option>
          </select>
          {mode !== 'none' && (
            <>
              <input
                type="number"
                value={interval}
                min={1}
                onChange={(e) => setInterval(Number(e.target.value))}
                style={{ width: 72 }}
              />
              <span className="unit">天</span>
            </>
          )}
        </div>
        <div className="palette">
          {PALETTE.map((c) => (
            <button
              key={c}
              type="button"
              className={`palette__dot ${c === color ? 'is-active' : ''}`}
              style={{ background: c }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>
        <button type="submit" className="btn-primary">
          添加习惯
        </button>
      </form>
    </Sheet>
  );
}

/** 习惯打卡移动版：卡片列表 + 大按钮打卡 + FAB 新增。 */
export function MobileHabits() {
  const activities = useLifeStore((s) => s.activities);
  const checkIn = useLifeStore((s) => s.checkIn);
  const removeHabit = useLifeStore((s) => s.removeHabit);

  const [addOpen, setAddOpen] = useState(false);
  const pull = usePullToRefresh(reloadAll);
  const habits = activities.filter((a) => a.habit);
  const now = new Date();

  return (
    <div className="mob-page">
      <header className="mob-page__head">
        <h2>习惯打卡</h2>
        <span className="mob-page__count">{habits.length} 个习惯</span>
      </header>

      <div
        className="mob-page__list"
        onTouchStart={pull.onTouchStart}
        onTouchMove={pull.onTouchMove}
        onTouchEnd={pull.onTouchEnd}
      >
        {(pull.pulling || pull.refreshing) && (
          <div className="pull-hint">
            {pull.refreshing ? '⟳ 同步中…' : pull.ready ? '松手刷新' : '下拉刷新'}
          </div>
        )}
        {habits.length === 0 && <p className="empty">还没有习惯，点右下角 + 添加</p>}
        {habits.map((a) => {
          const habit = a.habit!;
          const status = getHabitStatus(habit, now);
          return (
            <div key={a.id} className={`mob-habit ${status.due ? 'is-due' : ''}`}>
              <span className="mob-habit__dot" style={{ background: a.color }} />
              <div className="mob-habit__main">
                <div className="mob-habit__title">{a.title}</div>
                <div className="mob-habit__meta">
                  {MODE_LABEL[habit.mode]} · {modeHint(habit.mode, habit.intervalDays)}
                  {' · '}距上次 {sinceText(status.since)}
                  {status.countToday > 0 && ` · 今天 ${status.countToday} 次`}
                </div>
              </div>
              <button type="button" className="mob-habit__btn" onClick={() => checkIn(a.id)}>
                打卡
              </button>
              <button
                type="button"
                className="mob-habit__ghost"
                onClick={() => {
                  if (window.confirm(`取消「${a.title}」的习惯？（保留为普通活动）`)) removeHabit(a.id);
                }}
              >
                取消
              </button>
            </div>
          );
        })}
      </div>

      <button type="button" className="fab" onClick={() => setAddOpen(true)}>
        ＋
      </button>

      {addOpen && <HabitAddSheet onClose={() => setAddOpen(false)} />}
    </div>
  );
}
