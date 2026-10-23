"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";
import Logo from "./Logo";
import ThemePicker from "./ThemePicker";

const ring =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

function LockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

type PasswordFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  show: boolean;
};

function PasswordField({ id, label, value, onChange, show }: PasswordFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
          <LockIcon />
        </span>
        <input
          id={id}
          type={show ? "text" : "password"}
          required
          minLength={8}
          value={value}
          autoComplete="new-password"
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-control border border-border bg-surface py-2.5 pl-10 pr-3 text-foreground outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/30"
        />
      </div>
    </div>
  );
}

export default function ResetPasswordForm() {
  const router = useRouter();

  // "checking" while we look for the login session made by the email link.
  const [status, setStatus] = useState<"checking" | "ready" | "no-session">("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (active) setStatus(data.user ? "ready" : "no-session");
    });
    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    if (password !== confirm) {
      setIsError(true);
      setMessage("The two passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setIsError(true);
        setMessage(error.message);
      } else {
        setIsError(false);
        setMessage("Password updated. Taking you to your dashboard...");
        router.push("/dashboard");
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
          {status === "checking" && (
            <p className="text-sm text-muted" role="status">
              Checking your link...
            </p>
          )}

          {status === "no-session" && (
            <>
              <h1 className="text-3xl font-semibold">This link has expired</h1>
              <p className="mt-1.5 text-sm text-muted">
                The reset link is old or was already used. Open the link in the
                same browser where you asked for it, or ask for a new one.
              </p>
              <div className="mt-6">
                <Link
                  href="/forgot-password"
                  className={`inline-block rounded-control bg-accent px-5 py-3 font-medium text-on-accent transition-colors hover:bg-accent-hover ${ring}`}
                >
                  Send a new link
                </Link>
              </div>
            </>
          )}

          {status === "ready" && (
            <>
              <h1 className="text-3xl font-semibold">Set a new password</h1>
              <p className="mt-1.5 text-sm text-muted">
                Choose a password with at least 8 characters.
              </p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <PasswordField
                  id="password"
                  label="New password"
                  value={password}
                  onChange={setPassword}
                  show={show}
                />
                <PasswordField
                  id="confirm"
                  label="Confirm new password"
                  value={confirm}
                  onChange={setConfirm}
                  show={show}
                />

                <label className="flex items-center gap-2 text-sm text-muted">
                  <input
                    type="checkbox"
                    checked={show}
                    onChange={(e) => setShow(e.target.checked)}
                  />
                  Show passwords
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full rounded-control bg-accent py-3 font-medium text-on-accent shadow-[0_8px_30px_-8px_var(--accent)] transition-colors hover:bg-accent-hover disabled:opacity-60 ${ring}`}
                >
                  {loading ? "Please wait..." : "Update password"}
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
            </>
          )}
        </div>
      </div>
    </main>
  );
}