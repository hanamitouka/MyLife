import { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventInput, EventDropArg } from '@fullcalendar/core';
import { useLifeStore } from '../activities/activityStore';
import { useScheduleStore } from '../../lib/scheduleStore';
import { toggleEventDone } from '../links/linkActions';

/** 磁吸半径（分钟） */
const SNAP_THRESHOLD_MIN = 5;

function magneticSnap(date: Date, now: Date): Date {
  const t = date.getHours() * 60 + date.getMinutes();
  const halfHour = Math.min(Math.round(t / 30) * 30, 1410);

  const isSameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  const candidates = [{ target: halfHour, dist: Math.abs(t - halfHour) }];
  if (isSameDay) {
    const nowMin = now.getHours() * 60 + now.getMinutes();
    candidates.push({ target: nowMin, dist: Math.abs(t - nowMin) });
  }

  const best = candidates
    .filter((c) => c.dist <= SNAP_THRESHOLD_MIN)
    .sort((a, b) => a.dist - b.dist)[0];

  if (!best) return date;

  const result = new Date(date);
  result.setHours(Math.floor(best.target / 60), best.target % 60, 0, 0);
  return result;
}

/**
 * 右侧的日历 + 时间轴。
 * - 桌面端：拖拽排期；手机端：点选卡片后点时间轴排期。
 * - 手机端默认日视图（更清晰），桌面端默认周视图。
 */
export function TimelineCalendar() {
  const events = useLifeStore((s) => s.events);
  const activities = useLifeStore((s) => s.activities);
  const addEvent = useLifeStore((s) => s.addEvent);
  const updateEvent = useLifeStore((s) => s.updateEvent);
  const selectedId = useScheduleStore((s) => s.selectedActivityId);

  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 768px)').matches);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const selectedActivity = activities.find((a) => a.id === selectedId);

  const fcEvents: EventInput[] = events.map((e) => ({
    id: e.id,
    title: e.title,
    start: e.start,
    end: e.end,
    backgroundColor: e.color,
    borderColor: e.color,
    textColor: '#1a1b26',
    extendedProps: { done: e.done },
  }));

  function handleDrop(info: any) {
    const id = info.draggedEl?.dataset?.activityId as string | undefined;
    const activity = useLifeStore.getState().activities.find((a) => a.id === id);
    if (!activity) return;
    const start = magneticSnap(info.date as Date, new Date());
    const end = new Date(start.getTime() + activity.durationMinutes * 60_000);
    addEvent({ activityId: activity.id, start: start.toISOString(), end: end.toISOString() });
  }

  function handleEventDrop(info: EventDropArg) {
    if (!info.event.start || !info.event.end) return;
    const duration = info.event.end.getTime() - info.event.start.getTime();
    const start = magneticSnap(info.event.start, new Date());
    const end = new Date(start.getTime() + duration);
    updateEvent(info.event.id, { start: start.toISOString(), end: end.toISOString() });
  }

  function handleEventClick(info: any) {
    toggleEventDone(info.event.id);
  }

  // 点选卡片后，点时间轴的某个时间槽来安排（手机端替代拖拽）
  function handleDateClick(info: any) {
    if (!selectedActivity) return;
    const start = magneticSnap(info.date as Date, new Date());
    const end = new Date(start.getTime() + selectedActivity.durationMinutes * 60_000);
    addEvent({ activityId: selectedActivity.id, start: start.toISOString(), end: end.toISOString() });
    useScheduleStore.getState().clear();
  }

  function renderEventContent(info: any) {
    const done = !!info.event.extendedProps.done;
    return (
      <div className={`ev ${done ? 'ev--done' : ''}`}>
        <span className="ev__title">{info.event.title}</span>
        <button
          type="button"
          className="ev__del"
          onMouseDown={(e: React.MouseEvent) => e.stopPropagation()}
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            if (window.confirm(`删除「${info.event.title}」？`)) {
              useLifeStore.getState().deleteEvent(info.event.id);
            }
          }}
        >
          ×
        </button>
      </div>
    );
  }

  return (
    <main className="calendar-area">
      {selectedActivity && (
        <div className="schedule-hint" onClick={() => useScheduleStore.getState().clear()}>
          👉 已选中「{selectedActivity.title}」，点时间轴安排（点此取消）
        </div>
      )}
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView={isMobile ? 'timeGridDay' : 'timeGridWeek'}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'timeGridWeek,timeGridDay,dayGridMonth',
        }}
        locale="zh-cn"
        nowIndicator
        editable
        droppable
        allDaySlot={false}
        slotMinTime="06:00:00"
        snapDuration="00:01:00"
        eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
        events={fcEvents}
        drop={handleDrop}
        eventDrop={handleEventDrop}
        eventClick={handleEventClick}
        dateClick={handleDateClick}
        eventContent={renderEventContent}
        height="100%"
      />
    </main>
  );
}
