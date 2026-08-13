/**
 * Lightweight Analytics & Lifecycle Event Tracking Service for BillIQ
 */

import { logUserActivity } from "./auditLogger";

export type EventName =
  | "Invoice Created"
  | "PDF Downloaded"
  | "Sign Up Clicked"
  | "Login Clicked"
  | "AI OCR Extraction Triggered"
  | "Delivery Challan Generated"
  | "Landed Cost Sheet Exported"
  | "Support Requested"
  | "Legal Document Viewed"
  | "Page View";

export interface EventParams {
  userId?: string;
  userEmail?: string;
  documentType?: string;
  documentNumber?: string;
  amount?: number;
  currency?: string;
  category?: string;
  [key: string]: any;
}

export const trackEvent = (eventName: EventName | string, params: EventParams = {}) => {
  try {
    const timestamp = new Date().toISOString();
    const eventPayload = {
      eventName,
      timestamp,
      ...params,
    };

    // 1. Dispatch custom DOM event for analytics listeners
    window.dispatchEvent(
      new CustomEvent("billiq-analytics-event", {
        detail: eventPayload,
      })
    );

    // 2. Pass to Google Analytics (gtag) if loaded
    if (typeof (window as any).gtag === "function") {
      (window as any).gtag("event", eventName, params);
    }

    // 3. Log user activity to audit logger if userId is present
    if (params.userId) {
      const validCategory: "auth" | "document" | "sync" | "settings" | "system" | "ui" =
        params.category === "auth" ||
        params.category === "document" ||
        params.category === "sync" ||
        params.category === "settings" ||
        params.category === "system"
          ? params.category
          : "ui";

      logUserActivity(
        params.userId,
        eventName,
        `Analytics event: ${eventName} (${JSON.stringify(params)})`,
        false,
        validCategory
      );
    }

    // 4. Development logging
    if (process.env.NODE_ENV !== "production") {
      console.log(`[Analytics Tracked]: ${eventName}`, params);
    }
  } catch (err) {
    console.warn("Failed to dispatch analytics event:", err);
  }
};
