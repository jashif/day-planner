import { useState, lazy, Suspense } from "react";
import { EmptyState } from "./EmptyState";
import { TaskRow } from "./TaskRow";
import { todayISO } from "../utils/dates";
import type { AiLimit } from "../hooks/useDailyAiLimit";
import type { Subtask, Task, View } from "../types/task";

const DayTimeline = lazy(() => import("./DayTimeline").then((m) => ({ default: m.DayTimeline })));

interface TaskListProps {
  tasks: Task[];
  view: View;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onSetSubtasks: (id: string, subtasks: Subtask[]) => Promise<void>;
  onToggleSubtask: (id: string, subtaskId: string) => Promise<void>;
  onReschedule: (id: string, time: string | null) => void;
  onQuickAddAt: (time: string) => void;
  aiLimit: AiLimit;
}

const sortTasks = (tasks: Task[]): Task[] =>
  [...tasks].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    if (!!a.time !== !!b.time) return a.time ? -1 : 1;
    if (a.time && b.time && a.time !== b.time) return a.time < b.time ? -1 : 1;
    return a.createdAt - b.createdAt;
  });

export const TaskList = ({
  tasks,
  view,
  onToggle,
  onRemove,
  onSetSubtasks,
  onToggleSubtask,
  onReschedule,
  onQuickAddAt,
  aiLimit,
}: TaskListProps) => {
  const [showCompleted, setShowCompleted] = useState(false);

  if (view === "timeline") {
    const today = todayISO();
    const todaysTasks = tasks.filter((t) => t.date === today);
    if (todaysTasks.length === 0) return <EmptyState view={view} />;
    return (
      <Suspense fallback={null}>
        <DayTimeline
          tasks={todaysTasks}
          onToggle={onToggle}
          onRemove={onRemove}
          onSetSubtasks={onSetSubtasks}
          onToggleSubtask={onToggleSubtask}
          onReschedule={onReschedule}
          onQuickAddAt={onQuickAddAt}
          aiLimit={aiLimit}
        />
      </Suspense>
    );
  }

  if (tasks.length === 0) {
    return <EmptyState view={view} />;
  }

  const incomplete = sortTasks(tasks.filter((t) => !t.done));
  const completed = sortTasks(tasks.filter((t) => t.done));

  const row = (task: Task) => (
    <TaskRow
      key={task.id}
      task={task}
      onToggle={onToggle}
      onRemove={onRemove}
      onSetSubtasks={onSetSubtasks}
      onToggleSubtask={onToggleSubtask}
      aiLimit={aiLimit}
    />
  );

  return (
    <>
      {incomplete.length === 0 && completed.length > 0 ? (
        <p className="all-done-hint">Nothing left to do — nice work.</p>
      ) : (
        incomplete.map(row)
      )}
      {completed.length > 0 && (
        <div className="completed-section">
          <button
            className="completed-toggle"
            type="button"
            onClick={() => setShowCompleted(!showCompleted)}
            aria-expanded={showCompleted}
          >
            <svg
              width="10"
              height="10"
              viewBox="0 0 10 10"
              fill="none"
              className={`completed-chevron ${showCompleted ? "is-open" : ""}`}
              aria-hidden="true"
            >
              <path
                d="M2 3.5 5 6.5 8 3.5"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
            Completed ({completed.length})
          </button>
          {showCompleted && completed.map(row)}
        </div>
      )}
    </>
  );
};
