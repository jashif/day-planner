import type { View } from "../types/task";

interface TabsProps {
  activeView: View;
  onChange: (view: View) => void;
}

const TAB_OPTIONS: { view: View; label: string }[] = [
  { view: "today", label: "Today" },
  { view: "upcoming", label: "Upcoming" },
  { view: "all", label: "All" },
];

export const Tabs = ({ activeView, onChange }: TabsProps) => {
  return (
    <nav className="tabs">
      {TAB_OPTIONS.map(({ view, label }) => (
        <button
          key={view}
          className={`tab ${activeView === view ? "is-active" : ""}`}
          onClick={() => onChange(view)}
        >
          {label}
        </button>
      ))}
    </nav>
  );
};
