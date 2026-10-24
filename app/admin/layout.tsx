import Link from 'next/link';
import type { Metadata } from 'next';
import { Suspense, type ReactNode } from 'react';
import { requireAdmin } from '@/lib/admin/auth';

export const metadata: Metadata = {
  title: 'Admin · SkillSangi',
  robots: { index: false, follow: false },
};
export const instant = false;

const NAV = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/audit', label: 'Audit log' },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#070b1a] p-8 text-sm text-slate-400">Loading…</div>
      }
    >
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}

// The part that reads the login cookie lives here, inside the Suspense boundary above.
async function AdminShell({ children }: { children: ReactNode }) {
  const { user } = await requireAdmin();

  return (
    <div className="min-h-screen bg-[#070b1a] text-slate-200 md:flex">
      <aside className="border-b border-white/10 p-4 md:min-h-screen md:w-60 md:shrink-0 md:border-b-0 md:border-r">
        <div className="flex items-center gap-3 md:mb-8">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#6d4cff] font-bold text-white">S</span>
          <div>
            <p className="text-sm font-semibold text-white">SkillSangi</p>
            <p className="text-xs text-slate-400">Admin</p>
          </div>
        </div>
        <nav className="mt-4 flex gap-1 overflow-x-auto md:mt-0 md:flex-col">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/dashboard"
            className="whitespace-nowrap rounded-lg px-3 py-2 text-sm text-slate-500 transition hover:bg-white/5 hover:text-slate-300 md:mt-6"
          >
            ← Back to app
          </Link>
        </nav>
        <p className="mt-4 truncate text-xs text-slate-500 md:mt-8">Signed in as {user.email}</p>
      </aside>
      <main className="min-w-0 flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}