import {
  collection,
  doc,
  getDocs,
  writeBatch,
  onSnapshot,
  Unsubscribe,
  setDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db, auth } from "@services/firebase/config";
import { Tag, Task, TaskList, TodoData } from "@/types/toDo";
import { removeUndefined } from "@utils/objectUtils";

// ============================================================================
// Interface
// ============================================================================

export interface TodoService {
  // Bulk operations (keep for migration, initial load)
  load(): Promise<TodoData>;
  saveLists(lists: TaskList[]): Promise<void>;
  saveTasks(tasks: Task[]): Promise<void>;
  saveTags(tags: Tag[]): Promise<void>;
  clear(): Promise<void>;

  // Granular List operations
  saveList(list: TaskList): Promise<void>;
  deleteListById(id: string): Promise<void>;

  // Granular Task operations
  saveTask(task: Task): Promise<void>;
  updateTaskFields(
    id: string,
    updates: Partial<Omit<Task, "id" | "listId" | "createdAt">>,
  ): Promise<void>;
  deleteTaskById(id: string): Promise<void>;

  // Granular Tag operations
  saveTag(tag: Tag): Promise<void>;
  deleteTagById(id: string): Promise<void>;

  // Bulk operations for specific scenarios
  deleteTasks(ids: string[]): Promise<void>;
  updateTasksOrders(
    updates: Array<{ id: string; order: number; updatedAt: number }>,
  ): Promise<void>;
}

const STORAGE_KEY = "tartb-todo";

// ============================================================================
// Local Storage Service (for anonymous users)
// ============================================================================

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
  private cache: TodoData | null = null;

  private ensureValidData(data: any): TodoData {
    return {
      lists: Array.isArray(data?.lists) ? data.lists : [],
      tasks: Array.isArray(data?.tasks) ? data.tasks : [],
      tags: Array.isArray(data?.tags) ? data.tags : [],
    };
  }

  async load(): Promise<TodoData> {
    const storage = getStorage();

    if (storage) {
      try {
        console.log("[LocalService] Loading from Chrome storage...");
        const result = await storage.get(STORAGE_KEY);
        const data = this.ensureValidData(result[STORAGE_KEY]);
        this.cache = data;
        return data;
      } catch (error) {
        console.error("Error loading todo data from Chrome storage:", error);
        this.cache = { lists: [], tasks: [], tags: [] };
        return this.cache;
      }
    }

    // Fallback to localStorage
    try {
      console.log("[LocalService] Loading from localStorage...");
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      const data = this.ensureValidData(parsed);
      this.cache = data;
      return data;
    } catch (error) {
      console.error("Error loading todo data from localStorage:", error);
      this.cache = { lists: [], tasks: [], tags: [] };
      return this.cache;
    }
  }

  async saveLists(lists: TaskList[]): Promise<void> {
    if (!this.cache) await this.load();
    this.cache!.lists = lists;
    await this.save(this.cache!);
  }

  async saveTasks(tasks: Task[]): Promise<void> {
    if (!this.cache) await this.load();
    this.cache!.tasks = tasks;
    await this.save(this.cache!);
  }

  async saveTags(tags: Tag[]): Promise<void> {
    if (!this.cache) await this.load();
    this.cache!.tags = tags;
    await this.save(this.cache!);
  }

  async clear(): Promise<void> {
    this.cache = { lists: [], tasks: [], tags: [] };
    await this.save(this.cache);
  }

  // === Granular List operations ===
  async saveList(list: TaskList): Promise<void> {
    if (!this.cache) await this.load();

    const listIndex = this.cache!.lists.findIndex((l) => l.id === list.id);
    if (listIndex >= 0) {
      this.cache!.lists[listIndex] = list; // Update
    } else {
      this.cache!.lists.push(list); // Add
    }

    await this.save(this.cache!);
  }

  async deleteListById(id: string): Promise<void> {
    if (!this.cache) await this.load();
    this.cache!.lists = this.cache!.lists.filter((l) => l.id !== id);
    await this.save(this.cache!);
  }

  // === Granular Task operations ===
  async saveTask(task: Task): Promise<void> {
    if (!this.cache) await this.load();

    const taskIndex = this.cache!.tasks.findIndex((t) => t.id === task.id);
    if (taskIndex >= 0) {
      this.cache!.tasks[taskIndex] = task; // Update
    } else {
      this.cache!.tasks.push(task); // Add
    }

    await this.save(this.cache!);
  }

  async updateTaskFields(
    id: string,
    updates: Partial<Omit<Task, "id" | "listId" | "createdAt">>,
  ): Promise<void> {
    if (!this.cache) await this.load();

    const taskIndex = this.cache!.tasks.findIndex((t) => t.id === id);
    if (taskIndex >= 0) {
      this.cache!.tasks[taskIndex] = {
        ...this.cache!.tasks[taskIndex],
        ...updates,
      };
      await this.save(this.cache!);
    }
  }

  async deleteTaskById(id: string): Promise<void> {
    if (!this.cache) await this.load();
    this.cache!.tasks = this.cache!.tasks.filter((t) => t.id !== id);
    await this.save(this.cache!);
  }

  // === Granular Tag operations ===
  async saveTag(tag: Tag): Promise<void> {
    if (!this.cache) await this.load();

    const tagIndex = this.cache!.tags.findIndex((t) => t.id === tag.id);
    if (tagIndex >= 0) {
      this.cache!.tags[tagIndex] = tag; // Update
    } else {
      this.cache!.tags.push(tag); // Add
    }

    await this.save(this.cache!);
  }

  async deleteTagById(id: string): Promise<void> {
    if (!this.cache) await this.load();
    this.cache!.tags = this.cache!.tags.filter((t) => t.id !== id);
    await this.save(this.cache!);
  }

  // === Bulk operations ===
  async deleteTasks(ids: string[]): Promise<void> {
    if (!this.cache) await this.load();
    const idSet = new Set(ids);
    this.cache!.tasks = this.cache!.tasks.filter((t) => !idSet.has(t.id));
    await this.save(this.cache!);
  }

  async updateTasksOrders(
    updates: Array<{ id: string; order: number; updatedAt: number }>,
  ): Promise<void> {
    if (!this.cache) await this.load();

    const updateMap = new Map(updates.map((u) => [u.id, u]));

    this.cache!.tasks = this.cache!.tasks.map((task) => {
      const update = updateMap.get(task.id);
      if (update) {
        return { ...task, order: update.order, updatedAt: update.updatedAt };
      }
      return task;
    });

    await this.save(this.cache!);
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

// ============================================================================
// Firestore Service (for authenticated users)
// ============================================================================

class FirestoreTodoService implements TodoService {
  private userId: string;
  private unsubscribers: Unsubscribe[] = [];

  constructor(userId: string) {
    this.userId = userId;
  }

  private get listsRef() {
    return collection(db, "users", this.userId, "lists");
  }

  private get tasksRef() {
    return collection(db, "users", this.userId, "tasks");
  }

  private get tagsRef() {
    return collection(db, "users", this.userId, "tags");
  }

  async load(): Promise<TodoData> {
    try {
      const [listsSnapshot, tasksSnapshot, tagsSnapshot] = await Promise.all([
        getDocs(this.listsRef),
        getDocs(this.tasksRef),
        getDocs(this.tagsRef),
      ]);

      const lists: TaskList[] = listsSnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as TaskList),
      );
      const tasks: Task[] = tasksSnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Task),
      );
      const tags: Tag[] = tagsSnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Tag),
      );

      return { lists, tasks, tags };
    } catch (error) {
      console.error("Error loading from Firestore:", error);
      return { lists: [], tasks: [], tags: [] };
    }
  }

  async saveLists(lists: TaskList[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      const existingSnapshot = await getDocs(this.listsRef);
      const newIds = new Set(lists.map((l) => l.id));

      // Delete removed lists
      existingSnapshot.docs.forEach((docSnapshot) => {
        if (!newIds.has(docSnapshot.id)) {
          batch.delete(docSnapshot.ref);
        }
      });

      // Add/update lists
      lists.forEach((list) => {
        const { id, ...data } = list;
        batch.set(doc(this.listsRef, id), removeUndefined(data));
      });

      await batch.commit();
    } catch (error) {
      console.error("Error saving lists to Firestore:", error);
      throw error;
    }
  }

  async saveTasks(tasks: Task[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      const existingSnapshot = await getDocs(this.tasksRef);
      const newIds = new Set(tasks.map((t) => t.id));

      // Delete removed tasks
      existingSnapshot.docs.forEach((docSnapshot) => {
        if (!newIds.has(docSnapshot.id)) {
          batch.delete(docSnapshot.ref);
        }
      });

      // Add/update tasks
      tasks.forEach((task) => {
        const { id, ...data } = task;
        batch.set(doc(this.tasksRef, id), removeUndefined(data));
      });

      await batch.commit();
    } catch (error) {
      console.error("Error saving tasks to Firestore:", error);
      throw error;
    }
  }

  async saveTags(tags: Tag[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      const existingSnapshot = await getDocs(this.tagsRef);
      const newIds = new Set(tags.map((t) => t.id));

      // Delete removed tags
      existingSnapshot.docs.forEach((docSnapshot) => {
        if (!newIds.has(docSnapshot.id)) {
          batch.delete(docSnapshot.ref);
        }
      });

      // Add/update tags
      tags.forEach((tag) => {
        const { id, ...data } = tag;
        batch.set(doc(this.tagsRef, id), removeUndefined(data));
      });

      await batch.commit();
    } catch (error) {
      console.error("Error saving tags to Firestore:", error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      const batch = writeBatch(db);

      const [listsSnapshot, tasksSnapshot, tagsSnapshot] = await Promise.all([
        getDocs(this.listsRef),
        getDocs(this.tasksRef),
        getDocs(this.tagsRef),
      ]);

      listsSnapshot.docs.forEach((doc) => batch.delete(doc.ref));
      tasksSnapshot.docs.forEach((doc) => batch.delete(doc.ref));
      tagsSnapshot.docs.forEach((doc) => batch.delete(doc.ref));

      await batch.commit();
    } catch (error) {
      console.error("Error clearing Firestore data:", error);
      throw error;
    }
  }

  // === Granular List operations ===
  async saveList(list: TaskList): Promise<void> {
    try {
      const { id, ...data } = list;
      await setDoc(doc(this.listsRef, id), removeUndefined(data), {
        merge: true,
      });
    } catch (error) {
      console.error("Error saving list to Firestore:", error);
      throw error;
    }
  }

  async deleteListById(id: string): Promise<void> {
    try {
      await deleteDoc(doc(this.listsRef, id));
    } catch (error) {
      console.error("Error deleting list from Firestore:", error);
      throw error;
    }
  }

  // === Granular Task operations ===
  async saveTask(task: Task): Promise<void> {
    try {
      const { id, ...data } = task;
      await setDoc(doc(this.tasksRef, id), removeUndefined(data), {
        merge: true,
      });
    } catch (error) {
      console.error("Error saving task to Firestore:", error);
      throw error;
    }
  }

  async updateTaskFields(
    id: string,
    updates: Partial<Omit<Task, "id" | "listId" | "createdAt">>,
  ): Promise<void> {
    try {
      await updateDoc(doc(this.tasksRef, id), removeUndefined(updates));
    } catch (error) {
      console.error("Error updating task fields in Firestore:", error);
      throw error;
    }
  }

  async deleteTaskById(id: string): Promise<void> {
    try {
      await deleteDoc(doc(this.tasksRef, id));
    } catch (error) {
      console.error("Error deleting task from Firestore:", error);
      throw error;
    }
  }

  // === Granular Tag operations ===
  async saveTag(tag: Tag): Promise<void> {
    try {
      const { id, ...data } = tag;
      await setDoc(doc(this.tagsRef, id), removeUndefined(data), {
        merge: true,
      });
    } catch (error) {
      console.error("Error saving tag to Firestore:", error);
      throw error;
    }
  }

  async deleteTagById(id: string): Promise<void> {
    try {
      await deleteDoc(doc(this.tagsRef, id));
    } catch (error) {
      console.error("Error deleting tag from Firestore:", error);
      throw error;
    }
  }

  // === Bulk operations ===
  async deleteTasks(ids: string[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      ids.forEach((id) => batch.delete(doc(this.tasksRef, id)));
      await batch.commit();
    } catch (error) {
      console.error("Error deleting tasks from Firestore:", error);
      throw error;
    }
  }

  async updateTasksOrders(
    updates: Array<{ id: string; order: number; updatedAt: number }>,
  ): Promise<void> {
    try {
      const batch = writeBatch(db);
      updates.forEach(({ id, order, updatedAt }) => {
        batch.update(doc(this.tasksRef, id), { order, updatedAt });
      });
      await batch.commit();
    } catch (error) {
      console.error("Error updating task orders in Firestore:", error);
      throw error;
    }
  }

  /**
   * Subscribe to real-time updates
   */
  subscribe(callback: (data: TodoData) => void): () => void {
    const data: TodoData = { lists: [], tasks: [], tags: [] };

    const updateCallback = () => callback({ ...data });

    const unsubLists = onSnapshot(this.listsRef, (snapshot) => {
      data.lists = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as TaskList),
      );
      updateCallback();
    });

    const unsubTasks = onSnapshot(this.tasksRef, (snapshot) => {
      data.tasks = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Task),
      );
      updateCallback();
    });

    const unsubTags = onSnapshot(this.tagsRef, (snapshot) => {
      data.tags = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Tag),
      );
      updateCallback();
    });

    this.unsubscribers = [unsubLists, unsubTasks, unsubTags];

    return () => {
      this.unsubscribers.forEach((unsub) => unsub());
      this.unsubscribers = [];
    };
  }

  cleanup(): void {
    this.unsubscribers.forEach((unsub) => unsub());
    this.unsubscribers = [];
  }
}

// ============================================================================
// Hybrid Service (switches based on auth state)
// ============================================================================

class HybridTodoService implements TodoService {
  private localService = new LocalTodoService();
  private firestoreService: FirestoreTodoService | null = null;
  private hasMigrated = false;

  private getService(): TodoService {
    const user = auth.currentUser;
    if (user) {
      if (
        !this.firestoreService ||
        this.firestoreService["userId"] !== user.uid
      ) {
        this.firestoreService?.cleanup();
        this.firestoreService = new FirestoreTodoService(user.uid);
      }
      return this.firestoreService;
    }
    return this.localService;
  }

  async load(): Promise<TodoData> {
    return this.getService().load();
  }

  async saveLists(lists: TaskList[]): Promise<void> {
    return this.getService().saveLists(lists);
  }

  async saveTasks(tasks: Task[]): Promise<void> {
    return this.getService().saveTasks(tasks);
  }

  async saveTags(tags: Tag[]): Promise<void> {
    return this.getService().saveTags(tags);
  }

  async clear(): Promise<void> {
    return this.getService().clear();
  }

  // === Granular List operations ===
  async saveList(list: TaskList): Promise<void> {
    return this.getService().saveList(list);
  }

  async deleteListById(id: string): Promise<void> {
    return this.getService().deleteListById(id);
  }

  // === Granular Task operations ===
  async saveTask(task: Task): Promise<void> {
    return this.getService().saveTask(task);
  }

  async updateTaskFields(
    id: string,
    updates: Partial<Omit<Task, "id" | "listId" | "createdAt">>,
  ): Promise<void> {
    return this.getService().updateTaskFields(id, updates);
  }

  async deleteTaskById(id: string): Promise<void> {
    return this.getService().deleteTaskById(id);
  }

  // === Granular Tag operations ===
  async saveTag(tag: Tag): Promise<void> {
    return this.getService().saveTag(tag);
  }

  async deleteTagById(id: string): Promise<void> {
    return this.getService().deleteTagById(id);
  }

  // === Bulk operations ===
  async deleteTasks(ids: string[]): Promise<void> {
    return this.getService().deleteTasks(ids);
  }

  async updateTasksOrders(
    updates: Array<{ id: string; order: number; updatedAt: number }>,
  ): Promise<void> {
    return this.getService().updateTasksOrders(updates);
  }

  /**
   * Migrate local data to Firestore on first sign-in (Smart Merge)
   * - Items with same ID: keep the one with newer updatedAt
   * - Items only in local: add to cloud
   * - Items only in cloud: keep in cloud
   */
  async migrateToFirestore(): Promise<void> {
    const user = auth.currentUser;
    if (!user || this.hasMigrated) {
      console.log("[Migration] Skipped:", {
        hasUser: !!user,
        hasMigrated: this.hasMigrated,
      });
      return;
    }

    try {
      const rawLocalData = await this.localService.load();
      // Ensure all arrays exist (handle corrupted/incomplete data)
      const localData: TodoData = {
        lists: rawLocalData?.lists || [],
        tasks: rawLocalData?.tasks || [],
        tags: rawLocalData?.tags || [],
      };

      if (
        localData.lists.length === 0 &&
        localData.tasks.length === 0 &&
        localData.tags.length === 0
      ) {
        console.log("[Migration] No local data to migrate, skipping");
        this.hasMigrated = true;
        return;
      }

      const firestoreService = new FirestoreTodoService(user.uid);
      const cloudData = await firestoreService.load();

      // Smart merge function
      const smartMerge = <T extends { id: string; updatedAt: number }>(
        local: T[],
        cloud: T[],
      ): T[] => {
        const merged = new Map<string, T>();

        // Add all cloud items first
        cloud.forEach((item) => merged.set(item.id, item));

        // Merge local items (newer wins)
        local.forEach((localItem) => {
          const cloudItem = merged.get(localItem.id);
          if (!cloudItem || localItem.updatedAt > cloudItem.updatedAt) {
            merged.set(localItem.id, localItem);
          }
        });

        return Array.from(merged.values());
      };

      // Merge each collection
      const mergedLists = smartMerge(localData.lists, cloudData.lists);
      const mergedTasks = smartMerge(localData.tasks, cloudData.tasks);
      const mergedTags = smartMerge(localData.tags, cloudData.tags);

      // Save merged data to Firestore
      await Promise.all([
        firestoreService.saveLists(mergedLists),
        firestoreService.saveTasks(mergedTasks),
        firestoreService.saveTags(mergedTags),
      ]);

      this.hasMigrated = true;
    } catch (error) {
      console.error("Migration failed:", error);
      throw error;
    }
  }

  /**
   * Subscribe to real-time updates (only works when authenticated)
   */
  subscribe(callback: (data: TodoData) => void): (() => void) | null {
    if (this.firestoreService) {
      return this.firestoreService.subscribe(callback);
    }
    return null;
  }

  /**
   * Check if currently using Firestore
   */
  isUsingFirestore(): boolean {
    return !!auth.currentUser;
  }
}

// ============================================================================
// Export singleton instance
// ============================================================================

export const todoService = new HybridTodoService();
