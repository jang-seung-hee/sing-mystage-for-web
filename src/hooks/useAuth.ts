import { useState, useEffect, useCallback } from 'react';
import { auth } from '../firebase';
import { db } from '../firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  inMemoryPersistence,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 인증 퍼시스턴스 설정 (브라우저 호환성 폴백 포함)
  useEffect(() => {
    let mounted = true;
    const setupPersistence = async () => {
      try {
        await setPersistence(auth, browserLocalPersistence);
      } catch {
        try {
          await setPersistence(auth, browserSessionPersistence);
        } catch {
          // 마지막 폴백: 인메모리 (탭/새로고침 시 세션 유지 안됨)
          await setPersistence(auth, inMemoryPersistence);
        }
      }
    };
    setupPersistence();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);

      // 리디렉트/팝업 구분 없이 로그인 성공 시 사용자 문서 업서트
      if (firebaseUser) {
        try {
          setDoc(
            doc(db, 'users', firebaseUser.uid),
            {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName || '',
              photoURL: firebaseUser.photoURL || '',
              lastLogin: serverTimestamp(),
              provider: (firebaseUser.providerData && firebaseUser.providerData[0]?.providerId) || 'password',
            },
            { merge: true },
          );
        } catch (e) {
          // 업서트 실패는 치명적이지 않으므로 콘솔만
          console.warn('사용자 문서 업서트 실패:', e);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const signup = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      // Firestore에 user 정보 저장
      await setDoc(doc(db, 'users', cred.user.uid), {
        uid: cred.user.uid,
        email: cred.user.email,
        createdAt: serverTimestamp(),
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await signOut(auth);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const googleLogin = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const isMobile = /Mobi|Android|iPhone|iPad|iPod|SamsungBrowser/i.test(
        navigator.userAgent,
      );

      if (isMobile) {
        // 모바일/삼성인터넷: 리디렉트 방식이 더 안정적
        await signInWithRedirect(auth, provider);
        return; // 리디렉트로 이동
      } else {
        const cred = await signInWithPopup(auth, provider);
        // Firestore에 user 정보 저장/업데이트
        await setDoc(
          doc(db, 'users', cred.user.uid),
          {
            uid: cred.user.uid,
            email: cred.user.email,
            displayName: cred.user.displayName || '',
            photoURL: cred.user.photoURL || '',
            provider: 'google',
            lastLogin: serverTimestamp(),
          },
          { merge: true },
        );
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { user, loading, error, signup, login, logout, googleLogin };
}
