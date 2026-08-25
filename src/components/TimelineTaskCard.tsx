import { formatTime } from "../utils/dates";
import { useBreakdown } from "../hooks/useBreakdown";
import { BreakdownPanel } from "./BreakdownPanel";
import type { AiLimit } from "../hooks/useDailyAiLimit";
import type { Subtask, Task } from "../types/task";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";

interface TimelineTaskCardProps {
  task: Task;
  style?: CSSProperties;
  compact?: boolean;
  isDragging?: boolean;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onSetSubtasks: (id: string, subtasks: Subtask[]) => Promise<void>;
  onToggleSubtask: (id: string, subtaskId: string) => Promise<void>;
  aiLimit: AiLimit;
  onDragStart: (task: Task, clientY: number) => void;
}

/** A task card rendered either as a scheduled block on the timeline grid, or a static card in the backlog. */
export const TimelineTaskCard = ({
  task,
  style,
  compact,
  isDragging,
  onToggle,
  onRemove,
  onSetSubtasks,
  onToggleSubtask,
  aiLimit,
  onDragStart,
}: TimelineTaskCardProps) => {
  const breakdown = useBreakdown(task, onSetSubtasks, aiLimit);
  const { isOpen, setIsOpen, subtasks, doneCount } = breakdown;

  // On touch, only the dedicated handle starts a drag so swiping the rest of the card still scrolls the page.
  // On mouse/pen, the whole card (minus buttons) is grabbable since there's no scroll-gesture conflict.
  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button")) return;
    if (e.pointerType === "touch" && !(e.target as HTMLElement).closest(".timeline-drag-handle"))
      return;
    onDragStart(task, e.clientY);
  };

  const handleHandlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    onDragStart(task, e.clientY);
  };

  return (
    <div
      className={`timeline-card ${task.done ? "is-done" : ""} ${isDragging ? "is-dragging" : ""} ${compact ? "is-compact" : ""} ${isOpen ? "is-expanded" : ""}`}
      style={style}
      onPointerDown={handlePointerDown}
    >
      <div className="timeline-card-main">
        <div
          className="timeline-drag-handle"
          onPointerDown={handleHandlePointerDown}
          aria-hidden="true"
        >
          <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
            <circle cx="1.5" cy="1.5" r="1.5" fill="currentColor" />
            <circle cx="6.5" cy="1.5" r="1.5" fill="currentColor" />
            <circle cx="1.5" cy="7" r="1.5" fill="currentColor" />
            <circle cx="6.5" cy="7" r="1.5" fill="currentColor" />
            <circle cx="1.5" cy="12.5" r="1.5" fill="currentColor" />
            <circle cx="6.5" cy="12.5" r="1.5" fill="currentColor" />
          </svg>
        </div>
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
        <div className="timeline-card-body">
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
                {doneCount}/{subtasks.length}
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
