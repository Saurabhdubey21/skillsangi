"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";
import Logo from "./Logo";
import SkillGraph from "./SkillGraph";
import ThemePicker from "./ThemePicker";

type Props = {
  mode: "login" | "signup";
};

// Turn each on only after enabling that provider in Supabase (Authentication > Providers)
const GOOGLE_ENABLED: boolean = false;
const GITHUB_ENABLED: boolean = false;

const features = [
  {
    title: "A daily plan built around your hours",
    icon: (
      <path d="M4 6h16M4 12h10M4 18h16" />
    ),
  },
  {
    title: "An AI teacher that explains, not just answers",
    icon: (
      <>
        <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />
      </>
    ),
  },
  {
    title: "A study partner who checks in on you",
    icon: (
      <>
        <circle cx="9" cy="8" r="3.5" />
        <path d="M2.5 20c0-3.6 3-5.5 6.5-5.5s6.5 1.9 6.5 5.5" />
        <path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.8c2.2.7 3.5 2.3 3.5 5.2" />
      </>
    ),
  },
];

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

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.58-5.17 3.58-8.81z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.88-3a7.2 7.2 0 0 1-10.7-3.78H1.4v3.1A12 12 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.36 14.3a7.2 7.2 0 0 1 0-4.6v-3.1H1.4a12 12 0 0 0 0 10.8l3.96-3.1z" />
      <path fill="#EA4335" d="M12 4.75c1.76 0 3.34.6 4.58 1.8l3.44-3.44A11.5 11.5 0 0 0 12 0 12 12 0 0 0 1.4 6.6l3.96 3.1A7.2 7.2 0 0 1 12 4.75z" />
    </svg>
  );
}

function GithubIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.69 1.25 3.35.96.1-.74.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.17 1.18a10.9 10.9 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.18 1.83 1.18 3.09 0 4.42-2.69 5.39-5.25 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5z" />
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
  describedBy?: string;
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
  describedBy,
  trailing,
}: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
          {icon}
        </span>
        <input
          id={id}
          type={type}
          required
          value={value}
          minLength={minLength}
          autoComplete={autoComplete}
          aria-describedby={describedBy}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full rounded-control border border-border bg-surface py-2.5 pl-10 text-foreground outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/30 ${
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
          setMessage("Account created. Check your email to confirm it, then log in.");
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

  async function handleOAuth(provider: "google" | "github") {
    setMessage("");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/dashboard` },
      });
      if (error) {
        setIsError(true);
        setMessage(error.message);
      }
    } catch (err) {
      setIsError(true);
      setMessage(err instanceof Error ? err.message : "Sign-in failed. Please try again.");
    }
  }

  const showOAuth = GOOGLE_ENABLED || GITHUB_ENABLED;

  return (
    <main className="backdrop-wash relative min-h-screen overflow-hidden px-4 py-6 sm:px-8">
      <header className="mx-auto flex max-w-6xl items-center justify-between">
        <Logo />
        <ThemePicker />
      </header>

      <div className="mx-auto mt-8 grid max-w-6xl items-center gap-12 md:mt-14 md:grid-cols-[1.15fr_1fr] lg:gap-20">
        {/* Left: what you get */}
        <section className="hidden md:block">
          <h2 className="max-w-lg text-4xl font-semibold leading-[1.1] lg:text-5xl">
            Learn better with a plan and a partner.
          </h2>
          <p className="mt-4 max-w-md text-muted">
            Tell us your goal and your free hours. We turn it into a daily plan
            you can actually finish.
          </p>

          <ul className="mt-8 space-y-4">
            {features.map((f) => (
              <li key={f.title} className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-accent/15 text-glow">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    {f.icon}
                  </svg>
                </span>
                <span>{f.title}</span>
              </li>
            ))}
          </ul>

          <figure className="mt-10 max-w-xl">
            <SkillGraph className="h-auto w-full" />
            <figcaption className="mt-1 text-xs text-muted">
              Sample roadmap: DSA and problem solving
            </figcaption>
          </figure>
        </section>

        {/* Right: the form */}
        <section className="glass mx-auto w-full max-w-md p-6 sm:p-8">
          <nav
            aria-label="Account"
            className="grid grid-cols-2 gap-1 rounded-control border border-border bg-surface p-1 text-sm font-medium"
          >
            <Link
              href="/login"
              aria-current={!isSignup ? "page" : undefined}
              className={`rounded-control py-2 text-center transition-colors ${
                !isSignup ? "bg-accent text-on-accent" : "text-muted hover:text-foreground"
              }`}
            >
              Log in
            </Link>
            <Link
              href="/signup"
              aria-current={isSignup ? "page" : undefined}
              className={`rounded-control py-2 text-center transition-colors ${
                isSignup ? "bg-accent text-on-accent" : "text-muted hover:text-foreground"
              }`}
            >
              Sign up
            </Link>
          </nav>

          <h1 className="mt-7 text-3xl font-semibold">
            {isSignup ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            {isSignup
              ? "Start your first study plan in about a minute."
              : "Log in to continue your plan."}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
              describedBy={isSignup ? "password-hint" : undefined}
              trailing={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded text-sm font-medium text-muted hover:text-foreground"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              }
            />
            {isSignup && (
              <p id="password-hint" className="-mt-2 text-xs text-muted">
                At least 8 characters.
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-control bg-accent py-3 font-medium text-on-accent transition-colors hover:bg-accent-hover disabled:opacity-60"
            >
              {loading ? "Please wait..." : isSignup ? "Create account" : "Log in"}
            </button>
          </form>

          {message && (
            <p
              role={isError ? "alert" : "status"}
              className={`mt-4 text-sm ${isError ? "text-danger" : "text-success"}`}
            >
              {message}
            </p>
          )}

          {showOAuth && (
            <>
              <div className="my-6 flex items-center gap-3 text-sm text-muted">
                <span className="h-px flex-1 bg-border" />
                or continue with
                <span className="h-px flex-1 bg-border" />
              </div>
              <div className={`grid gap-3 ${GOOGLE_ENABLED && GITHUB_ENABLED ? "grid-cols-2" : "grid-cols-1"}`}>
                {GOOGLE_ENABLED && (
                  <button
                    type="button"
                    onClick={() => handleOAuth("google")}
                    className="flex items-center justify-center gap-2 rounded-control border border-border bg-surface py-2.5 text-sm font-medium transition-colors hover:bg-surface-strong"
                  >
                    <GoogleIcon />
                    Google
                  </button>
                )}
                {GITHUB_ENABLED && (
                  <button
                    type="button"
                    onClick={() => handleOAuth("github")}
                    className="flex items-center justify-center gap-2 rounded-control border border-border bg-surface py-2.5 text-sm font-medium transition-colors hover:bg-surface-strong"
                  >
                    <GithubIcon />
                    GitHub
                  </button>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}