import { useState } from "react";
import { breakdownTask } from "../ai/breakdownTask";
import type { AiLimit } from "./useDailyAiLimit";
import type { BreakdownDetail, Subtask, Task } from "../types/task";

const generateId = (): string =>
  crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

/** Shared state/actions for the AI step-breakdown panel, used by both the list row and timeline block. */
export const useBreakdown = (
  task: Task,
  onSetSubtasks: (id: string, subtasks: Subtask[]) => Promise<void>,
  aiLimit: AiLimit,
) => {
  const [isOpen, setIsOpen] = useState(false);
  const [detail, setDetail] = useState<BreakdownDetail>("normal");
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  const subtasks = task.subtasks ?? [];
  const doneCount = subtasks.filter((s) => s.done).length;

  const generate = async () => {
    if (aiLimit.isLimitReached) return;
    setIsGenerating(true);
    setGenError(null);
    try {
      const steps = await breakdownTask(task.title, detail);
      if (steps.length === 0) {
        setGenError("Couldn't find any steps for that. Try rephrasing the task.");
        return;
      }
      const next: Subtask[] = steps.map((title) => ({
        id: generateId(),
        title,
        done: false,
      }));
      await onSetSubtasks(task.id, next);
      await aiLimit.recordUsage();
    } catch (err) {
      console.error("breakdownTask failed:", err);
      setGenError("Something went wrong breaking this down. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const clearBreakdown = async () => {
    if (window.confirm("Clear these steps?")) {
      await onSetSubtasks(task.id, []);
    }
  };

  const removeSubtask = async (subtaskId: string) => {
    await onSetSubtasks(
      task.id,
      subtasks.filter((s) => s.id !== subtaskId),
    );
  };

  return {
    isOpen,
    setIsOpen,
    detail,
    setDetail,
    isGenerating,
    genError,
    subtasks,
    doneCount,
    generate,
    clearBreakdown,
    removeSubtask,
  };
};

export type BreakdownState = ReturnType<typeof useBreakdown>;
