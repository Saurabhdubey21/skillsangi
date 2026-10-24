import type { ReactNode } from 'react';

export function PageTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-semibold tracking-tight text-white">{title}</h1>
      {subtitle ? <p className="mt-1 text-sm text-slate-400">{subtitle}</p> : null}
    </div>
  );
}

export function Card({
  title,
  children,
  className = '',
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-2xl border border-white/10 bg-[#0f1528] p-5 ${className}`}>
      {title ? <h2 className="mb-4 text-sm font-medium text-slate-300">{title}</h2> : null}
      {children}
    </section>
  );
}

export function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0f1528] p-5">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

const TONES = {
  green: 'bg-emerald-500/15 text-emerald-300',
  red: 'bg-red-500/15 text-red-300',
  amber: 'bg-amber-500/15 text-amber-300',
  slate: 'bg-white/10 text-slate-300',
  purple: 'bg-[#6d4cff]/20 text-[#b9a8ff]',
} as const;

export function Badge({ tone, children }: { tone: keyof typeof TONES; children: ReactNode }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${TONES[tone]}`}>
      {children}
    </span>
  );
}

export function Notice({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mb-4 rounded-xl border border-[#6d4cff]/40 bg-[#6d4cff]/10 px-4 py-3 text-sm text-slate-200">
      {message}
    </p>
  );
}

export const buttonClass =
  'rounded-lg bg-[#6d4cff] px-3.5 py-2 text-sm font-medium text-white transition hover:bg-[#5b3de6]';
export const ghostButtonClass =
  'rounded-lg border border-white/15 px-3.5 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/5';
export const dangerButtonClass =
  'rounded-lg bg-red-500/80 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-red-500';
