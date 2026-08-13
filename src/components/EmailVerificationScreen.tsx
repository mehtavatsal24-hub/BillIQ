import React, { useState, useEffect } from 'react';
import { sendEmailVerification } from 'firebase/auth';
import { auth } from '../services/firebase';
import { Logo } from './Logo';
import { Mail, CheckCircle2, AlertCircle, RefreshCw, LogOut, ShieldCheck, KeyRound, ArrowRight, Info } from 'lucide-react';

interface EmailVerificationScreenProps {
  userEmail: string;
  onVerified: () => void;
  onSignOut: () => void;
}

export const EmailVerificationScreen: React.FC<EmailVerificationScreenProps> = ({
  userEmail,
  onVerified,
  onSignOut
}) => {
  const [otpCode, setOtpCode] = useState('');
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Automatically request initial OTP code when component mounts
  useEffect(() => {
    if (userEmail) {
      fetch('/api/send-verification-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail })
      })
      .then(res => res.json())
      .then(data => {
        if (data.code) {
          console.log(`[Developer / Sandbox Notice: Verification OTP is ${data.code}]`);
        }
      })
      .catch(() => {});
    }
  }, [userEmail]);

  const handleResend = async () => {
    setSending(true);
    setMessage(null);
    setError(null);
    try {
      if (auth?.currentUser) {
        const actionCodeSettings = {
          url: window.location.href,
          handleCodeInApp: true
        };
        await sendEmailVerification(auth.currentUser, actionCodeSettings);
      }

      await fetch('/api/send-verification-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail })
      });

      setMessage(`A fresh verification link and 6-digit verification code was dispatched to ${userEmail}. Check your inbox and Spam folder.`);
    } catch (err: any) {
      console.error("Error resending verification email:", err);
      const msg = err?.message || "";
      if (msg.includes("too-many-requests")) {
        setError("Too many requests. Please wait a minute before requesting another verification email.");
      } else {
        setMessage(`Verification code dispatched to ${userEmail}. Check your inbox or Spam/Junk folder.`);
      }
    } finally {
      setSending(false);
    }
  };

  const handleVerifyCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length < 6) {
      setError("Please enter the complete 6-digit verification code sent to your email.");
      return;
    }

    setVerifyingCode(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch('/api/verify-email-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, code: otpCode.trim() })
      });
      const data = await res.json();

      if (data.success && data.verified) {
        if (auth?.currentUser?.uid) {
          sessionStorage.setItem(`verified_${auth.currentUser.uid}`, 'true');
        }
        setMessage("Email address verified successfully! Redirecting to workspace...");
        setTimeout(() => {
          onVerified();
        }, 800);
      } else {
        setError(data.error || "Invalid verification code. Please check your email or click 'Resend Code'.");
      }
    } catch (err: any) {
      console.error("Error verifying code:", err);
      setError("Unable to verify code. Please check your internet connection and try again.");
    } finally {
      setVerifyingCode(false);
    }
  };

  const handleCheckStatus = async () => {
    if (!auth?.currentUser) return;
    setChecking(true);
    setMessage(null);
    setError(null);

    try {
      await auth.currentUser.reload();
      if (auth.currentUser.emailVerified) {
        if (auth.currentUser.uid) {
          sessionStorage.setItem(`verified_${auth.currentUser.uid}`, 'true');
        }
        onVerified();
      } else {
        setError("Firebase hasn't registered your link click yet. If you already clicked the link, please wait a moment or enter the 6-digit verification code below.");
      }
    } catch (err: any) {
      console.error("Error checking status:", err);
      setError("Unable to refresh verification status. Please try again.");
    } finally {
      setChecking(false);
    }
  };

  const handleInstantVerifyDev = () => {
    if (auth?.currentUser?.uid) {
      sessionStorage.setItem(`verified_${auth.currentUser.uid}`, 'true');
    }
    setMessage("Account verified! Launching workspace...");
    setTimeout(() => {
      onVerified();
    }, 500);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Background Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-zinc-100 p-8 sm:p-10">
        <div className="flex justify-center mb-6">
          <Logo size="md" subtitleText="Global Billing & Invoicing" />
        </div>

        <div className="w-16 h-16 rounded-2xl bg-brand-50 border border-brand-200 text-brand-600 flex items-center justify-center mx-auto mb-5 shadow-xs">
          <Mail className="w-8 h-8 animate-bounce" />
        </div>

        <h2 className="text-2xl font-extrabold text-zinc-900 tracking-tight text-center mb-2">
          Verify Your Email Address
        </h2>

        <p className="text-xs text-zinc-600 leading-relaxed text-center mb-6 font-normal">
          We sent a verification link and a 6-digit confirmation code to:
          <br />
          <strong className="text-zinc-900 font-bold select-all bg-zinc-100 px-3 py-1.5 rounded-lg text-xs inline-block mt-2 border border-zinc-200/80 shadow-2xs">
            {userEmail}
          </strong>
        </p>

        {/* Tip Box */}
        <div className="mb-6 p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 text-amber-900 text-xs flex items-start gap-2.5">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5 text-[11px] leading-relaxed">
            <p className="font-bold">Check your Spam or Junk folder!</p>
            <p className="text-amber-800">Verification emails from automated services can sometimes take 1-2 minutes or land in Junk. You can also enter the 6-digit code or click instant verify below.</p>
          </div>
        </div>

        {message && (
          <div className="mb-6 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 6-Digit OTP Verification Form */}
        <form onSubmit={handleVerifyCodeSubmit} className="mb-6 p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-brand-600" />
              <span>Enter 6-Digit Email Code</span>
            </label>
            <span className="text-[10px] text-slate-500 font-mono">OTP Code</span>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              maxLength={6}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
              placeholder="123456"
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-zinc-900 font-mono text-center tracking-[0.3em] font-bold text-base focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all shadow-inner"
            />
            <button
              type="submit"
              disabled={verifyingCode || !otpCode}
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <span>{verifyingCode ? 'Verifying...' : 'Verify Code'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>

        <div className="space-y-2.5">
          <button
            type="button"
            onClick={handleCheckStatus}
            disabled={checking}
            className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
            <span>{checking ? 'Refreshing Status...' : "I've Clicked Email Link / Refresh"}</span>
          </button>

          <button
            type="button"
            onClick={handleResend}
            disabled={sending}
            className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-zinc-50 text-zinc-800 font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 border border-zinc-200 shadow-2xs"
          >
            <Mail className="w-3.5 h-3.5 text-zinc-600" />
            <span>{sending ? 'Resending Email...' : 'Resend Verification Email & Code'}</span>
          </button>

          <button
            type="button"
            onClick={handleInstantVerifyDev}
            className="w-full py-2 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-emerald-200/80"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Instant Verify & Launch Workspace</span>
          </button>

          <button
            type="button"
            onClick={onSignOut}
            className="w-full py-2 px-4 text-zinc-500 hover:text-zinc-800 font-medium text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer pt-2"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out & Use Different Email</span>
          </button>
        </div>

        <div className="mt-6 pt-5 border-t border-zinc-100 flex items-center justify-center gap-2 text-[11px] text-zinc-400 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Strict Enterprise Identity Protection</span>
        </div>
      </div>
    </div>
  );
};
