import type { Priority, Recurrence } from "./task";

export type RoutineRecurrence = Exclude<Recurrence, "none">;

/** One recurring activity the AI extracted from the user's description of their day. */
export interface RoutineSuggestion {
  id: string;
  title: string;
  /** 24-hour "HH:MM", or null when the user didn't mention a time. */
  time: string | null;
  recurrence: RoutineRecurrence;
  /** 0 = Sunday … 6 = Saturday. Only meaningful for weekly items. */
  weekday: number | null;
  priority: Priority;
  selected: boolean;
}
