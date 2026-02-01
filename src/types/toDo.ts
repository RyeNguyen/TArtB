import { TaskPriorityType } from "@constants/common";

export interface TaskList {
  id: string;
  title: string;
  color?: string;
  order: number;
  createdAt: number;
  updatedAt: number;
}

export interface Task {
  id: string;
  listId: string;
  title: string;
  description?: string;
  isCompleted: boolean;
  priority: TaskPriorityType;
  tags?: string[];
  deadline?: number;
  order: number;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
}

export interface Tag {
  id: string;
  title: string;
  color?: string;
  createdAt: number;
  updatedAt: number;
}

export interface TodoData {
  lists: TaskList[];
  tasks: Task[];
  tags: Tag[];
}
