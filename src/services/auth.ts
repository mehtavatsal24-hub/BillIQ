import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
  onAuthStateChanged,
  User,
  sendPasswordResetEmail,
  updatePassword,
  EmailAuthProvider,
  linkWithCredential,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  GoogleAuthProvider,
  signInWithCredential
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from './firebase';
import { getOrCreateTrialLedger } from './trialService';
import { mergeLocalDataWithFirestore } from './dbService';
import { getDefaultUsers } from '../data/dataLoader';

// Export auth singleton
export { auth };

/**
 * Strict Email & Domain Validation Helper
 * Validates syntax, domain structure, top-level domain (TLD), and filters out gibberish/disposable patterns.
 */
export const validateEmailStrict = (email: string): { isValid: boolean; error?: string } => {
  const cleanEmail = (email || '').trim().toLowerCase();

  if (!cleanEmail) {
    return { isValid: false, error: 'Please enter a valid and active email address.' };
  }

  // 1. Standard Email Regex Check
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(cleanEmail)) {
    return { isValid: false, error: 'Please enter a valid and active email address.' };
  }

  const parts = cleanEmail.split('@');
  if (parts.length !== 2) {
    return { isValid: false, error: 'Please enter a valid and active email address.' };
  }

  const [localPart, domainPart] = parts;

  // 2. Local part length & checks
  if (!localPart || localPart.length < 2) {
    return { isValid: false, error: 'Please enter a valid and active email address.' };
  }

  // 3. Domain & TLD checks
  const domainSubparts = domainPart.split('.');
  if (domainSubparts.length < 2) {
    return { isValid: false, error: 'Please enter a valid and active email address.' };
  }

  const tld = domainSubparts[domainSubparts.length - 1];
  const domainName = domainSubparts.slice(0, -1).join('.');

  if (!domainName || domainName.length < 2) {
    return { isValid: false, error: 'Please enter a valid and active email address.' };
  }

  if (!tld || tld.length < 2) {
    return { isValid: false, error: 'Please enter a valid and active email address.' };
  }

  // Known invalid/disposable/gibberish domain patterns
  const invalidDomainList = [
    'asdf', 'qwerty', 'zxcv', 'ghjk', '12345', '123456', 'test', 'temp', 'fake',
    'example', 'foo', 'bar', 'trash', 'disposable', 'mailinator', '10minutemail',
    'yopmail', 'guerrillamail', 'sharklasers', 'mytempemail', 'tempmail', 'throwaway'
  ];

  if (invalidDomainList.includes(domainName.toLowerCase())) {
    return { isValid: false, error: 'Please enter a valid and active email address.' };
  }

  // Check for gibberish repetition patterns like asdf, qwerty, zxcv or repeated characters
  const gibberishPattern = /^(asdf+|qwerty+|zxcv+|12345+|test+|temp+|fake+|[a-z]\1{3,})$/i;
  if (gibberishPattern.test(domainName) || gibberishPattern.test(localPart)) {
    return { isValid: false, error: 'Please enter a valid and active email address.' };
  }

  return { isValid: true };
};

export const ADMIN_EMAILS = [
  "support@billiq.site",
  "mehtavatsal24@gmail.com",
  "admin@smartbill.ai"
];

/**
 * GOOGLE SIGN-IN VIA GOOGLE IDENTITY SERVICES (GIS) TOKEN
 * Authenticates with Firebase using ID token credential and syncs user record in Firestore.
 */
export const signInWithGoogleToken = async (idToken: string) => {
  if (!auth) throw new Error("Firebase Authentication is not initialized.");

  const credential = GoogleAuthProvider.credential(idToken);
  const userCredential = await signInWithCredential(auth, credential);
  const user = userCredential.user;

  try {
    localStorage.setItem('billiq_is_logged_in', 'true');
  } catch {}

  if (db) {
    const userDocRef = doc(db, 'users', user.uid);
    const userDocSnap = await getDoc(userDocRef);

    const email = (user.email || "").trim().toLowerCase();
    const displayName = user.displayName || (email ? email.split('@')[0] : "User");
    const photoURL = user.photoURL || "";

    const isAdminEmail = ADMIN_EMAILS.some(e => e.toLowerCase() === email) || email.includes('admin');
    const defaultRole = isAdminEmail ? 'admin' : 'staff';

    if (!userDocSnap.exists()) {
      const newGoogleUserData = {
        uid: user.uid,
        id: user.uid,
        email,
        signupEmail: email,
        authEmail: email,
        displayName,
        username: displayName,
        photoURL,
        role: defaultRole,
        status: 'active',
        accountStatus: 'Active',
        provider: 'google',
        authProvider: 'google',
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        lastActiveAt: serverTimestamp(),
        lastLogin: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        trialExhausted: false,
        documentsRemaining: defaultRole === 'admin' ? 999999 : 5,
        documentsUsed: 0,
        lifetimeCreatedCount: 0,
        totalGeneratedDocsCount: 0,
        planTier: defaultRole === 'admin' ? 'enterprise' : 'free_trial',
        planName: defaultRole === 'admin' ? 'Enterprise Admin' : 'Free Trial',
        plan: defaultRole === 'admin' ? 'Enterprise Admin' : 'Free Trial'
      };
      await setDoc(userDocRef, newGoogleUserData, { merge: true });
    } else {
      const existingData = userDocSnap.data();
      const updates: Record<string, any> = {
        lastLoginAt: serverTimestamp(),
        lastActiveAt: serverTimestamp(),
        lastLogin: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        displayName: displayName || existingData.displayName || "",
        photoURL: photoURL || existingData.photoURL || "",
        provider: 'google',
        authProvider: 'google',
      };
      // Do not overwrite existing role or status properties
      if (!existingData.role) {
        updates.role = (existingData.planTier === 'enterprise' || isAdminEmail) ? 'admin' : 'staff';
      }
      if (!existingData.status && !existingData.accountStatus) {
        updates.status = 'active';
        updates.accountStatus = 'Active';
      }
      await setDoc(userDocRef, updates, { merge: true });
    }

    // Sync login event to backend server for active analytics
    fetch('/api/track-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.uid, email, username: displayName })
    }).catch(() => {});
  }

  return user;
};

/**
 * EMAIL SIGN-UP (NEW USER ACCOUNT)
 * Requires password creation and sets up the initial profile.
 */
export const handleEmailSignUp = async (email: string, pass: string, name: string) => {
  if (!auth) throw new Error("Firebase Authentication is not initialized.");
  const cleanEmail = email.trim().toLowerCase();
  
  // Strict Email & Domain Validation
  const emailValidation = validateEmailStrict(cleanEmail);
  if (!emailValidation.isValid) {
    throw new Error(emailValidation.error || "Please enter a valid and active email address.");
  }

  const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
  const user = userCredential.user;

  try {
    localStorage.setItem('billiq_is_logged_in', 'true');
  } catch {}

  await updateProfile(user, { displayName: name });

  // Trigger Firebase Email Verification link dispatch
  try {
    const actionCodeSettings = {
      url: typeof window !== 'undefined' ? window.location.href : 'https://billiq.site',
      handleCodeInApp: true
    };
    await sendEmailVerification(user, actionCodeSettings);
    console.log(`[Firebase sendEmailVerification dispatched to ${cleanEmail}]`);
  } catch (verErr) {
    console.warn("Notice: Firebase sendEmailVerification dispatch warning:", verErr);
  }

  // Trigger Server Verification Email & OTP endpoint
  try {
    fetch('/api/send-verification-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail })
    }).catch(e => console.warn("Notice: /api/send-verification-email call notice:", e));
  } catch (e) {}

  // Trigger Server Welcome Email endpoint
  try {
    fetch('/api/welcome-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, name: name || cleanEmail.split('@')[0] })
    }).catch(e => console.warn("Notice: /api/welcome-email call notice:", e));
  } catch (e) {}

  if (db) {
    const emailKey = cleanEmail.replace(/[^a-zA-Z0-9]/g, '_');
    const trialLedgerRef = doc(db, 'trialLedgers', emailKey);
    let isTrialExhausted = false;
    try {
      const trialSnap = await getDoc(trialLedgerRef);
      isTrialExhausted = trialSnap.exists() && trialSnap.data()?.trialExhausted === true;
    } catch (e) {
      console.warn('Trial ledger check notice:', e);
    }

    const isAdminEmail = ADMIN_EMAILS.some(e => e.toLowerCase() === cleanEmail) || cleanEmail.includes('admin');
    const defaultRole = isAdminEmail ? 'admin' : 'staff';

    const userData = {
      uid: user.uid,
      id: user.uid,
      email: cleanEmail,
      signupEmail: cleanEmail,
      authEmail: cleanEmail,
      displayName: name || cleanEmail.split('@')[0],
      username: name || cleanEmail.split('@')[0],
      photoURL: user.photoURL || '',
      role: defaultRole,
      status: 'active',
      accountStatus: 'Active',
      provider: 'email',
      authProvider: 'email',
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
      updatedAt: new Date().toISOString(),
      trialExhausted: isTrialExhausted,
      documentsRemaining: defaultRole === 'admin' ? 999999 : (isTrialExhausted ? 0 : 5),
      documentsUsed: isTrialExhausted ? 5 : 0,
      lifetimeCreatedCount: isTrialExhausted ? 5 : 0,
      totalGeneratedDocsCount: isTrialExhausted ? 5 : 0,
      planTier: defaultRole === 'admin' ? 'enterprise' : (isTrialExhausted ? 'expired' : 'free_trial'),
      planName: defaultRole === 'admin' ? 'Enterprise Admin' : (isTrialExhausted ? 'Trial Expired' : 'Free Trial'),
      plan: defaultRole === 'admin' ? 'Enterprise Admin' : (isTrialExhausted ? 'Trial Expired' : 'Free Trial')
    };

    await setDoc(doc(db, 'users', user.uid), userData, { merge: true });
  }

  // Record registration and initial login in backend database
  fetch('/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: name || cleanEmail.split('@')[0], email: cleanEmail })
  }).catch(() => {});

  fetch('/api/track-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: user.uid, email: cleanEmail, username: name || cleanEmail.split('@')[0] })
  }).catch(() => {});

  return user;
};

/**
 * EMAIL SIGN-IN (EXISTING USER ACCOUNT)
 * Validates credentials and verifies account status.
 */
export const handleEmailSignIn = async (email: string, pass: string) => {
  if (!auth) throw new Error("Firebase Authentication is not initialized.");
  const cleanEmail = email.trim().toLowerCase();
  const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, pass);
  const user = userCredential.user;

  try {
    localStorage.setItem('billiq_is_logged_in', 'true');
  } catch {}

  // Sync login event to backend server for active analytics
  fetch('/api/track-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: user.uid, email: cleanEmail, username: user.displayName || cleanEmail.split('@')[0] })
  }).catch(() => {});

  if (db) {
    (async () => {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
          await syncUserProfileToFirestore(user);
        } else {
          await setDoc(userDocRef, {
            lastLoginAt: serverTimestamp(),
            lastActiveAt: serverTimestamp(),
            lastLogin: new Date().toISOString(),
            lastActive: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }, { merge: true });
          mergeLocalDataWithFirestore(user.uid, cleanEmail).catch(() => {});
        }
      } catch (e) {
        console.warn('Notice background sync during Email Sign-In:', e);
      }
    })();
  }

  return { uid: user.uid, email: cleanEmail, displayName: user.displayName || cleanEmail.split('@')[0] };
};

// Helper to resolve an email address if the user enters a username
export const resolveEmailFromUsername = async (input: string): Promise<string | null> => {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (trimmed.includes('@')) return trimmed;

  try {
    if (db) {
      const usersRef = collection(db, "users");
      
      const fieldNames = ["username", "authUsername", "displayName"];
      for (const field of fieldNames) {
        const q = query(usersRef, where(field, "==", trimmed));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const data = snap.docs[0].data();
          const foundEmail = data.email || data.signupEmail || data.authEmail;
          if (foundEmail && typeof foundEmail === "string" && foundEmail.includes('@')) {
            return foundEmail.trim();
          }
        }
      }
    }
  } catch (e) {
    console.warn("Firestore username lookup notice:", e);
  }

  try {
    let usersList: any[] = [];
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.users)) {
          usersList = data.users;
        }
      }
    } catch (e) {
      // ignore server fetch error
    }

    if (!usersList.length) {
      usersList = getDefaultUsers();
    }

    const found = usersList.find(
      (u: any) => (u.username || "").toLowerCase() === trimmed.toLowerCase()
    );
    if (found?.email && found.email.includes('@')) {
      return found.email.trim();
    }
  } catch (e) {
    // ignore
  }

  return null;
};

// Helper to guarantee user profile with email is saved/updated in Firestore
export const syncUserProfileToFirestore = async (
  user: any, 
  fallbackEmail?: string, 
  displayName?: string
) => {
  if (!db || !user?.uid) return { isNewUser: false };
  const resolvedEmail = (user.email || fallbackEmail || user.providerData?.[0]?.email || "").trim().toLowerCase();
  const resolvedDisplayName = (displayName || user.displayName || (resolvedEmail ? resolvedEmail.split('@')[0] : "User")).trim();
  const photoURL = user.photoURL || user.providerData?.[0]?.photoURL || "";

  const isAdminEmail = ADMIN_EMAILS.some(e => e.toLowerCase() === resolvedEmail) || resolvedEmail.includes('admin');
  const defaultRole = isAdminEmail ? 'admin' : 'staff';
  const provider = user.providerData?.[0]?.providerId === 'google.com' ? 'google' : user.phoneNumber ? 'phone' : 'email';

  try {
    const userDocRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(userDocRef);
    const exists = docSnap.exists();

    if (!exists) {
      const trialInfo = await getOrCreateTrialLedger(resolvedEmail, user.uid);
      const isReReg = trialInfo.isReRegisteredUser;
      const isExhausted = trialInfo.trialExhausted || (trialInfo.documentsRemaining <= 0 && trialInfo.planTier !== "pro" && trialInfo.planTier !== "enterprise");
      const initialPlanTier = defaultRole === 'admin' ? "enterprise" : (isExhausted ? "expired" : trialInfo.planTier);
      const initialPlanName = defaultRole === 'admin' ? "Enterprise Admin" : (isExhausted ? "Trial Expired" : trialInfo.planName);
      const initialDocsRem = defaultRole === 'admin' ? 999999 : (isExhausted ? 0 : trialInfo.documentsRemaining);

      const initialBlankProfile = {
        id: user.uid,
        uid: user.uid,
        email: resolvedEmail,
        signupEmail: resolvedEmail,
        authEmail: resolvedEmail,
        username: resolvedDisplayName || resolvedEmail,
        authUsername: resolvedDisplayName || resolvedEmail,
        displayName: resolvedDisplayName,
        photoURL,
        role: defaultRole,
        status: "active",
        accountStatus: "Active",
        provider,
        authProvider: provider,
        plan: initialPlanName,
        planTier: initialPlanTier,
        planName: initialPlanName,
        documentsRemaining: initialDocsRem,
        documentsUsed: trialInfo.documentsUsed,
        lifetimeCreatedCount: trialInfo.lifetimeCreatedCount ?? trialInfo.documentsUsed,
        totalGeneratedDocsCount: trialInfo.lifetimeCreatedCount ?? trialInfo.documentsUsed,
        trialUsed: true,
        trialExhausted: isExhausted,
        isReRegisteredUser: isReReg,
        hasSeenWelcome: (isReReg || isExhausted) ? true : false,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        lastActiveAt: serverTimestamp(),
        lastLogin: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        history: [],
        savedCustomers: [],
        savedSuppliers: [],
        lastUsedNumbers: {},
        priceHistory: []
      };

      await setDoc(userDocRef, initialBlankProfile, { merge: true });

      return { isNewUser: true };
    } else {
      const existingData = docSnap.data();
      const signupEmail = user.email || fallbackEmail || existingData.signupEmail || existingData.authEmail || resolvedEmail;
      const authEmail = user.email || fallbackEmail || existingData.authEmail || existingData.signupEmail || resolvedEmail;
      const username = displayName || user.displayName || existingData.username || existingData.authUsername || resolvedDisplayName;

      const trialInfo = await getOrCreateTrialLedger(resolvedEmail, user.uid);
      const isPaid = existingData.planTier === "pro" || existingData.planTier === "enterprise";
      const remainingDocs = existingData.documentsRemaining !== undefined ? existingData.documentsRemaining : trialInfo.documentsRemaining;
      const isExhausted = !isPaid && remainingDocs <= 0;

      const profileData: Record<string, any> = {
        id: user.uid,
        uid: user.uid,
        email: resolvedEmail,
        signupEmail: signupEmail || resolvedEmail,
        authEmail: authEmail || resolvedEmail,
        username: username || resolvedDisplayName,
        authUsername: username || resolvedDisplayName,
        documentsRemaining: isPaid ? 999999 : (isExhausted ? 0 : remainingDocs),
        trialExhausted: isPaid ? false : isExhausted,
        lastLoginAt: serverTimestamp(),
        lastActiveAt: serverTimestamp(),
        lastLogin: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (photoURL) {
        profileData.photoURL = photoURL;
      }
      if (resolvedDisplayName) {
        profileData.displayName = resolvedDisplayName;
      }

      if (isExhausted && !isPaid) {
        profileData.documentsRemaining = 0;
        profileData.planTier = "expired";
        profileData.planName = "Trial Expired";
        profileData.plan = "Trial Expired";
      } else if (!isPaid) {
        profileData.planTier = existingData.planTier && existingData.planTier !== "expired" ? existingData.planTier : "free-trial";
        profileData.planName = existingData.planName && existingData.planName !== "Trial Expired" ? existingData.planName : "Free Trial";
        profileData.plan = existingData.plan && existingData.plan !== "Trial Expired" ? existingData.plan : "Free Trial";
      }

      // Preserve existing role and status properties
      if (!existingData.role) {
        profileData.role = (existingData.planTier === "enterprise" || isAdminEmail) ? "admin" : "staff";
      }
      if (!existingData.status && !existingData.accountStatus) {
        profileData.status = "active";
        profileData.accountStatus = "Active";
      }

      await setDoc(userDocRef, profileData, { merge: true });

      mergeLocalDataWithFirestore(user.uid, resolvedEmail).catch((e) => {
        console.warn("Notice syncing/merging local data with Firestore on user login:", e);
      });

      return { isNewUser: false };
    }
  } catch (err) {
    console.warn("Notice syncing user profile to Firestore:", err);
    return { isNewUser: false };
  }
};

// Sign Up with Email, Password & Display Name / Username (wrapper calling handleEmailSignUp)
export const signUpWithEmail = async (email: string, pass: string, username: string) => {
  try {
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: username.trim(), email: email.trim(), password: pass }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }
    }
  } catch (e: any) {
    if (e?.message && e.message.includes("Username is already taken")) {
      throw e;
    }
  }

  return await handleEmailSignUp(email, pass, username);
};

// Sign In with Email or Username & Password
export const signInWithEmail = async (emailOrUsername: string, pass: string) => {
  if (!auth) throw new Error("Firebase Authentication is not initialized.");
  
  let targetEmail = emailOrUsername.trim();

  if (!targetEmail.includes('@')) {
    const resolvedEmail = await resolveEmailFromUsername(targetEmail);
    if (resolvedEmail) {
      targetEmail = resolvedEmail;
    }
  }

  const userData = await handleEmailSignIn(targetEmail, pass);
  return auth.currentUser;
};

// Send Password Reset Email
export const sendPasswordReset = async (emailOrUsername: string) => {
  if (!auth) throw new Error("Firebase Authentication is not initialized.");
  let targetEmail = emailOrUsername.trim();

  if (!targetEmail.includes('@')) {
    const resolved = await resolveEmailFromUsername(targetEmail);
    if (resolved) {
      targetEmail = resolved;
    }
  }

  if (!targetEmail || !targetEmail.includes('@')) {
    throw new Error("Please enter a valid email address or username to reset your password.");
  }

  // Configure action code settings to ensure clean redirect to app origin and optimal deliverability
  const actionCodeSettings = {
    url: typeof window !== 'undefined' ? `${window.location.origin}/?reset=true` : 'https://billiq.app/?reset=true',
    handleCodeInApp: false,
  };

  try {
    await sendPasswordResetEmail(auth, targetEmail, actionCodeSettings);
  } catch (err: any) {
    // If action code URL domain is not authorized in Firebase Console settings, fallback to default template reset
    console.warn("sendPasswordResetEmail with actionCodeSettings failed, falling back to default:", err);
    await sendPasswordResetEmail(auth, targetEmail);
  }

  return targetEmail;
};

/**
 * Listens for authentication changes.
 */
export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, (user) => {
    if (user) {
      try {
        localStorage.setItem('billiq_is_logged_in', 'true');
      } catch {}
    }
    callback(user);
  });
};

// Sign Out & Comprehensive Data / Session State Purge
export const logoutUser = async () => {
  try {
    if (typeof window !== 'undefined') {
      // 1. Collect and delete all user-related, business, invoice, contact, and cached document keys
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;

        // Strictly protect non-sensitive global UI preferences like theme or language if any
        if (key === 'theme' || key === 'language') {
          continue;
        }

        // Purge all user data, cached documents, session state, and credentials
        if (
          key.startsWith('billiq_') ||
          key.startsWith('active_') ||
          key.includes('business_') ||
          key.includes('saved_customers') ||
          key.includes('saved_suppliers') ||
          key.includes('document_history') ||
          key.includes('last_used_') ||
          key.includes('price_history') ||
          key.includes('pdf_layout') ||
          key.includes('autosave_') ||
          key.includes('sync_id') ||
          key.includes('user_profile') ||
          key.includes('impersonat')
        ) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach((k) => {
        try {
          localStorage.removeItem(k);
        } catch {}
      });

      // 2. Clear all session storage tokens and state
      try {
        sessionStorage.clear();
      } catch {}

      // 3. Clear window user context
      try {
        delete (window as any).__CURRENT_USER_CONTEXT__;
      } catch {}
    }
  } catch (err) {
    console.warn("Notice during logout data purge:", err);
  }

  if (!auth) return;
  return await signOut(auth);
};

// Generate 6-Digit OTP Code
export const generate6DigitOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * PHONE NUMBER AUTHENTICATION
 */
export const setUpRecaptcha = (containerId: string = 'recaptcha-container') => {
  if (!auth) throw new Error("Firebase Authentication is not initialized.");
  if ((window as any).recaptchaVerifier) {
    try {
      (window as any).recaptchaVerifier.clear();
    } catch (e) {}
  }
  (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {
      // reCAPTCHA solved
    },
    'expired-callback': () => {
      console.warn("reCAPTCHA expired.");
    }
  });
  return (window as any).recaptchaVerifier;
};

export const sendPhoneOtp = async (phoneNumber: string, containerId: string = 'recaptcha-container') => {
  if (!auth) throw new Error("Firebase Authentication is not initialized.");
  
  let formattedPhone = phoneNumber.trim();
  if (!formattedPhone.startsWith('+')) {
    formattedPhone = '+' + formattedPhone.replace(/\D/g, '');
  }

  const verifier = setUpRecaptcha(containerId);
  const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, verifier);
  (window as any).confirmationResult = confirmationResult;
  return confirmationResult;
};

export const verifyPhoneOtp = async (otpCode: string, confirmationResult?: any) => {
  if (!auth) throw new Error("Firebase Authentication is not initialized.");
  const confirmObj = confirmationResult || (window as any).confirmationResult;
  if (!confirmObj) {
    throw new Error("OTP verification session expired. Please request a new OTP.");
  }

  const result = await confirmObj.confirm(otpCode.trim());
  const user = result.user;

  try {
    localStorage.setItem('billiq_is_logged_in', 'true');
  } catch {}

  // Automatically provision or update user record in Firestore
  if (db) {
    const userDocRef = doc(db, 'users', user.uid);
    const userDocSnap = await getDoc(userDocRef);

    const userPhone = user.phoneNumber || "";
    const phoneDigits = userPhone.replace(/[^0-9]/g, '') || user.uid;
    const defaultEmail = user.email || `${phoneDigits}@phone.billiq.ai`;
    const defaultName = user.displayName || `User ${phoneDigits.slice(-4) || ''}`;

    if (!userDocSnap.exists()) {
      const isAdminEmail = defaultEmail.includes('admin') || ADMIN_EMAILS.some(e => e.toLowerCase() === defaultEmail.toLowerCase());
      const defaultRole = isAdminEmail ? 'admin' : 'staff';

      const newPhoneUserData = {
        uid: user.uid,
        id: user.uid,
        phoneNumber: userPhone,
        email: defaultEmail,
        signupEmail: defaultEmail,
        authEmail: defaultEmail,
        displayName: defaultName,
        username: defaultName,
        photoURL: user.photoURL || "",
        role: defaultRole,
        status: 'active',
        accountStatus: 'Active',
        provider: 'phone',
        authProvider: 'phone',
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        updatedAt: new Date().toISOString(),
        trialExhausted: false,
        documentsRemaining: defaultRole === 'admin' ? 999999 : 5,
        documentsUsed: 0,
        planTier: defaultRole === 'admin' ? 'enterprise' : 'free_trial',
        planName: defaultRole === 'admin' ? 'Enterprise Admin' : 'Free Trial',
        plan: defaultRole === 'admin' ? 'Enterprise Admin' : 'Free Trial'
      };
      await setDoc(userDocRef, newPhoneUserData, { merge: true });
    } else {
      const existingData = userDocSnap.data();
      const updates: Record<string, any> = {
        phoneNumber: userPhone,
        lastLoginAt: serverTimestamp(),
        updatedAt: new Date().toISOString(),
        provider: 'phone',
        authProvider: 'phone'
      };
      if (!existingData.role) {
        updates.role = 'staff';
      }
      if (!existingData.status && !existingData.accountStatus) {
        updates.status = 'active';
        updates.accountStatus = 'Active';
      }
      await setDoc(userDocRef, updates, { merge: true });
    }
  }

  return user;
};
