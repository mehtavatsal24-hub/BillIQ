import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Smartphone, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  RefreshCw, 
  X 
} from 'lucide-react';
import { MultiFactorResolver, MultiFactorInfo, User } from 'firebase/auth';
import { sendMfaSignInCode, resolveMfaChallenge } from '../services/mfaService';

interface MfaChallengeModalProps {
  resolver: MultiFactorResolver;
  hints?: MultiFactorInfo[];
  onSuccess: (user: User) => void;
  onCancel: () => void;
}

export const MfaChallengeModal: React.FC<MfaChallengeModalProps> = ({
  resolver,
  hints = resolver.hints || [],
  onSuccess,
  onCancel
}) => {
  const [selectedHintIndex, setSelectedHintIndex] = useState<number>(0);
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [smsCode, setSmsCode] = useState<string>('');
  const [sendingCode, setSendingCode] = useState<boolean>(false);
  const [verifyingCode, setVerifyingCode] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [codeSent, setCodeSent] = useState<boolean>(false);

  const selectedHint = hints[selectedHintIndex] || hints[0];
  const phoneHint = (selectedHint as any)?.phoneNumber || 'enrolled mobile phone';

  const handleSendSmsCode = async () => {
    setError(null);
    setSendingCode(true);
    try {
      const vId = await sendMfaSignInCode(resolver, selectedHintIndex);
      setVerificationId(vId);
      setCodeSent(true);
    } catch (err: any) {
      console.error('Error sending MFA sign-in SMS code:', err);
      const msg = err?.message || '';
      if (msg.includes('captcha') || err?.code === 'auth/captcha-check-failed') {
        setError('Security check failed. Click "Resend Code" to try again.');
      } else if (msg.includes('quota') || err?.code === 'auth/quota-exceeded') {
        setError('SMS quota exceeded. Please try again later.');
      } else {
        setError(msg || 'Failed to send SMS code. Please try again.');
      }
    } finally {
      setSendingCode(false);
    }
  };

  useEffect(() => {
    handleSendSmsCode();
  }, [selectedHintIndex]);

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationId) {
      setError('SMS code session expired. Please click "Resend Code".');
      return;
    }

    const cleanCode = smsCode.trim();
    if (!cleanCode || cleanCode.length < 6) {
      setError('Please enter the 6-digit SMS code.');
      return;
    }

    setError(null);
    setVerifyingCode(true);

    try {
      const user = await resolveMfaChallenge(resolver, verificationId, cleanCode);
      onSuccess(user);
    } catch (err: any) {
      console.error('Error resolving MFA sign-in challenge:', err);
      const msg = err?.message || '';
      if (msg.includes('invalid-verification-code') || err?.code === 'auth/invalid-verification-code') {
        setError('Invalid 6-digit SMS verification code. Please check your text message and try again.');
      } else {
        setError(msg || 'MFA verification failed. Please check the code and try again.');
      }
    } finally {
      setVerifyingCode(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-6 relative space-y-5 animate-in fade-in zoom-in duration-150">
        <button
          onClick={onCancel}
          type="button"
          className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400 rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              2-Step Verification
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Enter the 6-digit code sent via SMS to verify your identity.
            </p>
          </div>
        </div>

        {/* Selected Phone Factor Badge */}
        <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-zinc-700 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-zinc-500" />
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">Phone: {phoneHint}</span>
          </div>
          {hints.length > 1 && (
            <select
              value={selectedHintIndex}
              onChange={(e) => setSelectedHintIndex(Number(e.target.value))}
              className="text-xs bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2 py-1"
            >
              {hints.map((h, i) => (
                <option key={h.uid} value={i}>
                  {(h as any).phoneNumber || `Factor ${i + 1}`}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* OTP Input Form */}
        <form onSubmit={handleVerifyCode} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              6-Digit Verification Code
            </label>
            <input
              type="text"
              maxLength={6}
              placeholder="123456"
              value={smsCode}
              onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, ''))}
              className="w-full text-center tracking-widest text-xl font-mono px-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none dark:text-zinc-100"
              autoFocus
              required
            />
          </div>

          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handleSendSmsCode}
              disabled={sendingCode || verifyingCode}
              className="px-3.5 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${sendingCode ? 'animate-spin' : ''}`} />
              {sendingCode ? 'Sending SMS...' : 'Resend Code'}
            </button>

            <button
              type="submit"
              disabled={verifyingCode || smsCode.length < 6}
              className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {verifyingCode ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Verify & Sign In
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
