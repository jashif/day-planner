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

export const DEFAULT_SECTIONS = ["Home", "Work", "Daily"];

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
