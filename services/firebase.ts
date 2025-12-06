import { initializeApp } from 'firebase/app';
import { getFirestore, doc, onSnapshot, updateDoc, increment, setDoc, getDoc } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';

// NOTE: In a real environment, these would be process.env.REACT_APP_FIREBASE_...
// For this demo, we use a placeholder config.
// The app will gracefully degrade to "Offline Mode" if these keys are invalid.
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyDummyKey",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "dummy.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "dummy-project",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "dummy.appspot.com",
  messagingSenderId: process.env.FIREBASE_SENDER_ID || "123456789",
  appId: process.env.FIREBASE_APP_ID || "1:123456789:web:dummy"
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
