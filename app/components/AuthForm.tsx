"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";
import ThemePicker from "./ThemePicker";

type Props = {
  mode: "login" | "signup";
};

// Set to true after you enable the Google provider in Supabase
const GOOGLE_ENABLED: boolean = false;

function LogoMark({ onAccent }: { onAccent: boolean }) {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
      <circle
        cx="10"
        cy="14"
        r="8"
        className={onAccent ? "fill-current" : "fill-accent"}
      />
      <circle
        cx="18"
        cy="14"
        r="8"
        className={onAccent ? "fill-current opacity-60" : "fill-slate-900/85"}
      />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  );
}

function StudyIllustration() {
  return (
    <svg
      viewBox="0 0 420 290"
      className="h-auto w-full text-on-accent"
      role="img"
      aria-label="A laptop, a chat bubble, two students and a learning path with milestones"
    >
      {/* learning path */}
      <path
        d="M30 260 C 100 260, 130 200, 200 215 S 300 250, 390 190"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.5"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="2 9"
      />
      <circle cx="30" cy="260" r="10" fill="currentColor" />
      <path d="M25 260l4 4 7-8" fill="none" className="stroke-accent" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="200" cy="215" r="10" fill="currentColor" />
      <path d="M195 215l4 4 7-8" fill="none" className="stroke-accent" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="390" cy="190" r="12" fill="none" stroke="currentColor" strokeWidth="3" />
      <circle cx="390" cy="190" r="4" fill="currentColor" />

      {/* laptop */}
      <rect x="40" y="36" width="180" height="108" rx="10" fill="currentColor" fillOpacity="0.95" />
      <rect x="58" y="56" width="64" height="8" rx="4" className="fill-accent" />
      <rect x="58" y="74" width="120" height="8" rx="4" className="fill-accent" fillOpacity="0.55" />
      <rect x="54" y="92" width="152" height="16" rx="5" className="fill-accent" fillOpacity="0.2" />
      <rect x="58" y="96" width="96" height="8" rx="4" className="fill-accent" />
      <rect x="58" y="116" width="76" height="8" rx="4" className="fill-accent" fillOpacity="0.55" />
      <path d="M22 148h216l-14 16H36z" fill="currentColor" fillOpacity="0.7" />

      {/* chat bubble */}
      <rect x="248" y="26" width="140" height="58" rx="16" fill="currentColor" fillOpacity="0.2" />
      <path d="M268 84l-4 14 18-14z" fill="currentColor" fillOpacity="0.2" />
      <rect x="266" y="44" width="104" height="7" rx="3.5" fill="currentColor" fillOpacity="0.85" />
      <rect x="266" y="60" width="72" height="7" rx="3.5" fill="currentColor" fillOpacity="0.85" />

      {/* two study partners */}
      <circle cx="305" cy="128" r="11" fill="currentColor" fillOpacity="0.95" />
      <path d="M285 164a20 20 0 0 1 40 0z" fill="currentColor" fillOpacity="0.95" />
      <circle cx="351" cy="128" r="11" fill="currentColor" fillOpacity="0.6" />
      <path d="M331 164a20 20 0 0 1 40 0z" fill="currentColor" fillOpacity="0.6" />
    </svg>
  );
}

type FieldProps = {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  icon: React.ReactNode;
  autoComplete: string;
  minLength?: number;
  trailing?: React.ReactNode;
};

function Field({
  id,
  label,
  type,
  value,
  onChange,
  icon,
  autoComplete,
  minLength,
  trailing,
}: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          {icon}
        </span>
        <input
          id={id}
          type={type}
          required
          value={value}
          minLength={minLength}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 text-slate-900 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 ${
            trailing ? "pr-16" : "pr-3"
          }`}
        />
        {trailing}
      </div>
    </div>
  );
}

export default function AuthForm({ mode }: Props) {
  const isSignup = mode === "signup";
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const supabase = createClient();

      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name } },
        });
        if (error) {
          setIsError(true);
          setMessage(error.message);
        } else if (data.session) {
          router.push("/dashboard");
        } else {
          setIsError(false);
          setMessage("Account created! Please check your email to confirm.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          setIsError(true);
          setMessage(error.message);
        } else {
          router.push("/dashboard");
        }
      }
    } catch (err) {
      setIsError(true);
      setMessage(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setMessage("");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/dashboard` },
      });
      if (error) {
        setIsError(true);
        setMessage(error.message);
      }
    } catch (err) {
      setIsError(true);
      setMessage(err instanceof Error ? err.message : "Google sign-in failed.");
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-accent p-4 sm:p-8">
      {/* background circles */}
      <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-white/10" />

      <div className="relative grid w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl md:grid-cols-2">
        {/* Left panel */}
        <div className="relative hidden flex-col justify-between bg-accent p-10 text-on-accent md:flex">
          <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <LogoMark onAccent />
            SkillSangi
          </Link>

          <div>
            <h2 className="mt-10 max-w-xs text-3xl font-semibold leading-tight tracking-tight">
              Learn better with a companion by your side.
            </h2>
            <p className="mt-3 max-w-xs text-sm opacity-80">
              Your AI teacher, daily study plan and study partners in one place.
            </p>
          </div>

          <div className="mt-8">
            <StudyIllustration />
          </div>
        </div>

        {/* Right panel */}
        <div className="relative flex flex-col justify-center p-8 text-slate-900 sm:p-12">
          <div className="absolute right-4 top-4">
            <ThemePicker />
          </div>

          <Link href="/" className="mb-6 flex items-center gap-2 font-semibold tracking-tight md:hidden">
            <LogoMark onAccent={false} />
            SkillSangi
          </Link>

          <h1 className="text-4xl font-semibold tracking-tight">
            {isSignup ? "Create account" : "Welcome back"}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {isSignup ? "Sign up with your email" : "Log in with your email"}
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {isSignup && (
              <Field
                id="name"
                label="Full name"
                type="text"
                value={name}
                onChange={setName}
                icon={<UserIcon />}
                autoComplete="name"
              />
            )}

            <Field
              id="email"
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              icon={<MailIcon />}
              autoComplete="email"
            />

            <Field
              id="password"
              label="Password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={setPassword}
              icon={<LockIcon />}
              autoComplete={isSignup ? "new-password" : "current-password"}
              minLength={8}
              trailing={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded text-sm font-medium text-slate-500 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              }
            />
            {isSignup && (
              <p className="-mt-2 text-xs text-slate-500">At least 8 characters.</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-accent py-3 font-medium text-on-accent hover:bg-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60"
            >
              {loading ? "Please wait..." : isSignup ? "Sign up" : "Log in"}
            </button>
          </form>

          {message && (
            <p
              role="alert"
              className={`mt-4 text-sm ${isError ? "text-red-600" : "text-green-700"}`}
            >
              {message}
            </p>
          )}

          {GOOGLE_ENABLED && (
            <>
              <div className="my-6 flex items-center gap-3 text-sm text-slate-400">
                <span className="h-px flex-1 bg-slate-200" />
                or
                <span className="h-px flex-1 bg-slate-200" />
              </div>
              <button
                type="button"
                onClick={handleGoogle}
                className="w-full rounded-lg border border-slate-300 bg-white py-3 font-medium text-slate-900 hover:bg-slate-50"
              >
                Continue with Google
              </button>
            </>
          )}

          <p className="mt-8 text-center text-sm text-slate-600">
            {isSignup ? "Already have an account? " : "New to SkillSangi? "}
            <Link
              href={isSignup ? "/login" : "/signup"}
              className="font-medium text-accent underline-offset-2 hover:underline"
            >
              {isSignup ? "Log in" : "Create an account"}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}