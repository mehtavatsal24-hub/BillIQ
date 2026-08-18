/**
 * Storage Utility with Quota Exceeded Protection and Auto-Pruning
 * Prevents DOMException: QuotaExceededError and app crashes when localStorage fills up.
 */

const PRUNABLE_KEY_PATTERNS = [
  "temp_",
  "draft_preview_",
  "billiq_autosave_draft",
  "autosave_draft",
  "_cache_",
  "recent_searches",
];

export function safeLocalStorageGet<T = any>(key: string, fallback: T): T {
  if (typeof window === "undefined" || !window.localStorage) {
    return fallback;
  }
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch (e) {
    console.warn(`[Storage Utility] Failed to parse key '${key}':`, e);
    return fallback;
  }
}

export function safeLocalStorageSet(key: string, value: any): boolean {
  if (typeof window === "undefined" || !window.localStorage) {
    return false;
  }

  const serialized = typeof value === "string" ? value : JSON.stringify(value);

  try {
    localStorage.setItem(key, serialized);
    return true;
  } catch (err: any) {
    const isQuota =
      err?.name === "QuotaExceededError" ||
      err?.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
      err?.code === 22 ||
      err?.code === 1014 ||
      (err?.message && String(err.message).toLowerCase().includes("quota"));

    if (isQuota) {
      console.warn(`[Storage Utility] LocalStorage quota exceeded while writing '${key}'. Attempting storage cleanup...`);
      const cleaned = pruneStorage(key);
      if (cleaned) {
        try {
          localStorage.setItem(key, serialized);
          return true;
        } catch (retryErr) {
          console.error(`[Storage Utility] Write failed after cleanup for key '${key}':`, retryErr);
        }
      }
    } else {
      console.error(`[Storage Utility] Unexpected error writing '${key}':`, err);
    }
    return false;
  }
}

export function safeLocalStorageRemove(key: string): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    localStorage.removeItem(key);
  } catch (e) {
    console.warn(`[Storage Utility] Failed to remove key '${key}':`, e);
  }
}

/**
 * Prunes temporary, draft, or oversized cached keys to recover storage space.
 */
function pruneStorage(criticalKey: string): boolean {
  try {
    const keysToRemove: string[] = [];

    // 1. Remove temporary and preview draft keys
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k !== criticalKey) {
        if (PRUNABLE_KEY_PATTERNS.some((pattern) => k.includes(pattern))) {
          keysToRemove.push(k);
        }
      }
    }

    keysToRemove.forEach((k) => {
      try {
        localStorage.removeItem(k);
      } catch {}
    });

    // 2. Compact document history keys if still tight on space
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.includes("document_history") && k !== criticalKey) {
        try {
          const raw = localStorage.getItem(k);
          if (raw) {
            const list = JSON.parse(raw);
            if (Array.isArray(list) && list.length > 30) {
              // Retain only latest 30 documents and strip massive base64 previews
              const compacted = list.slice(0, 30).map((doc: any) => {
                if (doc.fullData?.business?.letterhead && doc.fullData.business.letterhead.length > 50000) {
                  return {
                    ...doc,
                    fullData: {
                      ...doc.fullData,
                      business: { ...doc.fullData.business, letterhead: "" },
                    },
                  };
                }
                return doc;
              });
              localStorage.setItem(k, JSON.stringify(compacted));
            }
          }
        } catch {}
      }
    }

    return true;
  } catch (e) {
    console.error("[Storage Utility] Storage pruning failed:", e);
    return false;
  }
}
