import type { View } from "../types/task";

interface EmptyStateProps {
  view: View;
}

const COPY: Record<View, string> = {
  today: "Nothing planned for today — add your first task above.",
  upcoming: "No upcoming tasks yet.",
  all: "Your list is empty. Add something to get started.",
};

export const EmptyState = ({ view }: EmptyStateProps) => {
  return (
    <div className="empty-state">
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="15" stroke="currentColor" strokeWidth="1.4" />
        <path d="M14 20h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
      <p>{COPY[view]}</p>
    </div>
  );
};
