import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Smartphone, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Trash2, 
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { auth } from '../services/firebase';
import { 
  startMfaEnrollment, 
  finalizeMfaEnrollment, 
  getEnrolledMfaFactors, 
  unenrollMfaFactor
} from '../services/mfaService';
import { MultiFactorInfo } from 'firebase/auth';

interface MfaSettingsProps {
  onStatusChange?: () => void;
}

export const MfaSettings: React.FC<MfaSettingsProps> = ({ onStatusChange }) => {
  const [enrolledFactors, setEnrolledFactors] = useState<MultiFactorInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isEnrolling, setIsEnrolling] = useState<boolean>(false);
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [smsCode, setSmsCode] = useState<string>('');
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [step, setStep] = useState<'IDLE' | 'PHONE_INPUT' | 'OTP_INPUT' | 'SUCCESS'>('IDLE');
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const currentUser = auth?.currentUser;

  const refreshMfaStatus = () => {
    if (currentUser) {
      const factors = getEnrolledMfaFactors(currentUser);
      setEnrolledFactors(factors);
    } else {
      setEnrolledFactors([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    refreshMfaStatus();
  }, [currentUser]);

  const handleStartEnrollment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!currentUser) {
      setError('You must be signed in to configure 2-Step Verification.');
      return;
    }

    const cleanPhone = phoneNumber.trim().replace(/\s+/g, '');
    if (!cleanPhone || !cleanPhone.startsWith('+') || cleanPhone.length < 8) {
      setError('Please enter a valid phone number in international E.164 format including country code (e.g. +1234567890 or +919876543210).');
      return;
    }

    setActionLoading(true);
    try {
      const vId = await startMfaEnrollment(currentUser, cleanPhone);
      setVerificationId(vId);
      setStep('OTP_INPUT');
      setSuccessMsg('SMS verification code sent! Check your phone.');
    } catch (err: any) {
      console.error('Error starting MFA enrollment:', err);
      const msg = err?.message || '';
      if (msg.includes('invalid-phone-number') || err?.code === 'auth/invalid-phone-number') {
        setError('Invalid phone number format. Please include your country code (e.g., +1 for US/Canada, +91 for India).');
      } else if (msg.includes('captcha') || err?.code === 'auth/captcha-check-failed') {
        setError('Security check failed. Please refresh and try again.');
      } else if (msg.includes('quota-exceeded') || err?.code === 'auth/quota-exceeded') {
        setError('SMS quota exceeded for today. Please try again later.');
      } else {
        setError(msg || 'Failed to send SMS code. Please verify your phone number format and try again.');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmEnrollment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!currentUser || !verificationId) {
      setError('Session expired. Please start enrollment again.');
      setStep('PHONE_INPUT');
      return;
    }

    const cleanCode = smsCode.trim();
    if (!cleanCode || cleanCode.length < 6) {
      setError('Please enter the 6-digit SMS verification code.');
      return;
    }

    setActionLoading(true);
    try {
      await finalizeMfaEnrollment(currentUser, verificationId, cleanCode, 'Personal Mobile Phone');
      setSuccessMsg('2-Step Verification successfully enabled!');
      setStep('SUCCESS');
      refreshMfaStatus();
      if (onStatusChange) onStatusChange();
    } catch (err: any) {
      console.error('Error finalizing MFA enrollment:', err);
      const msg = err?.message || '';
      if (msg.includes('invalid-verification-code') || err?.code === 'auth/invalid-verification-code') {
        setError('Invalid 6-digit SMS code. Please check your text message and try again.');
      } else {
        setError(msg || 'Failed to verify code. Please try again.');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisableMfa = async (factor: MultiFactorInfo) => {
    if (!currentUser) return;
    if (!window.confirm('Are you sure you want to disable 2-Step Verification? Your account will no longer require SMS OTP during sign-in.')) {
      return;
    }

    setError(null);
    setSuccessMsg(null);
    setActionLoading(true);

    try {
      await unenrollMfaFactor(currentUser, factor);
      setSuccessMsg('2-Step Verification disabled successfully.');
      setStep('IDLE');
      setIsEnrolling(false);
      refreshMfaStatus();
      if (onStatusChange) onStatusChange();
    } catch (err: any) {
      console.error('Error disabling MFA:', err);
      setError(err?.message || 'Failed to disable 2-Step Verification. Try signing out and signing in again.');
    } finally {
      setActionLoading(false);
    }
  };

  const isMfaActive = enrolledFactors.length > 0;

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${isMfaActive ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400' : 'bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400'}`}>
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              2-Step Verification (SMS MFA)
              {isMfaActive ? (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  ACTIVE
                </span>
              ) : (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                  DISABLED
                </span>
              )}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Protect your account by requiring a 6-digit SMS verification code sent to your mobile phone during sign-in.
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Active Enrolled Phone Factors */}
      {isMfaActive && (
        <div className="space-y-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Enrolled Security Devices:</p>
          {enrolledFactors.map((factor) => (
            <div key={factor.uid} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-zinc-700">
              <div className="flex items-center gap-3">
                <Smartphone className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                <div>
                  <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                    {factor.displayName || 'Mobile Phone'}
                  </div>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                    {(factor as any).phoneNumber || 'SMS OTP Enabled'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleDisableMfa(factor)}
                disabled={actionLoading}
                type="button"
                className="px-3 py-1.5 text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-950/50 dark:hover:bg-red-900/50 dark:text-red-300 rounded-lg transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Disable 2FA
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Start Enrollment Action or Enrollment Form */}
      {!isMfaActive && step === 'IDLE' && (
        <div className="pt-2">
          <button
            onClick={() => {
              setStep('PHONE_INPUT');
              setIsEnrolling(true);
            }}
            type="button"
            className="w-full sm:w-auto px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Lock className="w-4 h-4" />
            Enable 2-Step Verification Now
          </button>
        </div>
      )}

      {/* Step 1: Input Phone Number */}
      {step === 'PHONE_INPUT' && (
        <form onSubmit={handleStartEnrollment} className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-brand-600" />
              Step 1: Enter Mobile Phone Number
            </h4>
            <button
              type="button"
              onClick={() => { setStep('IDLE'); setIsEnrolling(false); setError(null); }}
              className="text-[11px] text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
              Mobile Phone Number (E.164 format with country code)
            </label>
            <input
              type="tel"
              placeholder="e.g. +1234567890 or +919876543210"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none dark:text-zinc-100"
              required
            />
            <p className="text-[10px] text-zinc-400 mt-1">
              Must start with <code className="bg-zinc-200 dark:bg-zinc-800 px-1 py-0.5 rounded">+</code> followed by country code and mobile number without spaces or dashes.
            </p>
          </div>

          <button
            type="submit"
            disabled={actionLoading || !phoneNumber.trim()}
            className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {actionLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending SMS Code...
              </>
            ) : (
              <>
                Send SMS Code
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      )}

      {/* Step 2: Input SMS OTP */}
      {step === 'OTP_INPUT' && (
        <form onSubmit={handleConfirmEnrollment} className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Step 2: Verify 6-Digit SMS Code
            </h4>
            <button
              type="button"
              onClick={() => { setStep('PHONE_INPUT'); setError(null); }}
              className="text-[11px] text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
            >
              Back
            </button>
          </div>

          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            Enter the 6-digit verification code sent to <strong className="text-zinc-900 dark:text-zinc-100 font-mono">{phoneNumber}</strong>:
          </p>

          <div>
            <input
              type="text"
              maxLength={6}
              placeholder="123456"
              value={smsCode}
              onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, ''))}
              className="w-full text-center tracking-widest text-lg font-mono px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-zinc-100"
              required
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={actionLoading || smsCode.length < 6}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying Code...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Confirm & Enable 2FA
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
