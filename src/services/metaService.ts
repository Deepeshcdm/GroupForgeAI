import { db } from '../config/firebase';
import { doc, getDoc, setDoc, increment } from 'firebase/firestore';

type MetaStats = {
  usersCount: number;
  assessedUsersCount: number;
};

const META_DOC = doc(db, 'meta', 'stats');

function normalizeMeta(data: any): MetaStats {
  // Support both current flat fields and potential nested legacy shapes
  const usersCount = data?.usersCount ?? data?.stats?.usercount ?? 0;
  const assessedUsersCount = data?.assessedUsersCount ?? data?.stats?.assessedUsersCount ?? 0;
  return { usersCount, assessedUsersCount };
}

export async function getMetaStats(): Promise<MetaStats> {
  const snap = await getDoc(META_DOC);
  if (!snap.exists()) {
    return { usersCount: 0, assessedUsersCount: 0 };
  }
  return normalizeMeta(snap.data());
}

export async function getUserCount(): Promise<number> {
  const { usersCount } = await getMetaStats();
  return usersCount;
}

export async function incrementUserCount(): Promise<void> {
  await setDoc(
    META_DOC,
    { usersCount: increment(1) },
    { merge: true }
  );
}

export async function decrementUserCount(): Promise<void> {
  await setDoc(
    META_DOC,
    { usersCount: increment(-1) },
    { merge: true }
  );
}

export async function incrementAssessedUsersCount(): Promise<void> {
  await setDoc(
    META_DOC,
    { assessedUsersCount: increment(1) },
    { merge: true }
  );
}

export async function initializeMetaIfNeeded(): Promise<void> {
  const snap = await getDoc(META_DOC);
  if (!snap.exists()) {
    await setDoc(META_DOC, { usersCount: 0, assessedUsersCount: 0 });
  }
}
