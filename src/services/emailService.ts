import { getAllUsersFromCloud } from './dbService';
import { getDefaultUsers } from '../data/dataLoader';

export interface EmailTriggerResult {
  success: boolean;
  count: number;
  recipients: string[];
  message: string;
  details?: any[];
}

export function isDeliverableEmail(email: any): boolean {
  if (!email || typeof email !== 'string') return false;
  let clean = email.trim().toLowerCase();
  const match = clean.match(/<([^>]+)>/);
  if (match && match[1]) clean = match[1].trim();

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(clean)) return false;

  const dummyDomains = [
    'example.com',
    'example.org',
    'example.net',
    'test.com',
    'domain.com',
    'sample.com',
    'invalid.com',
    'invalid',
    'smartbill.ai',
    'localhost',
  ];
  const domain = clean.split('@')[1];
  if (!domain || dummyDomains.includes(domain)) return false;
  return true;
}

/**
 * Dispatches welcome email to a new user upon registration.
 */
export async function sendWelcomeEmail(email: string, name?: string): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch("/api/welcome-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name }),
    });
    const data = await res.json();
    return {
      success: data.success ?? res.ok,
      message: data.message || "Welcome email queued successfully.",
    };
  } catch (err: any) {
    console.error("Error sending welcome email:", err);
    return { success: false, message: err?.message || "Failed to send welcome email." };
  }
}

/**
 * Automated Feedback Request (2 Days Post Signup)
 * Checks for users registered ~2 days ago who have not received the rating email.
 * Sends email via Resend template (welcome-to-billiq founder note) with subject:
 * "From one founder to another: Could I ask for a quick 10s favor?"
 * From: "Founder from BillIQ <support@billiq.site>"
 */
export async function sendFeedbackRequestEmails(): Promise<EmailTriggerResult> {
  try {
    // Collect users list from Firestore or API backend or local defaults
    let usersList: any[] = [];

    try {
      usersList = await getAllUsersFromCloud();
    } catch (e) {
      console.warn("Notice: fetch in sendFeedbackRequestEmails fallback to API:", e);
    }

    if (usersList.length === 0) {
      try {
        const res = await fetch("/api/users");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data?.users)) {
            usersList = data.users;
          }
        }
      } catch (e) {
        console.warn("Notice: /api/users fetch in sendFeedbackRequestEmails fallback to local:", e);
      }
    }

    if (usersList.length === 0) {
      usersList = getDefaultUsers();
    }

    // Filter out missing or non-deliverable dummy emails
    usersList = usersList.filter((u) => u && isDeliverableEmail(u.email));

    // Now call backend endpoint to process & dispatch 2-day feedback emails
    const res = await fetch("/api/send-feedback-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ users: usersList }),
    });

    const data = await res.json();
    return {
      success: data.success ?? res.ok,
      count: data.count || 0,
      recipients: data.recipients || [],
      message: data.message || `Dispatched feedback request emails to ${data.count || 0} users.`,
      details: data.details,
    };
  } catch (err: any) {
    console.error("Error triggering feedback request emails:", err);
    return {
      success: false,
      count: 0,
      recipients: [],
      message: err?.message || "Failed to trigger feedback request emails.",
    };
  }
}

/**
 * Automated Inactivity Reminder (14+ Days Inactive)
 * Queries Firestore/users for users with lastActiveAt > 5 days (or inactive for 14+ days).
 * Dispatches re-engagement email (template: inactive-account-reminder) from support@billiq.site.
 */
export async function sendInactivityReminders(): Promise<EmailTriggerResult> {
  try {
    let usersList: any[] = [];

    try {
      usersList = await getAllUsersFromCloud();
    } catch (e) {
      console.warn("Notice: fetch in sendInactivityReminders fallback to API:", e);
    }

    if (usersList.length === 0) {
      try {
        const res = await fetch("/api/users");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data?.users)) {
            usersList = data.users;
          }
        }
      } catch (e) {
        console.warn("Notice: /api/users fetch in sendInactivityReminders fallback:", e);
      }
    }

    if (usersList.length === 0) {
      usersList = getDefaultUsers();
    }

    // Filter out missing or non-deliverable dummy emails
    usersList = usersList.filter((u) => u && isDeliverableEmail(u.email));

    // Call backend endpoint to process & dispatch inactivity reminders
    const res = await fetch("/api/send-inactivity-reminders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ users: usersList }),
    });

    const data = await res.json();
    return {
      success: data.success ?? res.ok,
      count: data.count || 0,
      recipients: data.recipients || [],
      message: data.message || `Dispatched inactivity reminders to ${data.count || 0} users.`,
      details: data.details,
    };
  } catch (err: any) {
    console.error("Error triggering inactivity reminders:", err);
    return {
      success: false,
      count: 0,
      recipients: [],
      message: err?.message || "Failed to trigger inactivity reminders.",
    };
  }
}

/**
 * Manual Broadcast Email Composer Dispatcher
 */
export async function sendBroadcastEmail(
  subject: string,
  body: string,
  recipients?: string[]
): Promise<EmailTriggerResult> {
  try {
    const res = await fetch("/api/send-broadcast-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, body, recipients }),
    });

    const data = await res.json();
    return {
      success: data.success ?? res.ok,
      count: data.count || 0,
      recipients: data.recipients || [],
      message: data.message || `Broadcast dispatched to ${data.count || 0} recipients.`,
    };
  } catch (err: any) {
    console.error("Error sending broadcast email:", err);
    return {
      success: false,
      count: 0,
      recipients: [],
      message: err?.message || "Failed to send broadcast email.",
    };
  }
}

/**
 * Dispatches customer support inquiry directly to official Zoho Support Mailbox (support@billiq.site)
 */
export async function sendSupportInquiry(payload: {
  name?: string;
  email: string;
  topic?: string;
  subject?: string;
  message: string;
  phone?: string;
  company?: string;
  userId?: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch("/api/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    return {
      success: data.success ?? res.ok,
      message: data.message || "Your message has been sent to our support team. We will get back to you shortly.",
    };
  } catch (err: any) {
    console.error("Error sending support inquiry:", err);
    return {
      success: false,
      message: err?.message || "Failed to send support message.",
    };
  }
}

/**
 * Dispatches customer feedback directly to official Zoho Support Mailbox (support@billiq.site)
 */
export async function sendUserFeedback(payload: {
  category?: string;
  rating?: number;
  feedbackText: string;
  userEmail?: string;
  userName?: string;
  companyName?: string;
  phone?: string;
  userId?: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    return {
      success: data.success ?? res.ok,
      message: data.message || "Your message has been sent to our support team. We will get back to you shortly.",
    };
  } catch (err: any) {
    console.error("Error sending user feedback:", err);
    return {
      success: false,
      message: err?.message || "Failed to send feedback.",
    };
  }
}

