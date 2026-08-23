import React, { useState, useEffect, useRef } from "react";
import { Shield, Lock, Key, Eye, EyeOff, Mail, CheckCircle2, AlertCircle, ArrowLeft, Send, Sparkles, Clock, AlertTriangle } from "lucide-react";
import { saveToCloud } from "../services/dbService";

interface AdminPinModalProps {
  isOpen: boolean;
  onSuccess: () => void;
  onCancel: () => void;
  userEmail?: string;
}

export const ADMIN_DEFAULT_PIN = "1224";
export const ADMIN_RESET_EMAIL = "support@billiq.site";

const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export const AdminPinModal: React.FC<AdminPinModalProps> = ({
  isOpen,
  onSuccess,
  onCancel,
  userEmail,
}) => {
  const [pin, setPin] = useState<string>("");
  const [showPin, setShowPin] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [isResetView, setIsResetView] = useState<boolean>(false);
  const [isSendingReset, setIsSendingReset] = useState<boolean>(false);
  const [resetSentSuccess, setResetSentSuccess] = useState<boolean>(false);
  const [failedAttempts, setFailedAttempts] = useState<number>(() => {
    try {
      const stored = sessionStorage.getItem("billiq_admin_failed_attempts") || localStorage.getItem("billiq_admin_failed_attempts");
      return stored ? parseInt(stored, 10) || 0 : 0;
    } catch {
      return 0;
    }
  });
  const [lockoutUntil, setLockoutUntil] = useState<number>(() => {
    try {
      const stored = sessionStorage.getItem("billiq_admin_lockout_until") || localStorage.getItem("billiq_admin_lockout_until");
      return stored ? parseInt(stored, 10) || 0 : 0;
    } catch {
      return 0;
    }
  });
  const [remainingLockSeconds, setRemainingLockSeconds] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check lockout timer
  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now();
      if (lockoutUntil > now) {
        setRemainingLockSeconds(Math.ceil((lockoutUntil - now) / 1000));
      } else {
        setRemainingLockSeconds(0);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [lockoutUntil]);

  useEffect(() => {
    if (isOpen) {
      setPin("");
      setErrorMsg("");
      setIsResetView(false);
      setResetSentSuccess(false);
      setTimeout(() => {
        if (lockoutUntil <= Date.now()) {
          inputRef.current?.focus();
        }
      }, 100);
    }
  }, [isOpen, lockoutUntil]);

  const dispatchSecurityAlert = async (attemptsCount: number) => {
    try {
      await fetch("/api/admin/security-alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptedEmail: userEmail || ADMIN_RESET_EMAIL,
          attemptsCount,
          timestamp: new Date().toISOString(),
          userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "Browser",
          lockDurationMinutes: 5,
        }),
      });
    } catch (err) {
      console.warn("Security alert dispatch notice:", err);
    }
  };

  const handleIncorrectPin = (currentAttempts: number) => {
    const newCount = currentAttempts + 1;
    setFailedAttempts(newCount);
    try {
      sessionStorage.setItem("billiq_admin_failed_attempts", String(newCount));
      localStorage.setItem("billiq_admin_failed_attempts", String(newCount));
    } catch {}

    if (newCount >= 3) {
      const lockTime = Date.now() + LOCKOUT_DURATION_MS;
      setLockoutUntil(lockTime);
      try {
        sessionStorage.setItem("billiq_admin_lockout_until", String(lockTime));
        localStorage.setItem("billiq_admin_lockout_until", String(lockTime));
      } catch {}

      // Trigger high-priority alert email to founder
      dispatchSecurityAlert(newCount);
      setErrorMsg(`Security alert triggered: 3 failed attempts recorded. Alert sent to ${ADMIN_RESET_EMAIL}. Input locked for 5 minutes.`);
    } else {
      setErrorMsg(`Incorrect PIN. Please try again. (${3 - newCount} attempt${3 - newCount === 1 ? "" : "s"} remaining before temporary lockout)`);
    }

    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
    setPin("");
  };

  const handleCorrectPin = () => {
    setFailedAttempts(0);
    setLockoutUntil(0);
    try {
      sessionStorage.removeItem("billiq_admin_failed_attempts");
      localStorage.removeItem("billiq_admin_failed_attempts");
      sessionStorage.removeItem("billiq_admin_lockout_until");
      localStorage.removeItem("billiq_admin_lockout_until");
      sessionStorage.setItem("billiq_admin_pin_verified", "true");
    } catch {}
    onSuccess();
  };

  if (!isOpen) return null;

  const isLockedOut = remainingLockSeconds > 0;

  const handlePinSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isLockedOut) return;
    setErrorMsg("");

    const storedPin = localStorage.getItem("admin_panel_pin") || localStorage.getItem("admin_security_password") || ADMIN_DEFAULT_PIN;
    const cleanEntered = pin.trim();

    if (!cleanEntered) {
      setErrorMsg("Please enter your 4-digit administrator PIN.");
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return;
    }

    if (cleanEntered === ADMIN_DEFAULT_PIN || cleanEntered === storedPin) {
      handleCorrectPin();
    } else {
      handleIncorrectPin(failedAttempts);
    }
  };

  const handleDigitClick = (digit: string) => {
    if (isLockedOut) return;
    if (pin.length < 8) {
      const newPin = pin + digit;
      setPin(newPin);
      setErrorMsg("");
      if (newPin.length === 4) {
        const storedPin = localStorage.getItem("admin_panel_pin") || localStorage.getItem("admin_security_password") || ADMIN_DEFAULT_PIN;
        if (newPin === ADMIN_DEFAULT_PIN || newPin === storedPin) {
          handleCorrectPin();
        }
      }
    }
  };

  const handleBackspace = () => {
    if (isLockedOut) return;
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg("");
  };

  const handleSendResetEmail = async () => {
    setIsSendingReset(true);
    setErrorMsg("");

    try {
      // Save reset request to Firestore
      try {
        await saveToCloud("admin_config/pin_reset_requests", {
          requestedAt: new Date().toISOString(),
          requestedBy: userEmail || "admin",
          targetResetEmail: ADMIN_RESET_EMAIL,
          status: "pending_review",
        }, true);
      } catch (cloudErr) {
        console.warn("Notice saving reset request to cloud:", cloudErr);
      }

      // Open mailto link directed to mehtavatsal24@gmail.com
      const mailtoSubject = encodeURIComponent("BillIQ Admin PIN Reset Request");
      const mailtoBody = encodeURIComponent(
        `Hello,\n\nA password reset request was initiated for the BillIQ Admin Panel.\n\nAccount: ${userEmail || "Administrator"}\nTimestamp: ${new Date().toLocaleString()}\n\nPlease verify and reset the administrative security credentials accordingly.`
      );
      
      const mailtoUrl = `mailto:${ADMIN_RESET_EMAIL}?subject=${mailtoSubject}&body=${mailtoBody}`;
      
      try {
        const mailWindow = window.open(mailtoUrl, "_blank");
        if (!mailWindow) {
          window.location.href = mailtoUrl;
        }
      } catch {
        window.location.href = mailtoUrl;
      }

      setResetSentSuccess(true);
    } catch (err) {
      console.error("Error dispatching reset email:", err);
      setErrorMsg("Could not automatically open email client. Please send your reset request directly to " + ADMIN_RESET_EMAIL);
    } finally {
      setIsSendingReset(false);
    }
  };

  const formatLockTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md animate-fadeIn">
      <div 
        className={`w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-zinc-100 relative transition-transform ${
          isShaking ? "animate-shake" : ""
        }`}
      >
        {/* Header Icon & Title */}
        <div className="text-center space-y-2 mb-6">
          <div className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center shadow-lg border transition-all ${
            isLockedOut 
              ? "bg-red-950/80 border-red-800 text-red-400 shadow-red-900/40" 
              : "bg-gradient-to-tr from-indigo-600 to-indigo-500 border-indigo-400/30 text-white shadow-indigo-500/25"
          }`}>
            {isLockedOut ? <Lock className="w-8 h-8 text-red-400 animate-pulse" /> : <Shield className="w-8 h-8 text-white" />}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              {isLockedOut ? "Console Temporarily Locked" : "Admin Console Verification"}
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              {isLockedOut 
                ? "Security lockout active. Multiple incorrect attempts were detected." 
                : "Enter your administrator security PIN to unlock the management console."}
            </p>
          </div>
        </div>

        {/* Lockout Warning Banner */}
        {isLockedOut && (
          <div className="p-4 bg-red-950/50 border border-red-800/80 rounded-2xl text-red-200 mb-5 space-y-2">
            <div className="flex items-center gap-2 font-bold text-xs text-red-400 uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>Lockout Active</span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Too many consecutive failed attempts. An automated security alert was dispatched to <strong className="text-white">{ADMIN_RESET_EMAIL}</strong>.
            </p>
            <div className="flex items-center justify-center gap-2 p-2.5 bg-zinc-950/90 rounded-xl border border-zinc-800 text-amber-400 font-mono text-sm font-bold">
              <Clock className="w-4 h-4 animate-spin text-amber-400" />
              <span>Cooldown: {formatLockTime(remainingLockSeconds)}</span>
            </div>
          </div>
        )}

        {!isResetView ? (
          /* PIN Input View */
          <form onSubmit={handlePinSubmit} className="space-y-5">
            {/* PIN Dots / Display */}
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="relative w-full">
                <input
                  ref={inputRef}
                  type={showPin ? "text" : "password"}
                  value={pin}
                  disabled={isLockedOut}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, "").slice(0, 8);
                    setPin(val);
                    setErrorMsg("");
                  }}
                  placeholder="Enter 4-digit PIN"
                  maxLength={8}
                  className="w-full text-center text-2xl tracking-[0.3em] font-mono font-bold bg-zinc-950/80 border border-zinc-700/80 rounded-2xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-zinc-600 placeholder:text-sm placeholder:tracking-normal disabled:opacity-40 disabled:cursor-not-allowed"
                  autoFocus
                />
                <button
                  type="button"
                  disabled={isLockedOut}
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 p-1 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
                  title={showPin ? "Hide PIN" : "Show PIN"}
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Visual 4-digit Pin Indicator */}
              <div className="flex items-center gap-2.5 pt-1">
                {[0, 1, 2, 3].map((idx) => (
                  <div
                    key={idx}
                    className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                      pin.length > idx
                        ? "bg-indigo-500 scale-110 shadow-sm shadow-indigo-500/50 ring-2 ring-indigo-400/40"
                        : "bg-zinc-800 border border-zinc-700"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && !isLockedOut && (
              <div className="p-3 bg-red-950/40 border border-red-800/80 rounded-xl text-red-300 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Quick Numeric Keypad */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                <button
                  key={num}
                  type="button"
                  disabled={isLockedOut}
                  onClick={() => handleDigitClick(num)}
                  className="h-11 rounded-xl bg-zinc-800/80 hover:bg-zinc-700/80 text-white font-semibold text-lg transition-all active:scale-95 border border-zinc-700/50 cursor-pointer shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                disabled={isLockedOut}
                onClick={() => setPin("")}
                className="h-11 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-bold transition-all border border-zinc-700/30 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Clear
              </button>
              <button
                type="button"
                disabled={isLockedOut}
                onClick={() => handleDigitClick("0")}
                className="h-11 rounded-xl bg-zinc-800/80 hover:bg-zinc-700/80 text-white font-semibold text-lg transition-all active:scale-95 border border-zinc-700/50 cursor-pointer shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
              >
                0
              </button>
              <button
                type="button"
                disabled={isLockedOut}
                onClick={handleBackspace}
                className="h-11 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-bold transition-all border border-zinc-700/30 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ⌫
              </button>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                type="submit"
                disabled={isLockedOut}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Key className="w-4 h-4" />
                <span>Unlock Admin Console</span>
              </button>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg("");
                    setIsResetView(true);
                  }}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Forgot PIN / Reset Password?</span>
                </button>

                <button
                  type="button"
                  onClick={onCancel}
                  className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          </form>
        ) : (
          /* Password Reset View */
          <div className="space-y-5">
            <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-3">
              <div className="flex items-center gap-2 text-indigo-400">
                <Mail className="w-4 h-4 shrink-0" />
                <span className="text-xs font-bold uppercase tracking-wider">Password Reset Service</span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Password reset requests and administrator credentials will be sent to:
              </p>
              <div className="p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-800/60 font-mono text-xs font-bold text-indigo-300 text-center select-all">
                {ADMIN_RESET_EMAIL}
              </div>
              <p className="text-[11px] text-zinc-400">
                Clicking the button below will dispatch the reset request notification and launch your email client with pre-formatted authorization details.
              </p>
            </div>

            {resetSentSuccess && (
              <div className="p-3.5 bg-emerald-950/40 border border-emerald-800/80 rounded-2xl text-emerald-300 text-xs font-semibold space-y-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Password reset request dispatched to {ADMIN_RESET_EMAIL}!</span>
                </div>
                <p className="text-[11px] text-emerald-400/80 pl-6">
                  Please check your inbox at {ADMIN_RESET_EMAIL} to complete verification or view your PIN credentials.
                </p>
              </div>
            )}

            {errorMsg && (
              <div className="p-3 bg-red-950/40 border border-red-800/80 rounded-xl text-red-300 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleSendResetEmail}
                disabled={isSendingReset}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{isSendingReset ? "Dispatching Request..." : `Send Reset Email to ${ADMIN_RESET_EMAIL}`}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsResetView(false);
                  setResetSentSuccess(false);
                  setErrorMsg("");
                  setTimeout(() => {
                    if (lockoutUntil <= Date.now()) {
                      inputRef.current?.focus();
                    }
                  }, 100);
                }}
                className="w-full py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl text-xs font-bold transition-all border border-zinc-700 cursor-pointer flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to PIN Entry</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

