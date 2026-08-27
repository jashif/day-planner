import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "../firebase/config";
import type { NewTaskInput, Task } from "../types/task";

const tasksCollection = (uid: string) => collection(db, "users", uid, "tasks");

export const subscribeToTasks = (
  uid: string,
  onChange: (tasks: Task[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe => {
  const q = query(tasksCollection(uid), orderBy("createdAt", "desc"));
  return onSnapshot(
    q,
    (snapshot) => {
      const tasks = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          title: data.title,
          date: data.date,
          time: data.time,
          priority: data.priority,
          done: data.done,
          createdAt: data.createdAt?.toMillis?.() ?? Date.now(),
          subtasks: data.subtasks,
          recurrence: data.recurrence ?? "none",
          section: data.section ?? "Home",
        } as Task;
      });
      onChange(tasks);
    },
    onError,
  );
};

export const addTask = async (uid: string, input: NewTaskInput): Promise<void> => {
  await addDoc(tasksCollection(uid), {
    title: input.title.trim(),
    date: input.date,
    time: input.time || null,
    priority: input.priority,
    done: false,
    createdAt: serverTimestamp(),
    recurrence: input.recurrence,
    section: input.section ?? "Home",
  });
};

/** Creates several tasks in one atomic write, used when accepting a generated routine. */
export const addTasks = async (uid: string, inputs: NewTaskInput[]): Promise<void> => {
  if (inputs.length === 0) return;

  const existing = await getDocs(tasksCollection(uid));
  const existingKeys = new Set(
    existing.docs.map((taskDoc) => {
      const data = taskDoc.data();
      return `${String(data.title ?? "")
        .trim()
        .toLowerCase()}|${data.recurrence ?? "none"}|${data.time ?? ""}|${data.section ?? "Home"}`;
    }),
  );
  const newInputs = inputs.filter((input) => {
    const key = `${input.title.trim().toLowerCase()}|${input.recurrence}|${input.time || ""}|${input.section ?? "Home"}`;
    if (existingKeys.has(key)) return false;
    existingKeys.add(key);
    return true;
  });
  if (newInputs.length === 0) return;

  const batch = writeBatch(db);
  newInputs.forEach((input) => {
    batch.set(doc(tasksCollection(uid)), {
      title: input.title.trim(),
      date: input.date,
      time: input.time || null,
      priority: input.priority,
      done: false,
      createdAt: serverTimestamp(),
      recurrence: input.recurrence,
      section: input.section ?? "Home",
    });
  });
  await batch.commit();
};

export const updateTask = async (
  uid: string,
  id: string,
  changes: Partial<Task>,
): Promise<void> => {
  await updateDoc(doc(tasksCollection(uid), id), changes);
};

export const deleteTask = async (uid: string, id: string): Promise<void> => {
  await deleteDoc(doc(tasksCollection(uid), id));
};
