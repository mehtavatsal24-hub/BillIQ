import defaultUsersRaw from './data_users.json';
import defaultFeedbackRaw from './data_feedback.json';

export function getDefaultUsers(): any[] {
  try {
    if (Array.isArray(defaultUsersRaw)) {
      return defaultUsersRaw;
    }
    return [];
  } catch (err) {
    console.warn("Failed to load default users data:", err);
    return [];
  }
}

export function getDefaultFeedback(): any[] {
  try {
    if (Array.isArray(defaultFeedbackRaw)) {
      return defaultFeedbackRaw;
    }
    return [];
  } catch (err) {
    console.warn("Failed to load default feedback data:", err);
    return [];
  }
}

export const defaultUsers = getDefaultUsers();
export const defaultFeedback = getDefaultFeedback();
export default {
  defaultUsers,
  defaultFeedback,
  getDefaultUsers,
  getDefaultFeedback
};
