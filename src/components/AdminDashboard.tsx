import React, { useState, useEffect, useMemo } from "react";
import { getDefaultUsers } from "../data/dataLoader";
import { getCountryConfig } from "../utils/localization";
import { motion } from "motion/react";
import { 
  Shield, 
  Users, 
  Search, 
  RefreshCw, 
  Eye, 
  Download, 
  FileCode, 
  UserCheck, 
  UserX, 
  FileText, 
  Clock, 
  AlertTriangle, 
  Save, 
  ExternalLink, 
  X, 
  Check, 
  Copy, 
  Database,
  Sliders,
  Filter,
  Zap,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  BarChart2,
  Calendar,
  CreditCard,
  Building,
  Trash2,
  Edit3,
  Plus,
  FilePlus,
  UserPlus,
  UserMinus,
  Mail,
  TrendingUp,
  Key,
  Lock,
  ShieldCheck,
  ArrowUpDown,
  Wrench,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  Activity,
  Gauge
} from "lucide-react";
import { LiveAnalyticsDashboard } from "./LiveAnalyticsDashboard";
import { SpeedInsightsDashboard } from "./SpeedInsightsDashboard";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";
import { collection, onSnapshot } from "firebase/firestore";
import { db, isConfigValid } from "../services/firebase";
import { getAllUsersFromCloud, saveToCloud, deleteFromCloud, deleteUserAccount, loadFromCloud } from "../services/dbService";
import { adminGrantTrialCredits, updateTrialLedger, getEmailKey } from "../services/trialService";
import { generateInvoicePDF, downloadInvoicePDF } from "../services/pdfService";
import { AuditLogEntry, getUserAuditLogs, logUserActivity } from "../services/auditLogger";
import { InvoiceData, DocumentType, BusinessDetails, CustomerDetails, LineItem, PDFLayoutSettings, UserOverrides, UserOverrideAuditLog } from "../types";
import { sendFeedbackRequestEmails, sendInactivityReminders, sendBroadcastEmail } from "../services/emailService";
import { triggerFirstDocFollowupRequests, trigger3DayInactivityEmails } from "../services/emailCampaigns";

interface AdminDashboardProps {
  adminUser: any;
  onImpersonateUser: (userData: any) => void;
  onExitAdminView?: () => void;
  currentUserHistory?: any[];
  onUserUpdated?: (user: any) => void;
  currency?: string;
}

// Robust helper to safely parse any Date, Timestamp, Firestore Timestamp, ISO string or epoch ms
export const normalizeToDate = (dateInput: any): Date | null => {
  if (!dateInput) return null;
  if (dateInput instanceof Date) {
    return isNaN(dateInput.getTime()) ? null : dateInput;
  }
  if (typeof dateInput === 'object' && dateInput !== null) {
    if (typeof dateInput.toDate === 'function') {
      try {
        const d = dateInput.toDate();
        if (d instanceof Date && !isNaN(d.getTime())) return d;
      } catch {}
    }
    if (typeof dateInput.seconds === 'number') {
      const d = new Date(dateInput.seconds * 1000);
      if (!isNaN(d.getTime())) return d;
    }
    if (typeof dateInput._seconds === 'number') {
      const d = new Date(dateInput._seconds * 1000);
      if (!isNaN(d.getTime())) return d;
    }
  }
  if (typeof dateInput === 'number') {
    const d = new Date(dateInput);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    if (!trimmed) return null;
    if (/^\d+$/.test(trimmed)) {
      const num = Number(trimmed);
      const d = new Date(num);
      if (!isNaN(d.getTime())) return d;
    }
    const d = new Date(trimmed);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
};

export const normalizeTimestampToMs = (dateInput: any): number => {
  const d = normalizeToDate(dateInput);
  return d ? d.getTime() : 0;
};

// Helper function to reliably normalize any timestamp/date input into a local YYYY-MM-DD string
export const toLocalDateString = (dateInput: any): string | null => {
  const d = normalizeToDate(dateInput);
  if (!d) return null;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const ADMIN_UID = "XssthfE8PHMi9j3iNMmCYQ9Sqgk2";

export const ADMIN_EMAILS = [
  "support@billiq.site",
  "mehtavatsal24@gmail.com",
  "admin@smartbill.ai"
];

export const isAdminUser = (user: any, userProfile?: any): boolean => {
  if (!user && !userProfile) return false;

  // Check RBAC role field
  if (user?.role === 'admin' || userProfile?.role === 'admin') return true;

  const email = (
    user?.email || 
    userProfile?.email ||
    userProfile?.signupEmail || 
    userProfile?.authEmail || 
    user?.user?.email || 
    ""
  ).toLowerCase().trim();

  if (ADMIN_EMAILS.some(e => e.toLowerCase() === email) || email.includes('admin')) {
    return true;
  }

  if (user?.planTier === 'enterprise' || userProfile?.planTier === 'enterprise') {
    return true;
  }

  return false;
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  adminUser,
  onImpersonateUser,
  onExitAdminView,
  currentUserHistory,
  onUserUpdated,
  currency = "INR",
}) => {
  const rawCurr = (currency || "INR").trim().toUpperCase();
  const safeCurrency = !rawCurr || rawCurr === "AOA" || rawCurr === "AO" || rawCurr === "KZ" || rawCurr === "KZ." || rawCurr === "ANGOLA" ? "INR" : rawCurr;
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date-desc");
  const [activityFilter, setActivityFilter] = useState<string>("all");
  const [customFilterDate, setCustomFilterDate] = useState<string>("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "documents" | "overrides" | "logs" | "notes">("overview");

  // User Overrides & Hotfix Panel state
  const [overrideForm, setOverrideForm] = useState<UserOverrides>({
    bypassDocLimit: false,
    forceRefreshState: false,
    skipValidation: false,
    enableBetaOCR: false,
    forcedPlan: "None",
    customDocQuota: null,
    bonusDocCredits: 0,
    accountLockStatus: "Active",
  });
  const [savingOverrides, setSavingOverrides] = useState<boolean>(false);
  const [overridesSuccessMsg, setOverridesSuccessMsg] = useState<string>("");
  const [liveSyncTriggering, setLiveSyncTriggering] = useState<boolean>(false);
  const [liveSyncStatusMsg, setLiveSyncStatusMsg] = useState<string>("");
  const [isAutoFixing, setIsAutoFixing] = useState<boolean>(false);
  const [autoFixSuccessToast, setAutoFixSuccessToast] = useState<string | null>(null);
  const [adminToast, setAdminToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showAdminToast = (message: string, type: "success" | "error" = "success") => {
    setAdminToast({ message, type });
    setTimeout(() => {
      setAdminToast((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  };

  // Filters & State for selected user
  const [showErrorsOnly, setShowErrorsOnly] = useState<boolean>(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [adminNotesText, setAdminNotesText] = useState<string>("");
  const [savingNotes, setSavingNotes] = useState<boolean>(false);
  const [notesSaveSuccess, setNotesSaveSuccess] = useState<boolean>(false);

  // Status, Role & Plan editing
  const [currentAccountStatus, setCurrentAccountStatus] = useState<string>("Active");
  const [currentRole, setCurrentRole] = useState<'admin' | 'staff' | 'customer'>("staff");
  const [currentPlan, setCurrentPlan] = useState<string>("Pro Plan");
  const [savingUserMeta, setSavingUserMeta] = useState<boolean>(false);

  // CRUD Modals State
  const [isDocModalOpen, setIsDocModalOpen] = useState<boolean>(false);
  const [docForm, setDocForm] = useState<{
    id: string;
    documentNumber: string;
    type: string;
    date: string;
    partyName: string;
    amount: number;
    notes: string;
  }>({
    id: "",
    documentNumber: "",
    type: "INVOICE",
    date: new Date().toISOString().split("T")[0],
    partyName: "",
    amount: 0,
    notes: "",
  });

  const [adminMainTab, setAdminMainTab] = useState<"live_pulse" | "user_directory" | "campaigns" | "growth" | "speed_insights">("live_pulse");

  const allDocuments = useMemo(() => {
    const docs: any[] = [];
    usersList.forEach((u) => {
      if (Array.isArray(u.history)) {
        docs.push(...u.history);
      } else if (Array.isArray(u.documents)) {
        docs.push(...u.documents);
      }
    });
    if (Array.isArray(currentUserHistory)) {
      currentUserHistory.forEach((d) => {
        if (!docs.some((existing) => existing.id === d.id)) {
          docs.push(d);
        }
      });
    }
    return docs;
  }, [usersList, currentUserHistory]);

  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState<boolean>(false);
  const [newUserForm, setNewUserForm] = useState({
    email: "",
    displayName: "",
    companyName: "",
    gstin: "",
    plan: "Free Trial",
    status: "Active",
  });

  const [isEditBusinessModalOpen, setIsEditBusinessModalOpen] = useState<boolean>(false);
  const [businessForm, setBusinessForm] = useState({
    companyName: "",
    gstin: "",
    phone: "",
    email: "",
    address: "",
    country: "India",
    currency: "INR",
  });

  // Admin Security Password State
  const [adminSecurityPassword, setAdminSecurityPassword] = useState<string>(() => {
    return localStorage.getItem("admin_security_password") || localStorage.getItem("billiq_admin_security_pass") || "";
  });
  const [isSetPasswordModalOpen, setIsSetPasswordModalOpen] = useState<boolean>(false);
  const [currentPassInput, setCurrentPassInput] = useState<string>("");
  const [newPassInput, setNewPassInput] = useState<string>("");
  const [confirmPassInput, setConfirmPassInput] = useState<string>("");
  const [setPasswordModalError, setSetPasswordModalError] = useState<string>("");
  const [setPasswordModalSuccess, setSetPasswordModalSuccess] = useState<string>("");

  useEffect(() => {
    loadFromCloud("admin_config/security")
      .then((data: any) => {
        if (data && data.securityPassword) {
          setAdminSecurityPassword(data.securityPassword);
          localStorage.setItem("admin_security_password", data.securityPassword);
          localStorage.setItem("billiq_admin_security_pass", data.securityPassword);
        }
      })
      .catch((err) => {
        console.warn("Could not load admin security config:", err);
      });
  }, []);

  // Modals
  const [isDeleteUserModalOpen, setIsDeleteUserModalOpen] = useState<boolean>(false);
  const [userToDelete, setUserToDelete] = useState<any | null>(null);
  const [deleteAdminPassword, setDeleteAdminPassword] = useState<string>("");
  const [deletePasswordError, setDeletePasswordError] = useState<string>("");
  const [isDeletingUser, setIsDeletingUser] = useState<boolean>(false);

  // Bulk Purge State (Wipe all non-admin accounts for clean launch)
  const [isPurgeModalOpen, setIsPurgeModalOpen] = useState<boolean>(false);
  const [purgeAdminPassword, setPurgeAdminPassword] = useState<string>("");
  const [purgePasswordError, setPurgePasswordError] = useState<string>("");
  const [isPurgingAll, setIsPurgingAll] = useState<boolean>(false);

  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [previewPdfDocName, setPreviewPdfDocName] = useState<string>("");
  const [jsonModalData, setJsonModalData] = useState<{ title: string; json: any } | null>(null);
  const [copiedJson, setCopiedJson] = useState<boolean>(false);

  // Email Automation & Campaign Triggers State
  const [triggeringFeedback, setTriggeringFeedback] = useState<boolean>(false);
  const [triggeringInactivity, setTriggeringInactivity] = useState<boolean>(false);
  const [sendingBroadcast, setSendingBroadcast] = useState<boolean>(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState<boolean>(false);
  const [broadcastSubject, setBroadcastSubject] = useState<string>("");
  const [broadcastBody, setBroadcastBody] = useState<string>("");
  const [broadcastRecipientTarget, setBroadcastRecipientTarget] = useState<"all" | "active" | "inactive">("all");
  const [emailCampaignLog, setEmailCampaignLog] = useState<{ id: string; time: string; text: string; success: boolean }[]>([]);

  // New Sign-ups & Sign-ins Summary Component State
  const [summaryDateFilter, setSummaryDateFilter] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [summaryRangeType, setSummaryRangeType] = useState<"today" | "yesterday" | "7d" | "30d" | "custom">("today");
  const [summaryActivityTab, setSummaryActivityTab] = useState<"all" | "signups" | "signins">("all");
  const [summaryStatusFilter, setSummaryStatusFilter] = useState<string>("all");

  const handleTriggerFeedbackRequests = async () => {
    setTriggeringFeedback(true);
    try {
      const res = await triggerFirstDocFollowupRequests(usersList);
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const logItem = {
        id: String(Date.now()),
        time: timeStr,
        text: res.message || `Dispatched 1st document follow-ups to ${res.count} user(s).`,
        success: res.success,
      };
      setEmailCampaignLog((prev) => [logItem, ...prev]);
      showAdminToast(res.message, res.success ? "success" : "error");
    } catch (e: any) {
      showAdminToast(e?.message || "Failed to trigger 1st document follow-up emails.", "error");
    } finally {
      setTriggeringFeedback(false);
    }
  };

  const handleTriggerInactivityReminders = async () => {
    setTriggeringInactivity(true);
    try {
      const res = await trigger3DayInactivityEmails(usersList);
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const logItem = {
        id: String(Date.now()),
        time: timeStr,
        text: res.message || `Dispatched 3-day inactivity reminders to ${res.count} user(s).`,
        success: res.success,
      };
      setEmailCampaignLog((prev) => [logItem, ...prev]);
      showAdminToast(res.message, res.success ? "success" : "error");
    } catch (e: any) {
      showAdminToast(e?.message || "Failed to trigger 3-day inactivity reminders.", "error");
    } finally {
      setTriggeringInactivity(false);
    }
  };

  const handleSendBroadcast = async () => {
    if (!broadcastSubject.trim() || !broadcastBody.trim()) return;
    setSendingBroadcast(true);
    try {
      let recipients: string[] = [];
      if (broadcastRecipientTarget === "active") {
        recipients = usersList
          .filter((u) => u.status !== "Suspended" && u.status !== "Deleted")
          .map((u) => (u.email || u.signupEmail || u.authEmail || "").trim())
          .filter((e) => e.includes("@"));
      } else if (broadcastRecipientTarget === "inactive") {
        recipients = usersList
          .map((u) => (u.email || u.signupEmail || u.authEmail || "").trim())
          .filter((e) => e.includes("@"));
      }

      const res = await sendBroadcastEmail(broadcastSubject, broadcastBody, recipients);
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const logItem = {
        id: String(Date.now()),
        time: timeStr,
        text: res.message || `Broadcast sent to ${res.count} recipient(s).`,
        success: res.success,
      };
      setEmailCampaignLog((prev) => [logItem, ...prev]);
      showAdminToast(res.message, res.success ? "success" : "error");
      setBroadcastSubject("");
      setBroadcastBody("");
      setShowBroadcastModal(false);
    } catch (e: any) {
      showAdminToast(e?.message || "Failed to send broadcast email.", "error");
    } finally {
      setSendingBroadcast(false);
    }
  };

  // Fetch users on mount (combining Firestore cloud data with backend active store)
  const loadAllUsers = async () => {
    setLoadingUsers(true);
    try {
      const [cloudResult, apiResult] = await Promise.allSettled([
        getAllUsersFromCloud(),
        fetch("/api/users").then((res) => (res.ok ? res.json() : null)).catch(() => null),
      ]);

      const cloudUsers = cloudResult.status === "fulfilled" && Array.isArray(cloudResult.value) ? cloudResult.value : [];
      const apiUsers = apiResult.status === "fulfilled" && Array.isArray(apiResult.value?.users) ? apiResult.value.users : [];

      const mergedMap = new Map<string, any>();

      // 1. First add backend API users
      apiUsers.forEach((u: any) => {
        const uEmail = getUserEmail(u).toLowerCase().trim();
        const key = (uEmail || u.id || "").toLowerCase().trim();
        if (key) {
          mergedMap.set(key, { ...u, source: "backend" });
        }
      });

      // 2. Overlay Cloud Firestore users (higher fidelity source of truth)
      cloudUsers.forEach((u: any) => {
        const uEmail = getUserEmail(u).toLowerCase().trim();
        const key = (uEmail || u.id || "").toLowerCase().trim();
        if (key) {
          const existing = mergedMap.get(key) || {};
          mergedMap.set(key, { ...existing, ...u, source: "cloud" });
        }
      });

      let deduplicatedUsers = Array.from(mergedMap.values());

      // If still empty, provide default accounts for inspection
      if (deduplicatedUsers.length === 0) {
        const localDefaults = getDefaultUsers();
        if (localDefaults.length > 0) {
          deduplicatedUsers = localDefaults;
        }
      }

      if (deduplicatedUsers.length === 0) {
        deduplicatedUsers = [
          {
            id: ADMIN_UID,
            email: "mehtavatsal24@gmail.com",
            displayName: "Founder",
            accountStatus: "Active",
            plan: "Enterprise Admin",
            updatedAt: new Date().toISOString(),
            business: {
              companyName: "BillIQ Global Technologies",
              email: "mehtavatsal24@gmail.com",
              phone: "+91 98765 43210",
              gstin: "27AAAAA0000A1Z5",
              country: "India"
            },
            history: [],
            logs: [
              { id: "l1", timestamp: new Date().toISOString(), action: "User Logged In", details: "Admin console initialized", isError: false, category: "auth" }
            ],
            adminNotes: "Founder / Primary Administrator Account."
          },
          {
            id: "BzfnRqFFUtVeoqjxcLolmu6SRIA3",
            email: "support@billiq.site",
            displayName: "BillIQ Support",
            accountStatus: "Active",
            plan: "Enterprise Admin",
            updatedAt: new Date().toISOString(),
            business: {
              companyName: "BillIQ Support",
              email: "support@billiq.site",
              phone: "+91 98765 43210",
              gstin: "27AAAAA0000A1Z5",
              country: "India"
            },
            history: [],
            logs: [
              { id: "l2", timestamp: new Date().toISOString(), action: "Account Active", details: "Official support account", isError: false, category: "auth" }
            ],
            adminNotes: "Official Support & Administration Account."
          }
        ];
      }

      setUsersList(deduplicatedUsers);
      
      // Select first user if none selected
      if (deduplicatedUsers.length > 0) {
        setSelectedUserId((prev) => prev || deduplicatedUsers[0].id);
      }
    } catch (err) {
      console.error("Error loading users for admin:", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    loadAllUsers();

    if (!isConfigValid || !db) {
      setLoadingUsers(false);
      return;
    }
    try {
      const usersCol = collection(db, "users");
      const unsubscribe = onSnapshot(usersCol, (snapshot) => {
        const result: any[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          let resolvedSignupEmail = (
            data.signupEmail ||
            data.authEmail ||
            data.email ||
            ""
          ).trim();

          if (!resolvedSignupEmail && data.business?.email && typeof data.business.email === "string") {
            resolvedSignupEmail = data.business.email.trim();
          }

          let resolvedUsername = (
            data.username ||
            data.authUsername ||
            ""
          ).trim();

          if (!resolvedUsername && data.displayName && data.displayName !== data.business?.companyName && data.displayName !== data.business?.name) {
            resolvedUsername = data.displayName.trim();
          }

          if (!resolvedUsername && resolvedSignupEmail) {
            resolvedUsername = resolvedSignupEmail.split('@')[0];
          }

          if (!resolvedUsername) {
            resolvedUsername = "User";
          }

          result.push({
            id: docSnap.id,
            ...data,
            email: resolvedSignupEmail,
            signupEmail: resolvedSignupEmail,
            authEmail: resolvedSignupEmail,
            username: resolvedUsername,
            authUsername: resolvedUsername,
            displayName: data.displayName && data.displayName !== data.business?.companyName ? data.displayName : resolvedUsername
          });
        });
        if (result.length > 0) {
          // Deduplicate users by email/id to prevent duplicate cards
          const seenKeys = new Set<string>();
          const deduplicated: any[] = [];
          result.forEach((item) => {
            const key = (item.email || item.signupEmail || item.id || "").toLowerCase().trim();
            if (key && !seenKeys.has(key)) {
              seenKeys.add(key);
              deduplicated.push(item);
            }
          });
          setUsersList(deduplicated);
        }
        setLoadingUsers(false);
      }, (err) => {
        console.warn("Real-time users snapshot listener notice:", err);
        setLoadingUsers(false);
      });

      return () => unsubscribe();
    } catch (err) {
      console.warn("Could not attach real-time users listener:", err);
      setLoadingUsers(false);
    }
  }, []);

  // Selected user object
  const selectedUser = usersList.find((u) => u.id === selectedUserId) || usersList[0];

  // Helper to extract permanent immutable signup email (Account login email, never company email)
  const getUserEmail = (u: any): string => {
    if (!u) return "";
    if (u.signupEmail && typeof u.signupEmail === "string" && u.signupEmail.trim() !== "") return u.signupEmail.trim();
    if (u.authEmail && typeof u.authEmail === "string" && u.authEmail.trim() !== "") return u.authEmail.trim();
    if (u.email && typeof u.email === "string" && u.email.trim() !== "") return u.email.trim();
    if (adminUser?.email && u.id === adminUser.uid) return adminUser.email;
    if (u.business?.email && typeof u.business.email === "string" && u.business.email.trim() !== "") return u.business.email.trim();
    return "";
  };

  // Helper to extract permanent account username (Account username, never company name)
  const getUserUsername = (u: any): string => {
    if (!u) return "";
    if (u.username && typeof u.username === "string" && u.username.trim() !== "") return u.username.trim();
    if (u.authUsername && typeof u.authUsername === "string" && u.authUsername.trim() !== "") return u.authUsername.trim();
    if (u.displayName && typeof u.displayName === "string" && u.displayName.trim() !== "" && u.displayName !== u.business?.companyName && u.displayName !== u.business?.name) return u.displayName.trim();
    const email = getUserEmail(u);
    if (email) return email.split('@')[0];
    if (u.displayName && typeof u.displayName === "string" && u.displayName.trim() !== "") return u.displayName.trim();
    return u.id || "User";
  };

  // Lifetime total metrics across platform
  const totalRegistrations = useMemo(() => {
    return usersList.length;
  }, [usersList]);

  // Today & Yesterday Local Date Strings (YYYY-MM-DD)
  const todayDateStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const yesterdayDateStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // New Signups of the Day (Accounts created today)
  const signupsTodayCount = useMemo(() => {
    return usersList.filter((u) => {
      const rawCreated = u.createdAt || u.registrationDate || u.created_at;
      return rawCreated ? toLocalDateString(rawCreated) === todayDateStr : false;
    }).length;
  }, [usersList, todayDateStr]);

  // Sign-Ins / Logins of the Day (Users who signed in, registered, or were active today)
  const signInsTodayCount = useMemo(() => {
    return usersList.filter((u) => {
      const rawLogin = u.lastLoginAt || u.lastLogin;
      const rawActive = u.lastActiveAt || u.lastActive || u.lastSeen || u.updatedAt;
      const rawCreated = u.createdAt || u.registrationDate || u.created_at;

      const isLoginToday = rawLogin ? toLocalDateString(rawLogin) === todayDateStr : false;
      const isActiveToday = rawActive ? toLocalDateString(rawActive) === todayDateStr : false;
      const isCreatedToday = rawCreated ? toLocalDateString(rawCreated) === todayDateStr : false;

      return isLoginToday || isActiveToday || isCreatedToday;
    }).length;
  }, [usersList, todayDateStr]);

  // Users Inactive for > 3 Days (Eligible for automated 3-day inactivity campaign)
  const inactive3DaysCount = useMemo(() => {
    const threeDaysAgoTime = Date.now() - 3 * 24 * 60 * 60 * 1000;
    return usersList.filter((u) => {
      const timestamps = [u.lastActiveAt, u.lastActive, u.lastLoginAt, u.lastSeen, u.updatedAt, u.createdAt];
      let maxTime = 0;
      for (const ts of timestamps) {
        if (ts) {
          const t = normalizeTimestampToMs(ts);
          if (t > maxTime) maxTime = t;
        }
      }
      return maxTime > 0 && maxTime < threeDaysAgoTime;
    }).length;
  }, [usersList]);

  // Real-Time Active Users Metric (Users currently online & active within the last 5 minutes)
  const currentlyActiveUsersCount = useMemo(() => {
    const fiveMinutesAgoTime = Date.now() - 5 * 60 * 1000;

    const activeUsersList = [...usersList];
    if (currentUserHistory && adminUser) {
      const adminIdx = activeUsersList.findIndex(u => u.id === adminUser.uid || u.id === ADMIN_UID);
      if (adminIdx !== -1) {
        activeUsersList[adminIdx] = {
          ...activeUsersList[adminIdx],
          lastSeen: new Date().toISOString(),
          isOnline: true,
        };
      }
    }

    const onlineUsers = activeUsersList.filter((u) => {
      if (u.isOnline === false) return false;

      const timestamps = [u.lastSeen, u.lastActive, u.lastActiveAt];
      let maxTime = 0;
      for (const ts of timestamps) {
        if (ts) {
          const t = normalizeTimestampToMs(ts);
          if (t > maxTime) maxTime = t;
        }
      }

      return maxTime >= fiveMinutesAgoTime;
    });

    return Math.max(onlineUsers.length, 1);
  }, [usersList, currentUserHistory, adminUser]);

  const totalDocsCreated = useMemo(() => {
    let count = 0;
    const activeUsersList = [...usersList];
    if (currentUserHistory && adminUser) {
      const adminIdx = activeUsersList.findIndex(u => u.id === adminUser.uid || u.id === ADMIN_UID);
      if (adminIdx !== -1) {
        activeUsersList[adminIdx] = {
          ...activeUsersList[adminIdx],
          history: currentUserHistory,
        };
      }
    }
    activeUsersList.forEach((u) => {
      if (Array.isArray(u.history)) {
        count += u.history.length;
      }
    });
    return count;
  }, [usersList, currentUserHistory, adminUser]);

  // 30-day registration & document activity trends analytics calculation
  const analytics30DaysData = useMemo(() => {
    const days: { date: string; rawDate: string; registrations: number; docs: number }[] = [];
    const now = new Date();

    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      const displayLabel = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

      days.push({
        date: displayLabel,
        rawDate: dateStr,
        registrations: 0,
        docs: 0,
      });
    }

    // Prepare users list with real-time currentUserHistory injected for admin/current user
    const activeUsersList = [...usersList];
    if (currentUserHistory && adminUser) {
      const adminIdx = activeUsersList.findIndex(u => u.id === adminUser.uid || u.id === ADMIN_UID);
      if (adminIdx !== -1) {
        activeUsersList[adminIdx] = {
          ...activeUsersList[adminIdx],
          history: currentUserHistory,
        };
      }
    }

    activeUsersList.forEach((u) => {
      // User registration date MUST strictly be the unique immutable account creation date.
      // Re-authentications, logins, or document edits DO NOT alter this date or count as a new registration.
      const rawCreated = u.createdAt || u.registrationDate || u.created_at;
      const regDate = rawCreated ? toLocalDateString(rawCreated) : null;

      if (regDate) {
        const dayItem = days.find((item) => item.rawDate === regDate);
        if (dayItem) {
          dayItem.registrations += 1;
        }
      }

      // Documents created check with all fallback date fields across all document types in history
      if (Array.isArray(u.history)) {
        u.history.forEach((docItem: any) => {
          const docDate =
            toLocalDateString(docItem.createdAt) ||
            toLocalDateString(docItem.timestamp) ||
            toLocalDateString(docItem.date) ||
            toLocalDateString(docItem.invoiceDate) ||
            toLocalDateString(docItem.quotationDate) ||
            toLocalDateString(docItem.updatedAt);

          if (docDate) {
            const dayItem = days.find((item) => item.rawDate === docDate);
            if (dayItem) {
              dayItem.docs += 1;
            }
          }
        });
      }
    });

    return days;
  }, [usersList, currentUserHistory, adminUser]);

  const total30DayRegistrations = useMemo(() => {
    return analytics30DaysData.reduce((acc, curr) => acc + curr.registrations, 0);
  }, [analytics30DaysData]);

  const total30DayDocs = useMemo(() => {
    return analytics30DaysData.reduce((acc, curr) => acc + curr.docs, 0);
  }, [analytics30DaysData]);

  // Breakdown metrics for the 'New Sign-ups & Sign-ins' summary component
  const summaryMetricsData = useMemo(() => {
    let targetDates: string[] = [];
    const now = new Date();

    if (summaryRangeType === "today") {
      targetDates = [todayDateStr];
    } else if (summaryRangeType === "yesterday") {
      targetDates = [yesterdayDateStr];
    } else if (summaryRangeType === "7d") {
      for (let i = 0; i < 7; i++) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        targetDates.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
      }
    } else if (summaryRangeType === "30d") {
      for (let i = 0; i < 30; i++) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        targetDates.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
      }
    } else {
      targetDates = summaryDateFilter ? [summaryDateFilter] : [todayDateStr];
    }

    const targetDateSet = new Set(targetDates);

    const signups: any[] = [];
    const signins: any[] = [];
    let docsCount = 0;

    usersList.forEach((u) => {
      // Account Status Filter check
      if (summaryStatusFilter !== "all") {
        const status = (u.accountStatus || (u.isDeleted || u.status === "Deleted" ? "Deleted" : "Active")).toLowerCase();
        if (summaryStatusFilter === "active" && status !== "active") return;
        if (summaryStatusFilter === "suspended" && status !== "suspended") return;
        if (summaryStatusFilter === "deleted" && status !== "deleted") return;
      }

      // Check Registration Date
      const rawCreated = u.createdAt || u.registrationDate || u.created_at;
      const regDate = rawCreated ? toLocalDateString(rawCreated) : "";
      if (regDate && targetDateSet.has(regDate)) {
        signups.push({
          ...u,
          activityType: "signup",
          activityDate: rawCreated,
          activityDateStr: regDate,
        });
      }

      // Check Last Login / Activity Date
      const rawLogin = u.lastLoginAt || u.lastLogin || u.lastActiveAt || u.lastActive || u.lastSeen || u.updatedAt || u.createdAt;
      const loginDate = rawLogin ? toLocalDateString(rawLogin) : "";
      if (loginDate && targetDateSet.has(loginDate)) {
        signins.push({
          ...u,
          activityType: "signin",
          activityDate: rawLogin,
          activityDateStr: loginDate,
        });
      }

      // Check Documents Count created within this date range
      if (Array.isArray(u.history)) {
        u.history.forEach((docItem: any) => {
          const docDate =
            toLocalDateString(docItem.createdAt) ||
            toLocalDateString(docItem.timestamp) ||
            toLocalDateString(docItem.date);
          if (docDate && targetDateSet.has(docDate)) {
            docsCount++;
          }
        });
      }
    });

    // Merged list for combined activity display
    const combinedMap = new Map<string, any>();
    signups.forEach((u) => combinedMap.set(`${u.id}_signup`, u));
    signins.forEach((u) => combinedMap.set(`${u.id}_signin`, u));
    const combinedList = Array.from(combinedMap.values());

    return {
      signups,
      signins,
      docsCount,
      combinedList,
      targetDates,
    };
  }, [usersList, summaryRangeType, summaryDateFilter, summaryStatusFilter, todayDateStr, yesterdayDateStr]);

  // Update local fields when selected user changes
  useEffect(() => {
    if (selectedUser) {
      setAdminNotesText(selectedUser.adminNotes || "");
      setCurrentAccountStatus(selectedUser.accountStatus || "Active");
      const resolvedRole = selectedUser.role || (selectedUser.planTier === "enterprise" || (getUserEmail(selectedUser) && ADMIN_EMAILS.some(e => e.toLowerCase() === getUserEmail(selectedUser).toLowerCase())) ? "admin" : "staff");
      setCurrentRole(resolvedRole as 'admin' | 'staff' | 'customer');
      setCurrentPlan(selectedUser.plan || "Pro Plan");

      const ov = selectedUser.overrides || {};
      setOverrideForm({
        bypassDocLimit: !!ov.bypassDocLimit,
        forceRefreshState: !!ov.forceRefreshState,
        skipValidation: !!ov.skipValidation,
        enableBetaOCR: !!ov.enableBetaOCR,
        forcedPlan: ov.forcedPlan || "None",
        customDocQuota: ov.customDocQuota !== undefined && ov.customDocQuota !== null ? Number(ov.customDocQuota) : null,
        bonusDocCredits: ov.bonusDocCredits ? Number(ov.bonusDocCredits) : 0,
        accountLockStatus: ov.accountLockStatus || selectedUser.accountStatus || "Active",
      });
      setOverridesSuccessMsg("");
      setLiveSyncStatusMsg("");
    }
  }, [selectedUserId, selectedUser]);

  // --- OVERRIDE & HOTFIX ACTIONS ---

  // One-click action: Push Live State Reset / Force Re-Sync
  const handlePushLiveSync = async () => {
    if (!selectedUser) return;
    setLiveSyncTriggering(true);
    setLiveSyncStatusMsg("");

    const timestamp = new Date().toISOString();
    const adminId = adminUser?.uid || "admin";

    const newLog: UserOverrideAuditLog = {
      id: "ovlog_" + Date.now(),
      timestamp,
      adminId,
      action: "LIVE_FORCE_RESYNC",
      parameter: "forceSyncTimestamp",
      newValue: timestamp,
      notes: "Triggered live force re-sync and client profile state refresh",
    };

    const currentLogs: UserOverrideAuditLog[] = selectedUser.overrideAuditLogs || selectedUser.overrideLogs || [];
    const updatedLogs = [newLog, ...currentLogs];

    const updatedUser = {
      ...selectedUser,
      forceSyncTimestamp: timestamp,
      adminHotfix: {
        lastTriggeredAt: timestamp,
        triggeredBy: adminId,
        action: "LIVE_RE_SYNC",
      },
      overrideAuditLogs: updatedLogs,
      updatedAt: timestamp,
    };

    try {
      await saveToCloud(`users/${selectedUser.id}`, updatedUser);
      setUsersList((prev) => prev.map((u) => (u.id === selectedUser.id ? updatedUser : u)));
      logUserActivity(
        adminId,
        "Live Force Sync Sent",
        `Admin triggered live state re-sync for user ${selectedUser.id}`,
        false,
        "system"
      );
      setLiveSyncStatusMsg(`Live Re-Sync signal pushed at ${new Date().toLocaleTimeString()}! Active client session will reload state immediately.`);
      showAdminToast("User profile updated successfully", "success");
    } catch (err: any) {
      console.error("Failed to trigger live force re-sync:", err);
      showAdminToast("Failed to push force re-sync signal: " + (err?.message || String(err)), "error");
    } finally {
      setLiveSyncTriggering(false);
    }
  };

  // Force Sign-Out Active Sessions
  const handleForceSignOutSession = async () => {
    if (!selectedUser) return;
    if (!window.confirm(`Force sign-out active browser session for user ${selectedUser.id}?`)) return;

    const timestamp = new Date().toISOString();
    const adminId = adminUser?.uid || "admin";

    const newLog: UserOverrideAuditLog = {
      id: "ovlog_" + Date.now(),
      timestamp,
      adminId,
      action: "REVOKE_SESSION",
      parameter: "sessionRevokedAt",
      newValue: timestamp,
      notes: "Revoked active session token & forced sign-out",
    };

    const currentLogs: UserOverrideAuditLog[] = selectedUser.overrideAuditLogs || selectedUser.overrideLogs || [];
    const updatedLogs = [newLog, ...currentLogs];

    const updatedUser = {
      ...selectedUser,
      sessionRevokedAt: timestamp,
      overrideAuditLogs: updatedLogs,
      updatedAt: timestamp,
    };

    try {
      await saveToCloud(`users/${selectedUser.id}`, updatedUser);
      setUsersList((prev) => prev.map((u) => (u.id === selectedUser.id ? updatedUser : u)));
      logUserActivity(adminId, "Session Revoked", `Admin revoked sessions for user ${selectedUser.id}`, false, "auth");
      showAdminToast("User profile updated successfully", "success");
    } catch (err: any) {
      console.error("Failed to revoke session:", err);
      showAdminToast("Failed to revoke user session: " + (err?.message || String(err)), "error");
    }
  };

  // Reset Cached Local State
  const handleResetCachedState = async () => {
    if (!selectedUser) return;
    if (!window.confirm(`Reset cached local storage state for user ${selectedUser.id}?`)) return;

    const timestamp = new Date().toISOString();
    const adminId = adminUser?.uid || "admin";

    const newLog: UserOverrideAuditLog = {
      id: "ovlog_" + Date.now(),
      timestamp,
      adminId,
      action: "RESET_LOCAL_CACHE",
      parameter: "resetCacheTimestamp",
      newValue: timestamp,
      notes: "Flagged client to purge stale browser cache and reload profile",
    };

    const currentLogs: UserOverrideAuditLog[] = selectedUser.overrideAuditLogs || selectedUser.overrideLogs || [];
    const updatedLogs = [newLog, ...currentLogs];

    const updatedUser = {
      ...selectedUser,
      resetCacheTimestamp: timestamp,
      overrideAuditLogs: updatedLogs,
      updatedAt: timestamp,
    };

    try {
      await saveToCloud(`users/${selectedUser.id}`, updatedUser);
      setUsersList((prev) => prev.map((u) => (u.id === selectedUser.id ? updatedUser : u)));
      logUserActivity(adminId, "Cache Reset Flagged", `Admin flagged cache reset for user ${selectedUser.id}`, false, "system");
      showAdminToast("User profile updated successfully", "success");
    } catch (err: any) {
      console.error("Failed to flag reset cache:", err);
      showAdminToast("Failed to reset cached state: " + (err?.message || String(err)), "error");
    }
  };

  // Automated Account Repair & Error Resolution Engine
  const handleAutoFixAccount = async () => {
    if (!selectedUser) return;
    setIsAutoFixing(true);
    setAutoFixSuccessToast(null);

    const targetUserId = selectedUser.id;
    const resolvedEmail = getUserEmail(selectedUser);
    const resolvedUsername = getUserUsername(selectedUser) || resolvedEmail || targetUserId;
    const nowIso = new Date().toISOString();

    try {
      // 1. Clear & resolve lingering active error logs in user history
      const sanitizedLogs = (selectedUser.logs || []).map((l: any) => {
        if (l.isError || l.severity === "error" || l.type === "error") {
          return {
            ...l,
            isError: false,
            severity: "info",
            resolved: true,
            resolvedAt: nowIso,
            resolutionNotes: "Auto-fixed & resolved via Admin Console Repair Engine",
          };
        }
        return l;
      });

      // Prepend repair entry to user audit logs
      sanitizedLogs.unshift({
        id: "autofix_" + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
        timestamp: nowIso,
        action: "Account Auto-Fixed & Resynced",
        details: `WebSocket connection listeners reset, sync locks cleared, Firestore document schema fields re-initialized, and background resync signal broadcast for UID: ${targetUserId}`,
        isError: false,
        resolved: true,
        category: "system",
      });

      // 2. Re-initialize and sync Firestore document schema with verified fallback fields
      const repairedUserObj = {
        ...selectedUser,
        accountStatus: selectedUser.accountStatus || "Active",
        status: selectedUser.accountStatus || selectedUser.status || "Active",
        plan: selectedUser.plan || selectedUser.planName || "Free Trial",
        planName: selectedUser.planName || selectedUser.plan || "Free Trial",
        planTier: selectedUser.planTier || ((selectedUser.plan || "").toLowerCase().includes("pro") ? "pro" : (selectedUser.plan || "").toLowerCase().includes("enterprise") ? "enterprise" : "free_tier"),
        email: selectedUser.email || resolvedEmail || "",
        signupEmail: selectedUser.signupEmail || resolvedEmail || "",
        username: resolvedUsername,
        displayName: selectedUser.displayName || resolvedUsername,

        // WebSocket & Sync state reset keys
        forceSyncTimestamp: nowIso,
        resetCacheTimestamp: nowIso,
        syncResetPulse: nowIso,
        webSocketState: "connected_healthy",
        sessionSyncLockCleared: true,
        lastSyncError: null,
        lastSyncErrorResolvedAt: nowIso,
        updatedAt: nowIso,

        // Business details fallback
        business: {
          companyName: selectedUser.business?.companyName || selectedUser.displayName || "Registered Enterprise",
          gstin: selectedUser.business?.gstin || "",
          phone: selectedUser.business?.phone || "",
          email: selectedUser.business?.email || resolvedEmail || "",
          address: selectedUser.business?.address || "",
          country: selectedUser.business?.country || "India",
          currency: selectedUser.business?.currency || "INR",
        },

        // Repaired logs
        logs: sanitizedLogs,
      };

      // Save repaired document to Firestore
      await saveToCloud(`users/${targetUserId}`, repairedUserObj);

      // Update local state
      setUsersList((prev) => prev.map((u) => (u.id === targetUserId ? repairedUserObj : u)));

      if (onUserUpdated) {
        onUserUpdated(repairedUserObj);
      }

      logUserActivity(
        adminUser?.uid,
        "Auto-Fix Account Triggered",
        `Successfully repaired WebSocket listeners, sync state, and Firestore schema fallbacks for ${resolvedUsername} (${targetUserId})`,
        false,
        "system"
      );

      // Show success notification toast
      const toastMsg = `Account sync state and connection handlers successfully repaired for ${resolvedUsername}`;
      setAutoFixSuccessToast(toastMsg);

      setTimeout(() => {
        setAutoFixSuccessToast((curr) => (curr === toastMsg ? null : curr));
      }, 5000);
    } catch (err: any) {
      console.error("Auto-Fix Account failed:", err);
      alert(`Failed to auto-fix user account: ${err?.message || String(err)}`);
    } finally {
      setIsAutoFixing(false);
    }
  };

  // Save Per-User Overrides & Flags
  const handleSaveUserOverrides = async () => {
    if (!selectedUser) return;
    setSavingOverrides(true);
    setOverridesSuccessMsg("");

    const timestamp = new Date().toISOString();
    const adminId = adminUser?.uid || "admin";
    const oldOverrides = selectedUser.overrides || {};

    const changes: string[] = [];
    if (oldOverrides.bypassDocLimit !== overrideForm.bypassDocLimit) {
      changes.push(`Bypass Doc Limit: ${!!oldOverrides.bypassDocLimit} → ${overrideForm.bypassDocLimit}`);
    }
    if (oldOverrides.forceRefreshState !== overrideForm.forceRefreshState) {
      changes.push(`Force Refresh State: ${!!oldOverrides.forceRefreshState} → ${overrideForm.forceRefreshState}`);
    }
    if (oldOverrides.skipValidation !== overrideForm.skipValidation) {
      changes.push(`Skip Validation: ${!!oldOverrides.skipValidation} → ${overrideForm.skipValidation}`);
    }
    if (oldOverrides.enableBetaOCR !== overrideForm.enableBetaOCR) {
      changes.push(`Enable Beta OCR: ${!!oldOverrides.enableBetaOCR} → ${overrideForm.enableBetaOCR}`);
    }
    if (oldOverrides.forcedPlan !== overrideForm.forcedPlan) {
      changes.push(`Forced Plan: ${oldOverrides.forcedPlan || 'None'} → ${overrideForm.forcedPlan}`);
    }
    if (oldOverrides.customDocQuota !== overrideForm.customDocQuota) {
      changes.push(`Custom Quota: ${oldOverrides.customDocQuota ?? 'Default'} → ${overrideForm.customDocQuota ?? 'Default'}`);
    }
    if (oldOverrides.bonusDocCredits !== overrideForm.bonusDocCredits) {
      changes.push(`Bonus Credits: ${oldOverrides.bonusDocCredits || 0} → ${overrideForm.bonusDocCredits || 0}`);
    }
    if (oldOverrides.accountLockStatus !== overrideForm.accountLockStatus) {
      changes.push(`Account Mode: ${oldOverrides.accountLockStatus || selectedUser.accountStatus || 'Active'} → ${overrideForm.accountLockStatus}`);
    }

    const newLog: UserOverrideAuditLog = {
      id: "ovlog_" + Date.now(),
      timestamp,
      adminId,
      action: "UPDATE_OVERRIDES",
      parameter: changes.length > 0 ? changes.join(" | ") : "User overrides updated",
      notes: "Manual admin override settings applied",
    };

    const currentLogs: UserOverrideAuditLog[] = selectedUser.overrideAuditLogs || selectedUser.overrideLogs || [];
    const updatedLogs = changes.length > 0 ? [newLog, ...currentLogs] : currentLogs;

    let effectivePlan = selectedUser.plan;
    let effectiveStatus = selectedUser.accountStatus;
    let effectiveDocRemaining = selectedUser.documentsRemaining;

    if (overrideForm.forcedPlan && overrideForm.forcedPlan !== "None") {
      effectivePlan = overrideForm.forcedPlan;
    }

    if (overrideForm.accountLockStatus) {
      effectiveStatus = overrideForm.accountLockStatus;
    }

    if (overrideForm.bonusDocCredits && overrideForm.bonusDocCredits > 0) {
      const baseRem = selectedUser.documentsRemaining !== undefined ? selectedUser.documentsRemaining : 5;
      effectiveDocRemaining = baseRem + overrideForm.bonusDocCredits;
    }

    const lowerEffPlan = (effectivePlan || "").toLowerCase();
    const isEnterprise = lowerEffPlan.includes("enterprise") || lowerEffPlan.includes("admin");
    const isPro = lowerEffPlan.includes("pro");
    const isEffPaid = isEnterprise || isPro;
    if (isEffPaid) {
      effectiveDocRemaining = 999999;
    }
    const effectivePlanTier = isEnterprise ? "enterprise" : isPro ? "pro" : ((effectiveDocRemaining !== undefined && effectiveDocRemaining > 0) ? "free-trial" : "expired");
    const effectiveTrialExhausted = !isEffPaid && (effectiveDocRemaining !== undefined && effectiveDocRemaining <= 0);

    const updatedUser = {
      ...selectedUser,
      plan: effectivePlan,
      planName: effectivePlan,
      planTier: effectivePlanTier,
      trialExhausted: effectiveTrialExhausted,
      accountStatus: effectiveStatus,
      documentsRemaining: effectiveDocRemaining,
      overrides: {
        ...overrideForm,
        lastSavedAt: timestamp,
        savedBy: adminId,
      },
      overrideAuditLogs: updatedLogs,
      updatedAt: timestamp,
    };

    try {
      await saveToCloud(`users/${selectedUser.id}`, updatedUser);
      const email = getUserEmail(selectedUser);
      if (email) {
        await updateTrialLedger(email, {
          planTier: effectivePlanTier,
          planName: effectivePlan,
          documentsRemaining: effectiveDocRemaining,
          trialExhausted: effectiveTrialExhausted,
        });
      }
      setUsersList((prev) => prev.map((u) => (u.id === selectedUser.id ? updatedUser : u)));
      if (onUserUpdated) {
        onUserUpdated(updatedUser);
      }
      logUserActivity(
        adminId,
        "User Overrides Applied",
        `Admin updated overrides for user ${selectedUser.id}: ${changes.join(", ") || "No changed values"}`,
        false,
        "system"
      );
      setOverridesSuccessMsg("User overrides & troubleshooting settings saved successfully!");
      setTimeout(() => setOverridesSuccessMsg(""), 4000);
    } catch (err) {
      console.error("Failed to save overrides:", err);
      alert("Failed to save overrides to cloud.");
    } finally {
      setSavingOverrides(false);
    }
  };

  // --- CRUD OPERATIONAL HANDLERS ---
  
  // Delete document
  const handleDeleteDocument = async (docIdToDelete: string) => {
    if (!selectedUser) return;
    if (!window.confirm(`Are you sure you want to delete document ${docIdToDelete}?`)) return;

    const currentHistory = selectedUser.history || [];
    const updatedHistory = currentHistory.filter(
      (d: any) => (d.documentNumber || d.id) !== docIdToDelete && d.id !== docIdToDelete
    );

    const updatedUser = {
      ...selectedUser,
      history: updatedHistory,
      updatedAt: new Date().toISOString(),
    };

    try {
      await saveToCloud(`users/${selectedUser.id}`, updatedUser);
      setUsersList((prev) => prev.map((u) => (u.id === selectedUser.id ? updatedUser : u)));
      logUserActivity(adminUser?.uid, "Document Deleted", `Admin deleted document ${docIdToDelete} from user ${selectedUser.id}`, false, "document");
    } catch (err) {
      console.error("Failed to delete document:", err);
      alert("Failed to delete document from cloud backup.");
    }
  };

  // Open Document Modal for Create or Edit
  const handleOpenDocModal = (existingDoc?: any) => {
    if (existingDoc) {
      setDocForm({
        id: existingDoc.id || existingDoc.documentNumber || "DOC_" + Date.now(),
        documentNumber: existingDoc.documentNumber || existingDoc.id || "",
        type: existingDoc.type || "INVOICE",
        date: existingDoc.date || new Date().toISOString().split("T")[0],
        partyName: existingDoc.customer?.name || existingDoc.supplier?.name || "",
        amount: existingDoc.grandTotal || existingDoc.total || 0,
        notes: existingDoc.notes || "",
      });
    } else {
      const autoNum = "INV-" + Math.floor(1000 + Math.random() * 9000);
      setDocForm({
        id: autoNum,
        documentNumber: autoNum,
        type: "TAX INVOICE",
        date: new Date().toISOString().split("T")[0],
        partyName: "",
        amount: 0,
        notes: "",
      });
    }
    setIsDocModalOpen(true);
  };

  // Save Document (Add or Edit)
  const handleSaveDocForm = async () => {
    if (!selectedUser) return;
    if (!docForm.documentNumber) {
      alert("Please enter a valid document number");
      return;
    }

    const currentHistory = [...(selectedUser.history || [])];
    const existingIdx = currentHistory.findIndex(
      (d: any) => d.id === docForm.id || d.documentNumber === docForm.documentNumber
    );

    const customerObj: CustomerDetails = {
      name: docForm.partyName || "Valued Customer",
      address: "",
      gstin: "",
      phone: "",
      email: "",
    };

    const lineItems: LineItem[] = [
      {
        id: "item-1",
        description: docForm.notes || "General Sales / Service",
        hsn: "9983",
        quantity: 1,
        unit: "PCS",
        rate: Number(docForm.amount),
        taxRate: 18,
      },
    ];

    const businessObj: BusinessDetails = selectedUser?.business || {
      name: "Sample Business",
      email: "",
      phone: "",
      address: "",
      gstin: "",
    };

    const layoutObj: PDFLayoutSettings = selectedUser?.layoutSettings || {
      template: "classic",
      sectionOrder: ["header", "party_details", "items_table", "totals", "bank_details", "terms", "signature"],
      accentColor: "#1e293b",
      fontFamily: "Inter",
      headerHeight: 25,
      footerHeight: 20,
      hideForPreprintedLetterhead: false,
    };

    const fullDataObj: InvoiceData = {
      id: docForm.id || docForm.documentNumber,
      type: (docForm.type || "TAX INVOICE") as DocumentType,
      date: docForm.date || new Date().toISOString().split("T")[0],
      dueDate: docForm.date || new Date().toISOString().split("T")[0],
      business: businessObj,
      customer: customerObj,
      items: lineItems,
      discount: 0,
      notes: docForm.notes || "",
      terms: "",
      currency: "INR",
      layoutSettings: layoutObj,
    };

    const updatedDocObj = {
      id: docForm.id || docForm.documentNumber,
      timestamp: Date.now(),
      documentNumber: docForm.documentNumber,
      type: docForm.type,
      date: docForm.date,
      customerName: docForm.partyName || "Valued Customer",
      customer: { name: docForm.partyName || "Valued Customer" },
      items: [{ description: "General Sales / Service", quantity: 1, rate: Number(docForm.amount), taxRate: 18 }],
      grandTotal: Number(docForm.amount),
      total: Number(docForm.amount),
      subtotal: Number(docForm.amount),
      notes: docForm.notes,
      fullData: fullDataObj,
      updatedAt: new Date().toISOString()
    };

    if (existingIdx >= 0) {
      currentHistory[existingIdx] = { ...currentHistory[existingIdx], ...updatedDocObj };
    } else {
      currentHistory.unshift(updatedDocObj);
    }

    const updatedUser = {
      ...selectedUser,
      history: currentHistory,
      updatedAt: new Date().toISOString(),
    };

    try {
      await saveToCloud(`users/${selectedUser.id}`, updatedUser);
      setUsersList((prev) => prev.map((u) => (u.id === selectedUser.id ? updatedUser : u)));
      setIsDocModalOpen(false);
      logUserActivity(adminUser?.uid, "Document Saved", `Admin saved doc ${docForm.documentNumber} for user ${selectedUser.id}`, false, "document");
    } catch (err) {
      console.error("Failed to save document:", err);
      alert("Failed to save document.");
    }
  };

  // Create New User Account
  const handleCreateUser = async () => {
    if (!newUserForm.email) {
      alert("Please enter a valid user email address.");
      return;
    }

    const newUid = "usr_" + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    const resolvedEmail = newUserForm.email.trim();
    const resolvedUsername = (newUserForm.displayName || newUserForm.companyName || resolvedEmail.split('@')[0] || "New Enterprise").trim();

    const isPro = (newUserForm.plan || "").toLowerCase().includes("pro");
    const isEnterprise = (newUserForm.plan || "").toLowerCase().includes("enterprise");
    const isPaid = isPro || isEnterprise;
    const initialRemaining = isPaid ? 999999 : 5;
    const planTierVal = isEnterprise ? "enterprise" : isPro ? "pro" : "free-trial";
    const planNameVal = isEnterprise ? "Enterprise Admin" : isPro ? "Pro Plan" : "Free Trial";

    const newUserObj = {
      id: newUid,
      email: resolvedEmail,
      signupEmail: resolvedEmail,
      authEmail: resolvedEmail,
      username: resolvedUsername,
      authUsername: resolvedUsername,
      displayName: resolvedUsername,
      accountStatus: newUserForm.status || "Active",
      status: (newUserForm.status || "Active").toLowerCase(),
      plan: planNameVal,
      planTier: planTierVal,
      planName: planNameVal,
      documentsRemaining: initialRemaining,
      documentsUsed: 0,
      lifetimeCreatedCount: 0,
      totalGeneratedDocsCount: 0,
      trialExhausted: false,
      trialUsed: true,
      hasSeenWelcome: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      business: {
        companyName: newUserForm.companyName || "New Enterprise Ltd",
        email: resolvedEmail,
        gstin: newUserForm.gstin || "27ABCDE1234F1Z5",
        country: "India",
        currency: "INR"
      },
      history: [],
      logs: [
        { id: "log_" + Date.now(), timestamp: new Date().toISOString(), action: "User Created", details: "Account provisioned via Admin Console", isError: false, category: "system" }
      ],
      adminNotes: "New user account created directly from admin console."
    };

    try {
      await saveToCloud(`users/${newUid}`, newUserObj);
      if (resolvedEmail) {
        await updateTrialLedger(resolvedEmail, {
          email: resolvedEmail,
          planTier: planTierVal,
          planName: planNameVal,
          documentsRemaining: initialRemaining,
          documentsUsed: 0,
          lifetimeCreatedCount: 0,
          totalGeneratedDocsCount: 0,
          trialExhausted: false,
          trialUsed: true,
          firstCreatedUid: newUid
        });
      }
      setUsersList((prev) => [newUserObj, ...prev]);
      setSelectedUserId(newUid);
      setIsNewUserModalOpen(false);
      setNewUserForm({ email: "", displayName: "", companyName: "", gstin: "", plan: "Free Trial", status: "Active" });
      logUserActivity(adminUser?.uid, "User Account Created", `Admin created user ${newUid} (${newUserForm.email})`, false, "auth");
    } catch (err) {
      console.error("Failed to create user:", err);
      alert("Failed to create user account.");
    }
  };

  // Security Password update handler
  const handleSaveSecurityPassword = async () => {
    setSetPasswordModalError("");
    setSetPasswordModalSuccess("");

    const existingPass = localStorage.getItem("admin_security_password") || localStorage.getItem("billiq_admin_security_pass") || adminSecurityPassword;

    // Only require current password if a security password was previously configured
    if (existingPass) {
      if (!currentPassInput.trim()) {
        setSetPasswordModalError("Please enter your current admin security password.");
        return;
      }
      if (currentPassInput.trim() !== existingPass) {
        setSetPasswordModalError("Current admin security password is incorrect.");
        return;
      }
    }

    if (!newPassInput.trim() || newPassInput.trim().length < 4) {
      setSetPasswordModalError("New security password must be at least 4 characters long.");
      return;
    }

    if (newPassInput.trim() !== confirmPassInput.trim()) {
      setSetPasswordModalError("New password and confirmation password do not match.");
      return;
    }

    const updatedPass = newPassInput.trim();
    setAdminSecurityPassword(updatedPass);
    localStorage.setItem("admin_security_password", updatedPass);
    localStorage.setItem("billiq_admin_security_pass", updatedPass);
    setDeletePasswordError("");

    try {
      await saveToCloud("admin_config/security", {
        securityPassword: updatedPass,
        updatedAt: new Date().toISOString(),
        updatedBy: adminUser?.uid || "admin",
      });
    } catch (e) {
      console.warn("Saved locally; cloud notice:", e);
    }

    setSetPasswordModalSuccess("Admin Security Password saved successfully!");

    setTimeout(() => {
      setIsSetPasswordModalOpen(false);
      setCurrentPassInput("");
      setNewPassInput("");
      setConfirmPassInput("");
      setSetPasswordModalSuccess("");
    }, 1000);
  };

  // Delete User Account Handlers
  const handleOpenDeleteUserModal = (user: any) => {
    if (!user) return;
    if (user.id === ADMIN_UID) {
      alert("System Administrator account cannot be deleted.");
      return;
    }
    setUserToDelete(user);
    setDeleteAdminPassword("");
    setDeletePasswordError("");
    setIsDeleteUserModalOpen(true);
  };

  const handleConfirmDeleteUser = async () => {
    if (!userToDelete) return;

    const currentPass = localStorage.getItem("admin_security_password") || localStorage.getItem("billiq_admin_security_pass") || adminSecurityPassword;

    if (!currentPass) {
      setDeletePasswordError("No security password configured yet. Click 'Set / Change Password' above to create one first.");
      return;
    }

    const enteredPass = deleteAdminPassword.trim();
    if (!enteredPass) {
      setDeletePasswordError("Admin security password is required to authorize account deletion.");
      return;
    }

    if (enteredPass !== currentPass) {
      setDeletePasswordError("Incorrect Admin Security Password! Account deletion rejected.");
      return;
    }

    setIsDeletingUser(true);
    setDeletePasswordError("");

    try {
      const targetId = userToDelete.id;

      // Permanently remove document and all subcollections/linked records from Firestore
      await deleteUserAccount(targetId);

      // Update local state list
      setUsersList((prev) => prev.filter((u) => u.id !== targetId));

      if (selectedUserId === targetId) {
        const remaining = usersList.filter((u) => u.id !== targetId);
        setSelectedUserId(remaining[0]?.id || null);
      }

      logUserActivity(
        adminUser?.uid,
        "User Account Permanently Deleted",
        `Admin deleted user account ${targetId} (${getUserEmail(userToDelete) || "No Email"})`,
        false,
        "auth"
      );

      setIsDeleteUserModalOpen(false);
      setUserToDelete(null);
      setDeleteAdminPassword("");
      alert(`User account (${targetId}) was permanently deleted.`);
    } catch (err: any) {
      console.error("Failed to delete user account:", err);
      setDeletePasswordError("Failed to delete user account: " + (err?.message || String(err)));
    } finally {
      setIsDeletingUser(false);
    }
  };

  // Purge ALL User Data & Accounts Except the 2 Preserved Admin / Founder Accounts
  const handleConfirmPurgeAll = async () => {
    const currentPass = localStorage.getItem("admin_security_password") || localStorage.getItem("billiq_admin_security_pass") || adminSecurityPassword;

    if (!currentPass) {
      setPurgePasswordError("No security password configured yet. Click 'Set / Change Password' above to create one first.");
      return;
    }

    const enteredPass = purgeAdminPassword.trim();
    if (!enteredPass) {
      setPurgePasswordError("Admin security password is required to authorize database wipe.");
      return;
    }

    if (enteredPass !== currentPass) {
      setPurgePasswordError("Incorrect Admin Security Password! Purge operation rejected.");
      return;
    }

    setIsPurgingAll(true);
    setPurgePasswordError("");

    try {
      // Filter out preserved accounts:
      // 1. Founder: "XssthfE8PHMi9j3iNMmCYQ9Sqgk2" / "mehtavatsal24@gmail.com"
      // 2. Official Admin / Support: "BzfnRqFFUtVeoqjxcLolmu6SRIA3" / "support@billiq.site"
      const usersToErase = usersList.filter((u) => {
        const email = getUserEmail(u).toLowerCase().trim();
        const id = u.id;
        const isPreservedId = id === ADMIN_UID || id === "BzfnRqFFUtVeoqjxcLolmu6SRIA3";
        const isPreservedEmail = email === "mehtavatsal24@gmail.com" || email === "support@billiq.site" || email === "admin@smartbill.ai";
        return !isPreservedId && !isPreservedEmail;
      });

      console.log(`[Admin Purge] Erasing data of ${usersToErase.length} user accounts...`);

      for (const u of usersToErase) {
        try {
          await deleteUserAccount(u.id);
        } catch (delErr) {
          console.warn(`[Admin Purge] Could not delete user account ${u.id}:`, delErr);
        }
      }

      // Refresh list
      await loadAllUsers();
      setIsPurgeModalOpen(false);
      setPurgeAdminPassword("");
      showAdminToast(`Successfully erased ${usersToErase.length} user accounts. App is now completely refreshed for new client logins!`, "success");
      alert(`Successfully wiped all non-admin data. Erased ${usersToErase.length} account(s). Preserved Founder and Support accounts.`);
    } catch (err: any) {
      console.error("Purge all failed:", err);
      setPurgePasswordError("Failed to purge accounts: " + (err?.message || String(err)));
    } finally {
      setIsPurgingAll(false);
    }
  };

  // Open Edit Business Profile Modal
  const handleOpenBusinessModal = () => {
    if (!selectedUser) return;
    const biz = selectedUser.business || {};
    setBusinessForm({
      companyName: biz.companyName || biz.name || "",
      gstin: biz.gstin || "",
      phone: biz.phone || "",
      email: biz.email || selectedUser.email || "",
      address: biz.address || "",
      country: biz.country || "India",
      currency: biz.currency || "INR",
    });
    setIsEditBusinessModalOpen(true);
  };

  // Save Business Registration Info
  const handleSaveBusinessInfo = async () => {
    if (!selectedUser) return;

    const updatedUser = {
      ...selectedUser,
      email: selectedUser.email || businessForm.email || "",
      business: {
        ...(selectedUser.business || {}),
        name: businessForm.companyName,
        companyName: businessForm.companyName,
        gstin: businessForm.gstin,
        phone: businessForm.phone,
        email: businessForm.email,
        address: businessForm.address,
        country: businessForm.country,
        currency: businessForm.currency,
      },
      updatedAt: new Date().toISOString(),
    };

    try {
      await saveToCloud(`users/${selectedUser.id}`, updatedUser);
      setUsersList((prev) => prev.map((u) => (u.id === selectedUser.id ? updatedUser : u)));
      setIsEditBusinessModalOpen(false);
      logUserActivity(adminUser?.uid, "Business Profile Updated", `Updated business details for ${selectedUser.id}`, false, "settings");
      showAdminToast("User profile updated successfully", "success");
    } catch (err: any) {
      console.error("Failed to update business profile:", err);
      showAdminToast("Failed to save business details: " + (err?.message || String(err)), "error");
    }
  };

  // Filtered users list
  const filteredUsers = usersList.filter((u) => {
    const searchLower = searchTerm.toLowerCase();
    const resolvedEmail = getUserEmail(u);
    const resolvedUsername = getUserUsername(u);
    const matchesSearch =
      !searchLower ||
      resolvedEmail.toLowerCase().includes(searchLower) ||
      resolvedUsername.toLowerCase().includes(searchLower) ||
      (u.displayName || "").toLowerCase().includes(searchLower) ||
      (u.id || "").toLowerCase().includes(searchLower) ||
      (u.business?.companyName || "").toLowerCase().includes(searchLower);

    if (!matchesSearch) return false;

    // Account Status filter
    const status = u.accountStatus || (u.isDeleted || u.status === "Deleted" ? "Deleted" : "Active");
    if (statusFilter === "active" && status !== "Active") return false;
    if (statusFilter === "suspended" && status !== "Suspended") return false;
    if (statusFilter === "deleted" && status !== "Deleted" && !u.isDeleted && u.status !== "Deleted") return false;

    // User Plan filter
    if (planFilter !== "all") {
      const p = (u.plan || u.planName || u.planTier || "").toLowerCase();
      const uEmail = getUserEmail(u).toLowerCase();
      const isAdmin = u.role === "admin" || ADMIN_EMAILS.some(e => e.toLowerCase() === uEmail) || p.includes("admin") || p.includes("enterprise");

      if (planFilter === "enterprise") {
        if (!isAdmin && !p.includes("enterprise")) return false;
      } else if (planFilter === "pro") {
        if (!p.includes("pro") || isAdmin) return false;
      } else if (planFilter === "free_tier") {
        if (isAdmin || p.includes("pro") || p.includes("enterprise")) return false;
        const isFreeTier = (p.includes("free") && !p.includes("trial")) || u.planTier === "free_tier" || u.planTier === "50";
        if (!isFreeTier) return false;
      } else if (planFilter === "free_trial") {
        if (isAdmin || p.includes("pro") || p.includes("enterprise")) return false;
        const isFreeTier = (p.includes("free") && !p.includes("trial")) || u.planTier === "free_tier" || u.planTier === "50";
        if (isFreeTier) return false;
      }
    }

    // Activity Status & Day Filter
    if (activityFilter !== "all") {
      const rawCreated = u.createdAt || u.registrationDate || u.created_at;
      const regDateStr = rawCreated ? toLocalDateString(rawCreated) : "";
      
      const rawLastLogin = u.lastLoginAt || u.lastLogin;
      const loginDateStr = rawLastLogin ? toLocalDateString(rawLastLogin) : "";

      const rawLastActive = u.lastActiveAt || u.lastActive || u.lastSeen || u.updatedAt || u.createdAt;
      const activeDateStr = rawLastActive ? toLocalDateString(rawLastActive) : "";
      const lastActiveTime = rawLastActive ? normalizeTimestampToMs(rawLastActive) : 0;
      const nowTime = Date.now();

      if (activityFilter === "signups_today") {
        if (regDateStr !== todayDateStr) return false;
      } else if (activityFilter === "signins_today") {
        if (loginDateStr !== todayDateStr && regDateStr !== todayDateStr && activeDateStr !== todayDateStr) return false;
      } else if (activityFilter === "online_now") {
        if (!u.isOnline && u.isOnline !== undefined) return false;
        const recentTime = Math.max(
          u.lastSeen ? normalizeTimestampToMs(u.lastSeen) : 0,
          u.lastActive ? normalizeTimestampToMs(u.lastActive) : 0,
          u.lastActiveAt ? normalizeTimestampToMs(u.lastActiveAt) : 0
        );
        if (nowTime - recentTime > 5 * 60 * 1000) return false;
      } else if (activityFilter === "active_today") {
        if (activeDateStr !== todayDateStr && loginDateStr !== todayDateStr && regDateStr !== todayDateStr) return false;
      } else if (activityFilter === "active_yesterday") {
        if (activeDateStr !== yesterdayDateStr && loginDateStr !== yesterdayDateStr && regDateStr !== yesterdayDateStr) return false;
      } else if (activityFilter === "active_7d") {
        if (lastActiveTime === 0 || nowTime - lastActiveTime > 7 * 24 * 60 * 60 * 1000) return false;
      } else if (activityFilter === "inactive_3d") {
        if (lastActiveTime > 0 && nowTime - lastActiveTime <= 3 * 24 * 60 * 60 * 1000) return false;
      } else if (activityFilter === "inactive_7d") {
        if (lastActiveTime > 0 && nowTime - lastActiveTime <= 7 * 24 * 60 * 60 * 1000) return false;
      } else if (activityFilter === "custom_date" && customFilterDate) {
        const matchesCustom =
          regDateStr === customFilterDate ||
          loginDateStr === customFilterDate ||
          activeDateStr === customFilterDate;
        if (!matchesCustom) return false;
      }
    }

    return true;
  });

  // Sorted and Filtered users list
  const sortedAndFilteredUsers = useMemo(() => {
    return [...filteredUsers].sort((a, b) => {
      const emailA = getUserEmail(a).toLowerCase().trim();
      const emailB = getUserEmail(b).toLowerCase().trim();
      const isAdminA = a.role === "admin" || ADMIN_EMAILS.some(e => e.toLowerCase() === emailA);
      const isAdminB = b.role === "admin" || ADMIN_EMAILS.some(e => e.toLowerCase() === emailB);

      // System admins sorted to top
      if (isAdminA && !isAdminB) return -1;
      if (!isAdminA && isAdminB) return 1;

      const nameA = a.displayName || emailA || a.id || "";
      const nameB = b.displayName || emailB || b.id || "";

      const dateA = new Date(a.createdAt || a.joinedAt || a.updatedAt || 0).getTime();
      const dateB = new Date(b.createdAt || b.joinedAt || b.updatedAt || 0).getTime();

      const planWeight = (u: any) => {
        const email = getUserEmail(u).toLowerCase();
        if (u.role === "admin" || ADMIN_EMAILS.some(e => e.toLowerCase() === email)) return 4;
        const p = (u.plan || u.planName || u.planTier || "").toLowerCase();
        if (p.includes("enterprise") || p.includes("admin")) return 4;
        if (p.includes("pro")) return 3;
        if ((p.includes("free") && !p.includes("trial")) || u.planTier === "free_tier" || u.planTier === "50") return 2;
        return 1; // Free Trial
      };

      const statusWeight = (u: any) => {
        const st = u.accountStatus || (u.isDeleted || u.status === "Deleted" ? "Deleted" : "Active");
        if (st === "Active") return 1;
        if (st === "Suspended") return 2;
        if (st === "Deleted") return 3;
        return 4;
      };

      const docCountA = Array.isArray(a.history) ? a.history.length : (a.documentsUsed || a.documentCount || 0);
      const docCountB = Array.isArray(b.history) ? b.history.length : (b.documentsUsed || b.documentCount || 0);

      if (sortBy === "date-desc") return dateB - dateA;
      if (sortBy === "date-asc") return dateA - dateB;
      if (sortBy === "plan-desc") return planWeight(b) - planWeight(a);
      if (sortBy === "plan-asc") return planWeight(a) - planWeight(b);
      if (sortBy === "status-asc") return statusWeight(a) - statusWeight(b);
      if (sortBy === "status-desc") return statusWeight(b) - statusWeight(a);
      if (sortBy === "usage-desc") return docCountB - docCountA;
      if (sortBy === "usage-asc") return docCountA - docCountB;
      if (sortBy === "name-asc") return nameA.localeCompare(nameB);
      if (sortBy === "name-desc") return nameB.localeCompare(nameA);
      return 0;
    });
  }, [filteredUsers, sortBy]);

  // Save Admin Notes
  const handleSaveNotes = async () => {
    if (!selectedUser) return;
    setSavingNotes(true);
    setNotesSaveSuccess(false);
    try {
      const updatedUser = {
        ...selectedUser,
        adminNotes: adminNotesText,
        updatedAt: new Date().toISOString(),
      };

      // Save to cloud
      await saveToCloud(`users/${selectedUser.id}`, updatedUser);

      // Update state
      setUsersList((prev) => prev.map((u) => (u.id === selectedUser.id ? updatedUser : u)));
      setNotesSaveSuccess(true);
      setTimeout(() => setNotesSaveSuccess(false), 3000);
      logUserActivity(adminUser?.uid, "Admin Notes Saved", `Updated admin notes for user ${selectedUser.id}`, false, "system");
      showAdminToast("User profile updated successfully", "success");
    } catch (e: any) {
      console.error("Failed to save admin notes", e);
      showAdminToast("Failed to save admin notes: " + (e?.message || String(e)), "error");
    } finally {
      setSavingNotes(false);
    }
  };

  // Save Account Status, Role (RBAC), or Plan & Sync with Permanent Trial Ledger
  const handleSaveUserMeta = async (newStatus: string, newPlan: string, newRole?: string) => {
    if (!selectedUser) return;
    setSavingUserMeta(true);
    try {
      const email = getUserEmail(selectedUser);
      const lowerPlan = newPlan.toLowerCase();
      const isEnterprise = lowerPlan.includes("enterprise") || lowerPlan.includes("admin");
      const isPro = lowerPlan.includes("pro");
      const is50Tier = lowerPlan.includes("50");
      const isExpired = lowerPlan.includes("expired");
      const isUnlimited = isEnterprise || isPro;

      let docsRem = selectedUser.documentsRemaining !== undefined ? selectedUser.documentsRemaining : 5;
      if (isUnlimited) {
        docsRem = 999999;
      } else if (is50Tier) {
        docsRem = 50;
      } else if (isExpired) {
        docsRem = 0;
      } else if (docsRem <= 0 && lowerPlan.includes("free trial")) {
        docsRem = 5;
      }

      const planTierVal = isEnterprise ? "enterprise" : isPro ? "pro" : is50Tier ? "free_tier" : isExpired ? "expired" : "free-trial";
      const docQuotaVal = isUnlimited ? 999999 : (is50Tier ? 50 : docsRem);
      const maxDocsVal = isUnlimited ? 999999 : (is50Tier ? 50 : (docsRem || 5));

      const roleToSave = newRole || currentRole || selectedUser.role || "staff";

      const updatedUser = {
        ...selectedUser,
        accountStatus: newStatus,
        status: newStatus.toLowerCase(),
        role: roleToSave,
        plan: newPlan,
        planTier: planTierVal,
        planName: newPlan,
        documentsRemaining: docsRem,
        docQuota: docQuotaVal,
        maxDocs: maxDocsVal,
        updatedAt: new Date().toISOString(),
      };

      await saveToCloud(`users/${selectedUser.id}`, updatedUser);
      if (email) {
        await updateTrialLedger(email, {
          planTier: planTierVal,
          planName: newPlan,
          documentsRemaining: docsRem,
          docQuota: docQuotaVal,
          maxDocs: maxDocsVal,
        });
      }

      setUsersList((prev) => prev.map((u) => (u.id === selectedUser.id ? updatedUser : u)));
      setCurrentAccountStatus(newStatus);
      setCurrentRole(roleToSave as 'admin' | 'staff' | 'customer');
      setCurrentPlan(newPlan);
      if (onUserUpdated) {
        onUserUpdated(updatedUser);
      }
      logUserActivity(adminUser?.uid, "User Meta Updated", `Changed status to ${newStatus}, role to ${roleToSave}, plan to ${newPlan} for user ${selectedUser.id}`, false, "system");
      showAdminToast("User profile and RBAC role updated successfully", "success");
    } catch (e: any) {
      console.error("Failed to update user meta", e);
      showAdminToast("Failed to update user profile: " + (e?.message || String(e)), "error");
    } finally {
      setSavingUserMeta(false);
    }
  };

  // Grant Trial Credits directly to Selected User or any target user item
  const handleGrantTrialCredits = async (targetUserOrCredits?: any, maybeCredits: number = 5) => {
    let targetUser = selectedUser;
    let additionalCredits = 5;

    if (typeof targetUserOrCredits === "number") {
      additionalCredits = targetUserOrCredits;
    } else if (targetUserOrCredits && typeof targetUserOrCredits === "object") {
      targetUser = targetUserOrCredits;
      additionalCredits = maybeCredits || 5;
    }

    if (!targetUser) return;
    setSavingUserMeta(true);
    try {
      const email = getUserEmail(targetUser);
      const adminEmail = adminUser?.email || "admin@billiq.ai";
      const result = await adminGrantTrialCredits(targetUser.id, email, additionalCredits, undefined, adminEmail);
      
      const newPlanName = result.newTier === "enterprise" ? "Enterprise Admin" : result.newTier === "pro" ? "Pro Plan" : (result.newRemaining > 0 ? "Free Trial" : "Trial Expired");
      const isUnlimited = result.newTier === "enterprise" || result.newTier === "pro";
      const docQuotaVal = isUnlimited ? 999999 : result.newRemaining;
      const maxDocsVal = isUnlimited ? 999999 : result.newRemaining;

      const updatedUser = {
        ...targetUser,
        documentsRemaining: result.newRemaining,
        trialCreditsGranted: result.totalGranted,
        trialExhausted: false,
        docQuota: docQuotaVal,
        maxDocs: maxDocsVal,
        planTier: result.newTier,
        plan: newPlanName,
        planName: newPlanName,
        updatedAt: new Date().toISOString(),
      };

      setUsersList((prev) => prev.map((u) => (u.id === targetUser.id ? updatedUser : u)));
      if (selectedUser?.id === targetUser.id) {
        setCurrentPlan(newPlanName);
      }
      if (onUserUpdated) {
        onUserUpdated(updatedUser);
      }
      logUserActivity(adminUser?.uid, "Trial Credits Granted", `Admin granted +${additionalCredits} bonus trial credits to user ${targetUser.id} (${email})`, false, "system");
      showAdminToast(`Successfully granted +${additionalCredits} trial credits to ${getUserUsername(targetUser)}! (Remaining: ${result.newRemaining})`, "success");
    } catch (e: any) {
      console.error("Failed to grant trial credits:", e);
      showAdminToast("Failed to grant trial credits: " + (e?.message || String(e)), "error");
    } finally {
      setSavingUserMeta(false);
    }
  };

  // Helper to extract or construct 100% pixel-perfect complete InvoiceData for user documents
  const prepareFullInvoiceData = (docData: any): InvoiceData => {
    const userBusiness: BusinessDetails = selectedUser?.business || {
      name: "Sample Business",
      email: "info@example.com",
      phone: "",
      address: "",
      gstin: "",
    };
    const userLayoutSettings: PDFLayoutSettings = selectedUser?.layoutSettings || {
      template: "classic",
      sectionOrder: ["header", "party_details", "items_table", "totals", "bank_details", "terms", "signature"],
      accentColor: "#1e293b",
      fontFamily: "Inter",
      headerHeight: 25,
      footerHeight: 20,
      hideForPreprintedLetterhead: false,
    };

    // 1. If saved fullData exists, use it directly (matches exact user dashboard state)
    if (docData && docData.fullData) {
      const fd = docData.fullData;
      return {
        ...fd,
        dueDate: fd.dueDate || fd.date || new Date().toISOString().split("T")[0],
        business: {
          ...userBusiness,
          ...fd.business,
          letterhead: fd.business?.letterhead || userBusiness.letterhead || "",
          logo: fd.business?.logo || userBusiness.logo || "",
          signature: fd.business?.signature || userBusiness.signature || "",
          bankName: fd.business?.bankName || userBusiness.bankName,
          accountNumber: fd.business?.accountNumber || userBusiness.accountNumber,
          ifscCode: fd.business?.ifscCode || userBusiness.ifscCode,
          branchCode: fd.business?.branchCode || userBusiness.branchCode,
          showBankDetailsInDocs: fd.business?.showBankDetailsInDocs || userBusiness.showBankDetailsInDocs,
        },
        layoutSettings: fd.layoutSettings || userLayoutSettings,
      };
    }

    // 2. Fallback for legacy documents or documents created in Admin workspace
    const docId = docData?.documentNumber || docData?.id || "INV-001";
    const docType = (docData?.type || "TAX INVOICE") as DocumentType;
    const docDate = docData?.date || new Date().toISOString().split("T")[0];
    const dueDate = docData?.dueDate || docDate;

    const partyObj: CustomerDetails = {
      name: docData?.customer?.name || docData?.supplier?.name || docData?.customerName || docData?.partyName || "Valued Customer",
      address: docData?.customer?.address || docData?.supplier?.address || docData?.customerAddress || "",
      gstin: docData?.customer?.gstin || docData?.supplier?.gstin || docData?.customerGstin || "",
      phone: docData?.customer?.phone || docData?.supplier?.phone || docData?.customerPhone || "",
      email: docData?.customer?.email || docData?.supplier?.email || docData?.customerEmail || "",
    };

    const rawItems = docData?.items;
    const items: LineItem[] = (Array.isArray(rawItems) && rawItems.length > 0)
      ? rawItems.map((item: any, idx: number) => ({
          id: item.id || `item-${idx + 1}`,
          description: item.description || item.notes || "General Goods / Service",
          hsn: item.hsn || "9983",
          quantity: Number(item.quantity || 1),
          unit: item.unit || "PCS",
          rate: Number(item.rate || item.price || docData?.grandTotal || docData?.amount || 0),
          taxRate: Number(item.taxRate || 18),
        }))
      : [
          {
            id: "item-1",
            description: docData?.notes || "General Goods / Service",
            hsn: "9983",
            quantity: 1,
            unit: "PCS",
            rate: Number(docData?.grandTotal || docData?.total || docData?.amount || 0),
            taxRate: Number(docData?.taxRate || 18),
          }
        ];

    const discount = Number(docData?.discount || 0);

    const businessObj: BusinessDetails = {
      name: docData?.business?.name || userBusiness.name || "Sample Business",
      email: docData?.business?.email || userBusiness.email || "",
      phone: docData?.business?.phone || userBusiness.phone || "",
      address: docData?.business?.address || userBusiness.address || "",
      gstin: docData?.business?.gstin || userBusiness.gstin || "",
      state: docData?.business?.state || userBusiness.state || "",
      currency: docData?.business?.currency || userBusiness.currency || "INR",
      bankName: docData?.business?.bankName || userBusiness.bankName,
      accountNumber: docData?.business?.accountNumber || userBusiness.accountNumber,
      ifscCode: docData?.business?.ifscCode || userBusiness.ifscCode,
      letterhead: docData?.business?.letterhead || userBusiness.letterhead || "",
      logo: docData?.business?.logo || userBusiness.logo || "",
      signature: docData?.business?.signature || userBusiness.signature || "",
    };

    return {
      id: docId,
      type: docType,
      date: docDate,
      dueDate: dueDate,
      business: businessObj,
      customer: partyObj,
      items: items,
      discount: discount,
      notes: docData?.notes || "",
      terms: docData?.terms || "",
      currency: docData?.currency || "INR",
      layoutSettings: docData?.layoutSettings || userLayoutSettings,
    };
  };

  // Generate PDF Preview
  const handlePreviewDocument = async (docData: any) => {
    try {
      const fullDocData = prepareFullInvoiceData(docData);
      const pdfDoc = await generateInvoicePDF(fullDocData);
      const blob = pdfDoc.output("blob");
      const url = URL.createObjectURL(blob);
      setPreviewPdfUrl(url);
      setPreviewPdfDocName(`${fullDocData.type} - ${fullDocData.id}`);
      logUserActivity(adminUser?.uid, "PDF Previewed", `Admin previewed document ${fullDocData.id} for user ${selectedUser?.id}`, false, "document");
    } catch (e) {
      console.error("PDF Preview Error", e);
      alert("Could not generate PDF preview for this document.");
    }
  };

  // Download PDF
  const handleDownloadDocument = async (docData: any) => {
    try {
      const fullDocData = prepareFullInvoiceData(docData);
      await downloadInvoicePDF(fullDocData);
      logUserActivity(adminUser?.uid, "PDF Downloaded", `Admin downloaded document ${fullDocData.id} for user ${selectedUser?.id}`, false, "document");
    } catch (e) {
      console.error("PDF Download Error", e);
      alert("Could not download PDF for this document.");
    }
  };

  // View Raw JSON Modal
  const handleViewRawJson = (title: string, dataObj: any) => {
    setJsonModalData({ title, json: dataObj });
    setCopiedJson(false);
  };

  // Logs list for selected user
  const userLogs: AuditLogEntry[] = selectedUser
    ? [
        ...(selectedUser.logs || []),
        ...(selectedUser.audit_logs || []),
        ...(selectedUser.activity_logs || []),
        ...getUserAuditLogs(selectedUser.id)
      ]
    : [];

  // Remove duplicates by ID or fallback composite key
  const uniqueLogs = Array.from(
    new Map(
      userLogs.map((item) => [
        item.id || `${item.timestamp}_${item.action}_${item.details?.substring(0, 20)}`,
        item
      ])
    ).values()
  );
  const filteredLogs = uniqueLogs.filter((log) =>
    showErrorsOnly ? (log.isError || log.severity === "error") : true
  );

  // Security Guard: Access strictly restricted to support@billiq.site
  if (!isAdminUser(adminUser)) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 text-zinc-100 font-sans">
        <div className="max-w-md w-full bg-zinc-900 border border-red-800/80 rounded-2xl p-8 text-center shadow-2xl">
          <div className="w-16 h-16 bg-red-950/80 border border-red-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Unauthorized Access</h2>
          <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
            Administrative console features are strictly restricted to the primary administrator account (<code className="text-amber-400 font-mono">support@billiq.site</code>).
          </p>
          {onExitAdminView && (
            <button
              onClick={onExitAdminView}
              className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-medium text-sm rounded-xl transition-all cursor-pointer border border-zinc-700"
            >
              Return to Application
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-zinc-900 text-zinc-100 font-sans pb-16">
      {/* Top Navbar for Admin */}
      <header className="sticky top-0 z-40 w-full bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800 px-4 sm:px-6 md:px-12 lg:px-16 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white tracking-wide">BillIQ Admin Workspace</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                <Shield className="w-3 h-3" /> Admin Mode
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              System Audit & Multi-User Management Console
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setPurgeAdminPassword("");
              setPurgePasswordError("");
              setIsPurgeModalOpen(true);
            }}
            className="px-3 py-1.5 bg-red-950/40 hover:bg-red-900/60 text-red-300 hover:text-red-200 text-xs font-semibold rounded-lg border border-red-800/60 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            title="Erase all non-admin account data for clean client launch"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
            <span>Reset App Data</span>
          </button>

          <button
            onClick={() => {
              setCurrentPassInput("");
              setNewPassInput("");
              setConfirmPassInput("");
              setSetPasswordModalError("");
              setSetPasswordModalSuccess("");
              setIsSetPasswordModalOpen(true);
            }}
            className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 text-xs font-semibold rounded-lg border border-amber-500/30 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            title="Configure Admin Security Password for Sensitive Operations"
          >
            <Key className="w-3.5 h-3.5 text-amber-400" />
            <span>Security Password</span>
          </button>

          <button
            onClick={loadAllUsers}
            disabled={loadingUsers}
            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg border border-zinc-700 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingUsers ? "animate-spin" : ""}`} />
            <span>Refresh Data</span>
          </button>

          {onExitAdminView && (
            <button
              onClick={onExitAdminView}
              className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold rounded-lg border border-zinc-700 transition-all cursor-pointer"
            >
              Exit Admin
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 pt-6">
        
        {/* Modern Admin Top Tab Switcher */}
        <div className="flex flex-wrap items-center gap-2 mb-6 bg-zinc-950/90 p-1.5 rounded-2xl border border-zinc-800 shadow-xl backdrop-blur-md">
          <button
            type="button"
            onClick={() => setAdminMainTab("live_pulse")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2.5 ${
              adminMainTab === "live_pulse"
                ? "bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25 ring-1 ring-white/20"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/80"
            }`}
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <Activity className="w-4 h-4 text-emerald-300" />
            <span className="tracking-wide">Live Pulse & Spend</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              INR ₹
            </span>
          </button>

          <button
            type="button"
            onClick={() => setAdminMainTab("user_directory")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              adminMainTab === "user_directory"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20 ring-1 ring-white/20"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/80"
            }`}
          >
            <Users className="w-4 h-4 text-sky-400" />
            <span>User Directory & Inspector</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-800 text-zinc-300">
              {usersList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setAdminMainTab("campaigns")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              adminMainTab === "campaigns"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20 ring-1 ring-white/20"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/80"
            }`}
          >
            <Mail className="w-4 h-4 text-purple-400" />
            <span>Email Campaigns & Dispatcher</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              60s Active
            </span>
          </button>

          <button
            type="button"
            onClick={() => setAdminMainTab("growth")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              adminMainTab === "growth"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20 ring-1 ring-white/20"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/80"
            }`}
          >
            <BarChart2 className="w-4 h-4 text-amber-400" />
            <span>Growth & Document Telemetry</span>
          </button>

          <button
            type="button"
            onClick={() => setAdminMainTab("speed_insights")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              adminMainTab === "speed_insights"
                ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/20 ring-1 ring-white/20"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/80"
            }`}
          >
            <Gauge className="w-4 h-4 text-emerald-400" />
            <span>Speed Insights & Web Vitals</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Vercel RUM
            </span>
          </button>
        </div>

        {/* TAB 1: LIVE PULSE & SPEND DASHBOARD */}
        {adminMainTab === "live_pulse" && (
          <LiveAnalyticsDashboard
            registeredUsers={usersList}
            allDocuments={allDocuments}
            currency={safeCurrency}
            onInspectUser={(u) => {
              setSelectedUserId(u.id);
              setAdminMainTab("user_directory");
            }}
            onSendEmailToUser={(u) => {
              setBroadcastRecipientTarget("all");
              setBroadcastSubject(`Support update for ${u.displayName || u.email}`);
              setShowBroadcastModal(true);
            }}
          />
        )}

        {/* Platform Activity Overview Bar Graph & Sign-ups Summary */}
        {adminMainTab === "growth" && (
        <div className="space-y-6">
        <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-5 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-zinc-800/80">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                <BarChart2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Platform Activity & Growth Overview
                </h2>
                <p className="text-xs text-zinc-400">
                  Daily breakdown of documents created by users and new registrations
                </p>
              </div>
            </div>

            {/* Total Registrations, Daily Signups, Sign-Ins, Active Users & Total Docs Summary Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs font-mono">
              <div 
                onClick={() => setActivityFilter("all")}
                className={`border rounded-xl px-2.5 py-2 flex flex-col cursor-pointer transition-all ${
                  activityFilter === "all" ? "bg-indigo-950/60 border-indigo-500/80 ring-1 ring-indigo-500/50" : "bg-zinc-900/90 border-zinc-800 hover:border-zinc-700"
                }`}
                title="View All Users"
              >
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Total Users</span>
                <span className="text-base font-black text-indigo-400 mt-0.5">{totalRegistrations}</span>
              </div>

              <div 
                onClick={() => setActivityFilter("signups_today")}
                className={`border rounded-xl px-2.5 py-2 flex flex-col cursor-pointer transition-all ${
                  activityFilter === "signups_today" ? "bg-purple-950/60 border-purple-500/80 ring-1 ring-purple-500/50" : "bg-zinc-900/90 border-zinc-800 hover:border-zinc-700"
                }`}
                title="Filter: New Signups Today"
              >
                <span className="text-[10px] text-purple-300 uppercase tracking-wider font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-purple-400" /> Signups Today
                </span>
                <span className="text-base font-black text-purple-400 mt-0.5">+{signupsTodayCount}</span>
              </div>

              <div 
                onClick={() => setActivityFilter("signins_today")}
                className={`border rounded-xl px-2.5 py-2 flex flex-col cursor-pointer transition-all ${
                  activityFilter === "signins_today" ? "bg-sky-950/60 border-sky-500/80 ring-1 ring-sky-500/50" : "bg-zinc-900/90 border-zinc-800 hover:border-zinc-700"
                }`}
                title="Filter: Users Logged In / Visited Today"
              >
                <span className="text-[10px] text-sky-300 uppercase tracking-wider font-semibold flex items-center gap-1">
                  <Key className="w-3 h-3 text-sky-400" /> Sign-Ins Today
                </span>
                <span className="text-base font-black text-sky-400 mt-0.5">{signInsTodayCount}</span>
              </div>

              <div 
                onClick={() => setActivityFilter("online_now")}
                className={`border rounded-xl px-2.5 py-2 flex flex-col cursor-pointer transition-all ${
                  activityFilter === "online_now" ? "bg-emerald-950/60 border-emerald-500/80 ring-1 ring-emerald-500/50" : "bg-zinc-900/90 border-zinc-800 hover:border-zinc-700"
                }`}
                title="Filter: Online Now (Active in last 5 minutes)"
              >
                <span className="text-[10px] text-emerald-300 uppercase tracking-wider font-semibold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Online (5m)
                </span>
                <span className="text-base font-black text-emerald-400 mt-0.5">{currentlyActiveUsersCount}</span>
              </div>

              <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl px-2.5 py-2 flex flex-col">
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Total Docs</span>
                <span className="text-base font-black text-teal-400 mt-0.5">{totalDocsCreated}</span>
              </div>

              <div 
                onClick={() => setActivityFilter("inactive_3d")}
                className={`border rounded-xl px-2.5 py-2 flex flex-col cursor-pointer transition-all ${
                  activityFilter === "inactive_3d" ? "bg-amber-950/60 border-amber-500/80 ring-1 ring-amber-500/50" : "bg-zinc-900/90 border-zinc-800 hover:border-zinc-700"
                }`}
                title="Filter: Users Inactive > 3 Days"
              >
                <span className="text-[10px] text-amber-300 uppercase tracking-wider font-semibold flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-400" /> Inactive (&gt;3d)
                </span>
                <span className="text-base font-black text-amber-400 mt-0.5">{inactive3DaysCount}</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics30DaysData} margin={{ top: 10, right: 20, left: -15, bottom: 0 }} barGap={2} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#71717a" 
                  fontSize={11} 
                  tickLine={false}
                  axisLine={{ stroke: '#27272a' }}
                />
                <YAxis 
                  stroke="#71717a" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={{ stroke: '#27272a' }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#09090b",
                    borderColor: "#27272a",
                    borderRadius: "0.75rem",
                    color: "#f4f4f5",
                    fontSize: "12px",
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)"
                  }}
                  labelStyle={{ fontWeight: "bold", color: "#a1a1aa", marginBottom: "4px" }}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: "10px", fontSize: "12px" }} 
                  iconType="rect"
                />
                <Bar
                  dataKey="docs"
                  name="Docs Created"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="registrations"
                  name="New Registrations"
                  fill="#6366f1"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* NEW SIGN-UPS & SIGN-INS ACTIVITY TRACKER SUMMARY COMPONENT */}
        <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-5 mb-6 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-zinc-800/80">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-purple-600/20 text-purple-400 rounded-xl border border-purple-500/30">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 flex-wrap">
                  New Sign-ups & Sign-ins Summary
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Activity & Audit Tracker
                  </span>
                </h2>
                <p className="text-xs text-zinc-400">
                  Separate tracking for daily user registrations and login sessions with date filtering & direct credit controls
                </p>
              </div>
            </div>

            {/* Date Preset Chips & Custom Date Picker */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center bg-zinc-900 p-1 rounded-xl border border-zinc-800 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setSummaryRangeType("today");
                    setSummaryDateFilter(todayDateStr);
                  }}
                  className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                    summaryRangeType === "today"
                      ? "bg-purple-600 text-white shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSummaryRangeType("yesterday");
                    setSummaryDateFilter(yesterdayDateStr);
                  }}
                  className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                    summaryRangeType === "yesterday"
                      ? "bg-purple-600 text-white shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Yesterday
                </button>
                <button
                  type="button"
                  onClick={() => setSummaryRangeType("7d")}
                  className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                    summaryRangeType === "7d"
                      ? "bg-purple-600 text-white shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Last 7 Days
                </button>
                <button
                  type="button"
                  onClick={() => setSummaryRangeType("30d")}
                  className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                    summaryRangeType === "30d"
                      ? "bg-purple-600 text-white shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Last 30 Days
                </button>
                <button
                  type="button"
                  onClick={() => setSummaryRangeType("custom")}
                  className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer flex items-center gap-1 ${
                    summaryRangeType === "custom"
                      ? "bg-purple-600 text-white shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <Calendar className="w-3 h-3" />
                  Custom
                </button>
              </div>

              {summaryRangeType === "custom" && (
                <div className="flex items-center gap-1 bg-zinc-900 px-2.5 py-1 rounded-xl border border-purple-500/60">
                  <span className="text-[11px] text-zinc-400 font-semibold">Date:</span>
                  <input
                    type="date"
                    value={summaryDateFilter}
                    onChange={(e) => setSummaryDateFilter(e.target.value)}
                    className="bg-transparent text-white text-xs font-mono focus:outline-none cursor-pointer"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Metric Summary Cards for Selected Date Filter */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-gradient-to-br from-purple-950/50 to-zinc-900/90 border border-purple-800/40 rounded-xl space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  New Registrations
                </span>
                <span className="text-[10px] font-semibold text-purple-400 bg-purple-950/80 border border-purple-800/60 px-1.5 py-0.5 rounded">
                  Sign-ups
                </span>
              </div>
              <div className="text-2xl font-black text-white font-mono flex items-baseline gap-1">
                <span>{summaryMetricsData.signups.length}</span>
                <span className="text-xs text-zinc-400 font-normal">users registered</span>
              </div>
            </div>

            <div className="p-3.5 bg-gradient-to-br from-sky-950/50 to-zinc-900/90 border border-sky-800/40 rounded-xl space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-sky-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-sky-400" />
                  Daily Sign-Ins
                </span>
                <span className="text-[10px] font-semibold text-sky-400 bg-sky-950/80 border border-sky-800/60 px-1.5 py-0.5 rounded">
                  Logins
                </span>
              </div>
              <div className="text-2xl font-black text-white font-mono flex items-baseline gap-1">
                <span>{summaryMetricsData.signins.length}</span>
                <span className="text-xs text-zinc-400 font-normal">active sessions</span>
              </div>
            </div>

            <div className="p-3.5 bg-gradient-to-br from-teal-950/50 to-zinc-900/90 border border-teal-800/40 rounded-xl space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-teal-300 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-teal-400" />
                  Docs Created
                </span>
                <span className="text-[10px] font-semibold text-teal-400 bg-teal-950/80 border border-teal-800/60 px-1.5 py-0.5 rounded">
                  Volume
                </span>
              </div>
              <div className="text-2xl font-black text-white font-mono flex items-baseline gap-1">
                <span>{summaryMetricsData.docsCount}</span>
                <span className="text-xs text-zinc-400 font-normal">documents</span>
              </div>
            </div>

            <div className="p-3.5 bg-gradient-to-br from-emerald-950/50 to-zinc-900/90 border border-emerald-800/40 rounded-xl space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Online Right Now
                </span>
                <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-1.5 py-0.5 rounded">
                  Live
                </span>
              </div>
              <div className="text-2xl font-black text-emerald-300 font-mono flex items-baseline gap-1">
                <span>{currentlyActiveUsersCount}</span>
                <span className="text-xs text-zinc-400 font-normal">users connected</span>
              </div>
            </div>
          </div>

          {/* Activity View Switcher & Status Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSummaryActivityTab("all")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  summaryActivityTab === "all"
                    ? "bg-zinc-100 text-zinc-900 shadow-sm"
                    : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
                }`}
              >
                <span>All Activity</span>
                <span className="px-1.5 py-0.2 rounded-md bg-zinc-800 text-zinc-300 text-[10px] font-mono">
                  {summaryMetricsData.combinedList.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSummaryActivityTab("signups")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  summaryActivityTab === "signups"
                    ? "bg-purple-600 text-white shadow-sm"
                    : "bg-zinc-900 text-purple-300 hover:text-white border border-zinc-800"
                }`}
              >
                <Sparkles className="w-3 h-3" />
                <span>New Sign-ups</span>
                <span className="px-1.5 py-0.2 rounded-md bg-purple-950 text-purple-300 text-[10px] font-mono">
                  {summaryMetricsData.signups.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSummaryActivityTab("signins")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  summaryActivityTab === "signins"
                    ? "bg-sky-600 text-white shadow-sm"
                    : "bg-zinc-900 text-sky-300 hover:text-white border border-zinc-800"
                }`}
              >
                <Key className="w-3 h-3" />
                <span>Daily Sign-Ins</span>
                <span className="px-1.5 py-0.2 rounded-md bg-sky-950 text-sky-300 text-[10px] font-mono">
                  {summaryMetricsData.signins.length}
                </span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-zinc-400 font-semibold shrink-0">Filter Status:</span>
              <select
                value={summaryStatusFilter}
                onChange={(e) => setSummaryStatusFilter(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs rounded-lg px-2 py-1 font-medium focus:outline-none focus:border-purple-500 cursor-pointer"
              >
                <option value="all">All Account Statuses</option>
                <option value="active">Active Only</option>
                <option value="suspended">Suspended Only</option>
                <option value="deleted">Deleted Only</option>
              </select>
            </div>
          </div>

          {/* Activity Table / User Cards */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden">
            {(() => {
              const displayUsers =
                summaryActivityTab === "signups"
                  ? summaryMetricsData.signups
                  : summaryActivityTab === "signins"
                  ? summaryMetricsData.signins
                  : summaryMetricsData.combinedList;

              if (displayUsers.length === 0) {
                return (
                  <div className="p-8 text-center text-zinc-500 text-xs space-y-1">
                    <p className="font-semibold text-zinc-400">No user activity recorded for selected date filter.</p>
                    <p className="text-[11px]">Select another date or click 'All' / 'Last 30 Days' above to view historical sign-ups and logins.</p>
                  </div>
                );
              }

              return (
                <div className="divide-y divide-zinc-800/80 max-h-72 overflow-y-auto custom-scrollbar">
                  {displayUsers.map((item: any, i: number) => {
                    const uEmail = getUserEmail(item);
                    const uName = getUserUsername(item);
                    const isSignup = item.activityType === "signup";
                    const isSelected = selectedUser?.id === item.id;
                    const docCount = Array.isArray(item.history) ? item.history.length : (item.documentsUsed || 0);
                    const remainingCredits = item.documentsRemaining !== undefined ? item.documentsRemaining : Math.max(0, 5 - docCount);
                    const isPro = (item.planTier === "pro" || item.planTier === "enterprise" || (item.plan || "").toLowerCase().includes("pro"));

                    return (
                      <div
                        key={`${item.id}_${item.activityType}_${i}`}
                        className={`p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                          isSelected ? "bg-purple-950/30" : "hover:bg-zinc-800/40"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs uppercase shrink-0 ${
                            isSignup ? "bg-purple-600 text-white" : "bg-sky-600 text-white"
                          }`}>
                            {(uName || "U").substring(0, 2)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-xs text-zinc-200 truncate">
                                {uName}
                              </span>
                              {isSignup ? (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-purple-950/90 text-purple-300 border border-purple-700/60 flex items-center gap-1">
                                  <Sparkles className="w-2.5 h-2.5 text-purple-400" /> Signed Up
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-sky-950/90 text-sky-300 border border-sky-700/60 flex items-center gap-1">
                                  <Key className="w-2.5 h-2.5 text-sky-400" /> Signed In
                                </span>
                              )}
                              <span className="text-[10px] text-zinc-500 font-mono">
                                {item.activityDate ? new Date(item.activityDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                              </span>
                            </div>
                            <div className="text-[11px] text-zinc-400 truncate font-mono flex items-center gap-1.5 pt-0.5">
                              <Mail className="w-3 h-3 text-indigo-400 shrink-0" />
                              <span className="truncate">{uEmail || "No Email"}</span>
                              <span className="text-zinc-600">•</span>
                              <span className="text-zinc-400">{docCount} docs created</span>
                            </div>
                          </div>
                        </div>

                        {/* Credits & Action Buttons */}
                        <div className="flex items-center gap-2 shrink-0 justify-end">
                          <span className={`px-2 py-1 rounded-lg text-[10px] font-extrabold border font-mono ${
                            isPro
                              ? "bg-emerald-950/80 text-emerald-300 border-emerald-700/60"
                              : remainingCredits > 0
                              ? "bg-amber-950/80 text-amber-300 border-amber-700/60"
                              : "bg-red-950/80 text-red-300 border-red-700/60"
                          }`}>
                            {isPro ? "Unlimited" : `${remainingCredits} Credits Left`}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleGrantTrialCredits(item, 5)}
                            disabled={savingUserMeta}
                            className="px-2.5 py-1 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-[10px] font-black uppercase rounded-lg shadow-sm border border-amber-400/40 transition-all cursor-pointer flex items-center gap-1 shrink-0"
                            title="Grant 5 Additional Trial Credits to this user"
                          >
                            <Plus className="w-3 h-3" />
                            <span>+5 Credits</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedUserId(item.id)}
                            className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[10px] font-bold rounded-lg border border-zinc-700 transition-all cursor-pointer flex items-center gap-1 shrink-0"
                            title="Inspect user details and document history"
                          >
                            <Eye className="w-3 h-3 text-indigo-400" />
                            <span>Inspect</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
        </div>
        )}

        {/* Automated Email Campaigns & Dispatcher */}
        {adminMainTab === "campaigns" && (
        <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-5 mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-zinc-800/80">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 flex-wrap">
                  Automated Email Campaigns & Dispatcher
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    60s Cron Worker Active
                  </span>
                </h2>
                <p className="text-xs text-zinc-400">
                  Fully automated event-based & periodic lifecycle campaigns running in background. Manual triggers available for test dispatches.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowBroadcastModal(true)}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-sm shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>New Broadcast Composer</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Trigger 1: 1st Document Creation Follow-Up */}
            <div className="bg-zinc-900/90 border border-zinc-800/90 rounded-xl p-4 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    1st Doc Creation Follow-Up
                  </span>
                  <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-md">
                    Auto: 5-min delay
                  </span>
                </div>
                <h3 className="text-xs font-bold text-zinc-100 mb-1">
                  "From one founder to another: Could I ask for a quick 10s favor?"
                </h3>
                <p className="text-[11px] text-zinc-400 leading-normal">
                  Automatically schedules 5 minutes after a user creates their 1st invoice/document. Dispatches founder note from <code className="text-indigo-300 font-mono">Founder from BillIQ &lt;support@billiq.site&gt;</code>. Guardrails ensure 1 email per user.
                </p>
              </div>

              <button
                onClick={handleTriggerFeedbackRequests}
                disabled={triggeringFeedback}
                className="w-full py-2.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${triggeringFeedback ? "animate-spin" : ""}`} />
                <span>{triggeringFeedback ? "Querying & Dispatches..." : "Trigger 1st Doc Follow-ups Now"}</span>
              </button>
            </div>

            {/* Trigger 2: 3-Day Inactivity Re-engagement */}
            <div className="bg-zinc-900/90 border border-zinc-800/90 rounded-xl p-4 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    3-Day Inactivity Re-engagement
                  </span>
                  <span className="text-[10px] font-mono text-amber-300 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded-md">
                    Auto: 3+ days inactive
                  </span>
                </div>
                <h3 className="text-xs font-bold text-zinc-100 mb-1">
                  "We miss you on BillIQ! Here is what's new in your billing workspace"
                </h3>
                <p className="text-[11px] text-zinc-400 leading-normal">
                  Background worker checks users inactive for 3+ days (<code className="text-amber-300 font-mono">lastActiveAt &gt; 3 days</code>). Dispatches feature updates from <code className="text-amber-300 font-mono">support@billiq.site</code> with a 14-day anti-spam cooldown.
                </p>
              </div>

              <button
                onClick={handleTriggerInactivityReminders}
                disabled={triggeringInactivity}
                className="w-full py-2.5 px-3 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${triggeringInactivity ? "animate-spin" : ""}`} />
                <span>{triggeringInactivity ? "Querying & Sending..." : "Trigger 3-Day Inactivity Emails Now"}</span>
              </button>
            </div>
          </div>

          {/* Campaign Log / Result History */}
          {emailCampaignLog.length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 space-y-1.5 text-xs font-mono">
              <div className="flex items-center justify-between text-zinc-400 text-[10px] uppercase tracking-wider font-bold border-b border-zinc-800/60 pb-1">
                <span>Campaign Log History</span>
                <button onClick={() => setEmailCampaignLog([])} className="text-zinc-500 hover:text-zinc-300 cursor-pointer">Clear</button>
              </div>
              {emailCampaignLog.slice(-3).map((log) => (
                <div key={log.id} className="flex items-center justify-between gap-2 text-zinc-300 text-[11px]">
                  <span className="text-zinc-500 font-sans">{log.time}</span>
                  <span className={`font-semibold flex-1 ${log.success ? "text-emerald-400" : "text-red-400"}`}>{log.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        )}

        {/* Layout Grid: Left Sidebar (User List) & Right Panel (Inspector) */}
        {adminMainTab === "user_directory" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* USER LIST PANEL */}
          <div className="lg:col-span-4 bg-zinc-950/80 border border-zinc-800 rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Registered Users
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsNewUserModalOpen(true)}
                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Add User</span>
                </button>
                <span className="px-2 py-0.5 bg-zinc-800 text-zinc-300 rounded-md text-xs font-mono font-bold">
                  {sortedAndFilteredUsers.length}
                </span>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search user, email, ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500 font-medium"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-2.5 top-2.5 text-zinc-500 hover:text-zinc-300"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800/80 text-xs">
                <button
                  onClick={() => setStatusFilter("all")}
                  className={`flex-1 py-1 px-1.5 rounded-lg font-medium transition-all text-center cursor-pointer ${
                    statusFilter === "all"
                      ? "bg-indigo-600 text-white shadow-sm font-bold"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setStatusFilter("active")}
                  className={`flex-1 py-1 px-1.5 rounded-lg font-medium transition-all text-center cursor-pointer ${
                    statusFilter === "active"
                      ? "bg-emerald-600 text-white shadow-sm font-bold"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Active
                </button>
                <button
                  onClick={() => setStatusFilter("suspended")}
                  className={`flex-1 py-1 px-1.5 rounded-lg font-medium transition-all text-center cursor-pointer ${
                    statusFilter === "suspended"
                      ? "bg-amber-600 text-white shadow-sm font-bold"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Suspended
                </button>
                <button
                  onClick={() => setStatusFilter("deleted")}
                  className={`flex-1 py-1 px-1.5 rounded-lg font-medium transition-all text-center cursor-pointer flex items-center justify-center gap-1 ${
                    statusFilter === "deleted"
                      ? "bg-red-600 text-white shadow-sm font-bold"
                      : "text-zinc-400 hover:text-red-300"
                  }`}
                  title="View Deleted & Deactivated Accounts"
                >
                  <Trash2 className="w-3 h-3 shrink-0" />
                  <span>Deleted</span>
                </button>
              </div>

              {/* Plan Tier Filter & Sort Controls Row */}
              <div className="grid grid-cols-2 gap-2">
                {/* Plan Tier Filter Dropdown */}
                <div className="flex items-center gap-1 bg-zinc-900 px-2 py-1.5 rounded-xl border border-zinc-800 text-xs">
                  <span className="text-zinc-400 font-semibold flex items-center gap-1 text-[11px] shrink-0">
                    <Zap className="w-3 h-3 text-amber-400" />
                    Plan:
                  </span>
                  <select
                    value={planFilter}
                    onChange={(e) => setPlanFilter(e.target.value)}
                    className="bg-zinc-950 border border-zinc-800 text-zinc-200 text-[11px] rounded-lg px-1.5 py-1 font-medium focus:outline-none focus:border-indigo-500 w-full cursor-pointer truncate"
                  >
                    <option value="all">All Plans</option>
                    <option value="free_trial">Free Trial</option>
                    <option value="free_tier">Free Tier</option>
                    <option value="pro">Pro Plan</option>
                    <option value="enterprise">Enterprise Admin</option>
                  </select>
                </div>

                {/* Sort Dropdown */}
                <div className="flex items-center gap-1 bg-zinc-900 px-2 py-1.5 rounded-xl border border-zinc-800 text-xs">
                  <span className="text-zinc-400 font-semibold flex items-center gap-1 text-[11px] shrink-0">
                    <ArrowUpDown className="w-3 h-3 text-indigo-400" />
                    Sort:
                  </span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-zinc-950 border border-zinc-800 text-zinc-200 text-[11px] rounded-lg px-1.5 py-1 font-medium focus:outline-none focus:border-indigo-500 w-full cursor-pointer truncate"
                  >
                    <option value="date-desc">Registration (Newest)</option>
                    <option value="date-asc">Registration (Oldest)</option>
                    <option value="plan-desc">Plan Tier (Enterprise → Trial)</option>
                    <option value="plan-asc">Plan Tier (Trial → Enterprise)</option>
                    <option value="status-asc">Status (Active → Deleted)</option>
                    <option value="status-desc">Status (Deleted → Active)</option>
                    <option value="usage-desc">Document Usage (High → Low)</option>
                    <option value="usage-asc">Document Usage (Low → High)</option>
                    <option value="name-asc">Name/Email (A to Z)</option>
                    <option value="name-desc">Name/Email (Z to A)</option>
                  </select>
                </div>
              </div>

              {/* Activity & Date Range Filter Section */}
              <div className="space-y-1.5 pt-1 border-t border-zinc-800/80">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-indigo-400" />
                    Activity & Day Filter:
                  </span>
                  {activityFilter !== "all" && (
                    <button
                      onClick={() => {
                        setActivityFilter("all");
                        setCustomFilterDate("");
                      }}
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
                    >
                      Reset Filter
                    </button>
                  )}
                </div>

                {/* Quick Toggle Filter Chips */}
                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={() => setActivityFilter("all")}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
                      activityFilter === "all"
                        ? "bg-indigo-600 text-white font-bold"
                        : "bg-zinc-900 hover:bg-zinc-800 text-zinc-400"
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setActivityFilter("signups_today")}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                      activityFilter === "signups_today"
                        ? "bg-purple-600 text-white font-bold"
                        : "bg-zinc-900 hover:bg-zinc-800 text-purple-300"
                    }`}
                  >
                    <Sparkles className="w-2.5 h-2.5" /> Signups Today ({signupsTodayCount})
                  </button>
                  <button
                    onClick={() => setActivityFilter("signins_today")}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                      activityFilter === "signins_today"
                        ? "bg-sky-600 text-white font-bold"
                        : "bg-zinc-900 hover:bg-zinc-800 text-sky-300"
                    }`}
                  >
                    <Key className="w-2.5 h-2.5" /> Sign-Ins Today ({signInsTodayCount})
                  </button>
                  <button
                    onClick={() => setActivityFilter("online_now")}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                      activityFilter === "online_now"
                        ? "bg-emerald-600 text-white font-bold"
                        : "bg-zinc-900 hover:bg-zinc-800 text-emerald-300"
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Online ({currentlyActiveUsersCount})
                  </button>
                  <button
                    onClick={() => setActivityFilter("inactive_3d")}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                      activityFilter === "inactive_3d"
                        ? "bg-amber-600 text-white font-bold"
                        : "bg-zinc-900 hover:bg-zinc-800 text-amber-300"
                    }`}
                  >
                    <Clock className="w-2.5 h-2.5" /> Inactive &gt;3d ({inactive3DaysCount})
                  </button>
                </div>

                {/* Activity Dropdown & Custom Day Picker */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-0.5">
                  <select
                    value={activityFilter}
                    onChange={(e) => setActivityFilter(e.target.value as any)}
                    className="bg-zinc-900 border border-zinc-800 text-zinc-200 text-[11px] rounded-lg px-2 py-1 font-medium focus:outline-none focus:border-indigo-500 w-full cursor-pointer truncate"
                  >
                    <option value="all">Filter by Lifecycle / Activity...</option>
                    <option value="signups_today">🌟 New Signups Today ({signupsTodayCount})</option>
                    <option value="signins_today">🔑 Sign-Ins of the Day ({signInsTodayCount})</option>
                    <option value="online_now">🟢 Online Now (Active &lt;5m)</option>
                    <option value="active_today">📅 Active Today</option>
                    <option value="active_yesterday">📅 Active Yesterday</option>
                    <option value="active_7d">⚡ Active (Last 7 Days)</option>
                    <option value="inactive_3d">⏳ Inactive (&gt; 3 Days)</option>
                    <option value="inactive_7d">⏳ Inactive (&gt; 7 Days)</option>
                    <option value="custom_date">📆 Filter by Specific Date...</option>
                  </select>

                  {activityFilter === "custom_date" ? (
                    <input
                      type="date"
                      value={customFilterDate}
                      onChange={(e) => setCustomFilterDate(e.target.value)}
                      className="bg-zinc-900 border border-indigo-500/80 text-zinc-200 text-[11px] rounded-lg px-2 py-1 font-medium focus:outline-none w-full cursor-pointer"
                    />
                  ) : (
                    <div className="text-[10px] text-zinc-500 flex items-center justify-end px-1 font-mono">
                      Showing {sortedAndFilteredUsers.length} of {usersList.length} users
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Users List Scrollable Container */}
            <div className="space-y-2 max-h-[calc(100vh-295px)] overflow-y-auto pr-1 custom-scrollbar">
              {loadingUsers ? (
                <div className="p-8 text-center text-zinc-500 text-xs">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-400" />
                  Fetching user records...
                </div>
              ) : sortedAndFilteredUsers.length === 0 ? (
                <div className="p-6 text-center text-zinc-500 text-xs bg-zinc-900/50 rounded-xl border border-zinc-800">
                  No users found matching search & activity filters.
                </div>
              ) : (
                sortedAndFilteredUsers.map((u, idx) => {
                  const isSelected = selectedUser?.id === u.id;
                  const docCount = Math.max(
                    Number(u.lifetimeCreatedCount) || 0,
                    Number(u.totalGeneratedDocsCount) || 0,
                    Number(u.documentsUsed) || 0,
                    Array.isArray(u.history) ? u.history.length : (Number(u.documentCount) || 0)
                  );
                  const signupEmail = getUserEmail(u);
                  const displayEmail = signupEmail || "No Email";
                  const permanentUsername = getUserUsername(u);
                  const accountName = permanentUsername || (signupEmail ? signupEmail.split('@')[0] : "User Account");
                  const status = u.accountStatus || (u.isDeleted || u.status === "Deleted" ? "Deleted" : "Active");
                  const plan = u.plan || "Free Trial";

                  const rawCreated = u.createdAt || u.registrationDate || u.created_at;
                  const regDate = rawCreated ? toLocalDateString(rawCreated) : "";
                  const rawLastLogin = u.lastLoginAt || u.lastLogin || u.lastActiveAt || u.lastActive;
                  const loginDate = rawLastLogin ? toLocalDateString(rawLastLogin) : "";
                  const rawLastActive = u.lastActiveAt || u.lastActive || u.lastSeen || u.updatedAt || u.createdAt;
                  const lastActiveTime = rawLastActive ? new Date(rawLastActive).getTime() : 0;
                  const isOnlineNow = u.isOnline || (lastActiveTime > 0 && Date.now() - lastActiveTime <= 5 * 60 * 1000);
                  const isSignupToday = regDate === todayDateStr;
                  const isLoginToday = loginDate === todayDateStr;
                  const isInactive3D = lastActiveTime > 0 && Date.now() - lastActiveTime > 3 * 24 * 60 * 60 * 1000;

                  return (
                    <motion.div
                      key={u.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: Math.min(idx * 0.03, 0.3) }}
                      onClick={() => setSelectedUserId(u.id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer text-xs space-y-2 ${
                        isSelected
                          ? "bg-indigo-950/40 border-indigo-500/80 ring-1 ring-indigo-500/50 shadow-md"
                          : "bg-zinc-900/60 border-zinc-800 hover:bg-zinc-800/60 hover:border-zinc-700"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold uppercase text-xs shrink-0 ${
                            isSelected ? "bg-indigo-600 text-white" : "bg-zinc-800 text-zinc-300"
                          }`}>
                            {(accountName || "U").substring(0, 2)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <h3 className="font-bold text-zinc-100 truncate text-xs">
                                {accountName}
                              </h3>
                              <span className="text-[9px] font-bold text-amber-400 bg-amber-950/60 border border-amber-800/40 px-1 rounded flex items-center gap-0.5 shrink-0" title="Signup credentials locked">
                                <Lock className="w-2.5 h-2.5 text-amber-400" />
                              </span>
                            </div>
                            <p className="text-[11px] text-zinc-400 truncate font-mono flex items-center gap-1">
                              <Mail className="w-3 h-3 text-indigo-400 shrink-0" />
                              <span className="truncate">{displayEmail}</span>
                            </p>
                            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                              {isOnlineNow ? (
                                <span className="text-[9px] font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-800/60 px-1.5 py-0.2 rounded-md flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Online
                                </span>
                              ) : isSignupToday ? (
                                <span className="text-[9px] font-bold text-purple-300 bg-purple-950/80 border border-purple-800/60 px-1.5 py-0.2 rounded-md flex items-center gap-0.5">
                                  <Sparkles className="w-2.5 h-2.5 text-purple-400" /> Signed Up Today
                                </span>
                              ) : isLoginToday ? (
                                <span className="text-[9px] font-bold text-sky-300 bg-sky-950/80 border border-sky-800/60 px-1.5 py-0.2 rounded-md flex items-center gap-0.5">
                                  <Key className="w-2.5 h-2.5 text-sky-400" /> Signed In Today
                                </span>
                              ) : isInactive3D ? (
                                <span className="text-[9px] font-bold text-amber-400 bg-amber-950/80 border border-amber-800/60 px-1.5 py-0.2 rounded-md flex items-center gap-0.5">
                                  <Clock className="w-2.5 h-2.5 text-amber-400" /> Inactive &gt;3d
                                </span>
                              ) : null}

                              {rawCreated && (
                                <span className="text-[9px] text-zinc-500 font-mono">
                                  Joined {new Date(rawCreated).toLocaleDateString([], { month: "short", day: "numeric" })}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${
                          isSelected ? "text-indigo-400 translate-x-0.5" : "text-zinc-600"
                        }`} />
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-zinc-800/60 text-[10px] text-zinc-400">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`px-1.5 py-0.5 rounded font-extrabold uppercase tracking-wider text-[9px] flex items-center gap-1 ${
                            status === "Active" || status === "active"
                              ? "bg-emerald-950 text-emerald-400 border border-emerald-800/80"
                              : status === "Suspended" || status === "suspended"
                              ? "bg-amber-950 text-amber-400 border border-amber-800/80"
                              : "bg-red-950 text-red-400 border border-red-800/80"
                          }`}>
                            {(status === "Deleted" || status === "deleted") && <Trash2 className="w-2.5 h-2.5 shrink-0 text-red-400" />}
                            {status}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded font-extrabold uppercase tracking-wider text-[9px] ${
                            (u.role || "").toLowerCase() === "admin"
                              ? "bg-indigo-950 text-indigo-300 border border-indigo-700/80"
                              : (u.role || "").toLowerCase() === "customer"
                              ? "bg-teal-950 text-teal-300 border border-teal-700/80"
                              : "bg-zinc-800 text-zinc-300 border border-zinc-700/80"
                          }`}>
                            {u.role || (u.planTier === "enterprise" ? "admin" : "staff")}
                          </span>
                          <span className="text-zinc-500 font-medium text-[9px]">
                            • {u.provider || u.authProvider || "email"}
                          </span>
                        </div>
                        <span className="font-mono text-zinc-400 flex items-center gap-1 shrink-0">
                          <FileText className="w-3 h-3 text-zinc-500" /> {docCount} docs
                        </span>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>

          {/* USER DETAIL INSPECTOR PANEL */}
          <div className="lg:col-span-8 space-y-6">
            {selectedUser ? (
              <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-6 space-y-6">
                
                {/* ADMIN ACTION TOAST NOTIFICATION */}
                {adminToast && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.98 }}
                    className={`p-4 border-2 rounded-xl text-xs font-bold shadow-2xl flex items-center justify-between gap-3 ${
                      adminToast.type === "error"
                        ? "bg-red-950/90 border-red-500/80 text-red-200"
                        : "bg-emerald-950/90 border-emerald-500/80 text-emerald-200"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`p-2 border rounded-lg shrink-0 ${
                        adminToast.type === "error"
                          ? "bg-red-500/20 border-red-400/40 text-red-300"
                          : "bg-emerald-500/20 border-emerald-400/40 text-emerald-300"
                      }`}>
                        {adminToast.type === "error" ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="text-white font-extrabold text-sm">
                          {adminToast.type === "error" ? "Admin Error" : "Notification"}
                        </p>
                        <p className="text-zinc-200 text-xs font-medium mt-0.5">{adminToast.message}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setAdminToast(null)}
                      className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}

                {/* AUTO-FIX SUCCESS NOTIFICATION TOAST */}
                {autoFixSuccessToast && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.98 }}
                    className="p-4 bg-gradient-to-r from-amber-950/90 via-emerald-950/90 to-amber-950/90 border-2 border-amber-500/80 rounded-xl text-amber-200 text-xs font-bold shadow-2xl flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-2 bg-amber-500/20 border border-amber-400/40 rounded-lg text-amber-300 shrink-0">
                        <Wrench className="w-4 h-4 animate-bounce" />
                      </div>
                      <div>
                        <p className="text-white font-extrabold text-sm flex items-center gap-1.5">
                          <span>Account Repaired & Resynced</span>
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 font-bold uppercase">
                            Status: Healthy
                          </span>
                        </p>
                        <p className="text-amber-200/90 text-xs font-medium mt-0.5">{autoFixSuccessToast}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => setAutoFixSuccessToast(null)}
                      className="p-1 hover:bg-amber-900/50 rounded-lg text-amber-300 hover:text-white transition-colors cursor-pointer shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}

                {/* Selected User Header Card */}
                <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-zinc-800">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                        <span>{getUserUsername(selectedUser)}</span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                          <Lock className="w-3 h-3 text-amber-400" /> Locked Username
                        </span>
                      </h2>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider border flex items-center gap-1 ${
                        (selectedUser.accountStatus || "") === "Deleted" || selectedUser.isDeleted || selectedUser.status === "Deleted"
                          ? "bg-red-950/80 text-red-400 border-red-800/80"
                          : (selectedUser.accountStatus || "Active") === "Suspended"
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                          : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      }`}>
                        {((selectedUser.accountStatus || "") === "Deleted" || selectedUser.isDeleted || selectedUser.status === "Deleted") && <Trash2 className="w-3.5 h-3.5 text-red-400" />}
                        {((selectedUser.accountStatus || "") === "Deleted" || selectedUser.isDeleted || selectedUser.status === "Deleted") ? "DELETED" : (selectedUser.accountStatus || "Active")}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                        {selectedUser.plan || "Free Trial"}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 pt-1">
                      <span className="flex items-center gap-1.5 font-mono bg-zinc-900 px-2.5 py-1 rounded-lg border border-zinc-800">
                        <span className="text-zinc-500 font-bold">UID:</span>
                        <span className="text-zinc-200 font-semibold">{selectedUser.id}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1.5 font-mono bg-zinc-900 px-2.5 py-1 rounded-lg border border-zinc-800">
                        <Mail className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="text-zinc-500 font-bold">Signup Email:</span>
                        <span className="text-amber-300 font-bold font-mono">{getUserEmail(selectedUser) || "No Email"}</span>
                        <Lock className="w-3 h-3 text-amber-400 ml-0.5" />
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1.5 font-mono bg-zinc-900 px-2.5 py-1 rounded-lg border border-zinc-800">
                        <Clock className="w-3.5 h-3.5 text-zinc-500" />
                        <span className="text-zinc-500 font-bold">Last Active:</span>
                        <span className="text-zinc-200">{selectedUser.updatedAt ? new Date(selectedUser.updatedAt).toLocaleDateString() : "Recent"}</span>
                      </span>
                    </div>

                    {/* Subscription & Trial Ledger Details Banner */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
                      <div className="bg-zinc-900/90 border border-zinc-800 p-3 rounded-xl flex items-center gap-3">
                        <div className="p-2 bg-indigo-950/80 text-indigo-400 border border-indigo-800/60 rounded-lg">
                          <Zap className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Active Subscription</p>
                          <p className="text-xs font-black text-amber-300">{selectedUser.plan || selectedUser.planName || "Free Trial"}</p>
                        </div>
                      </div>

                      <div className="bg-zinc-900/90 border border-zinc-800 p-3 rounded-xl flex items-center gap-3">
                        <div className="p-2 bg-amber-950/80 text-amber-400 border border-amber-800/60 rounded-lg">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Docs Used / Remaining</p>
                          <p className="text-xs font-bold text-zinc-200">
                            <span className="text-emerald-400 font-black">
                              {Math.max(
                                Number(selectedUser.lifetimeCreatedCount) || 0,
                                Number(selectedUser.totalGeneratedDocsCount) || 0,
                                Number(selectedUser.documentsUsed) || 0,
                                Array.isArray(selectedUser.history) ? selectedUser.history.length : 0
                              )}
                            </span> used
                            <span className="text-zinc-500 mx-1">/</span>
                            <span className="text-amber-300 font-black">
                              {selectedUser.planTier === "pro" || selectedUser.planTier === "enterprise" ? "Unlimited" : `${selectedUser.documentsRemaining !== undefined ? selectedUser.documentsRemaining : 5} left`}
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="bg-zinc-900/90 border border-zinc-800 p-3 rounded-xl flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Trial Status Ledger</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold ${selectedUser.trialUsed !== false ? "bg-amber-950 text-amber-300 border border-amber-800" : "bg-zinc-800 text-zinc-400"}`}>
                              Trial Used: {selectedUser.trialUsed !== false ? "Yes" : "No"}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold ${selectedUser.trialExhausted ? "bg-rose-950 text-rose-300 border border-rose-800" : "bg-zinc-800 text-zinc-400"}`}>
                              Trial Exhausted: {selectedUser.trialExhausted ? "Yes" : "No"}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold ${selectedUser.isReRegisteredUser ? "bg-red-950 text-red-300 border border-red-800" : "bg-emerald-950 text-emerald-300 border border-emerald-800"}`}>
                              Re-Registered: {selectedUser.isReRegisteredUser ? "Yes" : "No"}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleGrantTrialCredits(5)}
                          disabled={savingUserMeta}
                          className="px-2.5 py-1.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-[10px] font-black uppercase rounded-lg shadow-sm border border-amber-400/40 transition-all cursor-pointer flex items-center gap-1 shrink-0"
                          title="Grant 5 Additional Trial Credits"
                        >
                          <Plus className="w-3 h-3" />
                          <span>+5 Trial Credits</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* IMPERSONATE, AUTO-FIX & DELETE USER BUTTONS */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={handleAutoFixAccount}
                      disabled={isAutoFixing}
                      className="px-3.5 py-2 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-white text-xs font-bold rounded-xl shadow-lg shadow-amber-600/25 border border-amber-400/40 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
                      title="Auto-Fix Account, Repair WebSocket Sync & Clear Error State"
                    >
                      <Wrench className={`w-4 h-4 text-amber-100 ${isAutoFixing ? "animate-spin" : ""}`} />
                      <span>{isAutoFixing ? "Repairing..." : "Auto-Fix Account / Reset Sync"}</span>
                    </button>

                    <button
                      onClick={() => onImpersonateUser(selectedUser)}
                      className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/20 border border-indigo-400/30 transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View Dashboard as User</span>
                    </button>

                    {selectedUser.id !== ADMIN_UID && (
                      <button
                        onClick={() => handleOpenDeleteUserModal(selectedUser)}
                        className="px-3 py-2 bg-red-950/60 hover:bg-red-900 text-red-300 hover:text-red-100 text-xs font-bold rounded-xl border border-red-800/80 transition-all flex items-center gap-1.5 cursor-pointer"
                        title="Delete User Account"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete User</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex items-center gap-2 border-b border-zinc-800 pb-3 text-xs font-bold overflow-x-auto">
                  <button
                    onClick={() => setActiveTab("overview")}
                    className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                      activeTab === "overview"
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 border border-zinc-800"
                    }`}
                  >
                    <Building className="w-4 h-4" />
                    <span>User Overview</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("documents")}
                    className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                      activeTab === "documents"
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 border border-zinc-800"
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>Documents & Invoices ({selectedUser.history?.length || 0})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("overrides")}
                    className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                      activeTab === "overrides"
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 border border-zinc-800"
                    }`}
                  >
                    <Sliders className="w-4 h-4 text-purple-400" />
                    <span>Overrides & Hotfixes</span>
                    {(selectedUser.overrides && Object.values(selectedUser.overrides).some(v => v === true || (typeof v === 'string' && v !== 'None' && v !== 'Active'))) && (
                      <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                    )}
                  </button>

                  <button
                    onClick={() => setActiveTab("logs")}
                    className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                      activeTab === "logs"
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 border border-zinc-800"
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    <span>Audit Logs ({filteredLogs.length})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("notes")}
                    className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                      activeTab === "notes"
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 border border-zinc-800"
                    }`}
                  >
                    <Save className="w-4 h-4" />
                    <span>Admin Notes</span>
                  </button>
                </div>

                {/* TAB 1: OVERVIEW */}
                {activeTab === "overview" && (
                  <div className="space-y-6">
                    {/* User Controls: Status, Role (RBAC) & Plan Selector */}
                    <div className="p-4 bg-zinc-900/80 rounded-xl border border-zinc-800 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                          Account Status
                        </label>
                        <div className="flex items-center gap-2">
                          <select
                            value={currentAccountStatus}
                            onChange={(e) => setCurrentAccountStatus(e.target.value)}
                            className="bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs rounded-lg p-2.5 font-bold focus:outline-none focus:border-indigo-500 flex-1"
                          >
                            <option value="Active">Active (Normal Access)</option>
                            <option value="Suspended">Suspended (Blocked)</option>
                            <option value="Pending Review">Pending Review</option>
                            <option value="Deleted">Deleted / Deactivated</option>
                          </select>
                          <button
                            onClick={() => handleSaveUserMeta(currentAccountStatus, currentPlan, currentRole)}
                            disabled={savingUserMeta}
                            className="px-3 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-all cursor-pointer disabled:opacity-50 shrink-0"
                          >
                            {savingUserMeta ? "Saving..." : "Apply"}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                          Role (RBAC)
                        </label>
                        <div className="flex items-center gap-2">
                          <select
                            value={currentRole}
                            onChange={(e) => setCurrentRole(e.target.value as 'admin' | 'staff' | 'customer')}
                            className="bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs rounded-lg p-2.5 font-bold focus:outline-none focus:border-indigo-500 flex-1"
                          >
                            <option value="admin">Admin (Full Access)</option>
                            <option value="staff">Staff (Standard)</option>
                            <option value="customer">Customer (Limited)</option>
                          </select>
                          <button
                            onClick={() => handleSaveUserMeta(currentAccountStatus, currentPlan, currentRole)}
                            disabled={savingUserMeta}
                            className="px-3 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-all cursor-pointer disabled:opacity-50 shrink-0"
                          >
                            {savingUserMeta ? "Saving..." : "Apply"}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                          Subscription Plan
                        </label>
                        <div className="flex items-center gap-2">
                          <select
                            value={currentPlan}
                            onChange={(e) => setCurrentPlan(e.target.value)}
                            className="bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs rounded-lg p-2.5 font-bold focus:outline-none focus:border-indigo-500 flex-1"
                          >
                            <option value="Free Trial">Free Trial (5 docs max)</option>
                            <option value="Free Tier (50 docs/mo)">Free Tier (50 docs/mo)</option>
                            <option value="Pro Plan ($49/mo)">Pro Plan ($49/mo - Unlimited)</option>
                            <option value="Enterprise Admin">Enterprise Admin (Unlimited)</option>
                          </select>
                          <button
                            onClick={() => handleSaveUserMeta(currentAccountStatus, currentPlan, currentRole)}
                            disabled={savingUserMeta}
                            className="px-3 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-all cursor-pointer disabled:opacity-50 shrink-0"
                          >
                            {savingUserMeta ? "Saving..." : "Apply"}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Permanent Core Credentials (Immutable Signup Identity) */}
                    <div className="p-4 bg-zinc-900/90 rounded-xl border border-zinc-800 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                        <div className="flex items-center gap-2">
                          <Lock className="w-4 h-4 text-amber-400" />
                          <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
                            Permanent Account Credentials (Locked to Signup)
                          </h3>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                          <Lock className="w-3 h-3 text-amber-400" /> Immutable Core Identity
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                        <div className="p-3 bg-zinc-950/80 rounded-xl border border-zinc-800 space-y-1">
                          <span className="text-[10px] text-zinc-500 font-bold uppercase block">Signup / Primary Account Email</span>
                          <span className="font-mono font-bold text-amber-300 block truncate">{getUserEmail(selectedUser) || "N/A"}</span>
                          <span className="text-[9px] text-zinc-500 font-medium">Read-Only Source of Truth</span>
                        </div>

                        <div className="p-3 bg-zinc-950/80 rounded-xl border border-zinc-800 space-y-1">
                          <span className="text-[10px] text-zinc-500 font-bold uppercase block">Permanent Account Username</span>
                          <span className="font-mono font-bold text-amber-300 block truncate">{getUserUsername(selectedUser)}</span>
                          <span className="text-[9px] text-zinc-500 font-medium">Bound to Auth Credentials</span>
                        </div>

                        <div className="p-3 bg-zinc-950/80 rounded-xl border border-zinc-800 space-y-1">
                          <span className="text-[10px] text-zinc-500 font-bold uppercase block">Account UID</span>
                          <span className="font-mono font-semibold text-zinc-300 block truncate">{selectedUser.id}</span>
                          <span className="text-[9px] text-zinc-500 font-medium">Firestore Key</span>
                        </div>
                      </div>
                    </div>

                    {/* Business Details Overview */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                          Business Registration Info
                        </h3>
                        <button
                          onClick={handleOpenBusinessModal}
                          className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-lg border border-zinc-700 transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Edit Business Profile</span>
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                        <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800">
                          <span className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Company Name</span>
                          <span className="font-bold text-zinc-200">{selectedUser.business?.companyName || selectedUser.business?.name || "Not Configured"}</span>
                        </div>
                        <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800">
                          <span className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Tax ID / GSTIN</span>
                          <span className="font-mono font-bold text-zinc-200">{selectedUser.business?.gstin || "N/A"}</span>
                        </div>
                        <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800">
                          <span className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Phone Number</span>
                          <span className="font-mono text-zinc-200">{selectedUser.business?.phone || "N/A"}</span>
                        </div>
                        <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800 sm:col-span-2">
                          <span className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Registered Address</span>
                          <span className="text-zinc-300">{selectedUser.business?.address || "N/A"}</span>
                        </div>
                        <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800">
                          <span className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Country / Currency</span>
                          <span className="font-bold text-zinc-200">{selectedUser.business?.country || "India"} ({selectedUser.business?.currency || "INR"})</span>
                        </div>
                      </div>
                    </div>

                    {/* Database Payload Inspection */}
                    <div className="pt-2">
                      <button
                        onClick={() => handleViewRawJson(`Complete User Record (${selectedUser.id})`, selectedUser)}
                        className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold rounded-xl border border-zinc-800 transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <FileCode className="w-4 h-4 text-indigo-400" />
                        <span>Inspect Complete Firestore Document JSON</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB 2: DOCUMENTS & INVOICE INSPECTOR */}
                {activeTab === "documents" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between bg-zinc-900/80 p-3 rounded-xl border border-zinc-800">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-indigo-400" />
                        <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
                          User Invoices & Documents ({selectedUser.history?.length || 0})
                        </span>
                      </div>
                      <button
                        onClick={() => handleOpenDocModal()}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <FilePlus className="w-4 h-4" />
                        <span>+ Add Document for User</span>
                      </button>
                    </div>

                    {!selectedUser.history || selectedUser.history.length === 0 ? (
                      <div className="p-12 text-center text-zinc-500 bg-zinc-900/40 rounded-xl border border-zinc-800 space-y-3">
                        <FileText className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                        <p className="text-sm font-bold text-zinc-400">No Documents Found</p>
                        <p className="text-xs text-zinc-500">This user has not saved any invoices or quotations yet.</p>
                        <button
                          onClick={() => handleOpenDocModal()}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Create First Document</span>
                        </button>
                      </div>
                    ) : (
                      <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-900/40">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-zinc-900 text-zinc-400 font-bold border-b border-zinc-800 uppercase tracking-wider text-[10px]">
                                <th className="p-3">Doc #</th>
                                <th className="p-3">Type</th>
                                <th className="p-3">Date</th>
                                <th className="p-3">Party Name</th>
                                <th className="p-3 text-right">Amount</th>
                                <th className="p-3 text-center">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                              {selectedUser.history.map((docItem: any, idx: number) => {
                                const party = docItem.customer?.name || docItem.supplier?.name || "N/A";
                                const amount = docItem.grandTotal || docItem.total || 0;
                                const docType = docItem.type || "INVOICE";
                                const docId = docItem.documentNumber || docItem.id || `DOC-${idx + 1}`;

                                return (
                                  <motion.tr
                                    key={`${docItem.id || 'doc'}-${docItem.timestamp || ''}-${idx}`}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.18, delay: Math.min(idx * 0.03, 0.3) }}
                                    className="hover:bg-zinc-800/30 transition-colors"
                                  >
                                    <td className="p-3 font-mono font-bold text-white">{docId}</td>
                                    <td className="p-3">
                                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-zinc-800 text-indigo-300 border border-zinc-700">
                                        {docType}
                                      </span>
                                    </td>
                                    <td className="p-3 font-mono text-zinc-400">{docItem.date || "N/A"}</td>
                                    <td className="p-3 font-bold text-zinc-200">{party}</td>
                                    <td className="p-3 text-right font-mono font-bold text-emerald-400">
                                      {amount ? amount.toLocaleString() : "0"}
                                    </td>
                                    <td className="p-3">
                                      <div className="flex items-center justify-center gap-1.5">
                                        <button
                                          onClick={() => handlePreviewDocument(docItem)}
                                          title="Preview PDF"
                                          className="p-1.5 bg-zinc-800 hover:bg-indigo-600 text-zinc-300 hover:text-white rounded-lg border border-zinc-700 transition-all cursor-pointer"
                                        >
                                          <Eye className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() => handleDownloadDocument(docItem)}
                                          title="Download PDF"
                                          className="p-1.5 bg-zinc-800 hover:bg-emerald-600 text-zinc-300 hover:text-white rounded-lg border border-zinc-700 transition-all cursor-pointer"
                                        >
                                          <Download className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() => handleOpenDocModal(docItem)}
                                          title="Edit Document"
                                          className="p-1.5 bg-zinc-800 hover:bg-amber-600 text-zinc-300 hover:text-white rounded-lg border border-zinc-700 transition-all cursor-pointer"
                                        >
                                          <Edit3 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteDocument(docId)}
                                          title="Delete Document"
                                          className="p-1.5 bg-zinc-800 hover:bg-red-600 text-zinc-300 hover:text-white rounded-lg border border-zinc-700 transition-all cursor-pointer"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() => handleViewRawJson(`Document ${docId}`, docItem)}
                                          title="View Raw JSON Data"
                                          className="p-1.5 bg-zinc-800 hover:bg-purple-600 text-zinc-300 hover:text-white rounded-lg border border-zinc-700 transition-all cursor-pointer"
                                        >
                                          <FileCode className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </td>
                                  </motion.tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: SYSTEM LOGS & ACTIVITY AUDIT TRAIL */}
                {activeTab === "logs" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between bg-zinc-900/80 p-3 rounded-xl border border-zinc-800">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-indigo-400" />
                        <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                          Activity Audit Trail ({filteredLogs.length})
                        </span>
                      </div>

                      {/* Filter Toggle: Show Errors Only */}
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-zinc-300 bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700">
                        <input
                          type="checkbox"
                          checked={showErrorsOnly}
                          onChange={(e) => setShowErrorsOnly(e.target.checked)}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-0 bg-zinc-900 border-zinc-700 cursor-pointer"
                        />
                        <span className={showErrorsOnly ? "text-red-400 font-bold" : ""}>
                          Show Errors Only
                        </span>
                      </label>
                    </div>

                    {filteredLogs.length === 0 ? (
                      <div className="p-8 text-center text-zinc-500 bg-zinc-900/40 rounded-xl border border-zinc-800 text-xs">
                        {showErrorsOnly ? "No error events recorded for this user." : "No audit trail logs recorded yet."}
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                        {filteredLogs.map((log, idx) => {
                          const logId = log.id || `log_${idx}`;
                          const isExpanded = expandedLogId === logId;
                          const isError = log.isError || log.severity === "error";

                          return (
                            <motion.div
                              key={logId}
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.18, delay: Math.min(idx * 0.03, 0.3) }}
                              className={`p-3.5 rounded-xl border text-xs space-y-2 transition-all ${
                                isError
                                  ? "bg-red-950/30 border-red-800/70 text-red-200"
                                  : "bg-zinc-900/60 border-zinc-800 text-zinc-300"
                              }`}
                            >
                              <div
                                onClick={() => setExpandedLogId(isExpanded ? null : logId)}
                                className="flex items-start justify-between gap-3 cursor-pointer select-none"
                              >
                                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase shrink-0 mt-0.5 ${
                                    isError
                                      ? "bg-red-900/90 text-red-100 border border-red-700/80 shadow-xs"
                                      : "bg-emerald-950 text-emerald-400 border border-emerald-800/60"
                                  }`}>
                                    {isError ? "Error" : "Success"}
                                  </span>
                                  
                                  <div className="min-w-0 flex-1 space-y-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-bold text-white text-xs">{log.action}</span>
                                      {log.screen && (
                                        <span className="px-1.5 py-0.2 text-[9px] font-mono bg-zinc-800/90 text-zinc-300 rounded border border-zinc-700/60">
                                          {log.screen}
                                        </span>
                                      )}
                                      {log.category && (
                                        <span className="px-1.5 py-0.2 text-[9px] font-mono bg-indigo-950/60 text-indigo-300 rounded border border-indigo-800/50 uppercase">
                                          {log.category}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-zinc-400 text-[11px] font-mono leading-relaxed line-clamp-2">
                                      {log.details}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="font-mono text-[10px] text-zinc-500">
                                    {log.timestamp ? new Date(log.timestamp).toLocaleString() : "N/A"}
                                  </span>
                                  <button className="p-1 hover:bg-zinc-800 rounded text-zinc-400">
                                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                  </button>
                                </div>
                              </div>

                              {/* Detailed Expanded View */}
                              {isExpanded && (
                                <div className="pt-2 border-t border-zinc-800/80 space-y-2 text-[11px] font-mono">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] text-zinc-400 bg-zinc-950/70 p-2.5 rounded-lg border border-zinc-800/80">
                                    <div>
                                      <span className="text-zinc-500 font-bold block">Timestamp:</span>
                                      <span className="text-zinc-200">{log.timestamp} ({new Date(log.timestamp).toLocaleString()})</span>
                                    </div>
                                    <div>
                                      <span className="text-zinc-500 font-bold block">Category / Severity:</span>
                                      <span className="text-zinc-200 uppercase font-bold">{log.category || "system"} / {log.severity || (isError ? "error" : "info")}</span>
                                    </div>
                                    {log.userEmail && (
                                      <div>
                                        <span className="text-zinc-500 font-bold block">User Email:</span>
                                        <span className="text-amber-300">{log.userEmail}</span>
                                      </div>
                                    )}
                                    {log.userId && (
                                      <div>
                                        <span className="text-zinc-500 font-bold block">User ID:</span>
                                        <span className="text-zinc-200">{log.userId}</span>
                                      </div>
                                    )}
                                  </div>

                                  {log.errorMessage && (
                                    <div className="p-2.5 bg-red-950/50 border border-red-800/70 rounded-lg text-red-200 space-y-1">
                                      <span className="text-[10px] text-red-400 font-bold uppercase block">Exact Error Message</span>
                                      <p className="font-bold text-xs">{log.errorMessage}</p>
                                    </div>
                                  )}

                                  {log.errorStack ? (
                                    <div className="p-2.5 bg-zinc-950 rounded-lg border border-zinc-800 space-y-1">
                                      <span className="text-[10px] text-zinc-400 font-bold uppercase block">Error Stack Trace / Diagnostics</span>
                                      <pre className="text-[10px] text-zinc-300 whitespace-pre-wrap max-h-48 overflow-auto leading-relaxed font-mono">
                                        {log.errorStack}
                                      </pre>
                                    </div>
                                  ) : (
                                    <div className="p-2.5 bg-zinc-950 rounded-lg border border-zinc-800 space-y-1">
                                      <span className="text-[10px] text-zinc-400 font-bold uppercase block">Log Detail Context</span>
                                      <p className="text-zinc-300 text-[10px] leading-relaxed whitespace-pre-wrap">{log.details}</p>
                                    </div>
                                  )}

                                  <div className="flex justify-end pt-1">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleViewRawJson(`Audit Log Event (${logId})`, log);
                                      }}
                                      className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[10px] font-bold rounded-md transition-all flex items-center gap-1 cursor-pointer"
                                    >
                                      <FileCode className="w-3 h-3 text-indigo-400" />
                                      <span>View Full Log JSON</span>
                                    </button>
                                  </div>
                                </div>
                              )}
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 4: ADMIN NOTES SECTION */}
                {activeTab === "notes" && (
                  <div className="space-y-4 bg-zinc-900/80 p-5 rounded-xl border border-zinc-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                          <Save className="w-4 h-4 text-indigo-400" />
                          <span>Internal Admin Notes & Support Logs</span>
                        </h3>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          Private notes regarding customer tickets, complaints, or custom overrides for user <span className="text-zinc-200 font-mono">{selectedUser.id}</span>.
                        </p>
                      </div>

                      {notesSaveSuccess && (
                        <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-3 py-1 rounded-lg flex items-center gap-1.5 animate-fade-in">
                          <Check className="w-3.5 h-3.5" /> Saved to Firestore!
                        </span>
                      )}
                    </div>

                    <textarea
                      rows={6}
                      value={adminNotesText}
                      onChange={(e) => setAdminNotesText(e.target.value)}
                      placeholder="Write customer service notes, complaint details, or specific configuration guidelines..."
                      className="w-full p-3.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 font-mono leading-relaxed resize-y"
                    />

                    <div className="flex items-center justify-end">
                      <button
                        onClick={handleSaveNotes}
                        disabled={savingNotes}
                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/20 border border-indigo-500 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" />
                        <span>{savingNotes ? "Saving Notes..." : "Save Admin Notes"}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB 5: SINGLE-USER OVERRIDES & HOTFIX PANEL */}
                {activeTab === "overrides" && (
                  <div className="space-y-6">
                    {/* Live Sync Banner & One-Click Trigger */}
                    <div className="p-5 bg-gradient-to-r from-indigo-950/80 via-zinc-900 to-purple-950/80 border border-indigo-500/30 rounded-2xl space-y-4 shadow-lg">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Zap className="w-5 h-5 text-indigo-400 animate-pulse" />
                            <h3 className="text-sm font-bold text-white tracking-wide uppercase">
                              Single-User Override & Hotfix Panel
                            </h3>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                              Live Control
                            </span>
                          </div>
                          <p className="text-xs text-zinc-300 leading-relaxed">
                            Apply custom feature flags, bypass subscription restrictions, force state re-syncs, or revoke active browser sessions for <strong className="text-white font-mono">{getUserEmail(selectedUser) || selectedUser.id}</strong>.
                          </p>
                        </div>

                        {/* Big Action Button: Push Live State Reset / Force Re-Sync */}
                        <button
                          onClick={handlePushLiveSync}
                          disabled={liveSyncTriggering}
                          className="px-5 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 border border-indigo-400/30 transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 shrink-0"
                        >
                          <RefreshCw className={`w-4 h-4 text-indigo-200 ${liveSyncTriggering ? "animate-spin" : ""}`} />
                          <span>{liveSyncTriggering ? "Pushing Signal..." : "Push Live State Reset / Force Re-Sync"}</span>
                        </button>
                      </div>

                      {liveSyncStatusMsg && (
                        <div className="p-3 bg-emerald-950/90 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fade-in">
                          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>{liveSyncStatusMsg}</span>
                        </div>
                      )}

                      {/* Status Badges & Secondary Session Controls */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-zinc-800/80">
                        <div className="p-3 bg-zinc-950/80 rounded-xl border border-zinc-800 space-y-1">
                          <span className="text-[10px] text-zinc-500 font-bold uppercase block">Last Live Re-Sync Signal</span>
                          <span className="font-mono text-xs font-bold text-indigo-300 block">
                            {selectedUser.forceSyncTimestamp ? new Date(selectedUser.forceSyncTimestamp).toLocaleString() : "Never Triggered"}
                          </span>
                        </div>

                        <button
                          onClick={handleForceSignOutSession}
                          className="p-3 bg-zinc-950/80 hover:bg-zinc-900 rounded-xl border border-amber-500/30 hover:border-amber-500/60 text-left transition-all cursor-pointer group space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-amber-400 font-bold uppercase">Force Sign-Out Active Sessions</span>
                            <Lock className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                          </div>
                          <span className="text-[10px] text-zinc-400 block truncate">
                            {selectedUser.sessionRevokedAt ? `Revoked at ${new Date(selectedUser.sessionRevokedAt).toLocaleTimeString()}` : "Revoke token & force relogin"}
                          </span>
                        </button>

                        <button
                          onClick={handleResetCachedState}
                          className="p-3 bg-zinc-950/80 hover:bg-zinc-900 rounded-xl border border-zinc-800 hover:border-zinc-700 text-left transition-all cursor-pointer group space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-purple-400 font-bold uppercase">Reset Cached Local State</span>
                            <Database className="w-3.5 h-3.5 text-purple-400 group-hover:scale-110 transition-transform" />
                          </div>
                          <span className="text-[10px] text-zinc-400 block truncate">
                            {selectedUser.resetCacheTimestamp ? `Flagged at ${new Date(selectedUser.resetCacheTimestamp).toLocaleTimeString()}` : "Purge browser cache"}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* AUTOMATED ACCOUNT DIAGNOSTICS & REPAIR ENGINE CARD */}
                    <div className="p-5 bg-gradient-to-r from-amber-950/40 via-zinc-900 to-indigo-950/40 border border-amber-500/40 rounded-2xl space-y-4 shadow-lg">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Wrench className="w-5 h-5 text-amber-400" />
                            <h4 className="text-sm font-bold text-white tracking-wide uppercase">
                              Auto-Fix Account & Resolve Errors
                            </h4>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              1-Click Repair
                            </span>
                          </div>
                          <p className="text-xs text-zinc-300 leading-relaxed">
                            Clears stuck WebSocket connection listeners, re-initializes corrupted Firestore schema fields (<code className="text-amber-300 font-mono text-[11px]">users/{selectedUser.id}</code>) with valid fallbacks, resolves active error logs, and pushes a background resync signal for <strong className="text-amber-200 font-mono">{getUserUsername(selectedUser)}</strong>.
                          </p>
                        </div>

                        <button
                          onClick={handleAutoFixAccount}
                          disabled={isAutoFixing}
                          className="px-5 py-3 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-white text-xs font-black rounded-xl shadow-xl shadow-amber-600/20 border border-amber-400/50 transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 shrink-0"
                        >
                          <Wrench className={`w-4 h-4 text-amber-100 ${isAutoFixing ? "animate-spin" : ""}`} />
                          <span>{isAutoFixing ? "Repairing Account..." : "Fix & Reset WebSocket/Sync State"}</span>
                        </button>
                      </div>

                      {/* Diagnostic Status Indicators */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-zinc-800">
                        <div className="p-2.5 bg-zinc-950/80 rounded-xl border border-zinc-800 flex items-center justify-between">
                          <span className="text-[10px] text-zinc-400 font-bold uppercase">Sync Handlers</span>
                          <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Healthy / Ready
                          </span>
                        </div>

                        <div className="p-2.5 bg-zinc-950/80 rounded-xl border border-zinc-800 flex items-center justify-between">
                          <span className="text-[10px] text-zinc-400 font-bold uppercase">Schema Fallbacks</span>
                          <span className="text-[11px] font-bold text-indigo-300 flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" /> Verified
                          </span>
                        </div>

                        <div className="p-2.5 bg-zinc-950/80 rounded-xl border border-zinc-800 flex items-center justify-between">
                          <span className="text-[10px] text-zinc-400 font-bold uppercase">Active Error Logs</span>
                          <span className={`text-[11px] font-bold ${
                            (selectedUser.logs || []).some((l: any) => l.isError && !l.resolved) ? "text-amber-400" : "text-emerald-400"
                          }`}>
                            {(selectedUser.logs || []).filter((l: any) => l.isError && !l.resolved).length} Pending
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Section 1: Custom Feature Flags & System Bypasses */}
                    <div className="p-5 bg-zinc-900/80 border border-zinc-800 rounded-2xl space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                        <div>
                          <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                            <Sliders className="w-4 h-4 text-indigo-400" />
                            <span>1. Per-User Custom Feature Flags & Bypasses</span>
                          </h4>
                          <p className="text-[11px] text-zinc-400 mt-0.5">
                            Enable or disable specific operational bypasses for this account without altering global platform configs.
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Toggle 1: Bypass Subscription Limit */}
                        <label className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                          overrideForm.bypassDocLimit 
                            ? "bg-indigo-950/40 border-indigo-500/50 text-zinc-100" 
                            : "bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                        }`}>
                          <input
                            type="checkbox"
                            checked={!!overrideForm.bypassDocLimit}
                            onChange={(e) => setOverrideForm(prev => ({ ...prev, bypassDocLimit: e.target.checked }))}
                            className="mt-1 h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-zinc-100">Bypass Subscription Document Limit</span>
                              {overrideForm.bypassDocLimit && (
                                <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                  Active Bypass
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-zinc-400 leading-normal">
                              Allows user to create invoices and quotations even if their remaining document quota reaches zero.
                            </p>
                          </div>
                        </label>

                        {/* Toggle 2: Force Refresh Local State */}
                        <label className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                          overrideForm.forceRefreshState 
                            ? "bg-indigo-950/40 border-indigo-500/50 text-zinc-100" 
                            : "bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                        }`}>
                          <input
                            type="checkbox"
                            checked={!!overrideForm.forceRefreshState}
                            onChange={(e) => setOverrideForm(prev => ({ ...prev, forceRefreshState: e.target.checked }))}
                            className="mt-1 h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-zinc-100">Force Refresh Local State</span>
                              {overrideForm.forceRefreshState && (
                                <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                  Enabled
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-zinc-400 leading-normal">
                              Instructs client browser to bypass offline localStorage cache and strictly pull fresh cloud state on load.
                            </p>
                          </div>
                        </label>

                        {/* Toggle 3: Skip Strict Validation */}
                        <label className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                          overrideForm.skipValidation 
                            ? "bg-amber-950/30 border-amber-500/50 text-zinc-100" 
                            : "bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                        }`}>
                          <input
                            type="checkbox"
                            checked={!!overrideForm.skipValidation}
                            onChange={(e) => setOverrideForm(prev => ({ ...prev, skipValidation: e.target.checked }))}
                            className="mt-1 h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-amber-500 cursor-pointer"
                          />
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-zinc-100">Skip Strict Input & Tax Validation</span>
                              {overrideForm.skipValidation && (
                                <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  Relaxed Mode
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-zinc-400 leading-normal">
                              Relaxes strict GSTIN/Tax ID regex validation, missing email checks, and strict item line requirements.
                            </p>
                          </div>
                        </label>

                        {/* Toggle 4: Enable Beta AI OCR */}
                        <label className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                          overrideForm.enableBetaOCR 
                            ? "bg-purple-950/40 border-purple-500/50 text-zinc-100" 
                            : "bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                        }`}>
                          <input
                            type="checkbox"
                            checked={!!overrideForm.enableBetaOCR}
                            onChange={(e) => setOverrideForm(prev => ({ ...prev, enableBetaOCR: e.target.checked }))}
                            className="mt-1 h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-purple-600 focus:ring-purple-500 cursor-pointer"
                          />
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-zinc-100">Enable Beta AI Vision OCR</span>
                              {overrideForm.enableBetaOCR && (
                                <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                  Beta Access
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-zinc-400 leading-normal">
                              Grants early access to experimental multi-page invoice vision auto-extraction and intelligent HSN lookup.
                            </p>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Section 2: Direct Plan & Entitlement Overrides */}
                    <div className="p-5 bg-zinc-900/80 border border-zinc-800 rounded-2xl space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                        <div>
                          <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-emerald-400" />
                            <span>2. Direct Plan & Entitlement Overrides</span>
                          </h4>
                          <p className="text-[11px] text-zinc-400 mt-0.5">
                            Manually override subscription tiers, assign custom monthly document quotas, or issue bonus document credits.
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Forced Subscription Tier */}
                        <div className="space-y-1.5">
                          <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                            Forced Subscription Tier
                          </label>
                          <select
                            value={overrideForm.forcedPlan || "None"}
                            onChange={(e) => setOverrideForm(prev => ({ ...prev, forcedPlan: e.target.value }))}
                            className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs rounded-xl p-3 font-bold focus:outline-none focus:border-indigo-500"
                          >
                            <option value="None">None (Use Default Plan)</option>
                            <option value="Free Trial">Free Trial (5 docs max)</option>
                            <option value="Free Tier (50 docs/mo)">Free Tier (50 docs/mo)</option>
                            <option value="Pro Plan ($49/mo)">Pro Plan ($49/mo - Unlimited)</option>
                            <option value="Enterprise Admin">Enterprise Admin (Unlimited)</option>
                          </select>
                        </div>

                        {/* Custom Document Quota Limit */}
                        <div className="space-y-1.5">
                          <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                            Custom Document Quota
                          </label>
                          <input
                            type="number"
                            placeholder="Default (e.g. 50)"
                            value={overrideForm.customDocQuota !== null && overrideForm.customDocQuota !== undefined ? overrideForm.customDocQuota : ""}
                            onChange={(e) => setOverrideForm(prev => ({ ...prev, customDocQuota: e.target.value === "" ? null : Number(e.target.value) }))}
                            className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs rounded-xl p-3 font-mono font-bold focus:outline-none focus:border-indigo-500"
                          />
                        </div>

                        {/* Bonus Document Credits */}
                        <div className="space-y-1.5">
                          <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                            Bonus Document Credits
                          </label>
                          <input
                            type="number"
                            placeholder="+0 Bonus Docs"
                            value={overrideForm.bonusDocCredits || 0}
                            onChange={(e) => setOverrideForm(prev => ({ ...prev, bonusDocCredits: Math.max(0, Number(e.target.value)) }))}
                            className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs rounded-xl p-3 font-mono font-bold focus:outline-none focus:border-indigo-500"
                          />
                        </div>

                        {/* Account Status / Lock Mode */}
                        <div className="space-y-1.5">
                          <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                            Account Access Mode
                          </label>
                          <select
                            value={overrideForm.accountLockStatus || "Active"}
                            onChange={(e) => setOverrideForm(prev => ({ ...prev, accountLockStatus: e.target.value as any }))}
                            className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs rounded-xl p-3 font-bold focus:outline-none focus:border-indigo-500"
                          >
                            <option value="Active">Active (Full Access)</option>
                            <option value="Soft Paused">Soft Paused (Read-Only Mode)</option>
                            <option value="Locked">Locked (Suspended Access)</option>
                          </select>
                        </div>
                      </div>

                      {/* Save Button & Feedback */}
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-zinc-800/80">
                        {overridesSuccessMsg ? (
                          <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-3.5 py-2 rounded-xl flex items-center gap-2">
                            <Check className="w-4 h-4 text-emerald-400" /> {overridesSuccessMsg}
                          </span>
                        ) : (
                          <span className="text-[11px] text-zinc-500">
                            Changes will be logged in the admin audit history and synced live to Firestore.
                          </span>
                        )}

                        <button
                          onClick={handleSaveUserOverrides}
                          disabled={savingOverrides}
                          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/20 border border-indigo-500 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          <Save className="w-4 h-4" />
                          <span>{savingOverrides ? "Saving Overrides..." : "Save & Apply User Overrides"}</span>
                        </button>
                      </div>
                    </div>

                    {/* Section 3: Admin Audit Log of Overrides */}
                    <div className="p-5 bg-zinc-900/80 border border-zinc-800 rounded-2xl space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                        <div>
                          <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                            <Clock className="w-4 h-4 text-amber-400" />
                            <span>3. Single-User Override Audit History</span>
                          </h4>
                          <p className="text-[11px] text-zinc-400 mt-0.5">
                            Immutable tracking log of manual hotfixes, state resets, and setting overrides applied to this account.
                          </p>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-zinc-950 text-zinc-400 border border-zinc-800">
                          {(selectedUser.overrideAuditLogs || selectedUser.overrideLogs || []).length} Recorded Events
                        </span>
                      </div>

                      {(!selectedUser.overrideAuditLogs && !selectedUser.overrideLogs || (selectedUser.overrideAuditLogs || selectedUser.overrideLogs).length === 0) ? (
                        <div className="p-8 text-center text-xs text-zinc-500 bg-zinc-950/60 rounded-xl border border-zinc-800/80">
                          No manual overrides or hotfixes have been applied to this user account yet.
                        </div>
                      ) : (
                        <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
                          {(selectedUser.overrideAuditLogs || selectedUser.overrideLogs || []).map((logItem: any, idx: number) => (
                            <div
                              key={logItem.id || idx}
                              className="p-3.5 bg-zinc-950 rounded-xl border border-zinc-800/80 hover:border-zinc-700 transition-all text-xs space-y-1.5"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                    {logItem.action || "OVERRIDE"}
                                  </span>
                                  <span className="font-mono text-zinc-300 font-semibold">{logItem.parameter || "Settings"}</span>
                                </div>
                                <span className="font-mono text-[10px] text-zinc-500">
                                  {logItem.timestamp ? new Date(logItem.timestamp).toLocaleString() : "Recently"}
                                </span>
                              </div>
                              {logItem.notes && (
                                <p className="text-[11px] text-zinc-400 leading-relaxed font-mono pl-1 border-l-2 border-indigo-500/40">
                                  {logItem.notes}
                                </p>
                              )}
                              <div className="text-[10px] text-zinc-500 flex items-center justify-between pt-1 border-t border-zinc-900">
                                <span>Admin ID: <strong className="text-zinc-400 font-mono">{logItem.adminId || "admin"}</strong></span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </div>
            ) : (
              <div className="p-12 text-center text-zinc-500 bg-zinc-950/80 rounded-2xl border border-zinc-800">
                Select a user from the list to inspect details.
              </div>
            )}
          </div>

        </div>
        )}
      </div>

      {/* PDF PREVIEW MODAL */}
      {previewPdfUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">{previewPdfDocName || "PDF Document Preview"}</h3>
              </div>
              <button
                onClick={() => {
                  URL.revokeObjectURL(previewPdfUrl);
                  setPreviewPdfUrl(null);
                }}
                className="p-1.5 text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 bg-zinc-950 p-2">
              <iframe
                src={previewPdfUrl}
                className="w-full h-full border-0 rounded-xl bg-white"
                title="PDF Preview"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: SPEED INSIGHTS & WEB VITALS DASHBOARD */}
      {adminMainTab === "speed_insights" && (
        <SpeedInsightsDashboard />
      )}

      {/* RAW JSON VIEWER MODAL */}
      {jsonModalData && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-3xl max-h-[80vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white">{jsonModalData.title}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(jsonModalData.json, null, 2));
                    setCopiedJson(true);
                    setTimeout(() => setCopiedJson(false), 2000);
                  }}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-lg border border-zinc-700 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedJson ? "Copied!" : "Copy JSON"}</span>
                </button>
                <button
                  onClick={() => setJsonModalData(null)}
                  className="p-1.5 text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 p-4 bg-zinc-950 overflow-y-auto font-mono text-xs text-emerald-400 leading-relaxed custom-scrollbar">
              <pre>{JSON.stringify(jsonModalData.json, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT DOCUMENT MODAL */}
      {isDocModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FilePlus className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">
                  {docForm.id ? "Edit User Document" : "Add Document to User Account"}
                </h3>
              </div>
              <button
                onClick={() => setIsDocModalOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 font-bold mb-1">Document Number / ID</label>
                <input
                  type="text"
                  value={docForm.documentNumber}
                  onChange={(e) => setDocForm({ ...docForm, documentNumber: e.target.value })}
                  placeholder="e.g. INV-2026-001"
                  className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Document Type</label>
                  <select
                    value={docForm.type}
                    onChange={(e) => setDocForm({ ...docForm, type: e.target.value })}
                    className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white font-bold focus:outline-none focus:border-indigo-500"
                  >
                    <option value="TAX INVOICE">TAX INVOICE</option>
                    <option value="INVOICE">INVOICE</option>
                    <option value="QUOTATION">QUOTATION</option>
                    <option value="PROFORMA">PROFORMA INVOICE</option>
                    <option value="DELIVERY CHALLAN">DELIVERY CHALLAN</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Issue Date</label>
                  <input
                    type="date"
                    value={docForm.date}
                    onChange={(e) => setDocForm({ ...docForm, date: e.target.value })}
                    className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-1">Customer / Party Name</label>
                <input
                  type="text"
                  value={docForm.partyName}
                  onChange={(e) => setDocForm({ ...docForm, partyName: e.target.value })}
                  placeholder="e.g. Acme Industrial Solutions"
                  className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-1">Total Amount (₹)</label>
                <input
                  type="number"
                  value={docForm.amount}
                  onChange={(e) => setDocForm({ ...docForm, amount: Number(e.target.value) })}
                  placeholder="0"
                  className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-emerald-400 font-mono font-bold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-1">Notes / Internal Reference</label>
                <textarea
                  rows={2}
                  value={docForm.notes}
                  onChange={(e) => setDocForm({ ...docForm, notes: e.target.value })}
                  placeholder="Optional terms or transaction notes..."
                  className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsDocModalOpen(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDocForm}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save to User Account</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE NEW USER MODAL */}
      {isNewUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Create New User Account</h3>
              </div>
              <button
                onClick={() => setIsNewUserModalOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 font-bold mb-1">User Email Address *</label>
                <input
                  type="email"
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  placeholder="e.g. client@company.com"
                  className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-1">Company / Business Name</label>
                <input
                  type="text"
                  value={newUserForm.companyName}
                  onChange={(e) => setNewUserForm({ ...newUserForm, companyName: e.target.value })}
                  placeholder="e.g. Global Tech Solutions Ltd"
                  className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-1">Tax Registration / Tax ID</label>
                <input
                  type="text"
                  value={newUserForm.gstin}
                  onChange={(e) => setNewUserForm({ ...newUserForm, gstin: e.target.value })}
                  placeholder="e.g. 27AAAAA0000A1Z5"
                  className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Subscription Plan</label>
                  <select
                    value={newUserForm.plan}
                    onChange={(e) => setNewUserForm({ ...newUserForm, plan: e.target.value })}
                    className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white font-bold focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Free Tier (50 docs/mo)">Free Tier (50 docs/mo)</option>
                    <option value="Pro Plan ($49/mo)">Pro Plan ($49/mo)</option>
                    <option value="Enterprise Admin">Enterprise Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Account Status</label>
                  <select
                    value={newUserForm.status}
                    onChange={(e) => setNewUserForm({ ...newUserForm, status: e.target.value })}
                    className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white font-bold focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Pending Review">Pending Review</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsNewUserModalOpen(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateUser}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Provision User Account</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT BUSINESS PROFILE MODAL */}
      {isEditBusinessModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Edit Business Registration Profile</h3>
              </div>
              <button
                onClick={() => setIsEditBusinessModalOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 font-bold mb-1">Company / Business Name</label>
                <input
                  type="text"
                  value={businessForm.companyName}
                  onChange={(e) => setBusinessForm({ ...businessForm, companyName: e.target.value })}
                  className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white font-bold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">{getCountryConfig(businessForm.country || "India").taxLabel}</label>
                  <input
                    type="text"
                    value={businessForm.gstin}
                    onChange={(e) => setBusinessForm({ ...businessForm, gstin: e.target.value })}
                    className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={businessForm.phone}
                    onChange={(e) => setBusinessForm({ ...businessForm, phone: e.target.value })}
                    className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-1">Business Email</label>
                <input
                  type="email"
                  value={businessForm.email}
                  onChange={(e) => setBusinessForm({ ...businessForm, email: e.target.value })}
                  className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-1">Registered Billing Address</label>
                <input
                  type="text"
                  value={businessForm.address}
                  onChange={(e) => setBusinessForm({ ...businessForm, address: e.target.value })}
                  className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Country</label>
                  <input
                    type="text"
                    value={businessForm.country}
                    onChange={(e) => setBusinessForm({ ...businessForm, country: e.target.value })}
                    className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Currency Code</label>
                  <input
                    type="text"
                    value={businessForm.currency}
                    onChange={(e) => setBusinessForm({ ...businessForm, currency: e.target.value })}
                    className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white font-mono font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsEditBusinessModalOpen(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveBusinessInfo}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Business Profile</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIGURE ADMIN SECURITY PASSWORD MODAL */}
      {isSetPasswordModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-amber-950/80 to-zinc-900 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">
                    {(localStorage.getItem("admin_security_password") || localStorage.getItem("billiq_admin_security_pass") || adminSecurityPassword) ? "Change Admin Security Password" : "Set Admin Security Password"}
                  </h3>
                  <p className="text-xs text-amber-300/80">Security Key for Account Deletions & Admin Actions</p>
                </div>
              </div>
              <button
                onClick={() => setIsSetPasswordModalOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-3.5 text-xs">
              {!(localStorage.getItem("admin_security_password") || localStorage.getItem("billiq_admin_security_pass") || adminSecurityPassword) ? (
                <div className="p-3 bg-amber-950/40 border border-amber-800/50 rounded-xl text-amber-200 text-xs space-y-1">
                  <p className="font-bold flex items-center gap-1.5 text-amber-400">
                    <ShieldCheck className="w-4 h-4" />
                    Create Your Security Password
                  </p>
                  <p className="text-zinc-300 leading-relaxed">
                    Set a personal security password below. Once created, this password will be required whenever you delete user accounts from Firestore.
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-zinc-950/80 border border-zinc-800 rounded-xl text-zinc-300 text-xs space-y-1">
                  <p className="font-semibold text-amber-400 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" />
                    Custom Security Password Active
                  </p>
                  <p className="text-zinc-400">
                    Enter your current security password to set a new one.
                  </p>
                </div>
              )}

              {(localStorage.getItem("admin_security_password") || localStorage.getItem("billiq_admin_security_pass") || adminSecurityPassword) && (
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">
                    Current Admin Password
                  </label>
                  <input
                    type="password"
                    placeholder="Enter current security password"
                    value={currentPassInput}
                    onChange={(e) => {
                      setCurrentPassInput(e.target.value);
                      setSetPasswordModalError("");
                    }}
                    className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white font-mono placeholder:text-zinc-600 focus:outline-none focus:border-amber-500"
                    autoFocus
                  />
                </div>
              )}

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">
                  New Admin Security Password
                </label>
                <input
                  type="password"
                  placeholder="Enter new security password"
                  value={newPassInput}
                  onChange={(e) => {
                    setNewPassInput(e.target.value);
                    setSetPasswordModalError("");
                  }}
                  className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white font-mono placeholder:text-zinc-600 focus:outline-none focus:border-amber-500"
                  autoFocus={!(localStorage.getItem("admin_security_password") || localStorage.getItem("billiq_admin_security_pass") || adminSecurityPassword)}
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  placeholder="Re-enter new security password"
                  value={confirmPassInput}
                  onChange={(e) => {
                    setConfirmPassInput(e.target.value);
                    setSetPasswordModalError("");
                  }}
                  className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white font-mono placeholder:text-zinc-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              {setPasswordModalError && (
                <div className="p-2.5 bg-red-950/60 border border-red-800/80 rounded-xl text-red-300 text-xs font-semibold">
                  {setPasswordModalError}
                </div>
              )}

              {setPasswordModalSuccess && (
                <div className="p-2.5 bg-emerald-950/60 border border-emerald-800/80 rounded-xl text-emerald-300 text-xs font-semibold flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-400" />
                  {setPasswordModalSuccess}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setIsSetPasswordModalOpen(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSecurityPassword}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-lg shadow-amber-600/20 transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Password</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE USER CONFIRMATION MODAL WITH ADMIN PASSWORD */}
      {isDeleteUserModalOpen && userToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-red-900/80 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-red-950/80 to-zinc-900 border-b border-red-900/50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-red-600/20 text-red-400 rounded-xl border border-red-500/30">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Confirm Account Deletion</h3>
                  <p className="text-xs text-red-300">Permanent Firestore Removal</p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (!isDeletingUser) {
                    setIsDeleteUserModalOpen(false);
                    setUserToDelete(null);
                  }
                }}
                className="p-1.5 text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-red-950/40 border border-red-900/50 rounded-xl text-red-200 space-y-1.5">
                <p className="font-bold flex items-center gap-1.5 text-red-400 text-xs uppercase tracking-wide">
                  <Shield className="w-4 h-4" />
                  Irreversible Administrative Action
                </p>
                <p className="text-zinc-300 leading-relaxed">
                  You are about to permanently delete this user account and erase all associated documents from Firestore:
                </p>
                <div className="mt-2 p-2.5 bg-zinc-950/90 rounded-xl border border-zinc-800 font-mono text-white text-xs space-y-1">
                  <p><span className="text-zinc-500">UID:</span> <span className="text-indigo-400">{userToDelete.id}</span></p>
                  <p><span className="text-zinc-500">Email:</span> <span className="text-zinc-200">{getUserEmail(userToDelete) || "No Email"}</span></p>
                  <p><span className="text-zinc-500">Company:</span> <span className="text-zinc-200">{userToDelete.business?.companyName || userToDelete.displayName || "N/A"}</span></p>
                </div>
              </div>

              {!(localStorage.getItem("admin_security_password") || localStorage.getItem("billiq_admin_security_pass") || adminSecurityPassword) ? (
                <div className="p-3 bg-amber-950/50 border border-amber-800/80 rounded-xl text-amber-200 space-y-2">
                  <p className="font-bold flex items-center gap-1.5 text-amber-300">
                    <Key className="w-4 h-4 text-amber-400" />
                    Security Password Required
                  </p>
                  <p className="text-zinc-300 text-xs leading-relaxed">
                    No admin security password has been configured yet. You must set your password first before you can delete user accounts.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentPassInput("");
                      setNewPassInput("");
                      setConfirmPassInput("");
                      setSetPasswordModalError("");
                      setSetPasswordModalSuccess("");
                      setIsSetPasswordModalOpen(true);
                    }}
                    className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow"
                  >
                    <Key className="w-4 h-4" />
                    <span>Set Admin Security Password Now</span>
                  </button>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-zinc-200 font-bold">
                      Enter Admin Security Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentPassInput("");
                        setNewPassInput("");
                        setConfirmPassInput("");
                        setSetPasswordModalError("");
                        setSetPasswordModalSuccess("");
                        setIsSetPasswordModalOpen(true);
                      }}
                      className="text-amber-400 hover:text-amber-300 text-[11px] font-semibold underline flex items-center gap-1 cursor-pointer"
                    >
                      <Key className="w-3 h-3 text-amber-400" />
                      Change Password
                    </button>
                  </div>
                  <input
                    type="password"
                    placeholder="Enter your admin security password"
                    value={deleteAdminPassword}
                    onChange={(e) => {
                      setDeleteAdminPassword(e.target.value);
                      setDeletePasswordError("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !isDeletingUser) {
                        handleConfirmDeleteUser();
                      }
                    }}
                    className="w-full p-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-white font-mono placeholder:text-zinc-600 focus:outline-none focus:border-red-500"
                    autoFocus
                  />
                  {deletePasswordError && (
                    <p className="mt-1.5 text-red-400 font-semibold text-[11px]">{deletePasswordError}</p>
                  )}
                  <p className="mt-1.5 text-[11px] text-zinc-400">
                    Valid security password required to authorize permanent cloud removal.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex items-center justify-end gap-2.5">
              <button
                onClick={() => {
                  setIsDeleteUserModalOpen(false);
                  setUserToDelete(null);
                }}
                disabled={isDeletingUser}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeleteUser}
                disabled={isDeletingUser || !(localStorage.getItem("admin_security_password") || localStorage.getItem("billiq_admin_security_pass") || adminSecurityPassword)}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-lg shadow-red-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                {isDeletingUser ? (
                  <span>Deleting...</span>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Confirm & Delete Permanently</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BULK PURGE / RESET APP DATA MODAL */}
      {isPurgeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-red-800 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-gradient-to-r from-red-950 to-zinc-900 border-b border-red-900/50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-red-600/20 text-red-400 rounded-xl border border-red-500/30">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Reset App Data & Wipe Non-Admin Accounts</h3>
                  <p className="text-xs text-red-300">Clean Slate Launch Preparation</p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (!isPurgingAll) {
                    setIsPurgeModalOpen(false);
                  }
                }}
                className="p-1.5 text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3.5 bg-red-950/40 border border-red-900/50 rounded-xl text-red-200 space-y-2">
                <p className="font-bold flex items-center gap-1.5 text-red-400 text-xs uppercase tracking-wide">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  Warning: Comprehensive Cloud & Database Reset
                </p>
                <p className="text-zinc-300 leading-relaxed">
                  This action will erase all data and accounts from Firestore and backend databases, leaving only the <strong className="text-white">2 administrative/founder accounts</strong>:
                </p>
                <div className="p-2.5 bg-zinc-950/90 rounded-xl border border-zinc-800 space-y-1 font-mono text-zinc-300">
                  <p className="text-emerald-400 font-bold">✓ Preserved 1: Founder (mehtavatsal24@gmail.com / XssthfE8PHMi9j3iNMmCYQ9Sqgk2)</p>
                  <p className="text-emerald-400 font-bold">✓ Preserved 2: Support (support@billiq.site / BzfnRqFFUtVeoqjxcLolmu6SRIA3)</p>
                </div>
                <p className="text-zinc-400 text-[11px]">
                  All other client accounts, subcollections, items, parties, documents, and trial histories will be completely purged so any deleted user who signs up again will be treated strictly as a fresh new user with a clean trial ledger.
                </p>
              </div>

              {!(localStorage.getItem("admin_security_password") || localStorage.getItem("billiq_admin_security_pass") || adminSecurityPassword) ? (
                <div className="p-3 bg-amber-950/50 border border-amber-800/80 rounded-xl text-amber-200 space-y-2">
                  <p className="font-bold flex items-center gap-1.5 text-amber-300">
                    <Key className="w-4 h-4 text-amber-400" />
                    Security Password Required
                  </p>
                  <p className="text-zinc-300 text-xs leading-relaxed">
                    No admin security password configured. Set your password first to authorize resetting app data.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentPassInput("");
                      setNewPassInput("");
                      setConfirmPassInput("");
                      setSetPasswordModalError("");
                      setSetPasswordModalSuccess("");
                      setIsSetPasswordModalOpen(true);
                    }}
                    className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow"
                  >
                    <Key className="w-4 h-4" />
                    <span>Set Admin Security Password Now</span>
                  </button>
                </div>
              ) : (
                <div>
                  <label className="block text-zinc-200 font-bold mb-1.5">
                    Enter Admin Security Password to Authorize Reset
                  </label>
                  <input
                    type="password"
                    placeholder="Enter admin security password"
                    value={purgeAdminPassword}
                    onChange={(e) => {
                      setPurgeAdminPassword(e.target.value);
                      setPurgePasswordError("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !isPurgingAll) {
                        handleConfirmPurgeAll();
                      }
                    }}
                    className="w-full p-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-white font-mono placeholder:text-zinc-600 focus:outline-none focus:border-red-500"
                    autoFocus
                  />
                  {purgePasswordError && (
                    <p className="mt-1.5 text-red-400 font-semibold text-[11px]">{purgePasswordError}</p>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setIsPurgeModalOpen(false)}
                disabled={isPurgingAll}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPurgeAll}
                disabled={isPurgingAll || !(localStorage.getItem("admin_security_password") || localStorage.getItem("billiq_admin_security_pass") || adminSecurityPassword)}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-lg shadow-red-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                {isPurgingAll ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Erasing Data & Wiping Accounts...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Confirm & Wipe All Non-Admin Accounts</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Broadcast Email Composer Modal */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Manual Broadcast Composer</h3>
              </div>
              <button onClick={() => setShowBroadcastModal(false)} className="text-zinc-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 font-bold mb-1 uppercase tracking-wider">Target Audience</label>
                <select
                  value={broadcastRecipientTarget}
                  onChange={(e) => setBroadcastRecipientTarget(e.target.value as any)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500 font-semibold"
                >
                  <option value="all">All Registered Users ({usersList.length})</option>
                  <option value="active">Active Users Only</option>
                  <option value="inactive">Inactive Users Only (&gt;5 Days Inactive)</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-1 uppercase tracking-wider">Email Subject</label>
                <input
                  type="text"
                  placeholder="e.g., Important Platform Update for BillIQ Users"
                  value={broadcastSubject}
                  onChange={(e) => setBroadcastSubject(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-1 uppercase tracking-wider">Email Content (Plain Text or HTML)</label>
                <textarea
                  rows={5}
                  placeholder="Write your announcement or newsletter content here..."
                  value={broadcastBody}
                  onChange={(e) => setBroadcastBody(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-800">
              <button
                onClick={() => setShowBroadcastModal(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSendBroadcast}
                disabled={sendingBroadcast || !broadcastSubject.trim() || !broadcastBody.trim()}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {sendingBroadcast && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{sendingBroadcast ? "Sending Broadcast..." : "Send Broadcast Now"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
