import Link from "next/link";
import Logo, { LogoMark } from "./components/Logo";
import SkillGraph from "./components/SkillGraph";
import ThemePicker from "./components/ThemePicker";

const ring =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

const primaryBtn = `rounded-control bg-accent px-6 py-3 font-medium text-on-accent shadow-[0_8px_30px_-8px_var(--accent)] transition hover:bg-accent-hover ${ring}`;
const ghostBtn = `rounded-control border border-border bg-surface px-6 py-3 font-medium text-foreground transition hover:bg-surface-strong ${ring}`;

const plan = [
  { text: "Arrays: two-pointer technique", done: true },
  { text: "Solve 3 practice questions", done: true },
  { text: "Review mistakes from yesterday", done: true },
  { text: "Linked lists: reverse a list", done: false },
  { text: "Study session with a partner, 8:00 pm", done: false },
];

const code = [
  { no: 5, text: "int sum = 0;", bad: false },
  { no: 6, text: "for (int i = 0; i <= n; i++) {", bad: true },
  { no: 7, text: "  sum += arr[i];", bad: false },
  { no: 8, text: "}", bad: false },
];

const tracks = [
  "DSA and problem solving",
  "Web development",
  "AI and machine learning",
  "Embedded systems",
  "Placement preparation",
];

const timeline = [
  { day: "Day 1", kind: "Learn", text: "Arrays and strings basics", now: true },
  { day: "Day 2", kind: "Practice", text: "3 exercises on what you learned", now: false },
  { day: "Day 3", kind: "Review", text: "Fix your mistakes", now: false },
  { day: "Day 4", kind: "Learn", text: "Hashing", now: false },
  { day: "Day 30", kind: "Finish", text: "Your starter plan is complete", now: false },
];

const steps = [
  {
    title: "Set your goal",
    text: "Pick a skill, your level, and how many hours you can give each day.",
  },
  {
    title: "Follow your daily plan",
    text: "Get a short list of tasks each day instead of a huge syllabus.",
  },
  {
    title: "Ask when you are stuck",
    text: "Type your doubt or paste your code and get a step-by-step explanation.",
  },
  {
    title: "Study with a partner",
    text: "Match with a classmate and check in on each other's progress.",
  },
];

function Tick({ done }: { done: boolean }) {
  return done ? (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-on-accent">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
        <path
          d="M2.5 6.5l2.2 2.2L9.5 3.8"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  ) : (
    <span className="h-5 w-5 shrink-0 rounded-full border-2 border-border" />
  );
}

function Status({ live }: { live: boolean }) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
        live
          ? "bg-success/15 text-success"
          : "border border-border bg-surface-strong text-muted"
      }`}
    >
      {live ? "Available now" : "Coming soon"}
    </span>
  );
}

export default function Home() {
  return (
    <div className="backdrop-wash min-h-screen text-foreground">
      {/* Navigation */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Logo />
          <nav className="flex items-center gap-1 text-sm">
            <a
              href="#features"
              className={`hidden rounded-control px-3 py-2 text-muted hover:text-foreground sm:inline-block ${ring}`}
            >
              Features
            </a>
            <a
              href="#how"
              className={`hidden rounded-control px-3 py-2 text-muted hover:text-foreground sm:inline-block ${ring}`}
            >
              How it works
            </a>
            <Link
              href="/login"
              className={`rounded-control px-3 py-2 text-muted hover:text-foreground ${ring}`}
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className={`mx-2 rounded-control bg-accent px-4 py-2 font-medium text-on-accent transition hover:bg-accent-hover ${ring}`}
            >
              Get started
            </Link>
            <ThemePicker />
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <div className="relative overflow-hidden">
          {/* Decorative skill graph behind the hero. Delete this div if you find it busy. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-28 -top-6 hidden w-[780px] opacity-25 [mask-image:radial-gradient(closest-side,black_35%,transparent)] lg:block"
          >
            <SkillGraph className="h-auto w-full" />
          </div>

          <section className="relative mx-auto grid max-w-6xl items-center gap-14 px-6 py-16 lg:grid-cols-2 lg:py-24">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-sm text-muted">
                <span className="h-2 w-2 rounded-full bg-glow" />
                Early access for college students
              </span>
              <h1 className="mt-6 text-4xl font-semibold leading-[1.08] sm:text-5xl lg:text-6xl">
                Learn with an AI teacher and a partner who keeps you going.
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted">
                SkillSangi builds your daily study plan, explains what you do
                not understand, and matches you with a classmate to learn
                alongside.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href="/signup" className={primaryBtn}>
                  Create free account
                </Link>
                <Link href="/login" className={ghostBtn}>
                  Log in
                </Link>
              </div>
              <p className="mt-4 text-sm text-muted">
                Free to start. Built by an engineering student, for engineering
                students.
              </p>
            </div>

            {/* Product preview */}
            <div className="space-y-4">
              <div className="glass p-6 shadow-2xl shadow-black/30">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold">Today&apos;s plan</h2>
                  <span className="text-sm text-muted">3 of 5 done</span>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-strong">
                  <div className="h-full w-3/5 rounded-full bg-linear-to-r from-accent to-glow" />
                </div>
                <ul className="mt-5 space-y-3">
                  {plan.map((task) => (
                    <li key={task.text} className="flex items-center gap-3 text-sm">
                      <Tick done={task.done} />
                      <span className="sr-only">{task.done ? "Done: " : "To do: "}</span>
                      <span className={task.done ? "text-muted line-through" : "text-foreground"}>
                        {task.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="glass space-y-3 p-5 lg:ml-10">
                <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-surface-strong px-4 py-2.5 text-sm">
                  Why does my loop run one extra time?
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 shrink-0">
                    <LogoMark />
                  </span>
                  <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-accent px-4 py-2.5 text-sm text-on-accent">
                    Line 6 uses {"<="} instead of {"<"}, so i reaches n and reads
                    past the array. Change it to i {"<"} n.
                  </div>
                </div>
              </div>
              <p className="text-center text-xs text-muted">Sample preview of the experience</p>
            </div>
          </section>
        </div>

        {/* Learning tracks */}
        <section aria-label="Learning tracks" className="mx-auto max-w-6xl px-6 pb-6">
          <p className="text-center text-sm text-muted">Pick a track and start today</p>
          <ul className="mt-4 flex flex-wrap justify-center gap-2">
            {tracks.map((t) => (
              <li
                key={t}
                className="rounded-full border border-border bg-surface px-4 py-1.5 text-sm"
              >
                {t}
              </li>
            ))}
          </ul>
        </section>

        {/* Features */}
        <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-20">
          <h2 className="max-w-2xl text-3xl font-semibold sm:text-4xl">
            Everything you need to study consistently.
          </h2>
          <p className="mt-3 max-w-xl text-muted">
            One place for your plan, your doubts, and the people you study with.
          </p>

          <div className="mt-10 grid gap-4 md:grid-cols-6">
            <div className="glass p-7 md:col-span-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-xl font-semibold">
                  An AI teacher that explains, not just answers
                </h3>
                <Status live={false} />
              </div>
              <p className="mt-3 max-w-lg text-muted">
                Ask in plain language and get step-by-step explanations, hints
                before solutions, and a quick check to see if it stuck.
              </p>
            </div>

            <div className="glass p-7 md:col-span-2">
              <h3 className="text-xl font-semibold">A plan built around you</h3>
              <p className="mt-3 text-muted">
                Tell us your goal and free hours. Get a day-by-day plan that
                fits the time you actually have.
              </p>
              <div className="mt-4">
                <Status live />
              </div>
            </div>

            <div className="glass p-7 md:col-span-2">
              <h3 className="text-xl font-semibold">A partner who shows up</h3>
              <p className="mt-3 text-muted">
                Match with a classmate who has similar goals and free time.
              </p>
              <div className="mt-4">
                <Status live={false} />
              </div>
            </div>

            <div className="glass p-7 md:col-span-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-xl font-semibold">Debug with your own code</h3>
                <Status live={false} />
              </div>
              <p className="mt-3 max-w-lg text-muted">
                Paste your code and describe the bug. The assistant points at
                the line and explains the fix.
              </p>
              <div className="mt-6 overflow-x-auto rounded-control border border-border bg-background/60 p-4 font-mono text-sm">
                {code.map((line) => (
                  <div
                    key={line.no}
                    className={`flex gap-4 px-2 ${
                      line.bad ? "rounded bg-accent/25 text-foreground" : "text-muted"
                    }`}
                  >
                    <span className="w-4 select-none text-right opacity-60">{line.no}</span>
                    <span className="whitespace-pre">{line.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Roadmap preview */}
        <section className="mx-auto max-w-6xl px-6 py-10">
          <div className="glass grid items-center gap-10 p-8 md:p-10 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-semibold sm:text-3xl">
                A 30-day starter plan, one day at a time
              </h2>
              <p className="mt-2 max-w-md text-muted">
                Every plan follows the same rhythm: learn it, practise it, then
                review your mistakes.
              </p>

              <ol className="relative mt-8 space-y-6 border-l border-border pl-6">
                {timeline.map((item) => (
                  <li key={item.day} className="relative">
                    <span
                      aria-hidden="true"
                      className={`absolute -left-[30px] top-1.5 h-3 w-3 rounded-full ${
                        item.now
                          ? "bg-glow ring-4 ring-glow/25"
                          : "border-2 border-muted bg-background"
                      }`}
                    />
                    <p className="text-xs font-medium text-muted">
                      {item.day}
                      {item.now && <span className="ml-2 text-glow">Today</span>}
                    </p>
                    <p className="mt-0.5 font-medium">
                      <span className="text-glow">{item.kind}:</span> {item.text}
                    </p>
                  </li>
                ))}
              </ol>
            </div>

            <figure>
              <SkillGraph className="h-auto w-full" />
              <figcaption className="mt-2 text-center text-xs text-muted">
                Sample roadmap: DSA and problem solving
              </figcaption>
            </figure>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-20">
          <h2 className="max-w-2xl text-3xl font-semibold sm:text-4xl">How it works</h2>
          <ol className="mt-10 grid gap-8 md:grid-cols-4">
            {steps.map((step, i) => (
              <li key={step.title} className="border-t border-border pt-5">
                <span className="text-sm font-semibold text-glow">0{i + 1}</span>
                <h3 className="mt-2 font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{step.text}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Final call to action */}
        <section className="mx-auto max-w-6xl px-6 pb-24 pt-4">
          <div className="glass flex flex-col items-start justify-between gap-6 px-8 py-10 md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl font-semibold">Start with your first study plan.</h2>
              <p className="mt-2 text-muted">It takes about a minute to set up.</p>
            </div>
            <Link href="/signup" className={primaryBtn}>
              Create free account
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-6 py-8 text-sm text-muted sm:flex-row sm:items-center">
          <span>© 2026 SkillSangi</span>
          <div className="flex gap-5">
            <Link href="/login" className={`rounded-control hover:text-foreground ${ring}`}>
              Log in
            </Link>
            <Link href="/signup" className={`rounded-control hover:text-foreground ${ring}`}>
              Sign up
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}