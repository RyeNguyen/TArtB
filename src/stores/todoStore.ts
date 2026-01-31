import { create } from "zustand";
import { Tag, Task, TaskList } from "@/types/toDo";
import { todoService } from "@services/todo/todoService";
import { TaskPriorityType } from "@constants/common";

const generateId = (): string => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

interface TodoStore {
  // State
  lists: TaskList[];
  tasks: Task[];
  tags: Tag[];
  isLoaded: boolean;

  // Initialization
  loadData: () => Promise<void>;

  // List actions
  addList: (title: string, color?: string) => Promise<string>;
  updateList: (id: string, updates: Partial<Omit<TaskList, "id" | "createdAt">>) => Promise<void>;
  deleteList: (id: string) => Promise<void>;
  reorderList: (id: string, newOrder: number) => Promise<void>;
  searchList: (searchTerm: string) => Promise<TaskList[]>;

  // Task actions
  addTask: (listId: string, title: string, options?: {
    description?: string;
    priority?: TaskPriorityType;
    tags?: string[];
    deadline?: number;
  }) => Promise<string>;
  updateTask: (id: string, updates: Partial<Omit<Task, "id" | "listId" | "createdAt">>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  reorderTask: (id: string, newOrder: number) => Promise<void>;
  reorderTaskInGroup: (
    id: string,
    newOrder: number,
    propertyUpdates?: Partial<Pick<Task, "priority" | "deadline" | "tags" | "isCompleted">>
  ) => Promise<void>;
  normalizeTaskOrders: (taskIds: string[]) => Promise<void>;
  moveTaskToList: (taskId: string, newListId: string) => Promise<void>;

  addTag: (title: string, color?: string) => Promise<string>;
  deleteTag: (id: string) => Promise<void>;

  // Bulk actions
  clearCompleted: (listId: string) => Promise<void>;

  // Selectors (helper methods)
  getTasksByList: (listId: string) => Task[];
  getListById: (id: string) => TaskList | undefined;
}

export const useTodoStore = create<TodoStore>((set, get) => ({
  lists: [],
  tasks: [],
  tags: [],
  isLoaded: false,

  loadData: async () => {
    const data = await todoService.load();
    set({
      lists: data.lists,
      tasks: data.tasks,
      tags: data.tags,
      isLoaded: true,
    });
  },

  addList: async (title, color) => {
    const now = Date.now();
    const { lists } = get();
    const maxOrder = lists.length > 0 ? Math.max(...lists.map((l) => l.order)) : -1;

    const newList: TaskList = {
      id: generateId(),
      title,
      color,
      order: maxOrder + 1,
      createdAt: now,
      updatedAt: now,
    };

    const newLists = [...lists, newList];
    set({ lists: newLists });
    await todoService.saveLists(newLists);
    return newList.id;
  },

  updateList: async (id, updates) => {
    const { lists } = get();
    const newLists = lists.map((list) =>
      list.id === id
        ? { ...list, ...updates, updatedAt: Date.now() }
        : list
    );
    set({ lists: newLists });
    await todoService.saveLists(newLists);
  },

  deleteList: async (id) => {
    const { lists, tasks } = get();
    const newLists = lists.filter((list) => list.id !== id);
    const newTasks = tasks.filter((task) => task.listId !== id);
    set({ lists: newLists, tasks: newTasks });
    await Promise.all([
      todoService.saveLists(newLists),
      todoService.saveTasks(newTasks),
    ]);
  },

  reorderList: async (id, newOrder) => {
    const { lists } = get();
    const list = lists.find((l) => l.id === id);
    if (!list) return;

    const oldOrder = list.order;
    const newLists = lists.map((l) => {
      if (l.id === id) {
        return { ...l, order: newOrder, updatedAt: Date.now() };
      }
      // Shift other lists
      if (newOrder > oldOrder && l.order > oldOrder && l.order <= newOrder) {
        return { ...l, order: l.order - 1 };
      }
      if (newOrder < oldOrder && l.order >= newOrder && l.order < oldOrder) {
        return { ...l, order: l.order + 1 };
      }
      return l;
    });

    set({ lists: newLists });
    await todoService.saveLists(newLists);
  },

  searchList: async (searchTerm: string) => {
    // return await todoService.searchLists(searchTerm);

    // For now, filter locally
    const { lists } = get();
    const term = searchTerm.toLowerCase().trim();
    if (!term) return lists;
    return lists.filter((item) =>
      item.title.toLowerCase().includes(term)
    );
  },

  // Task actions
  addTask: async (listId, title, options = {}) => {
    const now = Date.now();
    const { tasks } = get();
    const listTasks = tasks.filter((t) => t.listId === listId);
    const maxOrder = listTasks.length > 0 ? Math.max(...listTasks.map((t) => t.order)) : -1;

    const newTask: Task = {
      id: generateId(),
      listId,
      title,
      description: options.description,
      priority: options.priority || TaskPriorityType.NONE,
      tags: options.tags,
      deadline: options.deadline,
      isCompleted: false,
      order: maxOrder + 1,
      createdAt: now,
      updatedAt: now,
    };

    const newTasks = [...tasks, newTask];
    set({ tasks: newTasks });
    await todoService.saveTasks(newTasks);
    return newTask.id;
  },

  updateTask: async (id, updates) => {
    const { tasks } = get();
    const newTasks = tasks.map((task) =>
      task.id === id
        ? { ...task, ...updates, updatedAt: Date.now() }
        : task
    );
    set({ tasks: newTasks });
    await todoService.saveTasks(newTasks);
  },

  deleteTask: async (id) => {
    const { tasks } = get();
    const newTasks = tasks.filter((task) => task.id !== id);
    set({ tasks: newTasks });
    await todoService.saveTasks(newTasks);
  },

  toggleTask: async (id) => {
    const { tasks } = get();
    const now = Date.now();
    const newTasks = tasks.map((task) =>
      task.id === id
        ? {
            ...task,
            isCompleted: !task.isCompleted,
            completedAt: !task.isCompleted ? now : undefined,
            updatedAt: now,
          }
        : task
    );
    set({ tasks: newTasks });
    await todoService.saveTasks(newTasks);
  },

  reorderTask: async (id, newOrder) => {
    const { tasks } = get();
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    const oldOrder = task.order;
    const listId = task.listId;

    const newTasks = tasks.map((t) => {
      if (t.listId !== listId) return t;

      if (t.id === id) {
        return { ...t, order: newOrder, updatedAt: Date.now() };
      }
      // Shift other tasks in the same list
      if (newOrder > oldOrder && t.order > oldOrder && t.order <= newOrder) {
        return { ...t, order: t.order - 1 };
      }
      if (newOrder < oldOrder && t.order >= newOrder && t.order < oldOrder) {
        return { ...t, order: t.order + 1 };
      }
      return t;
    });

    set({ tasks: newTasks });
    await todoService.saveTasks(newTasks);
  },

  reorderTaskInGroup: async (id, newOrder, propertyUpdates = {}) => {
    const { tasks } = get();
    const now = Date.now();

    const newTasks = tasks.map((task) => {
      if (task.id !== id) return task;

      // Apply both the new order and any property updates
      const updates: Partial<Task> = {
        order: newOrder,
        updatedAt: now,
        ...propertyUpdates,
      };

      // Handle isCompleted toggle - set/clear completedAt accordingly
      if ("isCompleted" in propertyUpdates) {
        if (propertyUpdates.isCompleted) {
          updates.completedAt = now;
        } else {
          updates.completedAt = undefined;
        }
      }

      return { ...task, ...updates };
    });

    set({ tasks: newTasks });
    await todoService.saveTasks(newTasks);
  },

  normalizeTaskOrders: async (taskIds) => {
    const { tasks } = get();
    const now = Date.now();

    // Create a map of taskId -> new order based on position in taskIds array
    const orderMap = new Map<string, number>();
    taskIds.forEach((id, index) => {
      orderMap.set(id, index);
    });

    const newTasks = tasks.map((task) => {
      const newOrder = orderMap.get(task.id);
      if (newOrder !== undefined && newOrder !== task.order) {
        return { ...task, order: newOrder, updatedAt: now };
      }
      return task;
    });

    set({ tasks: newTasks });
    await todoService.saveTasks(newTasks);
  },

  moveTaskToList: async (taskId, newListId) => {
    const { tasks } = get();
    const listTasks = tasks.filter((t) => t.listId === newListId);
    const maxOrder = listTasks.length > 0 ? Math.max(...listTasks.map((t) => t.order)) : -1;

    const newTasks = tasks.map((task) =>
      task.id === taskId
        ? { ...task, listId: newListId, order: maxOrder + 1, updatedAt: Date.now() }
        : task
    );
    set({ tasks: newTasks });
    await todoService.saveTasks(newTasks);
  },

  // Bulk actions
  clearCompleted: async (listId) => {
    const { tasks } = get();
    const newTasks = tasks.filter(
      (task) => task.listId !== listId || !task.isCompleted
    );
    set({ tasks: newTasks });
    await todoService.saveTasks(newTasks);
  },

  // Selectors
  getTasksByList: (listId) => {
    return get().tasks
      .filter((task) => task.listId === listId)
      .sort((a, b) => a.order - b.order);
  },

  getListById: (id) => {
    return get().lists.find((list) => list.id === id);
  },

  addTag: async (title, color) => {
    const now = Date.now();
    const { tags } = get();

    const newTag: Tag = {
      id: generateId(),
      title,
      color,
      createdAt: now,
    };

    const newTags = [...tags, newTag];
    set({ tags: newTags });
    await todoService.saveTags(newTags);
    return newTag.id;
  },

  deleteTag: async (id) => {
    const { tags } = get();
    const newTags = tags.filter((tag) => tag.id !== id);
    set({ tags: newTags });
    await todoService.saveTags(tags);
  },
}));
