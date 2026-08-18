import { auth } from "../services/firebase";

export const DEVELOPER_EMAIL = "mehtavatsal24@gmail.com";

/**
 * Checks if the specified email or currently logged in user is the developer (mehtavatsal24@gmail.com)
 */
export function isDeveloperAccount(userEmail?: string | null): boolean {
  if (userEmail && typeof userEmail === "string" && userEmail.toLowerCase().trim() === DEVELOPER_EMAIL) {
    return true;
  }
  const currentAuthEmail = auth?.currentUser?.email;
  if (currentAuthEmail && currentAuthEmail.toLowerCase().trim() === DEVELOPER_EMAIL) {
    return true;
  }
  const windowCtxEmail = (window as any).__CURRENT_USER_CONTEXT__?.userEmail;
  if (windowCtxEmail && typeof windowCtxEmail === "string" && windowCtxEmail.toLowerCase().trim() === DEVELOPER_EMAIL) {
    return true;
  }
  return false;
}

/**
 * Formats full technical details, error codes, and failure stack trace for developer account
 */
export function formatDetailedDeveloperError(error: any): string {
  if (!error) return "An error occurred. Please try again or contact support.";

  const code = error?.code || error?.status || error?.statusCode || "";
  const codeStr = code ? ` [Code: ${code}]` : "";
  const message = error instanceof Error ? error.message : typeof error === "string" ? error : error?.message || JSON.stringify(error || {});
  const stack = error?.stack ? `\nStack: ${error.stack}` : "";

  return `${message}${codeStr}${stack}`.trim() || "An error occurred. Please try again or contact support.";
}

export const GENERIC_USER_ERROR_MESSAGE = "An error occurred. Please try again or contact support.";
export const CLOUD_SYNC_ERROR_MESSAGE = "Connection issue. Changes saved locally and will sync once reconnected.";
export const PERMISSION_ERROR_MESSAGE = "Unable to complete request. Please check your permissions or try again.";
export const AI_GENERATION_ERROR_MESSAGE = "Unable to generate details at this moment. Please try again or fill in the fields manually.";
export const EXPORT_PDF_ERROR_MESSAGE = "Failed to generate document. Please check your inputs and try again.";

/**
 * Normalizes and sanitizes error messages:
 * - Developer Account (mehtavatsal24@gmail.com): Receives full detailed technical error message and failure stack.
 * - Standard Users/Visitors: Replaces internal developer terms, system codes, and raw exceptions with friendly, action-oriented guidance.
 */
export function getDisplayErrorMessage(
  error: any,
  userEmail?: string | null,
  fallbackMessage: string = GENERIC_USER_ERROR_MESSAGE
): string {
  if (isDeveloperAccount(userEmail)) {
    return formatDetailedDeveloperError(error);
  }

  if (!error) return fallbackMessage;

  const errStr = error instanceof Error ? error.message : typeof error === "string" ? error : error?.message || String(error);
  const lower = errStr.toLowerCase();
  const code = (error?.code || "").toLowerCase();

  // 1. Permission and Access Errors
  if (
    code.includes("permission-denied") ||
    code.includes("unauthorized") ||
    code.includes("unauthenticated") ||
    code.includes("access-denied") ||
    lower.includes("permission-denied") ||
    lower.includes("insufficient permission") ||
    lower.includes("not authorized") ||
    lower.includes("forbidden")
  ) {
    return PERMISSION_ERROR_MESSAGE;
  }

  // 2. Cloud Synchronization / Network / Storage / Database Quota Errors
  if (
    code.includes("resource-exhausted") ||
    code.includes("unavailable") ||
    code.includes("deadline-exceeded") ||
    code.includes("network-request-failed") ||
    lower.includes("firestore") ||
    lower.includes("firebase") ||
    lower.includes("subcollection") ||
    lower.includes("quota") ||
    lower.includes("quota_exceeded") ||
    lower.includes("resource_exhausted") ||
    lower.includes("networkerror") ||
    lower.includes("failed to fetch") ||
    lower.includes("econnreset") ||
    lower.includes("client is offline") ||
    lower.includes("localstorage") ||
    lower.includes("indexeddb") ||
    lower.includes("database") ||
    lower.includes("storage is full") ||
    lower.includes("write stream exhausted")
  ) {
    return CLOUD_SYNC_ERROR_MESSAGE;
  }

  // 3. AI / Gemini / Model Generation Errors
  if (
    lower.includes("gemini") ||
    lower.includes("generative") ||
    lower.includes("ai request") ||
    lower.includes("ai processing") ||
    lower.includes("ai model") ||
    lower.includes("429") ||
    lower.includes("rate limit") ||
    lower.includes("api key") ||
    lower.includes("token limit") ||
    lower.includes("candidates") ||
    lower.includes("safety")
  ) {
    return AI_GENERATION_ERROR_MESSAGE;
  }

  // 4. Export / PDF Rendering Errors
  if (
    lower.includes("jspdf") ||
    lower.includes("pdf generation") ||
    lower.includes("canvas") ||
    lower.includes("html2canvas") ||
    lower.includes("export error")
  ) {
    return EXPORT_PDF_ERROR_MESSAGE;
  }

  // 5. Check for any other technical runtime leakages
  const hasTechnicalLeakage =
    code.length > 0 ||
    lower.includes("auth/") ||
    lower.includes("500") ||
    lower.includes("502") ||
    lower.includes("503") ||
    lower.includes("504") ||
    lower.includes("stack") ||
    lower.includes("console") ||
    lower.includes("blaze") ||
    lower.includes("operation-not-allowed") ||
    lower.includes("billing-not-enabled") ||
    lower.includes("region policy") ||
    lower.includes("recaptcha") ||
    lower.includes("embedded preview") ||
    lower.includes("unexpected token") ||
    lower.includes("json") ||
    lower.includes("uncaught") ||
    lower.includes("object object");

  if (hasTechnicalLeakage) {
    return fallbackMessage && fallbackMessage !== GENERIC_USER_ERROR_MESSAGE ? fallbackMessage : GENERIC_USER_ERROR_MESSAGE;
  }

  // Preserve friendly non-technical form input validation strings
  if (errStr && errStr.length < 120 && !errStr.includes("Error:") && !errStr.includes("{") && !errStr.includes("[")) {
    return errStr;
  }

  return fallbackMessage;
}
