import { useState } from "react";
import type { FormEvent } from "react";
import { todayISO } from "../utils/dates";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import { cleanVoiceTranscript } from "../utils/voiceTranscript";
import type { NewTaskInput, Priority, Recurrence } from "../types/task";

interface ComposerProps {
  onAdd: (input: NewTaskInput) => Promise<void>;
}

export const Composer = ({ onAdd }: ComposerProps) => {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(todayISO());
  const [time, setTime] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [recurrence, setRecurrence] = useState<Recurrence>("none");
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const speech = useSpeechRecognition();

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
        </div>
        {(speech.isListening || voiceError) && (
          <p className="voice-status">{voiceError ? voiceError : "Listening…"}</p>
        )}
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
          <button type="submit" className="add-btn">
            Add
          </button>
        </div>
      </form>
    </section>
  );
};
