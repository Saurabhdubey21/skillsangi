"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "../../lib/supabase/client";
import Logo from "./Logo";
import ThemePicker from "./ThemePicker";

const ring =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

function MailIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  );
}

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/confirm?next=/reset-password`,
      });
      if (error) {
        setIsError(true);
        setMessage(error.message);
      } else {
        // Same message whether or not the email has an account, on purpose.
        setIsError(false);
        setMessage(
          "If an account exists for this email, we sent a link to reset your password. Check your inbox and your spam folder."
        );
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

  return (
    <main className="backdrop-wash relative min-h-screen overflow-hidden px-4 py-6 sm:px-8">
      <header className="mx-auto flex max-w-6xl items-center justify-between">
        <Logo />
        <ThemePicker />
      </header>

      <div className="mx-auto mt-14 w-full max-w-md">
        <div className="glass p-6 shadow-2xl shadow-black/30 sm:p-8">
          <h1 className="text-3xl font-semibold">Forgot your password?</h1>
          <p className="mt-1.5 text-sm text-muted">
            Enter your email and we will send you a link to set a new one.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
                Email
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
                  <MailIcon />
                </span>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  autoComplete="email"
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-control border border-border bg-surface py-2.5 pl-10 pr-3 text-foreground outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/30"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full rounded-control bg-accent py-3 font-medium text-on-accent shadow-[0_8px_30px_-8px_var(--accent)] transition-colors hover:bg-accent-hover disabled:opacity-60 ${ring}`}
            >
              {loading ? "Please wait..." : "Send reset link"}
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

          <p className="mt-6 text-center text-sm text-muted">
            Remembered it?{" "}
            <Link href="/login" className={`rounded font-medium text-glow hover:underline ${ring}`}>
              Back to log in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}