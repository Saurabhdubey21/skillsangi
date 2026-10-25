import Link from "next/link";
import {
  OWNER_NAME as CONTACT_NAME,
  SUPPORT_EMAIL as CONTACT_EMAIL,
  GITHUB_URL,
  LINKEDIN_URL,
} from "../../lib/site";

const LAST_UPDATED = "25 October 2026";

export const metadata = {
  title: "Privacy | SkillSangi",
};

export default function PrivacyPage() {
  return (
    <main className="backdrop-wash min-h-screen px-4 py-10 sm:py-16">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="text-sm font-medium text-accent hover:underline">
          Back to home
        </Link>

        <h1 className="mt-6 text-3xl font-semibold sm:text-4xl">Privacy</h1>
        <p className="mt-2 text-sm text-muted">Last updated: {LAST_UPDATED}</p>
        <p className="mt-4 text-muted">
          This page explains in plain words what happens to your data when you use
          SkillSangi: your account, the AI Teacher, the AI code review, the Mock Interview and
          Teammates. It is a simple summary, not legal advice.
        </p>

        <section className="glass mt-8 p-6">
          <h2 className="text-xl font-semibold">Your account and emails</h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-muted">
            <li>
              When you sign up we keep your name, your email address and your password. The
              password is handled by our login provider, Supabase, and we never see it.
            </li>
            <li>
              Supabase also hosts our database. The sign-up confirmation email and the
              password reset email are sent through Supabase&apos;s email service.
            </li>
            <li>
              Please do not share the email link with anyone. Each link works once and then
              expires.
            </li>
          </ul>
        </section>

        <section className="glass mt-6 p-6">
          <h2 className="text-xl font-semibold">What we send to the AI</h2>
          <p className="mt-3 font-medium text-foreground">In the AI Teacher chat</p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-muted">
            <li>Your message, and up to the last 9 earlier messages of the same chat.</li>
            <li>
              A short summary of your roadmap: the subject, your level, your hours per day and
              the titles of your tasks for today.
            </li>
            <li>Your chosen mode, your hint level and your reply language.</li>
          </ul>
          <p className="mt-4 font-medium text-foreground">In the AI code review</p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-muted">
            <li>
              The code you ask the AI to review, with line numbers added, and the programming
              language.
            </li>
            <li>The title of the practice question, if you opened the editor from one.</li>
            <li>The problem text, only if you paste it into the review box.</li>
            <li>Your reply language.</li>
          </ul>
          <p className="mt-4 font-medium text-foreground">In the Mock Interview</p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-muted">
            <li>
              Your answers and the earlier messages of the same interview round, so the AI
              interviewer can ask follow-up questions.
            </li>
            <li>The code you submit in the coding round.</li>
            <li>
              If you paste your resume for the HR round, the text of that resume is sent to the
              AI as well.
            </li>
            <li>
              At the end of a round, the whole conversation is sent again so the AI can write
              the scores and the report.
            </li>
          </ul>
          <p className="mt-3 text-muted">
            The AI only reads your code. We never run it.
          </p>
          <p className="mt-3 text-muted">
            We do <span className="font-medium text-foreground">not</span> send your account
            email address or password. But everything you type or say, every line of code you
            send and any resume text you paste is sent. Please do not put phone numbers,
            email addresses, home addresses, passwords or ID numbers in your answers or in
            your resume text, and do not leave them inside your code. Do not paste other
            people&apos;s private information either.
          </p>
        </section>

        <section className="glass mt-6 p-6">
          <h2 className="text-xl font-semibold">Which AI companies receive it</h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-muted">
            <li>
              <span className="font-medium text-foreground">Google Gemini</span> is our main
              AI. We use the free tier. Google may use what is sent to the free tier to improve
              its products, and
              human reviewers may read it. Google says it removes the link to our account
              before reviewers see it, but the text itself can be read. Google&apos;s own terms
              decide exactly how, and they can change.
            </li>
            <li>
              <span className="font-medium text-foreground">Groq</span> is our backup. It is
              used only when Gemini does not answer. Groq says it does not keep inference
              data by default, but it may keep short-term logs to fix problems or check for
              abuse. Groq&apos;s own terms apply and can change.
            </li>
          </ul>
          <p className="mt-3 text-muted">
            We do not control what these companies do with the text they receive. If you would
            not want a third party to read something, do not type it, say it or put it in code
            you send.
          </p>
        </section>

        <section className="glass mt-6 p-6">
          <h2 className="text-xl font-semibold">Speaking in the Mock Interview</h2>
          <p className="mt-3 text-muted">
            If you use the microphone, your browser (Chrome or Edge) sends your voice to its
            own speech service to turn it into text. That service belongs to the browser
            company, not to us, and its own rules apply. We use the text it returns. You can
            type your answers instead.
          </p>
        </section>

        <section className="glass mt-6 p-6">
          <h2 className="text-xl font-semibold">What we store on SkillSangi</h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-muted">
            <li>
              Your AI Teacher chats and messages, with which AI company and model answered,
              and how many tokens were used.
            </li>
            <li>Your thumbs up and thumbs down votes on answers.</li>
            <li>How many AI messages you sent each day, which we use for the daily limit.</li>
            <li>Your reply language, saved on your profile.</li>
            <li>
              The optional details you choose to save on your profile: your mobile number,
              your LinkedIn link and your coding links.
            </li>
            <li>
              The code attempts you save in the editor, with the language, the time and the
              practice question if there was one, and the AI review of an attempt if you asked
              for one.
            </li>
            <li>
              Your Mock Interviews: the package you chose, the questions, your answers, the
              code you submitted, the AI replies, the scores, the timers and the final report.
              We also count your interviews per month, because there is a limit of 2.
            </li>
          </ul>
          <p className="mt-3 text-muted">
            You can only see your own chats, attempts and interviews. Other students cannot
            see them.
          </p>
          <p className="mt-3 text-muted">
            The mobile number, LinkedIn link and coding links saved on your profile are not
            shown to other students. The coding usernames you add to your Teammates card are
            separate, and are described in the next section.
          </p>
        </section>

        <section className="glass mt-6 p-6">
          <h2 className="text-xl font-semibold">Teammates</h2>
          <p className="mt-3 text-muted">
            Your Teammates card can show your name, college, branch, year, learning goal, bio,
            skills, free times and coding usernames. Other students can see it while
            &quot;Show my card to other students&quot; is switched on. You choose, person by
            person, whether to share a LinkedIn link or a WhatsApp number, and only a person
            you are connected with can see it. You can stop sharing at any time. Please do not
            put phone numbers or addresses in your bio.
          </p>
        </section>

        <section className="glass mt-6 p-6">
          <h2 className="text-xl font-semibold">Your choices</h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-muted">
            <li>
              <span className="font-medium text-foreground">Export my data</span> on the AI
              Teacher page downloads your chats, messages and votes as a file. It does not
              include your saved code attempts or your Mock Interviews.
            </li>
            <li>
              <span className="font-medium text-foreground">Delete my AI history</span> removes
              all your AI Teacher chats, messages and votes from SkillSangi. It cannot be
              undone. It does not remove your saved code attempts or your Mock Interviews.
            </li>
            <li>
              In the editor, each saved attempt has its own{" "}
              <span className="font-medium text-foreground">Delete</span> button under
              &quot;Earlier attempts&quot;. Deleting an attempt also removes its saved AI review.
            </li>
            <li>
              To have your Mock Interview records removed, or to ask about any other data we
              keep, contact us using the details at the bottom of this page.
            </li>
            <li>You can switch your reply language at any time.</li>
          </ul>
          <p className="mt-3 text-muted">
            Deleting removes your data from our database only. Text that was already sent to
            Google or Groq is covered by their own rules, and we cannot delete it from here.
            Deleting does not reset your daily message count or your monthly interview count.
          </p>
        </section>

        <section className="glass mt-6 p-6">
          <h2 className="text-xl font-semibold">Accuracy</h2>
          <p className="mt-3 text-muted">
            The AI can be wrong. Interview scores are practice estimates, not a prediction of
            real selection. Please check important answers and code reviews with your teacher
            or textbook before you rely on them. SkillSangi is meant to help you learn, not to
            replace your own work.
          </p>
        </section>

        <section className="glass mt-6 p-6">
          <h2 className="text-xl font-semibold">Contact</h2>
          <p className="mt-3 text-muted">
            SkillSangi is built by{" "}
            <span className="font-medium text-foreground">{CONTACT_NAME}</span>. For any
            question about your data, write to us or find us here:
          </p>
          <ul className="mt-3 space-y-1.5 text-muted">
            <li>
              Email:{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-accent hover:underline">
                {CONTACT_EMAIL}
              </a>
            </li>
            <li>
              GitHub:{" "}
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-accent hover:underline"
              >
                github.com/Saurabhdubey21
              </a>
            </li>
            <li>
              LinkedIn:{" "}
              <a
                href={LINKEDIN_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-accent hover:underline"
              >
                {CONTACT_NAME}
              </a>
            </li>
          </ul>
        </section>
      </div>
    </main>
  );
}