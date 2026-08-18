import { auth } from "../services/firebase";

export function getActiveUserId(userId?: string | null): string | null {
  if (userId && typeof userId === "string" && userId.trim()) {
    return userId.trim();
  }
  if (auth?.currentUser?.uid) {
    return auth.currentUser.uid;
  }
  if (typeof window !== "undefined") {
    const ctx = (window as any).__CURRENT_USER_CONTEXT__;
    if (ctx && ctx.userId && typeof ctx.userId === "string" && ctx.userId.trim()) {
      return ctx.userId.trim();
    }
  }
  return null;
}

export function getRefHistoryKey(key: string, userId?: string | null): string | null {
  const activeUid = getActiveUserId(userId);
  if (!activeUid) return null;
  return `billiq_user_${activeUid}_ref_history_${key}`;
}

export function getReferenceHistory(key: string, defaultOptions: string[] = [], userId?: string | null): string[] {
  try {
    const fullKey = getRefHistoryKey(key, userId);
    if (!fullKey) return []; // STRICT: If no active user session, never return recommendations

    const raw = localStorage.getItem(fullKey);
    if (!raw) return []; // STRICT: If user is new / has no saved history for this key, return empty array

    const saved: string[] = JSON.parse(raw);
    if (!Array.isArray(saved)) return [];

    return saved.filter(item => typeof item === "string" && item.trim().length > 0);
  } catch (e) {
    return [];
  }
}

export function saveReferenceValue(key: string, value: string, userId?: string | null): void {
  if (!value || !value.trim()) return;
  const trimmed = value.trim();
  try {
    const fullKey = getRefHistoryKey(key, userId);
    if (!fullKey) return; // STRICT: Do not save if unauthenticated
    
    const raw = localStorage.getItem(fullKey);
    const current: string[] = raw ? JSON.parse(raw) : [];
    const validCurrent = Array.isArray(current) ? current : [];
    
    // Move newest entry to the top, deduplicate case-insensitively, cap at 50 items
    const updated = [
      trimmed, 
      ...validCurrent.filter(item => typeof item === 'string' && item.toLowerCase().trim() !== trimmed.toLowerCase())
    ].slice(0, 50);
    
    localStorage.setItem(fullKey, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to save reference value to history:", e);
  }
}

export function removeReferenceValue(key: string, valueToRemove: string, userId?: string | null): string[] {
  try {
    const fullKey = getRefHistoryKey(key, userId);
    if (!fullKey) return [];
    
    const raw = localStorage.getItem(fullKey);
    const current: string[] = raw ? JSON.parse(raw) : [];
    const validCurrent = Array.isArray(current) ? current : [];
    
    const updated = validCurrent.filter(item => item !== valueToRemove);
    localStorage.setItem(fullKey, JSON.stringify(updated));
    return updated;
  } catch (e) {
    return [];
  }
}

export function clearUserReferenceHistory(userId?: string | null): void {
  const activeUid = getActiveUserId(userId);
  if (!activeUid) return;
  try {
    const prefix = `billiq_user_${activeUid}_ref_history_`;
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(prefix)) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
  } catch (e) {}
}

export function seedReferenceHistoryFromDocumentHistory(documents: any[], userId?: string | null): void {
  const activeUid = getActiveUserId(userId);
  if (!activeUid || !Array.isArray(documents) || documents.length === 0) return;

  const fields = [
    'poNumber',
    'paymentMode',
    'paymentTerms',
    'despatchDocNo',
    'transport',
    'finalDestination',
    'consigneeName',
    'consigneeGstin',
    'consigneeAddress',
    'preCarriageBy',
    'placeOfReceipt',
    'vesselFlightNo',
    'portOfLoading',
    'portOfDischarge',
    'countryOfOrigin',
    'countryOfDestination',
    'incotermNamedPlace',
    'incotermPortOfLoading',
    'incotermCountryOfOrigin',
    'incotermCountryOfDestination',
    'numberOfPackages',
    'reasonForTransportation'
  ];

  fields.forEach(field => {
    documents.forEach(doc => {
      if (!doc) return;
      // Top level
      const val1 = doc[field];
      if (typeof val1 === 'string' && val1.trim()) {
        saveReferenceValue(field, val1, activeUid);
      }
      // Nested fullData
      if (doc.fullData) {
        const val2 = doc.fullData[field];
        if (typeof val2 === 'string' && val2.trim()) {
          saveReferenceValue(field, val2, activeUid);
        }
      }
    });
  });
}

