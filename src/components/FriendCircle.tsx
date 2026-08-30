import { useState } from "react";
import { createInvite } from "../db/friendsDb";
import type { Friend } from "../hooks/useFriends";

interface FriendCircleProps {
  uid: string;
  friends: Friend[];
}

export const FriendCircle = ({ uid, friends }: FriendCircleProps) => {
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleInvite = async () => {
    setIsCreating(true);
    try {
      const code = await createInvite(uid);
      const link = `${window.location.origin}/invite/${code}`;
      setInviteLink(link);
      await navigator.clipboard.writeText(link).catch(() => {});
      setIsCopied(true);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="friend-circle">
      <p className="eyebrow">friend circle</p>
      <h2 id="friends-title">Friends</h2>
      <p>Invite a friend so you can share and split tasks together.</p>

      <button
        className="add-btn friends-invite-btn"
        type="button"
        onClick={handleInvite}
        disabled={isCreating}
      >
        {isCreating ? "Creating link..." : "Invite a friend"}
      </button>
      {inviteLink && (
        <p className="friends-invite-link">
          {isCopied ? "Link copied - send it to your friend:" : "Share this link:"} {inviteLink}
        </p>
      )}

      <ul className="friends-list">
        {friends.length === 0 && <li className="friends-empty">No friends yet.</li>}
        {friends.map((friend) => (
          <li key={friend.uid} className="friends-list-item">
            <span>{friend.displayName}</span>
            <span className="friends-points">{friend.points} pts</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
