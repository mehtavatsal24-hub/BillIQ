import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { handleFirestoreError, OperationType } from "./dbService";

export interface TrialLedgerData {
  email: string;
  trialUsed: boolean;
  trialExhausted?: boolean;
  documentsRemaining: number;
  documentsUsed: number;
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
export async function getOrCreateTrialLedger(email: string, userId: string): Promise<{
  isNewLedger: boolean;
  trialUsed: boolean;
  trialExhausted: boolean;
  documentsRemaining: number;
  documentsUsed: number;
  planTier: string;
  planName: string;
  isReRegisteredUser: boolean;
}> {
  const cleanEmail = (email || "").trim().toLowerCase();
  if (!cleanEmail) {
    return {
      isNewLedger: false,
      trialUsed: true,
      trialExhausted: true,
      documentsRemaining: 0,
      documentsUsed: 0,
      planTier: "expired",
      planName: "Trial Expired",
      isReRegisteredUser: false,
    };
  }

  const emailKey = getEmailKey(cleanEmail);
  if (!db) {
    return {
      isNewLedger: true,
      trialUsed: true,
      trialExhausted: false,
      documentsRemaining: 5,
      documentsUsed: 0,
      planTier: "free-trial",
      planName: "Free Trial",
      isReRegisteredUser: false,
    };
  }

  const ledgerRef = doc(db, "trialLedgers", emailKey);

  try {
    const ledgerSnap = await getDoc(ledgerRef);

    if (!ledgerSnap.exists()) {
      // First time EVER for this email address!
      const now = new Date().toISOString();
      const newLedger: TrialLedgerData = {
        email: cleanEmail,
        trialUsed: true,
        trialExhausted: false,
        documentsRemaining: 5,
        documentsUsed: 0,
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
        trialExhausted: false,
        documentsRemaining: 5,
        documentsUsed: 0,
        planTier: "free-trial",
        planName: "Free Trial",
        isReRegisteredUser: false,
      };
    } else {
      // Ledger document ALREADY EXISTS for this email address!
      const data = ledgerSnap.data() as TrialLedgerData;
      const isPaid = data.planTier === "pro" || data.planTier === "enterprise";
      const rem = data.documentsRemaining !== undefined ? data.documentsRemaining : 0;
      const isExhausted = data.trialExhausted === true || (!isPaid && (rem <= 0 || data.planTier === "expired"));

      // Ensure trialExhausted is permanently persisted in the ledger if exhausted
      if (isExhausted && data.trialExhausted !== true) {
        try {
          await setDoc(ledgerRef, {
            trialExhausted: true,
            documentsRemaining: 0,
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
        documentsUsed: data.documentsUsed || 0,
        planTier: isPaid ? data.planTier : (isExhausted ? "expired" : (rem > 0 ? "free-trial" : "expired")),
        planName: isPaid ? data.planName || data.planTier : (isExhausted ? "Trial Expired" : (rem > 0 ? "Free Trial" : "Trial Expired")),
        isReRegisteredUser: true,
      };
    }
  } catch (error) {
    console.warn("Trial ledger check error, defaulting gracefully:", error);
    return {
      isNewLedger: true,
      trialUsed: true,
      trialExhausted: false,
      documentsRemaining: 5,
      documentsUsed: 0,
      planTier: "free-trial",
      planName: "Free Trial",
      isReRegisteredUser: false,
    };
  }
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
 * their user profile and permanent trial ledger.
 */
export async function adminGrantTrialCredits(
  userId: string,
  email: string,
  additionalCredits: number,
  newPlanTier?: string
): Promise<{ newRemaining: number; newTier: string }> {
  const cleanEmail = (email || "").trim().toLowerCase();
  if (!db) return { newRemaining: additionalCredits, newTier: newPlanTier || "free-trial" };

  const emailKey = getEmailKey(cleanEmail);
  const ledgerRef = doc(db, "trialLedgers", emailKey);
  const userRef = doc(db, "users", userId);

  let currentRemaining = 0;
  let currentTier = "free-trial";

  try {
    const snap = await getDoc(ledgerRef);
    if (snap.exists()) {
      const data = snap.data();
      currentRemaining = data.documentsRemaining || 0;
      currentTier = data.planTier || "free-trial";
    }
  } catch (e) {
    // ignore
  }

  const updatedRemaining = Math.max(0, currentRemaining + additionalCredits);
  const updatedTier = newPlanTier || (updatedRemaining > 0 ? "free-trial" : "expired");
  const updatedPlanName = updatedTier === "pro" ? "Pro Plan" : updatedTier === "enterprise" ? "Enterprise" : (updatedRemaining > 0 ? "Free Trial" : "Trial Expired");

  const isPaid = updatedTier === "pro" || updatedTier === "enterprise";
  const isExhausted = !isPaid && updatedRemaining <= 0;

  const ledgerPayload = {
    email: cleanEmail,
    trialExhausted: isExhausted,
    documentsRemaining: isPaid ? 999999 : updatedRemaining,
    planTier: updatedTier,
    planName: updatedPlanName,
    updatedAt: new Date().toISOString(),
  };

  const userPayload = {
    trialExhausted: isExhausted,
    documentsRemaining: isPaid ? 999999 : updatedRemaining,
    plan: updatedPlanName,
    planTier: updatedTier,
    planName: updatedPlanName,
    updatedAt: new Date().toISOString(),
  };

  await Promise.all([
    setDoc(ledgerRef, ledgerPayload, { merge: true }),
    setDoc(userRef, userPayload, { merge: true }),
  ]);

  return { newRemaining: updatedRemaining, newTier: updatedTier };
}
