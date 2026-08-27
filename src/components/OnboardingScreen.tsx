import { useState } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { generateRoutine } from "../ai/generateRoutine";
import { addTasks } from "../db/tasksDb";
import { markOnboardingComplete } from "../db/userDb";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import { nextDateForWeekdayISO, todayISO } from "../utils/dates";
import type { AiLimit } from "../hooks/useDailyAiLimit";
import type { RoutineSuggestion } from "../types/routine";
import type { NewTaskInput } from "../types/task";

interface OnboardingScreenProps {
  uid: string;
  aiLimit: AiLimit;
  onDone: () => void;
}

const EXAMPLES = [
  "I wake up at 6:30 and go for a run",
  "Standup with my team every weekday at 9:15",
  "Gym on Mondays and Thursdays evening",
  "Call my parents every Sunday",
];

const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const ROUTINE_REQUEST_TIMEOUT_MS = 30_000;

const toTaskInput = (suggestion: RoutineSuggestion): NewTaskInput => ({
  title: suggestion.title,
  date:
    suggestion.recurrence === "weekly" && suggestion.weekday !== null
      ? nextDateForWeekdayISO(suggestion.weekday)
      : todayISO(),
  time: suggestion.time ?? "",
  priority: suggestion.priority,
  recurrence: suggestion.recurrence,
});

const describeSchedule = (suggestion: RoutineSuggestion): string => {
  if (suggestion.recurrence === "daily") return "Every day";
  if (suggestion.recurrence === "monthly") return "Every month";
  return suggestion.weekday !== null ? `Every ${WEEKDAY_NAMES[suggestion.weekday]}` : "Every week";
};

export const OnboardingScreen = ({ uid, aiLimit, onDone }: OnboardingScreenProps) => {
  const [description, setDescription] = useState("");
  const [suggestions, setSuggestions] = useState<RoutineSuggestion[] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const speech = useSpeechRecognition();

  const finish = async () => {
    try {
      await markOnboardingComplete(uid);
    } catch {
      // Onboarding is a nicety; never block entry to the app if the flag can't be written.
    }
    onDone();
  };

  const handleMicClick = async () => {
    if (speech.isListening) {
      speech.stop();
      return;
    }
    setError(null);
    const base = description.trim();
    await speech.listen({
      continuous: true,
      onUpdate: (text) => setDescription(base ? `${base} ${text}` : text),
    });
  };

  const handleGenerate = async () => {
    if (speech.isListening) speech.stop();
    const trimmed = description.trim();
    if (trimmed.length < 15) {
      setError("Tell me a bit more about your day first — a sentence or two is plenty.");
      return;
    }
    if (aiLimit.isLimitReached) return;

    setIsGenerating(true);
    setError(null);
    try {
      const result = await Promise.race([
        generateRoutine(trimmed),
        new Promise<never>((_, reject) => {
          window.setTimeout(
            () => reject(new Error("routine-request-timeout")),
            ROUTINE_REQUEST_TIMEOUT_MS,
          );
        }),
      ]);
      if (result.length === 0) {
        setError("I couldn't find anything repeating in there. Try mentioning when things happen.");
        return;
      }
      await aiLimit.recordUsage();
      setSuggestions(result);
    } catch (err) {
      console.error("generateRoutine failed:", err);
      setError(
        err instanceof Error && err.message === "routine-request-timeout"
          ? "The AI service is taking too long to respond. Check your connection and try again."
          : "Something went wrong building your routine. Please try again.",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const updateSuggestion = (id: string, changes: Partial<RoutineSuggestion>) => {
    setSuggestions(
      (current) =>
        current?.map((item) => (item.id === id ? { ...item, ...changes } : item)) ?? null,
    );
  };

  const handleSave = async () => {
    const chosen = suggestions?.filter((item) => item.selected) ?? [];
    if (chosen.length === 0) {
      await finish();
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await addTasks(uid, chosen.map(toTaskInput));
      await finish();
    } catch (err) {
      console.error("Saving routine failed:", err);
      setError("Couldn't save your routine. Please try again.");
      setIsSaving(false);
    }
  };

  const selectedCount = suggestions?.filter((item) => item.selected).length ?? 0;

  return (
    <div className="page onboarding-page" aria-busy={isGenerating || isSaving}>
      <div className="onboarding-top">
        <p className="eyebrow">getting set up</p>
        <ThemeToggle />
      </div>

      {suggestions === null ? (
        <>
          <h1 className="date-heading">Tell me about your day</h1>
          <p className="sub onboarding-sub">
            Describe what you normally do and when — speak it or type it. I&apos;ll turn the things
            that repeat into recurring tasks, so your planner starts out already filled in.
          </p>

          <div className="onboarding-input-wrap">
            <textarea
              className="onboarding-textarea"
              placeholder="I usually wake up around 6:30 and go for a run. Standup with my team every weekday at 9:15. Gym Mondays and Thursdays after work…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={7}
              autoFocus
              disabled={isGenerating}
            />
            {speech.isSupported && (
              <button
                type="button"
                className={`mic-btn onboarding-mic ${speech.isListening ? "is-listening" : ""}`}
                onClick={handleMicClick}
                aria-pressed={speech.isListening}
                aria-label={speech.isListening ? "Stop recording" : "Describe your day by voice"}
                disabled={isGenerating}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <rect
                    x="9"
                    y="2"
                    width="6"
                    height="12"
                    rx="3"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  />
                  <path
                    d="M5 11a7 7 0 0 0 14 0M12 18v3"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            )}
          </div>

          {speech.isListening && <p className="voice-status">Listening… tap the mic when done.</p>}
          {speech.error && !speech.isListening && (
            <p className="onboarding-error">{speech.error}</p>
          )}

          <div className="onboarding-examples">
            {EXAMPLES.map((example) => (
              <button
                key={example}
                type="button"
                className="example-chip"
                disabled={isGenerating}
                onClick={() =>
                  setDescription((current) => (current ? `${current.trim()}. ${example}` : example))
                }
              >
                {example}
              </button>
            ))}
          </div>

          {error && <p className="onboarding-error">{error}</p>}

          {isGenerating && (
            <div className="routine-progress" role="status" aria-live="polite">
              <div
                className="routine-progress-track"
                role="progressbar"
                aria-label="Building your routine"
              >
                <span className="routine-progress-bar" />
              </div>
              <span>Building your routine… contacting the AI service.</span>
            </div>
          )}

          <div className="onboarding-actions">
            <button
              className="onboarding-skip"
              type="button"
              onClick={finish}
              disabled={isGenerating}
            >
              Skip for now
            </button>
            <button
              className="add-btn"
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating || aiLimit.isLimitReached}
            >
              {isGenerating ? "Building your routine…" : "Build my routine"}
            </button>
          </div>

          {aiLimit.isLimitReached ? (
            <p className="breakdown-limit is-reached">
              Daily free AI limit reached ({aiLimit.limit}/{aiLimit.limit}). You can skip this and
              add tasks yourself.
            </p>
          ) : (
            <p className="breakdown-limit">
              Uses 1 of your {aiLimit.remaining} free AI actions today
            </p>
          )}
        </>
      ) : (
        <>
          <h1 className="date-heading">Here&apos;s your routine</h1>
          <p className="sub onboarding-sub">
            Untick anything that doesn&apos;t fit, and fix any times I got wrong. These become
            recurring tasks you can always change later.
          </p>

          <ul className="routine-list">
            {suggestions.map((suggestion) => (
              <li
                className={`routine-item ${suggestion.selected ? "" : "is-off"}`}
                key={suggestion.id}
              >
                <button
                  className={`check ${suggestion.selected ? "is-checked" : ""}`}
                  role="checkbox"
                  aria-checked={suggestion.selected}
                  aria-label={`Include ${suggestion.title}`}
                  onClick={() =>
                    updateSuggestion(suggestion.id, { selected: !suggestion.selected })
                  }
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
                <div className="routine-body">
                  <span className="routine-title">{suggestion.title}</span>
                  <span className="routine-schedule">{describeSchedule(suggestion)}</span>
                </div>
                <input
                  type="time"
                  className="field routine-time"
                  value={suggestion.time ?? ""}
                  aria-label={`Time for ${suggestion.title}`}
                  onChange={(e) =>
                    updateSuggestion(suggestion.id, { time: e.target.value || null })
                  }
                />
              </li>
            ))}
          </ul>

          {error && <p className="onboarding-error">{error}</p>}

          <div className="onboarding-actions">
            <button
              className="onboarding-skip"
              type="button"
              onClick={() => {
                setSuggestions(null);
                setError(null);
              }}
              disabled={isSaving}
            >
              Start over
            </button>
            <button className="add-btn" type="button" onClick={handleSave} disabled={isSaving}>
              {isSaving
                ? "Adding…"
                : selectedCount > 0
                  ? `Add ${selectedCount} ${selectedCount === 1 ? "task" : "tasks"}`
                  : "Continue without adding"}
            </button>
          </div>
        </>
      )}
    </div>
  );
};
