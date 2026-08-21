import { useState } from "react";
import { formatTime } from "../utils/dates";
import { breakdownTask } from "../ai/breakdownTask";
import type { BreakdownLimit } from "../hooks/useDailyBreakdownLimit";
import type { BreakdownDetail, Subtask, Task } from "../types/task";

interface TaskRowProps {
  task: Task;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onSetSubtasks: (id: string, subtasks: Subtask[]) => Promise<void>;
  onToggleSubtask: (id: string, subtaskId: string) => Promise<void>;
  breakdownLimit: BreakdownLimit;
}

const DETAIL_OPTIONS: { value: BreakdownDetail; label: string }[] = [
  { value: "quick", label: "Quick" },
  { value: "normal", label: "Normal" },
  { value: "thorough", label: "Thorough" },
];

const generateId = (): string =>
  crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const TaskRow = ({
  task,
  onToggle,
  onRemove,
  onSetSubtasks,
  onToggleSubtask,
  breakdownLimit,
}: TaskRowProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [detail, setDetail] = useState<BreakdownDetail>("normal");
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  const subtasks = task.subtasks ?? [];
  const doneCount = subtasks.filter((s) => s.done).length;

  const generate = async () => {
    if (breakdownLimit.isLimitReached) return;
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
      await breakdownLimit.recordUsage();
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

  return (
    <div className={`task-row ${task.done ? "is-done" : ""}`}>
      <div className="task-row-main">
        <button
          className={`check ${task.done ? "is-checked" : ""}`}
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
            {task.time && <span className="task-time">{formatTime(task.time)}</span>}
            {subtasks.length > 0 && (
              <span className="task-time">
                {doneCount}/{subtasks.length} steps
              </span>
            )}
          </div>
        </div>
        <button
          className={`breakdown-toggle ${isOpen ? "is-active" : ""}`}
          aria-label="Break task into steps"
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
        <div className="breakdown-panel">
          {subtasks.length > 0 ? (
            <>
              <ul className="subtask-list">
                {subtasks.map((subtask) => (
                  <li className="subtask-item" key={subtask.id}>
                    <button
                      className={`check subtask-check ${subtask.done ? "is-checked" : ""}`}
                      aria-label="Mark step done"
                      onClick={() => onToggleSubtask(task.id, subtask.id)}
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
                    <span className={`subtask-title ${subtask.done ? "is-done" : ""}`}>
                      {subtask.title}
                    </span>
                    <button
                      className="subtask-remove"
                      aria-label="Remove step"
                      onClick={() => removeSubtask(subtask.id)}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
              <div className="breakdown-controls">
                <button
                  className="breakdown-link"
                  type="button"
                  onClick={generate}
                  disabled={isGenerating || breakdownLimit.isLimitReached}
                >
                  {isGenerating ? "Regenerating…" : "Regenerate"}
                </button>
                <button className="breakdown-link" type="button" onClick={clearBreakdown}>
                  Clear
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="breakdown-hint">Let AI split this into smaller steps.</p>
              <div className="breakdown-controls">
                <div className="detail-segmented">
                  {DETAIL_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`detail-option ${detail === opt.value ? "is-active" : ""}`}
                      onClick={() => setDetail(opt.value)}
                      disabled={breakdownLimit.isLimitReached}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <button
                  className="add-btn breakdown-generate"
                  type="button"
                  onClick={generate}
                  disabled={isGenerating || breakdownLimit.isLimitReached}
                >
                  {isGenerating ? "Breaking it down…" : "Break it down"}
                </button>
              </div>
            </>
          )}
          {breakdownLimit.isLimitReached ? (
            <p className="breakdown-limit is-reached">
              Daily free limit reached ({breakdownLimit.limit}/{breakdownLimit.limit}). More coming
              soon with a paid plan.
            </p>
          ) : (
            <p className="breakdown-limit">
              {breakdownLimit.remaining} of {breakdownLimit.limit} free breakdowns left today
            </p>
          )}
          {genError && <p className="breakdown-error">{genError}</p>}
        </div>
      )}
    </div>
  );
};
