import { useState } from 'react';
import { useTodoStore } from '../features/todos/todoStore';
import { getDdlStatus, sortTodos } from '../features/todos/todoStatus';
import { convertTodoToCard } from '../features/links/linkActions';
import { Sheet } from './Sheet';
import { usePullToRefresh } from './usePullToRefresh';
import { reloadAll } from './reload';
import type { Todo } from '../types';

const PRIORITY_LABEL: Record<number, string> = { 0: '无', 1: '低', 2: '中', 3: '高' };

const REMIND_OPTIONS = [
  { value: 0, label: '不提前提醒' },
  { value: 60, label: '提前 1 小时' },
  { value: 180, label: '提前 3 小时' },
  { value: 1440, label: '提前 1 天' },
  { value: 4320, label: '提前 3 天' },
];

function TodoAddSheet({ onClose }: { onClose: () => void }) {
  const addTodo = useTodoStore((s) => s.addTodo);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState(0);
  const [hasDue, setHasDue] = useState(false);
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [remind, setRemind] = useState(0);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    addTodo({
      title: title.trim(),
      priority,
      dueAt: hasDue && dueDate ? new Date(`${dueDate}T${dueTime || '00:00'}`).toISOString() : undefined,
      remindBeforeMinutes: hasDue && remind > 0 ? remind : undefined,
    });
    onClose();
  }

  return (
    <Sheet title="添加待办 / DDL" onClose={onClose}>
      <form className="mob-form" onSubmit={submit}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="例如：写周报 / 交水电费"
          autoFocus
        />
        <div className="mob-form__row">
          <select value={priority} onChange={(e) => setPriority(Number(e.target.value))}>
            <option value={0}>无优先级</option>
            <option value={1}>低优先级</option>
            <option value={2}>中优先级</option>
            <option value={3}>高优先级</option>
          </select>
          <label className="mob-check">
            <input
              type="checkbox"
              checked={hasDue}
              onChange={(e) => setHasDue(e.target.checked)}
            />
            有截止日期
          </label>
        </div>
        {hasDue && (
          <div className="mob-form__row">
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            <input type="time" value={dueTime} onChange={(e) => setDueTime(e.target.value)} />
            <select value={remind} onChange={(e) => setRemind(Number(e.target.value))}>
              {REMIND_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        )}
        <button type="submit" className="btn-primary">
          添加
        </button>
      </form>
    </Sheet>
  );
}

function TodoActionSheet({ todo, onClose }: { todo: Todo; onClose: () => void }) {
  const setPriority = useTodoStore((s) => s.setPriority);
  const togglePinned = useTodoStore((s) => s.togglePinned);
  const deleteTodo = useTodoStore((s) => s.deleteTodo);

  return (
    <Sheet title={todo.title} onClose={onClose}>
      <div className="mob-form">
        <div className="mob-form__label">优先级</div>
        <div className="mob-pills">
          {[0, 1, 2, 3].map((p) => (
            <button
              key={p}
              type="button"
              className={`mob-pill ${todo.priority === p ? 'is-active' : ''}`}
              onClick={() => {
                setPriority(todo.id, p);
                onClose();
              }}
            >
              {PRIORITY_LABEL[p]}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="btn-ghost"
          onClick={() => {
            togglePinned(todo.id);
            onClose();
          }}
        >
          {todo.pinned ? '取消置顶' : '置顶'}
        </button>
        {!todo.activityId && (
          <button
            type="button"
            className="btn-ghost"
            onClick={() => {
              convertTodoToCard(todo.id);
              onClose();
            }}
          >
            转为卡牌（排期）
          </button>
        )}
        <button
          type="button"
          className="btn-danger"
          onClick={() => {
            if (window.confirm(`删除「${todo.title}」？`)) {
              deleteTodo(todo.id);
              onClose();
            }
          }}
        >
          删除
        </button>
      </div>
    </Sheet>
  );
}

function metaText(todo: Todo, now: Date): string {
  const parts: string[] = [];
  if (todo.pinned) parts.push('📌');
  const ddl = getDdlStatus(todo, now);
  if (ddl) parts.push(`${ddl.overdue ? '⚠️' : ddl.remind ? '⏰' : ''}${ddl.text}`);
  if (todo.priority > 0) parts.push(`${PRIORITY_LABEL[todo.priority]}优先级`);
  if (todo.activityId) parts.push('已排期');
  return parts.join(' · ');
}

/** 待办 / DDL 移动版：卡片列表 + 右下角 FAB + 底部 sheet 新增/操作。 */
export function MobileTodos() {
  const todos = useTodoStore((s) => s.todos);
  const toggleDone = useTodoStore((s) => s.toggleDone);

  const [addOpen, setAddOpen] = useState(false);
  const [actionTodo, setActionTodo] = useState<Todo | null>(null);
  const pull = usePullToRefresh(reloadAll);

  const now = new Date();
  const sorted = sortTodos(todos);
  const undone = todos.filter((t) => !t.done).length;

  return (
    <div className="mob-page">
      <header className="mob-page__head">
        <h2>待办</h2>
        <span className="mob-page__count">{undone} 未完成</span>
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
        {sorted.length === 0 && <p className="empty">暂无待办，点右下角 + 添加</p>}
        {sorted.map((t) => {
          const ddl = getDdlStatus(t, now);
          const metaClass = ddl?.overdue ? 'overdue' : ddl?.remind ? 'remind' : '';
          return (
            <div
              key={t.id}
              className={`mob-todo ${t.done ? 'is-done' : ''}`}
              onClick={() => toggleDone(t.id)}
            >
              <span className="mob-todo__check">{t.done ? '✅' : '◯'}</span>
              <div className="mob-todo__main">
                <div className="mob-todo__title">{t.title}</div>
                <div className={`mob-todo__meta ${metaClass}`}>{metaText(t, now)}</div>
              </div>
              <button
                type="button"
                className="mob-todo__more"
                onClick={(e) => {
                  e.stopPropagation();
                  setActionTodo(t);
                }}
              >
                ⋯
              </button>
            </div>
          );
        })}
      </div>

      <button type="button" className="fab" onClick={() => setAddOpen(true)}>
        ＋
      </button>

      {addOpen && <TodoAddSheet onClose={() => setAddOpen(false)} />}
      {actionTodo && <TodoActionSheet todo={actionTodo} onClose={() => setActionTodo(null)} />}
    </div>
  );
}
