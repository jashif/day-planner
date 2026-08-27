import { useState } from "react";
import { Header } from "./components/Header";
import { Composer } from "./components/Composer";
import { Tabs } from "./components/Tabs";
import { TaskList } from "./components/TaskList";
import { AuthScreen } from "./components/AuthScreen";
import { OnboardingScreen } from "./components/OnboardingScreen";
import { TopBar } from "./components/TopBar";
import { useAuth } from "./firebase/AuthProvider";
import { useTasks } from "./hooks/useTasks";
import { useDailyAiLimit } from "./hooks/useDailyAiLimit";
import { useOnboarding } from "./hooks/useOnboarding";
import { useSections } from "./hooks/useSections";
import { todayISO } from "./utils/dates";
import type { View } from "./types/task";

const PlannerApp = ({
  uid,
  email,
  providerId,
}: {
  uid: string;
  email: string | null;
  providerId: string;
}) => {
  const {
    tasks,
    error,
    createTask,
    toggleTask,
    removeTask,
    setSubtasks,
    toggleSubtask,
    rescheduleTask,
  } = useTasks(uid);
  const aiLimit = useDailyAiLimit(uid);
  const onboarding = useOnboarding(uid);
  const sectionState = useSections(uid);
  const [view, setView] = useState<View>("list");
  const [presetTime, setPresetTime] = useState<string | null>(null);
  const { logOut, deleteAccount } = useAuth();
  const today = todayISO();
  const todaysTasks = tasks.filter((t) => t.date === today);
  const sectionTasks = tasks.filter(
    (task) => (task.section ?? "Home") === sectionState.activeSection,
  );

  if (onboarding.status === "loading") return null;
  if (onboarding.status === "needed") {
    return <OnboardingScreen uid={uid} aiLimit={aiLimit} onDone={onboarding.complete} />;
  }

  return (
    <div className="page">
      <TopBar
        email={email}
        onSignOut={logOut}
        onDeleteAccount={deleteAccount}
        onSetUpRoutine={onboarding.restart}
        requiresPassword={providerId === "password"}
      />
      <Header todaysTasks={todaysTasks} />
      {error && <p className="sync-error">Couldn&apos;t sync: {error}</p>}
      <Composer
        onAdd={createTask}
        section={sectionState.activeSection}
        presetTime={presetTime}
        onConsumePreset={() => setPresetTime(null)}
      />
      <Tabs
        activeView={view}
        onChange={setView}
        sections={sectionState.sections}
        activeSection={sectionState.activeSection}
        onSectionChange={sectionState.setActiveSection}
        onAddSection={sectionState.addSection}
      />
      <main className="list-wrap">
        <TaskList
          tasks={sectionTasks}
          view={view}
          onToggle={toggleTask}
          onRemove={removeTask}
          onSetSubtasks={setSubtasks}
          onToggleSubtask={toggleSubtask}
          onReschedule={rescheduleTask}
          onQuickAddAt={setPresetTime}
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

  return (
    <PlannerApp
      uid={user.uid}
      email={user.email}
      providerId={user.providerData[0]?.providerId ?? ""}
    />
  );
};

export default App;
