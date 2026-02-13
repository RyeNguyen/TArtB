import { create } from "zustand";
import { Tag, Task, TaskList } from "@/types/toDo";
import { todoService } from "@services/todo/todoService";
import { TaskPriorityType } from "@constants/common";
import { generateId } from "@utils/stringUtils";
import { removeUndefined } from "@utils/objectUtils";
import i18next from "i18next";

interface TodoLoadingState {
  isAddingTask: boolean;
  isUpdatingTask: boolean;
  isTogglingTask: boolean;
  isReorderingTask: boolean;
  isDeletingTask: boolean;
  isDuplicatingTask: boolean;
  isAddingList: boolean;
  isUpdatingList: boolean;
  isDeletingList: boolean;
  isClearingCompleted: boolean;
}

interface TodoStore {
  // State
  lists: TaskList[];
  tasks: Task[];
  tags: Tag[];
  isLoaded: boolean;
  isSyncing: boolean;
  hasInitializedDefaultList: boolean;
  selectedTaskId: string | null;
  collapsedGroupIds: string[];
  loading: TodoLoadingState;
  setLoading: (key: keyof TodoLoadingState, value: boolean) => void;
  setSelectedTask: (taskId: string | null) => void;
  setCollapsedGroupIds: (ids: string[]) => void;

  // Initialization & Sync
  loadData: () => Promise<void>;
  onAuthStateChange: (isAuthenticated: boolean) => Promise<void>;
  setupRealtimeSync: () => void;
  cleanupRealtimeSync: () => void;

  // List actions
  addList: (title: string, color?: string) => Promise<string>;
  updateList: (
    id: string,
    updates: Partial<Omit<TaskList, "id" | "createdAt">>,
  ) => Promise<void>;
  deleteList: (id: string) => Promise<void>;
  duplicateList: (id: string) => Promise<string>;
  reorderList: (id: string, newOrder: number) => Promise<void>;
  searchList: (searchTerm: string) => Promise<TaskList[]>;

  // Task actions
  addTask: (
    listId: string,
    title: string,
    options?: {
      description?: string;
      priority?: TaskPriorityType;
      tags?: string[];
      deadline?: number;
    },
  ) => Promise<string>;
  updateTask: (
    id: string,
    updates: Partial<Omit<Task, "id" | "listId" | "createdAt">>,
  ) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  duplicateTask: (id: string) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  reorderTask: (id: string, newOrder: number) => Promise<void>;
  reorderTaskInGroup: (
    id: string,
    newOrder: number,
    propertyUpdates?: Partial<
      Pick<Task, "priority" | "deadline" | "tags" | "isCompleted">
    >,
  ) => Promise<void>;
  normalizeTaskOrders: (taskIds: string[]) => Promise<void>;
  moveTaskToList: (taskId: string, newListId: string) => Promise<void>;

  // Tag actions
  addTag: (title: string, color?: string) => Promise<string>;
  searchTag: (searchTerm: string) => Promise<Tag[]>;
  deleteTag: (id: string) => Promise<void>;

  // Subtask actions
  addSubtask: (taskId: string, title: string) => Promise<string>;
  toggleSubtask: (taskId: string, subtaskId: string) => Promise<void>;
  updateSubtask: (
    taskId: string,
    subtaskId: string,
    updates: Partial<Omit<import("@/types/toDo").Subtask, "id" | "createdAt">>,
  ) => Promise<void>;
  deleteSubtask: (taskId: string, subtaskId: string) => Promise<void>;
  reorderSubtask: (
    taskId: string,
    subtaskId: string,
    newOrder: number,
  ) => Promise<void>;

  // Bulk actions
  clearCompleted: (listId: string) => Promise<void>;

  // Selectors
  getTasksByList: (listId: string) => Task[];
  getListById: (id: string) => TaskList | undefined;
}

// Track real-time sync unsubscribe function outside the store
let realtimeUnsubscribe: (() => void) | null = null;

export const useTodoStore = create<TodoStore>((set, get) => ({
  lists: [],
  tasks: [],
  tags: [],
  isLoaded: false,
  isSyncing: false,
  hasInitializedDefaultList: false,
  selectedTaskId: null,
  collapsedGroupIds: [],
  loading: {
    isAddingTask: false,
    isUpdatingTask: false,
    isTogglingTask: false,
    isReorderingTask: false,
    isDeletingTask: false,
    isDuplicatingTask: false,
    isAddingList: false,
    isUpdatingList: false,
    isDeletingList: false,
    isClearingCompleted: false,
  },

  setLoading: (key, value) => {
    set({ loading: { ...get().loading, [key]: value } });
  },

  setSelectedTask: (taskId) => {
    set({ selectedTaskId: taskId });
  },

  setCollapsedGroupIds: (ids) => {
    set({ collapsedGroupIds: ids });
    // Persist to Chrome storage
    const storage =
      typeof window !== "undefined" &&
      typeof (window as any).chrome !== "undefined" &&
      (window as any).chrome?.storage?.local
        ? (window as any).chrome.storage.local
        : null;

    if (storage) {
      storage.set({ collapsedGroupIds: ids });
    } else {
      // Fallback to localStorage
      localStorage.setItem("collapsedGroupIds", JSON.stringify(ids));
    }
  },

  loadData: async () => {
    const data = await todoService.load();

    // Load collapsedGroupIds from Chrome storage (local only, not synced to Firestore)
    const storage =
      typeof window !== "undefined" &&
      typeof (window as any).chrome !== "undefined" &&
      (window as any).chrome?.storage?.local
        ? (window as any).chrome.storage.local
        : null;

    let collapsedGroupIds: string[] = [];
    if (storage) {
      const result = await storage.get("collapsedGroupIds");
      collapsedGroupIds = result.collapsedGroupIds || [];
    } else {
      // Fallback to localStorage
      const stored = localStorage.getItem("collapsedGroupIds");
      collapsedGroupIds = stored ? JSON.parse(stored) : [];
    }

    set({
      lists: data.lists,
      tasks: data.tasks,
      tags: data.tags,
      collapsedGroupIds,
      isLoaded: true,
      // If lists exist, mark as initialized to prevent creating defaults
      hasInitializedDefaultList:
        data.lists.length > 0 ? true : get().hasInitializedDefaultList,
    });
  },

  onAuthStateChange: async (isAuthenticated) => {
    const { cleanupRealtimeSync, setupRealtimeSync } = get();

    if (isAuthenticated) {
      set({ isSyncing: true });
      try {
        // Sign in: merge local ↔ cloud, setup real-time sync
        const mergedData = await todoService.onSignIn();
        set({
          lists: mergedData.lists,
          tasks: mergedData.tasks,
          tags: mergedData.tags,
          isLoaded: true,
          hasInitializedDefaultList:
            mergedData.lists.length > 0
              ? true
              : get().hasInitializedDefaultList,
        });
        setupRealtimeSync();
      } catch (error) {
        console.error(
          "[TodoStore] Error during auth state change (sign in):",
          error,
        );
      } finally {
        set({ isSyncing: false });
      }
    } else {
      // Sign out: cleanup sync, keep local data
      console.log("[TodoStore] Sign out, keeping local data...");
      cleanupRealtimeSync();
      await todoService.onSignOut();
      // Data stays in local, no need to reload
    }
  },

  setupRealtimeSync: () => {
    // Cleanup any existing subscription first
    if (realtimeUnsubscribe) {
      realtimeUnsubscribe();
      realtimeUnsubscribe = null;
    }

    // Subscribe to real-time updates
    const unsubscribe = todoService.subscribe((data) => {
      set({
        lists: data.lists,
        tasks: data.tasks,
        tags: data.tags,
        hasInitializedDefaultList:
          data.lists.length > 0 ? true : get().hasInitializedDefaultList,
      });
    });

    if (unsubscribe) {
      realtimeUnsubscribe = unsubscribe;
    }
  },

  cleanupRealtimeSync: () => {
    if (realtimeUnsubscribe) {
      realtimeUnsubscribe();
      realtimeUnsubscribe = null;
    }
  },

  addList: async (title, color) => {
    const { lists, setLoading } = get();
    const previousLists = lists;

    setLoading("isAddingList", true);

    try {
      const now = Date.now();
      const maxOrder =
        lists.length > 0 ? Math.max(...lists.map((l) => l.order)) : -1;

      const newList: TaskList = {
        id: generateId(),
        title,
        color,
        order: maxOrder + 1,
        createdAt: now,
        updatedAt: now,
      };

      set({ lists: [...lists, newList] });
      await todoService.saveList(newList);
      return newList.id;
    } catch (error) {
      set({ lists: previousLists });
      console.error("[TodoStore] Error adding list:", error);
      throw error;
    } finally {
      setLoading("isAddingList", false);
    }
  },

  updateList: async (id, updates) => {
    const { lists, setLoading } = get();
    const previousLists = lists;
    const updatedList = lists.find((list) => list.id === id);
    if (!updatedList) return;

    setLoading("isUpdatingList", true);

    try {
      const newList = { ...updatedList, ...updates, updatedAt: Date.now() };
      set({ lists: lists.map((list) => (list.id === id ? newList : list)) });
      await todoService.saveList(newList);
    } catch (error) {
      set({ lists: previousLists });
      console.error("[TodoStore] Error updating list:", error);
      throw error;
    } finally {
      setLoading("isUpdatingList", false);
    }
  },

  deleteList: async (id) => {
    const { lists, tasks, setLoading } = get();
    const previousLists = lists;
    const previousTasks = tasks;

    setLoading("isDeletingList", true);

    try {
      const taskIdsToDelete = tasks
        .filter((task) => task.listId === id)
        .map((task) => task.id);

      set({
        lists: lists.filter((list) => list.id !== id),
        tasks: tasks.filter((task) => task.listId !== id),
      });

      await Promise.all([
        todoService.deleteListById(id),
        taskIdsToDelete.length > 0
          ? todoService.deleteTasks(taskIdsToDelete)
          : Promise.resolve(),
      ]);
    } catch (error) {
      set({ lists: previousLists, tasks: previousTasks });
      console.error("[TodoStore] Error deleting list:", error);
      throw error;
    } finally {
      setLoading("isDeletingList", false);
    }
  },

  duplicateList: async (id) => {
    const { lists, tasks } = get();
    const previousLists = lists;
    const previousTasks = tasks;

    try {
      const originalList = lists.find((list) => list.id === id);
      if (!originalList) {
        throw new Error(`List with id ${id} not found`);
      }

      const now = Date.now();
      const newListId = generateId();

      // Get max order for new list
      const maxOrder =
        lists.length > 0 ? Math.max(...lists.map((l) => l.order)) : -1;

      // Create new list with localized "Copy of" prefix
      const newList: TaskList = {
        ...originalList,
        id: newListId,
        title: i18next.t("toDo.list.copyOf", { listName: originalList.title }),
        order: maxOrder + 1,
        createdAt: now,
        updatedAt: now,
      };

      // Get all tasks from the original list
      const originalTasks = tasks.filter((task) => task.listId === id);

      // Create duplicates of all tasks with new IDs
      const newTasks: Task[] = originalTasks.map((task) => ({
        ...task,
        id: generateId(),
        listId: newListId,
        createdAt: now,
        updatedAt: now,
      }));

      // Optimistic update
      set({
        lists: [...lists, newList],
        tasks: [...tasks, ...newTasks],
      });

      // Persist to backend
      await todoService.duplicateList(id, newList, newTasks);

      return newListId;
    } catch (error) {
      set({ lists: previousLists, tasks: previousTasks });
      console.error("[TodoStore] Error duplicating list:", error);
      throw error;
    }
  },

  reorderList: async (id, newOrder) => {
    const { lists, setLoading } = get();
    const previousLists = lists;
    const list = lists.find((l) => l.id === id);
    if (!list) return;

    setLoading("isUpdatingList", true);

    try {
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
    } catch (error) {
      set({ lists: previousLists });
      console.error("[TodoStore] Error reordering list:", error);
      throw error;
    } finally {
      setLoading("isUpdatingList", false);
    }
  },

  searchList: async (searchTerm: string) => {
    const { lists } = get();
    const term = searchTerm.toLowerCase().trim();
    if (!term) return lists;
    return lists.filter((item) => item.title.toLowerCase().includes(term));
  },

  // Task actions
  addTask: async (listId, title, options = {}) => {
    const { tasks, setLoading } = get();
    const previousTasks = tasks;

    setLoading("isAddingTask", true);

    try {
      const now = Date.now();
      const listTasks = tasks.filter((t) => t.listId === listId);
      const maxOrder =
        listTasks.length > 0 ? Math.max(...listTasks.map((t) => t.order)) : -1;

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

      set({ tasks: [...tasks, newTask] });
      await todoService.saveTask(newTask);
      return newTask.id;
    } catch (error) {
      set({ tasks: previousTasks });
      console.error("[TodoStore] Error adding task:", error);
      throw error;
    } finally {
      setLoading("isAddingTask", false);
    }
  },

  updateTask: async (id, updates) => {
    const { tasks, setLoading } = get();
    const previousTasks = tasks;

    setLoading("isUpdatingTask", true);

    try {
      const updatedTaskFields = { ...updates, updatedAt: Date.now() };

      set({
        tasks: tasks.map((task) =>
          task.id === id ? { ...task, ...updatedTaskFields } : task,
        ),
      });
      await todoService.updateTaskFields(id, updatedTaskFields);
    } catch (error) {
      set({ tasks: previousTasks });
      console.error("[TodoStore] Error updating task:", error);
      throw error;
    } finally {
      setLoading("isUpdatingTask", false);
    }
  },

  deleteTask: async (id) => {
    const { tasks, setLoading } = get();
    const previousTasks = tasks;

    setLoading("isDeletingTask", true);

    try {
      set({ tasks: tasks.filter((task) => task.id !== id) });
      await todoService.deleteTaskById(id);
    } catch (error) {
      set({ tasks: previousTasks });
      console.error("[TodoStore] Error deleting task:", error);
      throw error;
    } finally {
      setLoading("isDeletingTask", false);
    }
  },

  duplicateTask: async (id) => {
    const { tasks, setLoading } = get();
    const previousTasks = tasks;

    setLoading("isDuplicatingTask", true);

    try {
      const originalTask = tasks.find((t) => t.id === id);
      if (!originalTask) {
        throw new Error("Task not found");
      }

      const now = Date.now();
      const duplicatedTask: Task = {
        ...originalTask,
        id: generateId(),
        title: `${i18next.t("toDo.copyOf")} ${originalTask.title}`,
        isCompleted: false,
        completedAt: undefined,
        order: originalTask.order + 0.5, // Insert right after original
        createdAt: now,
        updatedAt: now,
        // Deep-copy subtasks with new IDs, reset completion
        subtasks: originalTask.subtasks?.map((s) => ({
          ...s,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
          completedAt: undefined,
          isCompleted: false,
        })),
      };

      // Insert duplicated task right after the original
      const originalIndex = tasks.findIndex((t) => t.id === id);
      const newTasks = [...tasks];
      newTasks.splice(originalIndex + 1, 0, duplicatedTask);

      set({ tasks: newTasks });
      await todoService.duplicateTask(id, duplicatedTask);
    } catch (error) {
      set({ tasks: previousTasks });
      console.error("[TodoStore] Error duplicating task:", error);
      throw error;
    } finally {
      setLoading("isDuplicatingTask", false);
    }
  },

  toggleTask: async (id) => {
    const { tasks, setLoading } = get();
    const previousTasks = tasks;
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    setLoading("isTogglingTask", true);

    try {
      const now = Date.now();
      const updates = {
        isCompleted: !task.isCompleted,
        completedAt: !task.isCompleted ? now : undefined,
        updatedAt: now,
      };

      set({
        tasks: tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
      });
      await todoService.updateTaskFields(id, updates);
    } catch (error) {
      set({ tasks: previousTasks });
      console.error("[TodoStore] Error toggling task:", error);
      throw error;
    } finally {
      setLoading("isTogglingTask", false);
    }
  },

  reorderTask: async (id, newOrder) => {
    const { tasks, setLoading } = get();
    const previousTasks = tasks;
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    setLoading("isReorderingTask", true);

    try {
      const oldOrder = task.order;
      const listId = task.listId;
      const now = Date.now();

      // Collect affected tasks (those that need order updates)
      const updates: Array<{
        id: string;
        order: number;
        updatedAt: number;
      }> = [];

      const newTasks = tasks.map((t) => {
        if (t.listId !== listId) return t;

        if (t.id === id) {
          updates.push({ id: t.id, order: newOrder, updatedAt: now });
          return { ...t, order: newOrder, updatedAt: now };
        }
        // Shift other tasks in the same list
        if (newOrder > oldOrder && t.order > oldOrder && t.order <= newOrder) {
          const newOrderValue = t.order - 1;
          updates.push({ id: t.id, order: newOrderValue, updatedAt: now });
          return { ...t, order: newOrderValue, updatedAt: now };
        }
        if (newOrder < oldOrder && t.order >= newOrder && t.order < oldOrder) {
          const newOrderValue = t.order + 1;
          updates.push({ id: t.id, order: newOrderValue, updatedAt: now });
          return { ...t, order: newOrderValue, updatedAt: now };
        }
        return t;
      });

      set({ tasks: newTasks });
      await todoService.updateTasksOrders(updates);
    } catch (error) {
      set({ tasks: previousTasks });
      console.error("[TodoStore] Error reordering task:", error);
      throw error;
    } finally {
      setLoading("isReorderingTask", false);
    }
  },

  reorderTaskInGroup: async (id, newOrder, propertyUpdates = {}) => {
    const { tasks, setLoading } = get();
    const previousTasks = tasks;

    setLoading("isReorderingTask", true);

    try {
      const now = Date.now();

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

      set({
        tasks: tasks.map((task) =>
          task.id === id ? { ...task, ...updates } : task,
        ),
      });
      await todoService.updateTaskFields(id, updates);
    } catch (error) {
      set({ tasks: previousTasks });
      console.error("[TodoStore] Error reordering task in group:", error);
      throw error;
    } finally {
      setLoading("isReorderingTask", false);
    }
  },

  normalizeTaskOrders: async (taskIds) => {
    const { tasks, setLoading } = get();
    const previousTasks = tasks;

    setLoading("isReorderingTask", true);

    try {
      const now = Date.now();

      // Create a map of taskId -> new order based on position in taskIds array
      const orderMap = new Map<string, number>();
      taskIds.forEach((id, index) => {
        orderMap.set(id, index);
      });

      // Collect only tasks that actually need updates
      const updates: Array<{
        id: string;
        order: number;
        updatedAt: number;
      }> = [];

      const newTasks = tasks.map((task) => {
        const newOrder = orderMap.get(task.id);
        if (newOrder !== undefined && newOrder !== task.order) {
          updates.push({ id: task.id, order: newOrder, updatedAt: now });
          return { ...task, order: newOrder, updatedAt: now };
        }
        return task;
      });

      set({ tasks: newTasks });
      if (updates.length > 0) {
        await todoService.updateTasksOrders(updates);
      }
    } catch (error) {
      set({ tasks: previousTasks });
      console.error("[TodoStore] Error normalizing task orders:", error);
      throw error;
    } finally {
      setLoading("isReorderingTask", false);
    }
  },

  moveTaskToList: async (taskId, newListId) => {
    const { tasks, setLoading } = get();
    const previousTasks = tasks;

    setLoading("isUpdatingTask", true);

    try {
      const listTasks = tasks.filter((t) => t.listId === newListId);
      const maxOrder =
        listTasks.length > 0 ? Math.max(...listTasks.map((t) => t.order)) : -1;

      const updates = {
        listId: newListId,
        order: maxOrder + 1,
        updatedAt: Date.now(),
      };

      set({
        tasks: tasks.map((task) =>
          task.id === taskId ? { ...task, ...updates } : task,
        ),
      });
      await todoService.updateTaskFields(taskId, updates);
    } catch (error) {
      set({ tasks: previousTasks });
      console.error("[TodoStore] Error moving task to list:", error);
      throw error;
    } finally {
      setLoading("isUpdatingTask", false);
    }
  },

  addTag: async (title, color) => {
    const { tags } = get();
    const previousTags = tags;

    try {
      const now = Date.now();

      const newTag: Tag = {
        id: generateId(),
        title,
        color,
        createdAt: now,
        updatedAt: now,
      };

      set({ tags: [...tags, newTag] });
      await todoService.saveTag(newTag);
      return newTag.id;
    } catch (error) {
      set({ tags: previousTags });
      console.error("[TodoStore] Error adding tag:", error);
      throw error;
    }
  },

  searchTag: async (searchTerm: string) => {
    const { tags } = get();
    const term = searchTerm.toLowerCase().trim();
    if (!term) return tags;
    return tags.filter((item) => item.title.toLowerCase().includes(term));
  },

  deleteTag: async (id) => {
    const { tags } = get();
    const previousTags = tags;

    try {
      set({ tags: tags.filter((tag) => tag.id !== id) });
      await todoService.deleteTagById(id);
    } catch (error) {
      set({ tags: previousTags });
      console.error("[TodoStore] Error deleting tag:", error);
      throw error;
    }
  },

  // Subtask actions
  addSubtask: async (taskId, title) => {
    const { tasks } = get();
    const previousTasks = tasks;
    const task = tasks.find((t) => t.id === taskId);
    if (!task) throw new Error("Task not found");

    try {
      const now = Date.now();
      const subtasks = task.subtasks || [];
      const maxOrder =
        subtasks.length > 0 ? Math.max(...subtasks.map((s) => s.order)) : -1;

      const newSubtask = {
        id: generateId(),
        title,
        isCompleted: false,
        order: maxOrder + 1,
        createdAt: now,
        updatedAt: now,
      };

      const updatedSubtasks = [...subtasks, newSubtask];

      // Clean undefined values from subtasks for Firestore
      const cleanedSubtasks = updatedSubtasks.map(s => removeUndefined(s));

      set({
        tasks: tasks.map((t) =>
          t.id === taskId
            ? { ...t, subtasks: updatedSubtasks, updatedAt: now }
            : t,
        ),
      });

      await todoService.updateTaskFields(taskId, {
        subtasks: cleanedSubtasks,
        updatedAt: now,
      });

      return newSubtask.id;
    } catch (error) {
      set({ tasks: previousTasks });
      console.error("[TodoStore] Error adding subtask:", error);
      throw error;
    }
  },

  toggleSubtask: async (taskId, subtaskId) => {
    const { tasks } = get();
    const previousTasks = tasks;
    const task = tasks.find((t) => t.id === taskId);
    if (!task || !task.subtasks) return;

    try {
      const now = Date.now();

      // Toggle the subtask
      const updatedSubtasks = task.subtasks.map((s) =>
        s.id === subtaskId
          ? {
              ...s,
              isCompleted: !s.isCompleted,
              completedAt: !s.isCompleted ? now : undefined,
              updatedAt: now,
            }
          : s,
      );

      // Clean undefined values from subtasks for Firestore
      const cleanedSubtasks = updatedSubtasks.map(s => removeUndefined(s));

      // Update task with new subtasks (no auto-completion of parent)
      const taskUpdates: Partial<Task> = {
        subtasks: updatedSubtasks,
        updatedAt: now,
      };

      set({
        tasks: tasks.map((t) => (t.id === taskId ? { ...t, ...taskUpdates } : t)),
      });

      await todoService.updateTaskFields(taskId, {
        subtasks: cleanedSubtasks,
        updatedAt: now,
      });
    } catch (error) {
      set({ tasks: previousTasks });
      console.error("[TodoStore] Error toggling subtask:", error);
      throw error;
    }
  },

  updateSubtask: async (taskId, subtaskId, updates) => {
    const { tasks } = get();
    const previousTasks = tasks;
    const task = tasks.find((t) => t.id === taskId);
    if (!task || !task.subtasks) return;

    try {
      const now = Date.now();

      const updatedSubtasks = task.subtasks.map((s) =>
        s.id === subtaskId ? { ...s, ...updates, updatedAt: now } : s,
      );

      // Clean undefined values from subtasks for Firestore
      const cleanedSubtasks = updatedSubtasks.map(s => removeUndefined(s));

      set({
        tasks: tasks.map((t) =>
          t.id === taskId
            ? { ...t, subtasks: updatedSubtasks, updatedAt: now }
            : t,
        ),
      });

      await todoService.updateTaskFields(taskId, {
        subtasks: cleanedSubtasks,
        updatedAt: now,
      });
    } catch (error) {
      set({ tasks: previousTasks });
      console.error("[TodoStore] Error updating subtask:", error);
      throw error;
    }
  },

  deleteSubtask: async (taskId, subtaskId) => {
    const { tasks } = get();
    const previousTasks = tasks;
    const task = tasks.find((t) => t.id === taskId);
    if (!task || !task.subtasks) return;

    try {
      const now = Date.now();
      const updatedSubtasks = task.subtasks.filter((s) => s.id !== subtaskId);

      // Clean undefined values from subtasks for Firestore
      const cleanedSubtasks = updatedSubtasks.map(s => removeUndefined(s));

      set({
        tasks: tasks.map((t) =>
          t.id === taskId
            ? { ...t, subtasks: updatedSubtasks, updatedAt: now }
            : t,
        ),
      });

      await todoService.updateTaskFields(taskId, {
        subtasks: cleanedSubtasks,
        updatedAt: now,
      });
    } catch (error) {
      set({ tasks: previousTasks });
      console.error("[TodoStore] Error deleting subtask:", error);
      throw error;
    }
  },

  reorderSubtask: async (taskId, subtaskId, newOrder) => {
    const { tasks } = get();
    const previousTasks = tasks;
    const task = tasks.find((t) => t.id === taskId);
    if (!task || !task.subtasks) return;

    try {
      const now = Date.now();

      const updatedSubtasks = task.subtasks.map((s) =>
        s.id === subtaskId ? { ...s, order: newOrder, updatedAt: now } : s,
      );

      // Clean undefined values from subtasks for Firestore
      const cleanedSubtasks = updatedSubtasks.map(s => removeUndefined(s));

      set({
        tasks: tasks.map((t) =>
          t.id === taskId
            ? { ...t, subtasks: updatedSubtasks, updatedAt: now }
            : t,
        ),
      });

      await todoService.updateTaskFields(taskId, {
        subtasks: cleanedSubtasks,
        updatedAt: now,
      });
    } catch (error) {
      set({ tasks: previousTasks });
      console.error("[TodoStore] Error reordering subtask:", error);
      throw error;
    }
  },

  // Bulk actions
  clearCompleted: async (listId) => {
    const { tasks, setLoading } = get();
    const previousTasks = tasks;

    setLoading("isClearingCompleted", true);

    try {
      const completedIds = tasks
        .filter((task) => task.listId === listId && task.isCompleted)
        .map((task) => task.id);

      set({
        tasks: tasks.filter(
          (task) => task.listId !== listId || !task.isCompleted,
        ),
      });

      if (completedIds.length > 0) {
        await todoService.deleteTasks(completedIds);
      }
    } catch (error) {
      set({ tasks: previousTasks });
      console.error("[TodoStore] Error clearing completed tasks:", error);
      throw error;
    } finally {
      setLoading("isClearingCompleted", false);
    }
  },

  // Selectors
  getTasksByList: (listId) => {
    return get()
      .tasks.filter((task) => task.listId === listId)
      .sort((a, b) => a.order - b.order);
  },

  getListById: (id) => {
    return get().lists.find((list) => list.id === id);
  },
}));
