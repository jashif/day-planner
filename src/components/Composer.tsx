import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { todayISO } from "../utils/dates";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import { cleanVoiceTranscript } from "../utils/voiceTranscript";
import type { NewTaskInput, Priority, Recurrence } from "../types/task";

interface ComposerProps {
  onAdd: (input: NewTaskInput) => Promise<void>;
  presetTime?: string | null;
  onConsumePreset?: () => void;
}

export const Composer = ({ onAdd, presetTime, onConsumePreset }: ComposerProps) => {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(todayISO());
  const [time, setTime] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [recurrence, setRecurrence] = useState<Recurrence>("none");
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [showMore, setShowMore] = useState(false);
  const speech = useSpeechRecognition();
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!presetTime) return;
    setDate(todayISO());
    setTime(presetTime);
    setShowMore(true);
    titleInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    titleInputRef.current?.focus();
    onConsumePreset?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetTime]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;

    try {
      await onAdd({ title: trimmed, date, time, priority, recurrence });
    } catch {
      return;
    }

    setTitle("");
    setTime("");
    setPriority("medium");
    setRecurrence("none");
    setDate(todayISO());
    titleInputRef.current?.focus();
  };

  const handleMicClick = async () => {
    if (speech.isListening) {
      speech.stop();
      return;
    }
    setVoiceError(null);
    const transcript = await speech.listen();
    if (!transcript) {
      if (speech.error) setVoiceError(speech.error);
      return;
    }
    setTitle(cleanVoiceTranscript(transcript));
  };

  const hasDetails = Boolean(time) || priority !== "medium" || recurrence !== "none";

  return (
    <section className="composer">
      <form className="task-form" onSubmit={handleSubmit}>
        <div className="title-row">
          <input
            type="text"
            className="title-input"
            placeholder="Add something to do…"
            autoComplete="off"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            ref={titleInputRef}
            required
          />
          {speech.isSupported && (
            <button
              type="button"
              className={`mic-btn ${speech.isListening ? "is-listening" : ""}`}
              onClick={handleMicClick}
              aria-pressed={speech.isListening}
              aria-label={speech.isListening ? "Stop voice input" : "Add task by voice"}
              title={speech.isListening ? "Stop voice input" : "Add task by voice"}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
          <button
            type="button"
            className={`more-toggle ${showMore ? "is-active" : ""} ${hasDetails ? "has-details" : ""}`}
            onClick={() => setShowMore(!showMore)}
            aria-expanded={showMore}
            aria-label={showMore ? "Hide details" : "Add date, time, priority, or repeat"}
            title={showMore ? "Hide details" : "Add date, time, priority, or repeat"}
          >
            <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="M10 3v6M10 11v6M4 10h1M15 10h1"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
              <circle cx="10" cy="10" r="7.2" stroke="currentColor" strokeWidth="1.4" />
            </svg>
          </button>
          <button type="submit" className="add-btn">
            Add
          </button>
        </div>
        {(speech.isListening || voiceError) && (
          <p className="voice-status">{voiceError ? voiceError : "Listening…"}</p>
        )}
        {showMore && (
          <div className="task-form-row">
            <input
              type="date"
              className="field date-field"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <input
              type="time"
              className="field time-field"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
            <select
              className="field priority-field"
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <select
              className="field recurrence-field"
              value={recurrence}
              onChange={(e) => setRecurrence(e.target.value as Recurrence)}
              aria-label="Repeat task"
            >
              <option value="none">Does not repeat</option>
              <option value="daily">Every day</option>
              <option value="weekly">Every week</option>
              <option value="monthly">Every month</option>
            </select>
          </div>
        )}
      </form>
    </section>
  );
};
