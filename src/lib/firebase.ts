import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  User as FirebaseUser,
} from "firebase/auth";

// Your web app's Firebase configuration provided by user
export const firebaseConfig = {
  apiKey: "AIzaSyAeSRNNE9g7rlCSkfMPPsIhcxUfacc0iok",
  authDomain: "intervue-a7704.firebaseapp.com",
  projectId: "intervue-a7704",
  storageBucket: "intervue-a7704.firebasestorage.app",
  messagingSenderId: "1015894360043",
  appId: "1:1015894360043:web:7f392e3e0bc7d251e4e3ae"
};

// Initialize Firebase (guarding against multiple initializations)
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Authentication only (no firestore, no analytics)
export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
};
export type { FirebaseUser };
