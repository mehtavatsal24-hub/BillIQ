import { saveToCloud, loadFromCloud } from "./dbService";

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  isError: boolean;
  category: "document" | "settings" | "sync" | "auth" | "system" | "ui";
  severity?: "info" | "warning" | "error";
  errorMessage?: string;
  errorStack?: string;
  userId?: string;
  userEmail?: string;
  screen?: string;
}

export const logUserActivity = async (
  userId: string | undefined,
  action: string,
  details: string,
  isError: boolean = false,
  category: "document" | "settings" | "sync" | "auth" | "system" | "ui" = "system",
  extraData?: {
    severity?: "info" | "warning" | "error";
    errorMessage?: string;
    errorStack?: string;
    userEmail?: string;
    screen?: string;
  }
) => {
  if (!userId) return;

  const newLog: AuditLogEntry = {
    id: "log_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
    timestamp: new Date().toISOString(),
    action,
    details,
    isError,
    category,
    severity: extraData?.severity || (isError ? "error" : "info"),
    errorMessage: extraData?.errorMessage,
    errorStack: extraData?.errorStack,
    userId,
    userEmail: extraData?.userEmail,
    screen: extraData?.screen,
  };

  // 1. Save to LocalStorage (fast, offline-first)
  const key = `audit_logs_${userId}`;
  try {
    const existing = localStorage.getItem(key);
    const logs: AuditLogEntry[] = existing ? JSON.parse(existing) : [];
    logs.unshift(newLog);
    const trimmed = logs.slice(0, 100);
    localStorage.setItem(key, JSON.stringify(trimmed));
  } catch (e) {
    console.error("Failed to store local log", e);
  }
};

export const logErrorEvent = async (
  userId: string | undefined,
  userEmail: string | undefined,
  screenName: string,
  actionName: string,
  error: unknown,
  category: "document" | "settings" | "sync" | "auth" | "system" | "ui" = "ui"
) => {
  try {
    const errMsg = error instanceof Error ? error.message : typeof error === "string" ? error : JSON.stringify(error);
    const errStack = error instanceof Error ? error.stack : undefined;

    const details = `[${screenName}] ${actionName} failed: ${errMsg}`;

    await logUserActivity(
      userId,
      actionName,
      details,
      true,
      category,
      {
        severity: "error",
        errorMessage: errMsg,
        errorStack: errStack,
        userEmail,
        screen: screenName,
      }
    );
  } catch (e) {
    // Fail silently to avoid secondary logging errors
  }
};

export const getUserAuditLogs = (userId: string): AuditLogEntry[] => {
  const key = `audit_logs_${userId}`;
  try {
    const existing = localStorage.getItem(key);
    return existing ? JSON.parse(existing) : [];
  } catch (e) {
    return [];
  }
};

