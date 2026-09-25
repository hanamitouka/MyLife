import { ActivityList } from '../activities/ActivityList';
import { TimelineCalendar } from '../calendar/TimelineCalendar';
import { QuickPanel } from './QuickPanel';

interface Props {
  onNavigate: (view: 'todos' | 'habits' | 'goals') => void;
}

/** 主界面（Dashboard）：三区布局 = 活动库 + 时间轴 + 便捷待办打卡。 */
export function Dashboard({ onNavigate }: Props) {
  return (
    <div className="app">
      <ActivityList />
      <TimelineCalendar />
      <QuickPanel onNavigate={onNavigate} />
    </div>
  );
}
