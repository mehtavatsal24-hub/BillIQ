import { doc, setDoc, onSnapshot, collection, query, limit, updateDoc, deleteDoc, getDocs } from "firebase/firestore";
import { db, auth } from "./firebase";
import { isTransientOrShutdownError } from "./dbService";

export interface AppErrorLog {
  id: string;
  errorSummary: string;
  rawError: string;
  affectedUserEmail: string;
  userId: string;
  pageRoute: string;
  action: string;
  timestamp: string;
  status: "active" | "resolved";
  occurrenceCount: number;
  resolvedAt?: string;
}

/**
 * Checks if an error is a known internal SDK / infrastructure or transient network notice
 * that should never be written back to Firestore to prevent recursive assertion loops.
 */
export function isIgnoredInfrastructureError(raw: unknown): boolean {
  if (!raw) return false;
  const errStr = raw instanceof Error 
    ? `${raw.message} ${raw.stack || ""}` 
    : typeof raw === "string" 
    ? raw 
    : JSON.stringify(raw);

  const lower = errStr.toLowerCase();

  return (
    lower.includes("internal assertion failed") ||
    lower.includes("unexpected state") ||
    lower.includes("@firebase/firestore") ||
    lower.includes("websocket closed without opened") ||
    lower.includes("websocket") ||
    lower.includes("could not reach cloud firestore backend") ||
    lower.includes("code=unavailable") ||
    lower.includes("unavailable") ||
    lower.includes("network-connection-lost") ||
    lower.includes("failed-precondition") ||
    lower.includes("b815") ||
    lower.includes("ca9")
  );
}

/**
 * Translates raw technical stack traces & error messages into simple, plain-English summaries
 */
export function translateToPlainEnglish(raw: unknown, defaultAction: string = "system"): string {
  const errStr = raw instanceof Error ? raw.message : typeof raw === "string" ? raw : JSON.stringify(raw || "");
  const lower = errStr.toLowerCase();

  if (lower.includes("cannot read properties of undefined") || lower.includes("cannot read property")) {
    return "Failed to load or access missing invoice properties or line items";
  }
  if (lower.includes("cannot read properties of null") || lower.includes("null is not an object")) {
    return "Attempted to process empty or uninitialized record data";
  }
  if (lower.includes("quota") || lower.includes("resource_exhausted") || lower.includes("429")) {
    return "Database query or API rate limit reached for system operation";
  }
  if (lower.includes("permission-denied") || lower.includes("insufficient permissions")) {
    return "Database access permission error during user request";
  }
  if (lower.includes("networkerror") || lower.includes("failed to fetch") || lower.includes("network request failed")) {
    return "Network connection issue while communicating with backend service";
  }
  if (lower.includes("gemini") || lower.includes("failed to call")) {
    return "AI generation request failed to complete";
  }
  if (lower.includes("invalid document") || lower.includes("not found")) {
    return "Requested document or record could not be found in storage";
  }
  if (lower.includes("syntaxerror") || lower.includes("unexpected token")) {
    return "Failed to parse system JSON response format";
  }
  if (lower.includes("auth/user-not-found") || lower.includes("auth/wrong-password")) {
    return "User authentication credentials mismatch or failed login attempt";
  }
  if (lower.includes("ui component crash") || lower.includes("uncaught ui error")) {
    return "UI workspace element encountered an unexpected rendering exception";
  }

  // Clean raw string fallback
  const cleaned = errStr.replace(/^Uncaught\s+Error:\s*/i, "").trim();
  if (cleaned.length > 0 && cleaned.length <= 100) {
    return `System encountered issue: ${cleaned}`;
  }

  return `Application encountered an error during ${defaultAction.toLowerCase()}`;
}

/**
 * Formats timestamps into human-readable relative time string ("2 mins ago", "1 hour ago", etc.)
 */
export function getRelativeTimeString(timestampInput: string | number): string {
  if (!timestampInput) return "Recently";
  const dateNum = typeof timestampInput === "number" ? timestampInput : new Date(timestampInput).getTime();
  if (isNaN(dateNum)) return "Recently";

  const diffMs = Date.now() - dateNum;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 45) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min${diffMin === 1 ? "" : "s"} ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hr${diffHr === 1 ? "" : "s"} ago`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;

  return new Date(dateNum).toLocaleDateString();
}

const LOCAL_STORAGE_ERROR_KEY = "bill_iq_error_logs";

// In-Memory array fallback for active session logs
let inMemoryErrorLogs: AppErrorLog[] = [];

function getLocalErrorLogs(): AppErrorLog[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_ERROR_KEY);
    const stored = raw ? JSON.parse(raw) : [];
    if (stored.length > 0) {
      inMemoryErrorLogs = stored;
    }
    return inMemoryErrorLogs;
  } catch {
    return inMemoryErrorLogs;
  }
}

function saveLocalErrorLogs(logs: AppErrorLog[]) {
  try {
    inMemoryErrorLogs = logs.slice(0, 100);
    localStorage.setItem(LOCAL_STORAGE_ERROR_KEY, JSON.stringify(inMemoryErrorLogs));
  } catch {
    // In-memory array fallback works even if localStorage is blocked
  }
}

// Circuit breaker flag to prevent infinite recursive logging loops
let isReportingError = false;
let lastReportTime = 0;

/**
 * Reports a new or recurring error incident to Firestore `errorLogs` collection
 * with strict filtering and circuit breaker protection against recursive loops.
 */
export async function reportApplicationError(params: {
  rawError: unknown;
  pageRoute?: string;
  action?: string;
  userId?: string;
  userEmail?: string;
}): Promise<void> {
  const errStr = params.rawError instanceof Error 
    ? `${params.rawError.message}\n${params.rawError.stack || ""}` 
    : typeof params.rawError === "string" 
    ? params.rawError 
    : JSON.stringify(params.rawError || {});

  const lower = errStr.toLowerCase();

  // Return immediately if error message contains INTERNAL ASSERTION FAILED, WebSocket, or ca9
  if (
    errStr.includes("INTERNAL ASSERTION FAILED") ||
    errStr.includes("WebSocket") ||
    errStr.includes("ca9") ||
    lower.includes("internal assertion failed") ||
    lower.includes("websocket") ||
    lower.includes("ca9") ||
    isIgnoredInfrastructureError(params.rawError) ||
    isTransientOrShutdownError(params.rawError)
  ) {
    return;
  }

  // Circuit breaker: prevent recursive loops
  if (isReportingError) {
    return;
  }

  // Rate limiter: maximum 1 error report per 200ms
  const now = Date.now();
  if (now - lastReportTime < 200) {
    return;
  }

  isReportingError = true;
  lastReportTime = now;

  try {
    const currentAuthUser = auth?.currentUser;
    const userCtx = (window as any).__CURRENT_USER_CONTEXT__ || {};

    const userId = params.userId || currentAuthUser?.uid || userCtx.userId || "anonymous_user";
    const userEmail = params.userEmail || currentAuthUser?.email || userCtx.userEmail || "Unauthenticated / System";
    const pageRoute = params.pageRoute || userCtx.pageRoute || "Workspace View";
    const action = params.action || "User Operation";

    const errorSummary = translateToPlainEnglish(params.rawError, action);

    // Create a deterministic signature id to group duplicate occurrences
    const sigKey = (errorSummary + "_" + userId + "_" + pageRoute).replace(/[^a-zA-Z0-9_]/g, "_").substring(0, 64);
    const docId = `err_${sigKey}`;

    const existingLogs = getLocalErrorLogs();
    const existingIndex = existingLogs.findIndex(l => l.id === docId && l.status === "active");
    const nowIso = new Date().toISOString();

    let newCount = 1;
    if (existingIndex >= 0) {
      newCount = (existingLogs[existingIndex].occurrenceCount || 1) + 1;
    }

    const errorRecord: AppErrorLog = {
      id: docId,
      errorSummary,
      rawError: errStr,
      affectedUserEmail: userEmail,
      userId,
      pageRoute,
      action,
      timestamp: nowIso,
      status: "active",
      occurrenceCount: newCount
    };

    // Always update In-Memory & Local Cache first
    if (existingIndex >= 0) {
      existingLogs[existingIndex] = errorRecord;
    } else {
      existingLogs.unshift(errorRecord);
    }
    saveLocalErrorLogs(existingLogs);

    // Safely attempt Firestore sync without leaking exceptions
    if (db) {
      const logDocRef = doc(db, "errorLogs", docId);
      await setDoc(logDocRef, errorRecord, { merge: true }).catch(() => {
        // Silent fallback to in-memory state if Firestore fails or is offline
      });
    }
  } catch {
    // Silent catch to prevent any error logging exception from surfacing
  } finally {
    isReportingError = false;
  }
}

/**
 * Clears all error logs from local memory, localStorage, and Firestore collection
 */
export async function clearAllErrorLogs(): Promise<void> {
  try {
    inMemoryErrorLogs = [];
    localStorage.removeItem(LOCAL_STORAGE_ERROR_KEY);

    if (db) {
      const errorLogsCol = collection(db, "errorLogs");
      const snapshot = await getDocs(query(errorLogsCol, limit(200))).catch(() => null);
      if (snapshot && !snapshot.empty) {
        const batchDeletes = snapshot.docs.map(d => deleteDoc(doc(db, "errorLogs", d.id)).catch(() => {}));
        await Promise.all(batchDeletes);
      }
    }
  } catch {
    // Silent catch
  }
}

/**
 * Marks an error as resolved in Firestore and local cache
 */
export async function resolveErrorInCloud(logId: string): Promise<void> {
  try {
    const logs = getLocalErrorLogs();
    const target = logs.find(l => l.id === logId);
    if (target) {
      target.status = "resolved";
      target.resolvedAt = new Date().toISOString();
      saveLocalErrorLogs(logs);
    }

    if (db) {
      const docRef = doc(db, "errorLogs", logId);
      await updateDoc(docRef, {
        status: "resolved",
        resolvedAt: new Date().toISOString()
      }).catch(async () => {
        await setDoc(docRef, { status: "resolved", resolvedAt: new Date().toISOString() }, { merge: true }).catch(() => {});
      });
    }
  } catch {
    // Silent catch
  }
}

/**
 * Real-time listener for Admin Dashboard Error Panel with graceful in-memory fallback
 */
export function subscribeToErrorLogs(onUpdate: (logs: AppErrorLog[]) => void): () => void {
  // Pass initial cached logs immediately
  onUpdate(getLocalErrorLogs());

  if (!db) {
    return () => {};
  }

  try {
    const errorLogsCol = collection(db, "errorLogs");
    const q = query(errorLogsCol, limit(100));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedLogs: AppErrorLog[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data()
        } as AppErrorLog));

        if (fetchedLogs.length > 0) {
          saveLocalErrorLogs(fetchedLogs);
          onUpdate(fetchedLogs);
        } else {
          onUpdate(getLocalErrorLogs());
        }
      },
      () => {
        // Fallback silently to in-memory/local error logs on connection drop or assertion error
        onUpdate(getLocalErrorLogs());
      }
    );

    return unsubscribe;
  } catch {
    return () => {};
  }
}

