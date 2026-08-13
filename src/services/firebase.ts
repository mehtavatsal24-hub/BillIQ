import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore, initializeFirestore, memoryLocalCache, setLogLevel, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";

// Import the Firebase configuration
import rawFirebaseConfig from "../../firebase-applet-config.json";

// Set custom auth domain and Firebase config with fallback defaults
const firebaseConfig = {
  ...rawFirebaseConfig,
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || rawFirebaseConfig.apiKey || "AIzaSyCuFBQe3Wr0qO4ybrJBGuu7Bcsy-DfMtew",
  authDomain: "new-app-74245.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || rawFirebaseConfig.projectId || "new-app-74245",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || rawFirebaseConfig.storageBucket || "new-app-74245.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || rawFirebaseConfig.messagingSenderId || "70732456690",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || rawFirebaseConfig.appId || "1:70732456690:web:cdf42bf5e1344c9af1666b",
};

// Silence internal Firestore SDK assertion logs
try {
  setLogLevel("silent");
} catch {
  // Ignore
}

// Check if we have the minimum required config
const isConfigValid = !!(firebaseConfig.apiKey && firebaseConfig.projectId);

let app: any;
let db: Firestore | null = null;
let auth: Auth | null = null;

if (isConfigValid) {
  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    const dbId = (firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== "(default)")
      ? firebaseConfig.firestoreDatabaseId 
      : undefined;

    const firestoreSettings = {
      experimentalForceLongPolling: true,
      localCache: memoryLocalCache()
    };

    try {
      db = dbId 
        ? initializeFirestore(app, firestoreSettings, dbId) 
        : initializeFirestore(app, firestoreSettings);
    } catch {
      db = dbId ? getFirestore(app, dbId) : getFirestore(app);
    }
    
    auth = getAuth(app);
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
} else {
  const missing = [];
  if (!firebaseConfig.apiKey) missing.push("API Key");
  if (!firebaseConfig.projectId) missing.push("Project ID");
  console.warn(`Firebase configuration is incomplete. Missing: ${missing.join(", ")}. Cloud Sync will be disabled.`);
}

export { app, db, auth, isConfigValid };


