import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { Header } from "./components/Header";
import { Composer } from "./components/Composer";
import { Tabs } from "./components/Tabs";
import { TaskList } from "./components/TaskList";
import { AssignedTaskList } from "./components/AssignedTaskList";
import { AuthScreen } from "./components/AuthScreen";
import { LoadingScreen } from "./components/LoadingScreen";
import { ReminderPrompt } from "./components/ReminderPrompt";
import { TopBar } from "./components/TopBar";
import { useAuth } from "./firebase/AuthProvider";
import { useTasks } from "./hooks/useTasks";
import { useDailyAiLimit } from "./hooks/useDailyAiLimit";
import { useOnboarding } from "./hooks/useOnboarding";
import { useSections } from "./hooks/useSections";
import { useStreak } from "./hooks/useStreak";
import { useReminderNotifications } from "./hooks/useReminderNotifications";
import { useProfile } from "./hooks/useProfile";
import { useFriends } from "./hooks/useFriends";
import { useAssignedTasks } from "./hooks/useAssignedTasks";
import { acceptInvite } from "./db/friendsDb";
import { todayISO } from "./utils/dates";
import type { View } from "./types/task";

// Pulls in the AI/speech routine flow only when a user actually needs onboarding.
const OnboardingScreen = lazy(() =>
  import("./components/OnboardingScreen").then((m) => ({ default: m.OnboardingScreen })),
);

const PENDING_INVITE_KEY = "day-planner:pending-invite";

const PlannerApp = ({
  uid,
  email,
  providerId,
}: {
  uid: string;
  email: string | null;
  providerId: string;
}) => {
  const aiLimit = useDailyAiLimit(uid);
  const onboarding = useOnboarding(uid);
  const sectionState = useSections(uid);
  const streak = useStreak(uid);
  const profile = useProfile(uid, email?.split("@")[0] ?? "You");
  const friends = useFriends(uid);
  const assigned = useAssignedTasks(uid, profile.displayName, profile.recordPoint);
  const {
    tasks,
    error,
    createTask,
    toggleTask,
    removeTask,
    setSubtasks,
    toggleSubtask,
    rescheduleTask,
  } = useTasks(uid, profile.recordPoint);
  const [view, setView] = useState<View>("list");
  const [presetTime, setPresetTime] = useState<string | null>(null);
  const { logOut, deleteAccount } = useAuth();
  const today = todayISO();
  const todaysTasks = tasks.filter((t) => t.date === today);
  const hasCompletedToday = todaysTasks.some((t) => t.done);
  const reminder = useReminderNotifications(uid, hasCompletedToday);
  const sectionTasks = tasks.filter(
    (task) => (task.section ?? "Home") === sectionState.activeSection,
  );

  const streakRecordedRef = useRef(false);
  useEffect(() => {
    if (hasCompletedToday && !streakRecordedRef.current) {
      streakRecordedRef.current = true;
      streak.recordActivity();
    }
  }, [hasCompletedToday, streak]);

  const inviteAcceptedRef = useRef(false);
  useEffect(() => {
    if (inviteAcceptedRef.current) return;
    const code = sessionStorage.getItem(PENDING_INVITE_KEY);
    if (!code) return;
    inviteAcceptedRef.current = true;
    sessionStorage.removeItem(PENDING_INVITE_KEY);
    acceptInvite(code, uid);
  }, [uid]);

  if (onboarding.status === "loading") return <LoadingScreen />;
  if (onboarding.status === "needed") {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <OnboardingScreen uid={uid} aiLimit={aiLimit} onDone={onboarding.complete} />
      </Suspense>
    );
  }

  return (
    <div className="page">
      <TopBar
        email={email}
        uid={uid}
        friends={friends}
        onSignOut={logOut}
        onDeleteAccount={deleteAccount}
        onSetUpRoutine={onboarding.restart}
        requiresPassword={providerId === "password"}
        reminderEnabled={reminder.isEnabled}
        onToggleReminder={reminder.isEnabled ? reminder.disable : reminder.enable}
      />
      <Header todaysTasks={todaysTasks} currentStreak={streak.currentStreak} />
      {error && <p className="sync-error">Couldn&apos;t sync: {error}</p>}
      {reminder.shouldPrompt && (
        <ReminderPrompt onEnable={reminder.enable} onDismiss={reminder.dismissPrompt} />
      )}
      <AssignedTaskList tasks={assigned.tasks} onComplete={assigned.complete} />
      <Composer
        onAdd={createTask}
        section={sectionState.activeSection}
        friends={friends}
        myDisplayName={profile.displayName}
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

  useEffect(() => {
    const match = window.location.pathname.match(/^\/invite\/([\w-]+)/);
    if (!match) return;
    sessionStorage.setItem(PENDING_INVITE_KEY, match[1]);
    window.history.replaceState(null, "", "/");
  }, []);

  if (isLoading) return <LoadingScreen />;
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
