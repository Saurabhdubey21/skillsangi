import Link from "next/link";

export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect width="32" height="32" rx="9" className="fill-accent" />
      <path
        d="M21 11C19.5 9 17.5 8.5 16 8.5C13 8.5 11 10 11 12.2C11 17 21 14.8 21 19.8C21 22 19 23.5 16 23.5C14 23.5 12 22.8 10.8 21"
        className="stroke-on-accent"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2.5 rounded-control font-display text-xl font-semibold tracking-tight"
    >
      <LogoMark />
      SkillSangi
    </Link>
  );
}