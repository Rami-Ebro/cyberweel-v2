import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-background px-6 py-16 text-center">
      <section className="w-full max-w-2xl rounded-3xl border border-border bg-white p-8 shadow-sm sm:p-12">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-accent">404</p>
        <h1 className="mt-5 font-display text-4xl font-semibold leading-tight text-ink sm:text-5xl">
          الصفحة غير موجودة
          <span className="mt-3 block text-3xl text-accent sm:text-4xl">Page not found</span>
        </h1>
        <p className="mt-6 text-base leading-relaxed text-muted-foreground">
          ربما تم نقل الرابط أو تغييره. يمكنك العودة إلى الصفحة الرئيسية ومتابعة التصفح.
        </p>
        <p className="mt-2 text-base leading-relaxed text-muted-foreground">
          The link may have changed or the page may have moved. Return to the homepage to continue.
        </p>
        <Link
          href="/"
          className="focus-ring mt-8 inline-flex rounded-md bg-ink px-6 py-3 text-sm font-semibold text-floral transition hover:bg-ink/90"
        >
          العودة إلى الرئيسية · Back to home
        </Link>
      </section>
    </main>
  );
}
