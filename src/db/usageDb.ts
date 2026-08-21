import { doc, increment, onSnapshot, setDoc, type Unsubscribe } from "firebase/firestore";
import { db } from "../firebase/config";
import { todayISO } from "../utils/dates";

export const DAILY_BREAKDOWN_LIMIT = 5;

const usageDocRef = (uid: string) => doc(db, "users", uid, "usage", todayISO());

export const subscribeToBreakdownUsage = (
  uid: string,
  onChange: (count: number) => void,
): Unsubscribe => {
  return onSnapshot(usageDocRef(uid), (snap) => {
    onChange(snap.exists() ? (snap.data().breakdownCount ?? 0) : 0);
  });
};

export const recordBreakdownUsage = async (uid: string): Promise<void> => {
  await setDoc(usageDocRef(uid), { breakdownCount: increment(1) }, { merge: true });
};
