import { EmptyState } from "./EmptyState";
import { TaskRow } from "./TaskRow";
import { formatGroupLabel, todayISO } from "../utils/dates";
import type { BreakdownLimit } from "../hooks/useDailyBreakdownLimit";
import type { Subtask, Task, View } from "../types/task";

interface TaskListProps {
  tasks: Task[];
  view: View;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onSetSubtasks: (id: string, subtasks: Subtask[]) => Promise<void>;
  onToggleSubtask: (id: string, subtaskId: string) => Promise<void>;
  breakdownLimit: BreakdownLimit;
}

const filterTasksForView = (tasks: Task[], view: View): Task[] => {
  const today = todayISO();
  if (view === "today") return tasks.filter((t) => t.date === today);
  if (view === "upcoming") return tasks.filter((t) => t.date > today);
  return tasks;
};

const sortTasks = (tasks: Task[]): Task[] =>
  [...tasks].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    if (!!a.time !== !!b.time) return a.time ? -1 : 1;
    if (a.time && b.time && a.time !== b.time) return a.time < b.time ? -1 : 1;
    return a.createdAt - b.createdAt;
  });

const groupByDate = (tasks: Task[]): [string, Task[]][] => {
  const groups = new Map<string, Task[]>();
  tasks.forEach((task) => {
    const key = task.date;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(task);
  });
  return Array.from(groups.entries());
};

export const TaskList = ({
  tasks,
  view,
  onToggle,
  onRemove,
  onSetSubtasks,
  onToggleSubtask,
  breakdownLimit,
}: TaskListProps) => {
  const filtered = sortTasks(filterTasksForView(tasks, view));

  if (filtered.length === 0) {
    return <EmptyState view={view} />;
  }

  if (view === "today") {
    return (
      <>
        {filtered.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            onToggle={onToggle}
            onRemove={onRemove}
            onSetSubtasks={onSetSubtasks}
            onToggleSubtask={onToggleSubtask}
            breakdownLimit={breakdownLimit}
          />
        ))}
      </>
    );
  }

  return (
    <>
      {groupByDate(filtered).map(([date, group]) => (
        <div className="day-group" key={date}>
          <p className="day-group-label">{formatGroupLabel(date)}</p>
          {group.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onToggle={onToggle}
              onRemove={onRemove}
              onSetSubtasks={onSetSubtasks}
              onToggleSubtask={onToggleSubtask}
              breakdownLimit={breakdownLimit}
            />
          ))}
        </div>
      ))}
    </>
  );
};
