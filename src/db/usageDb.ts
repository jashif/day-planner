import { doc, increment, onSnapshot, setDoc, type Unsubscribe } from "firebase/firestore";
import { db } from "../firebase/config";
import { todayISO } from "../utils/dates";
import { AI_BOOST_LIMIT } from "./profileDb";

export const DAILY_AI_LIMIT = 5;

const usageDocRef = (uid: string) => doc(db, "users", uid, "usage", todayISO());

// Firestore field is named "breakdownCount" for historical reasons; it now
// counts all AI-powered actions (task breakdown, voice task capture) that
// share the same daily quota, enforced via firestore.rules.
export const subscribeToAiUsage = (uid: string, onChange: (count: number) => void): Unsubscribe => {
  return onSnapshot(usageDocRef(uid), (snap) => {
    onChange(snap.exists() ? (snap.data().breakdownCount ?? 0) : 0);
  });
};

export const subscribeToAiLimit = (uid: string, onChange: (limit: number) => void): Unsubscribe => {
  return onSnapshot(doc(db, "users", uid), (snap) => {
    const data = snap.data();
    const hasBoost = data?.aiLimitBoostDate === todayISO() && data?.aiLimitBoostAmount > 0;
    onChange(hasBoost ? AI_BOOST_LIMIT : DAILY_AI_LIMIT);
  });
};

export const recordAiUsage = async (uid: string): Promise<void> => {
  await setDoc(usageDocRef(uid), { breakdownCount: increment(1) }, { merge: true });
};
