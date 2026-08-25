import type { BreakdownState } from "../hooks/useBreakdown";
import type { AiLimit } from "../hooks/useDailyAiLimit";
import type { Task } from "../types/task";

const DETAIL_OPTIONS: { value: "quick" | "normal" | "thorough"; label: string }[] = [
  { value: "quick", label: "Quick" },
  { value: "normal", label: "Normal" },
  { value: "thorough", label: "Thorough" },
];

interface BreakdownPanelProps {
  task: Task;
  breakdown: BreakdownState;
  onToggleSubtask: (id: string, subtaskId: string) => Promise<void>;
  aiLimit: AiLimit;
}

/** The expandable AI step-breakdown panel body, shared by the list row and timeline block. */
export const BreakdownPanel = ({
  task,
  breakdown,
  onToggleSubtask,
  aiLimit,
}: BreakdownPanelProps) => {
  const {
    detail,
    setDetail,
    isGenerating,
    genError,
    subtasks,
    generate,
    clearBreakdown,
    removeSubtask,
  } = breakdown;

  return (
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
  );
};
