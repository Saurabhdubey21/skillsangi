import type { Metadata } from "next";
import { Suspense } from "react";
import PartnerClient from "./PartnerClient";

export const metadata: Metadata = { title: "Teammates" };

export default function PartnerPage() {
  return (
    <Suspense
      fallback={
        <div
          role="status"
          className="backdrop-wash flex min-h-screen items-center justify-center text-muted"
        >
          Loading teammates...
        </div>
      }
    >
      <PartnerClient />
    </Suspense>
  );
}