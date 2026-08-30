import {
  collection,
  doc,
  getDoc,
  increment,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  where,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "../firebase/config";

const generateCode = (): string =>
  (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`)
    .replace(/-/g, "")
    .slice(0, 10);

const pairId = (a: string, b: string): string => [a, b].sort().join("_");

export const createInvite = async (inviterUid: string): Promise<string> => {
  const code = generateCode();
  await setDoc(doc(db, "invites", code), { inviterUid, createdAt: serverTimestamp() });
  return code;
};

/** Links the invitee to whoever created the code. No-ops for a missing/self invite. */
export const acceptInvite = async (code: string, myUid: string): Promise<boolean> => {
  const snap = await getDoc(doc(db, "invites", code));
  const inviterUid = snap.data()?.inviterUid as string | undefined;
  if (!inviterUid || inviterUid === myUid) return false;

  let created = false;
  await runTransaction(db, async (transaction) => {
    const friendship = doc(db, "friendships", pairId(inviterUid, myUid));
    const existing = await transaction.get(friendship);
    if (existing.exists()) return;

    transaction.set(friendship, {
      members: [inviterUid, myUid].sort(),
      createdAt: serverTimestamp(),
    });
    transaction.set(doc(db, "profiles", myUid), { points: increment(50) }, { merge: true });
    created = true;
  });
  return created;
};

export const subscribeToFriendUids = (
  uid: string,
  onChange: (friendUids: string[]) => void,
): Unsubscribe => {
  const q = query(collection(db, "friendships"), where("members", "array-contains", uid));
  return onSnapshot(q, (snapshot) => {
    const friendUids = snapshot.docs
      .map((docSnap) => (docSnap.data().members as string[]).find((member) => member !== uid))
      .filter((member): member is string => Boolean(member));
    onChange(friendUids);
  });
};
