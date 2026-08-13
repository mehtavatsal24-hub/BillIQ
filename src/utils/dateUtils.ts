import { DocumentType, DocumentHistoryItem } from "../types";

/**
 * Parses a date string (YYYY-MM-DD, DD-MM-YYYY, or ISO) or timestamp into a valid Date object.
 */
export function parseDateString(dateStr?: string, fallbackTimestamp?: number): Date {
  if (!dateStr || !dateStr.trim()) {
    if (fallbackTimestamp) return new Date(fallbackTimestamp);
    return new Date();
  }

  const trimmed = dateStr.trim();

  // Try parsing YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    const parts = trimmed.split("-");
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const parsed = new Date(year, month, day);
    if (!isNaN(parsed.getTime())) return parsed;
  }

  // Try parsing DD-MM-YYYY or DD/MM/YYYY
  if (/^\d{1,2}[-\/]\d{1,2}[-\/]\d{4}/.test(trimmed)) {
    const parts = trimmed.split(/[-\/]/);
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    const parsed = new Date(year, month, day);
    if (!isNaN(parsed.getTime())) return parsed;
  }

  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) return parsed;

  if (fallbackTimestamp) return new Date(fallbackTimestamp);
  return new Date();
}

/**
 * Calculates the exact due date for a given invoice date and payment terms.
 * Applies strictly to Tax Invoices or invoice types (returns invoice date for non-invoices).
 */
export function calculateDueDate(
  invoiceDateInput: string | Date | number,
  paymentTermsInput: string | undefined,
  docType?: string
): Date {
  const issueDate = invoiceDateInput instanceof Date 
    ? new Date(invoiceDateInput)
    : parseDateString(String(invoiceDateInput));

  if (isNaN(issueDate.getTime())) {
    return new Date();
  }

  // Strictly check docType if provided
  if (docType && docType !== DocumentType.TAX_INVOICE && docType !== "Tax Invoice") {
    return new Date(issueDate);
  }

  const terms = (paymentTermsInput || "").trim().toLowerCase();

  // If empty or instant presets ("Due on Receipt", "100% Advance", "Immediate", "Against Delivery")
  if (
    !terms ||
    terms.includes("due on receipt") ||
    terms.includes("100% advance") ||
    terms.includes("immediate") ||
    terms.includes("against delivery") ||
    terms.includes("receipt")
  ) {
    return new Date(issueDate);
  }

  const dueDate = new Date(issueDate);

  // Match Years (e.g. "1 Year", "2 Years", "1 Yr")
  const yearMatch = terms.match(/(\d+)\s*(year|yr)s?/i);
  if (yearMatch) {
    const years = parseInt(yearMatch[1], 10);
    dueDate.setFullYear(dueDate.getFullYear() + years);
    return dueDate;
  }

  // Match Months (e.g. "1 Month", "2 Months", "3 Mon", "1 Mth")
  const monthMatch = terms.match(/(\d+)\s*(month|mon|mth)s?/i);
  if (monthMatch) {
    const months = parseInt(monthMatch[1], 10);
    dueDate.setMonth(dueDate.getMonth() + months);
    return dueDate;
  }

  // Match Days (e.g. "3 Days", "30 Days Net", "7 days", "Net 15", "30")
  const dayMatch = terms.match(/(\d+)\s*(day|d)s?/i) || terms.match(/net\s*(\d+)/i) || terms.match(/^(\d+)$/);
  if (dayMatch) {
    const days = parseInt(dayMatch[1], 10);
    dueDate.setDate(dueDate.getDate() + days);
    return dueDate;
  }

  return dueDate;
}

/**
 * Calculates number of days between today (midnight) and target due date (midnight).
 * Negative means overdue, 0 to 7 means due soon / approaching.
 */
export function getDaysUntilDue(dueDate: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);

  const diffTime = due.getTime() - today.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Formats a Date object to YYYY-MM-DD string format.
 */
export function formatDateToYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
