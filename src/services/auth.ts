import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  updateProfile,
  type User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { firebaseAuth, firestore } from "./firebase";

export type User = FirebaseUser & Record<string, any>;
export const DEFAULT_LOCAL_USER: User | null = null;
export const auth = firebaseAuth;

export const ADMIN_EMAILS = [
  "support@billiq.site",
  "mehtavatsal24@gmail.com",
  "admin@billiq.site",
];

export const validateEmailStrict = (email: string): { isValid: boolean; error?: string } => {
  const cleanEmail = (email || "").trim().toLowerCase();
  if (!cleanEmail || !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(cleanEmail)) {
    return { isValid: false, error: "Please enter a valid email address." };
  }
  return { isValid: true };
};

const toUser = (user: FirebaseUser): User => user as User;

const saveUserProfile = async (user: FirebaseUser, updates: Record<string, any> = {}) => {
  const profile = {
    uid: user.uid,
    id: user.uid,
    email: user.email || "",
    signupEmail: user.email || "",
    authEmail: user.email || "",
    displayName: user.displayName || updates.username || user.email?.split("@")[0] || "User",
    username: updates.username || user.displayName || user.email?.split("@")[0] || "User",
    provider: user.providerData[0]?.providerId || "password",
    authProvider: user.providerData[0]?.providerId || "password",
    emailVerified: user.emailVerified,
    updatedAt: new Date().toISOString(),
    ...updates,
  };
  
  // 1. Sync to Firestore Cloud
  try {
    await setDoc(doc(firestore, "users", user.uid), profile, { merge: true });
  } catch (err) {
    console.warn("Firestore sync warning:", err);
  }

  // 2. Sync to Node.js Backend Server
  try {
    await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: user.uid,
        username: profile.username,
        email: profile.email,
      }),
    });
  } catch (err) {
    console.warn("Node.js server user sync warning:", err);
  }

  return profile;
};

export const signInWithGoogleToken = async (_idToken?: string) => {
  const provider = new GoogleAuthProvider();
  provider.addScope("email");
  provider.addScope("profile");
  provider.setCustomParameters({ prompt: "select_account" });
  try {
    const result = await signInWithPopup(firebaseAuth, provider);
    await saveUserProfile(result.user);
    return toUser(result.user);
  } catch (popupErr: any) {
    console.warn("Google popup auth notice, trying redirect auth...", popupErr);
    try {
      await signInWithRedirect(firebaseAuth, provider);
      return null;
    } catch (redirectErr) {
      throw popupErr;
    }
  }
};

export const handleEmailSignUp = async (email: string, pass: string, name: string) => {
  const result = await createUserWithEmailAndPassword(firebaseAuth, email.trim(), pass);
  if (name.trim()) await updateProfile(result.user, { displayName: name.trim() });
  await saveUserProfile(result.user, { username: name.trim() || undefined });
  return toUser(result.user);
};

export const handleEmailSignIn = async (email: string, pass: string) => {
  const result = await signInWithEmailAndPassword(firebaseAuth, email.trim(), pass);
  await saveUserProfile(result.user);
  return toUser(result.user);
};

export const signUpWithEmail = handleEmailSignUp;
export const signInWithEmail = handleEmailSignIn;

export const resolveEmailFromUsername = async (input: string): Promise<string | null> => {
  const value = input.trim();
  return value.includes("@") ? value : null;
};

export const syncUserProfileToFirestore = async (user: FirebaseUser, _fallbackEmail?: string, displayName?: string) => {
  const existing = await getDoc(doc(firestore, "users", user.uid));
  await saveUserProfile(user, displayName ? { username: displayName } : {});
  return { isNewUser: !existing.exists() };
};

export const sendPasswordReset = async (email: string) => {
  await sendPasswordResetEmail(firebaseAuth, email.trim());
  return email.trim();
};

export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
  getRedirectResult(firebaseAuth)
    .then((result) => {
      if (result?.user) {
        saveUserProfile(result.user);
      }
    })
    .catch((err) => {
      console.warn("Google Redirect Auth notice:", err);
    });

  return onAuthStateChanged(firebaseAuth, (user) => callback(user ? toUser(user) : null));
};

export const logoutUser = async () => {
  await signOut(firebaseAuth);
};

export const generate6DigitOTP = (): string => Math.floor(100000 + Math.random() * 900000).toString();
export const setUpRecaptcha = (_containerId = "recaptcha-container") => null;
export const sendPhoneOtp = async (_phoneNumber: string, _containerId = "recaptcha-container") => ({
  confirm: async () => ({ user: firebaseAuth.currentUser }),
});
export const verifyPhoneOtp = async () => firebaseAuth.currentUser;
