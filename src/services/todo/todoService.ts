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
import { removeUndefined, undefinedToDeleteField } from "@utils/objectUtils";

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
  duplicateList(id: string, newList: TaskList, newTasks: Task[]): Promise<void>;

  // Granular Task operations
  saveTask(task: Task): Promise<void>;
  updateTaskFields(
    id: string,
    updates: Partial<Omit<Task, "id" | "listId" | "createdAt">>,
  ): Promise<void>;
  deleteTaskById(id: string): Promise<void>;
  duplicateTask(id: string, newTask: Task): Promise<void>;

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
const LAST_USER_KEY = "tartb-todo-last-user";

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
        console.log("[LocalService] Raw storage result:", result);
        const data = this.ensureValidData(result[STORAGE_KEY]);
        console.log("[LocalService] Loaded data:", {
          listsCount: data.lists.length,
          tasksCount: data.tasks.length,
          tagsCount: data.tags.length,
        });
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
      console.log("[LocalService] Loaded data from localStorage:", {
        listsCount: data.lists.length,
        tasksCount: data.tasks.length,
        tagsCount: data.tags.length,
      });
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
    if (!this.cache) {
      console.warn("[LocalService] Cache is null in saveList, loading...");
      await this.load();
    }

    console.log("[LocalService] saveList - Cache state:", {
      listsCount: this.cache!.lists.length,
      tasksCount: this.cache!.tasks.length,
      tagsCount: this.cache!.tags.length,
    });

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

  async duplicateList(
    id: string,
    newList: TaskList,
    newTasks: Task[],
  ): Promise<void> {
    if (!this.cache) await this.load();

    const originalIndex = this.cache!.lists.findIndex((l) => l.id === id);
    if (originalIndex >= 0) {
      // Insert the duplicated list right after the original
      this.cache!.lists.splice(originalIndex + 1, 0, newList);
    } else {
      // If original not found, just add at the end
      this.cache!.lists.push(newList);
    }

    // Add all duplicated tasks
    this.cache!.tasks.push(...newTasks);

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

  async duplicateTask(id: string, newTask: Task): Promise<void> {
    if (!this.cache) await this.load();

    const originalIndex = this.cache!.tasks.findIndex((t) => t.id === id);
    if (originalIndex >= 0) {
      // Insert the duplicated task right after the original
      this.cache!.tasks.splice(originalIndex + 1, 0, newTask);
    } else {
      // If original not found, just add at the end
      this.cache!.tasks.push(newTask);
    }

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
    console.log("[LocalService] Saving data:", {
      listsCount: data.lists.length,
      tasksCount: data.tasks.length,
      tagsCount: data.tags.length,
    });

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

  // === Cache management (for real-time sync) ===
  updateCache(data: TodoData): void {
    this.cache = data;
  }

  getCache(): TodoData | null {
    return this.cache;
  }

  // === Last user tracking ===
  async getLastUserId(): Promise<string | null> {
    const storage = getStorage();

    if (storage) {
      try {
        const result = await storage.get(LAST_USER_KEY);
        return result[LAST_USER_KEY] || null;
      } catch {
        return null;
      }
    }

    return localStorage.getItem(LAST_USER_KEY);
  }

  async setLastUserId(userId: string | null): Promise<void> {
    const storage = getStorage();

    if (storage) {
      try {
        if (userId) {
          await storage.set({ [LAST_USER_KEY]: userId });
        } else {
          await storage.remove(LAST_USER_KEY);
        }
        return;
      } catch (error) {
        console.error("Error saving last user ID:", error);
      }
    }

    if (userId) {
      localStorage.setItem(LAST_USER_KEY, userId);
    } else {
      localStorage.removeItem(LAST_USER_KEY);
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
        (doc) => ({ id: doc.id, ...doc.data() }) as TaskList,
      );
      const tasks: Task[] = tasksSnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() }) as Task,
      );
      const tags: Tag[] = tagsSnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() }) as Tag,
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

  async duplicateList(
    _MOOD_PROFILESid: string,
    newList: TaskList,
    newTasks: Task[],
  ): Promise<void> {
    try {
      // Use batch to save list + tasks atomically
      const batch = writeBatch(db);

      // Save the duplicated list
      const { id: newListId, ...listData } = newList;
      batch.set(doc(this.listsRef, newListId), removeUndefined(listData));

      // Save all duplicated tasks
      newTasks.forEach((task) => {
        const { id: taskId, ...taskData } = task;
        batch.set(doc(this.tasksRef, taskId), removeUndefined(taskData));
      });

      await batch.commit();
    } catch (error) {
      console.error("Error duplicating list in Firestore:", error);
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
      await updateDoc(doc(this.tasksRef, id), undefinedToDeleteField(updates));
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

  async duplicateTask(_id: string, newTask: Task): Promise<void> {
    try {
      const { id: newId, ...data } = newTask;
      await setDoc(doc(this.tasksRef, newId), removeUndefined(data), {
        merge: true,
      });
    } catch (error) {
      console.error("Error duplicating task in Firestore:", error);
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
    const loadedCollections = { lists: false, tasks: false, tags: false };

    const updateCallback = () => {
      // Only call callback if ALL collections have loaded at least once
      if (
        loadedCollections.lists &&
        loadedCollections.tasks &&
        loadedCollections.tags
      ) {
        callback({ ...data });
      }
    };

    // Only update from server data, not from cache
    // This prevents restoring deleted items from stale offline cache
    const unsubLists = onSnapshot(
      this.listsRef,
      { includeMetadataChanges: false },
      (snapshot) => {
        // Skip cached data to prevent deleted items from being restored
        if (!snapshot.metadata.fromCache) {
          data.lists = snapshot.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() }) as TaskList,
          );
          loadedCollections.lists = true;
          updateCallback();
        }
      },
    );

    const unsubTasks = onSnapshot(
      this.tasksRef,
      { includeMetadataChanges: false },
      (snapshot) => {
        if (!snapshot.metadata.fromCache) {
          data.tasks = snapshot.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() }) as Task,
          );
          loadedCollections.tasks = true;
          updateCallback();
        }
      },
    );

    const unsubTags = onSnapshot(
      this.tagsRef,
      { includeMetadataChanges: false },
      (snapshot) => {
        if (!snapshot.metadata.fromCache) {
          data.tags = snapshot.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() }) as Tag,
          );
          loadedCollections.tags = true;
          updateCallback();
        }
      },
    );

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
// Hybrid Service (Local-first architecture)
// - All operations write to local first (instant UI)
// - If authenticated, sync to cloud in background
// - Real-time listener updates local when cloud changes
// ============================================================================

class HybridTodoService implements TodoService {
  private localService = new LocalTodoService();
  private firestoreService: FirestoreTodoService | null = null;

  /**
   * Ensure Firestore service is initialized for the current user
   */
  private ensureFirestoreService(): FirestoreTodoService | null {
    const user = auth.currentUser;
    if (!user) {
      this.firestoreService?.cleanup();
      this.firestoreService = null;
      return null;
    }

    if (
      !this.firestoreService ||
      this.firestoreService["userId"] !== user.uid
    ) {
      this.firestoreService?.cleanup();
      this.firestoreService = new FirestoreTodoService(user.uid);
    }

    return this.firestoreService;
  }

  /**
   * Sync to cloud in background (fire and forget)
   * Logs errors but doesn't throw
   */
  private syncToCloud<T>(operation: () => Promise<T>): void {
    const firestore = this.ensureFirestoreService();
    if (!firestore) return;

    operation().catch((error) => {
      console.error("[Sync] Background sync failed:", error);
    });
  }

  // === Load: Always from local ===
  async load(): Promise<TodoData> {
    return this.localService.load();
  }

  // === Bulk operations: Local first, then sync ===
  async saveLists(lists: TaskList[]): Promise<void> {
    await this.localService.saveLists(lists);
    this.syncToCloud(() => this.firestoreService!.saveLists(lists));
  }

  async saveTasks(tasks: Task[]): Promise<void> {
    await this.localService.saveTasks(tasks);
    this.syncToCloud(() => this.firestoreService!.saveTasks(tasks));
  }

  async saveTags(tags: Tag[]): Promise<void> {
    await this.localService.saveTags(tags);
    this.syncToCloud(() => this.firestoreService!.saveTags(tags));
  }

  async clear(): Promise<void> {
    await this.localService.clear();
    this.syncToCloud(() => this.firestoreService!.clear());
  }

  // === Granular List operations ===
  async saveList(list: TaskList): Promise<void> {
    await this.localService.saveList(list);
    this.syncToCloud(() => this.firestoreService!.saveList(list));
  }

  async deleteListById(id: string): Promise<void> {
    await this.localService.deleteListById(id);
    this.syncToCloud(() => this.firestoreService!.deleteListById(id));
  }

  async duplicateList(
    id: string,
    newList: TaskList,
    newTasks: Task[],
  ): Promise<void> {
    await this.localService.duplicateList(id, newList, newTasks);
    this.syncToCloud(() =>
      this.firestoreService!.duplicateList(id, newList, newTasks),
    );
  }

  // === Granular Task operations ===
  async saveTask(task: Task): Promise<void> {
    await this.localService.saveTask(task);
    this.syncToCloud(() => this.firestoreService!.saveTask(task));
  }

  async updateTaskFields(
    id: string,
    updates: Partial<Omit<Task, "id" | "listId" | "createdAt">>,
  ): Promise<void> {
    await this.localService.updateTaskFields(id, updates);
    this.syncToCloud(() =>
      this.firestoreService!.updateTaskFields(id, updates),
    );
  }

  async deleteTaskById(id: string): Promise<void> {
    await this.localService.deleteTaskById(id);
    this.syncToCloud(() => this.firestoreService!.deleteTaskById(id));
  }

  async duplicateTask(id: string, newTask: Task): Promise<void> {
    await this.localService.duplicateTask(id, newTask);
    this.syncToCloud(() => this.firestoreService!.duplicateTask(id, newTask));
  }

  // === Granular Tag operations ===
  async saveTag(tag: Tag): Promise<void> {
    await this.localService.saveTag(tag);
    this.syncToCloud(() => this.firestoreService!.saveTag(tag));
  }

  async deleteTagById(id: string): Promise<void> {
    await this.localService.deleteTagById(id);
    this.syncToCloud(() => this.firestoreService!.deleteTagById(id));
  }

  // === Bulk operations ===
  async deleteTasks(ids: string[]): Promise<void> {
    await this.localService.deleteTasks(ids);
    this.syncToCloud(() => this.firestoreService!.deleteTasks(ids));
  }

  async updateTasksOrders(
    updates: Array<{ id: string; order: number; updatedAt: number }>,
  ): Promise<void> {
    await this.localService.updateTasksOrders(updates);
    this.syncToCloud(() => this.firestoreService!.updateTasksOrders(updates));
  }

  /**
   * Handle sign-in: Check user, merge/replace data, setup sync
   * - Different user: Clear local, load from cloud
   * - Same user: Smart merge local ↔ cloud
   */
  async onSignIn(): Promise<TodoData> {
    const user = auth.currentUser;
    if (!user) {
      return this.localService.load();
    }

    const lastUserId = await this.localService.getLastUserId();
    const isSameUser = lastUserId === user.uid;

    console.log("[Sync] Sign-in detected:", {
      currentUser: user.uid,
      lastUser: lastUserId,
      isSameUser,
    });

    this.ensureFirestoreService();

    if (!isSameUser && lastUserId !== null) {
      // Different user: Clear local data to prevent cross-contamination
      console.log("[Sync] Different user detected, clearing local data");
      await this.localService.clear();
    }

    // Load both local and cloud data
    const [localData, cloudData] = await Promise.all([
      this.localService.load(),
      this.firestoreService!.load(),
    ]);

    // Smart merge (newer wins)
    const mergedData = this.smartMerge(localData, cloudData);

    // Save merged data to both local and cloud
    await this.localService.saveLists(mergedData.lists);
    await this.localService.saveTasks(mergedData.tasks);
    await this.localService.saveTags(mergedData.tags);

    // Sync merged data to cloud (in case local had newer items)
    await Promise.all([
      this.firestoreService!.saveLists(mergedData.lists),
      this.firestoreService!.saveTasks(mergedData.tasks),
      this.firestoreService!.saveTags(mergedData.tags),
    ]);

    // Remember this user
    await this.localService.setLastUserId(user.uid);

    console.log("[Sync] Sign-in complete, data merged");
    return mergedData;
  }

  /**
   * Handle sign-out: Keep local data, clear user tracking
   */
  async onSignOut(): Promise<void> {
    console.log("[Sync] Sign-out, keeping local data");
    this.firestoreService?.cleanup();
    this.firestoreService = null;
    // Keep local data but clear the user association
    // Next sign-in with different user will clear it
  }

  /**
   * Smart merge: Items with same ID use newer updatedAt
   */
  private smartMerge(local: TodoData, cloud: TodoData): TodoData {
    const mergeArray = <T extends { id: string; updatedAt: number }>(
      localArr: T[],
      cloudArr: T[],
    ): T[] => {
      const merged = new Map<string, T>();

      // Add all cloud items first
      cloudArr.forEach((item) => merged.set(item.id, item));

      // Merge local items (newer wins)
      localArr.forEach((localItem) => {
        const cloudItem = merged.get(localItem.id);
        if (!cloudItem || localItem.updatedAt > cloudItem.updatedAt) {
          merged.set(localItem.id, localItem);
        }
      });

      return Array.from(merged.values());
    };

    return {
      lists: mergeArray(local.lists, cloud.lists),
      tasks: mergeArray(local.tasks, cloud.tasks),
      tags: mergeArray(local.tags, cloud.tags),
    };
  }

  /**
   * Subscribe to real-time updates
   * Updates local storage when cloud changes (from other devices)
   */
  subscribe(callback: (data: TodoData) => void): (() => void) | null {
    const firestore = this.ensureFirestoreService();
    if (!firestore) return null;

    return firestore.subscribe(async (cloudData) => {
      // Update local cache with cloud data
      this.localService.updateCache(cloudData);

      // Persist to local storage
      await Promise.all([
        this.localService.saveLists(cloudData.lists),
        this.localService.saveTasks(cloudData.tasks),
        this.localService.saveTags(cloudData.tags),
      ]);

      // Notify UI
      callback(cloudData);
    });
  }

  /**
   * Check if currently authenticated
   */
  isAuthenticated(): boolean {
    return !!auth.currentUser;
  }

  /**
   * Get the local service (for direct access if needed)
   */
  getLocalService(): LocalTodoService {
    return this.localService;
  }
}

// ============================================================================
// Export singleton instance
// ============================================================================

export const todoService = new HybridTodoService();
