import { useState } from "react";
import type { FormEvent } from "react";
import { todayISO } from "../utils/dates";
import type { NewTaskInput, Priority } from "../types/task";

interface ComposerProps {
  onAdd: (input: NewTaskInput) => Promise<void>;
}

export const Composer = ({ onAdd }: ComposerProps) => {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(todayISO());
  const [time, setTime] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");

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

  return (
    <section className="composer">
      <form className="task-form" onSubmit={handleSubmit}>
        <input
          type="text"
          className="title-input"
          placeholder="Add something to do…"
          autoComplete="off"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
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
