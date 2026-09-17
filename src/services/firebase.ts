import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAN1KeCknIlCwDZHMdrGMgsMcZPcdonEWU",
  authDomain: "academia-sync-8ecfb.firebaseapp.com",
  projectId: "academia-sync-8ecfb",
  storageBucket: "academia-sync-8ecfb.firebasestorage.app",
  messagingSenderId: "399093707680",
  appId: "1:399093707680:web:516ae883a6dc2dd875aac5",
  measurementId: "G-33PF3T4P9Z"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
