"use client";

import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "skillsangi-accent";
const DEFAULT_ACCENT = "#2F5BFF";

const presets = [
  { name: "Blue", value: "#2F5BFF" },
  { name: "Violet", value: "#7C3AED" },
  { name: "Teal", value: "#0F766E" },
  { name: "Emerald", value: "#047857" },
  { name: "Rose", value: "#E11D48" },
  { name: "Orange", value: "#C2410C" },
  { name: "Slate", value: "#0F172A" },
];

function isHex(value: string) {
  return /^#[0-9a-fA-F]{6}$/.test(value);
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

export default function ThemePicker() {
  const [open, setOpen] = useState(false);
  const [accent, setAccent] = useState(DEFAULT_ACCENT);
  const boxRef = useRef<HTMLDivElement>(null);

  // Read the saved colour once, so the right swatch is highlighted
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && isHex(saved)) setAccent(saved);
    } catch {
      // storage can be blocked; the default colour still works
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

  function choose(hex: string) {
    setAccent(hex);
    applyAccent(hex);
    try {
      localStorage.setItem(STORAGE_KEY, hex);
    } catch {
      // ignore
    }
  }

  function reset() {
    setAccent(DEFAULT_ACCENT);
    applyAccent(DEFAULT_ACCENT);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  return (
    <div ref={boxRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label="Change theme colour"
        aria-expanded={open}
        aria-haspopup="dialog"
        className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-600 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <span className="h-4 w-4 rounded-full bg-accent ring-1 ring-slate-300" />
        <span className="hidden sm:inline">Theme</span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Choose accent colour"
          className="absolute right-0 z-50 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-4 text-slate-900 shadow-lg"
        >
          <p className="text-sm font-medium">Accent colour</p>

          <div className="mt-3 flex flex-wrap gap-2">
            {presets.map((p) => {
              const selected = accent.toLowerCase() === p.value.toLowerCase();
              return (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => choose(p.value)}
                  aria-label={p.name}
                  aria-pressed={selected}
                  style={{ backgroundColor: p.value }}
                  className={`h-8 w-8 rounded-full ring-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 ${
                    selected ? "ring-2 ring-slate-900" : "ring-1 ring-slate-200"
                  }`}
                />
              );
            })}
          </div>

          <label className="mt-4 flex items-center justify-between text-sm">
            <span>Custom colour</span>
            <input
              type="color"
              value={accent}
              onChange={(e) => choose(e.target.value)}
              className="h-8 w-10 cursor-pointer rounded border border-slate-300 bg-white p-0.5"
            />
          </label>

          <button
            type="button"
            onClick={reset}
            className="mt-4 text-sm text-slate-500 underline hover:text-slate-900"
          >
            Reset to default
          </button>
        </div>
      )}
    </div>
  );
}