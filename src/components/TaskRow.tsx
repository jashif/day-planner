import { formatGroupLabel, formatTime, todayISO } from "../utils/dates";
import { useBreakdown } from "../hooks/useBreakdown";
import { BreakdownPanel } from "./BreakdownPanel";
import type { AiLimit } from "../hooks/useDailyAiLimit";
import type { Subtask, Task } from "../types/task";

interface TaskRowProps {
  task: Task;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onSetSubtasks: (id: string, subtasks: Subtask[]) => Promise<void>;
  onToggleSubtask: (id: string, subtaskId: string) => Promise<void>;
  aiLimit: AiLimit;
}

export const TaskRow = ({
  task,
  onToggle,
  onRemove,
  onSetSubtasks,
  onToggleSubtask,
  aiLimit,
}: TaskRowProps) => {
  const breakdown = useBreakdown(task, onSetSubtasks, aiLimit);
  const { isOpen, setIsOpen, subtasks, doneCount } = breakdown;

  return (
    <div className={`task-row ${task.done ? "is-done" : ""}`}>
      <div className="task-row-main">
        <button
          className={`check ${task.done ? "is-checked" : ""}`}
          role="checkbox"
          aria-checked={task.done}
          aria-label="Mark done"
          onClick={() => onToggle(task.id)}
        >
          <svg viewBox="0 0 12 12" fill="none">
            <path
              d="M2 6.5L4.5 9L10 3"
              stroke="white"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <div className="task-body">
          <div className="task-title">{task.title}</div>
          <div className="task-meta">
            <span className={`priority-dot ${task.priority}`} />
            {task.date !== todayISO() && (
              <span className="date-badge">{formatGroupLabel(task.date)}</span>
            )}
            {task.time && <span className="task-time">{formatTime(task.time)}</span>}
            {task.recurrence && task.recurrence !== "none" && (
              <span className="recurrence-badge">
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path
                    d="M9.5 4.5A3.5 3.5 0 1 0 10 7"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M9.5 2.5v2h-2"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                  />
                </svg>
                {task.recurrence}
              </span>
            )}
            {task.sharedWithName && (
              <span className="shared-badge">shared with {task.sharedWithName}</span>
            )}
            {task.done && task.completedByName && (
              <span className="shared-badge is-done">done by {task.completedByName}</span>
            )}
            {subtasks.length > 0 && (
              <button
                className={`steps-badge ${doneCount === subtasks.length ? "is-complete" : ""}`}
                type="button"
                onClick={() => setIsOpen(!isOpen)}
              >
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <rect x="0.5" y="0.5" width="4" height="4" rx="1" stroke="currentColor" />
                  <path d="M1.3 2.5 1.9 3.1 3.2 1.7" stroke="currentColor" strokeLinecap="round" />
                  <rect x="0.5" y="7.5" width="4" height="4" rx="1" stroke="currentColor" />
                  <path d="M6.5 2h5.5M6.5 9.5h5.5" stroke="currentColor" strokeLinecap="round" />
                </svg>
                {doneCount}/{subtasks.length} steps
              </button>
            )}
          </div>
        </div>
        <button
          className={`breakdown-toggle ${isOpen ? "is-active" : ""} ${subtasks.length > 0 ? "has-steps" : ""}`}
          aria-label={subtasks.length > 0 ? "View task steps" : "Break task into steps"}
          aria-expanded={isOpen}
          onClick={() => setIsOpen(!isOpen)}
        >
          ✨
        </button>
        <button
          className="remove-btn"
          aria-label="Delete task"
          onClick={() => {
            if (window.confirm(`Delete "${task.title}"?`)) onRemove(task.id);
          }}
        >
          ×
        </button>
      </div>

      {isOpen && (
        <BreakdownPanel
          task={task}
          breakdown={breakdown}
          onToggleSubtask={onToggleSubtask}
          aiLimit={aiLimit}
        />
      )}
    </div>
  );
};
