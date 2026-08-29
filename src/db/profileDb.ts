import { doc, onSnapshot, setDoc, increment, type Unsubscribe } from "firebase/firestore";
import { db } from "../firebase/config";

export interface Profile {
  displayName: string;
  points: number;
}

const profileRef = (uid: string) => doc(db, "profiles", uid);

/** Creates a public profile doc on first sign-in so friends have a name to show. */
export const ensureProfile = async (uid: string, fallbackName: string): Promise<void> => {
  await setDoc(profileRef(uid), { displayName: fallbackName, points: 0 }, { merge: true });
};

export const setDisplayName = async (uid: string, displayName: string): Promise<void> => {
  await setDoc(profileRef(uid), { displayName: displayName.trim().slice(0, 40) }, { merge: true });
};

/** Every completed task — your own or one a friend assigned to you — earns a point. */
export const incrementPoints = async (uid: string): Promise<void> => {
  await setDoc(profileRef(uid), { points: increment(1) }, { merge: true });
};

export const subscribeToProfile = (
  uid: string,
  onChange: (profile: Profile) => void,
): Unsubscribe =>
  onSnapshot(profileRef(uid), (snap) => {
    const data = snap.data();
    onChange({ displayName: data?.displayName ?? "You", points: data?.points ?? 0 });
  });
