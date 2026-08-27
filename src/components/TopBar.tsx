import { useState } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { DeleteAccountDialog } from "./DeleteAccountDialog";

interface TopBarProps {
  email: string | null;
  onSignOut: () => void;
  requiresPassword: boolean;
  onDeleteAccount: (password?: string) => Promise<void>;
  onSetUpRoutine: () => void;
}

export const TopBar = ({
  email,
  onSignOut,
  requiresPassword,
  onDeleteAccount,
  onSetUpRoutine,
}: TopBarProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
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
        <button className="routine-btn" type="button" onClick={onSetUpRoutine}>
          Set up routine
        </button>
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
        <DeleteAccountDialog
          requiresPassword={requiresPassword}
          isDeleting={isDeleting}
          error={deleteError}
          onClose={() => {
            if (!isDeleting) setIsDeleteOpen(false);
          }}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
};
