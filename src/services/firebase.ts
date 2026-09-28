import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAN1KeCknIlCwDZHMdrGMgsMcZPcdonEWU",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "academia-sync-8ecfb.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "academia-sync-8ecfb",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "academia-sync-8ecfb.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "399093707680",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:399093707680:web:516ae883a6dc2dd875aac5",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-33PF3T4P9Z"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
