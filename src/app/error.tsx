"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[public-site-error]", error);
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center bg-background px-6 py-16 text-center">
      <section className="w-full max-w-2xl rounded-3xl border border-border bg-white p-8 shadow-sm sm:p-12">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-accent">CyberWeel</p>
        <h1 className="mt-5 font-display text-4xl font-semibold leading-tight text-ink sm:text-5xl">
          حدث خطأ غير متوقع
          <span className="mt-3 block text-3xl text-accent sm:text-4xl">Something went wrong</span>
        </h1>
        <p className="mt-6 text-base leading-relaxed text-muted-foreground">
          تعذّر تحميل هذه الصفحة الآن. حاول مرة أخرى، ولن تُفقد أي بيانات لم يتم إرسالها.
        </p>
        <p className="mt-2 text-base leading-relaxed text-muted-foreground">
          This page could not be loaded right now. Try again; information that was not submitted remains in your browser.
        </p>
        <button
          type="button"
          onClick={reset}
          className="focus-ring mt-8 inline-flex rounded-md bg-ink px-6 py-3 text-sm font-semibold text-floral transition hover:bg-ink/90"
        >
          المحاولة مجددًا · Try again
        </button>
      </section>
    </main>
  );
}
