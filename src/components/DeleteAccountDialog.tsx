import { useState, type FormEvent } from "react";

interface DeleteAccountDialogProps {
  requiresPassword: boolean;
  isDeleting: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: (password?: string) => Promise<void>;
}

export const DeleteAccountDialog = ({
  requiresPassword,
  isDeleting,
  error,
  onClose,
  onConfirm,
}: DeleteAccountDialogProps) => {
  const [password, setPassword] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onConfirm(requiresPassword ? password : undefined);
  };

  return (
    <div className="account-dialog-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="account-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-account-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <p className="eyebrow">account settings</p>
        <h2 id="delete-account-title">Delete your account?</h2>
        <p>
          This permanently deletes your account, tasks, and usage history. This cannot be undone.
        </p>
        <form className="account-dialog-form" onSubmit={handleSubmit}>
          {requiresPassword && (
            <input
              className="field auth-field"
              type="password"
              placeholder="Enter your password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          )}
          {error && <p className="auth-error">{error}</p>}
          <div className="account-dialog-actions">
            <button className="dialog-cancel" type="button" onClick={onClose} disabled={isDeleting}>
              Cancel
            </button>
            <button className="dialog-delete" type="submit" disabled={isDeleting}>
              {isDeleting ? "Deleting…" : "Delete account"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};
