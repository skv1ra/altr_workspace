"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error("Unhandled route error", { digest: error.digest });
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-prose flex-col items-center justify-center gap-6 px-6 py-24 text-center">
      <p className="text-label uppercase text-text-muted">Something went wrong</p>
      <h1 className="text-h2 text-text-primary">This page hit a snag.</h1>
      <p className="text-body text-text-muted">
        We couldn&rsquo;t complete that request. Nothing was lost — try again in a moment.
      </p>
      <button
        type="button"
        onClick={() => {
          reset();
          router.refresh();
        }}
        className="inline-flex items-center justify-center rounded-md border border-edge-hairline bg-transparent px-6 py-3 text-body font-medium text-text-heading transition-colors duration-fast ease-altr hover:border-altr-white/60"
      >
        Try again
      </button>
    </main>
  );
}
