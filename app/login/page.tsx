import { Suspense } from "react";
import AuthForm from "../components/AuthForm";

type Search = Promise<{ error?: string }>;

// Reads ?error=link only inside Suspense, so the page can still be prerendered.
async function LoginContent({ searchParams }: { searchParams: Search }) {
  const { error } = await searchParams;
  return <AuthForm mode="login" linkError={error === "link"} />;
}

export default function LoginPage({ searchParams }: { searchParams: Search }) {
  return (
    <Suspense fallback={<AuthForm mode="login" />}>
      <LoginContent searchParams={searchParams} />
    </Suspense>
  );
}