import Link from "next/link";
import ThemePicker from "./components/ThemePicker";

const ring =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

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

const steps = [
  {
    title: "Set your goal",
    text: "Pick a skill, your year, and how many hours you can give each day.",
  },
  {
    title: "Follow your daily plan",
    text: "Get a short list of tasks each day instead of a huge syllabus.",
  },
  {
    title: "Ask when you are stuck",
    text: "Type or speak your doubt and get a step-by-step explanation.",
  },
  {
    title: "Study with a partner",
    text: "Match with a classmate and check in on each other's progress.",
  },
];

function Logo() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
      <circle cx="10" cy="14" r="8" className="fill-accent" />
      <circle cx="18" cy="14" r="8" fill="#0F172A" fillOpacity="0.85" />
    </svg>
  );
}

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
    <span className="h-5 w-5 shrink-0 rounded-full border-2 border-slate-300" />
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-slate-900 antialiased">
      {/* Navigation */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link
            href="/"
            className={`flex items-center gap-2 rounded-md font-semibold tracking-tight ${ring}`}
          >
            <Logo />
            SkillSangi
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <a
              href="#features"
              className={`hidden rounded-md px-3 py-2 text-slate-600 hover:text-slate-900 sm:inline-block ${ring}`}
            >
              Features
            </a>
            <a
              href="#how"
              className={`hidden rounded-md px-3 py-2 text-slate-600 hover:text-slate-900 sm:inline-block ${ring}`}
            >
              How it works
            </a>
            <Link
              href="/login"
              className={`rounded-md px-3 py-2 text-slate-600 hover:text-slate-900 ${ring}`}
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className={`ml-2 rounded-lg bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-700 ${ring}`}
            >
              Get started
            </Link>
            <ThemePicker />
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl items-center gap-14 px-6 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-600">
              <span className="h-2 w-2 rounded-full bg-accent" />
              Early access for college students
            </span>
            <h1 className="mt-6 text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
              Learn with an AI teacher and a partner who keeps you going.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-slate-600">
              SkillSangi builds your daily study plan, explains what you do not
              understand, and matches you with a classmate to learn alongside.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/signup"
                className={`rounded-lg bg-accent px-6 py-3 font-medium text-on-accent hover:bg-accent-hover ${ring}`}
              >
                Create free account
              </Link>
              <Link
                href="/login"
                className={`rounded-lg border border-slate-300 bg-white px-6 py-3 font-medium text-slate-900 hover:bg-slate-50 ${ring}`}
              >
                Log in
              </Link>
            </div>
            <p className="mt-4 text-sm text-slate-500">
              Free to start. Built for engineering students.
            </p>
          </div>

          {/* Product preview */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/60">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Today&apos;s plan</h2>
                <span className="text-sm text-slate-500">3 of 5 done</span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full w-3/5 rounded-full bg-accent" />
              </div>
              <ul className="mt-5 space-y-3">
                {plan.map((task) => (
                  <li key={task.text} className="flex items-center gap-3 text-sm">
                    <Tick done={task.done} />
                    <span className="sr-only">{task.done ? "Done: " : "To do: "}</span>
                    <span className={task.done ? "text-slate-400 line-through" : "text-slate-800"}>
                      {task.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-5 lg:ml-10">
              <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-white px-4 py-2.5 text-sm shadow-sm ring-1 ring-slate-200">
                Why does my loop run one extra time?
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 shrink-0">
                  <Logo />
                </span>
                <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-accent px-4 py-2.5 text-sm text-on-accent">
                  Line 6 uses {"<="} instead of {"<"}, so i reaches n and reads
                  past the array. Change it to i {"<"} n.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-16">
          <h2 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
            Everything you need to study consistently.
          </h2>
          <p className="mt-3 max-w-xl text-slate-600">
            One place for your plan, your doubts, and the people you study with.
          </p>

          <div className="mt-10 grid gap-4 md:grid-cols-6">
            <div className="rounded-2xl border border-slate-200 p-7 md:col-span-4">
              <h3 className="text-xl font-semibold tracking-tight">
                An AI teacher that explains, not just answers
              </h3>
              <p className="mt-3 max-w-lg text-slate-600">
                Ask in plain language and get step-by-step explanations, hints
                before solutions, and a quick check to see if it stuck.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-7 ring-1 ring-slate-200 md:col-span-2">
              <h3 className="text-xl font-semibold tracking-tight">A plan built around you</h3>
              <p className="mt-3 text-slate-600">
                Tell us your goal and free hours. Your plan adjusts when you
                miss a day.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-7 ring-1 ring-slate-200 md:col-span-2">
              <h3 className="text-xl font-semibold tracking-tight">A partner who shows up</h3>
              <p className="mt-3 text-slate-600">
                Match with a classmate who has similar goals and free time.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-900 p-7 text-white md:col-span-4">
              <h3 className="text-xl font-semibold tracking-tight">Debug by talking</h3>
              <p className="mt-3 max-w-lg text-slate-300">
                Describe the bug out loud. The assistant reads your code, points
                at the line, and explains the fix.
              </p>
              <div className="mt-6 overflow-x-auto rounded-xl bg-slate-800/70 p-4 font-mono text-sm">
                {code.map((line) => (
                  <div
                    key={line.no}
                    className={`flex gap-4 px-2 ${
                      line.bad ? "rounded bg-accent/30 text-white" : "text-slate-300"
                    }`}
                  >
                    <span className="w-4 select-none text-right text-slate-500">{line.no}</span>
                    <span className="whitespace-pre">{line.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-16">
          <h2 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
            How it works
          </h2>
          <ol className="mt-10 grid gap-8 md:grid-cols-4">
            {steps.map((step, i) => (
              <li key={step.title} className="border-t border-slate-200 pt-5">
                <span className="text-sm font-semibold text-accent">{i + 1}</span>
                <h3 className="mt-2 font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.text}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Final call to action */}
        <section className="mx-auto max-w-6xl px-6 pb-20 pt-8">
          <div className="flex flex-col items-start justify-between gap-6 rounded-2xl border border-slate-200 bg-slate-50 px-8 py-10 md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                Start with your first study plan.
              </h2>
              <p className="mt-2 text-slate-600">It takes about a minute to set up.</p>
            </div>
            <Link
              href="/signup"
              className={`rounded-lg bg-accent px-6 py-3 font-medium text-on-accent hover:bg-accent-hover ${ring}`}
            >
              Create free account
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-6 py-8 text-sm text-slate-500 sm:flex-row sm:items-center">
          <span>© 2026 SkillSangi</span>
          <div className="flex gap-5">
            <Link href="/login" className={`rounded-md hover:text-slate-900 ${ring}`}>
              Log in
            </Link>
            <Link href="/signup" className={`rounded-md hover:text-slate-900 ${ring}`}>
              Sign up
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}