"use client";

import Link from "next/link";
import { Eye, EyeOff, Home, Save, ShieldCheck } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/brand/logo";

type Account = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: "ADMIN" | "PARTNER" | "CLIENT";
};

export default function AccountSettingsPage() {
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
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
      .catch((error) => setMessage(error instanceof Error ? error.message : "تعذر تحميل إعدادات الحساب"))
      .finally(() => setLoading(false));
  }, [router]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setMessage("");
    const form = new FormData(event.currentTarget);

    const response = await fetch("/api/account/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        currentPassword: form.get("currentPassword"),
        newPassword: form.get("newPassword"),
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error || "تعذر حفظ الإعدادات");
      setSaving(false);
      return;
    }

    setAccount(data.account);
    setMessage("تم حفظ إعدادات الحساب بنجاح");
    event.currentTarget.reset();
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setSaving(false);
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[#F7F3EB] px-4 py-10 text-[#111827]">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <Logo size={48} />
            <span className="font-black">CyberWeel</span>
          </Link>
          <Link href="/" className="flex items-center gap-2 rounded-xl border border-[#D8D2C4] bg-white px-4 py-2.5 font-bold shadow-sm">
            <Home className="h-4 w-4" />
            العودة إلى الموقع
          </Link>
        </div>

        <section className="mt-8 rounded-3xl border border-[#D8D2C4] bg-white p-6 shadow-xl sm:p-8">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#111827] text-white"><ShieldCheck className="h-6 w-6" /></span>
            <div>
              <p className="text-sm font-bold text-[#9A7D43]">حساب CyberWeel</p>
              <h1 className="text-2xl font-black">إعدادات الحساب</h1>
            </div>
          </div>

          {loading && <p className="mt-8 rounded-xl bg-[#F7F3EB] p-4 text-center font-bold">جارٍ تحميل بيانات الحساب...</p>}
          {message && <p className="mt-5 rounded-xl border border-[#D8D2C4] bg-[#F7F3EB] p-4 font-bold">{message}</p>}

          {!loading && account && (
            <form onSubmit={save} className="mt-8 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-black">الاسم</label>
                <input name="name" defaultValue={account.name || ""} required className="w-full rounded-xl border border-[#D8D2C4] px-4 py-3 outline-none focus:border-[#B89A5A]" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-black">البريد الإلكتروني</label>
                <input name="email" type="email" defaultValue={account.email} placeholder={account.phone ? "يمكنك إضافة بريد إلكتروني" : "البريد الإلكتروني"} className="w-full rounded-xl border border-[#D8D2C4] px-4 py-3 outline-none focus:border-[#B89A5A]" />
              </div>
              {account.phone && (
                <div>
                  <label className="mb-2 block text-sm font-black">رقم واتساب</label>
                  <input value={account.phone} readOnly className="w-full rounded-xl border border-[#D8D2C4] bg-slate-50 px-4 py-3 text-slate-500" />
                </div>
              )}

              <div className="border-t border-[#D8D2C4] pt-5">
                <h2 className="font-black">تغيير كلمة المرور</h2>
                <p className="mt-1 text-sm text-slate-500">اترك الحقول فارغة إن لم ترغب بتغييرها.</p>
              </div>
              <div className="relative">
                <input name="currentPassword" type={showCurrentPassword ? "text" : "password"} placeholder="كلمة المرور الحالية" className="w-full rounded-xl border border-[#D8D2C4] px-4 py-3 pl-12 outline-none focus:border-[#B89A5A]" />
                <button type="button" onClick={() => setShowCurrentPassword((value) => !value)} className="absolute left-3 top-1/2 -translate-y-1/2 p-2 text-slate-500" aria-label="إظهار أو إخفاء كلمة المرور الحالية">
                  {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <div className="relative">
                <input name="newPassword" type={showNewPassword ? "text" : "password"} placeholder="كلمة المرور الجديدة" className="w-full rounded-xl border border-[#D8D2C4] px-4 py-3 pl-12 outline-none focus:border-[#B89A5A]" />
                <button type="button" onClick={() => setShowNewPassword((value) => !value)} className="absolute left-3 top-1/2 -translate-y-1/2 p-2 text-slate-500" aria-label="إظهار أو إخفاء كلمة المرور الجديدة">
                  {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              <button disabled={saving} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#111827] px-4 py-3 font-black text-white disabled:opacity-70">
                <Save className="h-5 w-5" />
                {saving ? "جارٍ الحفظ..." : "حفظ الإعدادات"}
              </button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
