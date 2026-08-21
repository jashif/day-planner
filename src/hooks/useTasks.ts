import { useCallback, useEffect, useState } from "react";
import {
  addTask,
  deleteTask,
  subscribeToTasks,
  updateTask,
} from "../db/tasksDb";
import type { NewTaskInput, Task } from "../types/task";

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

  return { tasks, isLoading, error, createTask, toggleTask, removeTask };
};
