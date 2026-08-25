import type { View } from "../types/task";

interface TabsProps {
  activeView: View;
  onChange: (view: View) => void;
}

const OPTIONS: { view: View; label: string }[] = [
  { view: "list", label: "List" },
  { view: "timeline", label: "Timeline" },
];

/** Small two-way switch between the default flat list and the optional single-day timeline. */
export const Tabs = ({ activeView, onChange }: TabsProps) => {
  return (
    <div className="view-toggle" role="tablist" aria-label="View">
      {OPTIONS.map(({ view, label }) => (
        <button
          key={view}
          role="tab"
          aria-selected={activeView === view}
          className={`view-toggle-option ${activeView === view ? "is-active" : ""}`}
          onClick={() => onChange(view)}
        >
          {label}
        </button>
      ))}
    </div>
  );
};
