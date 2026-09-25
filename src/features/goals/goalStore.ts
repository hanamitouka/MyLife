import { create } from 'zustand';
import { storage } from '../../lib/storage';
import type { Goal } from '../../types';

function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** 递归：对 id 对应的节点应用 fn，返回新树 */
function mapTree(goals: Goal[], id: string, fn: (g: Goal) => Goal): Goal[] {
  return goals.map((g) => {
    if (g.id === id) return fn(g);
    if (g.subGoals.length > 0) return { ...g, subGoals: mapTree(g.subGoals, id, fn) };
    return g;
  });
}

/** 递归：删除 id 对应的节点（连同其子树），返回新树 */
function removeNode(goals: Goal[], id: string): Goal[] {
  return goals
    .filter((g) => g.id !== id)
    .map((g) => (g.subGoals.length > 0 ? { ...g, subGoals: removeNode(g.subGoals, id) } : g));
}

/** 递归：g 的子树里是否包含 id */
function containsId(g: Goal, id: string): boolean {
  if (g.id === id) return true;
  return g.subGoals.some((c) => containsId(c, id));
}

/** 兼容旧数据：确保每个目标都有 logs / subGoals 数组 */
function normalizeGoal(g: Goal): Goal {
  return {
    ...g,
    logs: g.logs ?? [],
    subGoals: (g.subGoals ?? []).map(normalizeGoal),
  };
}

interface GoalInput {
  title: string;
  description?: string;
  dueAt?: string;
}

interface GoalStore {
  goals: Goal[];
  load: () => Promise<void>;
  addGoal: (input: GoalInput) => void;
  toggleDone: (id: string) => void;
  deleteGoal: (id: string) => void;
  addSubGoal: (parentId: string, title: string) => void;
  addLog: (id: string, content: string) => void;
  replaceAll: (goals: Goal[]) => void;
}

/** 目标追踪的独立状态中枢（目标树，可任意嵌套）。 */
export const useGoalStore = create<GoalStore>((set, get) => {
  /** 修改 id 对应节点，并把它的根目标写回存储 */
  function updateNode(id: string, fn: (g: Goal) => Goal) {
    set((s) => ({ goals: mapTree(s.goals, id, fn) }));
    const root = get().goals.find((g) => containsId(g, id));
    if (root) void storage.saveGoal(root);
  }

  return {
    goals: [],

    async load() {
      const goals = await storage.loadGoals();
      set({ goals: goals.map(normalizeGoal) });
    },

    addGoal(input) {
      const goal: Goal = {
        id: genId(),
        title: input.title,
        done: false,
        createdAt: Date.now(),
        subGoals: [],
        logs: [],
      };
      if (input.description) goal.description = input.description;
      if (input.dueAt) goal.dueAt = input.dueAt;
      void storage.saveGoal(goal);
      set((s) => ({ goals: [...s.goals, goal] }));
    },

    toggleDone(id) {
      updateNode(id, (g) => ({
        ...g,
        done: !g.done,
        completedAt: !g.done ? Date.now() : undefined,
      }));
    },

    deleteGoal(id) {
      const isRoot = get().goals.some((g) => g.id === id);
      if (isRoot) {
        void storage.deleteGoal(id);
        set((s) => ({ goals: s.goals.filter((g) => g.id !== id) }));
      } else {
        const rootId = get().goals.find((g) => containsId(g, id))?.id;
        set((s) => ({ goals: removeNode(s.goals, id) }));
        const root = rootId ? get().goals.find((g) => g.id === rootId) : undefined;
        if (root) void storage.saveGoal(root);
      }
    },

    addSubGoal(parentId, title) {
      updateNode(parentId, (g) => ({
        ...g,
        subGoals: [
          ...g.subGoals,
          { id: genId(), title, done: false, createdAt: Date.now(), subGoals: [], logs: [] },
        ],
      }));
    },

    addLog(id, content) {
      updateNode(id, (g) => ({
        ...g,
        logs: [...g.logs, { id: genId(), content, createdAt: Date.now() }],
      }));
    },

    replaceAll(goals) {
      for (const g of get().goals) void storage.deleteGoal(g.id);
      for (const g of goals) void storage.saveGoal(g);
      set({ goals });
    },
  };
});
