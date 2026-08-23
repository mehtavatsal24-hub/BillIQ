/**
 * Local Trial Ledger Service
 * Tracks user document quotas and credit ledgers using browser localStorage.
 */

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

export function incrementLocalUserDocCount(userId?: string): number {
  const current = getLocalUserDocCount(userId);
  const next = current + 1;
  setLocalUserDocCount(userId, next);
  return next;
}

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

export function getEmailKey(email: string): string {
  if (!email) return "unknown";
  return email.trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, "_");
}

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
  const localCount = getLocalUserDocCount(userId);
  return Promise.resolve({
    isNewLedger: false,
    trialUsed: true,
    trialExhausted: false,
    documentsRemaining: 999999,
    documentsUsed: localCount,
    lifetimeCreatedCount: localCount,
    planTier: "enterprise",
    planName: "Enterprise Admin",
    isReRegisteredUser: false,
  });
}

export async function updateTrialLedger(
  email: string,
  updates: Partial<TrialLedgerData>
): Promise<void> {
  const cleanEmail = (email || "").trim().toLowerCase();
  if (!cleanEmail || typeof window === "undefined" || !window.localStorage) return;
  try {
    const key = `billiq_trial_ledger_${getEmailKey(cleanEmail)}`;
    const existingRaw = localStorage.getItem(key);
    let existing = {};
    if (existingRaw) {
      try { existing = JSON.parse(existingRaw) || {}; } catch {}
    }
    localStorage.setItem(key, JSON.stringify({ ...existing, ...updates, updatedAt: new Date().toISOString() }));
  } catch (e) {}
}

export async function adminGrantTrialCredits(
  userId: string,
  email: string,
  additionalCredits: number = 5,
  newPlanTier?: string,
  adminEmail?: string
): Promise<{ newRemaining: number; newTier: string; totalGranted: number }> {
  return { newRemaining: 999999, newTier: newPlanTier || "enterprise", totalGranted: 999999 };
}

export async function consumeUserDocumentCredit(
  userId: string,
  email: string
): Promise<{ remaining: number; exhausted: boolean; lifetimeCreatedCount: number }> {
  const localLifetime = incrementLocalUserDocCount(userId);
  return { remaining: 999999, exhausted: false, lifetimeCreatedCount: localLifetime };
}

export async function deleteTrialLedger(email: string): Promise<boolean> {
  const cleanEmail = (email || "").trim().toLowerCase();
  if (!cleanEmail || typeof window === "undefined" || !window.localStorage) return false;
  try {
    const key = `billiq_trial_ledger_${getEmailKey(cleanEmail)}`;
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    return false;
  }
}
