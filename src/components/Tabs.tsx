import { useEffect, useRef, useState } from "react";
import type { View } from "../types/task";

interface TabsProps {
  activeView: View;
  onChange: (view: View) => void;
  sections: string[];
  activeSection: string;
  activeSectionTaskCount: number;
  onSectionChange: (section: string) => void;
  onAddSection: (name: string) => Promise<void>;
}

const OPTIONS: { view: View; label: string }[] = [
  { view: "list", label: "List" },
  { view: "timeline", label: "Timeline" },
];

/** Small two-way switch between the default flat list and the optional single-day timeline. */
export const Tabs = ({
  activeView,
  onChange,
  sections,
  activeSection,
  activeSectionTaskCount,
  onSectionChange,
  onAddSection,
}: TabsProps) => {
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState("");
  const sectionInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAddingSection) sectionInputRef.current?.focus();
  }, [isAddingSection]);

  const cancelAddSection = () => {
    setNewSectionName("");
    setIsAddingSection(false);
  };

  const addSection = async () => {
    if (!newSectionName.trim()) return;
    const name = newSectionName;
    cancelAddSection();
    await onAddSection(name);
  };

  return (
    <div className="tabs-panel">
      <div className="section-context">
        <span>Section</span>
        <strong>{activeSection}</strong>
        <span>{activeSectionTaskCount} open</span>
      </div>
      <div className="section-tabs" role="tablist" aria-label="Task sections">
        {sections.map((section) => (
          <button
            key={section}
            role="tab"
            aria-selected={activeSection === section}
            className={`section-tab ${activeSection === section ? "is-active" : ""}`}
            onClick={() => onSectionChange(section)}
          >
            {section}
          </button>
        ))}
        {isAddingSection ? (
          <form
            className="add-section-form"
            onSubmit={(event) => {
              event.preventDefault();
              void addSection();
            }}
          >
            <input
              ref={sectionInputRef}
              className="add-section-input"
              value={newSectionName}
              onChange={(event) => setNewSectionName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") cancelAddSection();
              }}
              placeholder="Section name"
              aria-label="New section name"
              maxLength={30}
            />
            <button className="add-section-confirm" type="submit" disabled={!newSectionName.trim()}>
              Add
            </button>
            <button className="add-section-cancel" type="button" onClick={cancelAddSection}>
              Cancel
            </button>
          </form>
        ) : (
          <button
            className="add-section-btn"
            type="button"
            onClick={() => setIsAddingSection(true)}
            aria-label="Add section"
          >
            +
          </button>
        )}
      </div>
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
    </div>
  );
};
