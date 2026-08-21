import { useState } from "react";
import type { FormEvent } from "react";
import { todayISO } from "../utils/dates";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import { parseVoiceTask, toNewTaskInput } from "../ai/parseVoiceTask";
import type { AiLimit } from "../hooks/useDailyAiLimit";
import type { NewTaskInput, Priority } from "../types/task";

interface ComposerProps {
  onAdd: (input: NewTaskInput) => Promise<void>;
  aiLimit: AiLimit;
}

export const Composer = ({ onAdd, aiLimit }: ComposerProps) => {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(todayISO());
  const [time, setTime] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const speech = useSpeechRecognition();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;

    try {
      await onAdd({ title: trimmed, date, time, priority });
    } catch {
      return;
    }

    setTitle("");
    setTime("");
    setPriority("medium");
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

    setIsProcessing(true);
    try {
      const today = todayISO();
      const parsed = await parseVoiceTask(transcript, today);
      const input = toNewTaskInput(parsed, today);
      setTitle(input.title);
      setDate(input.date);
      setTime(input.time);
      setPriority(input.priority);
      await aiLimit.recordUsage();
    } catch {
      setVoiceError("Couldn't understand that. Please try again or type it in.");
    } finally {
      setIsProcessing(false);
    }
  };

  const micDisabled = isProcessing || aiLimit.isLimitReached;

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
              disabled={micDisabled}
              aria-pressed={speech.isListening}
              aria-label={speech.isListening ? "Stop voice input" : "Add task by voice"}
              title={
                aiLimit.isLimitReached
                  ? "Daily free AI limit reached"
                  : speech.isListening
                    ? "Stop voice input"
                    : "Add task by voice"
              }
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
        {(speech.isListening || isProcessing || voiceError) && (
          <p className="voice-status">
            {voiceError ? voiceError : speech.isListening ? "Listening…" : "Thinking…"}
          </p>
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
          <button type="submit" className="add-btn">
            Add
          </button>
        </div>
      </form>
    </section>
  );
};
