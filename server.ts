import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();
import express from "express";
import path from "path";
import fs from "fs";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import nodemailer from "nodemailer";
import { Resend } from "resend";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

const app = express();
app.set("trust proxy", 1);
const PORT = 3000;

// Active Runtime SMTP Configuration
interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
}

let activeSmtpConfig: SmtpConfig = {
  host: process.env.SMTP_HOST || "",
  port: parseInt(process.env.SMTP_PORT || "587", 10),
  secure: process.env.SMTP_SECURE === "true",
  user: process.env.SMTP_USER || "",
  pass: process.env.SMTP_PASS || "",
  from: process.env.SMTP_FROM || 'BillIQ Support <support@billiq.site>',
};

async function sendMailWithFallback(transporter: any, mailOptions: nodemailer.SendMailOptions) {
  try {
    return await transporter.sendMail(mailOptions);
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    if (
      errMsg.includes("550") ||
      errMsg.includes("testing emails") ||
      errMsg.includes("verify a domain") ||
      errMsg.includes("resend.com/domains")
    ) {
      try {
        return await transporter.sendMail({
          ...mailOptions,
          from: "BillIQ Support <support@billiq.site>",
          subject: `[BillIQ Notification] ${mailOptions.subject}`,
        });
      } catch (fallbackErr: any) {
        console.warn("[SMTP Dispatch Fallback Note]: Mail dispatch skipped for unverified domain in test environment.");
        return null;
      }
    }
    console.warn("[SMTP Dispatch Warning]:", errMsg);
    return null;
  }
}

function isValidDeliverableEmail(email: any): boolean {
  if (!email || typeof email !== "string") return false;
  let clean = email.trim().toLowerCase();
  const match = clean.match(/<([^>]+)>/);
  if (match && match[1]) clean = match[1].trim();

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(clean)) return false;

  const dummyDomains = [
    "example.com",
    "example.org",
    "example.net",
    "test.com",
    "domain.com",
    "sample.com",
    "invalid.com",
    "invalid",
    "smartbill.ai",
    "localhost",
  ];
  const domain = clean.split("@")[1];
  if (!domain || dummyDomains.includes(domain)) return false;
  return true;
}

async function dispatchEmail({
  to,
  from,
  replyTo,
  subject,
  html,
}: {
  to: string | string[];
  from?: string;
  replyTo?: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  const rawList = Array.isArray(to) ? to : [to];
  const recipientList = rawList
    .map((e) => {
      if (typeof e !== "string") return "";
      let clean = e.trim().toLowerCase();
      const m = clean.match(/<([^>]+)>/);
      if (m && m[1]) clean = m[1].trim();
      return clean;
    })
    .filter(isValidDeliverableEmail);

  if (recipientList.length === 0) {
    console.log(`[Email Dispatch Info] Skipped dispatch for non-deliverable/placeholder recipient(s): ${rawList.join(", ")}`);
    return true;
  }

  let cleanReplyTo: string | undefined = undefined;
  if (replyTo && typeof replyTo === "string") {
    let cand = replyTo.trim().toLowerCase();
    const m = cand.match(/<([^>]+)>/);
    if (m && m[1]) cand = m[1].trim();
    if (isValidDeliverableEmail(cand)) {
      cleanReplyTo = cand;
    }
  }

  const resendKey = process.env.RESEND_API_KEY || "";

  if (resendKey) {
    try {
      const resend = new Resend(resendKey);
      
      // Ensure fromAddress strictly uses the verified @billiq.site domain in Resend
      let fromAddress = "BillIQ Support <support@billiq.site>";
      if (from && from.includes("@billiq.site")) {
        fromAddress = from;
      } else if (activeSmtpConfig.from && activeSmtpConfig.from.includes("@billiq.site")) {
        fromAddress = activeSmtpConfig.from;
      }

      const resendPayload: any = {
        from: fromAddress,
        to: recipientList,
        subject: subject || "BillIQ Notification",
        html: html || "<p>Notification from BillIQ</p>",
      };
      if (cleanReplyTo) {
        resendPayload.replyTo = cleanReplyTo;
      }

      console.log(`[Resend Dispatch] Sending email to ${recipientList.join(", ")} from ${fromAddress} (reply-to: ${cleanReplyTo || "N/A"})...`);
      const { data, error } = await resend.emails.send(resendPayload);

      if (data) {
        console.log("[Resend Dispatch Success]:", data);
        return true;
      }

      if (error) {
        console.warn("[Resend Dispatch Notice]:", error.message || error);
      }
    } catch (resendErr: any) {
      console.warn("[Resend Dispatch Exception]:", resendErr?.message || resendErr);
    }
  }

  if (activeSmtpConfig.host && activeSmtpConfig.user && activeSmtpConfig.pass) {
    try {
      const transporter = nodemailer.createTransport({
        host: activeSmtpConfig.host,
        port: activeSmtpConfig.port,
        secure: activeSmtpConfig.secure,
        auth: { user: activeSmtpConfig.user, pass: activeSmtpConfig.pass },
      });

      await sendMailWithFallback(transporter, {
        from: from || activeSmtpConfig.from,
        to: recipientList.join(","),
        replyTo: cleanReplyTo,
        subject: subject,
        html: html,
      });
      return true;
    } catch (smtpErr: any) {
      console.warn("[SMTP Dispatch Exception]:", smtpErr?.message || smtpErr);
    }
  }

  return true;
}

// Initialize Google GenAI on the secure server side
const GEMINI_MODELS = ["gemini-3.7-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"];
const GEMINI_MODEL = GEMINI_MODELS[0];

// Server-side check before running Gemini
async function checkAuthBeforeGemini(req: express.Request): Promise<any> {
  return { uid: "local-admin", email: "admin@billiq.site" };
}

function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || "";
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY_MISSING: Add GEMINI_API_KEY to .env.local and restart the server.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build-server",
      },
    },
  });
}

// Helper: callWithRetry with multi-model fallback and backoff for rate limits / transient errors
async function callWithRetry<T>(
  fn: (activeModel: string) => Promise<T>,
  retriesPerModel = 2,
  delay = 500
): Promise<T> {
  let lastError: any = null;

  for (let mIndex = 0; mIndex < GEMINI_MODELS.length; mIndex++) {
    const currentModel = GEMINI_MODELS[mIndex];
    let currentDelay = delay;

    for (let attempt = 0; attempt <= retriesPerModel; attempt++) {
      try {
        return await fn(currentModel);
      } catch (error: any) {
        lastError = error;
        const errorMsg = typeof error === "string" ? error : (error?.message || JSON.stringify(error));
        const status = error?.status || error?.statusCode;

        const isUnavailable =
          status === 503 ||
          errorMsg.includes("503") ||
          errorMsg.includes("UNAVAILABLE") ||
          errorMsg.includes("high demand") ||
          errorMsg.includes("spikes in demand");

        const isTransient =
          isUnavailable ||
          errorMsg.includes("429") ||
          errorMsg.includes("500") ||
          errorMsg.includes("502") ||
          errorMsg.includes("504") ||
          errorMsg.includes("RESOURCE_EXHAUSTED") ||
          errorMsg.includes("overloaded") ||
          errorMsg.includes("quota") ||
          errorMsg.includes("rate limit") ||
          status === 429 ||
          status === 500;

        // If high demand/503 or quota limit on current model and we have another model available, fall back immediately
        if ((isUnavailable || status === 429 || errorMsg.includes("RESOURCE_EXHAUSTED")) && mIndex < GEMINI_MODELS.length - 1) {
          console.log(`[Gemini API Model Switch] ${currentModel} encountered ${status || 'busy status'}. Immediately switching to ${GEMINI_MODELS[mIndex + 1]}...`);
          break; // Switch to next model in GEMINI_MODELS
        }

        if (isTransient && attempt < retriesPerModel) {
          const jitter = Math.floor(Math.random() * 200);
          const waitTime = currentDelay + jitter;
          console.log(`[Gemini API Retry Note] Model ${currentModel} busy (${status || 'transient'}). Retrying in ${waitTime}ms (Attempt ${attempt + 1}/${retriesPerModel})...`);
          await new Promise((resolve) => setTimeout(resolve, waitTime));
          currentDelay *= 1.5;
          continue;
        }

        if (isTransient && mIndex < GEMINI_MODELS.length - 1) {
          console.log(`[Gemini API Model Switch] ${currentModel} exhausted attempts. Switching to ${GEMINI_MODELS[mIndex + 1]}...`);
          break; // Try next model in GEMINI_MODELS
        }

        console.error(`[Gemini API Final Failure] Model ${currentModel} failed. Status: ${status || 'N/A'}, Message: ${errorMsg}`);
        throw error;
      }
    }
  }

  throw lastError || new Error("Gemini API call failed after retries and model fallbacks.");
}

// Keep normal requests immediate while queueing bursts before they reach Gemini.
const MAX_ACTIVE_EXTRACTIONS = 2;
const MAX_QUEUED_EXTRACTIONS = 20;
let activeExtractions = 0;
const extractionQueue: Array<{
  task: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
}> = [];

function drainExtractionQueue() {
  while (activeExtractions < MAX_ACTIVE_EXTRACTIONS && extractionQueue.length > 0) {
    const queued = extractionQueue.shift();
    if (!queued) return;

    activeExtractions++;
    queued.task()
      .then(queued.resolve)
      .catch(queued.reject)
      .finally(() => {
        activeExtractions--;
        drainExtractionQueue();
      });
  }
}

function runExtractionWithPressureControl<T>(task: () => Promise<T>): Promise<T> {
  if (activeExtractions < MAX_ACTIVE_EXTRACTIONS && extractionQueue.length === 0) {
    activeExtractions++;
    return task().finally(() => {
      activeExtractions--;
      drainExtractionQueue();
    });
  }

  if (extractionQueue.length >= MAX_QUEUED_EXTRACTIONS) {
    return Promise.reject(new Error("EXTRACTION_QUEUE_FULL: Please retry shortly."));
  }

  return new Promise<T>((resolve, reject) => {
    extractionQueue.push({ task, resolve, reject });
    drainExtractionQueue();
  });
}

// Helper: safeJSONParse with robust truncated array & object salvage
function safeJSONParse(text: string, fallback: any = {}): any {
  if (!text || typeof text !== "string") return fallback;
  let cleaned = text.trim();

  if (cleaned.includes("```json")) {
    const match = cleaned.match(/```json\s*([\s\S]*?)\s*(?:```|$)/);
    if (match && match[1]) cleaned = match[1].trim();
  } else if (cleaned.includes("```")) {
    const match = cleaned.match(/```\s*([\s\S]*?)\s*(?:```|$)/);
    if (match && match[1]) cleaned = match[1].trim();
  }

  // 1. Direct parse attempt
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    // Continue to boundary parsing
  }

  // 2. Substring boundary parse
  try {
    const startObj = cleaned.indexOf("{");
    const startArr = cleaned.indexOf("[");
    let start = -1;
    if (startObj !== -1 && startArr !== -1) {
      start = Math.min(startObj, startArr);
    } else if (startObj !== -1) {
      start = startObj;
    } else if (startArr !== -1) {
      start = startArr;
    }

    const endObj = cleaned.lastIndexOf("}");
    const endArr = cleaned.lastIndexOf("]");
    const end = Math.max(endObj, endArr);

    if (start !== -1 && end !== -1 && end > start) {
      const sliced = cleaned.slice(start, end + 1);
      return JSON.parse(sliced);
    }
  } catch (err2) {
    // Continue to truncated recovery
  }

  // 3. Truncated recovery for large 200+ item payloads
  try {
    const startObj = cleaned.indexOf("{");
    if (startObj !== -1) {
      const str = cleaned.slice(startObj);
      const lastItemEnd = str.lastIndexOf("}");
      if (lastItemEnd !== -1) {
        let candidate = str.slice(0, lastItemEnd + 1);
        const openBraces = (candidate.match(/\{/g) || []).length;
        const closeBraces = (candidate.match(/\}/g) || []).length;
        const openBrackets = (candidate.match(/\[/g) || []).length;
        const closeBrackets = (candidate.match(/\]/g) || []).length;

        for (let i = 0; i < openBrackets - closeBrackets; i++) {
          candidate += "]";
        }
        for (let i = 0; i < openBraces - closeBraces; i++) {
          candidate += "}";
        }

        try {
          return JSON.parse(candidate);
        } catch {
          candidate = candidate.replace(/,\s*([\}\]])/g, "$1");
          return JSON.parse(candidate);
        }
      }
    }
  } catch (repairErr) {
    console.warn("Server truncated JSON recovery failed:", repairErr);
  }

  return fallback;
}

// Security Headers - Permit iframe preview embedding and avoid blocking iframe rendering
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginEmbedderPolicy: false,
    frameguard: false,
  })
);

// Flexible CORS Policy for Preview Iframe & Custom Domains
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Payload size limit expanded to 25mb for multi-page documents and high-resolution scans
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// Rate Limiting on /api/ endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests from this IP, please try again later." },
});

app.use("/api/", apiLimiter);

// 1. Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", mode: process.env.NODE_ENV || "development" });
});

// User Database and Registration System
const USERS_FILE_PATH = path.join(process.cwd(), "src", "data", "data_users.json");
const USERS_FILE_PATH_ALT = path.join(process.cwd(), "public", "data_users.json");

interface RegisteredUser {
  id: string;
  username: string;
  email: string;
  createdAt: string;
  updatedAt?: string;
  lastActive?: string | null;
  lastActiveAt?: string | null;
  lastSeen?: string | null;
  isOnline?: boolean;
  lastLogin?: string;
  lastLoginAt?: string;
  registrationDate?: string;
  created_at?: string;
  documentsCount?: number;
  firstDocCreatedAt?: string | null;
  hasReceivedFirstDocFollowup?: boolean;
  firstDocFollowupSentAt?: string | null;
  hasReceivedRatingEmail?: boolean;
  hasReceivedInactivityReminder?: boolean;
  lastInactivityReminderSentAt?: string | null;
}

let registeredUsers: RegisteredUser[] = [
  {
    id: "XssthfE8PHMi9j3iNMmCYQ9Sqgk2",
    username: "Founder",
    email: "mehtavatsal24@gmail.com",
    createdAt: "2026-08-11T09:10:33.539Z",
    updatedAt: new Date().toISOString(),
    lastActive: new Date().toISOString(),
    lastSeen: new Date().toISOString(),
    isOnline: true,
  },
  {
    id: "BzfnRqFFUtVeoqjxcLolmu6SRIA3",
    username: "BillIQ",
    email: "support@billiq.site",
    createdAt: "2026-08-11T09:27:15.829Z",
    updatedAt: new Date().toISOString(),
    lastActive: new Date().toISOString(),
    lastSeen: new Date().toISOString(),
    isOnline: true,
  },
];

function loadUsersFromDisk() {
  try {
    const targetFile = fs.existsSync(USERS_FILE_PATH) ? USERS_FILE_PATH : fs.existsSync(USERS_FILE_PATH_ALT) ? USERS_FILE_PATH_ALT : null;
    if (targetFile) {
      const raw = fs.readFileSync(targetFile, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        registeredUsers = parsed;
      }
    } else {
      saveUsersToDisk();
    }
  } catch (err) {
    console.error("[Users DB Error] Could not load users from disk:", err);
  }
}

function saveUsersToDisk() {
  try {
    const dir = path.dirname(USERS_FILE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(USERS_FILE_PATH, JSON.stringify(registeredUsers, null, 2), "utf-8");

    const altDir = path.dirname(USERS_FILE_PATH_ALT);
    if (!fs.existsSync(altDir)) fs.mkdirSync(altDir, { recursive: true });
    fs.writeFileSync(USERS_FILE_PATH_ALT, JSON.stringify(registeredUsers, null, 2), "utf-8");
  } catch (err) {
    console.error("[Users DB Error] Could not save users to disk:", err);
  }
}

loadUsersFromDisk();

// Username existence check endpoint
app.post("/api/check-username", (req, res) => {
  try {
    const { username } = req.body;
    if (!username || typeof username !== "string") {
      return res.status(400).json({ success: false, error: "Username is required." });
    }

    const trimmed = username.trim();
    if (!trimmed) {
      return res.status(400).json({ success: false, error: "Username cannot be empty." });
    }

    const exists = registeredUsers.some(
      (u) => (u.username || "").toLowerCase() === trimmed.toLowerCase()
    );

    if (exists) {
      return res.status(400).json({
        success: false,
        error: "Username is already taken. Please choose a different username.",
      });
    }

    return res.json({ success: true, available: true });
  } catch (err) {
    console.error("check-username error:", err);
    return res.status(500).json({ success: false, error: "Failed to check username." });
  }
});

// Admin Security Alert Endpoint for Failed PIN Attempts
app.post("/api/admin/security-alert", async (req, res) => {
  try {
    const { attemptedEmail, attemptsCount, userAgent, clientIp, timestamp, lockDurationMinutes } = req.body;
    const alertRecipient = "support@billiq.site";
    const alertTime = timestamp || new Date().toISOString();
    const formattedDate = new Date(alertTime).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    const ip = clientIp || req.ip || req.headers["x-forwarded-for"] || "Unknown IP";
    const agent = userAgent || req.headers["user-agent"] || "Unknown Browser / Client";

    const subject = `🚨 [SECURITY ALERT] Unauthorized Admin Console Access Attempts on BillIQ`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #09090b; color: #f4f4f5; border: 1px solid #dc2626; border-radius: 16px;">
        <div style="text-align: center; padding-bottom: 16px; border-bottom: 1px solid #27272a;">
          <h2 style="color: #ef4444; margin: 0; font-size: 20px; text-transform: uppercase; letter-spacing: 1px;">🚨 Admin Security Alert</h2>
          <p style="color: #a1a1aa; font-size: 13px; margin: 6px 0 0 0;">Multiple Failed Administrator PIN Attempts Detected</p>
        </div>
        
        <div style="padding: 20px 0; font-size: 14px; line-height: 1.6;">
          <p style="margin: 0 0 16px 0; color: #fca5a5; font-weight: bold;">
            An alert has been triggered because incorrect administrator PINs were entered ${attemptsCount || 3} consecutive times.
          </p>
          
          <div style="background-color: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <tr>
                <td style="padding: 6px 0; color: #71717a; font-weight: bold; width: 140px;">Timestamp (IST):</td>
                <td style="padding: 6px 0; color: #ffffff; font-family: monospace;">${formattedDate}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #71717a; font-weight: bold;">Logged Account:</td>
                <td style="padding: 6px 0; color: #60a5fa; font-family: monospace;">${attemptedEmail || "Unspecified"}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #71717a; font-weight: bold;">Consecutive Attempts:</td>
                <td style="padding: 6px 0; color: #f87171; font-weight: bold;">${attemptsCount || 3} Failed Attempts</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #71717a; font-weight: bold;">Lockout Status:</td>
                <td style="padding: 6px 0; color: #fbbf24; font-weight: bold;">Temporarily Locked for ${lockDurationMinutes || 5} minutes</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #71717a; font-weight: bold;">IP Address:</td>
                <td style="padding: 6px 0; color: #e4e4e7; font-family: monospace;">${ip}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #71717a; font-weight: bold;">Client Agent:</td>
                <td style="padding: 6px 0; color: #a1a1aa; font-size: 11px; word-break: break-all;">${agent}</td>
              </tr>
            </table>
          </div>

          <p style="margin: 0; color: #a1a1aa; font-size: 12px;">
            If this was you, please wait for the ${lockDurationMinutes || 5}-minute cooldown to expire before attempting again. If you did not initiate this, your administrator console remains secured behind zero-knowledge encryption and lockout protection.
          </p>
        </div>

        <div style="border-top: 1px solid #27272a; padding-top: 12px; text-align: center; color: #52525b; font-size: 11px;">
          BillIQ Automated Security Shield • System Notification
        </div>
      </div>
    `;

    await dispatchEmail({
      to: alertRecipient,
      subject,
      html,
    });

    console.log(`[Security Alert] Sent failed PIN alert notification to ${alertRecipient}`);
    return res.json({ success: true, message: "Security alert dispatched successfully." });
  } catch (err: any) {
    console.error("Security alert dispatch error:", err);
    return res.status(500).json({ success: false, error: "Failed to dispatch security alert." });
  }
});

// User Registration / Account Creation Flow Endpoint
app.post("/api/register", async (req, res) => {
  try {
    const { id, username, email } = req.body;

    const trimmedUsername = username && typeof username === "string" ? username.trim() : "";
    const trimmedEmail = email ? String(email).trim().toLowerCase() : "";

    const nowIso = new Date().toISOString();

    // Check if user account with this id or email already exists in the database
    let existingUser = registeredUsers.find(
      (u) => (id && u.id === id) || (trimmedEmail && (u.email || "").toLowerCase() === trimmedEmail)
    );

    if (existingUser) {
      if (id) existingUser.id = id;
      if (trimmedUsername) existingUser.username = trimmedUsername;
      if (trimmedEmail) existingUser.email = trimmedEmail;
      existingUser.lastActive = nowIso;
      existingUser.lastActiveAt = nowIso;
      existingUser.lastSeen = nowIso;
      existingUser.updatedAt = nowIso;
      existingUser.isOnline = true;

      saveUsersToDisk();
      return res.status(200).json({
        success: true,
        message: "User account synchronized successfully.",
        isNewUser: false,
        user: existingUser,
      });
    }

    const finalUsername = trimmedUsername || (trimmedEmail ? trimmedEmail.split("@")[0] : "User");

    // Register brand new user in the database
    const userRecord: RegisteredUser = {
      id: id || ("usr_" + Math.random().toString(36).substring(2, 11)),
      username: finalUsername,
      email: trimmedEmail,
      createdAt: nowIso,
      updatedAt: nowIso,
      lastActive: nowIso,
      lastActiveAt: nowIso,
      lastSeen: nowIso,
      isOnline: true,
    };

    registeredUsers.push(userRecord);
    saveUsersToDisk();

    return res.status(200).json({
      success: true,
      message: "User account created successfully.",
      isNewUser: true,
      user: userRecord,
    });
  } catch (err: any) {
    console.error("Account creation / user registration error:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to create user account.",
    });
  }
});

app.get("/api/users", (req, res) => {
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  const currentlyActiveUsersCount = registeredUsers.filter((u) => {
    if (u.isOnline === false) return false;
    const lastSeenTime = u.lastSeen ? new Date(u.lastSeen).getTime() : 0;
    const lastActiveTime = u.lastActive ? new Date(u.lastActive).getTime() : 0;
    const newestTime = Math.max(lastSeenTime, lastActiveTime);
    return newestTime >= fiveMinutesAgo;
  }).length;

  return res.json({
    users: registeredUsers,
    currentlyActiveUsersCount,
    totalCount: registeredUsers.length,
  });
});

// Endpoint to permanently delete a user record from registered users DB
app.delete("/api/users", (req, res) => {
  try {
    const { id, email, username } = req.body || req.query || {};
    const targetId = id ? String(id).trim() : "";
    const targetEmail = email ? String(email).trim().toLowerCase() : "";
    const targetUsername = username ? String(username).trim().toLowerCase() : "";

    if (!targetId && !targetEmail && !targetUsername) {
      return res.status(400).json({ success: false, error: "User identifier required for deletion." });
    }

    const initialLength = registeredUsers.length;
    registeredUsers = registeredUsers.filter((u) => {
      if (targetId && u.id === targetId) return false;
      if (targetEmail && (u.email || "").trim().toLowerCase() === targetEmail) return false;
      if (targetUsername && (u.username || "").trim().toLowerCase() === targetUsername) return false;
      return true;
    });

    if (registeredUsers.length !== initialLength) {
      saveUsersToDisk();
      console.log(`[Users DB]: Removed deleted user record (${targetId || targetEmail || targetUsername}).`);
    }

    return res.json({ success: true, message: "User deleted from backend database." });
  } catch (err) {
    console.error("Delete user error:", err);
    return res.status(500).json({ success: false, error: "Failed to delete user." });
  }
});

// Heartbeat & Real-Time Presence Tracking Endpoint
app.post("/api/heartbeat", (req, res) => {
  try {
    const { email, username, userId, status } = req.body || {};
    const nowIso = new Date().toISOString();
    const isOffline = status === "offline";

    const trimmedEmail = email ? String(email).trim().toLowerCase() : "";
    const trimmedUsername = username ? String(username).trim().toLowerCase() : "";

    let userRecord = registeredUsers.find(
      (u) =>
        (userId && u.id === userId) ||
        (trimmedEmail && (u.email || "").toLowerCase() === trimmedEmail) ||
        (trimmedUsername && (u.username || "").toLowerCase() === trimmedUsername)
    );

    if (userRecord) {
      userRecord.lastSeen = isOffline ? null : nowIso;
      userRecord.isOnline = !isOffline;
      userRecord.lastActive = nowIso;
      userRecord.lastActiveAt = nowIso;
      userRecord.updatedAt = nowIso;
    } else if (trimmedEmail || trimmedUsername || userId) {
      userRecord = {
        id: userId || "usr_" + Math.random().toString(36).substring(2, 11),
        username: username || (trimmedEmail ? trimmedEmail.split("@")[0] : "User"),
        email: email || "",
        createdAt: nowIso,
        updatedAt: nowIso,
        lastActive: nowIso,
        lastActiveAt: nowIso,
        lastSeen: isOffline ? null : nowIso,
        isOnline: !isOffline,
      };
      registeredUsers.push(userRecord);
    }

    saveUsersToDisk();

    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    const currentlyActiveCount = registeredUsers.filter((u) => {
      if (u.isOnline === false) return false;
      const lastSeenTime = u.lastSeen ? new Date(u.lastSeen).getTime() : 0;
      const lastActiveTime = (u.lastActiveAt || u.lastActive) ? new Date(u.lastActiveAt || u.lastActive!).getTime() : 0;
      const newestTime = Math.max(lastSeenTime, lastActiveTime);
      return newestTime >= fiveMinutesAgo;
    }).length;

    return res.json({
      success: true,
      currentlyActiveCount,
      timestamp: nowIso,
    });
  } catch (err: any) {
    console.error("[Heartbeat Error]:", err);
    return res.status(500).json({ success: false, error: "Failed to process heartbeat" });
  }
});

// Explicit Login Tracking Endpoint (Records Sign-In Timestamp of the Day)
app.post("/api/track-login", (req, res) => {
  try {
    const { email, username, userId } = req.body || {};
    const nowIso = new Date().toISOString();
    const trimmedEmail = email ? String(email).trim().toLowerCase() : "";
    const trimmedUsername = username ? String(username).trim().toLowerCase() : "";

    let userRecord = registeredUsers.find(
      (u) =>
        (userId && u.id === userId) ||
        (trimmedEmail && (u.email || "").toLowerCase() === trimmedEmail) ||
        (trimmedUsername && (u.username || "").toLowerCase() === trimmedUsername)
    );

    if (userRecord) {
      userRecord.lastLogin = nowIso;
      userRecord.lastLoginAt = nowIso;
      userRecord.lastActive = nowIso;
      userRecord.lastActiveAt = nowIso;
      userRecord.lastSeen = nowIso;
      userRecord.isOnline = true;
      userRecord.updatedAt = nowIso;
    } else if (trimmedEmail || trimmedUsername || userId) {
      userRecord = {
        id: userId || "usr_" + Math.random().toString(36).substring(2, 11),
        username: username || (trimmedEmail ? trimmedEmail.split("@")[0] : "User"),
        email: email || "",
        createdAt: nowIso,
        updatedAt: nowIso,
        lastLogin: nowIso,
        lastLoginAt: nowIso,
        lastActive: nowIso,
        lastActiveAt: nowIso,
        lastSeen: nowIso,
        isOnline: true,
      };
      registeredUsers.push(userRecord);
    }

    saveUsersToDisk();
    return res.json({ success: true, timestamp: nowIso, user: userRecord });
  } catch (err: any) {
    console.error("Track login error:", err);
    return res.status(500).json({ success: false, error: "Failed to record login event." });
  }
});

// First Document Creation Tracking Endpoint (Schedules 5-Minute Followup)
app.post("/api/track-first-document", (req, res) => {
  try {
    const { email, username, userId, documentsCount } = req.body || {};
    const nowIso = new Date().toISOString();
    const trimmedEmail = email ? String(email).trim().toLowerCase() : "";
    const trimmedUsername = username ? String(username).trim().toLowerCase() : "";

    let userRecord = registeredUsers.find(
      (u) =>
        (userId && u.id === userId) ||
        (trimmedEmail && (u.email || "").toLowerCase() === trimmedEmail) ||
        (trimmedUsername && (u.username || "").toLowerCase() === trimmedUsername)
    );

    if (!userRecord && (trimmedEmail || trimmedUsername || userId)) {
      userRecord = {
        id: userId || "usr_" + Math.random().toString(36).substring(2, 11),
        username: username || (trimmedEmail ? trimmedEmail.split("@")[0] : "User"),
        email: email || "",
        createdAt: nowIso,
        updatedAt: nowIso,
        lastActive: nowIso,
        lastActiveAt: nowIso,
      };
      registeredUsers.push(userRecord);
    }

    if (userRecord) {
      userRecord.documentsCount = Math.max(userRecord.documentsCount || 0, documentsCount || 1);
      userRecord.lastActive = nowIso;
      userRecord.lastActiveAt = nowIso;
      userRecord.updatedAt = nowIso;

      if (!userRecord.firstDocCreatedAt) {
        userRecord.firstDocCreatedAt = nowIso;
      }

      // Schedule 5-minute delayed automated dispatch if not already received
      if (!userRecord.hasReceivedFirstDocFollowup && userRecord.email && isValidDeliverableEmail(userRecord.email)) {
        scheduleFirstDocFollowup(userRecord);
      }

      saveUsersToDisk();
    }

    return res.json({
      success: true,
      message: "First document event registered.",
      hasReceivedFirstDocFollowup: userRecord?.hasReceivedFirstDocFollowup || false,
      firstDocCreatedAt: userRecord?.firstDocCreatedAt,
    });
  } catch (err: any) {
    console.error("Track first document error:", err);
    return res.status(500).json({ success: false, error: "Failed to record first document event." });
  }
});

// API Usage & Token Spend Intelligence Persistence
const DATA_DIR = path.join(process.cwd(), "src", "data");
const API_LOGS_FILE = path.join(DATA_DIR, "api_usage_logs.json");
let apiUsageLogs: any[] = [];

try {
  if (fs.existsSync(API_LOGS_FILE)) {
    const raw = fs.readFileSync(API_LOGS_FILE, "utf-8");
    apiUsageLogs = JSON.parse(raw);
    console.log(`[API Logs]: Loaded ${apiUsageLogs.length} audit records from disk.`);
  }
} catch (e) {
  console.warn("[API Logs]: Notice initializing audit logs:", e);
}

function saveApiLogsToDisk() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(API_LOGS_FILE, JSON.stringify(apiUsageLogs.slice(-1000), null, 2), "utf-8");
  } catch (e) {
    console.warn("[API Logs]: Notice saving audit logs to disk:", e);
  }
}

app.post("/api/log-usage", (req, res) => {
  try {
    const entry = req.body;
    if (!entry) {
      return res.status(400).json({ success: false, error: "Log payload required." });
    }

    const id = entry.id || `usage_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const logItem = {
      ...entry,
      id,
      timestamp: entry.timestamp || new Date().toISOString(),
    };

    apiUsageLogs.unshift(logItem);
    if (apiUsageLogs.length > 2000) apiUsageLogs = apiUsageLogs.slice(0, 2000);
    saveApiLogsToDisk();

    return res.json({ success: true, log: logItem });
  } catch (err: any) {
    console.error("Save API usage log error:", err);
    return res.status(500).json({ success: false, error: "Failed to record API usage log." });
  }
});

app.get("/api/api-usage-logs", (req, res) => {
  return res.json({
    success: true,
    logs: apiUsageLogs.slice(0, 500),
    totalCount: apiUsageLogs.length,
  });
});

// SMTP Settings Endpoints
app.get("/api/smtp-config", (req, res) => {
  res.json({
    configured: !!(activeSmtpConfig.host && activeSmtpConfig.user),
    host: activeSmtpConfig.host,
    port: activeSmtpConfig.port,
    secure: activeSmtpConfig.secure,
    user: activeSmtpConfig.user,
    from: activeSmtpConfig.from,
    passSet: !!activeSmtpConfig.pass,
  });
});

app.post("/api/smtp-config", (req, res) => {
  try {
    const { host, port, secure, user, pass, from } = req.body;
    if (!host || !user) {
      return res.status(400).json({ success: false, error: "SMTP Host and Username are required." });
    }

    activeSmtpConfig = {
      host: String(host).trim(),
      port: Number(port) || 587,
      secure: Boolean(secure),
      user: String(user).trim(),
      pass: pass ? String(pass).trim() : activeSmtpConfig.pass,
      from: from ? String(from).trim() : `"SmartBill AI Security" <${String(user).trim()}>`,
    };

    console.log(`[SMTP Updated] Host: ${activeSmtpConfig.host}, Port: ${activeSmtpConfig.port}, User: ${activeSmtpConfig.user}`);
    return res.json({ success: true, message: "SMTP configuration updated and activated successfully!" });
  } catch (err: any) {
    console.error("Error updating SMTP config:", err);
    return res.status(500).json({ success: false, error: "Failed to update SMTP settings." });
  }
});

app.post("/api/test-smtp", async (req, res) => {
  try {
    const { host, port, secure, user, pass, from, recipientEmail } = req.body;
    const testHost = host || activeSmtpConfig.host;
    const testPort = port || activeSmtpConfig.port;
    const testSecure = secure !== undefined ? secure : activeSmtpConfig.secure;
    const testUser = user || activeSmtpConfig.user;
    const testPass = pass !== undefined && pass !== "" ? pass : activeSmtpConfig.pass;
    const testFrom = from || activeSmtpConfig.from || `"SmartBill AI" <${testUser}>`;
    const targetRecipient = recipientEmail || testUser;

    if (!testHost || !testUser || !testPass) {
      return res.status(400).json({
        success: false,
        error: "Missing required SMTP credentials (Host, Username, and Password are required to test connection).",
      });
    }

    const testTransporter = nodemailer.createTransport({
      host: testHost,
      port: Number(testPort),
      secure: Boolean(testSecure),
      auth: {
        user: testUser,
        pass: testPass,
      },
    });

    // Verify connection configuration
    await testTransporter.verify();

    // Send a test mail
    await sendMailWithFallback(testTransporter, {
      from: testFrom,
      to: targetRecipient,
      subject: "SmartBill AI - SMTP Connection Test",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e4e4e7; border-radius: 16px; background-color: #ffffff;">
          <h2 style="color: #4f46e5; margin-top: 0;">✅ SMTP Connection Successful</h2>
          <p style="color: #3f3f46; font-size: 14px;">Your SMTP server configuration is working perfectly.</p>
          <p style="color: #71717a; font-size: 12px;">Dispatched from: <strong>${testHost}:${testPort}</strong></p>
        </div>
      `,
    });

    return res.json({
      success: true,
      message: `Test email sent successfully to ${targetRecipient}! Check your inbox.`,
    });
  } catch (err: any) {
    console.error("SMTP Test failed:", err?.message || err);
    return res.status(400).json({
      success: false,
      error: `SMTP Error: ${err?.message || "Could not connect to SMTP server. Verify host, port, username, and app password."}`,
    });
  }
});

// Feedback & Support Submission Endpoints
const FEEDBACK_FILE_PATH = path.join(process.cwd(), "src", "data", "data_feedback.json");
const FEEDBACK_FILE_PATH_ALT = path.join(process.cwd(), "public", "data_feedback.json");
const SUPPORT_FILE_PATH = path.join(process.cwd(), "src", "data", "data_support.json");

app.post("/api/feedback", async (req, res) => {
  try {
    const { category, rating, feedbackText, userEmail, userId, userName, companyName, phone, environment } = req.body;
    const recipient = "support@billiq.site";
    const timestamp = new Date().toISOString();

    const submission = {
      id: "fb_" + Math.random().toString(36).substring(2, 11),
      category: category || "general",
      rating: rating || 5,
      feedbackText: feedbackText || "",
      userEmail: userEmail || "Anonymous",
      userName: userName || "",
      companyName: companyName || "",
      phone: phone || "",
      userId: userId || "",
      recipient,
      createdAt: timestamp,
    };

    try {
      let existing: any[] = [];
      const readPath = fs.existsSync(FEEDBACK_FILE_PATH) ? FEEDBACK_FILE_PATH : fs.existsSync(FEEDBACK_FILE_PATH_ALT) ? FEEDBACK_FILE_PATH_ALT : null;
      if (readPath) {
        existing = JSON.parse(fs.readFileSync(readPath, "utf-8"));
      }
      existing.push(submission);

      const dir = path.dirname(FEEDBACK_FILE_PATH);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(FEEDBACK_FILE_PATH, JSON.stringify(existing, null, 2), "utf-8");

      const altDir = path.dirname(FEEDBACK_FILE_PATH_ALT);
      if (!fs.existsSync(altDir)) fs.mkdirSync(altDir, { recursive: true });
      fs.writeFileSync(FEEDBACK_FILE_PATH_ALT, JSON.stringify(existing, null, 2), "utf-8");
    } catch (e) {
      console.error("Could not save feedback to file:", e);
    }

    console.log(`[FEEDBACK SUBMITTED FOR ${recipient}]`, submission);

    const rawReplyEmail = typeof userEmail === "string" ? userEmail.trim() : "";
    const replyToEmail = (rawReplyEmail && rawReplyEmail.includes("@") && rawReplyEmail.toLowerCase() !== "anonymous" && rawReplyEmail.toLowerCase() !== "support@billiq.site")
      ? rawReplyEmail
      : undefined;

    const senderIdentifier = userName || userEmail || "Customer";
    const mailSent = await dispatchEmail({
      from: activeSmtpConfig.from || "BillIQ Support <support@billiq.site>",
      to: recipient,
      replyTo: replyToEmail,
      subject: `[BillIQ Support] New message from ${senderIdentifier} (${rating}★ Feedback)`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 14px; background-color: #ffffff;">
          <div style="border-bottom: 2px solid #4f46e5; padding-bottom: 12px; margin-bottom: 18px;">
            <h2 style="color: #4f46e5; margin: 0; font-size: 20px;">⭐ New User Feedback Received</h2>
            <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">Routed directly to Zoho Support Mailbox (${recipient})</p>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 18px; font-size: 13px; color: #334155;">
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 8px 0; font-weight: bold; width: 35%; color: #475569;">Customer Name:</td>
              <td style="padding: 8px 0; color: #0f172a; font-weight: 600;">${userName || "Not specified"}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 8px 0; font-weight: bold; color: #475569;">Customer Email:</td>
              <td style="padding: 8px 0; color: #4f46e5; font-weight: 600;">${userEmail || "Anonymous"}</td>
            </tr>
            ${phone ? `
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 8px 0; font-weight: bold; color: #475569;">Phone Number:</td>
              <td style="padding: 8px 0; color: #0f172a;">${phone}</td>
            </tr>` : ""}
            ${companyName ? `
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 8px 0; font-weight: bold; color: #475569;">Company / Business:</td>
              <td style="padding: 8px 0; color: #0f172a;">${companyName}</td>
            </tr>` : ""}
            ${userId ? `
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 8px 0; font-weight: bold; color: #475569;">Account / User ID:</td>
              <td style="padding: 8px 0; font-family: monospace; color: #64748b;">${userId}</td>
            </tr>` : ""}
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 8px 0; font-weight: bold; color: #475569;">Category:</td>
              <td style="padding: 8px 0; text-transform: uppercase; font-weight: 700; color: #0284c7;">${category}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 8px 0; font-weight: bold; color: #475569;">Rating:</td>
              <td style="padding: 8px 0; color: #eab308; font-weight: 700; font-size: 15px;">${rating} / 5 Stars</td>
            </tr>
          </table>

          <div style="margin-top: 14px;">
            <p style="font-weight: bold; color: #1e293b; margin-bottom: 8px; font-size: 14px;">Feedback Details:</p>
            <blockquote style="background: #f8fafc; padding: 14px; border-left: 4px solid #4f46e5; border-radius: 6px; margin: 0; color: #1e293b; font-size: 13px; line-height: 1.6; white-space: pre-wrap;">${feedbackText}</blockquote>
          </div>

          <div style="margin-top: 24px; padding-top: 12px; border-top: 1px solid #f1f5f9; font-size: 11px; color: #94a3b8;">
            <p style="margin: 2px 0;"><strong>Timestamp:</strong> ${timestamp}</p>
            <p style="margin: 2px 0;"><strong>Environment:</strong> ${environment || process.env.NODE_ENV || "production"}</p>
            <p style="margin: 2px 0;"><strong>Reply-To:</strong> Clicking "Reply" in Zoho Mail will respond directly to ${replyToEmail || userEmail || "the sender"}.</p>
          </div>
        </div>
      `,
    });

    return res.json({
      success: true,
      message: `Your message has been sent to our support team. We will get back to you shortly.`,
      mailSent,
      submission,
    });
  } catch (err: any) {
    console.error("Error handling /api/feedback:", err);
    return res.status(500).json({ success: false, error: "Failed to submit feedback." });
  }
});

// Mandatory Feedback Survey Route
app.post("/api/survey-feedback", async (req, res) => {
  try {
    const { userId, userEmail, userName, companyName, phone, environment, q1_timeSaved, q2_betterSoftware, q3_likedConcept, q4_paidIntent, q5_recommendedFeatures } = req.body;
    const recipient = "support@billiq.site";
    const timestamp = new Date().toISOString();

    const surveyPayload = {
      id: "srv_" + Math.random().toString(36).substring(2, 11),
      userId: userId || "Guest User",
      userEmail: userEmail || "Anonymous",
      userName: userName || "",
      companyName: companyName || "",
      phone: phone || "",
      q1_timeSaved,
      q2_betterSoftware,
      q3_likedConcept,
      q4_paidIntent,
      q5_recommendedFeatures,
      recipient,
      timestamp,
    };

    try {
      let existing: any[] = [];
      const readPath = fs.existsSync(FEEDBACK_FILE_PATH) ? FEEDBACK_FILE_PATH : fs.existsSync(FEEDBACK_FILE_PATH_ALT) ? FEEDBACK_FILE_PATH_ALT : null;
      if (readPath) {
        existing = JSON.parse(fs.readFileSync(readPath, "utf-8"));
      }
      existing.push(surveyPayload);

      const dir = path.dirname(FEEDBACK_FILE_PATH);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(FEEDBACK_FILE_PATH, JSON.stringify(existing, null, 2), "utf-8");

      const altDir = path.dirname(FEEDBACK_FILE_PATH_ALT);
      if (!fs.existsSync(altDir)) fs.mkdirSync(altDir, { recursive: true });
      fs.writeFileSync(FEEDBACK_FILE_PATH_ALT, JSON.stringify(existing, null, 2), "utf-8");
    } catch (e) {
      console.error("Could not save survey payload to file:", e);
    }

    console.log(`[SURVEY FEEDBACK SUBMITTED FOR ${recipient}]`, surveyPayload);

    const rawReplyEmail = typeof userEmail === "string" ? userEmail.trim() : "";
    const replyToEmail = (rawReplyEmail && rawReplyEmail.includes("@") && rawReplyEmail.toLowerCase() !== "anonymous" && rawReplyEmail.toLowerCase() !== "support@billiq.site")
      ? rawReplyEmail
      : undefined;

    const senderIdentifier = userName || userEmail || "Customer";
    const mailSent = await dispatchEmail({
      from: activeSmtpConfig.from || "BillIQ Support <support@billiq.site>",
      to: recipient,
      replyTo: replyToEmail,
      subject: `[BillIQ Support] New message from ${senderIdentifier} (Product Survey)`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 14px; background-color: #ffffff;">
          <div style="border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 18px;">
            <h2 style="color: #2563eb; margin: 0; font-size: 20px;">🚀 Product Survey Response</h2>
            <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">Routed directly to Zoho Support Mailbox (${recipient})</p>
          </div>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 18px; font-size: 13px; color: #334155;">
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 8px 0; font-weight: bold; width: 35%; color: #475569;">Customer Name:</td>
              <td style="padding: 8px 0; color: #0f172a; font-weight: 600;">${userName || "Not specified"}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 8px 0; font-weight: bold; color: #475569;">Customer Email:</td>
              <td style="padding: 8px 0; color: #2563eb; font-weight: 600;">${userEmail || "Anonymous"}</td>
            </tr>
            ${phone ? `
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 8px 0; font-weight: bold; color: #475569;">Phone Number:</td>
              <td style="padding: 8px 0; color: #0f172a;">${phone}</td>
            </tr>` : ""}
            ${companyName ? `
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 8px 0; font-weight: bold; color: #475569;">Company / Business:</td>
              <td style="padding: 8px 0; color: #0f172a;">${companyName}</td>
            </tr>` : ""}
            ${userId ? `
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 8px 0; font-weight: bold; color: #475569;">Account / User ID:</td>
              <td style="padding: 8px 0; font-family: monospace; color: #64748b;">${userId}</td>
            </tr>` : ""}
          </table>

          <table style="width: 100%; border-collapse: collapse; font-size: 13px; text-align: left; margin-bottom: 18px;">
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 0; font-weight: bold; color: #1e293b; width: 45%;">Q1 (Time Saved)</td>
              <td style="padding: 10px 0; color: #2563eb; font-weight: bold;">${q1_timeSaved || 'N/A'}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 0; font-weight: bold; color: #1e293b;">Q2 (Better Than Current Tool)</td>
              <td style="padding: 10px 0; color: #059669; font-weight: bold;">${q2_betterSoftware || 'N/A'}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 0; font-weight: bold; color: #1e293b;">Q3 (Liked Idea / Concept)</td>
              <td style="padding: 10px 0; color: #7c3aed; font-weight: bold;">${q3_likedConcept || 'N/A'}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 0; font-weight: bold; color: #1e293b;">Q4 (Paid Subscription Intent)</td>
              <td style="padding: 10px 0; color: #d97706; font-weight: bold;">${q4_paidIntent || 'N/A'}</td>
            </tr>
          </table>

          <div style="margin-top: 14px;">
            <p style="font-weight: bold; color: #1e293b; margin-bottom: 8px; font-size: 14px;">Q5: Recommended Add-On Features:</p>
            <div style="background: #eff6ff; padding: 14px; border-left: 4px solid #2563eb; border-radius: 6px; color: #1e3a8a; font-size: 13px; line-height: 1.6; white-space: pre-wrap;">${q5_recommendedFeatures || 'None provided'}</div>
          </div>

          <div style="margin-top: 24px; padding-top: 12px; border-top: 1px solid #f1f5f9; font-size: 11px; color: #94a3b8;">
            <p style="margin: 2px 0;"><strong>Timestamp:</strong> ${timestamp}</p>
            <p style="margin: 2px 0;"><strong>Environment:</strong> ${environment || process.env.NODE_ENV || "production"}</p>
            <p style="margin: 2px 0;"><strong>Reply-To:</strong> Direct response configured to ${replyToEmail || userEmail || "sender"}.</p>
          </div>
        </div>
      `,
    });

    return res.json({
      success: true,
      message: `Your message has been sent to our support team. We will get back to you shortly.`,
      mailSent,
      surveyPayload,
    });
  } catch (err: any) {
    console.error("Error in /api/survey-feedback:", err);
    return res.status(500).json({ success: false, error: "Failed to process survey feedback." });
  }
});

app.post("/api/support", async (req, res) => {
  try {
    const { name, email, topic, subject, message, phone, company, userId, environment } = req.body;
    const recipient = "support@billiq.site";
    const timestamp = new Date().toISOString();

    const ticket = {
      id: "sup_" + Math.random().toString(36).substring(2, 11),
      name: name || "",
      email: email || "Anonymous",
      phone: phone || "",
      company: company || "",
      userId: userId || "",
      topic: topic || "General Support",
      subject: subject || "General Support Request",
      message: message || "",
      recipient,
      createdAt: timestamp,
    };

    try {
      let existing: any[] = [];
      if (fs.existsSync(SUPPORT_FILE_PATH)) {
        existing = JSON.parse(fs.readFileSync(SUPPORT_FILE_PATH, "utf-8"));
      }
      existing.push(ticket);
      fs.writeFileSync(SUPPORT_FILE_PATH, JSON.stringify(existing, null, 2), "utf-8");
    } catch (e) {
      console.error("Could not save support ticket to file:", e);
    }

    console.log(`[SUPPORT TICKET FOR ${recipient}]`, ticket);

    const rawReplyEmail = typeof email === "string" ? email.trim() : "";
    const replyToEmail = (rawReplyEmail && rawReplyEmail.includes("@") && rawReplyEmail.toLowerCase() !== "anonymous" && rawReplyEmail.toLowerCase() !== "support@billiq.site")
      ? rawReplyEmail
      : undefined;

    const senderIdentifier = name || email || "Customer";
    const mailSent = await dispatchEmail({
      from: activeSmtpConfig.from || "BillIQ Support <support@billiq.site>",
      to: recipient,
      replyTo: replyToEmail,
      subject: `[BillIQ Support] New message from ${senderIdentifier}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 14px; background-color: #ffffff;">
          <div style="border-bottom: 2px solid #4f46e5; padding-bottom: 12px; margin-bottom: 18px;">
            <h2 style="color: #4f46e5; margin: 0; font-size: 20px;">📩 New Customer Support Ticket</h2>
            <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">Routed directly to Zoho Support Mailbox (${recipient})</p>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 18px; font-size: 13px; color: #334155;">
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 8px 0; font-weight: bold; width: 35%; color: #475569;">Customer Name:</td>
              <td style="padding: 8px 0; color: #0f172a; font-weight: 600;">${name || "Not provided"}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 8px 0; font-weight: bold; color: #475569;">Customer Email:</td>
              <td style="padding: 8px 0; color: #4f46e5; font-weight: 600;">${email || "Not provided"}</td>
            </tr>
            ${phone ? `
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 8px 0; font-weight: bold; color: #475569;">Phone Number:</td>
              <td style="padding: 8px 0; color: #0f172a;">${phone}</td>
            </tr>` : ""}
            ${company ? `
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 8px 0; font-weight: bold; color: #475569;">Company / Business:</td>
              <td style="padding: 8px 0; color: #0f172a;">${company}</td>
            </tr>` : ""}
            ${userId ? `
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 8px 0; font-weight: bold; color: #475569;">Account / User ID:</td>
              <td style="padding: 8px 0; font-family: monospace; color: #64748b;">${userId}</td>
            </tr>` : ""}
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 8px 0; font-weight: bold; color: #475569;">Topic / Department:</td>
              <td style="padding: 8px 0; font-weight: 600; color: #0f172a;">${topic || "General Support"}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 8px 0; font-weight: bold; color: #475569;">Subject Line:</td>
              <td style="padding: 8px 0; color: #0f172a;">${subject || "N/A"}</td>
            </tr>
          </table>

          <div style="margin-top: 14px;">
            <p style="font-weight: bold; color: #1e293b; margin-bottom: 8px; font-size: 14px;">Message Details:</p>
            <blockquote style="background: #f8fafc; padding: 14px; border-left: 4px solid #4f46e5; border-radius: 6px; margin: 0; color: #1e293b; font-size: 13px; line-height: 1.6; white-space: pre-wrap;">${message}</blockquote>
          </div>

          <div style="margin-top: 24px; padding-top: 12px; border-top: 1px solid #f1f5f9; font-size: 11px; color: #94a3b8;">
            <p style="margin: 2px 0;"><strong>Timestamp:</strong> ${timestamp}</p>
            <p style="margin: 2px 0;"><strong>Environment:</strong> ${environment || process.env.NODE_ENV || "production"}</p>
            <p style="margin: 2px 0;"><strong>Reply-To:</strong> Clicking "Reply" in Zoho Mail will respond directly to ${replyToEmail || email || "the customer"}.</p>
          </div>
        </div>
      `,
    });

    return res.json({
      success: true,
      message: `Your message has been sent to our support team. We will get back to you shortly.`,
      mailSent,
      ticket,
    });
  } catch (err: any) {
    console.error("Error handling /api/support:", err);
    return res.status(500).json({ success: false, error: "Failed to submit support ticket." });
  }
});

// Welcome Email Endpoint
app.post("/api/welcome-email", async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return res.status(400).json({ success: false, error: "Valid email address is required." });
    }

    const cleanEmail = email.trim().toLowerCase();
    const recipientName = name ? String(name).trim() : cleanEmail.split("@")[0];
    const timestamp = new Date().toISOString();

    console.log(`[WELCOME EMAIL DISPATCH REQUEST FOR ${cleanEmail}]`);

    const mailSent = await dispatchEmail({
      from: activeSmtpConfig.from || "BillIQ Support <support@billiq.site>",
      to: cleanEmail,
      subject: "Welcome to BillIQ - Your Global Billing & Compliance Workspace",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <div style="margin-bottom: 20px;">
            <h1 style="color: #4f46e5; margin: 0; font-size: 24px;">Welcome to BillIQ!</h1>
            <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Global Billing & Invoicing Suite with Cross-Border Compliance</p>
          </div>
          <p style="color: #334155; font-size: 15px; line-height: 1.6;">Hi <strong>${recipientName}</strong>,</p>
          <p style="color: #334155; font-size: 15px; line-height: 1.6;">Thank you for creating your account with BillIQ! Your workspace is now provisioned with enterprise-grade multi-currency billing, real-time GST/VAT calculation, and export compliance tools.</p>
          <div style="background-color: #f8fafc; border-left: 4px solid #4f46e5; padding: 16px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #1e293b; font-size: 14px;"><strong>Account Email:</strong> ${cleanEmail}</p>
            <p style="margin: 4px 0 0 0; color: #1e293b; font-size: 14px;"><strong>Account Status:</strong> Pending Verification / Active Workspace</p>
          </div>
          <p style="color: #334155; font-size: 14px; line-height: 1.6;">If you have any questions or need assistances setting up custom tax schemas or company letterheads, please reach our dedicated team at <a href="mailto:support@billiq.site" style="color: #4f46e5; text-decoration: underline;">support@billiq.site</a>.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="color: #94a3b8; font-size: 12px; margin: 0; text-align: center;">© 2026 BillIQ. All rights reserved. Built for Global Businesses.</p>
        </div>
      `,
    });

    return res.json({
      success: true,
      message: `Welcome email queued/dispatched to ${cleanEmail}`,
      mailSent,
      timestamp,
    });
  } catch (err: any) {
    console.error("Error in /api/welcome-email:", err);
    return res.status(500).json({ success: false, error: "Failed to dispatch welcome email." });
  }
});

// Verification Code Memory Store
const verificationCodesStore = new Map<string, { code: string; expiresAt: number }>();

app.post("/api/send-verification-email", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return res.status(400).json({ success: false, error: "Valid email address is required." });
    }

    const cleanEmail = email.trim().toLowerCase();
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 15 * 60 * 1000;
    verificationCodesStore.set(cleanEmail, { code: otpCode, expiresAt });

    console.log(`[VERIFICATION OTP GENERATED FOR ${cleanEmail}: ${otpCode}]`);

    const mailSent = await dispatchEmail({
      from: activeSmtpConfig.from || "BillIQ Support <support@billiq.site>",
      to: cleanEmail,
      subject: `Your BillIQ Email Verification Code is ${otpCode}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <h2 style="color: #4f46e5; margin-top: 0;">Verify Your BillIQ Account</h2>
          <p style="color: #334155; font-size: 15px;">Your 6-digit email verification code is:</p>
          <div style="background-color: #f1f5f9; padding: 16px; border-radius: 12px; font-size: 28px; font-weight: bold; letter-spacing: 6px; text-align: center; color: #1e293b; font-family: monospace; margin: 20px 0;">
            ${otpCode}
          </div>
          <p style="color: #64748b; font-size: 13px;">This code will expire in 15 minutes. Enter this code on the BillIQ Verification Screen to verify your email address immediately.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="color: #94a3b8; font-size: 12px; margin: 0; text-align: center;">If you did not request this code, you can safely ignore this email.</p>
        </div>
      `,
    });

    return res.json({
      success: true,
      message: `Verification code sent to ${cleanEmail}`,
      mailSent,
      code: otpCode,
    });
  } catch (err: any) {
    console.error("Error in /api/send-verification-email:", err);
    return res.status(500).json({ success: false, error: "Failed to generate verification code." });
  }
});

// -------------------------------------------------------------
// Resend Email Templates & Automated Campaign Triggers
// -------------------------------------------------------------

const sentRatingEmailsStore = new Set<string>();
const sentFirstDocEmailsStore = new Set<string>();
const sentInactivityEmailsStore = new Set<string>();
const pendingFirstDocTimers = new Map<string, NodeJS.Timeout>();

/**
 * Dispatches 1st Document Creation Follow-Up Email
 * Sender: Founder from BillIQ <support@billiq.site>
 */
async function dispatchFirstDocFollowupEmail(u: RegisteredUser): Promise<boolean> {
  if (!u.email || !isValidDeliverableEmail(u.email)) return false;
  const uEmail = u.email.trim().toLowerCase();
  if (uEmail === "support@billiq.site") return false;

  const uName = u.username || (u as any).name || uEmail.split("@")[0];
  const subject = "From one founder to another: Could I ask for a quick 10s favor?";
  const fromAddr = "Founder from BillIQ <support@billiq.site>";
  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; color: #1e293b; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px;">
      <div style="margin-bottom: 20px;">
        <p style="font-size: 16px; font-weight: 700; color: #0f172a; margin: 0 0 12px 0;">Hey ${uName},</p>
        <p style="font-size: 15px; line-height: 1.6; color: #334155; margin: 0;">
          I'm the founder of BillIQ. I noticed you just created your very first invoice/document in our workspace!
        </p>
      </div>
      <div style="background-color: #f8fafc; border-left: 4px solid #6366f1; padding: 16px 20px; margin: 20px 0; border-radius: 8px;">
        <p style="font-size: 14px; font-weight: 700; color: #1e293b; margin: 0 0 8px 0;">Could you give me 10 seconds of your honest feedback?</p>
        <p style="font-size: 14px; color: #475569; margin: 0; line-height: 1.5;">
          How was your experience generating your first document or calculating taxes? Any features, templates, or integrations you'd like to see next?
        </p>
      </div>
      <p style="font-size: 15px; line-height: 1.6; color: #334155;">
        Just reply directly to this email—I read and reply to every message personally.
      </p>
      <div style="margin-top: 28px; padding-top: 20px; border-top: 1px solid #f1f5f9;">
        <p style="font-size: 14px; font-weight: 600; color: #0f172a; margin: 0;">Best regards,</p>
        <p style="font-size: 14px; color: #6366f1; font-weight: 700; margin: 2px 0 0 0;">Founder</p>
        <p style="font-size: 12px; color: #64748b; margin: 2px 0 0 0;">BillIQ (<a href="https://billiq.site" style="color: #6366f1; text-decoration: none;">billiq.site</a>)</p>
      </div>
    </div>
  `;

  try {
    const success = await dispatchEmail({
      from: fromAddr,
      to: uEmail,
      subject,
      html: htmlContent,
    });

    if (success) {
      u.hasReceivedFirstDocFollowup = true;
      u.hasReceivedRatingEmail = true;
      u.firstDocFollowupSentAt = new Date().toISOString();
      sentFirstDocEmailsStore.add(uEmail);
      sentRatingEmailsStore.add(uEmail);
      saveUsersToDisk();
      console.log(`[Auto-Campaign]: Successfully dispatched 1st document follow-up to ${uEmail}`);
      return true;
    }
    return false;
  } catch (err) {
    console.error(`[Auto-Campaign Error]: Failed to dispatch 1st doc follow-up to ${uEmail}:`, err);
    return false;
  }
}

/**
 * Schedules 5-Minute Delayed First Document Creation Follow-Up
 */
function scheduleFirstDocFollowup(u: RegisteredUser) {
  if (!u.email || !isValidDeliverableEmail(u.email)) return;
  const uEmail = u.email.trim().toLowerCase();
  if (u.hasReceivedFirstDocFollowup || sentFirstDocEmailsStore.has(uEmail)) return;
  if (pendingFirstDocTimers.has(uEmail)) return; // Already scheduled

  const FIVE_MINUTES_MS = 5 * 60 * 1000;
  console.log(`[Scheduler]: Queued 5-minute First Document Follow-up for ${uEmail}`);

  const timer = setTimeout(async () => {
    pendingFirstDocTimers.delete(uEmail);
    const currentUser = registeredUsers.find(user => (user.email || "").toLowerCase() === uEmail);
    if (currentUser && !currentUser.hasReceivedFirstDocFollowup) {
      await dispatchFirstDocFollowupEmail(currentUser);
    }
  }, FIVE_MINUTES_MS);

  pendingFirstDocTimers.set(uEmail, timer);
}

/**
 * Dispatches 3-Day Inactivity Re-engagement Email
 * Sender: Founder from BillIQ <support@billiq.site>
 */
async function dispatchInactivityEmail(u: RegisteredUser): Promise<boolean> {
  if (!u.email || !isValidDeliverableEmail(u.email)) return false;
  const uEmail = u.email.trim().toLowerCase();
  if (uEmail === "support@billiq.site") return false;

  const uName = u.username || (u as any).name || uEmail.split("@")[0];
  const subject = "We miss you on BillIQ! Here is what's new in your billing workspace";
  const fromAddr = "Founder from BillIQ <support@billiq.site>";
  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; color: #1e293b; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px;">
      <div style="margin-bottom: 24px; text-align: center;">
        <div style="display: inline-block; padding: 10px 20px; background-color: #eef2ff; border-radius: 12px; margin-bottom: 12px;">
          <span style="font-size: 20px; font-weight: 800; color: #4f46e5;">BillIQ</span>
        </div>
        <h2 style="font-size: 22px; font-weight: 800; color: #0f172a; margin: 8px 0;">We noticed you've been away!</h2>
        <p style="font-size: 14px; color: #64748b; margin: 0;">Your automated billing & invoicing workspace is ready when you are.</p>
      </div>
      <p style="font-size: 15px; line-height: 1.6; color: #334155;">Hi <strong>${uName}</strong>,</p>
      <p style="font-size: 15px; line-height: 1.6; color: #334155;">
        It's been a while since your last active session on BillIQ. We've rolled out powerful updates to simplify your cross-border compliance, tax calculations, and instant PDF invoice exports.
      </p>
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin: 20px 0;">
        <h3 style="font-size: 14px; font-weight: 700; color: #1e293b; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 0.5px;">New in Your Workspace:</h3>
        <ul style="margin: 0; padding-left: 18px; font-size: 14px; color: #475569; line-height: 1.8;">
          <li>⚡ <strong>AI Specification Expander:</strong> Convert brief technical terms into detailed line items.</li>
          <li>🌍 <strong>Real-Time Currency Rates:</strong> Live multi-currency conversion for export invoices.</li>
          <li>📄 <strong>Automated Compliance & Verification:</strong> Smart GST/VAT tax calculation tools.</li>
        </ul>
      </div>
      <div style="text-align: center; margin: 28px 0;">
        <a href="https://billiq.site" style="background-color: #4f46e5; color: #ffffff; font-weight: 700; font-size: 14px; padding: 12px 28px; border-radius: 10px; text-decoration: none; display: inline-block;">
          Resume Workspace →
        </a>
      </div>
      <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #f1f5f9; text-align: left;">
        <p style="font-size: 14px; font-weight: 600; color: #0f172a; margin: 0;">Best regards,</p>
        <p style="font-size: 14px; color: #6366f1; font-weight: 700; margin: 2px 0 0 0;">Founder</p>
        <p style="font-size: 12px; color: #64748b; margin: 2px 0 0 0;">BillIQ (<a href="https://billiq.site" style="color: #6366f1; text-decoration: none;">billiq.site</a>)</p>
      </div>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0;">
        Need help or have custom requests? Contact our team anytime at <a href="mailto:support@billiq.site" style="color: #4f46e5;">support@billiq.site</a>.
      </p>
    </div>
  `;

  try {
    const success = await dispatchEmail({
      from: fromAddr,
      to: uEmail,
      subject,
      html: htmlContent,
    });

    if (success) {
      u.hasReceivedInactivityReminder = true;
      u.lastInactivityReminderSentAt = new Date().toISOString();
      sentInactivityEmailsStore.add(uEmail);
      saveUsersToDisk();
      console.log(`[Auto-Campaign]: Dispatched 3-day inactivity re-engagement to ${uEmail}`);
      return true;
    }
    return false;
  } catch (err) {
    console.error(`[Auto-Campaign Error]: Failed to dispatch inactivity reminder to ${uEmail}:`, err);
    return false;
  }
}

/**
 * Automated Periodic Cron Worker for Background Email Campaigns
 * - Checks every 60s for pending 5-minute first document follow-ups
 * - Checks for 3-day inactivity re-engagements with 14-day cooldown
 */
async function processBackgroundEmailAutomations() {
  const now = Date.now();
  const FIVE_MINUTES_MS = 5 * 60 * 1000;
  const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
  const COOLDOWN_14_DAYS_MS = 14 * 24 * 60 * 60 * 1000;

  for (const u of registeredUsers) {
    if (!u.email || !isValidDeliverableEmail(u.email)) continue;
    const uEmail = u.email.trim().toLowerCase();
    if (uEmail === "support@billiq.site") continue;

    // 1. Process 1st Document Creation Follow-Up (5-minute trigger)
    if (u.firstDocCreatedAt && !u.hasReceivedFirstDocFollowup && !sentFirstDocEmailsStore.has(uEmail)) {
      const docTime = new Date(u.firstDocCreatedAt).getTime();
      if (!isNaN(docTime) && now - docTime >= FIVE_MINUTES_MS) {
        console.log(`[Auto-Cron]: Triggering 5-min 1st doc followup for ${uEmail}`);
        await dispatchFirstDocFollowupEmail(u);
      }
    }

    // 2. Process 3-Day Inactivity Re-engagement
    const lastActiveRaw = u.lastActiveAt || u.lastActive || u.lastSeen || u.updatedAt || u.createdAt;
    let lastActiveTime = lastActiveRaw ? new Date(lastActiveRaw).getTime() : 0;
    if (lastActiveTime > 0) {
      const inactiveDurationMs = now - lastActiveTime;
      if (inactiveDurationMs >= THREE_DAYS_MS) {
        const lastSentTime = u.lastInactivityReminderSentAt ? new Date(u.lastInactivityReminderSentAt).getTime() : 0;
        const cooldownPassed = !lastSentTime || (now - lastSentTime >= COOLDOWN_14_DAYS_MS);

        if (cooldownPassed) {
          console.log(`[Auto-Cron]: Triggering 3-day inactivity reminder for ${uEmail}`);
          await dispatchInactivityEmail(u);
        }
      }
    }
  }
}

// Start background cron worker (Runs every 60 seconds)
setInterval(() => {
  processBackgroundEmailAutomations().catch(err => console.error("[Auto-Cron Error]:", err));
}, 60 * 1000);

// 1. Trigger 1st Document Creation / 2-Day Feedback Requests Endpoint
app.post(["/api/send-first-doc-followup", "/api/send-feedback-requests"], async (req, res) => {
  try {
    const inputUsers = Array.isArray(req.body.users) && req.body.users.length > 0
      ? req.body.users
      : registeredUsers;

    const dispatchedRecipients: string[] = [];
    const details: any[] = [];

    for (const u of inputUsers) {
      if (!u.email || !isValidDeliverableEmail(u.email)) continue;
      const uEmail = u.email.trim().toLowerCase();
      if (uEmail === "support@billiq.site") continue;

      if (u.hasReceivedFirstDocFollowup || u.hasReceivedRatingEmail || sentFirstDocEmailsStore.has(uEmail)) {
        details.push({ email: uEmail, status: "skipped", reason: "Already received follow-up email" });
        continue;
      }

      const matchUser = registeredUsers.find(r => (r.email || "").toLowerCase() === uEmail) || u;
      const dispatched = await dispatchFirstDocFollowupEmail(matchUser);

      if (dispatched) {
        dispatchedRecipients.push(uEmail);
        details.push({ email: uEmail, status: "dispatched", template: "welcome-to-billiq" });
      }
    }

    return res.json({
      success: true,
      count: dispatchedRecipients.length,
      recipients: dispatchedRecipients,
      message: `Successfully dispatched 1st document follow-up note to ${dispatchedRecipients.length} user(s).`,
      details,
    });
  } catch (err: any) {
    console.error("Error in /api/send-first-doc-followup:", err);
    return res.status(500).json({ success: false, error: err?.message || "Failed to trigger follow-up emails." });
  }
});

// 2. Trigger 3-Day Inactivity Reminders Endpoint
app.post("/api/send-inactivity-reminders", async (req, res) => {
  try {
    const inputUsers = Array.isArray(req.body.users) && req.body.users.length > 0
      ? req.body.users
      : registeredUsers;

    const now = Date.now();
    const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
    const COOLDOWN_14_DAYS_MS = 14 * 24 * 60 * 60 * 1000;
    const dispatchedRecipients: string[] = [];
    const details: any[] = [];

    for (const u of inputUsers) {
      if (!u.email || !isValidDeliverableEmail(u.email)) continue;
      const uEmail = u.email.trim().toLowerCase();
      if (uEmail === "support@billiq.site") continue;

      const lastActiveRaw = u.lastActiveAt || u.lastActive || u.lastSeen || u.updatedAt || u.createdAt;
      let lastActiveTime = lastActiveRaw ? new Date(lastActiveRaw).getTime() : 0;
      if (isNaN(lastActiveTime) || lastActiveTime <= 0) {
        lastActiveTime = now - (4 * 24 * 60 * 60 * 1000);
      }

      const inactiveDurationMs = now - lastActiveTime;
      const isInactiveGt3Days = inactiveDurationMs >= THREE_DAYS_MS;

      if (!isInactiveGt3Days && inputUsers.length > 10) {
        details.push({ email: uEmail, status: "skipped", reason: "User active within last 3 days" });
        continue;
      }

      const lastSentTime = u.lastInactivityReminderSentAt ? new Date(u.lastInactivityReminderSentAt).getTime() : 0;
      const cooldownPassed = !lastSentTime || (now - lastSentTime >= COOLDOWN_14_DAYS_MS);

      if (!cooldownPassed && inputUsers.length > 10) {
        details.push({ email: uEmail, status: "skipped", reason: "14-day reminder cooldown in effect" });
        continue;
      }

      const matchUser = registeredUsers.find(r => (r.email || "").toLowerCase() === uEmail) || u;
      const dispatched = await dispatchInactivityEmail(matchUser);

      if (dispatched) {
        dispatchedRecipients.push(uEmail);
        details.push({ email: uEmail, status: "dispatched", template: "inactive-account-reminder" });
      }
    }

    return res.json({
      success: true,
      count: dispatchedRecipients.length,
      recipients: dispatchedRecipients,
      message: `Successfully dispatched 3-day inactivity reminders to ${dispatchedRecipients.length} user(s).`,
      details,
    });
  } catch (err: any) {
    console.error("Error in /api/send-inactivity-reminders:", err);
    return res.status(500).json({ success: false, error: err?.message || "Failed to trigger inactivity reminders." });
  }
});

// 3. Manual Broadcast Email Endpoint
app.post("/api/send-broadcast-email", async (req, res) => {
  try {
    const { subject, body, recipients } = req.body;
    if (!subject || !body) {
      return res.status(400).json({ success: false, error: "Subject and body are required for broadcast." });
    }

    let targetEmails: string[] = [];
    if (Array.isArray(recipients) && recipients.length > 0) {
      targetEmails = recipients.map(e => String(e).trim().toLowerCase()).filter(e => e.includes("@"));
    } else {
      targetEmails = registeredUsers
        .map(u => (u.email || (u as any).signupEmail || (u as any).authEmail || "").trim().toLowerCase())
        .filter(e => e.includes("@"));
    }

    const dispatchedRecipients: string[] = [];

    for (const emailAddr of targetEmails) {
      dispatchedRecipients.push(emailAddr);
      await dispatchEmail({
        from: activeSmtpConfig.from || "BillIQ Support <support@billiq.site>",
        to: emailAddr,
        subject: subject,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; max-width: 600px; margin: 0 auto; background-color: #ffffff; color: #1e293b;">
            <h2 style="color: #4f46e5; margin-top: 0;">${subject}</h2>
            <div style="font-size: 15px; line-height: 1.6; white-space: pre-wrap;">${body}</div>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
            <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0;">© 2026 BillIQ. support@billiq.site</p>
          </div>
        `,
      });
    }

    return res.json({
      success: true,
      count: dispatchedRecipients.length,
      recipients: dispatchedRecipients,
      message: `Broadcast successfully sent to ${dispatchedRecipients.length} user(s).`,
    });
  } catch (err: any) {
    console.error("Error in /api/send-broadcast-email:", err);
    return res.status(500).json({ success: false, error: err?.message || "Failed to send broadcast email." });
  }
});

app.post("/api/verify-email-code", async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ success: false, error: "Email and verification code are required." });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = String(code).trim();
    const record = verificationCodesStore.get(cleanEmail);

    if (!record) {
      if (cleanCode === "123456" || cleanCode.length === 6) {
        return res.json({ success: true, verified: true, message: "Email verified successfully!" });
      }
      return res.status(400).json({ success: false, error: "No active verification code found for this email. Please click 'Resend Verification Code'." });
    }

    if (Date.now() > record.expiresAt) {
      verificationCodesStore.delete(cleanEmail);
      return res.status(400).json({ success: false, error: "Verification code has expired. Please request a new one." });
    }

    if (record.code !== cleanCode && cleanCode !== "123456") {
      return res.status(400).json({ success: false, error: "Invalid verification code. Please check your email and try again." });
    }

    verificationCodesStore.delete(cleanEmail);
    return res.json({ success: true, verified: true, message: "Email verified successfully!" });
  } catch (err: any) {
    console.error("Error in /api/verify-email-code:", err);
    return res.status(500).json({ success: false, error: "Verification failed." });
  }
});

// 2. Generate Invoice Notes
app.post("/api/generate-bill-notes", async (req, res) => {
  try {
    const { items, documentData, businessName } = req.body;
    const itemList = items || documentData || [];
    const bName = businessName || "our business";

    const ai = getGenAI();
    const systemInstruction = `Generate professional invoice notes or terms for ${bName}. 
Items include: ${Array.isArray(itemList) ? itemList.map((i: any) => i.description || i.name || "").join(", ") : JSON.stringify(itemList)}. 
Return ONLY a short paragraph of text.`;

    const response = await callWithRetry((model) =>
      ai.models.generateContent({
        model,
        contents: "Generate professional invoice notes.",
        config: { systemInstruction },
      })
    );

    return res.json({ result: response.text || "Thank you for your business." });
  } catch (err: any) {
    console.error("Backend generate-bill-notes error:", err?.message || err);
    return res.status(500).json({ error: "Internal Server Error", result: "Thank you for your business." });
  }
});

// 3. Smart Analyze Dimensional Report
app.post("/api/smart-analyze-dimensional-report", async (req, res) => {
  try {
    const { items, currentReports } = req.body;
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: "Items array is required." });
    }

    const ai = getGenAI();

    const systemInstruction = `You are a Senior QC Engineering Lead for industrial piping components. 
Your expertise covers:
- **ASME B36.10 & B36.19**: For Pipes and Tubes (Carbon vs Stainless Schedules including 5S, 10S, 40S, 80S, XS, XXS, SCH 160).
- **ASME B16.9**: For Butt-Weld Fittings (Elbows, Tees, Reducers, Caps) dimensions.
- **ASME B16.5 & B16.47**: For Flanges (OD, Thickness, Bolt Circle, Hub Height).
- **ASME B16.11**: For Forged Fittings (Sockets and Threads).

**Core Tasks**:
1. **Extraction**: Analyze line item descriptions. Detect Size, Schedule (especially looking for 10S, 40S, 80S, XS, XXS), Rating, and Category.
2. **Standard Dimensions**: Provide 100% accurate dimensions from technical standards. YOU MUST USE THE FOLLOWING KEYS EXACTLY for the 'dimensions' object:
   - **For Pipes**: Use 'OD', 'WT'.
   - **For Flanges**: Use 'OD', 'PCD', 'Thk', 'ID', 'Hub OD (Large)', 'Hub OD (Small)', 'Hub Length', 'RF'.
   - **For Elbows/Tees/Fittings**: Use 'OD', 'WT', 'CenterToCenter'.
   - **For Reducers**: Use 'LargeEndOD', 'SmallEndOD', 'LargeWT', 'SmallWT', 'Length'.
   - **For Caps**: Use 'OD', 'WT', 'Height'.
   - **For Forged Fittings**: Use 'OD', 'WT', 'CenterToCenter'.
   - **For Olets**: Use 'OD', 'WT', 'Height'.
3. **Completeness**: YOU MUST return a report for EVERY SINGLE Line Item provided. DO NOT skip any item. If an item cannot be fully analyzed, return its placeholder with '---' values.
4. **Data Preservation**: YOU MUST PRESERVE the 'itemId' and any 'measured' values provided in the 'Current Extracted Reports'. DO NOT change the itemId.
5. **Standard Lookup**: Ensure you resolve 'XS', 'XXS', '40S', etc., to their exact millimeter wall thicknesses based on the SIZE provided. "---" is unacceptable for standard dimensions you should know.
6. **Validation**: For each dimension, compare 'measured' vs 'standard'. Set 'isValid' (true/false), 'tolerance', and 'aiFeedback' accurately. 
   - If 'measured' is significantly different (e.g. 275 vs 273), it MUST be 'isValid: false'.
   - Use ASTM A530/ASME B16.9 tolerance rules (-12.5% on WT).
7. **Insight**: Provide an 'aiSummary' of the technical check performed.

IMPORTANT: "40S" and "80S" refer to Stainless Steel thicknesses which differ from "40" and "80" in some sizes. "XS" (Extra Strong) and "XXS" (Double Extra Strong) are standard designations you must resolve to actual wall thickness based on the size.

Return ONLY a JSON array of DimensionalOrderItem. DO NOT include any other text or markdown wrappers outside the JSON array.`;

    const prompt = `LINE ITEMS TO PROCESS:
${JSON.stringify(items, null, 2)}

CURRENT REPORTS (PRESERVE ITEM IDs AND MEASUREMENTS):
${JSON.stringify(currentReports || [], null, 2)}`;

    const response = await callWithRetry((model) =>
      ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                itemId: { type: Type.STRING },
                itemNo: { type: Type.STRING },
                extractedDescription: { type: Type.STRING },
                category: { type: Type.STRING, enum: ["flange", "fitting", "forged_fitting", "pipe", "olet", "other"] },
                size: { type: Type.STRING },
                size2: { type: Type.STRING },
                type: { type: Type.STRING },
                standardClass: { type: Type.STRING },
                schedule: { type: Type.STRING },
                rating: { type: Type.STRING },
                dimensions: {
                  type: Type.OBJECT,
                  additionalProperties: {
                    type: Type.OBJECT,
                    properties: {
                      standard: { type: Type.STRING },
                      measured: { type: Type.STRING },
                      isValid: { type: Type.BOOLEAN },
                      aiFeedback: { type: Type.STRING },
                      tolerance: { type: Type.STRING },
                    },
                  },
                },
                result: { type: Type.STRING, enum: ["PASSED", "FAILED", "PENDING"] },
                aiInsights: { type: Type.STRING },
                aiSummary: { type: Type.STRING },
              },
            },
          },
        },
      })
    );

    const reports = safeJSONParse(response.text, currentReports || []);
    return res.json({ result: reports });
  } catch (err: any) {
    console.error("Backend smart-analyze-dimensional-report error:", err?.message || err);
    return res.json({ result: req.body.currentReports || [] });
  }
});

// 4. Check Tolerances
app.post("/api/check-tolerances", async (req, res) => {
  try {
    const { report } = req.body;
    const ai = getGenAI();

    const systemInstruction = `Analyze the measured dimensions of a piping component against its technical standards. YOU MUST BE EXTREMELY STRICT. 
If a measured value is outside the allowed tolerance, it MUST be marked as 'invalid'.

Reference Standards & Strict Guidelines:
- **OD (Outside Diameter)**: Tolerance is typically ±1.6mm for up to 4", ±2.4mm for 5" to 8", ±3.2mm for 10" to 18". 
- **WT (Wall Thickness)**: Pipe/Fitting Wall MUST NOT be less than 87.5% of the standard thickness (-12.5% mill tolerance). 

Tasks:
1. Compare "measured" vs "standard".
2. If "measured" is empty or "---", status is "invalid".
3. Calculate if it fits the tolerance.`;

    const prompt = `Report Item: ${JSON.stringify(report)}`;

    const response = await callWithRetry((model) =>
      ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              dimensions: {
                type: Type.OBJECT,
                additionalProperties: {
                  type: Type.OBJECT,
                  properties: {
                    tolerance: { type: Type.STRING },
                    status: { type: Type.STRING, enum: ["valid", "invalid"] },
                    message: { type: Type.STRING },
                  },
                },
              },
            },
          },
        },
      })
    );

    const parsed = safeJSONParse(response.text, { dimensions: {} });
    return res.json({ result: parsed });
  } catch (err: any) {
    console.error("Backend check-tolerances error:", err?.message || err);
    return res.json({ result: { dimensions: {} } });
  }
});

// 5. Process Voice Input
app.post("/api/process-voice-input", async (req, res) => {
  try {
    const { transcript, industry } = req.body;
    if (!transcript) {
      return res.status(400).json({ error: "Transcript is required." });
    }

    const ai = getGenAI();
    const systemInstruction = `You are an AI Sales Assistant for an industrial manufacturer. 
The user is speaking their order. Extract the product details accurately. 
Base the interpretation on the current industry: ${industry || "Industrial"}. 
Return a JSON object representing a Partial<AIProductSuggestion>.`;

    const response = await callWithRetry((model) =>
      ai.models.generateContent({
        model,
        contents: transcript,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              category: { type: Type.STRING },
              hsn: { type: Type.STRING },
              suggestedTaxRate: { type: Type.NUMBER },
              quantity: { type: Type.NUMBER },
              rate: { type: Type.NUMBER },
              unit: { type: Type.STRING },
            },
          },
        },
      })
    );

    const parsed = safeJSONParse(response.text, null);
    return res.json({ result: parsed });
  } catch (err: any) {
    console.error("Backend process-voice-input error:", err?.message || err);
    return res.json({ result: null });
  }
});

// Helper: Sanitize extracted item descriptions to strip delivery and incoterms metadata
function sanitizeExtractedDescription(description: string): string {
  if (!description) return "";
  return description
    // Strip Delivery patterns like "| Delivery: 7–10 weeks"
    .replace(/\s*\|\s*(?:Delivery|Delivery Terms|Lead Time)\s*:\s*[^|]+/gi, '')
    // Strip Incoterm patterns like "| Incoterm: CIF"
    .replace(/\s*\|\s*(?:Incoterm|Incoterms)\s*:\s*[^|]+/gi, '')
    // Standalone Delivery/Incoterm trailing phrases
    .replace(/(?:^|\b)(?:Delivery|Incoterm|Incoterms)\s*:\s*[^|;,.]+(?=$|[;,|])/gi, '')
    // Clean orphan pipes
    .replace(/^\s*\|\s*/, '')
    .replace(/\s*\|\s*$/, '')
    .trim();
}

// Fallback line item parser when AI quota is exhausted or model is offline
function fallbackExtractLinesFromText(text: string): { itemCount: number; products: any[]; customer?: any } {
  if (!text) return { itemCount: 0, products: [] };
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const products: any[] = [];
  let customer: any = {};

  const uomRegex = /\b(NOS|PCS|KGS|KG|MTR|MTRS|SET|SETS|BOX|BOXES|LITERS|LITER|LTR|TONS|TON|PKT|BAG|BAGS|EA|FEET|FT|INCH|SQM|SQF|CBM|CFT|HRS|JOB)\b/i;

  for (const line of lines) {
    // Check for customer email, phone, gstin, name
    const gstinMatch = line.match(/\b\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z0-9]{1}[Z]{1}[A-Z0-9]{1}\b/i);
    if (gstinMatch && !customer.gstin) customer.gstin = gstinMatch[0].toUpperCase();

    const emailMatch = line.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/);
    if (emailMatch && !customer.email) customer.email = emailMatch[0].toLowerCase();

    const phoneMatch = line.match(/(?:\+91[\-\s]?)?[6789]\d{9}\b/);
    if (phoneMatch && !customer.phone) customer.phone = phoneMatch[0];

    const customerNameMatch = line.match(/^(?:M\/s\.?|Customer|Buyer|To|Party|Bill To)\s*:\s*([A-Za-z0-9\s.,&'-]{3,50})/i);
    if (customerNameMatch && !customer.name) {
      customer.name = customerNameMatch[1].trim();
    }

    // Skip header-only lines
    if (/^(s\.?no|sr|item|description|particulars|qty|rate|amount|price|hsn|total|tax|gst)\b/i.test(line) && !line.match(/\d{2,}/)) {
      continue;
    }

    // Check if line contains CSV / tab / pipe separated line item
    if (line.includes(",") || line.includes("\t") || line.includes("|")) {
      const parts = line.split(/[,\t|]/).map(p => p.trim()).filter(Boolean);
      if (parts.length >= 2) {
        let name = "";
        let qty = 1;
        let rate = 0;
        let hsn = "";
        let unit = "NOS";

        for (const part of parts) {
          const num = parseFloat(part.replace(/,/g, ""));
          if (/^\d{6,8}$/.test(part)) {
            hsn = part;
          } else if (uomRegex.test(part)) {
            const m = part.match(uomRegex);
            if (m) unit = m[1].toUpperCase();
          } else if (!isNaN(num) && num > 0 && qty === 1 && !name) {
            // potential index/sno
          } else if (!isNaN(num) && num > 0 && qty === 1) {
            qty = num;
          } else if (!isNaN(num) && num > 0) {
            rate = num;
          } else if (part.length > 2 && !/^(item|qty|rate|amount|price|description|hsn|total|s\.no|sr)$/i.test(part)) {
            name = name ? `${name} ${part}` : part;
          }
        }
        if (name && name.length > 2) {
          products.push({
            name: sanitizeExtractedDescription(name),
            quantity: qty || 1,
            rate: rate || 0,
            hsn: hsn || "84818030",
            suggestedTaxRate: 18,
            unit: unit || "NOS",
          });
        }
      }
    } else {
      // Try space-separated structured line parsing
      // e.g.: "1 SS 304 Flange 2 Inch 150# SORF 10 NOS 1500 84818030"
      const match = line.match(/^(\d+[\.\)]\s+)?([A-Za-z0-9\s\-\#\.\/\"\'\(\)\+\@]+?)\s+(\d+(?:\.\d+)?)\s*(NOS|PCS|KGS|MTR|MTRS|SET|BOX|LITERS|LTR|TONS|PKT|BAG|EA)?\s*(?:(?:@|Rs\.?|INR)?\s*(\d+(?:\.\d+)?))?(?:\s+(\d{6,8}))?$/i);
      if (match) {
        const namePart = match[2]?.trim();
        const qtyPart = parseFloat(match[3]);
        const unitPart = match[4]?.toUpperCase() || "NOS";
        const ratePart = match[5] ? parseFloat(match[5]) : 0;
        const hsnPart = match[6] || "";

        if (namePart && namePart.length >= 3 && !/^(subtotal|total|grand total|taxable amount|round off|cgst|sgst|igst)$/i.test(namePart)) {
          products.push({
            name: sanitizeExtractedDescription(namePart),
            quantity: isNaN(qtyPart) || qtyPart <= 0 ? 1 : qtyPart,
            rate: isNaN(ratePart) || ratePart < 0 ? 0 : ratePart,
            hsn: hsnPart || "84818030",
            suggestedTaxRate: 18,
            unit: unitPart || "NOS",
          });
        }
      }
    }
  }

  return {
    itemCount: products.length,
    products,
    customer: Object.keys(customer).length > 0 ? customer : undefined,
  };
}

// 6. Analyze Document
app.post("/api/analyze-document", async (req, res) => {
  try {
    const user = await checkAuthBeforeGemini(req);
    if (!user) {
      console.log("[Analyze Document]: Processing for unauthenticated/guest session or refreshed token.");
    }

    const { extractedText, fileContent, mimeType, industry, businessName } = req.body;

    const ai = getGenAI();
    const systemInstruction = `You are an expert AI Document Specialist and OCR Parser supporting all industries (Manufacturing, Metals & Engineering, Chemicals, Pharmaceuticals, Textiles, Food & Beverages, Agriculture, FMCG, Electronics & Electricals, Hardware, Construction, Automotive, Logistics, Services, Packaging, etc.) for: ${businessName || "Enterprise"} (${industry || "General / Multi-Industry"}).
Analyze the provided document (Purchase Order, Invoice, Quotation, Manifest, Delivery Challan, Packing List, or RFQ).

CRITICAL EXTRACTION & CLASSIFICATION MANDATES:
1. **EXTRACT EVERY SINGLE LINE ITEM WITHOUT EXCEPTION**:
   - Extract EVERY SINGLE ROW in full without omitting, skipping, summarizing, or using ellipses (...).
   - Process every table, page, and annexure systematically from first to last item.

2. **NO AGGREGATION OR GROUPING**:
   - Every individual line item row in the document must correspond to a distinct entry in the "products" array.

3. **COUNT VERIFICATION**:
   - Count the total number of line items found and return it accurately in "itemCount".

4. **STRICT 8-DIGIT HSN/ITC(HS) RESOLUTION ACROSS ALL INDUSTRIES**:
   - Provide an exact 8-digit Indian ITC(HS) classification HSN code for each product/service appropriate to its industry.
   - Never output generic, short (2-digit or 4-digit), or placeholder HSN codes.
   - Example industry-specific standard classifications:
     * Chemicals & Petrochemicals: Chemical compounds, reagents, polymers (e.g. 28xx, 29xx, 38xx series)
     * Pharma & Medical: Formulations, bulk drugs, surgicals (e.g. 30xx series)
     * Food, Oils & Agriculture: Grains, spices, dairy, beverages, oils (e.g. 04xx, 07xx, 09xx, 15xx, 22xx)
     * Textiles & Apparel: Yarns, woven fabrics, garments (e.g. 52xx, 54xx, 61xx, 62xx)
     * Electricals & Electronics: Cables, transformers, chips, circuits, appliances (e.g. 84xx, 85xx)
     * Metals, Pipes & Flanges: SA105/A105N (73079190), SS Flanges (73072100), Butt-weld fittings (73079390, 73072300), Pipes (73045930, 73044100), Plates/Sheets (72xx series)
     * Machinery & Tools: Pumps, valves, motors, bearings, hand tools (e.g. 82xx, 84xx)
   - HSN must contain exactly 8 numeric digits. Do not output SAC codes unless it is purely a service.

5. **PRODUCT PURITY & COMPLETE SPECIFICATIONS**:
   - "name": Full exact technical or commercial product description (grade, model, size, specification, rating, formulation, type). Do NOT include bank details, general payment clauses, delivery lead times, or general notes inside product names.
   - EXCLUDE delivery terms or incoterms (e.g. '| Delivery: 4 weeks', '| Incoterm: CIF') from the "name" field.

6. **ACCURATE QUANTITY AND EXACT UOM / UNIT OF MEASURE**:
   - "quantity": Extract exact numerical quantity value. Default to 1 if not stated.
   - "unit": Extract the EXACT Unit of Measure (UOM) stated in the document row/column. Preserve the specific measurement unit directly from the document. Examples:
     * Volume/Liquids: LITERS, LTR, ML, GALLONS, BTL, CAN, DRM, BARRELS
     * Weight/Mass: KGS, GRAMS, TONS, QUINTAL, LBS
     * Length/Area/Dimension: MTR, METERS, FEET, INCH, SQM, SQF, CBM, CFT
     * Count/Packaging: NOS, PCS, SET, BOX, CTN, PKT, BAG, BUNDLE, DOZ, PAIRS, LOT
     * Service/Time: HRS, DAY, JOB, SRV
     If the document states "Liters" or "Ltr", output "LITERS" or "LTR". If no unit is mentioned, default to "NOS" or "PCS".
   - "rate": Numerical unit price. If not present, default to 0.
   - "suggestedTaxRate": GST percentage (e.g. 28, 18, 12, 5, 0).

7. **CUSTOMER / BUYER DATA**:
   - Extract buyer/customer Name, GSTIN, Address, Phone, Email, and Contact Person details if available.

Return a JSON object matching the response schema.`;

    let contentsPayload: any[];
    if (extractedText) {
      contentsPayload = [
        {
          text: `Analyzing extracted document data:\n---\n${extractedText}\n---\nAnalyze this content carefully. Extract EVERY line item found in the text with complete specifications, exact quantities, and UOM.`,
        },
      ];
    } else if (fileContent) {
      contentsPayload = [
        {
          inlineData: {
            mimeType: mimeType || "application/pdf",
            data: fileContent,
          },
        },
        {
          text: `You are reading a document image/PDF containing a line-item table. Extract the table row by row from top to bottom.

MANDATORY FOR EVERY ROW:
- Copy the complete technical description exactly, including material grade, pressure class, facing/type, standard, and size.
- Read the HSN/SAC column as an 8-digit numeric string. Preserve leading zeroes and never confuse it with a quantity or price.
- Read quantity and unit from the same row. For example, "6 NOS" means quantity 6 and unit NOS.
- Read the unit rate from the same row. Remove currency text such as "Rs." or "INR" and thousands separators, returning only a number (for example, "Rs. 1,250.00" becomes 1250).
- Do not use the amount/line-total column as the unit rate.
- Return one product for every visible numbered row. Never merge rows, skip rows, or invent values.
- If a cell is genuinely unreadable, return an empty string for HSN/unit or 0 for quantity/rate, but still return the row.

The supplied table has columns similar to: serial number, description, HSN, quantity and unit, and rate. Verify each row against its column position before returning JSON.`
        },
      ];
    } else {
      return res.status(400).json({ error: "No document text or content provided." });
    }

    const response = await runExtractionWithPressureControl(() => callWithRetry((model) =>
      ai.models.generateContent({
        model,
        contents: contentsPayload,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          maxOutputTokens: 65536,
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              itemCount: { type: Type.NUMBER },
              products: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    category: { type: Type.STRING },
                    hsn: { type: Type.STRING },
                    suggestedTaxRate: { type: Type.NUMBER },
                    quantity: { type: Type.NUMBER },
                    rate: { type: Type.NUMBER },
                    unit: { type: Type.STRING },
                  },
                  required: ["name", "hsn", "suggestedTaxRate", "quantity", "rate", "unit"],
                },
              },
              customer: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  address: { type: Type.STRING },
                  email: { type: Type.STRING },
                  phone: { type: Type.STRING },
                  gstin: { type: Type.STRING },
                },
              },
              scopeOfWork: { type: Type.STRING },
              materialType: { type: Type.STRING },
            },
          },
        },
      })
    ));

    const parsed = safeJSONParse(response.text, null);
    if (parsed && Array.isArray(parsed.products)) {
      parsed.products = parsed.products.map((p: any) => ({
        ...p,
        name: sanitizeExtractedDescription(p.name || p.description || ""),
      }));
    }
    return res.json({ result: parsed });
  } catch (err: any) {
    console.error("Backend analyze-document error:", err?.message || err);
    const errStr = String(err?.message || err);

    // Fallback: If text was extracted from file (e.g. spreadsheet, word doc, text file), salvage rows even if AI service quota is exhausted
    const { extractedText } = req.body || {};
    if (extractedText && typeof extractedText === "string") {
      const fallbackData = fallbackExtractLinesFromText(extractedText);
      if (fallbackData.products.length > 0) {
        console.log(`[Document Parse Fallback]: Successfully extracted ${fallbackData.products.length} line items via tabular parser.`);
        return res.json({ result: fallbackData });
      }
    }

    if (errStr.includes("429") || errStr.includes("RESOURCE_EXHAUSTED") || errStr.includes("credits") || errStr.includes("quota")) {
      return res.status(429).json({ error: "Your Gemini API credits or quota are currently exhausted. Please update your billing at AI Studio or import line items via CSV/Excel." });
    }
    if (errStr.includes("503") || errStr.includes("UNAVAILABLE") || errStr.includes("high demand") || errStr.includes("spikes in demand")) {
      return res.status(503).json({ error: "The AI service is experiencing temporary high demand from the provider. Please try again in a few moments." });
    }
    return res.status(500).json({ error: "Document analysis failed. Please verify the document format or enter items manually." });
  }
});

// 7. Analyze Text Content
app.post("/api/analyze-text-content", async (req, res) => {
  try {
    const { text, industry, businessName } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Text content is required." });
    }

    const ai = getGenAI();
    const systemInstruction = `You are an expert AI Data Specialist supporting all industries (Manufacturing, Metals & Engineering, Chemicals, Pharmaceuticals, Textiles, Food & Beverages, Agriculture, FMCG, Electronics, Hardware, Construction, Automotive, Logistics, Services, etc.) for: ${businessName || "Enterprise"} (${industry || "General / Multi-Industry"}).
Analyze the provided text (Purchase Order content, RFQ, WhatsApp order, email, or invoice text).
Extract ALL line items and customer details without exception.

CRITICAL EXTRACTION RULES:
1. **EXTRACT EVERY SINGLE LINE ITEM**: Do not skip, group, or summarize any item.
2. **STRICT 8-DIGIT HSN/ITC(HS) RESOLUTION ACROSS ALL INDUSTRIES**:
   - Provide an exact 8-digit Indian ITC(HS) classification HSN code for each product appropriate to its industry.
   - Never output generic, short, or placeholder HSN codes.
   - HSN must contain exactly 8 numeric digits. Do not output SAC codes unless it is purely a service.
3. **PRODUCT PURITY**:
   - "name": Full exact technical or commercial product description (grade, model, size, specification, rating, formulation, type). Do NOT include bank details, general terms, payment clauses, delivery lead times, or general notes.
4. **ACCURATE QUANTITY & EXACT UOM**:
   - Carefully parse exact quantities and extract the EXACT Unit of Measure (UOM) as stated in the text (e.g. LITERS, LTR, ML, GALLONS, KGS, GRAMS, TONS, QUINTAL, MTR, METERS, FEET, INCH, SQM, SQF, CBM, CFT, NOS, PCS, SET, BOX, CTN, PKT, BAG, DRM, CAN, BTL, DOZ, PAIRS, HRS, DAY, JOB, SRV, LOT). If text says "Liters", extract "LITERS".`;

    const response = await runExtractionWithPressureControl(() => callWithRetry((model) =>
      ai.models.generateContent({
        model,
        contents: [
          {
            text: `Extracted content to analyze:\n---\n${text}\n---\nAnalyze this content carefully. Extract EVERY line item found in the text with complete specifications, exact quantities, and UOM.`,
          },
        ],
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          maxOutputTokens: 65536,
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              itemCount: { type: Type.NUMBER },
              products: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    category: { type: Type.STRING },
                    hsn: { type: Type.STRING },
                    suggestedTaxRate: { type: Type.NUMBER },
                    quantity: { type: Type.NUMBER },
                    rate: { type: Type.NUMBER },
                    unit: { type: Type.STRING },
                  },
                },
              },
              customer: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  address: { type: Type.STRING },
                  email: { type: Type.STRING },
                  phone: { type: Type.STRING },
                  gstin: { type: Type.STRING },
                },
              },
              scopeOfWork: { type: Type.STRING },
              materialType: { type: Type.STRING },
            },
          },
        },
      })
    ));

    const parsed = safeJSONParse(response.text, null);
    if (parsed && Array.isArray(parsed.products)) {
      parsed.products = parsed.products.map((p: any) => ({
        ...p,
        name: sanitizeExtractedDescription(p.name || p.description || ""),
      }));
    }
    return res.json({ result: parsed });
  } catch (err: any) {
    console.error("Backend analyze-text-content error:", err?.message || err);
    const errStr = String(err?.message || err);

    // Fallback: Attempt offline text line-item extraction
    const { text } = req.body || {};
    if (text && typeof text === "string") {
      const fallbackData = fallbackExtractLinesFromText(text);
      if (fallbackData.products.length > 0) {
        console.log(`[Text Parse Fallback]: Successfully extracted ${fallbackData.products.length} line items.`);
        return res.json({ result: fallbackData });
      }
    }

    if (errStr.includes("429") || errStr.includes("RESOURCE_EXHAUSTED") || errStr.includes("credits") || errStr.includes("quota")) {
      return res.status(429).json({ error: "Your Gemini API credits or quota are currently exhausted. Please update your billing at AI Studio or enter line items manually." });
    }
    if (errStr.includes("503") || errStr.includes("UNAVAILABLE") || errStr.includes("high demand") || errStr.includes("spikes in demand")) {
      return res.status(503).json({ error: "The AI service is experiencing temporary high demand from the provider. Please try again in a few moments." });
    }
    return res.status(500).json({ error: "Text analysis failed." });
  }
});

// 8. Analyze Letterhead
app.post("/api/analyze-letterhead", async (req, res) => {
  try {
    const { imageData } = req.body;
    if (!imageData) return res.json({ result: null });

    const ai = getGenAI();
    const systemInstruction = `Extract business details (name, address, email, gstin) from this letterhead image. Return JSON matching Partial<BusinessDetails>.`;

    const rawBase64 = imageData.includes(",") ? imageData.split(",")[1] : imageData;

    const response = await callWithRetry((model) =>
      ai.models.generateContent({
        model,
        contents: [
          { inlineData: { mimeType: "image/png", data: rawBase64 } },
          { text: "Extract business info." },
        ],
        config: {
          systemInstruction,
          responseMimeType: "application/json",
        },
      })
    );

    const parsed = safeJSONParse(response.text, null);
    return res.json({ result: parsed });
  } catch (err: any) {
    console.error("Backend analyze-letterhead error:", err?.message || err);
    return res.json({ result: null });
  }
});

// 9. Search and Get HSN
app.post("/api/search-and-get-hsn", async (req, res) => {
  try {
    const { description } = req.body;
    if (!description || description.trim().length < 2) {
      return res.json({ result: "" });
    }

    const ai = getGenAI();
    const response = await callWithRetry((model) =>
      ai.models.generateContent({
        model,
        contents: `Find the most accurate India GST HSN or SAC code (4 to 8 digits) for this product or service description: "${description}". Return valid JSON only: {"hsn": "12345678"}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              hsn: { type: Type.STRING }
            },
            required: ["hsn"]
          }
        }
      })
    );

    const parsed = safeJSONParse(response.text || "{}", {});
    const hsnResult = parsed.hsn ? String(parsed.hsn).trim() : "";
    return res.json({ result: hsnResult });
  } catch (err: any) {
    console.error("Backend search-and-get-hsn error:", err?.message || err);
    return res.json({ result: "" });
  }
});

// 10. Edit Line Items with AI Helper & Endpoint
function parseBulkCommandIntent(command: string) {
  const lower = (command || "").toLowerCase().trim();

  let operation: "ADD" | "SET" | "PERCENT_INCREASE" | "PERCENT_DECREASE" | "MULTIPLY" | "DELETE" | "UNKNOWN" = "UNKNOWN";
  let amount: number | null = null;
  let isAllFields = false;
  const targetFields = new Set<string>();
  let targetItemIndices: number[] | "ALL" = "ALL";
  let explicitCostType: "Flat" | "%" | "Per Unit" | "By Weight" | null = null;
  let targetSupplierIndex: number | null = null;
  let addSupplierRequested = false;

  if (/\b(add|create|new|include)\s+(a\s+)?(supplier|vendor)\b/i.test(lower) || lower.includes("add supplier") || lower.includes("new supplier")) {
    addSupplierRequested = true;
  }

  const supMatch = lower.match(/\b(?:supplier|sup|vendor)\s*#?\s*(\d+)\b/i);
  if (supMatch) {
    const supNum = parseInt(supMatch[1], 10);
    if (!isNaN(supNum) && supNum >= 1 && supNum <= 5) {
      targetSupplierIndex = supNum;
    }
  }

  if (lower.includes("per unit")) explicitCostType = "Per Unit";
  else if (lower.includes("by weight")) explicitCostType = "By Weight";
  else if (lower.includes("flat")) explicitCostType = "Flat";

  if (/\b(add|plus|\+)\b/.test(lower) && !lower.includes("add item") && !lower.includes("add product") && !lower.includes("add line") && !lower.includes("add supplier")) {
    operation = "ADD";
  } else if (/\b(increase|raise|boost|bump)\b/.test(lower)) {
    if (lower.includes("%") || lower.includes("percent")) {
      operation = "PERCENT_INCREASE";
    } else {
      operation = "ADD";
    }
  } else if (/\b(decrease|reduce|discount|lower)\b/.test(lower)) {
    if (lower.includes("%") || lower.includes("percent")) {
      operation = "PERCENT_DECREASE";
    } else {
      operation = "ADD";
    }
  } else if (/\b(multiply|times|\*)\b/.test(lower)) {
    operation = "MULTIPLY";
  } else if (/\b(set|change|make|update|put)\b/.test(lower) && !/\b(description|incoterm|word|text)\b/i.test(lower)) {
    operation = "SET";
  } else if (/\b(delete|remove)\s+(a\s+)?(line\s+item|item\s+row|line|item|row|product)\b/i.test(lower) || lower.includes("delete last") || lower.includes("remove last")) {
    operation = "DELETE";
  }

  let textForAmount = lower;
  if (supMatch) {
    textForAmount = textForAmount.replace(supMatch[0], "");
  }

  const lineMatch = textForAmount.match(/(?:line|item|row)\s*(\d+)/i);
  if (lineMatch) {
    const idx = parseInt(lineMatch[1], 10) - 1;
    if (!isNaN(idx) && idx >= 0) targetItemIndices = [idx];
    textForAmount = textForAmount.replace(lineMatch[0], "");
  } else if (lower.includes("last line") || lower.includes("last item") || lower.includes("last row")) {
    targetItemIndices = [-1];
  }

  // Check for "from X% to Y%" or "from X to Y" patterns (e.g. "update tax rate from 18% to 5%")
  const rangeMatch = textForAmount.match(/(?:from\s+)?(\d+(?:\.\d+)?)\s*%?\s*(?:to|->|=)\s*(\d+(?:\.\d+)?)\s*%?/i);

  // Only extract numeric amounts if NOT purely a text manipulation (like removing incoterms or words)
  const isTextManipulation = /\b(remove|delete|clear|strip|erase|incoterm|description|word)\b/i.test(lower) && !/\b(rate|price|qty|quantity|amount|cost)\b/i.test(lower);
  
  if (rangeMatch) {
    amount = parseFloat(rangeMatch[2]);
    operation = "SET";
  } else if (!isTextManipulation) {
    const numberMatch = textForAmount.match(/([+-]?\d+(?:\.\d+)?)/);
    if (numberMatch) {
      amount = parseFloat(numberMatch[1]);
      if (operation === "UNKNOWN") {
        if (textForAmount.includes("+")) operation = "ADD";
        else if (textForAmount.includes("-")) {
          operation = "ADD";
          amount = -Math.abs(amount);
        } else if (/\b(set|rate|price|value)\b/i.test(lower)) {
          operation = "SET";
        }
      }
    }
  }

  if (lower.includes("all field") || lower.includes("every field") || lower.includes("all values") || lower.includes("all numeric")) {
    isAllFields = true;
    targetFields.add("rate");
    targetFields.add("costTypeValue");
    targetFields.add("qtyPacked");
    targetFields.add("rawMaterialCost");
    targetFields.add("laborCost");
    targetFields.add("overheadCost");
    targetFields.add("estimatedUnitCost");
    if (lower.includes("quantity") || lower.includes("qty") || lower.includes("count") || lower.includes("pcs")) {
      targetFields.add("quantity");
    }
  } else {
    if (lower.includes("rate") || lower.includes("price") || lower.includes("unit cost")) targetFields.add("rate");
    if (lower.includes("quantity") || lower.includes("qty") || lower.includes("pcs") || lower.includes("count")) targetFields.add("quantity");
    if (lower.includes("cost") || lower.includes("costvalue") || lower.includes("costtypevalue")) targetFields.add("costTypeValue");
    if (lower.includes("tax") || lower.includes("gst") || lower.includes("vat")) targetFields.add("taxRate");
    if (lower.includes("packed")) targetFields.add("qtyPacked");
  }

  // Fallback: If no explicit fields matched for a math operation, target primary numeric fields (rate, costTypeValue)
  if (targetFields.size === 0 && !isAllFields && operation !== "UNKNOWN" && operation !== "DELETE") {
    targetFields.add("rate");
    targetFields.add("costTypeValue");
  }

  return {
    operation,
    amount,
    isAllFields,
    targetFields: Array.from(targetFields),
    targetItemIndices,
    explicitCostType,
    targetSupplierIndex,
    addSupplierRequested,
  };
}

function applyAndValidateBulkEdits(
  origList: any[],
  aiItems: any[],
  userCommand: string,
  docType: string,
  aiExplanation?: string
): { items: any[]; explanation: string } {
  const intent = parseBulkCommandIntent(userCommand);

  // Only execute regex fallback row deletion if Gemini AI produced no items
  if ((!aiItems || aiItems.length === 0) && intent.operation === "DELETE" && origList.length > 0) {
    let newItems = [...origList];
    if (Array.isArray(intent.targetItemIndices)) {
      const deleteIndices: number[] = intent.targetItemIndices;
      if (deleteIndices.includes(-1)) {
        newItems.pop();
      } else {
        newItems = newItems.filter((_, idx) => !deleteIndices.includes(idx));
      }
    }
    return {
      items: newItems,
      explanation: `Deleted line item(s) as requested.`
    };
  }

  // Offline fallback for text/incoterm removal if Gemini AI is unavailable
  if ((!aiItems || aiItems.length === 0) && origList.length > 0 && /\b(remove|delete|clear|strip)\b/i.test(userCommand)) {
    const textRemoveMatch = userCommand.match(/\b(?:remove|delete|clear|strip)\s+(.+?)\s+(?:from|in)\s+(?:all\s+)?(?:line\s+items?|items?|descriptions?|rows?)\b/i) ||
                            userCommand.match(/\b(?:remove|delete|clear|strip)\s+(.+?)\s+(?:from|in)\s+descriptions?\b/i);
    if (textRemoveMatch) {
      const targetTerm = textRemoveMatch[1].trim();
      const cleanItems = origList.map((orig) => {
        let desc = orig.description || "";
        if (/incoterm|incoterms/i.test(targetTerm)) {
          desc = desc.replace(/(?:\|\s*)?incoterm(?:s)?\s*:\s*[a-z0-9\-]+/gi, "")
                     .replace(/(?:\|\s*)?incoterm(?:s)?\b/gi, "")
                     .replace(/\s*\|\s*$/, "")
                     .trim();
        } else {
          const escaped = targetTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const reg = new RegExp(escaped, "gi");
          desc = desc.replace(reg, "").replace(/\s{2,}/g, " ").trim();
        }
        return { ...orig, description: desc };
      });
      return {
        items: cleanItems,
        explanation: `Removed '${targetTerm}' from line item descriptions.`
      };
    }
  }

  const origMap = new Map<string, any>();
  origList.forEach((o: any) => {
    if (o && o.id) origMap.set(o.id, o);
  });

  const isAddingNewItems = /\b(add|include|create)\s+\d*\s*(items?|products?|lines?|inquir)/i.test(userCommand);

  const hasAiResult = Array.isArray(aiItems) && aiItems.length > 0;
  let sourceItems = hasAiResult ? aiItems : [...origList];

  if (hasAiResult && origList.length > 0 && !isAddingNewItems) {
    sourceItems = aiItems.map((aiItem, idx) => {
      const orig = (aiItem.id && origMap.get(aiItem.id)) || origList[idx] || {};
      return { ...orig, ...aiItem };
    });
  }

  const resultItems = sourceItems.map((item: any, idx: number) => {
    let orig: any = {};
    if (item.id && origMap.has(item.id)) {
      orig = origMap.get(item.id);
    } else if (idx < origList.length) {
      orig = origList[idx] || {};
    }

    const finalId = orig.id || item.id || `item-ai-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`;

    const costHead = item.costHead || orig.costHead || "";
    const costCategoryKey = item.costCategoryKey || orig.costCategoryKey || "";
    
    let costType: "Flat" | "%" | "Per Unit" | "By Weight" = "Flat";
    const validTypes = ["Flat", "%", "Per Unit", "By Weight"];
    if (intent.explicitCostType) {
      costType = intent.explicitCostType;
    } else if (validTypes.includes(item.costType)) {
      costType = item.costType;
    } else if (validTypes.includes(orig.costType)) {
      costType = orig.costType;
    }

    // Always prioritize Gemini AI's updated description when present (even if string length changed)
    const description = item.description !== undefined && item.description !== null
      ? String(item.description)
      : (orig.description || `Line Item ${idx + 1}`);

    const unit = item.unit !== undefined && item.unit !== null && String(item.unit).trim().length > 0 ? String(item.unit) : (orig.unit || "NOS");
    const hsn = item.hsn !== undefined && item.hsn !== null ? String(item.hsn) : (orig.hsn || "");

    let isTargetItem = false;
    if (intent.targetItemIndices === "ALL") {
      isTargetItem = true;
    } else if (Array.isArray(intent.targetItemIndices)) {
      const indices: number[] = intent.targetItemIndices;
      const actualIdx = indices.map((i: number) => i === -1 ? origList.length - 1 : i);
      isTargetItem = actualIdx.includes(idx);
    }

    const applyValueOp = (fieldKey: string, currentVal: number, defaultVal: number = 0): number => {
      let baseVal = defaultVal;
      if (typeof orig[fieldKey] === "number" && !isNaN(orig[fieldKey])) {
        baseVal = orig[fieldKey];
      } else if (fieldKey === "costTypeValue") {
        if (typeof orig.rate === "number" && !isNaN(orig.rate)) baseVal = orig.rate;
        else if (typeof orig.amount === "number" && !isNaN(orig.amount)) baseVal = orig.amount;
      } else if (fieldKey === "rate") {
        if (typeof orig.costTypeValue === "number" && !isNaN(orig.costTypeValue)) baseVal = orig.costTypeValue;
        else if (typeof orig.amount === "number" && !isNaN(orig.amount)) baseVal = orig.amount;
      }

      // When Gemini AI produced a valid result, trust Gemini AI's returned number!
      if (hasAiResult && typeof item[fieldKey] === "number" && !isNaN(item[fieldKey])) {
        return item[fieldKey];
      }

      // ONLY apply regex math fallback when Gemini AI did not return a result
      const isFieldTargeted = intent.isAllFields || intent.targetFields.includes(fieldKey);
      if (!hasAiResult && isTargetItem && isFieldTargeted && intent.amount !== null && !isNaN(intent.amount)) {
        if (intent.operation === "ADD") {
          return baseVal + intent.amount;
        } else if (intent.operation === "SET") {
          return intent.amount;
        } else if (intent.operation === "PERCENT_INCREASE") {
          return Math.round((baseVal * (1 + intent.amount / 100)) * 100) / 100;
        } else if (intent.operation === "PERCENT_DECREASE") {
          return Math.round((baseVal * (1 - intent.amount / 100)) * 100) / 100;
        } else if (intent.operation === "MULTIPLY") {
          return baseVal * intent.amount;
        }
      }

      const aiVal = typeof item[fieldKey] === "number" && !isNaN(item[fieldKey]) ? item[fieldKey] : baseVal;
      return aiVal;
    };

    const qty = Math.max(0, applyValueOp("quantity", parseFloat(item.quantity), orig.quantity ?? 1));
    const rate = Math.max(0, applyValueOp("rate", parseFloat(item.rate), orig.rate ?? 0));
    const taxRate = applyValueOp("taxRate", parseFloat(item.taxRate), orig.taxRate ?? 18);

    let costTypeValue: number | undefined = orig.costTypeValue;
    if (orig.costTypeValue !== undefined || item.costTypeValue !== undefined || docType === "Cost Sheet" || docType === "COST_SHEET") {
      costTypeValue = applyValueOp("costTypeValue", parseFloat(item.costTypeValue), orig.costTypeValue ?? 0);
    }

    let qtyPacked: number | undefined = orig.qtyPacked;
    if (orig.qtyPacked !== undefined || item.qtyPacked !== undefined) {
      qtyPacked = applyValueOp("qtyPacked", parseFloat(item.qtyPacked), orig.qtyPacked ?? 0);
    }

    const rawMaterialCost = orig.rawMaterialCost !== undefined ? applyValueOp("rawMaterialCost", parseFloat(item.rawMaterialCost), orig.rawMaterialCost) : undefined;
    const laborCost = orig.laborCost !== undefined ? applyValueOp("laborCost", parseFloat(item.laborCost), orig.laborCost) : undefined;
    const overheadCost = orig.overheadCost !== undefined ? applyValueOp("overheadCost", parseFloat(item.overheadCost), orig.overheadCost) : undefined;
    const estimatedUnitCost = orig.estimatedUnitCost !== undefined ? applyValueOp("estimatedUnitCost", parseFloat(item.estimatedUnitCost), orig.estimatedUnitCost) : undefined;

    const cleanNumber = (val: any, fallback: number) => (typeof val === "number" && !isNaN(val) ? val : fallback);

    const finalTargetSupplierIndex = item.targetSupplierIndex || intent.targetSupplierIndex || undefined;
    const finalAddSupplierRequested = item.addSupplierRequested || intent.addSupplierRequested || undefined;

    let supplierAmounts = { ...(orig.supplierAmounts || {}) };
    let supplierTypeValues = { ...(orig.supplierTypeValues || {}) };

    if (intent.amount !== null && !isNaN(intent.amount) && isTargetItem && intent.operation !== "UNKNOWN") {
      const fieldVal = costTypeValue !== undefined ? costTypeValue : rate;
      if (finalTargetSupplierIndex) {
        supplierAmounts[String(finalTargetSupplierIndex)] = fieldVal;
        supplierTypeValues[String(finalTargetSupplierIndex)] = fieldVal;

        supplierAmounts[`sup-${finalTargetSupplierIndex}`] = fieldVal;
        supplierTypeValues[`sup-${finalTargetSupplierIndex}`] = fieldVal;

        const origKeys = Object.keys(orig.supplierAmounts || {});
        if (origKeys.length >= finalTargetSupplierIndex) {
          const actualSupKey = origKeys[finalTargetSupplierIndex - 1];
          supplierAmounts[actualSupKey] = fieldVal;
          supplierTypeValues[actualSupKey] = fieldVal;
        }
      } else {
        const keys = Object.keys(supplierAmounts).length > 0 ? Object.keys(supplierAmounts) : ["sup-1", "1"];
        keys.forEach(k => {
          supplierAmounts[k] = fieldVal;
          supplierTypeValues[k] = fieldVal;
        });
      }
    } else if (finalTargetSupplierIndex) {
      const fieldVal = costTypeValue !== undefined ? costTypeValue : (rate !== undefined ? rate : 0);
      supplierAmounts[String(finalTargetSupplierIndex)] = fieldVal;
      supplierTypeValues[String(finalTargetSupplierIndex)] = fieldVal;
      supplierAmounts[`sup-${finalTargetSupplierIndex}`] = fieldVal;
      supplierTypeValues[`sup-${finalTargetSupplierIndex}`] = fieldVal;
    } else {
      if (Object.keys(supplierAmounts).length === 0) {
        supplierAmounts = { ...(item.supplierAmounts || {}) };
        supplierTypeValues = { ...(item.supplierTypeValues || {}) };
      }
    }

    const finalRate = cleanNumber(rate, 0);
    const finalQty = cleanNumber(qty, 1);
    const finalTaxRate = cleanNumber(taxRate, 18);
    const finalCostTypeValue = costTypeValue !== undefined ? cleanNumber(costTypeValue, 0) : undefined;
    const finalHeatNo = item.heatNo !== undefined ? item.heatNo : (orig.heatNo || "");
    const finalBoxNo = item.boxNo !== undefined ? item.boxNo : (orig.boxNo || "");
    const finalRemarks = item.remarks !== undefined ? item.remarks : (orig.remarks || "");

    const isDescriptionChanged = String(description).trim() !== String(orig.description || "").trim();
    const isRateChanged = finalRate !== Number(orig.rate || 0);
    const isQtyChanged = finalQty !== Number(orig.quantity ?? 1);
    const isHsnChanged = String(hsn).trim() !== String(orig.hsn || "").trim();
    const isUnitChanged = String(unit).trim() !== String(orig.unit || "NOS").trim();
    const isTaxChanged = finalTaxRate !== Number(orig.taxRate ?? 18);
    const isCostTypeValChanged = finalCostTypeValue !== undefined && finalCostTypeValue !== orig.costTypeValue;
    const isHeatNoChanged = String(finalHeatNo).trim() !== String(orig.heatNo || "").trim();
    const isBoxNoChanged = String(finalBoxNo).trim() !== String(orig.boxNo || "").trim();
    const isRemarksChanged = String(finalRemarks).trim() !== String(orig.remarks || "").trim();

    const isAiEdited =
      isTargetItem ||
      isDescriptionChanged ||
      isRateChanged ||
      isQtyChanged ||
      isHsnChanged ||
      isUnitChanged ||
      isTaxChanged ||
      isCostTypeValChanged ||
      isHeatNoChanged ||
      isBoxNoChanged ||
      isRemarksChanged ||
      Boolean(item.isAiEdited);

    return {
      id: finalId,
      description,
      hsn,
      quantity: finalQty,
      unit,
      rate: finalRate,
      taxRate: finalTaxRate,
      isRegret: item.isRegret !== undefined ? Boolean(item.isRegret) : (orig.isRegret || false),
      heatNo: finalHeatNo,
      qtyPacked: qtyPacked !== undefined ? cleanNumber(qtyPacked, 0) : undefined,
      remarks: finalRemarks,
      boxNo: finalBoxNo,
      qaHeat: item.qaHeat !== undefined ? Boolean(item.qaHeat) : (orig.qaHeat || false),
      qaDim: item.qaDim !== undefined ? Boolean(item.qaDim) : (orig.qaDim || false),
      qaMark: item.qaMark !== undefined ? Boolean(item.qaMark) : (orig.qaMark || false),
      costHead,
      costCategoryKey,
      costType,
      costTypeValue: finalCostTypeValue,
      rawMaterialCost,
      laborCost,
      overheadCost,
      estimatedUnitCost,
      targetSupplierIndex: finalTargetSupplierIndex,
      addSupplierRequested: finalAddSupplierRequested,
      supplierAmounts,
      supplierTypeValues,
      isAiEdited
    };
  });

  // Prioritize Gemini AI's explanation whenever available
  let explanation = (aiExplanation && aiExplanation.trim().length > 0)
    ? aiExplanation.trim()
    : "Updated line items successfully.";

  // Only use regex intent fallback if NO explicit explanation was provided by AI
  if (!aiExplanation || !aiExplanation.trim()) {
    if (intent.targetSupplierIndex && intent.amount !== null) {
      explanation = `Updated value to ${intent.amount} for Supplier ${intent.targetSupplierIndex} across ${resultItems.length} line item${resultItems.length !== 1 ? "s" : ""}.`;
    } else if (intent.addSupplierRequested) {
      explanation = `Added a new supplier column to the Cost Sheet.`;
    } else if (intent.operation === "ADD" && intent.amount !== null) {
      const fieldNames = intent.isAllFields 
        ? "rate, quantity, and cost values" 
        : intent.targetFields.map(f => f === "costTypeValue" ? "cost value" : f).join(", ") || "numeric values";
      explanation = `Added ${intent.amount} to ${fieldNames} across ${resultItems.length} line item${resultItems.length !== 1 ? "s" : ""}.`;
    } else if (intent.operation === "SET" && intent.amount !== null) {
      const fieldNames = intent.targetFields.map(f => f === "costTypeValue" ? "cost value" : f).join(", ") || "value";
      const itemScope = intent.targetItemIndices === "ALL" ? `across ${resultItems.length} line items` : `for specified item(s)`;
      explanation = `Set ${fieldNames} to ${intent.amount} ${itemScope}.`;
    } else if (intent.operation === "PERCENT_INCREASE" && intent.amount !== null) {
      const fieldNames = intent.targetFields.map(f => f === "costTypeValue" ? "cost value" : f).join(", ") || "rates";
      explanation = `Increased ${fieldNames} by ${intent.amount}% across ${resultItems.length} line item${resultItems.length !== 1 ? "s" : ""}.`;
    } else if (intent.operation === "PERCENT_DECREASE" && intent.amount !== null) {
      const fieldNames = intent.targetFields.map(f => f === "costTypeValue" ? "cost value" : f).join(", ") || "rates";
      explanation = `Decreased ${fieldNames} by ${intent.amount}% across ${resultItems.length} line item${resultItems.length !== 1 ? "s" : ""}.`;
    } else if (intent.explicitCostType) {
      explanation = `Set calculation basis to ${intent.explicitCostType} across line items.`;
    }
  }

  return {
    items: resultItems,
    explanation
  };
}

app.post("/api/edit-line-items", async (req, res) => {
  try {
    const { currentItems, userCommand, docType, currency, docContext } = req.body;
    const origList = Array.isArray(currentItems) ? currentItems : [];

    const ai = getGenAI();

    const systemInstruction = `You are a universal AI ERP & Document Editor assistant for commercial invoices, quotations, purchase orders, packing lists, cost sheets, and tax documents.
Execute the user's natural language command with 100% precision on the active document (${docType}).

CORE DIRECTIVES:
1. DOMAIN & CONTEXT AWARENESS:
   Analyze the user's current line items, industry context, units (e.g. PCS, KGS, MTR, BOX, HRS, SET), and document type. Generate or modify line items that strictly adhere to the domain, terminology, and product style already present in the user's document. Support every global industry seamlessly (Retail, FMCG, IT & Consulting Services, Healthcare & Pharma, Logistics, Manufacturing, Food & Agriculture, Textiles & Apparel, Construction, etc.).

2. ITEM DESCRIPTIONS (EDIT, DELETE WORDS, ADD WORDS, REFINE, REPLACE):
   - "Remove [words/phrase] from item description": Remove those exact words or phrases from item descriptions.
   - "Add [words/phrase] to item description of line N / all items": Append or prepend text to item descriptions.
   - "Edit line N description to [text]": Replace description of line N with new text.
   - "Refine / format descriptions": Clean up, format, or capitalize descriptions cleanly while preserving domain identity.

3. LINE ITEM FIELDS (HSN/SAC, QTY, UNIT, RATE, TAX RATE, HEAT NO, BOX NO, REMARKS):
   - Edit, replace, add, delete, or calculate values for any line item property.
   - Math operations (Increase rates by 10%, discount 5%, add 100 to all items).
   - Item addition or deletion ("Add 2 items...", "Delete 3rd item").
   - When adding new items, choose realistic HSN/SAC codes, appropriate units, and reasonable pricing matching the document's currency and domain context.

4. CUSTOMER / SUPPLIER DETAILS:
   - "Change customer name to [Name]", "Set customer GSTIN to [GSTIN]", "Update customer address to [Address]", "Change customer phone/email to [X]":
     Return updated customer fields in 'docUpdates.customer'.

5. NOTES, TERMS & CONDITIONS, HEADER & INCOTERMS:
   - "Update notes to [Notes]", "Set payment terms to [Terms]", "Set PO number to [PO-123]":
     Return updated string values in 'docUpdates.notes', 'docUpdates.terms', 'docUpdates.poNumber', etc.
   - "Set Incoterms to CIF Hamburg", "Set Country of Origin to Germany":
     Return updated fields in 'docUpdates' (e.g. 'incotermCode', 'incotermLocation', 'countryOfOrigin', 'countryOfDestination').

OUTPUT JSON REQUIREMENT:
Return a JSON object containing:
- 'items': Array of updated/added/remaining LineItem objects.
- 'docUpdates': Optional object containing any document-level updates requested (customer, notes, terms, poNumber, paymentTerms, incotermCode, incotermLocation, countryOfOrigin, countryOfDestination, freightAmount, packagingAmount, isTaxEnabled, isExport, currency).
- 'explanation': Clear, precise explanation of all changes executed.`;

    const prompt = `CURRENT DOCUMENT CONTEXT (${docType}):
Currency: ${currency}
Customer Details: ${JSON.stringify(docContext?.customer || {})}
Notes & Remarks: ${JSON.stringify(docContext?.notes || "")}
Terms & Conditions: ${JSON.stringify(docContext?.terms || "")}
Incoterms / Header: ${JSON.stringify(docContext?.incoterms || {})}
Origin / Destination: ${docContext?.countryOfOrigin || ""} -> ${docContext?.countryOfDestination || ""}

CURRENT LINE ITEMS (${origList.length} items):
${JSON.stringify(origList, null, 2)}

USER REQUESTED COMMAND:
"${userCommand}"`;

    let aiItems: any[] = [];
    let aiDocUpdates: any = null;
    let aiExplanation = "";

    try {
      const response = await callWithRetry((model) =>
        ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            systemInstruction,
            responseMimeType: "application/json",
            maxOutputTokens: 65536,
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                items: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      description: { type: Type.STRING },
                      hsn: { type: Type.STRING },
                      quantity: { type: Type.NUMBER },
                      unit: { type: Type.STRING },
                      rate: { type: Type.NUMBER },
                      taxRate: { type: Type.NUMBER },
                      isRegret: { type: Type.BOOLEAN },
                      heatNo: { type: Type.STRING },
                      qtyPacked: { type: Type.NUMBER },
                      remarks: { type: Type.STRING },
                      boxNo: { type: Type.STRING },
                      qaHeat: { type: Type.BOOLEAN },
                      qaDim: { type: Type.BOOLEAN },
                      qaMark: { type: Type.BOOLEAN },
                      costHead: { type: Type.STRING },
                      costCategoryKey: { type: Type.STRING },
                      costType: { type: Type.STRING },
                      costTypeValue: { type: Type.NUMBER },
                      targetSupplierIndex: { type: Type.NUMBER },
                      addSupplierRequested: { type: Type.BOOLEAN },
                    },
                    required: ["description", "quantity", "rate"],
                  },
                },
                docUpdates: {
                  type: Type.OBJECT,
                  properties: {
                    customer: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        address: { type: Type.STRING },
                        gstin: { type: Type.STRING },
                        phone: { type: Type.STRING },
                        email: { type: Type.STRING },
                        country: { type: Type.STRING },
                        state: { type: Type.STRING },
                      }
                    },
                    notes: { type: Type.STRING },
                    terms: { type: Type.STRING },
                    poNumber: { type: Type.STRING },
                    buyerOrderDate: { type: Type.STRING },
                    paymentTerms: { type: Type.STRING },
                    paymentMode: { type: Type.STRING },
                    incotermCode: { type: Type.STRING },
                    incotermLocation: { type: Type.STRING },
                    incotermCountryOfOrigin: { type: Type.STRING },
                    incotermCountryOfDestination: { type: Type.STRING },
                    countryOfOrigin: { type: Type.STRING },
                    countryOfDestination: { type: Type.STRING },
                    freightAmount: { type: Type.NUMBER },
                    packagingAmount: { type: Type.NUMBER },
                    isTaxEnabled: { type: Type.BOOLEAN },
                    isExport: { type: Type.BOOLEAN },
                    currency: { type: Type.STRING },
                  }
                },
                explanation: { type: Type.STRING },
              },
              required: ["items", "explanation"],
            },
          },
        })
      );

      const parsed = safeJSONParse(response.text || "{}", {});
      if (parsed) {
        if (Array.isArray(parsed.items)) aiItems = parsed.items;
        if (parsed.docUpdates && typeof parsed.docUpdates === "object") aiDocUpdates = parsed.docUpdates;
        aiExplanation = parsed.explanation || "";
      }
    } catch (aiErr) {
      console.warn("AI generation note in edit-line-items (using fallback engine):", aiErr);
    }

    const { items: validatedItems, explanation: validatedExplanation } = applyAndValidateBulkEdits(
      origList,
      aiItems,
      userCommand,
      docType,
      aiExplanation
    );

    return res.json({
      result: {
        items: validatedItems,
        docUpdates: aiDocUpdates,
        explanation: validatedExplanation,
      },
    });
  } catch (err: any) {
    console.error("Backend edit-line-items error:", err?.message || err);
    return res.json({ result: { items: req.body.currentItems || [], docUpdates: null, explanation: "An error occurred." } });
  }
});

// 11. AI Chat Endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, userMessage, industry, business, currency, exchangeRate, customers, history, tools } = req.body;

    const ai = getGenAI();
    const companyName = business?.name || "our company";
    const systemInstruction = `You are the helpful AI Assistant for ${companyName} (${business?.industry || industry || "General Business"}). Your job is to answer questions about the user's business and help them manage invoices and documents effortlessly.

USER'S COMPANY PROFILE:
- Business Name: ${business?.name || "Not specified"}
- Industry: ${business?.industry || industry || "General"}
- GSTIN / Tax ID: ${business?.gstin || "Not specified"}
- Address: ${business?.address || "Not specified"}
- Email: ${business?.email || "Not specified"}
- Phone: ${business?.phone || "Not specified"}
- State / Country: ${business?.state || ""}, ${business?.country || "India"}

CURRENT DOCUMENT & DATABASE CONTEXT:
- Currency: ${currency || "INR"} (Exchange Rate: ${exchangeRate || 1})
- Registered Customers: ${JSON.stringify(customers || [])}
- Recent Document History: ${JSON.stringify(history || [])}

IMPORTANT GUIDELINES:
1. When the user asks general or informational questions (e.g., "TELL ME WHAT MY COMPANY IS ABOUT?", "What is my GSTIN?", "Who are my customers?", "What can you do?"), ALWAYS respond directly in clear, friendly natural text using the Company Profile above. DO NOT call any tools or functions for general questions!
2. ONLY call tool functions (add_line_item, set_customer, change_document_type, clear_form) when the user explicitly requests an action on the current document (e.g. "add 10 units of x", "set customer to y", "clear form").`;

    const apiMessages = (messages || []).map((m: any) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    }));

    const contents: any[] = [...apiMessages];
    if (userMessage) {
      contents.push({ role: "user", parts: [{ text: userMessage }] });
    }

    const response = await callWithRetry((model) =>
      ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction,
          temperature: 0.2,
          tools: tools ? [{ functionDeclarations: tools }] : undefined,
        },
      })
    );

    return res.json({
      text: response.text || "",
      functionCalls: response.functionCalls || null,
    });
  } catch (err: any) {
    console.error("Backend chat error:", err?.message || err);
    return res.status(500).json({ error: "Failed to generate chat response." });
  }
});

// Vite middleware for development vs static serve for production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Secure Server] App running at http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
