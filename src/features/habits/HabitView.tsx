import { useState } from 'react';
import { useLifeStore } from '../activities/activityStore';
import { getHabitStatus } from './habitStatus';
import { PALETTE } from '../../lib/palette';
import type { Activity, HabitMode } from '../../types';

const MODE_LABEL: Record<HabitMode, string> = {
  strict: '强制',
  semi: '半强制',
  none: '非强制',
};

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

interface CardProps {
  activity: Activity;
  now: Date;
  onCheckIn: () => void;
  onRemove: () => void;
}

function HabitCard({ activity, now, onCheckIn, onRemove }: CardProps) {
  const habit = activity.habit!;
  const status = getHabitStatus(habit, now);

  return (
    <div className={`habit-card ${status.due ? 'is-due' : ''}`}>
      <span className="habit-card__dot" style={{ background: activity.color }} />
      <div className="habit-card__main">
        <div className="habit-card__title">
          {activity.title}
          <span className="habit-card__mode">
            {MODE_LABEL[habit.mode]} · {modeHint(habit.mode, habit.intervalDays)}
          </span>
        </div>
        <div className="habit-card__meta">
          {status.due && '⚠️ 该打卡了 · '}
          距上次 {sinceText(status.since)}
          {status.countToday > 0 && ` · 今天已打卡 ${status.countToday} 次`}
        </div>
      </div>
      <button type="button" className="btn-primary" onClick={onCheckIn}>
        打卡
      </button>
      <button
        type="button"
        className="btn-ghost"
        onClick={onRemove}
        title="取消习惯（保留为普通活动）"
      >
        取消
      </button>
    </div>
  );
}

/** 习惯打卡视图：添加习惯 + 打卡 + 查看「距上次多久」。 */
export function HabitView() {
  const activities = useLifeStore((s) => s.activities);
  const addHabit = useLifeStore((s) => s.addHabit);
  const checkIn = useLifeStore((s) => s.checkIn);
  const removeHabit = useLifeStore((s) => s.removeHabit);

  const habits = activities.filter((a) => a.habit);
  const now = new Date();

  const [title, setTitle] = useState('');
  const [color, setColor] = useState(PALETTE[0]);
  const [mode, setMode] = useState<HabitMode>('strict');
  const [interval, setInterval] = useState(1);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    addHabit({ title: title.trim(), color, mode, intervalDays: interval });
    setTitle('');
  }

  return (
    <div className="habit-view">
      <form className="habit-add" onSubmit={handleAdd}>
        <h2>添加习惯</h2>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="例如：吃药 / 洗澡 / 背单词"
        />
        <div className="form-row">
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
          + 添加习惯
        </button>
      </form>

      <div className="habit-list">
        {habits.length === 0 && <p className="empty">还没有习惯，先在上面添加一个</p>}
        {habits.map((h) => (
          <HabitCard
            key={h.id}
            activity={h}
            now={now}
            onCheckIn={() => checkIn(h.id)}
            onRemove={() => removeHabit(h.id)}
          />
        ))}
      </div>
    </div>
  );
}
