import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { toISODate, todayISO } from "../utils/dates";

export const DEFAULT_SECTIONS = ["Home", "Work", "Daily"];

export interface Streak {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
}

export const getSections = async (uid: string): Promise<string[]> => {
  const snap = await getDoc(doc(db, "users", uid));
  const sections = snap.data()?.sections;
  return Array.isArray(sections) && sections.length > 0
    ? sections.filter((section): section is string => typeof section === "string")
    : DEFAULT_SECTIONS;
};

export const saveSections = async (uid: string, sections: string[]): Promise<void> => {
  await setDoc(doc(db, "users", uid), { sections }, { merge: true });
};

export const getStreak = async (uid: string): Promise<Streak> => {
  const snap = await getDoc(doc(db, "users", uid));
  const data = snap.data();
  return {
    currentStreak: data?.currentStreak ?? 0,
    longestStreak: data?.longestStreak ?? 0,
    lastActiveDate: data?.lastActiveDate ?? null,
  };
};

/** Called once a day, the first time the user completes a task; keeps the streak in sync. */
export const recordStreakActivity = async (uid: string): Promise<Streak> => {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  const data = snap.data();
  const today = todayISO();
  const lastActiveDate: string | null = data?.lastActiveDate ?? null;

  if (lastActiveDate === today) {
    return {
      currentStreak: data?.currentStreak ?? 1,
      longestStreak: data?.longestStreak ?? 1,
      lastActiveDate: today,
    };
  }

  const yesterday = toISODate(new Date(Date.now() - 86_400_000));
  const currentStreak = lastActiveDate === yesterday ? (data?.currentStreak ?? 0) + 1 : 1;
  const longestStreak = Math.max(currentStreak, data?.longestStreak ?? 0);
  const next = { currentStreak, longestStreak, lastActiveDate: today };
  await setDoc(ref, next, { merge: true });
  return next;
};

/** Local, foreground-only reminder opt-in. Reserved `partnerUid` slot is for the upcoming pairing feature. */
export const getReminderEnabled = async (uid: string): Promise<boolean> => {
  const snap = await getDoc(doc(db, "users", uid));
  return Boolean(snap.data()?.reminderEnabled);
};

export const setReminderEnabled = async (uid: string, enabled: boolean): Promise<void> => {
  await setDoc(doc(db, "users", uid), { reminderEnabled: enabled }, { merge: true });
};

/** True once we've asked (regardless of answer) so the first-login prompt only shows once. */
export const getReminderPromptSeen = async (uid: string): Promise<boolean> => {
  const snap = await getDoc(doc(db, "users", uid));
  return Boolean(snap.data()?.reminderPromptSeen);
};

export const setReminderPromptSeen = async (uid: string): Promise<void> => {
  await setDoc(doc(db, "users", uid), { reminderPromptSeen: true }, { merge: true });
};

/** True once the user has finished (or skipped) the routine-setup flow. */
export const hasCompletedOnboarding = async (uid: string): Promise<boolean> => {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() && Boolean(snap.data().onboardedAt);
};

export const markOnboardingComplete = async (uid: string): Promise<void> => {
  await setDoc(doc(db, "users", uid), { onboardedAt: serverTimestamp() }, { merge: true });
};

const deleteCollection = async (path: string): Promise<void> => {
  const snapshot = await getDocs(collection(db, path));
  const chunks: (typeof snapshot.docs)[] = [];
  for (let index = 0; index < snapshot.docs.length; index += 450) {
    chunks.push(snapshot.docs.slice(index, index + 450));
  }

  for (const docs of chunks) {
    const batch = writeBatch(db);
    docs.forEach((item) => batch.delete(item.ref));
    await batch.commit();
  }
};

export const deleteUserData = async (uid: string): Promise<void> => {
  await deleteCollection(`users/${uid}/tasks`);
  await deleteCollection(`users/${uid}/usage`);
  await deleteDoc(doc(db, "users", uid));
};
