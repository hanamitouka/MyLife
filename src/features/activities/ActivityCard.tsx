import type { Activity } from '../../types';

interface Props {
  activity: Activity;
  selected: boolean;
  onClick: () => void;
  onDoubleClick: () => void;
}

/** 一张可拖拽/点选的活动卡片（点选后点时间轴安排；双击编辑）。 */
export function ActivityCard({ activity, selected, onClick, onDoubleClick }: Props) {
  return (
    <div
      className={`activity-card ${selected ? 'is-selected' : ''}`}
      data-activity-id={activity.id}
      style={{ borderLeftColor: activity.color }}
      title="点选后点时间轴安排 · 双击编辑"
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      {activity.emoji ? (
        <span className="activity-card__emoji">{activity.emoji}</span>
      ) : (
        <span className="activity-card__dot" style={{ background: activity.color }} />
      )}
      <div className="activity-card__body">
        <span className="activity-card__title">{activity.title}</span>
        {activity.note && <span className="activity-card__note">{activity.note}</span>}
      </div>
      <span className="activity-card__meta">{activity.durationMinutes}min</span>
    </div>
  );
}
