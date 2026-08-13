import { auth } from "../services/firebase";

function getRefHistoryKey(key: string, userId?: string | null): string {
  const activeUid = userId || (auth?.currentUser?.uid) || (typeof window !== "undefined" && (window as any).__CURRENT_USER_CONTEXT__?.userId) || null;
  return activeUid ? `billiq_user_${activeUid}_ref_history_${key}` : `billiq_guest_ref_history_${key}`;
}

export function getReferenceHistory(key: string, defaultOptions: string[] = [], userId?: string | null): string[] {
  try {
    const fullKey = getRefHistoryKey(key, userId);
    const raw = localStorage.getItem(fullKey);

    const saved: string[] = raw ? JSON.parse(raw) : [];
    // Combine saved and defaultOptions, preserving order and removing duplicates
    const combined = Array.from(new Set([...saved, ...defaultOptions].filter(Boolean)));
    return combined;
  } catch (e) {
    return defaultOptions;
  }
}

export function saveReferenceValue(key: string, value: string, userId?: string | null): void {
  if (!value || !value.trim()) return;
  const trimmed = value.trim();
  try {
    const fullKey = getRefHistoryKey(key, userId);
    const current = getReferenceHistory(key, [], userId);
    // Move newest entry to the top, cap at 40 items
    const updated = [trimmed, ...current.filter(item => typeof item === 'string' && item.toLowerCase() !== trimmed.toLowerCase())].slice(0, 40);
    localStorage.setItem(fullKey, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to save reference value to history:", e);
  }
}

export function removeReferenceValue(key: string, valueToRemove: string, userId?: string | null): string[] {
  try {
    const fullKey = getRefHistoryKey(key, userId);
    const current = getReferenceHistory(key, [], userId);
    const updated = current.filter(item => item !== valueToRemove);
    localStorage.setItem(fullKey, JSON.stringify(updated));
    return updated;
  } catch (e) {
    return [];
  }
}

export function seedReferenceHistoryFromDocumentHistory(documents: any[], userId?: string | null): void {
  if (!Array.isArray(documents) || documents.length === 0) return;

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
    'countryOfDestination'
  ];

  fields.forEach(field => {
    documents.forEach(doc => {
      const val = doc[field];
      if (typeof val === 'string' && val.trim()) {
        saveReferenceValue(field, val, userId);
      }
    });
  });
}
