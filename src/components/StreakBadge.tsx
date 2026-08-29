interface StreakBadgeProps {
  currentStreak: number;
}

export const StreakBadge = ({ currentStreak }: StreakBadgeProps) => {
  if (currentStreak <= 0) return null;

  return (
    <div className="streak-badge" title={`${currentStreak}-day streak`}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 2c1 3-3 4-3 8a4 4 0 0 0 8 0c0-1-.5-2-1-2.5.5 2-1 3-1 3 .5-3-2-4-2-6.5S12 2 12 2Z"
          fill="currentColor"
        />
      </svg>
      <span>{currentStreak}</span>
    </div>
  );
};
