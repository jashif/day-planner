import { ThemeToggle } from "./ThemeToggle";

interface TopBarProps {
  email: string | null;
  onSignOut: () => void;
}

export const TopBar = ({ email, onSignOut }: TopBarProps) => {
  return (
    <div className="topbar">
      <span className="topbar-email">{email}</span>
      <div className="topbar-actions">
        <ThemeToggle />
        <button className="sign-out-btn" type="button" onClick={onSignOut}>
          Sign out
        </button>
      </div>
    </div>
  );
};
