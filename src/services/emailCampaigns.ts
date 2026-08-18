import { sendFeedbackRequestEmails, sendInactivityReminders, sendBroadcastEmail, EmailTriggerResult, isDeliverableEmail } from "./emailService";

export interface UserEmailRecord {
  id?: string;
  email?: string;
  username?: string;
  name?: string;
  createdAt?: string;
  lastActive?: string;
  lastActiveAt?: string;
  lastLoginAt?: string;
  documentsCount?: number;
  firstDocCreatedAt?: string | null;
  hasReceivedFirstDocFollowup?: boolean;
  hasReceivedRatingEmail?: boolean;
  hasReceivedInactivityReminder?: boolean;
}

/**
 * Trigger 1st Document Creation Follow-Up / Founder Feedback Requests
 * Sender: Founder from BillIQ <support@billiq.site>
 */
export async function triggerFirstDocFollowupRequests(users?: UserEmailRecord[]): Promise<EmailTriggerResult> {
  if (users) {
    const validUsers: UserEmailRecord[] = [];
    for (const user of users) {
      if (!user.email || !isDeliverableEmail(user.email)) continue;
      validUsers.push(user);
    }
    try {
      const res = await fetch("/api/send-first-doc-followup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ users: validUsers }),
      });
      const data = await res.json();
      return {
        success: data.success ?? res.ok,
        count: data.count || 0,
        recipients: data.recipients || [],
        message: data.message || `Dispatched 1st document follow-ups to ${data.count || 0} user(s).`,
        details: data.details,
      };
    } catch (err: any) {
      console.error("Error triggering 1st document follow-up emails:", err);
      return {
        success: false,
        count: 0,
        recipients: [],
        message: err?.message || "Failed to trigger 1st document follow-up emails.",
      };
    }
  }
  return sendFeedbackRequestEmails();
}

/**
 * Trigger 3-Day Inactivity Reminder Emails
 * Sender: Founder from BillIQ <support@billiq.site>
 */
export async function trigger3DayInactivityEmails(users?: UserEmailRecord[]): Promise<EmailTriggerResult> {
  if (users) {
    const validUsers: UserEmailRecord[] = [];
    for (const user of users) {
      if (!user.email || !isDeliverableEmail(user.email)) continue;
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
        message: data.message || `Dispatched 3-day inactivity reminders to ${data.count || 0} user(s).`,
        details: data.details,
      };
    } catch (err: any) {
      console.error("Error triggering 3-day inactivity emails:", err);
      return {
        success: false,
        count: 0,
        recipients: [],
        message: err?.message || "Failed to trigger 3-day inactivity emails.",
      };
    }
  }
  return sendInactivityReminders();
}

export const trigger2DayFeedbackRequests = triggerFirstDocFollowupRequests;
export const trigger14DayInactivityEmails = trigger3DayInactivityEmails;

export { sendFeedbackRequestEmails, sendInactivityReminders, sendBroadcastEmail };

