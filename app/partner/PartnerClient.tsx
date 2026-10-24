"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";
import AppShell from "../components/AppShell";
import ChatToggle from "./ChatPanel";
import {
  CARD_COLUMNS,
  availabilityOptions,
  codingLinks,
  goalOptions,
  isValidHandle,
  isValidLinkedin,
  isValidWhatsapp,
  labelOf,
  lookingForOptions,
  matchScore,
  normalizeWhatsapp,
  skillOptions,
  toggleInList,
  whatsappLink,
  type Match,
  type PartnerCard,
  type PartnerRequest,
  type Share,
} from "../../lib/partners";

type Tab = "discover" | "connections" | "card";
type Draft = Omit<PartnerCard, "user_id">;

const controlClass =
  "w-full rounded-control border border-border bg-surface px-3 py-2.5 text-foreground outline-none transition-colors placeholder:text-muted/70 focus:border-accent focus:ring-2 focus:ring-accent/30";
const primaryBtn =
  "rounded-control bg-accent px-4 py-2 text-sm font-medium text-on-accent shadow-[0_8px_24px_-10px_var(--accent)] transition hover:bg-accent-hover disabled:opacity-60";
const ghostBtn =
  "rounded-control border border-border bg-surface px-4 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface-strong hover:text-foreground disabled:opacity-60";

const yearNames = ["", "1st", "2nd", "3rd", "4th"];
function yearLabel(y: number) {
  return `${yearNames[y] ?? y} year`;
}

function blankToNull(value: string) {
  const t = value.trim();
  return t === "" ? null : t;
}

function fallbackCard(id: string): PartnerCard {
  return {
    user_id: id,
    display_name: "A student",
    college: null,
    branch: null,
    study_year: null,
    goal: null,
    looking_for: [],
    skills: [],
    availability: [],
    bio: null,
    is_open: false,
    leetcode: null,
    codeforces: null,
    gfg: null,
    codechef: null,
  };
}

// ---------- Small building blocks ----------

function Avatar({ name, size = "md" }: { name: string; size?: "md" | "lg" }) {
  const letter = name.trim().charAt(0).toUpperCase() || "S";
  const dims = size === "lg" ? "h-14 w-14 text-xl" : "h-11 w-11 text-base";
  return (
    <span
      aria-hidden="true"
      className={`flex ${dims} shrink-0 items-center justify-center rounded-full border border-accent/40 bg-accent/20 font-semibold text-foreground`}
    >
      {letter}
    </span>
  );
}

function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-border bg-surface-strong px-2.5 py-0.5 text-xs text-muted">
      {children}
    </span>
  );
}

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wider text-muted">{children}</p>
  );
}

function ToggleChip({
  label,
  on,
  onClick,
}: {
  label: string;
  on: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
        on
          ? "border-accent bg-accent text-on-accent"
          : "border-border bg-surface text-muted hover:bg-surface-strong hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}

function StatTile({ value, label }: { value: number; label: string }) {
  return (
    <div className="glass px-4 py-3">
      <p className="text-2xl font-semibold leading-none">{value}</p>
      <p className="mt-1.5 whitespace-nowrap text-xs text-muted">{label}</p>
    </div>
  );
}

function SectionHeading({
  title,
  count,
  hint,
}: {
  title: string;
  count?: number;
  hint?: string;
}) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <h2 className="text-xl font-semibold">{title}</h2>
      {typeof count === "number" && (
        <span className="rounded-full bg-surface-strong px-2 py-0.5 text-xs font-medium text-muted">
          {count}
        </span>
      )}
      {hint && <p className="w-full text-sm text-muted">{hint}</p>}
    </div>
  );
}

function EmptyState({
  title,
  text,
  children,
}: {
  title: string;
  text: string;
  children?: ReactNode;
}) {
  return (
    <div className="glass mt-4 flex max-w-xl flex-col items-start gap-1 border-dashed p-6">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm leading-relaxed text-muted">{text}</p>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}

function CardView({
  card,
  match,
  children,
}: {
  card: PartnerCard;
  match?: Match;
  children?: ReactNode;
}) {
  const links = codingLinks(card);
  const line = [card.college, card.branch, card.study_year ? yearLabel(card.study_year) : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className="glass flex flex-col p-5 transition-colors hover:border-accent/40">
      <div className="flex items-start gap-3.5">
        <Avatar name={card.display_name} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="truncate text-lg font-semibold">{card.display_name}</h3>
            {match && (
              <span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-glow">
                {match.percent}% match
              </span>
            )}
          </div>
          {line && <p className="mt-0.5 text-sm text-muted">{line}</p>}
        </div>
      </div>

      {card.goal && (
        <p className="mt-4 rounded-control border border-border bg-surface px-3 py-2 text-sm">
          <span className="text-muted">Goal: </span>
          {card.goal}
        </p>
      )}

      {card.looking_for.length > 0 && (
        <div className="mt-4">
          <Eyebrow>Looking for</Eyebrow>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {card.looking_for.map((id) => (
              <span
                key={id}
                className="rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-medium text-glow"
              >
                {labelOf(lookingForOptions, id)}
              </span>
            ))}
          </div>
        </div>
      )}

      {card.skills.length > 0 && (
        <div className="mt-4">
          <Eyebrow>Skills</Eyebrow>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {card.skills.map((s) => (
              <Chip key={s}>{s}</Chip>
            ))}
          </div>
        </div>
      )}

      {card.availability.length > 0 && (
        <p className="mt-4 text-sm text-muted">
          Free: {card.availability.map((a) => labelOf(availabilityOptions, a)).join(", ")}
        </p>
      )}

      {card.bio && <p className="mt-4 text-sm leading-relaxed">{card.bio}</p>}

      {links.length > 0 && (
        <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              {l.label}
              <span className="sr-only"> profile (opens in a new tab)</span>
            </a>
          ))}
        </p>
      )}

      {match && match.reasons.length > 0 && (
        <ul className="mt-4 space-y-1 text-xs text-muted">
          {match.reasons.map((r) => (
            <li key={r} className="flex gap-2">
              <span aria-hidden="true" className="text-success">
                +
              </span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
      )}

      {children && <div className="mt-5 border-t border-border pt-4">{children}</div>}
    </article>
  );
}

// ---------- My card form ----------

function CardForm({
  initial,
  saving,
  onSave,
}: {
  initial: Draft;
  saving: boolean;
  onSave: (draft: Draft) => Promise<void>;
}) {
  const [d, setD] = useState<Draft>(initial);
  const [formError, setFormError] = useState("");

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setD((prev) => ({ ...prev, [key]: value }));
  }

  const handleFields = [
    { key: "leetcode", label: "LeetCode" },
    { key: "codeforces", label: "Codeforces" },
    { key: "gfg", label: "GeeksforGeeks" },
    { key: "codechef", label: "CodeChef" },
  ] as const;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    if (!d.display_name.trim()) {
      setFormError("Add a name to show on your card.");
      return;
    }
    if (d.looking_for.length === 0) {
      setFormError("Choose at least one thing you are looking for.");
      return;
    }
    for (const f of handleFields) {
      if (!isValidHandle(d[f.key] ?? "")) {
        setFormError(
          `${f.label}: enter only your username (letters, numbers, _ . -), not a link.`
        );
        return;
      }
    }

    await onSave({
      ...d,
      display_name: d.display_name.trim(),
      college: blankToNull(d.college ?? ""),
      branch: blankToNull(d.branch ?? ""),
      goal: d.goal || null,
      bio: blankToNull(d.bio ?? ""),
      leetcode: blankToNull(d.leetcode ?? ""),
      codeforces: blankToNull(d.codeforces ?? ""),
      gfg: blankToNull(d.gfg ?? ""),
      codechef: blankToNull(d.codechef ?? ""),
    });
  }

  return (
    <form onSubmit={submit} className="max-w-3xl space-y-5">
      <p className="rounded-control border border-border bg-surface px-4 py-3 text-sm text-muted">
        Other students can see this card while it is switched on. Do not put phone numbers or
        addresses in your bio. You choose later, person by person, whether to share contact
        details.
      </p>

      <div className="glass space-y-5 p-6">
        <h2 className="text-lg font-semibold">About you</h2>
        <div>
          <label htmlFor="display-name" className="mb-1.5 block text-sm font-medium">
            Name shown on your card
          </label>
          <input
            id="display-name"
            type="text"
            required
            maxLength={60}
            value={d.display_name}
            onChange={(e) => set("display_name", e.target.value)}
            className={controlClass}
          />
          <p className="mt-1 text-xs text-muted">A first name or nickname is fine.</p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="card-college" className="mb-1.5 block text-sm font-medium">
              College
            </label>
            <input
              id="card-college"
              type="text"
              value={d.college ?? ""}
              onChange={(e) => set("college", e.target.value)}
              className={controlClass}
            />
          </div>
          <div>
            <label htmlFor="card-branch" className="mb-1.5 block text-sm font-medium">
              Branch
            </label>
            <input
              id="card-branch"
              type="text"
              placeholder="e.g. ECE, CSE"
              value={d.branch ?? ""}
              onChange={(e) => set("branch", e.target.value)}
              className={controlClass}
            />
          </div>
          <div>
            <label htmlFor="card-year" className="mb-1.5 block text-sm font-medium">
              Year of study
            </label>
            <select
              id="card-year"
              value={d.study_year ? String(d.study_year) : ""}
              onChange={(e) => set("study_year", e.target.value ? Number(e.target.value) : null)}
              className={controlClass}
            >
              <option value="">Select year</option>
              <option value="1">1st year</option>
              <option value="2">2nd year</option>
              <option value="3">3rd year</option>
              <option value="4">4th year</option>
            </select>
          </div>
          <div>
            <label htmlFor="card-goal" className="mb-1.5 block text-sm font-medium">
              Main learning goal
            </label>
            <select
              id="card-goal"
              value={d.goal ?? ""}
              onChange={(e) => set("goal", e.target.value || null)}
              className={controlClass}
            >
              <option value="">Select a goal</option>
              {goalOptions.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="card-bio" className="mb-1.5 block text-sm font-medium">
            Short bio (optional)
          </label>
          <textarea
            id="card-bio"
            rows={3}
            maxLength={280}
            value={d.bio ?? ""}
            onChange={(e) => set("bio", e.target.value)}
            className={controlClass}
          />
          <p className="mt-1 text-right text-xs text-muted">{(d.bio ?? "").length} / 280</p>
        </div>
      </div>

      <div className="glass space-y-6 p-6">
        <h2 className="text-lg font-semibold">What you want</h2>

        <fieldset>
          <legend className="mb-2 text-sm font-medium">I am looking for</legend>
          <div className="flex flex-wrap gap-2">
            {lookingForOptions.map((o) => (
              <ToggleChip
                key={o.id}
                label={o.label}
                on={d.looking_for.includes(o.id)}
                onClick={() => set("looking_for", toggleInList(d.looking_for, o.id))}
              />
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-sm font-medium">My skills and interests</legend>
          <div className="flex flex-wrap gap-2">
            {skillOptions.map((s) => (
              <ToggleChip
                key={s}
                label={s}
                on={d.skills.includes(s)}
                onClick={() => set("skills", toggleInList(d.skills, s))}
              />
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-sm font-medium">When I am usually free</legend>
          <div className="flex flex-wrap gap-2">
            {availabilityOptions.map((o) => (
              <ToggleChip
                key={o.id}
                label={o.label}
                on={d.availability.includes(o.id)}
                onClick={() => set("availability", toggleInList(d.availability, o.id))}
              />
            ))}
          </div>
        </fieldset>
      </div>

      <div className="glass p-6">
        <fieldset>
          <legend className="text-lg font-semibold">Coding profiles (optional)</legend>
          <p className="mt-1 text-xs text-muted">
            Enter your username only, not a link. Never enter a password.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {handleFields.map((f) => (
              <div key={f.key}>
                <label htmlFor={`handle-${f.key}`} className="mb-1.5 block text-sm text-muted">
                  {f.label}
                </label>
                <input
                  id={`handle-${f.key}`}
                  type="text"
                  maxLength={40}
                  autoComplete="off"
                  value={d[f.key] ?? ""}
                  onChange={(e) => set(f.key, e.target.value)}
                  className={controlClass}
                />
              </div>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="glass p-6">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={d.is_open}
            onChange={(e) => set("is_open", e.target.checked)}
            className="mt-1 h-4 w-4 accent-accent"
          />
          <span className="text-sm">
            <span className="font-medium">Show my card to other students</span>
            <span className="block text-muted">
              Turn this off to hide your card. People you are already connected with can still
              see it.
            </span>
          </span>
        </label>
      </div>

      {formError && (
        <p
          role="alert"
          className="rounded-control border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger"
        >
          {formError}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-control bg-accent py-3 font-medium text-on-accent shadow-[0_8px_30px_-8px_var(--accent)] transition hover:bg-accent-hover disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save my card"}
      </button>
    </form>
  );
}

// ---------- One person in Discover ----------

function DiscoverItem({
  card,
  match,
  busy,
  onSend,
}: {
  card: PartnerCard;
  match: Match;
  busy: boolean;
  onSend: (toUser: string, message: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");

  return (
    <CardView card={card} match={match}>
      {open ? (
        <div>
          <label htmlFor={`msg-${card.user_id}`} className="mb-1.5 block text-sm font-medium">
            Add a short message (optional)
          </label>
          <textarea
            id={`msg-${card.user_id}`}
            rows={2}
            maxLength={300}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Hi! I am also preparing for placements. Want to study together?"
            className={controlClass}
          />
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => onSend(card.user_id, message)}
              className={primaryBtn}
            >
              Send request
            </button>
            <button type="button" onClick={() => setOpen(false)} className={ghostBtn}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setOpen(true)} className={`${primaryBtn} w-full`}>
          Connect
        </button>
      )}
    </CardView>
  );
}

// ---------- One accepted connection ----------

function ConnectionItem({
  card,
  theirShare,
  myShare,
  busy,
  onShare,
  onStopSharing,
  onRemove,
}: {
  card: PartnerCard;
  theirShare: Share | undefined;
  myShare: Share | undefined;
  busy: boolean;
  onShare: (linkedin: string | null, whatsapp: string | null) => Promise<void>;
  onStopSharing: () => Promise<void>;
  onRemove: () => Promise<void>;
}) {
  const [linkedin, setLinkedin] = useState(myShare?.linkedin ?? "");
  const [whatsapp, setWhatsapp] = useState(myShare?.whatsapp ?? "");
  const [formError, setFormError] = useState("");
  const [confirmRemove, setConfirmRemove] = useState(false);
  const name = card.display_name;

  async function submitShare(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    const l = blankToNull(linkedin);
    const w = blankToNull(whatsapp);

    if (!l && !w) {
      setFormError("Add a LinkedIn link or a WhatsApp number to share.");
      return;
    }
    if (l && !isValidLinkedin(l)) {
      setFormError("Use your full LinkedIn profile link, like https://www.linkedin.com/in/yourname");
      return;
    }
    if (w && !isValidWhatsapp(w)) {
      setFormError("Enter your number with country code, like +919876543210");
      return;
    }
    await onShare(l, w ? normalizeWhatsapp(w) : null);
  }

  return (
    <CardView card={card}>
      <div className="space-y-5">
        <ChatToggle otherId={card.user_id} otherName={name} />

        <div className="rounded-control border border-border bg-surface p-4">
          <h4 className="text-sm font-semibold">Contact shared by {name}</h4>
          {theirShare ? (
            <ul className="mt-2 space-y-1 text-sm">
              {theirShare.linkedin && isValidLinkedin(theirShare.linkedin) && (
                <li>
                  <a
                    href={theirShare.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:underline"
                  >
                    LinkedIn profile
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </li>
              )}
              {theirShare.whatsapp && (
                <li>
                  <a
                    href={whatsappLink(theirShare.whatsapp)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:underline"
                  >
                    WhatsApp: {theirShare.whatsapp}
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </li>
              )}
            </ul>
          ) : (
            <p className="mt-1 text-sm text-muted">
              {name} has not shared any contact details with you.
            </p>
          )}
        </div>

        <form
          onSubmit={submitShare}
          className="space-y-3 rounded-control border border-border bg-surface p-4"
        >
          <h4 className="text-sm font-semibold">What you share with {name}</h4>
          <p className="text-xs text-muted">
            Only {name} can see this, and only while you are connected. You can stop sharing any
            time. Sharing is your choice.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor={`li-${card.user_id}`} className="mb-1 block text-sm text-muted">
                LinkedIn profile link
              </label>
              <input
                id={`li-${card.user_id}`}
                type="url"
                placeholder="https://www.linkedin.com/in/yourname"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                className={controlClass}
              />
            </div>
            <div>
              <label htmlFor={`wa-${card.user_id}`} className="mb-1 block text-sm text-muted">
                WhatsApp number (optional)
              </label>
              <input
                id={`wa-${card.user_id}`}
                type="tel"
                placeholder="+919876543210"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className={controlClass}
              />
            </div>
          </div>
          {formError && (
            <p role="alert" className="text-sm text-danger">
              {formError}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={busy} className={primaryBtn}>
              {myShare ? "Update what I share" : `Share with ${name}`}
            </button>
            {myShare && (
              <button
                type="button"
                disabled={busy}
                onClick={async () => {
                  await onStopSharing();
                  setLinkedin("");
                  setWhatsapp("");
                }}
                className={ghostBtn}
              >
                Stop sharing
              </button>
            )}
          </div>
        </form>

        <div>
          {confirmRemove ? (
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span>
                Remove {name}? Anything either of you shared with the other, and
                your chat messages with each other, will be deleted.
              </span>
              <button
                type="button"
                disabled={busy}
                onClick={onRemove}
                className="rounded-control bg-danger px-4 py-2 text-sm font-medium text-background disabled:opacity-60"
              >
                Remove
              </button>
              <button type="button" onClick={() => setConfirmRemove(false)} className={ghostBtn}>
                Keep
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmRemove(true)}
              className="text-sm text-muted underline hover:text-foreground"
            >
              Remove connection
            </button>
          )}
        </div>
      </div>
    </CardView>
  );
}

// ---------- The page ----------

export default function PartnerClient() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<string | null>(null);
  const [userName, setUserName] = useState("");
  const [defaults, setDefaults] = useState<Draft | null>(null);
  const [myCard, setMyCard] = useState<PartnerCard | null>(null);
  const [cards, setCards] = useState<PartnerCard[]>([]);
  const [requests, setRequests] = useState<PartnerRequest[]>([]);
  const [shares, setShares] = useState<Share[]>([]);

  const [tab, setTab] = useState<Tab>("discover");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);

  const [filterLooking, setFilterLooking] = useState("all");
  const [filterSkill, setFilterSkill] = useState("all");
  const [sameCollege, setSameCollege] = useState(false);

  const loadAll = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }
    setMe(user.id);

    const [profileRes, cardRes, cardsRes, reqRes, shareRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("full_name, college, branch, study_year, goal")
        .eq("id", user.id)
        .maybeSingle(),
      supabase.from("partner_profiles").select(CARD_COLUMNS).eq("user_id", user.id).maybeSingle(),
      supabase.from("partner_profiles").select(CARD_COLUMNS).limit(200),
      supabase
        .from("partner_requests")
        .select("id, from_user, to_user, message, status, created_at")
        .order("created_at", { ascending: false }),
      supabase.from("partner_shares").select("from_user, to_user, linkedin, whatsapp"),
    ]);

    const firstError =
      cardRes.error?.message ??
      cardsRes.error?.message ??
      reqRes.error?.message ??
      shareRes.error?.message;
    if (firstError) setError("Could not load teammates: " + firstError);

    const fullName = profileRes.data?.full_name?.trim() ?? "";
    setUserName(fullName || (user.email ?? "").split("@")[0]);

    setDefaults({
      display_name: fullName,
      college: profileRes.data?.college ?? null,
      branch: profileRes.data?.branch ?? null,
      study_year: profileRes.data?.study_year ?? null,
      goal: profileRes.data?.goal ?? null,
      looking_for: ["study_partner"],
      skills: [],
      availability: [],
      bio: null,
      is_open: true,
      leetcode: null,
      codeforces: null,
      gfg: null,
      codechef: null,
    });

    setMyCard((cardRes.data as PartnerCard | null) ?? null);
    setCards((cardsRes.data ?? []) as PartnerCard[]);
    setRequests((reqRes.data ?? []) as PartnerRequest[]);
    setShares((shareRes.data ?? []) as Share[]);
  }, [router]);

  useEffect(() => {
    let active = true;
    loadAll().finally(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [loadAll]);

  const cardById = useMemo(() => {
    const map = new Map<string, PartnerCard>();
    cards.forEach((c) => map.set(c.user_id, c));
    return map;
  }, [cards]);

  const connectedIds = useMemo(() => {
    const ids = new Set<string>();
    requests.forEach((r) => ids.add(r.from_user === me ? r.to_user : r.from_user));
    return ids;
  }, [requests, me]);

  const discover = useMemo(() => {
    if (!myCard) return [];
    return cards
      .filter((c) => c.user_id !== me && c.is_open && !connectedIds.has(c.user_id))
      .filter((c) => filterLooking === "all" || c.looking_for.includes(filterLooking))
      .filter((c) => filterSkill === "all" || c.skills.includes(filterSkill))
      .filter(
        (c) =>
          !sameCollege ||
          (!!c.college &&
            !!myCard.college &&
            c.college.trim().toLowerCase() === myCard.college.trim().toLowerCase())
      )
      .map((c) => ({ card: c, match: matchScore(myCard, c) }))
      .sort((a, b) => b.match.score - a.match.score);
  }, [cards, myCard, me, connectedIds, filterLooking, filterSkill, sameCollege]);

  const incoming = requests.filter((r) => r.to_user === me && r.status === "pending");
  const outgoing = requests.filter((r) => r.from_user === me && r.status === "pending");
  const accepted = requests.filter((r) => r.status === "accepted");

  // ---------- Actions ----------

  async function sendRequest(toUser: string, message: string) {
    if (!me) return;
    setBusy(true);
    setError("");
    setNotice("");
    const supabase = createClient();
    const { error: e } = await supabase.from("partner_requests").insert({
      from_user: me,
      to_user: toUser,
      message: blankToNull(message),
    });
    if (e) {
      setError(
        e.code === "23505"
          ? "You already have a request with this student."
          : "Could not send the request: " + e.message
      );
    } else {
      setNotice("Request sent. You will see their answer under Connections.");
      await loadAll();
    }
    setBusy(false);
  }

  async function answerRequest(id: string, status: "accepted" | "declined") {
    setBusy(true);
    setError("");
    setNotice("");
    const supabase = createClient();
    const { data, error: e } = await supabase
      .from("partner_requests")
      .update({ status })
      .eq("id", id)
      .select("id");
    if (e) setError("Could not update the request: " + e.message);
    else if (!data || data.length === 0) setError("That request is no longer waiting for an answer.");
    else {
      setNotice(status === "accepted" ? "Connected! You can now choose what to share." : "Request declined.");
      await loadAll();
    }
    setBusy(false);
  }

  async function removeRequest(id: string, doneMessage: string) {
    setBusy(true);
    setError("");
    setNotice("");
    const supabase = createClient();
    const { data, error: e } = await supabase
      .from("partner_requests")
      .delete()
      .eq("id", id)
      .select("id");
    if (e) setError("Could not remove that: " + e.message);
    else if (!data || data.length === 0)
      setError("Nothing was removed. It may already be gone. Please refresh the page.");
    else {
      setNotice(doneMessage);
      await loadAll();
    }
    setBusy(false);
  }

  async function saveShare(otherId: string, linkedin: string | null, whatsapp: string | null) {
    if (!me) return;
    setBusy(true);
    setError("");
    setNotice("");
    const supabase = createClient();
    const { error: e } = await supabase
      .from("partner_shares")
      .upsert(
        { from_user: me, to_user: otherId, linkedin, whatsapp },
        { onConflict: "from_user,to_user" }
      );
    if (e) setError("Could not save what you share: " + e.message);
    else {
      setNotice("Saved. Only this student can see it.");
      await loadAll();
    }
    setBusy(false);
  }

  async function stopSharing(otherId: string) {
    if (!me) return;
    setBusy(true);
    setError("");
    setNotice("");
    const supabase = createClient();
    const { error: e } = await supabase
      .from("partner_shares")
      .delete()
      .eq("from_user", me)
      .eq("to_user", otherId);
    if (e) setError("Could not stop sharing: " + e.message);
    else {
      setNotice("You are no longer sharing contact details with this student.");
      await loadAll();
    }
    setBusy(false);
  }

  async function saveCard(draft: Draft) {
    if (!me) return;
    setSaving(true);
    setError("");
    setNotice("");
    const supabase = createClient();
    const { error: e } = await supabase
      .from("partner_profiles")
      .upsert(
        { user_id: me, ...draft, updated_at: new Date().toISOString() },
        { onConflict: "user_id" }
      );
    if (e) setError("Could not save your card: " + e.message);
    else {
      setNotice("Card saved.");
      await loadAll();
      setTab("discover");
    }
    setSaving(false);
  }

  async function copyInvite() {
    const address = window.location.origin;
    try {
      await navigator.clipboard.writeText(address);
      setNotice("Link copied. Send it to a friend.");
    } catch {
      setNotice("Copy this address and send it to a friend: " + address);
    }
  }

  if (loading) {
    return (
      <div
        role="status"
        className="backdrop-wash flex min-h-screen items-center justify-center text-muted"
      >
        Loading teammates...
      </div>
    );
  }

  const tabs: { id: Tab; label: string; badge?: number }[] = [
    { id: "discover", label: "Discover" },
    { id: "connections", label: "Connections", badge: incoming.length },
    { id: "card", label: "My card" },
  ];

  const initialDraft: Draft = myCard
    ? {
        display_name: myCard.display_name,
        college: myCard.college,
        branch: myCard.branch,
        study_year: myCard.study_year,
        goal: myCard.goal,
        looking_for: myCard.looking_for,
        skills: myCard.skills,
        availability: myCard.availability,
        bio: myCard.bio,
        is_open: myCard.is_open,
        leetcode: myCard.leetcode,
        codeforces: myCard.codeforces,
        gfg: myCard.gfg,
        codechef: myCard.codechef,
      }
    : (defaults as Draft);

  return (
    <AppShell userName={userName}>
      <div className="mx-auto max-w-6xl">
        {/* ---------- Header ---------- */}
        <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-success" />
              Student community
            </span>
            <h1 className="mt-4 text-3xl font-semibold sm:text-4xl">Build your team</h1>
            <p className="mt-2 text-muted">
              Find a study partner, a project teammate or a hackathon team. Matches are ranked by
              goals, skills and time. You decide what to share and with whom.
            </p>
          </div>
          {myCard && (
            <div className="grid grid-cols-3 gap-3 lg:w-[28rem]">
              <StatTile value={discover.length} label="To discover" />
              <StatTile value={accepted.length} label="Connected" />
              <StatTile value={incoming.length} label="Requests" />
            </div>
          )}
        </header>

        {/* ---------- Tabs ---------- */}
        <div
          role="group"
          aria-label="Sections"
          className="mt-8 inline-flex flex-wrap gap-1 rounded-panel border border-border bg-surface p-1"
        >
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTab(t.id);
                setNotice("");
                setError("");
              }}
              aria-pressed={tab === t.id}
              className={`rounded-control px-4 py-2 text-sm font-medium transition-colors ${
                tab === t.id
                  ? "bg-accent text-on-accent shadow-[0_6px_20px_-8px_var(--accent)]"
                  : "text-muted hover:bg-surface-strong hover:text-foreground"
              }`}
            >
              {t.label}
              {t.badge ? (
                <span className="ml-2 rounded-full bg-streak px-1.5 py-0.5 text-xs font-semibold text-background">
                  {t.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {error && (
          <p
            role="alert"
            className="mt-6 rounded-control border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger"
          >
            {error}
          </p>
        )}
        {notice && (
          <p
            role="status"
            className="mt-6 rounded-control border border-success/40 bg-success/10 px-4 py-3 text-sm text-success"
          >
            {notice}
          </p>
        )}

        {/* ---------- Discover ---------- */}
        {tab === "discover" && (
          <section className="mt-8" aria-label="Discover">
            {!myCard ? (
              <div className="glass max-w-xl p-6 sm:p-8">
                <h2 className="text-xl font-semibold">Create your card first</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  Other students only see what you put on your card, and we use it to rank the
                  best matches for you. It takes about a minute.
                </p>
                <ol className="mt-5 space-y-2 text-sm">
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/20 text-xs font-semibold">
                      1
                    </span>
                    Tell us your goal, skills and free time.
                  </li>
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/20 text-xs font-semibold">
                      2
                    </span>
                    See students ranked by how well you match.
                  </li>
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/20 text-xs font-semibold">
                      3
                    </span>
                    Connect, then choose what contact details to share.
                  </li>
                </ol>
                <button type="button" onClick={() => setTab("card")} className={`${primaryBtn} mt-6`}>
                  Create my card
                </button>
              </div>
            ) : (
              <>
                {!myCard.is_open && (
                  <p className="mb-6 rounded-control border border-border bg-surface px-4 py-3 text-sm text-muted">
                    Your card is hidden, so other students cannot find you. Turn it on in My card.
                  </p>
                )}

                <div className="glass flex flex-wrap items-end gap-4 p-4">
                  <div className="min-w-44 flex-1">
                    <label htmlFor="f-looking" className="mb-1 block text-xs font-medium text-muted">
                      Looking for
                    </label>
                    <select
                      id="f-looking"
                      value={filterLooking}
                      onChange={(e) => setFilterLooking(e.target.value)}
                      className={controlClass}
                    >
                      <option value="all">Anything</option>
                      {lookingForOptions.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="min-w-44 flex-1">
                    <label htmlFor="f-skill" className="mb-1 block text-xs font-medium text-muted">
                      Skill
                    </label>
                    <select
                      id="f-skill"
                      value={filterSkill}
                      onChange={(e) => setFilterSkill(e.target.value)}
                      className={controlClass}
                    >
                      <option value="all">Any skill</option>
                      {skillOptions.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <label className="flex cursor-pointer items-center gap-2 pb-2.5 text-sm text-muted">
                    <input
                      type="checkbox"
                      checked={sameCollege}
                      onChange={(e) => setSameCollege(e.target.checked)}
                      className="h-4 w-4 accent-accent"
                    />
                    Same college only
                  </label>
                </div>

                {discover.length === 0 ? (
                  <EmptyState
                    title="No matches yet"
                    text="You are early, so only a few students have created a card. Try removing a filter, or invite a friend to join you."
                  >
                    <button type="button" onClick={copyInvite} className={primaryBtn}>
                      Copy invite link
                    </button>
                  </EmptyState>
                ) : (
                  <div className="mt-6 grid gap-4 lg:grid-cols-2">
                    {discover.map(({ card, match }) => (
                      <DiscoverItem
                        key={card.user_id}
                        card={card}
                        match={match}
                        busy={busy}
                        onSend={sendRequest}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {/* ---------- Connections ---------- */}
        {tab === "connections" && (
          <section className="mt-8 space-y-12" aria-label="Connections">
            <div>
              <SectionHeading title="Requests for you" count={incoming.length} />
              {incoming.length === 0 ? (
                <p className="mt-2 text-sm text-muted">No new requests right now.</p>
              ) : (
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  {incoming.map((r) => (
                    <CardView key={r.id} card={cardById.get(r.from_user) ?? fallbackCard(r.from_user)}>
                      {r.message && (
                        <p className="mb-3 rounded-control border border-border bg-surface px-3 py-2 text-sm italic">
                          &ldquo;{r.message}&rdquo;
                        </p>
                      )}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => answerRequest(r.id, "accepted")}
                          className={primaryBtn}
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => answerRequest(r.id, "declined")}
                          className={ghostBtn}
                        >
                          Decline
                        </button>
                      </div>
                    </CardView>
                  ))}
                </div>
              )}
            </div>

            <div>
              <SectionHeading title="Connected" count={accepted.length} />
              {accepted.length === 0 ? (
                <p className="mt-2 text-sm text-muted">
                  When someone accepts your request, or you accept theirs, they appear here.
                </p>
              ) : (
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  {accepted.map((r) => {
                    const otherId = r.from_user === me ? r.to_user : r.from_user;
                    return (
                      <ConnectionItem
                        key={r.id}
                        card={cardById.get(otherId) ?? fallbackCard(otherId)}
                        theirShare={shares.find((s) => s.from_user === otherId && s.to_user === me)}
                        myShare={shares.find((s) => s.from_user === me && s.to_user === otherId)}
                        busy={busy}
                        onShare={(l, w) => saveShare(otherId, l, w)}
                        onStopSharing={() => stopSharing(otherId)}
                        onRemove={() => removeRequest(r.id, "Connection removed.")}
                      />
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <SectionHeading title="Waiting for an answer" count={outgoing.length} />
              {outgoing.length === 0 ? (
                <p className="mt-2 text-sm text-muted">You have no requests waiting.</p>
              ) : (
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  {outgoing.map((r) => (
                    <CardView key={r.id} card={cardById.get(r.to_user) ?? fallbackCard(r.to_user)}>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-muted">Request sent</span>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => removeRequest(r.id, "Request withdrawn.")}
                          className={ghostBtn}
                        >
                          Withdraw
                        </button>
                      </div>
                    </CardView>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ---------- My card ---------- */}
        {tab === "card" && (
          <section className="mt-8" aria-label="My card">
            <CardForm initial={initialDraft} saving={saving} onSave={saveCard} />
          </section>
        )}
      </div>
    </AppShell>
  );
}