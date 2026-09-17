"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/auth/client";
import { Loader2, Mail, Lock, ArrowRight, Sparkles } from "lucide-react";

const DEMO_SESSION_COOKIE = "prove_demo_session";
const DEMO_EMAIL = "candidate@prove.dev";
const DEMO_PASSWORD = "ProveCandidate2026!";

function setDemoSession() {
  const expiry = new Date(Date.now() + 1000 * 60 * 60 * 24).toUTCString();
  document.cookie = `${DEMO_SESSION_COOKIE}=active; path=/; expires=${expiry}; SameSite=Lax`;
  window.localStorage.setItem("prove-demo-user", JSON.stringify({
    email: DEMO_EMAIL,
    name: "Vinay Kumar",
  }));
}

function isDemoLogin(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  return (
    (normalizedEmail === DEMO_EMAIL || normalizedEmail === "vinay@prove.dev") &&
    password === DEMO_PASSWORD
  );
}

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in both email and password.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const demoLogin = isDemoLogin(email, password);
      if (demoLogin) {
        setDemoSession();
        router.push("/dashboard");
        return;
      }

      const res = await signIn.email({
        email,
        password,
      });

      if (res?.error) {
        const authError = res.error.message || "Failed to sign in. Please verify your credentials.";
        if (/404|NotFound|missing authentication credentials|JWT|authorization bearer token/i.test(authError)) {
          if (isDemoLogin(email, password)) {
            setDemoSession();
            router.push("/dashboard");
            return;
          }
          setError("Authentication backend is unavailable in local dev mode. Use the demo credentials or configure Neon Auth.");
        } else {
          setError(authError);
        }
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      const message = err?.message || "An unexpected error occurred. Please try again.";
      if (/404|NotFound|missing authentication credentials|JWT|authorization bearer token/i.test(message)) {
        if (isDemoLogin(email, password)) {
          setDemoSession();
          router.push("/dashboard");
          return;
        }
        setError("Authentication backend is unavailable in local dev mode. Use the demo credentials or configure Neon Auth.");
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      setError(null);
      await signIn.social({
        provider: "google",
        callbackURL: `${window.location.origin}/dashboard`,
      });
    } catch (err: any) {
      setError(err?.message || "Failed to connect with Google.");
      setGoogleLoading(false);
    }
  };

  const handleQuickDemoAccess = () => {
    setEmail("vinay@prove.dev");
    setPassword("ProveCandidate2026!");
  };

  return (
    <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-8 rounded-2xl shadow-2xl shadow-black/50">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">Sign In to PROVE</h1>
        <p className="text-sm text-slate-400 mt-1">
          Access your verified proof portfolio, evidence runs, and candidate core.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm">
          {error}
        </div>
      )}

      {/* Google OAuth Button */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={googleLoading || loading}
        className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-750 hover:border-slate-700 text-slate-200 border border-slate-750 rounded-xl font-medium text-sm flex items-center justify-center gap-3 transition duration-150 disabled:opacity-50 cursor-pointer"
      >
        {googleLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
        ) : (
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
            />
            <path
              fill="#4285F4"
              d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
            />
            <path
              fill="#FBBC05"
              d="M5.6 14.8c-.3-.8-.4-1.8-.4-2.8s.1-2 .4-2.8L1.9 6.3C.7 8.7 0 11.3 0 14s.7 5.3 1.9 7.7l3.7-2.9z"
            />
            <path
              fill="#34A853"
              d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
            />
          </svg>
        )}
        Continue with Google
      </button>

      <div className="relative my-6 text-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-800" />
        </div>
        <span className="relative px-3 bg-slate-900 text-xs uppercase tracking-wider text-slate-500">
          Or with email
        </span>
      </div>

      <form onSubmit={handleEmailSignIn} className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-slate-300">
              Email Address
            </label>
            <button
              type="button"
              onClick={handleQuickDemoAccess}
              className="text-[10px] text-violet-400 hover:text-violet-300 flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" /> Quick fill demo
            </button>
          </div>
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="candidate@prove.dev"
              required
              className="w-full pl-10 pr-4 py-2 bg-slate-950/70 border border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl text-sm text-slate-100 placeholder-slate-600 outline-none transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full pl-10 pr-4 py-2 bg-slate-950/70 border border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl text-sm text-slate-100 placeholder-slate-600 outline-none transition"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || googleLoading}
          className="w-full mt-2 py-2.5 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium rounded-xl text-sm shadow-lg shadow-violet-600/25 flex items-center justify-center gap-2 transition duration-150 disabled:opacity-50 cursor-pointer"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              Sign In <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 text-center text-xs text-slate-400">
        Don&apos;t have an account?{" "}
        <Link
          href="/auth/sign-up"
          className="text-violet-400 hover:text-violet-300 font-medium underline underline-offset-4"
        >
          Create candidate profile
        </Link>
      </div>
    </div>
  );
}
