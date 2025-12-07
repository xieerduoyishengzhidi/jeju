import { initializeApp } from 'firebase/app';
import { getFirestore, doc, onSnapshot, updateDoc, increment, setDoc, getDoc } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';

// NOTE: In a real environment, these would be import.meta.env.VITE_FIREBASE_...
// For this demo, we use a placeholder config.
// The app will gracefully degrade to "Offline Mode" if these keys are invalid.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || import.meta.env.FIREBASE_API_KEY || "AIzaSyDummyKey",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || import.meta.env.FIREBASE_AUTH_DOMAIN || "dummy.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || import.meta.env.FIREBASE_PROJECT_ID || "dummy-project",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || import.meta.env.FIREBASE_STORAGE_BUCKET || "dummy.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_SENDER_ID || import.meta.env.FIREBASE_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || import.meta.env.FIREBASE_APP_ID || "1:123456789:web:dummy"
};

let db: any = null;
let auth: any = null;

try {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
  
  // Auto sign-in for voting
  signInAnonymously(auth).catch((error) => {
    console.warn("Auth failed (expected in demo mode):", error);
  });
} catch (e) {
  console.warn("Firebase initialization failed (Demo Mode active):", e);
}

export { db, auth, doc, onSnapshot, updateDoc, increment, setDoc, getDoc };
