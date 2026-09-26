import { useEffect, useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import interact from 'interactjs';
import type { EventInput, EventDropArg } from '@fullcalendar/core';
import { useLifeStore } from '../activities/activityStore';
import { useScheduleStore } from '../../lib/scheduleStore';
import { useConfirmStore } from '../../lib/confirmStore';

/** 磁吸半径（分钟） */
const SNAP_THRESHOLD_MIN = 5;
/** 与 FullCalendar 的 slotMinTime 配置对应 */
const SLOT_MIN_MINUTES = 6 * 60;
/** 与 FullCalendar 默认 slotDuration 对应（30 分钟） */
const SLOT_DURATION_MINUTES = 30;

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

/** 把屏幕坐标转成时间轴上的时间（拖拽投放时用） */
function pointToDate(clientX: number, clientY: number): Date | null {
  const el = document.elementFromPoint(clientX, clientY);
  const td = el?.closest?.('td.fc-timegrid-slot') as HTMLElement | null;
  if (!td) return null;

  const tr = td.parentElement;
  const tbody = tr?.parentElement;
  if (!tr || !tbody) return null;

  const colIndex = Array.from(tr.children).indexOf(td);
  const rowIndex = Array.from(tbody.children).indexOf(tr);

  // 天：列索引 → 日期表头 th[data-date]
  const headers = document.querySelectorAll<HTMLElement>('th[data-date]');
  const dateStr = headers[colIndex]?.getAttribute('data-date');
  if (!dateStr) return null;

  // 时间：槽位起始 + td 内 Y 偏移
  const rect = td.getBoundingClientRect();
  const frac = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
  const minutes = SLOT_MIN_MINUTES + (rowIndex + frac) * SLOT_DURATION_MINUTES;

  const d = new Date(`${dateStr}T00:00:00`);
  d.setMinutes(minutes);
  return d;
}

/** 删除确认（应用内弹窗，替代原生 window.confirm）。 */
async function confirmDeleteEvent(id: string, title: string) {
  const ok = await useConfirmStore.getState().ask(`删除「${title}」？`, '删除');
  if (ok) useLifeStore.getState().deleteEvent(id);
}

/**
 * 右侧的日历 + 时间轴。
 * - 拖拽卡片投放（interact.js，鼠标 + 触屏）
 * - 点选卡片后点时间槽（点选排期）
 * - 拖动已有安排 / 点击完成 / 点击 × 删除
 */
export function TimelineCalendar() {
  const calendarRef = useRef<HTMLElement | null>(null);
  const events = useLifeStore((s) => s.events);
  const activities = useLifeStore((s) => s.activities);
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

  // 拖拽投放区（interact.js dropzone）
  useEffect(() => {
    const el = calendarRef.current;
    if (!el) return;
    interact(el).dropzone({
      accept: '.activity-card',
      overlap: 0.5,
      ondrop(event: any) {
        const id = (event.relatedTarget as HTMLElement)?.dataset?.activityId;
        const activity = useLifeStore.getState().activities.find((a) => a.id === id);
        if (!activity) return;
        const cx = event.dragEvent?.clientX ?? event.clientX;
        const cy = event.dragEvent?.clientY ?? event.clientY;
        const date = pointToDate(cx, cy);
        if (!date) return;
        const start = magneticSnap(date, new Date());
        const end = new Date(start.getTime() + activity.durationMinutes * 60_000);
        useLifeStore
          .getState()
          .addEvent({ activityId: activity.id, start: start.toISOString(), end: end.toISOString() });
        useScheduleStore.getState().clear();
      },
    });
    return () => interact(el).unset();
  }, []);

  const fcEvents: EventInput[] = events.map((e) => ({
    id: e.id,
    title: e.title,
    start: e.start,
    end: e.end,
    backgroundColor: e.color,
    borderColor: e.color,
    textColor: '#1a1b26',
    extendedProps: { note: activities.find((a) => a.id === e.activityId)?.note },
  }));

  function handleEventDrop(info: EventDropArg) {
    if (!info.event.start || !info.event.end) return;
    const duration = info.event.end.getTime() - info.event.start.getTime();
    const start = magneticSnap(info.event.start, new Date());
    const end = new Date(start.getTime() + duration);
    updateEvent(info.event.id, { start: start.toISOString(), end: end.toISOString() });
  }

  // 拖动卡片上/下边缘调整时长：直接回写新的起止时间（FullCalendar 已按 snapDuration 吸附）
  function handleEventResize(info: any) {
    if (!info.event.start || !info.event.end) return;
    updateEvent(info.event.id, {
      start: info.event.start.toISOString(),
      end: info.event.end.toISOString(),
    });
  }

  // 点选卡片后，点时间槽排期
  function handleDateClick(info: any) {
    if (!selectedActivity) return;
    const start = magneticSnap(info.date as Date, new Date());
    const end = new Date(start.getTime() + selectedActivity.durationMinutes * 60_000);
    useLifeStore
      .getState()
      .addEvent({ activityId: selectedActivity.id, start: start.toISOString(), end: end.toISOString() });
    useScheduleStore.getState().clear();
  }

  function renderEventContent(info: any) {
    const note = info.event.extendedProps.note as string | undefined;
    return (
      <div className="ev">
        <div className="ev__body">
          <span className="ev__title">{info.event.title}</span>
          {note && <span className="ev__note">{note}</span>}
        </div>
        <button
          type="button"
          className="ev__del"
          onMouseDown={(e: React.MouseEvent) => e.stopPropagation()}
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            void confirmDeleteEvent(info.event.id, info.event.title);
          }}
        >
          ×
        </button>
      </div>
    );
  }

  return (
    <main className="calendar-area" ref={calendarRef}>
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
        allDaySlot={false}
        slotMinTime="06:00:00"
        snapDuration="00:01:00"
        eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
        events={fcEvents}
        eventDrop={handleEventDrop}
        eventResize={handleEventResize}
        dateClick={handleDateClick}
        eventContent={renderEventContent}
        height="100%"
      />
    </main>
  );
}
