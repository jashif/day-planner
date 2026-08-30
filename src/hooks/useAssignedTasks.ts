import { useEffect, useState } from "react";
import { completeAssignedTask, subscribeToAssignedTasks } from "../db/tasksDb";
import type { AssignedTask } from "../types/task";

/** Tasks a friend shared with the signed-in user; completing one credits the friend's original task too. */
export const useAssignedTasks = (uid: string, myDisplayName: string, onPoint: () => void) => {
  const [tasks, setTasks] = useState<AssignedTask[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(
    () =>
      subscribeToAssignedTasks(
        uid,
        (nextTasks) => {
          setTasks(nextTasks);
          setError(null);
        },
        (err) => setError(err.message),
      ),
    [uid],
  );

  const complete = async (task: AssignedTask) => {
    if (task.done) return;
    try {
      await completeAssignedTask(task.ownerUid, task.id, uid, myDisplayName);
      onPoint();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to complete shared task");
    }
  };

  return { tasks, error, complete };
};
