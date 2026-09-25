import { useState } from 'react';
import { useGoalStore } from './goalStore';
import { getGoalProgress, sortGoals, formatRelativeTime, formatDate } from './goalStatus';
import { goalToTodo, goalToCard } from '../links/linkActions';
import type { Goal } from '../../types';

/** 目标树的一个节点（总目标与子目标共用，递归渲染）。 */
function GoalNode({ goal, isRoot }: { goal: Goal; isRoot: boolean }) {
  const toggleDone = useGoalStore((s) => s.toggleDone);
  const deleteGoal = useGoalStore((s) => s.deleteGoal);
  const addSubGoal = useGoalStore((s) => s.addSubGoal);
  const addLog = useGoalStore((s) => s.addLog);

  const [showAddSub, setShowAddSub] = useState(false);
  const [subTitle, setSubTitle] = useState('');
  const [showAddLog, setShowAddLog] = useState(false);
  const [logContent, setLogContent] = useState('');

  const p = getGoalProgress(goal);
  const now = Date.now();

  function submitSub(e: React.FormEvent) {
    e.preventDefault();
    if (!subTitle.trim()) return;
    addSubGoal(goal.id, subTitle.trim());
    setSubTitle('');
    setShowAddSub(false);
  }

  function submitLog(e: React.FormEvent) {
    e.preventDefault();
    if (!logContent.trim()) return;
    addLog(goal.id, logContent.trim());
    setLogContent('');
    setShowAddLog(false);
  }

  return (
    <div className={isRoot ? 'goal-card' : 'goal-node'}>
      <div className="goal-row">
        <input type="checkbox" checked={goal.done} onChange={() => toggleDone(goal.id)} />
        <span className={`goal-row__title ${goal.done ? 'is-done' : ''}`}>{goal.title}</span>
        {goal.subGoals.length > 0 && (
          <span className="goal-row__progress">
            {p.doneCount}/{p.total}
          </span>
        )}
        <button type="button" className="btn-ghost btn-sm" onClick={() => setShowAddSub(!showAddSub)}>
          ＋子目标
        </button>
        <button type="button" className="btn-ghost btn-sm" onClick={() => setShowAddLog(!showAddLog)}>
          ＋日志
        </button>
        <button type="button" className="btn-danger btn-sm" onClick={() => deleteGoal(goal.id)}>
          ×
        </button>
      </div>

      {isRoot && goal.description && <p className="goal-card__desc">{goal.description}</p>}
      {isRoot && goal.dueAt && <p className="goal-card__due">截止：{formatDate(goal.dueAt)}</p>}
      {isRoot && (
        <div className="goal-link-row">
          <button
            type="button"
            className="btn-ghost btn-sm"
            onClick={() => goalToTodo(goal.id, goal.title)}
          >
            → 生成待办
          </button>
          <button
            type="button"
            className="btn-ghost btn-sm"
            onClick={() => goalToCard(goal.id, goal.title)}
          >
            → 生成卡牌
          </button>
        </div>
      )}
      {isRoot && (
        <div className="progress-bar">
          <div className="progress-bar__fill" style={{ width: `${p.percent}%` }} />
        </div>
      )}
      {!goal.done && p.nextAction && <p className="goal-card__next">👉 下一步：{p.nextAction}</p>}

      {goal.logs.length > 0 && (
        <div className="goal-node__logs">
          {goal.logs.map((l) => (
            <div key={l.id} className="log">
              <span className="log__content">{l.content}</span>
              <span className="log__time">{formatRelativeTime(l.createdAt, now)}</span>
            </div>
          ))}
        </div>
      )}
      {showAddLog && (
        <form className="inline-add" onSubmit={submitLog}>
          <input
            value={logContent}
            onChange={(e) => setLogContent(e.target.value)}
            placeholder="+ 记录日志"
            autoFocus
          />
        </form>
      )}

      {goal.subGoals.length > 0 && (
        <div className="goal-node__children">
          {goal.subGoals.map((c) => (
            <GoalNode key={c.id} goal={c} isRoot={false} />
          ))}
        </div>
      )}
      {showAddSub && (
        <form className="inline-add" onSubmit={submitSub}>
          <input
            value={subTitle}
            onChange={(e) => setSubTitle(e.target.value)}
            placeholder="+ 输入子目标名称"
            autoFocus
          />
        </form>
      )}
    </div>
  );
}

/** 目标追踪视图：添加目标 + 可嵌套的子目标 + 每层日志 + 联动。 */
export function GoalView() {
  const goals = useGoalStore((s) => s.goals);
  const addGoal = useGoalStore((s) => s.addGoal);

  const sorted = sortGoals(goals);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueAt, setDueAt] = useState('');

  function handleAddGoal(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    addGoal({
      title: title.trim(),
      description: description.trim() || undefined,
      dueAt: dueAt || undefined,
    });
    setTitle('');
    setDescription('');
    setDueAt('');
  }

  return (
    <div className="goal-view">
      <form className="goal-add" onSubmit={handleAddGoal}>
        <h2>添加目标</h2>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="例如：三个月减重 5 公斤" />
        <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="描述（可选）" />
        <div className="form-row">
          <input type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
          <span className="unit">截止日期（可选）</span>
        </div>
        <button type="submit" className="btn-primary">
          + 添加目标
        </button>
      </form>

      <div className="goal-list">
        {sorted.length === 0 && <p className="empty">还没有目标，先添加一个</p>}
        {sorted.map((g) => (
          <GoalNode key={g.id} goal={g} isRoot />
        ))}
      </div>
    </div>
  );
}
