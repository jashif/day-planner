import { useCallback, useEffect, useState } from "react";
import { addTask, deleteTask, subscribeToTasks, updateTask } from "../db/tasksDb";
import { nextOccurrenceISO } from "../utils/dates";
import type { NewTaskInput, Recurrence, Subtask, Task } from "../types/task";

export const useTasks = (uid: string) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = subscribeToTasks(
      uid,
      (nextTasks) => {
        setTasks(nextTasks);
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        setIsLoading(false);
        setError(err.message);
      },
    );
    return unsubscribe;
  }, [uid]);

  const createTask = useCallback(
    async (input: NewTaskInput) => {
      try {
        await addTask(uid, input);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save task");
        throw err;
      }
    },
    [uid],
  );

  const toggleTask = useCallback(
    async (id: string) => {
      const task = tasks.find((t) => t.id === id);
      if (!task) return;
      try {
        await updateTask(uid, id, { done: !task.done });
        if (!task.done && task.recurrence && task.recurrence !== "none") {
          const nextDate = nextOccurrenceISO(
            task.date,
            task.recurrence as Exclude<Recurrence, "none">,
          );
          const nextExists = tasks.some(
            (candidate) =>
              candidate.title === task.title &&
              candidate.date === nextDate &&
              candidate.recurrence === task.recurrence,
          );
          if (!nextExists) {
            await addTask(uid, {
              title: task.title,
              date: nextDate,
              time: task.time ?? "",
              priority: task.priority,
              recurrence: task.recurrence,
            });
          }
        }
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update task");
      }
    },
    [uid, tasks],
  );

  const removeTask = useCallback(
    async (id: string) => {
      try {
        await deleteTask(uid, id);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete task");
      }
    },
    [uid],
  );

  const setSubtasks = useCallback(
    async (id: string, subtasks: Subtask[]) => {
      try {
        await updateTask(uid, id, { subtasks });
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save breakdown");
        throw err;
      }
    },
    [uid],
  );

  const rescheduleTask = useCallback(
    async (id: string, time: string | null) => {
      try {
        await updateTask(uid, id, { time });
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to reschedule task");
      }
    },
    [uid],
  );

  const toggleSubtask = useCallback(
    async (id: string, subtaskId: string) => {
      const task = tasks.find((t) => t.id === id);
      if (!task?.subtasks) return;
      const subtasks = task.subtasks.map((s) => (s.id === subtaskId ? { ...s, done: !s.done } : s));
      try {
        await updateTask(uid, id, { subtasks });
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update step");
      }
    },
    [uid, tasks],
  );

  return {
    tasks,
    isLoading,
    error,
    createTask,
    toggleTask,
    removeTask,
    setSubtasks,
    toggleSubtask,
    rescheduleTask,
  };
};
