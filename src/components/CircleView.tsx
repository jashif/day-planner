import { todayISO } from "../utils/dates";
import { AI_BOOST_COST, AI_BOOST_LIMIT } from "../db/profileDb";
import type { AiLimit } from "../hooks/useDailyAiLimit";
import type { AssignedTask, Task } from "../types/task";
import type { Friend } from "../hooks/useFriends";

interface CircleViewProps {
  tasks: Task[];
  assignedTasks: AssignedTask[];
  friends: Friend[];
  myPoints: number;
  currentStreak: number;
  aiLimit: AiLimit;
  onRedeemAiBoost: () => Promise<void>;
}

const formatActivityTime = (time: number | null | undefined): string => {
  if (!time) return "recently";
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(time);
};

const circleLeague = (friendCount: number): { name: string; next: string } => {
  if (friendCount >= 10) return { name: "Legend Circle", next: "Top class unlocked" };
  if (friendCount >= 5) return { name: "Gold Circle", next: `${10 - friendCount} to Legend` };
  if (friendCount >= 2) return { name: "Crew Circle", next: `${5 - friendCount} to Gold` };
  return { name: "Starter Circle", next: `${2 - friendCount} to Crew` };
};

export const CircleView = ({
  tasks,
  assignedTasks,
  friends,
  myPoints,
  currentStreak,
  aiLimit,
  onRedeemAiBoost,
}: CircleViewProps) => {
  const today = todayISO();
  const allVisibleTasks = [...tasks, ...assignedTasks];
  const todaysTasks = allVisibleTasks.filter((task) => task.date === today);
  const completedToday = todaysTasks.filter((task) => task.done).length;
  const sharedOpen = assignedTasks.filter((task) => !task.done).length;
  const circlePoints = friends.reduce((total, friend) => total + friend.points, myPoints);
  const league = circleLeague(friends.length);
  const canRedeem = myPoints >= AI_BOOST_COST && aiLimit.limit < AI_BOOST_LIMIT;
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

      <div className="circle-rewards">
        <div>
          <p className="assigned-tasks-heading">League</p>
          <strong>{league.name}</strong>
          <span>
            {friends.length} friends - {league.next}
          </span>
        </div>
        <div>
          <p className="assigned-tasks-heading">AI boost</p>
          <strong>
            {aiLimit.remaining}/{aiLimit.limit}
          </strong>
          <span>
            {AI_BOOST_COST} pts unlocks {AI_BOOST_LIMIT} AI actions today
          </span>
          <button
            className="redeem-btn"
            type="button"
            onClick={onRedeemAiBoost}
            disabled={!canRedeem}
          >
            {aiLimit.limit >= AI_BOOST_LIMIT ? "Boost active" : `Redeem ${AI_BOOST_COST} pts`}
          </button>
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
