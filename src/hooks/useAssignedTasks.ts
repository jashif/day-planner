import { useEffect, useState } from "react";
import { completeAssignedTask, subscribeToAssignedTasks } from "../db/tasksDb";
import type { AssignedTask } from "../types/task";

/** Tasks a friend shared with the signed-in user; completing one credits the friend's original task too. */
export const useAssignedTasks = (uid: string, myDisplayName: string, onPoint: () => void) => {
  const [tasks, setTasks] = useState<AssignedTask[]>([]);

  useEffect(() => subscribeToAssignedTasks(uid, setTasks), [uid]);

  const complete = async (task: AssignedTask) => {
    if (task.done) return;
    await completeAssignedTask(task.ownerUid, task.id, uid, myDisplayName);
    onPoint();
  };

  return { tasks, complete };
};
