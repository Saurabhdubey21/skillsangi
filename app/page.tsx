import Link from "next/link";

const features = [
  {
    title: "AI Teacher",
    text: "Ask doubts and get simple, step-by-step explanations, by text or voice.",
  },
  {
    title: "Personal Roadmap",
    text: "A daily study plan built from your goal, your level and your free time.",
  },
  {
    title: "Study Partners",
    text: "Find a classmate with similar goals and learn together every day.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <span className="text-xl font-bold text-indigo-600">SkillSangi</span>
        <nav className="flex gap-3">
          <Link href="/login" className="rounded-lg px-4 py-2 text-sm font-medium hover:bg-slate-100">
            Log in
          </Link>
          <Link href="/signup" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            Sign up
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-6">
        <section className="py-16 text-center">
          <h1 className="text-4xl font-bold sm:text-5xl">
            Learn with a <span className="text-indigo-600">Sangi</span>, not alone.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            An AI teacher, a personal roadmap and a study partner, all in one place.
          </p>
          <Link href="/signup" className="mt-8 inline-block rounded-lg bg-indigo-600 px-6 py-3 font-medium text-white hover:bg-indigo-700">
            Get started free
          </Link>
        </section>

        <section className="grid gap-6 pb-20 sm:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="rounded-xl border border-slate-200 p-6">
              <h2 className="text-lg font-semibold">{f.title}</h2>
              <p className="mt-2 text-sm text-slate-600">{f.text}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}