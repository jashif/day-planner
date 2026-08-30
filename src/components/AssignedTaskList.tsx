import type { AssignedTask } from "../types/task";

interface AssignedTaskListProps {
  tasks: AssignedTask[];
  onComplete: (task: AssignedTask) => void;
}

export const AssignedTaskList = ({ tasks, onComplete }: AssignedTaskListProps) => {
  if (tasks.length === 0) {
    return (
      <section className="assigned-tasks is-empty">
        <p className="assigned-tasks-heading">Shared with you</p>
        <p className="assigned-tasks-empty">Tasks friends assign to you will show up here.</p>
      </section>
    );
  }

  return (
    <section className="assigned-tasks">
      <p className="assigned-tasks-heading">Shared with you</p>
      <ul className="assigned-tasks-list">
        {tasks.map((task) => (
          <li
            key={`${task.ownerUid}-${task.id}`}
            className={`task-row ${task.done ? "is-done" : ""}`}
          >
            <div className="task-row-main">
              <button
                className={`check ${task.done ? "is-checked" : ""}`}
                role="checkbox"
                aria-checked={task.done}
                aria-label="Mark done"
                onClick={() => onComplete(task)}
                disabled={task.done}
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
                  <span className="shared-badge">from {task.sharedByName ?? "a friend"}</span>
                  {task.done && task.completedByName && (
                    <span className="shared-badge is-done">done by {task.completedByName}</span>
                  )}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
};
