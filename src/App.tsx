import { useState } from "react";
import { Header } from "./components/Header";
import { Composer } from "./components/Composer";
import { Tabs } from "./components/Tabs";
import { TaskList } from "./components/TaskList";
import { AuthScreen } from "./components/AuthScreen";
import { useAuth } from "./firebase/AuthProvider";
import { useTasks } from "./hooks/useTasks";
import { useDailyBreakdownLimit } from "./hooks/useDailyBreakdownLimit";
import { todayISO } from "./utils/dates";
import type { View } from "./types/task";

const PlannerApp = ({ uid, email }: { uid: string; email: string | null }) => {
  const { tasks, error, createTask, toggleTask, removeTask, setSubtasks, toggleSubtask } =
    useTasks(uid);
  const breakdownLimit = useDailyBreakdownLimit(uid);
  const [view, setView] = useState<View>("today");
  const { logOut } = useAuth();
  const today = todayISO();
  const todaysTasks = tasks.filter((t) => t.date === today);

  return (
    <div className="page">
      <Header todaysTasks={todaysTasks} />
      {error && <p className="sync-error">Couldn&apos;t sync: {error}</p>}
      <Composer onAdd={createTask} />
      <Tabs activeView={view} onChange={setView} />
      <main className="list-wrap">
        <TaskList
          tasks={tasks}
          view={view}
          onToggle={toggleTask}
          onRemove={removeTask}
          onSetSubtasks={setSubtasks}
          onToggleSubtask={toggleSubtask}
          breakdownLimit={breakdownLimit}
        />
      </main>
      <footer className="foot">
        <span>Synced as {email}</span>
        <button className="sign-out-btn" type="button" onClick={logOut}>
          Sign out
        </button>
      </footer>
    </div>
  );
};

const App = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;
  if (!user) return <AuthScreen />;

  return <PlannerApp uid={user.uid} email={user.email} />;
};

export default App;
