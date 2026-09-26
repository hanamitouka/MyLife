import { useEffect, useRef, useState } from 'react';
import { useLifeStore } from '../features/activities/activityStore';
import { useScheduleStore } from '../lib/scheduleStore';
import { useConfirmStore } from '../lib/confirmStore';
import { reloadAll } from './reload';
import type { ScheduleEvent } from '../types';

const HOUR_HEIGHT = 60; // 每小时高度（px）
const START_HOUR = 6; // 时间轴起点 06:00
const END_HOUR = 24; // 时间轴终点 24:00
const SNAP_MIN = 15; // 落点吸附粒度（分钟）
const GRID_HEIGHT = (END_HOUR - START_HOUR) * HOUR_HEIGHT;

function toDayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function minutesOf(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function snapTo(minutes: number): number {
  const snapped = Math.round(minutes / SNAP_MIN) * SNAP_MIN;
  return Math.min(Math.max(snapped, START_HOUR * 60), END_HOUR * 60);
}

function fmtHour(h: number): string {
  return h === 24 ? '00:00' : `${String(h).padStart(2, '0')}:00`;
}

function fmtDateTitle(d: Date): string {
  const today = new Date();
  const key = toDayKey(d);
  const md = `${d.getMonth() + 1}月${d.getDate()}日`;
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const wd = weekdays[d.getDay()];
  if (key === toDayKey(today)) return `今天 · ${md} ${wd}`;
  if (key === toDayKey(addDays(today, -1))) return `昨天 · ${md} ${wd}`;
  if (key === toDayKey(addDays(today, 1))) return `明天 · ${md} ${wd}`;
  return `${md} ${wd}`;
}

/** 删除确认（应用内弹窗，替代原生 window.confirm）。 */
async function confirmDeleteEvent(id: string, title: string) {
  const ok = await useConfirmStore.getState().ask(`删除「${title}」？`, '删除');
  if (ok) useLifeStore.getState().deleteEvent(id);
}

interface BlockProps {
  ev: ScheduleEvent;
  note?: string;
  top: number;
  height: number;
  onDelete: () => void;
  onMove: (minutes: number) => void;
  onDragStateChange: (dragging: boolean) => void;
}

/** 时间轴上的一个任务块：长按=拖动改时间，×=删除。 */
function MobEventBlock({ ev, note, top, height, onDelete, onMove, onDragStateChange }: BlockProps) {
  const [dragging, setDragging] = useState(false);
  const [dragY, setDragY] = useState(0);
  const timerRef = useRef<number | null>(null);
  const pendingRef = useRef(false);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const elRef = useRef<HTMLDivElement | null>(null);
  const pointerIdRef = useRef<number | null>(null);

  const startMin = minutesOf(new Date(ev.start));

  function clearTimer() {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  function enterDrag() {
    setDragging(true);
    setDragY(0);
    onDragStateChange(true);
    const el = elRef.current;
    if (!el) return;
    // 阻止浏览器接管滚动（长按进入拖动后，页面不再滚）
    el.style.touchAction = 'none';
    if (pointerIdRef.current !== null) {
      try {
        el.setPointerCapture(pointerIdRef.current);
      } catch {
        /* 元素已脱离或指针已释放时忽略 */
      }
    }
  }

  function exitDrag() {
    clearTimer();
    pendingRef.current = false;
    setDragging(false);
    setDragY(0);
    onDragStateChange(false);
    if (elRef.current) {
      elRef.current.style.touchAction = '';
    }
    pointerIdRef.current = null;
    elRef.current = null;
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    startRef.current = { x: e.clientX, y: e.clientY };
    pendingRef.current = true;
    pointerIdRef.current = e.pointerId;
    elRef.current = e.currentTarget;
    clearTimer();
    // 长按 300ms 后进入拖动态；期间手指移动超过阈值则判定为滚动，取消
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      if (!pendingRef.current || !elRef.current) return;
      pendingRef.current = false;
      enterDrag();
    }, 300);
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!pendingRef.current && !dragging) return;
    const s = startRef.current;
    if (!s) return;
    if (pendingRef.current) {
      if (Math.abs(e.clientX - s.x) > 8 || Math.abs(e.clientY - s.y) > 8) {
        pendingRef.current = false;
        clearTimer(); // 让浏览器接管滚动
      }
      return;
    }
    setDragY(e.clientY - s.y);
  }

  function resetDrag() {
    if (dragging) {
      const snapped = snapTo(startMin + (dragY / HOUR_HEIGHT) * 60);
      // 纯长按未移动时不重排（避免把时间轻微吸附到 15 分钟刻度）
      if (snapped !== snapTo(startMin)) onMove(snapped);
    }
    exitDrag();
  }

  function onPointerCancel() {
    exitDrag();
  }

  return (
    <div
      className={`mob-ev ${dragging ? 'mob-ev--dragging' : ''}`}
      style={{
        background: ev.color,
        top,
        height,
        transform: dragging ? `translateY(${dragY}px)` : undefined,
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={resetDrag}
      onPointerCancel={onPointerCancel}
    >
      <div className="mob-ev__body">
        <span className="mob-ev__title">{ev.title}</span>
        {note && <span className="mob-ev__note">{note}</span>}
      </div>
      <button
        type="button"
        className="mob-ev__del"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
      >
        ×
      </button>
    </div>
  );
}

/**
 * 自研移动端单日时间轴：竖线 + 时间刻度 + 任务块。
 * - 左右滑动（或 ◀ ▶ 按钮）切换日期
 * - 点选卡牌后，点时间轴空白处落点排期
 * - 任务块长按拖动改时间
 */
export function MobileTimeline() {
  const events = useLifeStore((s) => s.events);
  const activities = useLifeStore((s) => s.activities);
  const updateEvent = useLifeStore((s) => s.updateEvent);
  const selectedId = useScheduleStore((s) => s.selectedActivityId);

  const [day, setDay] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [now, setNow] = useState(() => new Date());
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const pullStartY = useRef<number | null>(null);
  const isDraggingCardRef = useRef(false);

  // 每分钟刷新一次「当前时间指示线」
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const dayKey = toDayKey(day);
  const isToday = dayKey === toDayKey(now);

  // 切换日期后：今天自动滚到当前时间附近，其他日期回到顶部
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (isToday) {
      const min = now.getHours() * 60 + now.getMinutes();
      const target = ((min - START_HOUR * 60) / 60) * HOUR_HEIGHT - 80;
      el.scrollTop = Math.max(0, target);
    } else {
      el.scrollTop = 0;
    }
    // 只关心日期切换，now 每分钟刷新时不需要重新滚动
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayKey]);

  const selectedActivity = activities.find((a) => a.id === selectedId);

  const dayEvents = events
    .filter((e) => toDayKey(new Date(e.start)) === dayKey)
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  function placeEvent(minutes: number) {
    if (!selectedActivity) return;
    const start = new Date(day);
    start.setHours(0, minutes, 0, 0);
    const end = new Date(start.getTime() + selectedActivity.durationMinutes * 60_000);
    useLifeStore
      .getState()
      .addEvent({ activityId: selectedActivity.id, start: start.toISOString(), end: end.toISOString() });
    useScheduleStore.getState().clear();
  }

  function moveEvent(id: string, minutes: number) {
    const ev = events.find((x) => x.id === id);
    if (!ev) return;
    const duration = new Date(ev.end).getTime() - new Date(ev.start).getTime();
    const start = new Date(day);
    start.setHours(0, minutes, 0, 0);
    const end = new Date(start.getTime() + duration);
    updateEvent(id, { start: start.toISOString(), end: end.toISOString() });
  }

  function handleGridClick(e: React.MouseEvent) {
    if (!selectedActivity) return;
    const target = e.target as HTMLElement;
    if (target.closest('.mob-ev')) return; // 点在了任务块上
    const grid = gridRef.current;
    if (!grid) return;
    const rect = grid.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const minutes = START_HOUR * 60 + (y / HOUR_HEIGHT) * 60;
    placeEvent(snapTo(minutes));
  }

  function onTouchStart(e: React.TouchEvent) {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
    // 列表在顶部时才允许下拉刷新
    pullStartY.current = scrollRef.current && scrollRef.current.scrollTop <= 0 ? t.clientY : null;
  }

  function onTouchMove(e: React.TouchEvent) {
    // 拖动卡片时，禁用下拉刷新 / 左右切日期的手势
    if (isDraggingCardRef.current) return;
    if (pullStartY.current === null || refreshing) return;
    const dy = e.touches[0].clientY - pullStartY.current;
    setPull(Math.max(0, Math.min(dy, 120)));
  }

  function onTouchEnd(e: React.TouchEvent) {
    // 拖动卡片中松手：忽略这次手势（不切日期、不刷新），并清掉残留状态
    if (isDraggingCardRef.current) {
      touchStart.current = null;
      pullStartY.current = null;
      setPull(0);
      return;
    }
    if (!touchStart.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    touchStart.current = null;

    // 先判断下拉刷新（向下拉且列表在顶部）
    if (pullStartY.current !== null && pull >= 64 && !refreshing) {
      pullStartY.current = null;
      setPull(0);
      setRefreshing(true);
      void reloadAll().finally(() => setRefreshing(false));
      return;
    }
    pullStartY.current = null;
    setPull(0);

    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      setDay((d) => addDays(d, dx < 0 ? 1 : -1));
    }
  }

  const hours: number[] = [];
  for (let h = START_HOUR; h <= END_HOUR; h++) hours.push(h);

  const nowMin = now.getHours() * 60 + now.getMinutes();
  const nowTop = ((nowMin - START_HOUR * 60) / 60) * HOUR_HEIGHT;
  const showNow = isToday && nowTop >= 0 && nowTop <= GRID_HEIGHT;

  return (
    <div className="mob-timeline">
      <div className="mob-timeline__head">
        <button type="button" className="mob-timeline__nav" onClick={() => setDay((d) => addDays(d, -1))}>
          ‹
        </button>
        <div className="mob-timeline__title">
          {refreshing ? '⟳ 同步中…' : pull >= 64 ? '松手刷新' : pull > 0 ? '下拉刷新' : fmtDateTitle(day)}
        </div>
        <button type="button" className="mob-timeline__nav" onClick={() => setDay((d) => addDays(d, 1))}>
          ›
        </button>
        {!isToday && (
          <button
            type="button"
            className="mob-timeline__today"
            onClick={() => {
              const d = new Date();
              d.setHours(0, 0, 0, 0);
              setDay(d);
            }}
          >
            今天
          </button>
        )}
      </div>

      <div
        className="mob-timeline__scroll"
        ref={scrollRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={handleGridClick}
      >
        <div className="mob-timeline__grid" ref={gridRef} style={{ height: GRID_HEIGHT }}>
          {hours.map((h) => (
            <div key={h} className="mob-timeline__hour" style={{ top: (h - START_HOUR) * HOUR_HEIGHT }}>
              <span className="mob-timeline__hour-label">{fmtHour(h)}</span>
              <div className="mob-timeline__hour-line" />
            </div>
          ))}

          {dayEvents.map((ev) => {
            const startMin = minutesOf(new Date(ev.start));
            const endMin = minutesOf(new Date(ev.end));
            const clampedStart = Math.max(startMin, START_HOUR * 60);
            const clampedEnd = Math.min(endMin, END_HOUR * 60);
            const top = ((clampedStart - START_HOUR * 60) / 60) * HOUR_HEIGHT;
            const height = Math.max(((clampedEnd - clampedStart) / 60) * HOUR_HEIGHT, 28);
            return (
              <MobEventBlock
                key={ev.id}
                ev={ev}
                note={activities.find((a) => a.id === ev.activityId)?.note}
                top={top}
                height={height}
                onDelete={() => void confirmDeleteEvent(ev.id, ev.title)}
                onMove={(minutes) => moveEvent(ev.id, minutes)}
                onDragStateChange={(v) => {
                  isDraggingCardRef.current = v;
                }}
              />
            );
          })}

          {showNow && <div className="mob-timeline__now" style={{ top: nowTop }} />}
        </div>
      </div>
    </div>
  );
}
