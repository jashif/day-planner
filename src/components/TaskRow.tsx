import { useState } from "react";
import { formatTime } from "../utils/dates";
import { breakdownTask } from "../ai/breakdownTask";
import type { AiLimit } from "../hooks/useDailyAiLimit";
import type { BreakdownDetail, Subtask, Task } from "../types/task";

interface TaskRowProps {
  task: Task;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onSetSubtasks: (id: string, subtasks: Subtask[]) => Promise<void>;
  onToggleSubtask: (id: string, subtaskId: string) => Promise<void>;
  aiLimit: AiLimit;
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
  aiLimit,
}: TaskRowProps) => {
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
            {task.time && <span className="task-time">{formatTime(task.time)}</span>}
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
        <div className="breakdown-panel">
          {subtasks.length > 0 ? (
            <>
              <ul className="subtask-list">
                {subtasks.map((subtask) => (
                  <li className="subtask-item" key={subtask.id}>
                    <button
                      className={`check subtask-check ${subtask.done ? "is-checked" : ""}`}
                      role="checkbox"
                      aria-checked={subtask.done}
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
                  disabled={isGenerating || aiLimit.isLimitReached}
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
                      disabled={aiLimit.isLimitReached}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <button
                  className="add-btn breakdown-generate"
                  type="button"
                  onClick={generate}
                  disabled={isGenerating || aiLimit.isLimitReached}
                >
                  {isGenerating ? "Breaking it down…" : "Break it down"}
                </button>
              </div>
            </>
          )}
          {aiLimit.isLimitReached ? (
            <p className="breakdown-limit is-reached">
              Daily free AI limit reached ({aiLimit.limit}/{aiLimit.limit}). More coming soon with a
              paid plan.
            </p>
          ) : (
            <p className="breakdown-limit">
              {aiLimit.remaining} of {aiLimit.limit} free AI actions left today
            </p>
          )}
          {genError && <p className="breakdown-error">{genError}</p>}
        </div>
      )}
    </div>
  );
};
