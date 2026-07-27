"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { Eye, EyeOff, PauseCircle, PlayCircle, UserPlus, UsersRound } from "lucide-react";

type Referral = { id: string; name: string | null; email: string | null; phone: string | null };
type Client = {
  id: string; name: string | null; email: string; phone: string | null; isActive: boolean; createdAt: string;
  clientProjects: Array<{ id: string; title: string; status: string; progress: number }>;
};

export default function AdminClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [selectedReferralId, setSelectedReferralId] = useState("");
  const [visiblePasswords, setVisiblePasswords] = useState<string[]>([]);
  const [updatingId, setUpdatingId] = useState("");

  async function load(clearMessage = true) {
    setLoading(true);
    if (clearMessage) setMessage("");
    const response = await fetch("/api/admin/clients", { cache: "no-store" });
    const data = await response.json().catch(() => null);
    if (!response.ok) setMessage(data?.error || "تعذر تحميل العملاء");
    else { setClients(data.clients || []); setReferrals(data.referrals || []); }
    setLoading(false);
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, []);

  async function createClient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setCreating(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"), identifier: data.get("identifier"), password: data.get("password"),
          referralId: data.get("referralId"), projectTitle: data.get("projectTitle"),
        }),
      });
      const result = await response.json().catch(() => null);
      setMessage(response.ok ? "تم إنشاء حساب العميل بنجاح" : result?.error || "تعذر إنشاء حساب العميل");
      if (response.ok) {
        form.reset();
        setShowCreatePassword(false);
        setSelectedReferralId("");
        await load(false);
      }
    } finally { setCreating(false); }
  }

  async function updateClient(client: Client, values: { isActive?: boolean; password?: string }) {
    setUpdatingId(client.id);
    try {
      const response = await fetch("/api/admin/clients", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: client.id, ...values }),
      });
      const result = await response.json().catch(() => null);
      setMessage(response.ok
        ? values.password ? "تم تغيير كلمة مرور العميل" : values.isActive ? "تم تفعيل حساب العميل" : "تم تعليق حساب العميل"
        : result?.error || "تعذر تحديث حساب العميل");
      if (response.ok) await load(false);
    } finally { setUpdatingId(""); }
  }

  async function resetPassword(client: Client, form: HTMLFormElement) {
    const input = form.elements.namedItem("password") as HTMLInputElement | null;
    const password = input?.value || "";
    if (password.length < 8) return setMessage("أدخل كلمة مرور جديدة من 8 أحرف على الأقل");
    await updateClient(client, { password });
    if (input) input.value = "";
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[#F7F3EB] p-4 text-[#111827] sm:p-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div><p className="text-sm font-bold text-[#9A7D43]">لوحة الإدارة</p><h1 className="mt-1 text-3xl font-black">إدارة حسابات العملاء</h1></div>
          <Link href="/admin/partners" className="rounded-xl bg-[#111827] px-5 py-3 font-bold text-white">العودة إلى لوحة الإدارة</Link>
        </header>
        {message && <p role="status" className="mt-5 rounded-xl border border-[#D8D2C4] bg-white p-4 font-bold">{message}</p>}

        <section className="mt-7 rounded-2xl border border-[#D8D2C4] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3"><UserPlus className="h-6 w-6" /><h2 className="text-2xl font-black">إنشاء حساب عميل</h2></div>
          <p className="mt-2 text-sm text-slate-500">أنشئ الحساب منفردًا أو اربطه بإحالة محوّلة إلى مشروع.</p>
          <form onSubmit={createClient} className="mt-6 grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <input name="name" required minLength={2} placeholder="اسم العميل" className="rounded-xl border border-[#D8D2C4] px-4 py-3" />
              <input name="identifier" required placeholder="البريد الإلكتروني أو رقم واتساب" className="rounded-xl border border-[#D8D2C4] px-4 py-3" />
            </div>
            <div className="relative max-w-xl">
              <input name="password" required minLength={8} autoComplete="new-password" type={showCreatePassword ? "text" : "password"} placeholder="كلمة مرور مؤقتة — 8 أحرف على الأقل" className="w-full rounded-xl border border-[#D8D2C4] px-4 py-3 pl-12" />
              <button type="button" onClick={() => setShowCreatePassword((value) => !value)} className="absolute left-3 top-1/2 -translate-y-1/2 p-2">{showCreatePassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button>
            </div>
            <div className={`grid gap-4 ${selectedReferralId ? "md:grid-cols-2" : ""}`}>
              <div>
              <select
                name="referralId"
                value={selectedReferralId}
                onChange={(event) => setSelectedReferralId(event.target.value)}
                className="w-full rounded-xl border border-[#D8D2C4] bg-white px-4 py-3"
              >
                <option value="">دون إحالة مرتبطة</option>
                {referrals.map((item) => <option key={item.id} value={item.id}>{item.name || item.email || item.phone || "إحالة دون اسم"}</option>)}
              </select>
              {!referrals.length && (
                <p className="mt-2 text-sm text-slate-500">
                  لا توجد إحالات محوّلة إلى مشروع ومتاحة للربط حاليًا.
                </p>
              )}
              </div>
              {selectedReferralId && (
                <input
                  name="projectTitle"
                  required
                  placeholder="اسم المشروع المرتبط بالإحالة"
                  className="rounded-xl border border-[#D8D2C4] px-4 py-3"
                />
              )}
            </div>
            <button disabled={creating} className="w-fit rounded-xl bg-[#B89A5A] px-6 py-3 font-black disabled:opacity-60">{creating ? "جارٍ الإنشاء..." : "إنشاء حساب العميل"}</button>
          </form>
        </section>

        <section className="mt-7 grid gap-5">
          <div className="flex items-center gap-3"><UsersRound className="h-6 w-6" /><h2 className="text-2xl font-black">حسابات العملاء</h2></div>
          {loading ? <p className="rounded-2xl bg-white p-8 text-center">جارٍ التحميل...</p> : clients.length ? clients.map((client) => (
            <form key={client.id} onSubmit={(event) => { event.preventDefault(); void resetPassword(client, event.currentTarget); }} className="rounded-2xl border border-[#D8D2C4] bg-white p-6 shadow-sm">
              <div className="flex flex-wrap justify-between gap-4">
                <div><h3 className="text-xl font-black">{client.name || "دون اسم"}</h3><p className="text-sm text-slate-500">{client.phone || client.email}</p></div>
                <span className={`rounded-full px-3 py-1 text-xs font-black ${client.isActive ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>{client.isActive ? "الحساب فعال" : "الحساب معلّق"}</span>
              </div>
              <div className="mt-5 rounded-xl bg-[#F7F3EB] p-4"><p className="font-black">المشاريع المرتبطة</p>
                <div className="mt-3 grid gap-2">{client.clientProjects.length ? client.clientProjects.map((project) => <div key={project.id} className="flex justify-between rounded-lg bg-white px-4 py-3"><b>{project.title}</b><span>{project.progress}%</span></div>) : <p className="text-sm text-slate-500">لا توجد مشاريع مرتبطة.</p>}</div>
              </div>
              <div className="relative mt-5 max-w-xl">
                <input name="password" autoComplete="new-password" type={visiblePasswords.includes(client.id) ? "text" : "password"} minLength={8} placeholder="كلمة مرور جديدة" className="w-full rounded-xl border border-[#D8D2C4] px-4 py-3 pl-12" />
                <button type="button" onClick={() => setVisiblePasswords((items) => items.includes(client.id) ? items.filter((id) => id !== client.id) : [...items, client.id])} className="absolute left-3 top-1/2 -translate-y-1/2 p-2">{visiblePasswords.includes(client.id) ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <button disabled={updatingId === client.id} className="rounded-xl bg-[#111827] px-5 py-3 font-black text-white disabled:opacity-50">تغيير كلمة المرور</button>
                <button type="button" disabled={updatingId === client.id} onClick={() => void updateClient(client, { isActive: !client.isActive })} className="flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-5 py-3 font-black text-amber-800">
                  {client.isActive ? <PauseCircle className="h-5 w-5" /> : <PlayCircle className="h-5 w-5" />}{client.isActive ? "تعليق الحساب" : "تفعيل الحساب"}
                </button>
              </div>
            </form>
          )) : <p className="rounded-2xl bg-white p-8 text-center">لا توجد حسابات عملاء بعد.</p>}
        </section>
      </div>
    </main>
  );
}
