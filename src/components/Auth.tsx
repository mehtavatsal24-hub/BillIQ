import React, { useState, useEffect } from 'react';
import { Logo } from './Logo';
import { signUpWithEmail, signInWithEmail, sendPasswordReset, validateEmailStrict, signInWithGoogleToken } from '../services/auth';
import { PrivacyPolicy } from './PrivacyPolicy';
import { TermsAndConditions } from './TermsAndConditions';
import { CookiePolicy } from './CookiePolicy';
import { isDeveloperAccount, formatDetailedDeveloperError, getDisplayErrorMessage } from '../utils/errorUtils';
import { 
  Shield, 
  Zap, 
  Lock, 
  Mail, 
  User as UserIcon, 
  AlertCircle, 
  ArrowRight, 
  ExternalLink,
  Loader2,
  X,
  Check,
  CheckCircle2
} from 'lucide-react';

interface AuthProps {
  onSuccess?: () => void;
  initialSignUp?: boolean;
  onBackToLanding?: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onSuccess, initialSignUp = false, onBackToLanding }) => {
  const [isSignUp, setIsSignUp] = useState(initialSignUp);
  
  // Form State
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Terms State
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [activePolicyModal, setActivePolicyModal] = useState<'terms' | 'privacy' | 'cookie' | null>(null);

  // UI State
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetCooldown, setResetCooldown] = useState<number>(0);

  // Cooldown countdown timer for password reset emails to prevent spamming
  useEffect(() => {
    if (resetCooldown <= 0) return;
    const timer = setInterval(() => {
      setResetCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resetCooldown]);

  // Dedicated Render Function for Google Sign-In Button
  const renderGoogleButton = () => {
    if ((window as any).google?.accounts?.id) {
      try {
        (window as any).google.accounts.id.initialize({
          client_id: "70732456690-opps54bf5cjchdrp0atedqdf4h29cc7k.apps.googleusercontent.com",
          callback: async (response: any) => {
            if (response.credential) {
              setLoading(true);
              setError(null);
              try {
                const res = await signInWithGoogleToken(response.credential);
                if (res && onSuccess) onSuccess();
              } catch (err: any) {
                setError(getDisplayErrorMessage(err, email));
              } finally {
                setLoading(false);
              }
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        const container = document.getElementById("googleSignInDiv");
        if (container) {
          container.innerHTML = ""; // Clear existing content
          (window as any).google.accounts.id.renderButton(container, {
            theme: "outline",
            size: "large",
            width: 320,
            text: "continue_with",
          });
        }
      } catch (e) {
        console.warn("Google button render retry...", e);
      }
    }
  };

  // Google Sign-In Dynamic Script Loading and Polling Trigger
  useEffect(() => {
    let attempts = 0;
    renderGoogleButton();

    const interval = setInterval(() => {
      attempts++;
      renderGoogleButton();
      if ((window as any).google?.accounts?.id || attempts >= 10) {
        clearInterval(interval);
      }
    }, 300);

    return () => clearInterval(interval);
  }, [isSignUp]);

  const clearForm = (preserveEmail = false) => {
    setUsername('');
    if (!preserveEmail) setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError(null);
    setInfoMessage(null);
    setAcceptedTerms(false);
  };

  const handleToggleMode = (signUpMode: boolean) => {
    setIsSignUp(signUpMode);
    clearForm(true); // Preserve email/username address when switching between Sign In and Sign Up
  };

  const handleForgotPassword = async () => {
    if (loading || resetCooldown > 0) return;
    if (!email.trim()) {
      setError('Please enter your email address or username above to request a password reset.');
      return;
    }
    setError(null);
    setInfoMessage(null);
    setLoading(true);
    try {
      const targetEmail = await sendPasswordReset(email.trim());
      setInfoMessage(`Password reset link sent to ${targetEmail}. Please check your primary inbox (or spam/promotions folder) to reset your password.`);
      setResetCooldown(60);
    } catch (err: any) {
      console.error("Password reset error:", err);
      if (isDeveloperAccount(email)) {
        setError(formatDetailedDeveloperError(err));
      } else {
        setError('An error occurred. Please try again or contact support.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);

    if (!acceptedTerms) {
      setError('Please accept the Terms of Service and Privacy Policy to proceed.');
      return;
    }

    if (isSignUp || email.trim().includes('@')) {
      const emailValidation = validateEmailStrict(email);
      if (!emailValidation.isValid) {
        setError(emailValidation.error || 'Please enter a valid and active email address.');
        return;
      }
    }

    if (isSignUp) {
      if (!username.trim()) {
        setError('Please enter a username or full name.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
      }
    }

    setLoading(true);

    try {
      if (isSignUp) {
        await signUpWithEmail(email.trim(), password, username.trim());
      } else {
        await signInWithEmail(email.trim(), password);
      }
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.warn("Auth submit notice:", err?.message || err);
      if (isDeveloperAccount(email)) {
        setError(formatDetailedDeveloperError(err));
      } else {
        const code = err?.code || "";
        const msg = err?.message || "";

        if (msg.includes('ACCOUNT_DELETED')) {
          alert('This account was deleted by an administrator. Please create a new account.');
          setIsSignUp(true);
          setError('This account was deleted by an administrator. Please create a new account.');
        } else if (msg.includes('Username is already taken')) {
          setError('Username is already taken. Please pick a different username, or switch to Sign In if you already created this account.');
        } else if (code === 'auth/email-already-in-use' || msg.includes('email-already-in-use')) {
          setIsSignUp(false);
          setError('An account with this email address already exists. We have switched you to Sign In mode — please enter your password to log in, or click "Forgot Password?" below to reset it.');
        } else if (code === 'auth/invalid-email' || msg.includes('invalid-email')) {
          setError('Invalid email address format. If using a username, ensure you sign in with your registered username or email.');
        } else if (
          code === 'auth/wrong-password' || 
          code === 'auth/user-not-found' || 
          code === 'auth/invalid-credential' || 
          msg.includes('invalid-credential') ||
          msg.includes('user-not-found') ||
          msg.includes('wrong-password')
        ) {
          setError('Invalid email/username or password. Please verify your credentials, or click below to reset your password or create a new account.');
        } else {
          setError('An error occurred. Please try again or contact support.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const isSubmitDisabled = loading || !acceptedTerms;

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Background Decorator Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-zinc-100 grid grid-cols-1 md:grid-cols-12 min-h-[520px]">
        {/* Left / Top Side Brand Hero Panel */}
        <div className="md:col-span-5 bg-gradient-to-br from-brand-600 via-brand-700 to-indigo-800 p-8 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <div className="mb-8">
              <Logo size="lg" variant="white" subtitleText="Secure Cloud Workspace" />
            </div>

            <h3 className="text-2xl font-bold tracking-tight mb-3">
              {isSignUp ? "Start Your Journey" : "Welcome Back!"}
            </h3>
            <p className="text-sm text-brand-100 leading-relaxed">
              {isSignUp
                ? "Create an account to securely sync invoices, customer directories, and business records across all your devices."
                : "Sign in to access your isolated business dashboard, customer lists, tax documents, and real-time cloud data."
              }
            </p>
          </div>

          <div className="relative z-10 mt-8 pt-6 border-t border-white/10">
            <div className="flex items-center gap-3 text-xs text-brand-100 font-medium">
              <Zap className="w-4 h-4 text-brand-300 shrink-0" />
              <span>Strict Data Isolation: Your records are strictly private and never shared with other accounts.</span>
            </div>
          </div>

          {/* Decorative background circle */}
          <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-white/5 rounded-full blur-xl pointer-events-none" />
        </div>

        {/* Right Side Form Panel */}
        <div className="md:col-span-7 p-6 sm:p-10 flex flex-col justify-center bg-white relative">
          {/* Header Action Bar */}
          <div className="flex items-center justify-between gap-3 mb-5">
            {onBackToLanding ? (
              <button
                type="button"
                onClick={onBackToLanding}
                className="text-xs font-semibold text-zinc-600 hover:text-brand-600 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 transition-all cursor-pointer shadow-2xs"
              >
                ← Back to Home
              </button>
            ) : <div />}
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              {isSignUp ? "New Account" : "Secure Login"}
            </span>
          </div>

          {/* Tab Switcher Header */}
          <div className="flex bg-zinc-100 p-1 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => handleToggleMode(false)}
              className={`flex-1 py-2.5 text-center text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer ${
                !isSignUp
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => handleToggleMode(true)}
              className={`flex-1 py-2.5 text-center text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer ${
                isSignUp
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              Sign Up
            </button>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-bold text-zinc-900 tracking-tight">
              {isSignUp ? 'Create an Account' : 'Sign In to Your Workspace'}
            </h2>
            <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
              <span>{isSignUp ? 'Fill in your details below to get started' : 'Enter your credentials to manage your business'}</span>
            </p>
          </div>

          {infoMessage && (
            <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col gap-2">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-xs text-emerald-800 font-medium leading-relaxed">{infoMessage}</p>
              </div>
              {infoMessage.includes("Password reset link sent") && (
                <div className="mt-1 pt-2 border-t border-emerald-200/60 flex items-center justify-between text-xs font-semibold text-emerald-900">
                  <span className="text-[11px] text-emerald-700 font-medium">
                    {resetCooldown > 0
                      ? `Didn't receive it? Check spam or resend in ${resetCooldown}s`
                      : "Didn't receive it? Check spam or resend link below"}
                  </span>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={loading || resetCooldown > 0}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-900 underline disabled:opacity-50 disabled:no-underline cursor-pointer disabled:cursor-not-allowed shrink-0 ml-2"
                  >
                    {loading ? "Sending..." : resetCooldown > 0 ? `${resetCooldown}s` : "Resend Link"}
                  </button>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex flex-col gap-2">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-xs text-red-700 font-medium leading-relaxed">{error}</p>
              </div>
              {(error.includes("already exists") || error.includes("Switched to Sign In") || error.includes("Try signing in")) && (
                <div className="mt-1 flex flex-wrap gap-2 pl-6">
                  <button
                    type="button"
                    onClick={() => {
                      if (isSignUp) {
                        handleToggleMode(false);
                      } else if (email && password) {
                        signInWithEmail(email.trim(), password)
                          .then(() => {
                            if (onSuccess) onSuccess();
                          })
                          .catch((e: any) => {
                            console.error("Sign in failed:", e);
                            setError(getDisplayErrorMessage(e, email, 'Invalid password. Please check your credentials.'));
                          });
                      } else {
                        handleToggleMode(false);
                      }
                    }}
                    className="text-xs font-bold text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200 px-3 py-1 rounded-lg transition-colors cursor-pointer"
                  >
                    {!isSignUp && email && password ? "Sign In Now" : "Switch to Sign In"}
                  </button>
                </div>
              )}
              {(error.includes("Invalid email/username") || error.includes("credentials") || error.includes("reset your password")) && (
                <div className="mt-1 flex flex-wrap gap-2 pl-6">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={loading || resetCooldown > 0}
                    className="text-xs font-bold text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200 px-3 py-1 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Sending..." : resetCooldown > 0 ? `Resend in ${resetCooldown}s` : "Forgot Password / Reset Link"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleMode(!isSignUp)}
                    className="text-xs font-bold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 px-3 py-1 rounded-lg transition-colors cursor-pointer"
                  >
                    {isSignUp ? "Switch to Sign In" : "Create New Account"}
                  </button>
                </div>
              )}
              {(error.includes("network") || error.includes("iframe") || error.includes("popup") || error.includes("unauthorized") || error.includes("domain")) && (
                <div className="mt-1 flex flex-wrap gap-2 pl-6">
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setIsSignUp(false);
                    }}
                    className="text-xs font-bold text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200 px-3 py-1 rounded-lg transition-colors cursor-pointer"
                  >
                    Use Email & Password
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.hostname);
                      if (isDeveloperAccount(email)) {
                        alert(`Copied domain: ${window.location.hostname}\n\nPaste this in Firebase Console > Authentication > Settings > Authorized domains.`);
                      } else {
                        alert(`Copied domain: ${window.location.hostname}`);
                      }
                    }}
                    className="text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1 rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                  >
                    Copy Domain ({window.location.hostname})
                  </button>
                  <a
                    href={window.location.href}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 px-3 py-1 rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                  >
                    Open in New Tab <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Prominent Native Google Sign-In Container */}
          <div className="mb-5 flex flex-col items-center">
            <div id="googleSignInDiv" className="w-full flex justify-center min-h-[44px]"></div>
            <div className="relative w-full flex items-center justify-center mt-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-200" />
              </div>
              <div className="relative bg-white px-3 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Or continue with
              </div>
            </div>
          </div>

          {/* Main Email Auth Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {isSignUp && (
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Username / Full Name</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-900 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                {isSignUp ? 'Email Address' : 'Email Address or Username'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
                <input
                  type={isSignUp ? "email" : "text"}
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={isSignUp ? "you@example.com" : "you@example.com or username"}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-900 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-zinc-700">Password</label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={loading || resetCooldown > 0}
                    className="text-[11px] font-medium text-brand-600 hover:text-brand-700 hover:underline cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading
                      ? "Sending..."
                      : resetCooldown > 0
                      ? `Resend in ${resetCooldown}s`
                      : "Forgot Password?"}
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-900 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                />
              </div>
            </div>

            {isSignUp && (
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Confirm Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-900 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                  />
                </div>
              </div>
            )}

            {/* Terms & Conditions Checkbox */}
            <div className="flex items-start gap-2.5 pt-2">
              <input
                type="checkbox"
                id="termsCheck"
                checked={acceptedTerms}
                onChange={(e) => {
                  setAcceptedTerms(e.target.checked);
                  if (error && error.includes('Terms of Service')) setError(null);
                }}
                className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-brand-600 focus:ring-brand-500 cursor-pointer accent-brand-600"
              />
              <label htmlFor="termsCheck" className="text-xs text-zinc-600 leading-normal select-none">
                I accept the{' '}
                <button
                  type="button"
                  onClick={() => setActivePolicyModal('terms')}
                  className="font-bold text-brand-600 hover:underline cursor-pointer inline-block"
                >
                  Terms of Service
                </button>
                ,{' '}
                <button
                  type="button"
                  onClick={() => setActivePolicyModal('privacy')}
                  className="font-bold text-brand-600 hover:underline cursor-pointer inline-block"
                >
                  Privacy Policy
                </button>
                , and{' '}
                <button
                  type="button"
                  onClick={() => setActivePolicyModal('cookie')}
                  className="font-bold text-brand-600 hover:underline cursor-pointer inline-block"
                >
                  Cookie Policy
                </button>
                .
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitDisabled}
              className={`w-full py-3 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 mt-2 ${
                isSubmitDisabled
                  ? 'bg-zinc-200 text-zinc-400 shadow-none cursor-not-allowed border border-zinc-200'
                  : 'bg-brand-600 hover:bg-brand-700 text-white shadow-brand-500/20 cursor-pointer'
              }`}
            >
              {loading ? (
                <span>Processing...</span>
              ) : (
                <>
                  <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Mode Switch Prompt Footer */}
          <div className="mt-6 text-center pt-4 border-t border-zinc-100">
            {isSignUp ? (
              <p className="text-xs text-zinc-500">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => handleToggleMode(false)}
                  className="font-bold text-brand-600 hover:text-brand-700 transition-colors cursor-pointer"
                >
                  Sign In
                </button>
              </p>
            ) : (
              <p className="text-xs text-zinc-500">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => handleToggleMode(true)}
                  className="font-bold text-brand-600 hover:text-brand-700 transition-colors cursor-pointer"
                >
                  Sign Up
                </button>
              </p>
            )}
            <p className="mt-4 text-[11px] text-zinc-400 leading-relaxed max-w-sm mx-auto">
              Disclaimer: BillIQ is 98% accurate and can make mistakes. Please verify important tax, HSN/SAC, and multi-currency values before official filing.
            </p>
          </div>
        </div>
      </div>

      {/* Policy View Modal */}
      {activePolicyModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl p-6 md:p-8 my-8 max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setActivePolicyModal(null)}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-800 rounded-xl hover:bg-zinc-100 transition-colors z-10 cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
            {activePolicyModal === 'terms' ? (
              <TermsAndConditions onBack={() => setActivePolicyModal(null)} />
            ) : activePolicyModal === 'cookie' ? (
              <CookiePolicy onBack={() => setActivePolicyModal(null)} />
            ) : (
              <PrivacyPolicy onBack={() => setActivePolicyModal(null)} />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
