"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { createClient } from "../../lib/supabase/client";
import Logo from "./Logo";
import ThemePicker from "./ThemePicker";

type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
  soon?: boolean;
  desktopOnly?: boolean;
};

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const nav: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: (
      <Icon>
        <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
      </Icon>
    ),
  },
  {
    href: "/roadmap",
    label: "Roadmap",
    icon: (
      <Icon>
        <circle cx="6" cy="18" r="2" />
        <circle cx="18" cy="6" r="2" />
        <path d="M8 18h6a3 3 0 0 0 0-6h-4a3 3 0 0 1 0-6h6" />
      </Icon>
    ),
  },
  {
    href: "/practice",
    label: "Practice",
    icon: (
      <Icon>
        <path d="M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16" />
      </Icon>
    ),
  },
  {
    href: "/editor",
    label: "Code Editor",
    desktopOnly: true,
    icon: (
      <Icon>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M7 10l3 2.5L7 15M12.5 15H17" />
      </Icon>
    ),
  },
  {
    href: "/partner",
    label: "Teammates",
    icon: (
      <Icon>
        <circle cx="9" cy="8" r="3.5" />
        <path d="M2.5 20c0-3.6 3-5.5 6.5-5.5s6.5 1.9 6.5 5.5" />
        <path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.8c2.2.7 3.5 2.3 3.5 5.2" />
      </Icon>
    ),
  },
  {
    href: "/teacher",
    label: "AI Teacher",
    icon: (
      <Icon>
        <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />
      </Icon>
    ),
  },
  {
    href: "/interview",
    label: "Interview",
    icon: (
      <Icon>
        <rect x="9" y="3" width="6" height="11" rx="3" />
        <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
      </Icon>
    ),
  },
  {
    href: "/profile",
    label: "Profile",
    icon: (
      <Icon>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
      </Icon>
    ),
  },
];

const mobileTabs = nav.filter((item) => !item.soon && !item.desktopOnly);

export default function AppShell({
  children,
  userName,
}: {
  children: ReactNode;
  userName?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
  }

  const initial = (userName?.trim()[0] ?? "S").toUpperCase();

  return (
    <div className="backdrop-wash min-h-screen text-foreground md:flex">
      {/* Desktop sidebar */}
      <aside className="hidden border-r border-border px-4 py-6 md:sticky md:top-0 md:flex md:h-screen md:w-64 md:shrink-0 md:flex-col">
        <div className="px-2">
          <Logo href="/dashboard" />
        </div>

        <nav aria-label="Main" className="mt-8 flex-1 space-y-1">
          {nav.map((item) =>
            item.soon ? (
              <div
                key={item.href}
                aria-disabled="true"
                className="flex items-center gap-3 rounded-control px-3 py-2.5 text-sm text-muted/70"
              >
                {item.icon}
                <span className="flex-1">{item.label}</span>
                <span className="rounded-full border border-border px-2 py-0.5 text-xs">
                  Soon
                </span>
              </div>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={`flex items-center gap-3 rounded-control px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? "bg-accent text-on-accent"
                    : "text-muted hover:bg-surface-strong hover:text-foreground"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            )
          )}
        </nav>

        <div className="border-t border-border pt-4">
          <div className="flex items-center gap-3 px-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/20 font-display font-semibold">
              {initial}
            </span>
            <span className="min-w-0 truncate text-sm font-medium">
              {userName || "Student"}
            </span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-3 w-full rounded-control border border-border bg-surface px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground"
          >
            Log out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between px-4 sm:px-8">
          <div className="md:hidden">
            <Logo href="/dashboard" />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <ThemePicker />
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Log out"
              className="rounded-control border border-border bg-surface p-2 text-muted transition-colors hover:text-foreground md:hidden"
            >
              <Icon>
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
              </Icon>
            </button>
          </div>
        </header>

        <main className="flex-1 px-4 pb-28 pt-2 sm:px-8 md:pb-12">
          <div className="mx-auto w-full max-w-4xl">{children}</div>
        </main>
      </div>

      {/* Mobile bottom tabs */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-7 border-t border-border bg-background/90 backdrop-blur-xl md:hidden"
      >
        {mobileTabs.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive(item.href) ? "page" : undefined}
            className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${
              isActive(item.href) ? "text-accent" : "text-muted"
            }`}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}