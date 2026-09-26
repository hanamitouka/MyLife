import { useState } from 'react';
import { useGoalStore } from '../features/goals/goalStore';
import { getGoalProgress, sortGoals, formatRelativeTime, formatDate } from '../features/goals/goalStatus';
import { goalToTodo, goalToCard } from '../features/links/linkActions';
import { Sheet } from './Sheet';
import { usePullToRefresh } from './usePullToRefresh';
import { reloadAll } from './reload';
import type { Goal } from '../types';

/** 目标树节点（总目标与子目标共用，递归渲染）。 */
function GoalNode({ goal, isRoot }: { goal: Goal; isRoot: boolean }) {
  const toggleDone = useGoalStore((s) => s.toggleDone);
  const deleteGoal = useGoalStore((s) => s.deleteGoal);
  const addSubGoal = useGoalStore((s) => s.addSubGoal);
  const addLog = useGoalStore((s) => s.addLog);

  const [showSub, setShowSub] = useState(false);
  const [subTitle, setSubTitle] = useState('');
  const [showLog, setShowLog] = useState(false);
  const [logContent, setLogContent] = useState('');

  const p = getGoalProgress(goal);
  const now = Date.now();

  function submitSub(e: React.FormEvent) {
    e.preventDefault();
    if (!subTitle.trim()) return;
    addSubGoal(goal.id, subTitle.trim());
    setSubTitle('');
    setShowSub(false);
  }

  function submitLog(e: React.FormEvent) {
    e.preventDefault();
    if (!logContent.trim()) return;
    addLog(goal.id, logContent.trim());
    setLogContent('');
    setShowLog(false);
  }

  return (
    <div className={isRoot ? 'mob-goal' : 'mob-goal-node'}>
      <div className="mob-goal__row">
        <input type="checkbox" checked={goal.done} onChange={() => toggleDone(goal.id)} />
        <span className={`mob-goal__title ${goal.done ? 'is-done' : ''}`}>{goal.title}</span>
        {goal.subGoals.length > 0 && (
          <span className="mob-goal__progress">
            {p.doneCount}/{p.total}
          </span>
        )}
      </div>

      {isRoot && goal.description && <p className="mob-goal__desc">{goal.description}</p>}
      {isRoot && goal.dueAt && <p className="mob-goal__due">截止 {formatDate(goal.dueAt)}</p>}
      {isRoot && (
        <div className="mob-goal__bar">
          <div className="mob-goal__fill" style={{ width: `${p.percent}%` }} />
        </div>
      )}
      {!goal.done && p.nextAction && <p className="mob-goal__next">👉 下一步：{p.nextAction}</p>}

      <div className="mob-goal__actions">
        <button type="button" className="btn-ghost btn-sm" onClick={() => setShowSub(!showSub)}>
          ＋子目标
        </button>
        <button type="button" className="btn-ghost btn-sm" onClick={() => setShowLog(!showLog)}>
          ＋日志
        </button>
        {isRoot && (
          <>
            <button type="button" className="btn-ghost btn-sm" onClick={() => goalToTodo(goal.id, goal.title)}>
              → 待办
            </button>
            <button type="button" className="btn-ghost btn-sm" onClick={() => goalToCard(goal.id, goal.title)}>
              → 卡牌
            </button>
          </>
        )}
        <button
          type="button"
          className="btn-danger btn-sm"
          onClick={() => {
            if (window.confirm(`删除「${goal.title}」？`)) deleteGoal(goal.id);
          }}
        >
          删
        </button>
      </div>

      {goal.logs.length > 0 && (
        <div className="mob-goal__logs">
          {goal.logs.map((l) => (
            <div key={l.id} className="mob-log">
              <span className="mob-log__content">{l.content}</span>
              <span className="mob-log__time">{formatRelativeTime(l.createdAt, now)}</span>
            </div>
          ))}
        </div>
      )}
      {showLog && (
        <form className="mob-inline" onSubmit={submitLog}>
          <input
            value={logContent}
            onChange={(e) => setLogContent(e.target.value)}
            placeholder="+ 记录日志"
            autoFocus
          />
        </form>
      )}

      {goal.subGoals.length > 0 && (
        <div className="mob-goal__children">
          {goal.subGoals.map((c) => (
            <GoalNode key={c.id} goal={c} isRoot={false} />
          ))}
        </div>
      )}
      {showSub && (
        <form className="mob-inline" onSubmit={submitSub}>
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

function GoalAddSheet({ onClose }: { onClose: () => void }) {
  const addGoal = useGoalStore((s) => s.addGoal);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueAt, setDueAt] = useState('');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    addGoal({
      title: title.trim(),
      description: description.trim() || undefined,
      dueAt: dueAt || undefined,
    });
    onClose();
  }

  return (
    <Sheet title="添加目标" onClose={onClose}>
      <form className="mob-form" onSubmit={submit}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="例如：三个月减重 5 公斤"
          autoFocus
        />
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="描述（可选）"
        />
        <div className="mob-form__row">
          <input type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
          <span className="unit">截止日期（可选）</span>
        </div>
        <button type="submit" className="btn-primary">
          添加目标
        </button>
      </form>
    </Sheet>
  );
}

/** 目标追踪移动版：递归目标树 + FAB 新增。 */
export function MobileGoals() {
  const goals = useGoalStore((s) => s.goals);
  const [addOpen, setAddOpen] = useState(false);
  const pull = usePullToRefresh(reloadAll);
  const sorted = sortGoals(goals);

  return (
    <div className="mob-page">
      <header className="mob-page__head">
        <h2>目标</h2>
        <span className="mob-page__count">{goals.filter((g) => !g.done).length} 进行中</span>
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
        {sorted.length === 0 && <p className="empty">还没有目标，点右下角 + 添加</p>}
        {sorted.map((g) => (
          <GoalNode key={g.id} goal={g} isRoot />
        ))}
      </div>

      <button type="button" className="fab" onClick={() => setAddOpen(true)}>
        ＋
      </button>

      {addOpen && <GoalAddSheet onClose={() => setAddOpen(false)} />}
    </div>
  );
}
