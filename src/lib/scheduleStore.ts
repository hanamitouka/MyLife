import { create } from 'zustand';

/**
 * 当前「待排期」选中的活动卡片。
 * 手机端用「点选卡片 → 点时间轴」替代鼠标拖拽排期。
 */
interface ScheduleState {
  selectedActivityId: string | null;
  toggle: (id: string) => void;
  clear: () => void;
}

export const useScheduleStore = create<ScheduleState>((set) => ({
  selectedActivityId: null,
  toggle: (id) => set((s) => ({ selectedActivityId: s.selectedActivityId === id ? null : id })),
  clear: () => set({ selectedActivityId: null }),
}));
