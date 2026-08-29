import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";
import { subscribeToFriendUids } from "../db/friendsDb";

export interface Friend {
  uid: string;
  displayName: string;
  points: number;
}

/** Live friend list: names/points come from the public /profiles doc, not /users. */
export const useFriends = (uid: string): Friend[] => {
  const [friendUids, setFriendUids] = useState<string[]>([]);
  const [profiles, setProfiles] = useState<Record<string, { displayName: string; points: number }>>(
    {},
  );

  useEffect(() => subscribeToFriendUids(uid, setFriendUids), [uid]);

  useEffect(() => {
    const unsubscribes = friendUids.map((friendUid) =>
      onSnapshot(doc(db, "profiles", friendUid), (snap) => {
        const data = snap.data();
        setProfiles((current) => ({
          ...current,
          [friendUid]: { displayName: data?.displayName ?? "Friend", points: data?.points ?? 0 },
        }));
      }),
    );
    return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
  }, [friendUids]);

  return friendUids.map((friendUid) => ({
    uid: friendUid,
    ...(profiles[friendUid] ?? { displayName: "Friend", points: 0 }),
  }));
};
