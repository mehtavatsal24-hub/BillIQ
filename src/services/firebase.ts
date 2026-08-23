import { getApp, getApps, initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCuFBQe3Wr0qO4ybrJBGuu7Bcsy-DfMtew",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "new-app-74245.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "new-app-74245",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "new-app-74245.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "70732456690",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:70732456690:web:cdf42bf5e1344c9af1666b",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-3K3F4T7DQB",
};

export const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(firebaseApp);
export const firestore = getFirestore(firebaseApp);

export const firebaseAnalyticsPromise = isSupported()
  .then((supported) => (supported ? getAnalytics(firebaseApp) : null))
  .catch(() => null);
