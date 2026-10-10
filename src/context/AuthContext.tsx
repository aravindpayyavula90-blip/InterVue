import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, ResumeData } from '../types';
import { api, setAuthToken, getStoredAuthToken, getGuestId } from '../services/api';
import {
  auth,
  googleProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  FirebaseUser,
} from '../lib/firebase';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  activeResume: ResumeData | null;
  setActiveResume: React.Dispatch<React.SetStateAction<ResumeData | null>>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, confirmPassword?: string, name?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshResumes: () => Promise<ResumeData[]>;
  toasts: ToastMessage[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeResume, setActiveResume] = useState<ResumeData | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const refreshResumes = async (): Promise<ResumeData[]> => {
    if (!auth.currentUser && !getStoredAuthToken()) {
      setActiveResume(null);
      return [];
    }
    try {
      const res = await api.getResumes();
      if (res.resumes && res.resumes.length > 0) {
        setActiveResume((curr) => {
          if (!curr) return res.resumes[0];
          const found = res.resumes.find((r) => r.id === curr.id);
          return found || res.resumes[0];
        });
      } else {
        setActiveResume(null);
      }
      return res.resumes || [];
    } catch {
      setActiveResume(null);
      return [];
    }
  };

  const refreshUser = async () => {
    try {
      if (auth.currentUser) {
        const token = await auth.currentUser.getIdToken(true);
        setAuthToken(token);
        const res = await api.syncFirebaseUser(token);
        setUser(res.user);
        await refreshResumes();
      } else {
        setAuthToken(null);
        setUser(null);
        setActiveResume(null);
      }
    } catch (err) {
      console.warn('Error refreshing user state:', err);
      setAuthToken(null);
      setUser(null);
      setActiveResume(null);
    } finally {
      setLoading(false);
    }
  };

  // Firebase Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        try {
          const token = await fbUser.getIdToken();
          setAuthToken(token);
          const res = await api.syncFirebaseUser(token);
          setUser(res.user);
          await refreshResumes();
        } catch (err) {
          console.warn('Failed to sync Firebase user session:', err);
        }
      } else {
        // Completely clear unauthenticated state so no previous user info remains
        setAuthToken(null);
        setUser(null);
        setActiveResume(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Firebase Login with Email/Password
  const login = async (email: string, password: string) => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const token = await cred.user.getIdToken();
      setAuthToken(token);
      const res = await api.syncFirebaseUser(token, getGuestId());
      setUser(res.user);
      showToast(`Welcome back, ${cred.user.displayName || cred.user.email}!`, 'success');
      await refreshResumes();
    } catch (err: any) {
      let msg = err.message || 'Login failed.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        msg = 'Invalid email or password.';
      } else if (err.code === 'auth/too-many-requests') {
        msg = 'Too many attempts. Please try again later.';
      }
      throw new Error(msg);
    }
  };

  // Firebase Register with Email/Password
  const register = async (email: string, password: string, confirmPassword?: string, name?: string) => {
    if (confirmPassword && password !== confirmPassword) {
      throw new Error('Passwords do not match.');
    }
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters.');
    }

    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      if (name && name.trim()) {
        await updateProfile(cred.user, { displayName: name.trim() });
      }
      const token = await cred.user.getIdToken();
      setAuthToken(token);
      const res = await api.syncFirebaseUser(token, getGuestId());
      setUser(res.user);
      showToast('Your InterVue account has been created with Firebase Auth!', 'success');
      await refreshResumes();
    } catch (err: any) {
      let msg = err.message || 'Registration failed.';
      if (err.code === 'auth/email-already-in-use') {
        msg = 'An account with this email address already exists. Please sign in instead.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Password is too weak. Please use at least 6 characters.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'Please enter a valid email address.';
      }
      throw new Error(msg);
    }
  };

  // Firebase Google Sign-In
  const loginWithGoogle = async () => {
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const token = await cred.user.getIdToken();
      setAuthToken(token);
      const res = await api.syncFirebaseUser(token, getGuestId());
      setUser(res.user);
      showToast(`Signed in with Google as ${cred.user.displayName || cred.user.email}!`, 'success');
      await refreshResumes();
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        return; // User cancelled, no error needed
      }
      throw new Error(err.message || 'Google authentication failed.');
    }
  };

  // Firebase Password Reset Email
  const sendPasswordReset = async (email: string) => {
    if (!email || !email.trim()) {
      throw new Error('Please enter your email address.');
    }
    await sendPasswordResetEmail(auth, email.trim());
    showToast('Password reset link sent to your email!', 'info');
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      console.warn('Firebase signout note:', e);
    }
    try {
      await api.logout();
    } catch (e) {}
    setAuthToken(null);
    setUser(null);
    setFirebaseUser(null);
    setActiveResume(null);
    showToast('You have been signed out.', 'info');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        activeResume,
        setActiveResume,
        login,
        register,
        loginWithGoogle,
        sendPasswordReset,
        logout,
        refreshUser,
        refreshResumes,
        toasts,
        showToast,
        removeToast,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
