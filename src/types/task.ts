export type Priority = "low" | "medium" | "high";

export type View = "list" | "timeline";

export type BreakdownDetail = "quick" | "normal" | "thorough";

export type Recurrence = "none" | "daily" | "weekly" | "monthly";

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

export interface Task {
  id: string;
  title: string;
  date: string;
  time: string | null;
  priority: Priority;
  done: boolean;
  createdAt: number;
  subtasks?: Subtask[];
  recurrence?: Recurrence;
  section?: string;
}

export interface NewTaskInput {
  title: string;
  date: string;
  time: string;
  priority: Priority;
  recurrence: Recurrence;
  section?: string;
}
