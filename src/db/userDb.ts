import { collection, deleteDoc, doc, getDocs, writeBatch } from "firebase/firestore";
import { db } from "../firebase/config";

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
