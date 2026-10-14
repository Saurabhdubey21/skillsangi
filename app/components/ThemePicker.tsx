"use client";

import { useEffect, useRef, useState } from "react";

const ACCENT_KEY = "skillsangi-accent";
const THEME_KEY = "skillsangi-theme";

type Theme = "dark" | "light";

// All of these work as a button fill on both the dark and the light background.
const presets = [
  { name: "Violet", value: "#6D4AFF" },
  { name: "Blue", value: "#2F6BFF" },
  { name: "Teal", value: "#0D9488" },
  { name: "Emerald", value: "#059669" },
  { name: "Rose", value: "#E11D48" },
  { name: "Orange", value: "#EA580C" },
];

function isPreset(value: string) {
  return presets.some((p) => p.value.toLowerCase() === value.toLowerCase());
}

// Choose white or dark text, whichever is easier to read on this colour
function textOn(hex: string) {
  const channel = (start: number) => {
    const c = parseInt(hex.slice(start, start + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const luminance = 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
  return luminance > 0.18 ? "#0F172A" : "#FFFFFF";
}

function applyAccent(hex: string) {
  const style = document.documentElement.style;
  style.setProperty("--accent", hex);
  style.setProperty("--on-accent", textOn(hex));
}

function clearAccent() {
  const style = document.documentElement.style;
  style.removeProperty("--accent");
  style.removeProperty("--on-accent");
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  );
}

export default function ThemePicker() {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>("dark");
  const [accent, setAccent] = useState<string | null>(null); // null = theme default
  const boxRef = useRef<HTMLDivElement>(null);

  // Sync with what the head scripts already applied before first paint
  useEffect(() => {
    setTheme(
      document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark"
    );
    try {
      const saved = localStorage.getItem(ACCENT_KEY);
      if (saved && isPreset(saved)) {
        setAccent(saved);
      } else if (saved) {
        // An old colour that is no longer offered: drop it
        localStorage.removeItem(ACCENT_KEY);
        clearAccent();
      }
    } catch {
      // storage can be blocked; defaults still work
    }
  }, []);

  // Close on outside click or Escape
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function chooseTheme(next: Theme) {
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // ignore
    }
  }

  function chooseAccent(hex: string) {
    setAccent(hex);
    applyAccent(hex);
    try {
      localStorage.setItem(ACCENT_KEY, hex);
    } catch {
      // ignore
    }
  }

  function resetAccent() {
    setAccent(null);
    clearAccent();
    try {
      localStorage.removeItem(ACCENT_KEY);
    } catch {
      // ignore
    }
  }

  const selectedAccent = (accent ?? presets[0].value).toLowerCase();

  return (
    <div ref={boxRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label="Appearance settings"
        aria-expanded={open}
        aria-haspopup="dialog"
        className="flex items-center gap-2 rounded-control border border-border bg-surface px-3 py-2 text-sm text-muted transition-colors hover:text-foreground"
      >
        {theme === "dark" ? <MoonIcon /> : <SunIcon />}
        <span className="h-3.5 w-3.5 rounded-full bg-accent" aria-hidden="true" />
        <span className="hidden sm:inline">Appearance</span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Appearance"
          className="absolute right-0 z-50 mt-2 w-72 rounded-panel border border-border bg-background p-4 text-foreground shadow-2xl shadow-black/40"
        >
          <p className="text-sm font-medium">Mode</p>
          <div className="mt-2 grid grid-cols-2 gap-1 rounded-control border border-border bg-surface p-1">
            {(["dark", "light"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => chooseTheme(mode)}
                aria-pressed={theme === mode}
                className={`flex items-center justify-center gap-2 rounded-control px-3 py-1.5 text-sm transition-colors ${
                  theme === mode
                    ? "bg-accent text-on-accent"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {mode === "dark" ? <MoonIcon /> : <SunIcon />}
                {mode === "dark" ? "Dark" : "Light"}
              </button>
            ))}
          </div>

          <p className="mt-4 text-sm font-medium">Accent colour</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {presets.map((p) => {
              const selected = selectedAccent === p.value.toLowerCase();
              return (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => chooseAccent(p.value)}
                  aria-label={p.name}
                  aria-pressed={selected}
                  style={{ backgroundColor: p.value }}
                  className={`h-8 w-8 rounded-full ring-offset-2 ring-offset-background ${
                    selected ? "ring-2 ring-foreground" : "ring-1 ring-border"
                  }`}
                />
              );
            })}
          </div>

          <button
            type="button"
            onClick={resetAccent}
            className="mt-4 text-sm text-muted underline hover:text-foreground"
          >
            Reset colour
          </button>
        </div>
      )}
    </div>
  );
}