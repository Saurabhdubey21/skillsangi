import { Suspense } from "react";
import TopicClient from "./TopicClient";

export default function TopicPage() {
  return (
    <Suspense
      fallback={
        <div
          role="status"
          className="backdrop-wash flex min-h-screen items-center justify-center text-muted"
        >
          Loading questions...
        </div>
      }
    >
      <TopicClient />
    </Suspense>
  );
}