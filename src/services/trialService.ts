import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "./firebase";
import { handleFirestoreError, OperationType } from "./dbService";

export interface TrialLedgerData {
  email: string;
  trialUsed: boolean;
  trialExhausted?: boolean;
  documentsRemaining: number;
  documentsUsed: number;
  lifetimeCreatedCount: number;
  totalGeneratedDocsCount?: number;
  planTier: string;
  planName: string;
  docQuota?: number;
  maxDocs?: number;
  firstCreatedUid?: string;
  isReRegisteredUser?: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Gets the persistent, immutable local document creation counter for a specific user ID.
 * Stored under localStorage key `billiq_user_<uid>_doc_count`.
 */
export function getLocalUserDocCount(userId?: string): number {
  if (typeof window === "undefined" || !window.localStorage) return 0;
  const uid = userId || "anonymous";
  try {
    const raw = localStorage.getItem(`billiq_user_${uid}_doc_count`);
    if (raw !== null) {
      const val = parseInt(raw, 10);
      return isNaN(val) ? 0 : Math.max(0, val);
    }
  } catch (e) {
    console.warn("Notice reading local user doc count:", e);
  }
  return 0;
}

/**
 * Sets the persistent local document creation counter.
 * Enforces increment-only protection: will never reduce an existing higher count.
 */
export function setLocalUserDocCount(userId: string | undefined, count: number): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  const uid = userId || "anonymous";
  try {
    const existing = getLocalUserDocCount(uid);
    const safeCount = Math.max(existing, count);
    localStorage.setItem(`billiq_user_${uid}_doc_count`, String(safeCount));
  } catch (e) {
    console.warn("Notice saving local user doc count:", e);
  }
}

/**
 * Increments the persistent local document creation counter by +1.
 */
export function incrementLocalUserDocCount(userId?: string): number {
  const current = getLocalUserDocCount(userId);
  const next = current + 1;
  setLocalUserDocCount(userId, next);
  return next;
}

/**
 * Returns the effective lifetime created document count for a user.
 * Decoupled from the active document history array so deletions cannot reduce the counter.
 * Uses the maximum of persistent counters, local storage, and history length.
 */
export function getEffectiveLifetimeDocCount(userProfile: any, userId?: string, historyCount?: number): number {
  const uid = userId || userProfile?.id || userProfile?.uid;
  const pLifetime = typeof userProfile?.lifetimeCreatedCount === "number" ? userProfile.lifetimeCreatedCount : (userProfile?.lifetimeCreatedCount ? Number(userProfile.lifetimeCreatedCount) : 0);
  const pGen = typeof userProfile?.totalGeneratedDocsCount === "number" ? userProfile.totalGeneratedDocsCount : (userProfile?.totalGeneratedDocsCount ? Number(userProfile.totalGeneratedDocsCount) : 0);
  const pUsed = typeof userProfile?.documentsUsed === "number" ? userProfile.documentsUsed : (userProfile?.documentsUsed ? Number(userProfile.documentsUsed) : 0);

  const fromHistory = typeof historyCount === "number" 
    ? historyCount 
    : (Array.isArray(userProfile?.history) ? userProfile.history.length : 0);
  const fromLocal = getLocalUserDocCount(uid);

  const finalCount = Math.max(pLifetime, pGen, pUsed, fromHistory, fromLocal);

  if (finalCount > fromLocal && uid) {
    setLocalUserDocCount(uid, finalCount);
  }
  return finalCount;
}

/**
 * Converts an email address into a safe lowercase document ID string
 * matching Firestore ID regex ^[a-zA-Z0-9_\-]+$
 */
export function getEmailKey(email: string): string {
  if (!email) return "unknown";
  return email.trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, "_");
}

/**
 * Checks or creates the permanent anti-abuse trial ledger doc in Firestore.
 * This collection persists independently of user profiles and survives user account deletions.
 */
export function getOrCreateTrialLedger(email: string, userId: string): Promise<{
  isNewLedger: boolean;
  trialUsed: boolean;
  trialExhausted: boolean;
  documentsRemaining: number;
  documentsUsed: number;
  lifetimeCreatedCount: number;
  planTier: string;
  planName: string;
  isReRegisteredUser: boolean;
}> {
  const cleanEmail = (email || "").trim().toLowerCase();
  if (!cleanEmail) {
    return Promise.resolve({
      isNewLedger: false,
      trialUsed: true,
      trialExhausted: true,
      documentsRemaining: 0,
      documentsUsed: 5,
      lifetimeCreatedCount: 5,
      planTier: "expired",
      planName: "Trial Expired",
      isReRegisteredUser: false,
    });
  }

  const emailKey = getEmailKey(cleanEmail);
  const localCount = getLocalUserDocCount(userId);
  if (!db) {
    return Promise.resolve({
      isNewLedger: true,
      trialUsed: true,
      trialExhausted: localCount >= 5,
      documentsRemaining: Math.max(0, 5 - localCount),
      documentsUsed: localCount,
      lifetimeCreatedCount: localCount,
      planTier: localCount >= 5 ? "expired" : "free-trial",
      planName: localCount >= 5 ? "Trial Expired" : "Free Trial",
      isReRegisteredUser: false,
    });
  }

  const ledgerRef = doc(db, "trialLedgers", emailKey);

  return (async () => {
    try {
      const ledgerSnap = await getDoc(ledgerRef);

      if (!ledgerSnap.exists()) {
        // First time EVER for this email address! Strictly grant 5 free documents
        const now = new Date().toISOString();
        const initialCount = 0;
        const initialRemaining = 5;
        const isExhausted = false;
        const newLedger: TrialLedgerData = {
          email: cleanEmail,
          trialUsed: true,
          trialExhausted: isExhausted,
          documentsRemaining: initialRemaining,
          documentsUsed: initialCount,
          lifetimeCreatedCount: initialCount,
          totalGeneratedDocsCount: initialCount,
          planTier: "free-trial",
          planName: "Free Trial",
          firstCreatedUid: userId,
          isReRegisteredUser: false,
          createdAt: now,
          updatedAt: now,
        };

        await setDoc(ledgerRef, newLedger);

        return {
          isNewLedger: true,
          trialUsed: true,
          trialExhausted: isExhausted,
          documentsRemaining: initialRemaining,
          documentsUsed: initialCount,
          lifetimeCreatedCount: initialCount,
          planTier: "free-trial",
          planName: "Free Trial",
          isReRegisteredUser: false,
        };
      } else {
        // Ledger document ALREADY EXISTS for this email address!
        const data = ledgerSnap.data() as TrialLedgerData;
        const isPaid = data.planTier === "pro" || data.planTier === "enterprise";
        const ledgerLifetime = data.lifetimeCreatedCount ?? data.totalGeneratedDocsCount ?? data.documentsUsed ?? 0;
        const effectiveLifetime = Math.max(ledgerLifetime, localCount);
        if (effectiveLifetime > localCount && userId) {
          setLocalUserDocCount(userId, effectiveLifetime);
        }
        const rem = data.documentsRemaining !== undefined ? data.documentsRemaining : Math.max(0, 5 + ((data as any).trialCreditsGranted || 0) - effectiveLifetime);
        const hasGrantedRemaining = rem > 0;
        const isExhausted = !isPaid && (!hasGrantedRemaining || (data.trialExhausted === true && rem <= 0) || (data.planTier === "expired" && rem <= 0));

        // Ensure trialExhausted is permanently persisted in the ledger if exhausted
        if (isExhausted && data.trialExhausted !== true && !hasGrantedRemaining) {
          try {
            await setDoc(ledgerRef, {
              trialExhausted: true,
              documentsRemaining: 0,
              lifetimeCreatedCount: effectiveLifetime,
              documentsUsed: effectiveLifetime,
              planTier: "expired",
              planName: "Trial Expired",
              updatedAt: new Date().toISOString()
            }, { merge: true });
          } catch (e) {
            // ignore error
          }
        }

        return {
          isNewLedger: false,
          trialUsed: true,
          trialExhausted: isPaid ? false : isExhausted,
          documentsRemaining: isPaid ? Infinity : (isExhausted ? 0 : rem),
          documentsUsed: effectiveLifetime,
          lifetimeCreatedCount: effectiveLifetime,
          planTier: isPaid ? data.planTier : (hasGrantedRemaining ? "free-trial" : (isExhausted ? "expired" : "free-trial")),
          planName: isPaid ? (data.planName || data.planTier) : (hasGrantedRemaining ? "Free Trial" : (isExhausted ? "Trial Expired" : "Free Trial")),
          isReRegisteredUser: hasGrantedRemaining ? false : (data.isReRegisteredUser || false),
        };
      }
    } catch (error) {
      console.warn("Trial ledger check error, defaulting gracefully:", error);
      return {
        isNewLedger: true,
        trialUsed: true,
        trialExhausted: localCount >= 5,
        documentsRemaining: Math.max(0, 5 - localCount),
        documentsUsed: localCount,
        lifetimeCreatedCount: localCount,
        planTier: localCount >= 5 ? "expired" : "free-trial",
        planName: localCount >= 5 ? "Trial Expired" : "Free Trial",
        isReRegisteredUser: false,
      };
    }
  })();
}

/**
 * Updates the trial ledger document in Firestore.
 */
export async function updateTrialLedger(
  email: string,
  updates: Partial<TrialLedgerData>
): Promise<void> {
  const cleanEmail = (email || "").trim().toLowerCase();
  if (!cleanEmail || !db) return;

  const emailKey = getEmailKey(cleanEmail);
  const ledgerRef = doc(db, "trialLedgers", emailKey);

  try {
    await setDoc(
      ledgerRef,
      {
        ...updates,
        email: cleanEmail,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `trialLedgers/${emailKey}`);
  }
}

/**
 * Grants additional trial credits or overrides plan tier for a user, updating both
 * their user profile and permanent trial ledger, and appending an audit log.
 */
export async function adminGrantTrialCredits(
  userId: string,
  email: string,
  additionalCredits: number = 5,
  newPlanTier?: string,
  adminEmail?: string
): Promise<{ newRemaining: number; newTier: string; totalGranted: number }> {
  const cleanEmail = (email || "").trim().toLowerCase();
  const emailKey = getEmailKey(cleanEmail);
  const now = new Date().toISOString();

  let currentRemaining = 0;
  let currentTier = "free-trial";
  let prevCreditsGranted = 0;
  let existingLogs: any[] = [];

  if (db) {
    const userRef = doc(db, "users", userId);
    const ledgerRef = doc(db, "trialLedgers", emailKey);

    try {
      const [userSnap, ledgerSnap] = await Promise.all([
        getDoc(userRef),
        getDoc(ledgerRef)
      ]);

      if (userSnap.exists()) {
        const uData = userSnap.data();
        currentRemaining = uData.documentsRemaining !== undefined ? uData.documentsRemaining : 0;
        currentTier = uData.planTier || uData.planName || "free-trial";
        prevCreditsGranted = uData.trialCreditsGranted || 0;
        existingLogs = Array.isArray(uData.overrideAuditLogs) ? uData.overrideAuditLogs : (Array.isArray(uData.overrideLogs) ? uData.overrideLogs : []);
      } else if (ledgerSnap.exists()) {
        const lData = ledgerSnap.data();
        currentRemaining = lData.documentsRemaining !== undefined ? lData.documentsRemaining : 0;
        currentTier = lData.planTier || "free-trial";
        prevCreditsGranted = (lData as any).trialCreditsGranted || 0;
      }
    } catch (e) {
      console.warn("Notice fetching user/ledger data during grant:", e);
    }

    const updatedRemaining = Math.max(0, currentRemaining + additionalCredits);
    const totalGranted = prevCreditsGranted + additionalCredits;
    
    // Maintain existing plan tier if it was pro/enterprise, otherwise keep as clean Free Trial
    let updatedTier = newPlanTier;
    if (!updatedTier) {
      if (currentTier === "pro" || currentTier === "enterprise") {
        updatedTier = currentTier;
      } else {
        updatedTier = updatedRemaining > 0 ? "free-trial" : "expired";
      }
    }

    const updatedPlanName = updatedTier === "pro" ? "Pro Plan" : updatedTier === "enterprise" ? "Enterprise" : (updatedRemaining > 0 ? "Free Trial" : "Trial Expired");
    const isPaid = updatedTier === "pro" || updatedTier === "enterprise";
    const isExhausted = !isPaid && updatedRemaining <= 0;

    const newAuditLog = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: now,
      action: "GRANT_CREDITS",
      detail: `Admin (${adminEmail || "Admin"}) granted +${additionalCredits} bonus trial credits (New remaining: ${updatedRemaining})`,
      adminEmail: adminEmail || "Admin",
      creditsAdded: additionalCredits,
      newRemaining: updatedRemaining
    };

    const updatedLogs = [newAuditLog, ...existingLogs].slice(0, 50);

    const docQuotaVal = isPaid ? 999999 : updatedRemaining;
    const maxDocsVal = isPaid ? 999999 : updatedRemaining;

    const ledgerPayload = {
      email: cleanEmail,
      trialExhausted: isExhausted,
      documentsRemaining: isPaid ? 999999 : updatedRemaining,
      trialCreditsGranted: totalGranted,
      docQuota: docQuotaVal,
      maxDocs: maxDocsVal,
      planTier: updatedTier,
      planName: updatedPlanName,
      updatedAt: now,
    };

    const userPayload = {
      trialExhausted: isExhausted,
      documentsRemaining: isPaid ? 999999 : updatedRemaining,
      trialCreditsGranted: totalGranted,
      docQuota: docQuotaVal,
      maxDocs: maxDocsVal,
      plan: updatedPlanName,
      planTier: updatedTier,
      planName: updatedPlanName,
      overrideAuditLogs: updatedLogs,
      updatedAt: now,
    };

    await Promise.all([
      setDoc(ledgerRef, ledgerPayload, { merge: true }),
      setDoc(userRef, userPayload, { merge: true }),
    ]);

    return { newRemaining: updatedRemaining, newTier: updatedTier, totalGranted };
  }

  return { newRemaining: additionalCredits, newTier: newPlanTier || "free-trial", totalGranted: additionalCredits };
}

/**
 * Decrements 1 document credit for a user when creating a new document or saving a 2nd+ edit.
 * Increments the lifetimeCreatedCount (+1) and updates local and cloud ledgers.
 */
export async function consumeUserDocumentCredit(
  userId: string,
  email: string
): Promise<{ remaining: number; exhausted: boolean; lifetimeCreatedCount: number }> {
  const cleanEmail = (email || "").trim().toLowerCase();
  const now = new Date().toISOString();

  if (!db || !userId) {
    const localLifetime = incrementLocalUserDocCount(userId);
    const isExhausted = localLifetime >= 5;
    return { remaining: Math.max(0, 5 - localLifetime), exhausted: isExhausted, lifetimeCreatedCount: localLifetime };
  }

  const userRef = doc(db, "users", userId);
  const emailKey = getEmailKey(cleanEmail);
  const ledgerRef = cleanEmail ? doc(db, "trialLedgers", emailKey) : null;

  try {
    const userSnap = await getDoc(userRef);
    let currentRemaining = 5;
    let currentUsed = 0;
    let currentTier = "free-trial";

    if (userSnap.exists()) {
      const uData = userSnap.data();
      const userLifetime = uData.lifetimeCreatedCount ?? uData.totalGeneratedDocsCount ?? uData.documentsUsed ?? 0;
      currentUsed = Math.max(userLifetime, getLocalUserDocCount(userId));
      currentRemaining = uData.documentsRemaining !== undefined ? uData.documentsRemaining : Math.max(0, 5 - currentUsed);
      currentTier = uData.planTier || uData.planName || "free-trial";
    } else {
      currentUsed = getLocalUserDocCount(userId);
      currentRemaining = Math.max(0, 5 - currentUsed);
    }

    if (currentTier === "pro" || currentTier === "enterprise") {
      return { remaining: 999999, exhausted: false, lifetimeCreatedCount: currentUsed };
    }

    const newLifetime = currentUsed + 1;
    const newRemaining = Math.max(0, currentRemaining - 1);
    const isExhausted = newRemaining <= 0;
    const newTier = isExhausted ? "expired" : "free-trial";
    const newPlanName = isExhausted ? "Trial Expired" : "Free Trial";

    setLocalUserDocCount(userId, newLifetime);

    const userUpdates: any = {
      documentsRemaining: newRemaining,
      documentsUsed: newLifetime,
      lifetimeCreatedCount: newLifetime,
      totalGeneratedDocsCount: newLifetime,
      trialExhausted: isExhausted,
      planTier: newTier,
      planName: newPlanName,
      plan: newPlanName,
      docQuota: newRemaining,
      maxDocs: newRemaining,
      updatedAt: now,
    };

    const promises: Promise<any>[] = [setDoc(userRef, userUpdates, { merge: true })];

    if (ledgerRef) {
      const ledgerUpdates = {
        email: cleanEmail,
        documentsRemaining: newRemaining,
        documentsUsed: newLifetime,
        lifetimeCreatedCount: newLifetime,
        totalGeneratedDocsCount: newLifetime,
        trialExhausted: isExhausted,
        planTier: newTier,
        planName: newPlanName,
        updatedAt: now,
      };
      promises.push(setDoc(ledgerRef, ledgerUpdates, { merge: true }));
    }

    await Promise.all(promises);
    return { remaining: newRemaining, exhausted: isExhausted, lifetimeCreatedCount: newLifetime };
  } catch (error) {
    console.warn("Notice consuming document credit:", error);
    const count = getLocalUserDocCount(userId);
    return { remaining: Math.max(0, 5 - count), exhausted: count >= 5, lifetimeCreatedCount: count };
  }
}

/**
 * Deletes the trial ledger entry for an email address from Firestore
 * so that when the user signs up again, they start completely fresh as a new user.
 */
export async function deleteTrialLedger(email: string): Promise<boolean> {
  const cleanEmail = (email || "").trim().toLowerCase();
  if (!cleanEmail || !db) return false;

  const emailKey = getEmailKey(cleanEmail);
  const ledgerRef = doc(db, "trialLedgers", emailKey);

  try {
    await deleteDoc(ledgerRef);
    return true;
  } catch (error) {
    console.warn(`Notice deleting trial ledger for ${emailKey}:`, error);
    return false;
  }
}

