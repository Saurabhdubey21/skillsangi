import Link from "next/link";

// Put the email address students can write to here before you go live.
const CONTACT_EMAIL = "saurabhkumardubey21@gmail.com";

const LAST_UPDATED = "17 October 2026";

export const metadata = {
  title: "Privacy and the AI Teacher | SkillSangi",
};

export default function PrivacyPage() {
  return (
    <main className="backdrop-wash min-h-screen px-4 py-10 sm:py-16">
      <div className="mx-auto max-w-2xl">
        <Link href="/teacher" className="text-sm font-medium text-accent hover:underline">
          Back to AI Teacher
        </Link>

        <h1 className="mt-6 text-3xl font-semibold sm:text-4xl">Privacy and the AI Teacher</h1>
        <p className="mt-2 text-sm text-muted">Last updated: {LAST_UPDATED}</p>
        <p className="mt-4 text-muted">
          This page explains in plain words what happens to your data when you use the AI
          Teacher. It is a simple summary, not legal advice.
        </p>

        <section className="glass mt-8 p-6">
          <h2 className="text-xl font-semibold">What we send to the AI</h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-muted">
            <li>Your message, and up to the last 9 earlier messages of the same chat.</li>
            <li>
              A short summary of your roadmap: the subject, your level, your hours per day and
              the titles of your tasks for today.
            </li>
            <li>Your chosen mode, your hint level and your reply language.</li>
          </ul>
          <p className="mt-3 text-muted">
            We do <span className="font-medium text-foreground">not</span> send your name,
            email address or phone number. But everything you type in the chat is sent, so
            please do not type personal details such as phone numbers, addresses, passwords or
            ID numbers. Do not paste other people&apos;s private information either.
          </p>
        </section>

        <section className="glass mt-6 p-6">
          <h2 className="text-xl font-semibold">Which AI companies receive it</h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-muted">
            <li>
              <span className="font-medium text-foreground">Google Gemini</span> is our main
              AI. We use the free tier. Google may use content from free-tier chats to improve
              its products. Google&apos;s own terms decide exactly how, and they can change.
            </li>
            <li>
              <span className="font-medium text-foreground">Groq</span> is our backup. It is
              used only when Gemini does not answer. Groq&apos;s own terms apply to anything
              sent to it.
            </li>
          </ul>
          <p className="mt-3 text-muted">
            We do not control what these companies do with the text they receive. If you would
            not want a third party to read something, do not type it into the chat.
          </p>
        </section>

        <section className="glass mt-6 p-6">
          <h2 className="text-xl font-semibold">What we store on SkillSangi</h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-muted">
            <li>
              Your chats and messages, with which AI company and model answered, and how many
              tokens were used.
            </li>
            <li>Your thumbs up and thumbs down votes on answers.</li>
            <li>How many AI messages you sent each day, which we use for the daily limit.</li>
            <li>Your reply language, saved on your profile.</li>
          </ul>
          <p className="mt-3 text-muted">
            You can only see your own chats. Other students cannot see them.
          </p>
        </section>

        <section className="glass mt-6 p-6">
          <h2 className="text-xl font-semibold">Your choices</h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-muted">
            <li>
              <span className="font-medium text-foreground">Export my data</span> on the AI
              Teacher page downloads your chats, messages and votes as a file.
            </li>
            <li>
              <span className="font-medium text-foreground">Delete my AI history</span> removes
              all your chats, messages and votes from SkillSangi. It cannot be undone.
            </li>
            <li>You can switch your reply language at any time.</li>
          </ul>
          <p className="mt-3 text-muted">
            Deleting removes your data from our database only. Text that was already sent to
            Google or Groq is covered by their own rules, and we cannot delete it from here.
            Deleting does not reset your daily message count.
          </p>
        </section>

        <section className="glass mt-6 p-6">
          <h2 className="text-xl font-semibold">Accuracy</h2>
          <p className="mt-3 text-muted">
            The AI can be wrong. Please check important answers with your teacher or textbook
            before you rely on them. The AI Teacher is meant to help you learn, not to replace
            your own work.
          </p>
        </section>

        <section className="glass mt-6 p-6">
          <h2 className="text-xl font-semibold">Questions</h2>
          <p className="mt-3 text-muted">
            {CONTACT_EMAIL ? (
              <>
                Write to us at{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-accent hover:underline">
                  {CONTACT_EMAIL}
                </a>
                .
              </>
            ) : (
              "[Add a contact email before launch]"
            )}
          </p>
        </section>
      </div>
    </main>
  );
}