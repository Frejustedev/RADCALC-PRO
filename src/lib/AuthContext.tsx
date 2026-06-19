import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  User,
} from 'firebase/auth';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from './firebase';
import { UserProfile } from '../types';
import { can, Permission, Role } from './roles';

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  role: Role | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (p: Permission) => boolean;
}

const AuthCtx = createContext<AuthState | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }
    let unsubProfile: (() => void) | undefined;

    const unsubAuth = onAuthStateChanged(
      auth,
      (u) => {
        unsubProfile?.();
        setUser(u);
        if (!u) {
          setProfile(null);
          setLoading(false);
          return;
        }
        // New signed-in user → show the loading gate until the first profile snapshot.
        setProfile(null);
        setLoading(true);
        // Live profile: role/activation changes by an admin reflect without re-login.
        unsubProfile = onSnapshot(
          doc(db, 'users', u.uid),
          (snap) => {
            setProfile(snap.exists() ? ({ uid: u.uid, ...snap.data() } as UserProfile) : null);
            setLoading(false);
          },
          (err) => {
            console.error('[auth] profile snapshot error', err);
            setLoading(false);
          },
        );
      },
      (err) => {
        console.error('[auth] state error', err);
        setLoading(false);
      },
    );

    return () => {
      unsubProfile?.();
      unsubAuth();
    };
  }, []);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email.trim(), password);
  };

  const register = async (name: string, email: string, password: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    try {
      await updateProfile(cred.user, { displayName: name });
      // New accounts default to the lowest role and INACTIVE — an admin assigns role & activates.
      // (The very first admin is bootstrapped once in the Firebase console — see FIREBASE_SETUP.md.)
      await setDoc(doc(db, 'users', cred.user.uid), {
        email: email.trim(),
        displayName: name,
        role: 'manipulateur',
        active: false,
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      // Account exists but the profile write failed → sign out so a retry recreates cleanly.
      await signOut(auth).catch(() => {});
      throw err;
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const value: AuthState = {
    user,
    profile,
    role: profile?.role ?? null,
    loading,
    login,
    register,
    logout,
    hasPermission: (p) => (profile?.active ? can(profile.role, p) : false),
  };

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
};

export const useAuth = (): AuthState => {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
