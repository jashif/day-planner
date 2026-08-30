import { FriendCircle } from "./FriendCircle";
import type { Friend } from "../hooks/useFriends";

interface FriendsPanelProps {
  uid: string;
  friends: Friend[];
  onClose: () => void;
}

export const FriendsPanel = ({ uid, friends, onClose }: FriendsPanelProps) => {
  return (
    <div className="account-dialog-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="account-dialog friends-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="friends-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <FriendCircle uid={uid} friends={friends} />

        <div className="account-dialog-actions">
          <button className="dialog-cancel" type="button" onClick={onClose}>
            Close
          </button>
        </div>
      </section>
    </div>
  );
};
