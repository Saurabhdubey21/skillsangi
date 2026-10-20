// Wrapper for the report screen. Next.js needs Suspense around code that reads the URL.
// Save as: app/interview/report/[id]/page.tsx

import { Suspense } from "react";
import ReportView from "./ReportView";

export default function ReportPage() {
  return (
    <Suspense
      fallback={
        <div role="status" className="backdrop-wash flex min-h-screen items-center justify-center text-muted">
          Loading...
        </div>
      }
    >
      <ReportView />
    </Suspense>
  );
}