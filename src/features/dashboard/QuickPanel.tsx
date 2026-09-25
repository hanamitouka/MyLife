import { useTodoStore } from '../todos/todoStore';
import { useLifeStore } from '../activities/activityStore';
import { useGoalStore } from '../goals/goalStore';
import { sortTodos, getDdlStatus } from '../todos/todoStatus';
import { getHabitStatus } from '../habits/habitStatus';
import { getGoalProgress } from '../goals/goalStatus';

interface Props {
  onNavigate: (view: 'todos' | 'habits' | 'goals') => void;
}

/** 便捷待办打卡面板：快速看到 DDL 提醒、待办、待打卡习惯、目标进度，并支持快速操作。 */
export function QuickPanel({ onNavigate }: Props) {
  const todos = useTodoStore((s) => s.todos);
  const toggleDone = useTodoStore((s) => s.toggleDone);
  const activities = useLifeStore((s) => s.activities);
  const checkIn = useLifeStore((s) => s.checkIn);
  const goals = useGoalStore((s) => s.goals);

  const now = new Date();

  const undone = sortTodos(todos.filter((t) => !t.done));
  const overdueCount = undone.filter((t) => getDdlStatus(t, now)?.overdue).length;
  const remindCount = undone.filter((t) => getDdlStatus(t, now)?.remind).length;

  const dueHabits = activities
    .filter((a) => a.habit)
    .filter((a) => getHabitStatus(a.habit!, now).due);

  const activeGoals = goals.filter((g) => !g.done).slice(0, 3);

  return (
    <aside className="quick-panel">
      <section className="qp-section">
        <header>
          <h3>待办 / DDL</h3>
          <button type="button" onClick={() => onNavigate('todos')}>
            全部 →
          </button>
        </header>
        {overdueCount > 0 && <div className="qp-alert danger">⚠️ {overdueCount} 项已逾期</div>}
        {remindCount > 0 && <div className="qp-alert warn">⏰ {remindCount} 项临近截止</div>}
        {undone.slice(0, 5).map((t) => {
          const ddl = getDdlStatus(t, now);
          return (
            <div key={t.id} className="qp-item">
              <input type="checkbox" checked={t.done} onChange={() => toggleDone(t.id)} />
              <span className="qp-item__title">{t.title}</span>
              {ddl && (
                <span className={`qp-item__meta ${ddl.overdue ? 'overdue' : ''}`}>{ddl.text}</span>
              )}
            </div>
          );
        })}
        {undone.length === 0 && <p className="empty">暂无待办</p>}
      </section>

      <section className="qp-section">
        <header>
          <h3>习惯打卡</h3>
          <button type="button" onClick={() => onNavigate('habits')}>
            全部 →
          </button>
        </header>
        {dueHabits.map((h) => (
          <div key={h.id} className="qp-item">
            <span className="qp-item__dot" style={{ background: h.color }} />
            <span className="qp-item__title">{h.title}</span>
            <button type="button" className="btn-primary btn-sm" onClick={() => checkIn(h.id)}>
              打卡
            </button>
          </div>
        ))}
        {dueHabits.length === 0 && <p className="empty">今天都搞定啦 🎉</p>}
      </section>

      <section className="qp-section">
        <header>
          <h3>当前目标</h3>
          <button type="button" onClick={() => onNavigate('goals')}>
            全部 →
          </button>
        </header>
        {activeGoals.map((g) => {
          const p = getGoalProgress(g);
          return (
            <div key={g.id} className="qp-item">
              <span className="qp-item__title">{g.title}</span>
              <span className="qp-item__meta">{p.percent}%</span>
            </div>
          );
        })}
        {activeGoals.length === 0 && <p className="empty">暂无进行中的目标</p>}
      </section>
    </aside>
  );
}
