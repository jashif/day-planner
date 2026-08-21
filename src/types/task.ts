export type Priority = "low" | "medium" | "high";

export type View = "today" | "upcoming" | "all";

export type BreakdownDetail = "quick" | "normal" | "thorough";

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
}

export interface NewTaskInput {
  title: string;
  date: string;
  time: string;
  priority: Priority;
}
