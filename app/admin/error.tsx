'use client';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-lg rounded-2xl border border-white/10 bg-[#0f1528] p-6">
      <h2 className="text-lg font-semibold text-white">Something went wrong</h2>
      <p className="mt-2 text-sm text-slate-400">
        The admin page could not load. Check that the admin migrations
        (supabase/migrations/007 and 008) were applied and that
        SUPABASE_SERVICE_ROLE_KEY is set.
      </p>
      {error.digest ? <p className="mt-2 text-xs text-slate-500">Reference: {error.digest}</p> : null}
      <button
        onClick={reset}
        className="mt-4 rounded-lg bg-[#6d4cff] px-3.5 py-2 text-sm font-medium text-white hover:bg-[#5b3de6]"
      >
        Try again
      </button>
    </div>
  );
}