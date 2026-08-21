import { ProgressRing } from "./ProgressRing";
import { formatHeadingDate, todayISO } from "../utils/dates";
import type { Task } from "../types/task";

interface HeaderProps {
  todaysTasks: Task[];
}

export const Header = ({ todaysTasks }: HeaderProps) => {
  const total = todaysTasks.length;
  const done = todaysTasks.filter((t) => t.done).length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  const summary = total === 0 ? "Nothing on the books today" : `${done} of ${total} done today`;

  return (
    <header className="hero">
      <div className="hero-left">
        <p className="eyebrow">today is</p>
        <h1 className="date-heading">{formatHeadingDate(todayISO())}</h1>
        <p className="sub">{summary}</p>
      </div>
      <ProgressRing percent={percent} />
    </header>
  );
};
