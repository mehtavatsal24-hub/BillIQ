import { sendFeedbackRequestEmails, sendInactivityReminders, sendBroadcastEmail, EmailTriggerResult } from "./emailService";

export interface UserEmailRecord {
  id?: string;
  email?: string;
  username?: string;
  name?: string;
  createdAt?: string;
  lastActive?: string;
  hasReceivedRatingEmail?: boolean;
}

/**
 * Trigger 2-Day Post Signup Founder Feedback Requests
 * Ensures dynamic recipient binding to user.email and skips missing/invalid email addresses.
 * Sender: Vatsal from BillIQ <support@billiq.site>
 */
export async function trigger2DayFeedbackRequests(users?: UserEmailRecord[]): Promise<EmailTriggerResult> {
  if (users) {
    const validUsers: UserEmailRecord[] = [];
    for (const user of users) {
      if (!user.email || !user.email.includes('@')) continue;
      validUsers.push(user);
    }
    try {
      const res = await fetch("/api/send-feedback-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ users: validUsers }),
      });
      const data = await res.json();
      return {
        success: data.success ?? res.ok,
        count: data.count || 0,
        recipients: data.recipients || [],
        message: data.message || `Dispatched 2-day feedback requests to ${data.count || 0} user(s).`,
        details: data.details,
      };
    } catch (err: any) {
      console.error("Error triggering 2-day feedback request emails:", err);
      return {
        success: false,
        count: 0,
        recipients: [],
        message: err?.message || "Failed to trigger 2-day feedback request emails.",
      };
    }
  }
  return sendFeedbackRequestEmails();
}

/**
 * Trigger 14-Day Inactivity Reminder Emails
 * Ensures dynamic recipient binding to user.email and skips missing/invalid email addresses.
 * Sender: Vatsal from BillIQ <support@billiq.site>
 */
export async function trigger14DayInactivityEmails(users?: UserEmailRecord[]): Promise<EmailTriggerResult> {
  if (users) {
    const validUsers: UserEmailRecord[] = [];
    for (const user of users) {
      if (!user.email || !user.email.includes('@')) continue;
      validUsers.push(user);
    }
    try {
      const res = await fetch("/api/send-inactivity-reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ users: validUsers }),
      });
      const data = await res.json();
      return {
        success: data.success ?? res.ok,
        count: data.count || 0,
        recipients: data.recipients || [],
        message: data.message || `Dispatched 14-day inactivity reminders to ${data.count || 0} user(s).`,
        details: data.details,
      };
    } catch (err: any) {
      console.error("Error triggering 14-day inactivity emails:", err);
      return {
        success: false,
        count: 0,
        recipients: [],
        message: err?.message || "Failed to trigger 14-day inactivity emails.",
      };
    }
  }
  return sendInactivityReminders();
}

export { sendFeedbackRequestEmails, sendInactivityReminders, sendBroadcastEmail };
