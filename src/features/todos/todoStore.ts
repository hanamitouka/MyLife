import { create } from 'zustand';
import { storage } from '../../lib/storage';
import type { Todo } from '../../types';

function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

interface TodoInput {
  title: string;
  priority: number;
  dueAt?: string;
  remindBeforeMinutes?: number;
  /** 关联目标（从目标「生成待办」而来） */
  goalId?: string;
}

interface TodoStore {
  todos: Todo[];
  load: () => Promise<void>;
  addTodo: (input: TodoInput) => void;
  toggleDone: (id: string) => void;
  setDone: (id: string, done: boolean) => void;
  setPriority: (id: string, priority: number) => void;
  togglePinned: (id: string) => void;
  setActivityId: (id: string, activityId: string) => void;
  deleteTodo: (id: string) => void;
  replaceAll: (todos: Todo[]) => void;
}

/** 待办 / DDL 的独立状态中枢（与活动、习惯解耦）。 */
export const useTodoStore = create<TodoStore>((set, get) => {
  /** 把 id 对应的最新 todo 写回存储 */
  function persist(id: string) {
    const t = get().todos.find((x) => x.id === id);
    if (t) void storage.saveTodo(t);
  }

  return {
    todos: [],

    async load() {
      set({ todos: await storage.loadTodos() });
    },

    addTodo(input) {
      const todo: Todo = {
        id: genId(),
        title: input.title,
        priority: input.priority,
        pinned: false,
        done: false,
        createdAt: Date.now(),
      };
      if (input.dueAt) todo.dueAt = input.dueAt;
      if (input.remindBeforeMinutes) todo.remindBeforeMinutes = input.remindBeforeMinutes;
      if (input.goalId) todo.goalId = input.goalId;
      void storage.saveTodo(todo);
      set((s) => ({ todos: [...s.todos, todo] }));
    },

    toggleDone(id) {
      set((s) => ({
        todos: s.todos.map((t) =>
          t.id === id ? { ...t, done: !t.done, completedAt: !t.done ? Date.now() : undefined } : t
        ),
      }));
      persist(id);
    },

    setDone(id, done) {
      set((s) => ({
        todos: s.todos.map((t) =>
          t.id === id ? { ...t, done, completedAt: done ? Date.now() : undefined } : t
        ),
      }));
      persist(id);
    },

    setPriority(id, priority) {
      set((s) => ({ todos: s.todos.map((t) => (t.id === id ? { ...t, priority } : t)) }));
      persist(id);
    },

    togglePinned(id) {
      set((s) => ({ todos: s.todos.map((t) => (t.id === id ? { ...t, pinned: !t.pinned } : t)) }));
      persist(id);
    },

    setActivityId(id, activityId) {
      set((s) => ({ todos: s.todos.map((t) => (t.id === id ? { ...t, activityId } : t)) }));
      persist(id);
    },

    deleteTodo(id) {
      void storage.deleteTodo(id);
      set((s) => ({ todos: s.todos.filter((t) => t.id !== id) }));
    },

    replaceAll(todos) {
      for (const t of get().todos) void storage.deleteTodo(t.id);
      for (const t of todos) void storage.saveTodo(t);
      set({ todos });
    },
  };
});
