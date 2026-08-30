import { todayISO } from "../utils/dates";
import type { AssignedTask, Task } from "../types/task";
import type { Friend } from "../hooks/useFriends";

interface CircleViewProps {
  tasks: Task[];
  assignedTasks: AssignedTask[];
  friends: Friend[];
  myPoints: number;
  currentStreak: number;
}

const formatActivityTime = (time: number | null | undefined): string => {
  if (!time) return "recently";
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(time);
};

export const CircleView = ({
  tasks,
  assignedTasks,
  friends,
  myPoints,
  currentStreak,
}: CircleViewProps) => {
  const today = todayISO();
  const allVisibleTasks = [...tasks, ...assignedTasks];
  const todaysTasks = allVisibleTasks.filter((task) => task.date === today);
  const completedToday = todaysTasks.filter((task) => task.done).length;
  const sharedOpen = assignedTasks.filter((task) => !task.done).length;
  const circlePoints = friends.reduce((total, friend) => total + friend.points, myPoints);
  const activity = allVisibleTasks
    .filter((task) => task.done)
    .sort((a, b) => (b.completedAt ?? b.createdAt) - (a.completedAt ?? a.createdAt))
    .slice(0, 8);

  return (
    <section className="circle-view">
      <div className="circle-summary">
        <div>
          <p className="eyebrow">circle recap</p>
          <h2>Today together</h2>
        </div>
        <div className="circle-stats">
          <div>
            <strong>{completedToday}</strong>
            <span>done today</span>
          </div>
          <div>
            <strong>{sharedOpen}</strong>
            <span>shared open</span>
          </div>
          <div>
            <strong>{circlePoints}</strong>
            <span>circle pts</span>
          </div>
          <div>
            <strong>{currentStreak}</strong>
            <span>streak</span>
          </div>
        </div>
      </div>

      <div className="activity-feed">
        <p className="assigned-tasks-heading">Activity</p>
        {activity.length === 0 ? (
          <p className="assigned-tasks-empty">Complete a task to start the feed.</p>
        ) : (
          <ul>
            {activity.map((task) => (
              <li key={`${"ownerUid" in task ? task.ownerUid : "me"}-${task.id}`}>
                <span className="activity-dot" />
                <div>
                  <strong>{task.completedByName ?? "Someone"}</strong> completed {task.title}
                  <small>{formatActivityTime(task.completedAt)}</small>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};
