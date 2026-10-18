import { Suspense } from "react";
import EditorClient from "./EditorClient";

export default function EditorPage() {
  return (
    <Suspense
      fallback={
        <div
          role="status"
          className="backdrop-wash flex min-h-screen items-center justify-center text-muted"
        >
          Loading...
        </div>
      }
    >
      <EditorClient />
    </Suspense>
  );
}