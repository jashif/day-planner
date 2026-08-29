interface ReminderPromptProps {
  onEnable: () => void;
  onDismiss: () => void;
}

/** Shown once, the first time a signed-in user hasn't been asked about reminders yet. */
export const ReminderPrompt = ({ onEnable, onDismiss }: ReminderPromptProps) => (
  <div className="reminder-prompt" role="status">
    <p className="reminder-prompt-text">Want a nudge if you haven&apos;t finished a task today?</p>
    <div className="reminder-prompt-actions">
      <button className="reminder-prompt-dismiss" type="button" onClick={onDismiss}>
        Not now
      </button>
      <button className="reminder-prompt-enable" type="button" onClick={onEnable}>
        Enable reminders
      </button>
    </div>
  </div>
);
