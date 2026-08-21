import { formatTime } from '../utils/dates'
import type { Task } from '../types/task'

interface TaskRowProps {
  task: Task
  onToggle: (id: string) => void
  onRemove: (id: string) => void
}

export const TaskRow = ({ task, onToggle, onRemove }: TaskRowProps) => {
  return (
    <div className={`task-row ${task.done ? 'is-done' : ''}`}>
      <button
        className={`check ${task.done ? 'is-checked' : ''}`}
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
        </div>
      </div>
      <button className="remove-btn" aria-label="Delete task" onClick={() => onRemove(task.id)}>
        ×
      </button>
    </div>
  )
}
