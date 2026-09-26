import { useState } from 'react';
import { useTodoStore } from './todoStore';
import { getDdlStatus, sortTodos } from './todoStatus';
import { convertTodoToCard } from '../links/linkActions';
import type { Todo } from '../../types';

const PRIORITY_LABEL: Record<number, string> = { 0: '无', 1: '低', 2: '中', 3: '高' };

const REMIND_OPTIONS = [
  { value: 0, label: '不提前提醒' },
  { value: 60, label: '提前 1 小时' },
  { value: 180, label: '提前 3 小时' },
  { value: 1440, label: '提前 1 天' },
  { value: 4320, label: '提前 3 天' },
];

interface ItemProps {
  todo: Todo;
  now: Date;
  onToggle: () => void;
  onPriority: (p: number) => void;
  onPin: () => void;
  onConvert: () => void;
  onDelete: () => void;
}

function TodoItem({ todo, now, onToggle, onPriority, onPin, onConvert, onDelete }: ItemProps) {
  const ddl = getDdlStatus(todo, now);
  const cls = [
    'todo-item',
    todo.done ? 'is-done' : '',
    ddl?.overdue ? 'is-overdue' : '',
    ddl?.remind ? 'is-remind' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={cls}>
      <input type="checkbox" checked={todo.done} onChange={onToggle} />
      <div className="todo-item__main">
        <div className="todo-item__title">{todo.title}</div>
        <div className="todo-item__meta">
          {todo.pinned && '📌 '}
          {ddl && (
            <span className={ddl.overdue ? 'overdue' : ddl.remind ? 'remind' : ''}>
              {ddl.overdue ? '⚠️ ' : ddl.remind ? '⏰ ' : ''}
              {ddl.text}
            </span>
          )}
          {todo.priority > 0 && ` · ${PRIORITY_LABEL[todo.priority]}优先级`}
        </div>
      </div>
      <button type="button" className="btn-ghost" onClick={onPin}>
        {todo.pinned ? '取消置顶' : '置顶'}
      </button>
      {todo.activityId ? (
        <span className="tag" title="已生成活动卡牌，可到时间轴安排">
          已排期
        </span>
      ) : (
        <button type="button" className="btn-ghost btn-sm" onClick={onConvert}>
          转卡牌
        </button>
      )}
      <select value={todo.priority} onChange={(e) => onPriority(Number(e.target.value))}>
        <option value={0}>无优先级</option>
        <option value={1}>低</option>
        <option value={2}>中</option>
        <option value={3}>高</option>
      </select>
      <button type="button" className="btn-danger" onClick={onDelete}>
        删除
      </button>
    </div>
  );
}

/** 待办 + DDL 视图：一个列表同时容纳普通待办和带截止日期的任务。 */
export function TodoView() {
  const todos = useTodoStore((s) => s.todos);
  const addTodo = useTodoStore((s) => s.addTodo);
  const toggleDone = useTodoStore((s) => s.toggleDone);
  const setPriority = useTodoStore((s) => s.setPriority);
  const togglePinned = useTodoStore((s) => s.togglePinned);
  const deleteTodo = useTodoStore((s) => s.deleteTodo);

  const now = new Date();
  const sorted = sortTodos(todos);

  const [title, setTitle] = useState('');
  const [priority, setPriorityState] = useState(0);
  const [hasDue, setHasDue] = useState(false);
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [remindBefore, setRemindBefore] = useState(0);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    addTodo({
      title: title.trim(),
      priority,
      dueAt: hasDue && dueDate ? new Date(`${dueDate}T${dueTime || '00:00'}`).toISOString() : undefined,
      remindBeforeMinutes: hasDue && remindBefore > 0 ? remindBefore : undefined,
    });
    setTitle('');
    setHasDue(false);
    setDueDate('');
    setDueTime('');
    setRemindBefore(0);
  }

  return (
    <div className="todo-view">
      <form className="todo-add" onSubmit={handleAdd}>
        <h2>添加待办 / DDL</h2>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="例如：写周报 / 交水电费"
        />
        <div className="form-row">
          <select value={priority} onChange={(e) => setPriorityState(Number(e.target.value))}>
            <option value={0}>无优先级</option>
            <option value={1}>低优先级</option>
            <option value={2}>中优先级</option>
            <option value={3}>高优先级</option>
          </select>
          <label className="check">
            <input
              type="checkbox"
              checked={hasDue}
              onChange={(e) => setHasDue(e.target.checked)}
            />
            有截止日期
          </label>
        </div>
        {hasDue && (
          <div className="form-row">
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
            <input
              type="time"
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
            />
            <select
              value={remindBefore}
              onChange={(e) => setRemindBefore(Number(e.target.value))}
            >
              {REMIND_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        )}
        <button type="submit" className="btn-primary">
          + 添加
        </button>
      </form>

      <div className="todo-list">
        {sorted.length === 0 && <p className="empty">暂无待办，先添加一个</p>}
        {sorted.map((t) => (
          <TodoItem
            key={t.id}
            todo={t}
            now={now}
            onToggle={() => toggleDone(t.id)}
            onPriority={(p) => setPriority(t.id, p)}
            onPin={() => togglePinned(t.id)}
            onConvert={() => convertTodoToCard(t.id)}
            onDelete={() => deleteTodo(t.id)}
          />
        ))}
      </div>
    </div>
  );
}
