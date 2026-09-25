import { useEffect, useRef, useState } from 'react';
import { Draggable } from '@fullcalendar/interaction';
import { useLifeStore } from './activityStore';
import { useScheduleStore } from '../../lib/scheduleStore';
import { ActivityCard } from './ActivityCard';
import { ActivityManager } from './ActivityManager';
import type { Activity } from '../../types';

/**
 * 左侧栏：只展示「活动库」卡片（拖拽源 / 点选源）。
 * 增删改在「管理活动」（新增）或双击卡片（编辑）里。
 */
export function ActivityList() {
  const listRef = useRef<HTMLDivElement>(null);
  const activities = useLifeStore((s) => s.activities);
  const selectedId = useScheduleStore((s) => s.selectedActivityId);
  const [managerOpen, setManagerOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | undefined>(undefined);

  // 让列表里的卡片可以被拖拽（桌面端）。手机端走「点选 → 点时间轴」。
  useEffect(() => {
    if (!listRef.current) return;
    const draggable = new Draggable(listRef.current, {
      itemSelector: '.activity-card',
      eventData(el) {
        const id = (el as HTMLElement).dataset.activityId;
        const activity = useLifeStore.getState().activities.find((a) => a.id === id);
        if (!activity) return {};
        return {
          title: activity.title,
          duration: { minutes: activity.durationMinutes },
          backgroundColor: activity.color,
          borderColor: activity.color,
        };
      },
    });
    return () => draggable.destroy();
  }, []);

  function openAdd() {
    setEditingActivity(undefined);
    setManagerOpen(true);
  }

  function openEdit(activity: Activity) {
    setEditingActivity(activity);
    setManagerOpen(true);
  }

  return (
    <aside className="sidebar">
      <div className="sidebar__head">
        <h2>活动库</h2>
        <button type="button" className="btn-ghost" onClick={openAdd}>
          管理活动
        </button>
      </div>
      <p className="hint">拖动或点选卡片，再到时间轴安排 · 双击编辑</p>

      <div className="activity-list" ref={listRef}>
        {activities.length === 0 && (
          <p className="empty">还没有活动，点「管理活动」新建一个</p>
        )}
        {activities.map((a) => (
          <ActivityCard
            key={a.id}
            activity={a}
            selected={a.id === selectedId}
            onClick={() => useScheduleStore.getState().toggle(a.id)}
            onDoubleClick={() => openEdit(a)}
          />
        ))}
      </div>

      {managerOpen && (
        <ActivityManager onClose={() => setManagerOpen(false)} initialActivity={editingActivity} />
      )}
    </aside>
  );
}
