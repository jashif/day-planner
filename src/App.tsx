import { useState } from "react";
import { Header } from "./components/Header";
import { Composer } from "./components/Composer";
import { Tabs } from "./components/Tabs";
import { TaskList } from "./components/TaskList";
import { AuthScreen } from "./components/AuthScreen";
import { TopBar } from "./components/TopBar";
import { useAuth } from "./firebase/AuthProvider";
import { useTasks } from "./hooks/useTasks";
import { useDailyAiLimit } from "./hooks/useDailyAiLimit";
import { todayISO } from "./utils/dates";
import type { View } from "./types/task";

const PlannerApp = ({ uid, email }: { uid: string; email: string | null }) => {
  const { tasks, error, createTask, toggleTask, removeTask, setSubtasks, toggleSubtask } =
    useTasks(uid);
  const aiLimit = useDailyAiLimit(uid);
  const [view, setView] = useState<View>("today");
  const { logOut } = useAuth();
  const today = todayISO();
  const todaysTasks = tasks.filter((t) => t.date === today);

  return (
    <div className="page">
      <TopBar email={email} onSignOut={logOut} />
      <Header todaysTasks={todaysTasks} />
      {error && <p className="sync-error">Couldn&apos;t sync: {error}</p>}
      <Composer onAdd={createTask} aiLimit={aiLimit} />
      <Tabs activeView={view} onChange={setView} />
      <main className="list-wrap">
        <TaskList
          tasks={tasks}
          view={view}
          onToggle={toggleTask}
          onRemove={removeTask}
          onSetSubtasks={setSubtasks}
          onToggleSubtask={toggleSubtask}
          aiLimit={aiLimit}
        />
      </main>
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
