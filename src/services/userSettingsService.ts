import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth } from '../firebase';

const SETTINGS_COLLECTION = 'user_settings';

export async function getUserSettings() {
  const user = auth.currentUser;
  if (!user) throw new Error('로그인 필요');
  const ref = doc(db, SETTINGS_COLLECTION, user.uid);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : {};
}

export async function updateUserSettings(settings: any) {
  const user = auth.currentUser;
  if (!user) throw new Error('로그인 필요');
  const ref = doc(db, SETTINGS_COLLECTION, user.uid);
  await setDoc(ref, settings, { merge: true });
}
