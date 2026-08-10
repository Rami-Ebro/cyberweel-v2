"use client";

import Link from "next/link";
import { Eye, EyeOff, Home, KeyRound, Mail, Phone, Save, ShieldCheck, UserRound } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/brand/logo";

type Account = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: "ADMIN" | "PARTNER" | "AMBASSADOR" | "CLIENT";
};

const roleLabel: Record<Account["role"], string> = {
  ADMIN: "إدارة",
  PARTNER: "شريك",
  AMBASSADOR: "سفير",
  CLIENT: "عميل",
};

export default function AccountSettingsPage() {
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  useEffect(() => {
    fetch("/api/account/settings", { cache: "no-store" })
      .then(async (response) => {
        if (response.status === 401) {
          router.replace("/login");
          return null;
        }
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "تعذر تحميل إعدادات الحساب");
        return data.account as Account;
      })
      .then((value) => value && setAccount(value))
      .catch((error) => {
        setIsError(true);
        setMessage(error instanceof Error ? error.message : "تعذر تحميل إعدادات الحساب");
      })
      .finally(() => setLoading(false));
  }, [router]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setMessage("");
    setIsError(false);
    const form = new FormData(event.currentTarget);

    const response = await fetch("/api/account/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        phone: form.get("phone"),
        currentPassword: form.get("currentPassword"),
        newPassword: form.get("newPassword"),
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      setIsError(true);
      setMessage(data.error || "تعذر حفظ الإعدادات");
      setSaving(false);
      return;
    }

    setAccount(data.account);
    setMessage("تم حفظ إعدادات الحساب بنجاح");
    const formElement = event.currentTarget;
    formElement.querySelectorAll<HTMLInputElement>('input[type="password"]').forEach((input) => { input.value = ""; });
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setSaving(false);
  }

  const initial = (account?.name || "C").trim().charAt(0).toUpperCase();

  return (
    <main dir="rtl" className="min-h-screen bg-[#F7F3EB] text-[#111827]">
      <header className="border-b border-[#D8D2C4]/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <Logo size={46} />
            <span className="text-lg font-black">CyberWeel</span>
          </Link>
          <Link href="/" className="flex items-center gap-2 rounded-xl border border-[#D8D2C4] bg-white px-4 py-2.5 text-sm font-black shadow-sm transition hover:border-[#B89A5A] hover:bg-[#F7F3EB]">
            <Home className="h-4 w-4" />
            العودة إلى الموقع
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-7">
          <p className="text-sm font-black text-[#9A7D43]">حساب CyberWeel</p>
          <h1 className="mt-1 text-3xl font-black sm:text-4xl">إعدادات الحساب</h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-500">حدّث بياناتك الشخصية وكلمة المرور من مكان واحد.</p>
        </div>

        {loading && <div className="rounded-3xl border border-[#D8D2C4] bg-white p-10 text-center font-black shadow-sm">جارٍ تحميل بيانات الحساب...</div>}

        {message && (
          <div className={`mb-6 rounded-2xl border p-4 font-black ${isError ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
            {message}
          </div>
        )}

        {!loading && account && (
          <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
            <aside className="h-fit rounded-3xl bg-[#111827] p-6 text-white shadow-xl lg:sticky lg:top-6">
              <div className="flex flex-col items-center text-center">
                <div className="grid h-24 w-24 place-items-center rounded-full border-4 border-white/10 bg-[#B89A5A] text-4xl font-black text-[#111827] shadow-lg">{initial}</div>
                <h2 className="mt-5 text-2xl font-black">{account.name || "حساب CyberWeel"}</h2>
                <span className="mt-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-black text-white/80">{roleLabel[account.role]}</span>
              </div>

              <div className="mt-7 space-y-3 border-t border-white/10 pt-6 text-sm">
                {account.email && <div className="flex items-start gap-3 rounded-2xl bg-white/5 p-3"><Mail className="mt-0.5 h-5 w-5 shrink-0 text-[#B89A5A]" /><span className="break-all text-white/75" dir="ltr">{account.email}</span></div>}
                <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-3"><Phone className="h-5 w-5 text-[#B89A5A]" /><span className="text-white/75" dir="ltr">{account.phone || "غير مضاف"}</span></div>
              </div>

              <div className="mt-6 flex items-center gap-3 rounded-2xl border border-white/10 p-4 text-right">
                <ShieldCheck className="h-6 w-6 shrink-0 text-[#B89A5A]" />
                <p className="text-xs leading-6 text-white/60">بيانات حسابك محفوظة ولا تظهر للمستخدمين الآخرين.</p>
              </div>
            </aside>

            <form onSubmit={save} className="space-y-6">
              <section className="rounded-3xl border border-[#D8D2C4] bg-white p-6 shadow-sm sm:p-8">
                <div className="flex items-center gap-3 border-b border-[#EEE8DC] pb-5">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#F7F3EB] text-[#9A7D43]"><UserRound className="h-5 w-5" /></span>
                  <div><h2 className="text-xl font-black">البيانات الشخصية</h2><p className="mt-1 text-sm text-slate-500">المعلومات الأساسية المرتبطة بحسابك.</p></div>
                </div>

                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-sm font-black">الاسم الكامل</label>
                    <input name="name" defaultValue={account.name || ""} required className="w-full rounded-2xl border border-[#D8D2C4] bg-white px-4 py-3.5 outline-none transition focus:border-[#B89A5A] focus:ring-4 focus:ring-[#B89A5A]/10" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-black">البريد الإلكتروني</label>
                    <input name="email" type="email" defaultValue={account.email} placeholder="البريد الإلكتروني" className="w-full rounded-2xl border border-[#D8D2C4] bg-white px-4 py-3.5 outline-none transition focus:border-[#B89A5A] focus:ring-4 focus:ring-[#B89A5A]/10" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-black">رقم واتساب</label>
                    <input name="phone" type="tel" defaultValue={account.phone || ""} placeholder="مثال: +963 9xx xxx xxx" dir="ltr" className="w-full rounded-2xl border border-[#D8D2C4] bg-white px-4 py-3.5 text-right outline-none transition focus:border-[#B89A5A] focus:ring-4 focus:ring-[#B89A5A]/10" />
                    <p className="mt-2 text-xs text-slate-500">أدخل الرقم مع رمز الدولة.</p>
                  </div>
                </div>
              </section>

              <section className="rounded-3xl border border-[#D8D2C4] bg-white p-6 shadow-sm sm:p-8">
                <div className="flex flex-col gap-4 border-b border-[#EEE8DC] pb-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#F7F3EB] text-[#9A7D43]"><KeyRound className="h-5 w-5" /></span>
                    <div><h2 className="text-xl font-black">الأمان وكلمة المرور</h2><p className="mt-1 text-sm text-slate-500">اترك الحقول فارغة إن لم ترغب بتغيير كلمة المرور.</p></div>
                  </div>
                  <Link href="/partner/forgot-password" className="w-fit rounded-xl border border-[#D8D2C4] bg-[#F7F3EB] px-4 py-2.5 text-sm font-black text-[#9A7D43] transition hover:border-[#B89A5A] hover:bg-white">
                    نسيت كلمة المرور؟
                  </Link>
                </div>

                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-black">كلمة المرور الحالية</label>
                    <div className="relative">
                      <input name="currentPassword" type={showCurrentPassword ? "text" : "password"} placeholder="أدخل كلمة المرور الحالية" className="w-full rounded-2xl border border-[#D8D2C4] px-4 py-3.5 pl-12 outline-none transition focus:border-[#B89A5A] focus:ring-4 focus:ring-[#B89A5A]/10" />
                      <button type="button" onClick={() => setShowCurrentPassword((value) => !value)} className="absolute left-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-slate-500 transition hover:bg-[#F7F3EB]" aria-label="إظهار أو إخفاء كلمة المرور الحالية">
                        {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-black">كلمة المرور الجديدة</label>
                    <div className="relative">
                      <input name="newPassword" type={showNewPassword ? "text" : "password"} placeholder="8 أحرف على الأقل" className="w-full rounded-2xl border border-[#D8D2C4] px-4 py-3.5 pl-12 outline-none transition focus:border-[#B89A5A] focus:ring-4 focus:ring-[#B89A5A]/10" />
                      <button type="button" onClick={() => setShowNewPassword((value) => !value)} className="absolute left-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-slate-500 transition hover:bg-[#F7F3EB]" aria-label="إظهار أو إخفاء كلمة المرور الجديدة">
                        {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              <div className="flex justify-end">
                <button disabled={saving} className="flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-[#111827] px-7 py-3.5 font-black text-white shadow-lg transition hover:bg-[#1F2937] disabled:cursor-wait disabled:opacity-70 sm:w-auto">
                  <Save className="h-5 w-5" />
                  {saving ? "جارٍ الحفظ..." : "حفظ التغييرات"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
