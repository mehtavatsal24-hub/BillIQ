import React, { useState } from "react";
import { ArrowRight, Eye, EyeOff, Loader2, LockKeyhole, Mail, UserPlus } from "lucide-react";
import { handleEmailSignIn, handleEmailSignUp, signInWithGoogleToken, sendPasswordReset } from "../services/auth";

interface AuthProps {
  initialSignUp?: boolean;
  onBack?: () => void;
}

const firebaseErrorMessage = (error: any) => {
  const code = String(error?.code || "");
  const message = String(error?.message || "");
  if (message.includes("requested action is invalid") || code.includes("invalid-action") || code.includes("operation-not-allowed")) {
    return "Google Sign-In is not enabled yet in your Firebase project. Please enable Google in Firebase Console → Authentication → Sign-in method → Google → Enable → Save.";
  }
  if (code.includes("email-already-in-use")) return "An account already exists with this email. Please sign in.";
  if (code.includes("invalid-credential") || code.includes("wrong-password") || code.includes("user-not-found")) return "Email or password is incorrect.";
  if (code.includes("weak-password")) return "Password must be at least 6 characters.";
  if (code.includes("popup-closed-by-user")) return "Google sign-in was cancelled.";
  if (code.includes("unauthorized-domain")) return "This website domain is not enabled in Firebase Authentication settings.";
  return error?.message || "Authentication failed. Please try again.";
};

export const Auth: React.FC<AuthProps> = ({ initialSignUp = false, onBack }) => {
  const [isSignUp, setIsSignUp] = useState(initialSignUp);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetSent, setResetSent] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setResetSent(false);
    if (!email.trim() || !password) {
      setError("Enter your email and password to continue.");
      return;
    }
    if (isSignUp && !name.trim()) {
      setError("Enter your name to create an account.");
      return;
    }

    setIsLoading(true);
    try {
      if (isSignUp) await handleEmailSignUp(email, password, name);
      else await handleEmailSignIn(email, password);
    } catch (authError) {
      setError(firebaseErrorMessage(authError));
    } finally {
      setIsLoading(false);
    }
  };

  const signInGoogle = async () => {
    setError("");
    setIsLoading(true);
    try {
      await signInWithGoogleToken();
    } catch (authError) {
      setError(firebaseErrorMessage(authError));
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async () => {
    setError("");
    setResetSent(false);
    if (!email.trim()) {
      setError("Enter your email address first.");
      return;
    }
    setIsLoading(true);
    try {
      await sendPasswordReset(email);
      setResetSent(true);
    } catch (authError) {
      setError(firebaseErrorMessage(authError));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 px-4 py-10 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-5xl items-center justify-center">
        <section className="grid w-full overflow-hidden rounded-3xl border border-white/10 bg-white shadow-2xl md:grid-cols-2">
          <div className="hidden bg-gradient-to-br from-blue-700 via-indigo-700 to-slate-950 p-10 md:flex md:flex-col md:justify-between">
            <div>
              <div className="mb-10 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-white">
                <LockKeyhole className="h-6 w-6" />
              </div>
              <p className="mb-3 text-xs font-black uppercase tracking-[0.24em] text-blue-200">BillIQ Workspace</p>
              <h1 className="text-4xl font-black leading-tight">Your billing desk, kept private.</h1>
              <p className="mt-5 max-w-sm text-sm leading-7 text-blue-100">Create invoices, manage export documents, and keep every business record inside your own account.</p>
            </div>
            <div className="text-xs font-semibold text-blue-200">Secure account access powered by Firebase</div>
          </div>

          <div className="p-6 text-slate-900 sm:p-10">
            <div className="mb-8">
              <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-blue-600">{isSignUp ? "New workspace" : "Welcome back"}</p>
              <h2 className="text-3xl font-black tracking-tight">{isSignUp ? "Create your account" : "Sign in to BillIQ"}</h2>
              <p className="mt-2 text-sm text-slate-500">{isSignUp ? "Start building your private billing workspace." : "Continue to your private billing workspace."}</p>
            </div>

            <button type="button" onClick={signInGoogle} disabled={isLoading} className="mb-5 flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 disabled:opacity-60">
              <span className="text-lg font-black text-blue-600">G</span>
              Continue with Google
            </button>

            <div className="mb-5 flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-slate-400"><span className="h-px flex-1 bg-slate-200" /> or email <span className="h-px flex-1 bg-slate-200" /></div>

            <form onSubmit={submit} className="space-y-4">
              {isSignUp && <label className="block text-xs font-bold text-slate-600">Name<input value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5 h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100" placeholder="Your name" /></label>}
              <label className="block text-xs font-bold text-slate-600">Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5 h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100" placeholder="you@company.com" autoComplete="email" /></label>
              <label className="block text-xs font-bold text-slate-600">Password<div className="relative mt-1.5"><input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 w-full rounded-xl border border-slate-200 px-4 pr-12 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100" placeholder="At least 6 characters" autoComplete={isSignUp ? "new-password" : "current-password"} /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-3 p-1 text-slate-400" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button></div></label>

              {error && <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">{error}</p>}
              {resetSent && <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-700">Password reset email sent. Check your inbox.</p>}

              <button type="submit" disabled={isLoading} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 text-sm font-black text-white transition hover:bg-blue-700 disabled:opacity-60">{isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : isSignUp ? <UserPlus className="h-4 w-4" /> : <Mail className="h-4 w-4" />}{isSignUp ? "Create Account" : "Sign In"}<ArrowRight className="h-4 w-4" /></button>
            </form>

            {!isSignUp && <button type="button" onClick={resetPassword} disabled={isLoading} className="mt-4 w-full text-center text-xs font-bold text-blue-600 hover:underline">Forgot password?</button>}
            <div className="mt-8 border-t border-slate-100 pt-6 text-center text-xs text-slate-500">{isSignUp ? "Already have an account?" : "New to BillIQ?"} <button type="button" onClick={() => { setIsSignUp((value) => !value); setError(""); }} className="font-black text-blue-600 hover:underline">{isSignUp ? "Sign in" : "Create an account"}</button></div>
            {onBack && <button type="button" onClick={onBack} className="mt-4 w-full text-center text-xs font-bold text-slate-400 hover:text-slate-700">Back to home</button>}
          </div>
        </section>
      </div>
    </main>
  );
};
