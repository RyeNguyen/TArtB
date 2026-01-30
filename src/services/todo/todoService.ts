import { Task, TaskList, TodoData } from "@/types/toDo";

export interface TodoService {
  load(): Promise<TodoData>;
  saveLists(lists: TaskList[]): Promise<void>;
  saveTasks(tasks: Task[]): Promise<void>;
  clear(): Promise<void>;
}

const STORAGE_KEY = "tartb-todo";

// Helper to get Chrome local storage or fallback to localStorage
const getStorage = () => {
  if (
    typeof window !== "undefined" &&
    typeof (window as any).chrome !== "undefined" &&
    (window as any).chrome?.storage?.local
  ) {
    return (window as any).chrome.storage.local;
  }
  return null;
};

class LocalTodoService implements TodoService {
  async load(): Promise<TodoData> {
    const storage = getStorage();

    if (storage) {
      try {
        const result = await storage.get(STORAGE_KEY);
        return result[STORAGE_KEY] || { lists: [], tasks: [] };
      } catch (error) {
        console.error("Error loading todo data from Chrome storage:", error);
        return { lists: [], tasks: [] };
      }
    }

    // Fallback to localStorage
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : { lists: [], tasks: [] };
    } catch (error) {
      console.error("Error loading todo data from localStorage:", error);
      return { lists: [], tasks: [] };
    }
  }

  async saveLists(lists: TaskList[]): Promise<void> {
    const data = await this.load();
    data.lists = lists;
    await this.save(data);
  }

  async saveTasks(tasks: Task[]): Promise<void> {
    const data = await this.load();
    data.tasks = tasks;
    await this.save(data);
  }

  async clear(): Promise<void> {
    await this.save({ lists: [], tasks: [] });
  }

  private async save(data: TodoData): Promise<void> {
    const storage = getStorage();

    if (storage) {
      try {
        await storage.set({ [STORAGE_KEY]: data });
        return;
      } catch (error) {
        console.error("Error saving todo data to Chrome storage:", error);
      }
    }

    // Fallback to localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error("Error saving todo data to localStorage:", error);
    }
  }
}

// !Later: swap this to firebaseTodoService when ready
export const todoService: TodoService = new LocalTodoService();
