// Wrapper for the round screen. Next.js needs Suspense around code that reads the URL.
// Save as: app/interview/round/[roundId]/page.tsx

import { Suspense } from "react";
import RoundView from "./RoundView";

export default function RoundPage() {
  return (
    <Suspense
      fallback={
        <div role="status" className="backdrop-wash flex min-h-screen items-center justify-center text-muted">
          Loading...
        </div>
      }
    >
      <RoundView />
    </Suspense>
  );
}