import { useLifeStore } from '../activities/activityStore';
import { useTodoStore } from '../todos/todoStore';
import { useGoalStore } from '../goals/goalStore';
import { formatRelativeTime } from '../goals/goalStatus';
import {
  collectActivityDays,
  computeHabitStats,
  computeGoalStats,
  collectRecentEvents,
  dateKey,
} from './stats';

const WEEKS = 26; // 热度图显示最近 26 周

function heatColor(count: number): string {
  if (count === 0) return 'var(--heat-0)';
  if (count === 1) return 'var(--heat-1)';
  if (count === 2) return 'var(--heat-2)';
  if (count === 3) return 'var(--heat-3)';
  return 'var(--heat-4)';
}

/** 生成热度图网格：外数组=周，内数组=周一到周日 */
function buildGrid(weeks: number, today: Date): (Date | null)[][] {
  const start = new Date(today);
  start.setHours(0, 0, 0, 0);
  const dow = (start.getDay() + 6) % 7; // 0=周一
  start.setDate(start.getDate() - dow - (weeks - 1) * 7);

  const grid: (Date | null)[][] = [];
  for (let w = 0; w < weeks; w++) {
    const col: (Date | null)[] = [];
    for (let d = 0; d < 7; d++) {
      const day = new Date(start);
      day.setDate(start.getDate() + w * 7 + d);
      col.push(day.getTime() > today.getTime() ? null : day);
    }
    grid.push(col);
  }
  return grid;
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="ach-card">
      <span className="ach-card__value">{value}</span>
      <span className="ach-card__label">{label}</span>
    </div>
  );
}

/** 个人成就视图：从现有数据派生统计，不需要额外存储。 */
export function AchievementsView() {
  const activities = useLifeStore((s) => s.activities);
  const todos = useTodoStore((s) => s.todos);
  const goals = useGoalStore((s) => s.goals);

  const now = new Date();
  const dayCounts = collectActivityDays(activities, todos, goals);
  const habitStats = computeHabitStats(activities, now);
  const goalStats = computeGoalStats(goals);
  const recentEvents = collectRecentEvents(activities, todos, goals, 12);

  const totalEvents = Array.from(dayCounts.values()).reduce((a, b) => a + b, 0);
  const totalCheckIns = activities.reduce((sum, a) => sum + (a.habit?.doneLog.length ?? 0), 0);
  const doneTodos = todos.filter((t) => t.done).length;
  const activeGoals = goals.filter((g) => !g.done).length;

  const grid = buildGrid(WEEKS, now);

  return (
    <div className="ach-view">
      <h2>个人成就</h2>

      <div className="ach-cards">
        <StatCard label="累计活跃事件" value={totalEvents} />
        <StatCard label="习惯打卡次数" value={totalCheckIns} />
        <StatCard label="已完成待办" value={doneTodos} />
        <StatCard label="进行中目标" value={activeGoals} />
      </div>

      <section className="ach-section">
        <h3>每日热度图</h3>
        <div className="heatmap">
          <div className="heatmap__grid">
            {grid.map((week, wi) => (
              <div className="heatmap__col" key={wi}>
                {week.map((day, di) =>
                  day === null ? (
                    <div className="heatmap__cell heatmap__cell--empty" key={di} />
                  ) : (
                    <div
                      className="heatmap__cell"
                      key={di}
                      title={`${dateKey(day)} · ${dayCounts.get(dateKey(day)) ?? 0} 次活跃`}
                      style={{ background: heatColor(dayCounts.get(dateKey(day)) ?? 0) }}
                    />
                  )
                )}
              </div>
            ))}
          </div>
          <div className="heatmap__legend">
            <span>少</span>
            {[0, 1, 2, 3, 4].map((c) => (
              <span key={c} className="heatmap__cell" style={{ background: heatColor(c) }} />
            ))}
            <span>多</span>
          </div>
        </div>
      </section>

      <section className="ach-section">
        <h3>习惯执行情况</h3>
        {habitStats.length === 0 && <p className="empty">还没有习惯</p>}
        {habitStats.map((h) => (
          <div key={h.title} className="ach-row">
            <span className="ach-row__dot" style={{ background: h.color }} />
            <span className="ach-row__title">{h.title}</span>
            <span className="ach-row__meta">
              累计 {h.total} 次 · 连续 {h.streak} 天
            </span>
          </div>
        ))}
      </section>

      <section className="ach-section">
        <h3>目标完成度</h3>
        {goalStats.length === 0 && <p className="empty">还没有目标</p>}
        {goalStats.map((g) => (
          <div key={g.title} className="ach-row">
            <span className="ach-row__title ach-row__title--fixed">{g.title}</span>
            <div className="ach-row__bar">
              <div className="ach-row__fill" style={{ width: `${g.percent}%` }} />
            </div>
            <span className="ach-row__meta">{g.percent}%</span>
          </div>
        ))}
      </section>

      <section className="ach-section">
        <h3>最近活动</h3>
        {recentEvents.length === 0 && <p className="empty">还没有活动记录</p>}
        {recentEvents.map((e, i) => (
          <div key={i} className="ach-row">
            <span className="ach-row__title">{e.label}</span>
            <span className="ach-row__meta">{formatRelativeTime(e.ts, now.getTime())}</span>
          </div>
        ))}
      </section>
    </div>
  );
}
