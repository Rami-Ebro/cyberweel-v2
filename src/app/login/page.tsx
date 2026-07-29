"use client";

import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, LogIn } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/brand/logo";

export default function LoginPage() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    setMessage("");
    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/partner/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: form.get("identifier"),
          password: form.get("password"),
          remember: form.get("remember") === "on",
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "تعذر تسجيل الدخول");
        setLoading(false);
        return;
      }

      router.replace(data.redirectTo || "/");
      router.refresh();
    } catch {
      setMessage("تعذر الاتصال بالخادم. حاول مرة أخرى.");
      setLoading(false);
    }
  }

  return (
    <main dir="rtl" className="relative min-h-screen overflow-hidden bg-[#F4F1EA] text-[#111827]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-32 -top-40 h-[34rem] w-[34rem] rounded-full bg-white/80 blur-3xl" />
        <div className="absolute -bottom-56 -left-40 h-[36rem] w-[36rem] rounded-full bg-[#C7AA68]/10 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#B89A5A]/40 to-transparent" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-5 py-6 sm:px-8 lg:px-12">
        <header className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-3" aria-label="العودة إلى CyberWeel">
            <Logo size={44} />
            <span className="text-lg font-black tracking-tight">CyberWeel</span>
          </Link>
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-[#111827]">
            العودة إلى الموقع
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </header>

        <div className="grid flex-1 items-center gap-12 py-12 lg:grid-cols-[minmax(0,1fr)_460px] lg:py-16">
          <section className="hidden max-w-2xl lg:block">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-[#9A7D43]">CyberWeel Account</p>
            <h1 className="mt-5 text-5xl font-black leading-[1.15] tracking-tight xl:text-6xl">
              دخول واحد
              <br />
              تجربة أعمال متكاملة
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-9 text-slate-600">
              ادخل إلى مساحة عملك لإدارة المشاريع، الملفات، الإحالات والفواتير من مكان واحد، بهوية واضحة وتجربة مصممة للتركيز.
            </p>
            <div className="mt-10 flex items-center gap-5 border-r-2 border-[#B89A5A] pr-5 text-sm text-slate-500">
              <span>آمن</span>
              <span className="h-1 w-1 rounded-full bg-slate-300" />
              <span>موحّد</span>
              <span className="h-1 w-1 rounded-full bg-slate-300" />
              <span>مصمم للأعمال</span>
            </div>
          </section>

          <section className="mx-auto w-full max-w-[460px] rounded-[28px] border border-black/5 bg-white/95 p-6 shadow-[0_28px_80px_rgba(17,24,39,0.10)] backdrop-blur sm:p-9">
            <div>
              <p className="text-sm font-black text-[#9A7D43]">مرحبًا بعودتك</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight">تسجيل الدخول</h2>
              <p className="mt-3 text-sm leading-7 text-slate-500">استخدم البريد الإلكتروني أو رقم واتساب المرتبط بحسابك.</p>
            </div>

            <form onSubmit={submit} className="mt-8 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-black">البريد الإلكتروني أو رقم واتساب</label>
                <input name="identifier" type="text" autoComplete="username" required disabled={loading} placeholder="name@example.com أو +963..." className="w-full rounded-2xl border border-[#D9D4C9] bg-[#FCFBF8] px-4 py-3.5 outline-none transition placeholder:text-slate-400 focus:border-[#111827] focus:bg-white focus:ring-4 focus:ring-black/5 disabled:bg-slate-50" />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label className="block text-sm font-black">كلمة المرور</label>
                  <Link href="/partner/forgot-password" className="text-xs font-black text-[#9A7D43] transition hover:text-[#111827]">نسيت كلمة المرور؟</Link>
                </div>
                <div className="relative">
                  <input name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required disabled={loading} placeholder="أدخل كلمة المرور" className="w-full rounded-2xl border border-[#D9D4C9] bg-[#FCFBF8] px-4 py-3.5 pl-12 outline-none transition placeholder:text-slate-400 focus:border-[#111827] focus:bg-white focus:ring-4 focus:ring-black/5 disabled:bg-slate-50" />
                  <button type="button" disabled={loading} onClick={() => setShowPassword((value) => !value)} className="absolute left-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-slate-400 transition hover:bg-black/5 hover:text-[#111827] disabled:opacity-50" aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}>
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <label className="flex w-fit cursor-pointer items-center gap-2 text-sm text-slate-600">
                <input name="remember" type="checkbox" disabled={loading} className="h-4 w-4 rounded accent-[#111827]" />
                تذكّرني على هذا الجهاز
              </label>

              <button disabled={loading} aria-busy={loading} className="flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-[#111827] px-5 py-3.5 font-black text-white shadow-[0_12px_30px_rgba(17,24,39,0.18)] transition hover:-translate-y-0.5 hover:bg-[#202837] disabled:cursor-wait disabled:opacity-75">
                <LogIn className={`h-5 w-5 ${loading ? "animate-pulse" : ""}`} />
                {loading ? "جارٍ تسجيل الدخول..." : "تسجيل الدخول"}
              </button>
            </form>

            {message && <p role="alert" className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{message}</p>}

            <div className="mt-7 border-t border-[#ECE8DF] pt-6 text-center">
              <p className="text-sm text-slate-500">الوصول متاح للحسابات المقبولة فقط. <Link href="/?view=partner" className="font-black text-[#111827] underline decoration-[#B89A5A] decoration-2 underline-offset-4">قدّم طلب تعاون</Link></p>
            </div>
          </section>
        </div>

        <footer className="flex items-center justify-between border-t border-black/5 pt-5 text-xs text-slate-400">
          <span>© CyberWeel</span>
          <span>وضوح. قرار. تقدّم.</span>
        </footer>
      </div>
    </main>
  );
}
