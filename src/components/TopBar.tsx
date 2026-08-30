import { useState, lazy, Suspense } from "react";
import { ThemeToggle } from "./ThemeToggle";
import type { Friend } from "../hooks/useFriends";

const DeleteAccountDialog = lazy(() =>
  import("./DeleteAccountDialog").then((m) => ({ default: m.DeleteAccountDialog })),
);
const FriendsPanel = lazy(() =>
  import("./FriendsPanel").then((m) => ({ default: m.FriendsPanel })),
);

interface TopBarProps {
  email: string | null;
  uid: string;
  friends: Friend[];
  onSignOut: () => void;
  requiresPassword: boolean;
  onDeleteAccount: (password?: string) => Promise<void>;
  onSetUpRoutine: () => void;
  reminderEnabled: boolean;
  onToggleReminder: () => void;
}

export const TopBar = ({
  email,
  uid,
  friends,
  onSignOut,
  requiresPassword,
  onDeleteAccount,
  onSetUpRoutine,
  reminderEnabled,
  onToggleReminder,
}: TopBarProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isFriendsOpen, setIsFriendsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDelete = async (password?: string) => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await onDeleteAccount(password);
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Could not delete your account.");
      setIsDeleting(false);
    }
  };

  return (
    <div className="topbar">
      <span className="topbar-email">{email}</span>
      <div className="topbar-actions">
        <ThemeToggle />
        <div className="account-menu">
          <button
            className="sign-out-btn"
            type="button"
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            Account
          </button>
          {isMenuOpen && (
            <div className="account-menu-popover">
              <button
                className="account-menu-item"
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  onSetUpRoutine();
                }}
              >
                Set up my routine
              </button>
              <button className="account-menu-item" type="button" onClick={onSignOut}>
                Sign out
              </button>
              <button
                className="account-menu-item"
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsFriendsOpen(true);
                }}
              >
                Friends
              </button>
              <button
                className="account-menu-item"
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  onToggleReminder();
                }}
              >
                {reminderEnabled ? "Turn off reminders" : "Remind me to finish tasks"}
              </button>
              <button
                className="account-menu-item is-danger"
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  setDeleteError(null);
                  setIsDeleteOpen(true);
                }}
              >
                Delete account
              </button>
            </div>
          )}
        </div>
      </div>
      {isDeleteOpen && (
        <Suspense fallback={null}>
          <DeleteAccountDialog
            requiresPassword={requiresPassword}
            isDeleting={isDeleting}
            error={deleteError}
            onClose={() => {
              if (!isDeleting) setIsDeleteOpen(false);
            }}
            onConfirm={handleDelete}
          />
        </Suspense>
      )}
      {isFriendsOpen && (
        <Suspense fallback={null}>
          <FriendsPanel uid={uid} friends={friends} onClose={() => setIsFriendsOpen(false)} />
        </Suspense>
      )}
    </div>
  );
};
