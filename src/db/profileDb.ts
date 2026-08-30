import {
  doc,
  getDoc,
  increment,
  onSnapshot,
  runTransaction,
  setDoc,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { todayISO } from "../utils/dates";

export interface Profile {
  displayName: string;
  points: number;
}

export const AI_BOOST_COST = 50;
export const AI_BOOST_LIMIT = 7;

const profileRef = (uid: string) => doc(db, "profiles", uid);

/** Creates a public profile doc on first sign-in so friends have a name to show. */
export const ensureProfile = async (uid: string, fallbackName: string): Promise<void> => {
  const ref = profileRef(uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return;
  await setDoc(ref, { displayName: fallbackName, points: 0 });
};

export const setDisplayName = async (uid: string, displayName: string): Promise<void> => {
  await setDoc(profileRef(uid), { displayName: displayName.trim().slice(0, 40) }, { merge: true });
};

/** Every completed task — your own or one a friend assigned to you — earns a point. */
export const incrementPoints = async (uid: string): Promise<void> => {
  await setDoc(profileRef(uid), { points: increment(1) }, { merge: true });
};

export const redeemAiBoost = async (uid: string): Promise<void> => {
  await runTransaction(db, async (transaction) => {
    const profile = profileRef(uid);
    const profileSnap = await transaction.get(profile);
    const points = profileSnap.data()?.points ?? 0;
    if (points < AI_BOOST_COST) throw new Error("Not enough points to redeem an AI boost.");

    transaction.set(profile, { points: increment(-AI_BOOST_COST) }, { merge: true });
    transaction.set(
      doc(db, "users", uid),
      { aiLimitBoostDate: todayISO(), aiLimitBoostAmount: AI_BOOST_LIMIT - 5 },
      { merge: true },
    );
  });
};

export const subscribeToProfile = (
  uid: string,
  onChange: (profile: Profile) => void,
): Unsubscribe =>
  onSnapshot(profileRef(uid), (snap) => {
    const data = snap.data();
    onChange({ displayName: data?.displayName ?? "You", points: data?.points ?? 0 });
  });
