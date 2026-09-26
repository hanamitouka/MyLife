import { useState } from 'react';
import { useLifeStore } from '../features/activities/activityStore';
import { useScheduleStore } from '../lib/scheduleStore';
import { ActivityManager } from '../features/activities/ActivityManager';
import { MobileTimeline } from './MobileTimeline';

/** 「今天」页：单日时间轴 + 底部横滑卡牌池。 */
export function MobileToday() {
  const activities = useLifeStore((s) => s.activities);
  const selectedId = useScheduleStore((s) => s.selectedActivityId);
  const [managerOpen, setManagerOpen] = useState(false);

  const selected = activities.find((a) => a.id === selectedId);

  return (
    <div className="mob-today">
      <MobileTimeline />

      {selected && (
        <div className="mob-select-hint" onClick={() => useScheduleStore.getState().clear()}>
          👉 已选中「{selected.title}」，点时间轴安排（点此取消）
        </div>
      )}

      <div className="mob-strip">
        <div className="mob-strip__cards">
          {activities.map((a) => (
            <button
              key={a.id}
              type="button"
              className={`mob-card ${a.id === selectedId ? 'is-selected' : ''}`}
              style={{ borderLeftColor: a.color }}
              onClick={() => useScheduleStore.getState().toggle(a.id)}
            >
              <span>{a.emoji ?? '•'}</span>
              <span>{a.title}</span>
            </button>
          ))}
          <button type="button" className="mob-card mob-card--add" onClick={() => setManagerOpen(true)}>
            ＋ 管理活动
          </button>
        </div>
      </div>

      {managerOpen && <ActivityManager onClose={() => setManagerOpen(false)} />}
    </div>
  );
}
