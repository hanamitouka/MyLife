import { useEffect, useRef, useState } from 'react';
import interact from 'interactjs';
import { useLifeStore } from './activityStore';
import { useScheduleStore } from '../../lib/scheduleStore';
import { ActivityCard } from './ActivityCard';
import { ActivityManager } from './ActivityManager';
import type { Activity } from '../../types';

/**
 * 左侧栏：只展示「活动库」卡片（拖拽源 / 点选源）。
 * 卡片用 interact.js 做拖拽（鼠标 + 触屏都支持），点选排期仍然可用。
 */
export function ActivityList() {
  const listRef = useRef<HTMLDivElement>(null);
  const activities = useLifeStore((s) => s.activities);
  const selectedId = useScheduleStore((s) => s.selectedActivityId);
  const [managerOpen, setManagerOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | undefined>(undefined);

  // 卡片拖拽（interact.js）
  useEffect(() => {
    interact('.activity-card').draggable({
      autoScroll: true,
      listeners: {
        start(event: any) {
          const target = event.target as HTMLElement;
          target.style.pointerEvents = 'none'; // 让 elementFromPoint 能穿透到时间轴
          target.style.opacity = '0.7';
          target.style.zIndex = '1000';
        },
        move(event: any) {
          const target = event.target as HTMLElement;
          const x = (parseFloat(target.getAttribute('data-x') || '0')) + event.dx;
          const y = (parseFloat(target.getAttribute('data-y') || '0')) + event.dy;
          target.style.transform = `translate(${x}px, ${y}px)`;
          target.setAttribute('data-x', String(x));
          target.setAttribute('data-y', String(y));
        },
        end(event: any) {
          const target = event.target as HTMLElement;
          target.style.pointerEvents = '';
          target.style.opacity = '';
          target.style.zIndex = '';
          target.style.transform = '';
          target.removeAttribute('data-x');
          target.removeAttribute('data-y');
        },
      },
    });
    return () => interact('.activity-card').unset();
  }, [activities]);

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
      <p className="hint">拖到时间轴安排，或点选后点时间轴 · 双击编辑</p>

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
