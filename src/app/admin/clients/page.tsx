"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { ChevronDown, Eye, EyeOff, MailPlus, PauseCircle, PlayCircle, UserPlus, UsersRound } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";

type Client = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  company: string | null;
  preferredLanguage: string;
  clientSource: string | null;
  internalNotes: string | null;
  isActive: boolean;
  hasLogin: boolean;
  createdAt: string;
  clientProjects: Array<{ id: string; title: string; status: string; progress: number }>;
};

type ClientPayload = {
  name: string;
  email: string;
  phone: string;
  company: string;
  preferredLanguage: string;
  clientSource: string;
  internalNotes: string;
  isActive: boolean;
  password: string;
  sendInvite: boolean;
  confirmPhoneDuplicate?: boolean;
};

export default function AdminClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [accessMethod, setAccessMethod] = useState<"NONE" | "INVITE" | "PASSWORD">("INVITE");
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState<string[]>([]);
  const [updatingId, setUpdatingId] = useState("");
  const [pendingPhonePayload, setPendingPhonePayload] = useState<ClientPayload | null>(null);
  const [phoneMatchLabel, setPhoneMatchLabel] = useState("");

  async function load(clearMessage = true) {
    setLoading(true);
    if (clearMessage) setMessage("");
    const response = await fetch("/api/admin/clients", { cache: "no-store" });
    const data = await response.json().catch(() => null);
    if (!response.ok) setMessage(data?.error || "تعذر تحميل العملاء");
    else setClients(data.clients || []);
    setLoading(false);
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, []);

  async function submitClient(payload: ClientPayload, form?: HTMLFormElement) {
    setCreating(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => null);
      if (result?.error === "PHONE_MATCH_REQUIRES_CONFIRMATION") {
        setPendingPhonePayload(payload);
        setPhoneMatchLabel(`${result.phoneMatch?.name || "حساب مسجل"} — ${result.phoneMatch?.email || "دون بريد"}`);
        return;
      }
      setMessage(response.ok
        ? result?.inviteRequested && !result?.inviteSent
          ? "تم حفظ العميل، لكن تعذر إرسال الدعوة. يمكنك إرسالها لاحقًا من بطاقة العميل."
          : "تم حفظ العميل بنجاح"
        : result?.error || "تعذر حفظ العميل");
      if (response.ok) {
        form?.reset();
        setAccessMethod("INVITE");
        setShowCreatePassword(false);
        setPendingPhonePayload(null);
        setCreateOpen(false);
        await load(false);
      }
    } finally {
      setCreating(false);
    }
  }

  function createClient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const payload: ClientPayload = {
      name: String(data.get("name") || ""),
      email: String(data.get("email") || ""),
      phone: String(data.get("phone") || ""),
      company: String(data.get("company") || ""),
      preferredLanguage: String(data.get("preferredLanguage") || "ar"),
      clientSource: String(data.get("clientSource") || "DIRECT"),
      internalNotes: String(data.get("internalNotes") || ""),
      isActive: data.get("isActive") === "ACTIVE",
      password: accessMethod === "PASSWORD" ? String(data.get("password") || "") : "",
      sendInvite: accessMethod === "INVITE",
    };
    void submitClient(payload, form);
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

  async function sendInvitation(client: Client) {
    setUpdatingId(client.id);
    try {
      const response = await fetch(`/api/admin/clients/${client.id}/invite`, { method: "POST" });
      const result = await response.json().catch(() => null);
      setMessage(response.ok ? `تم إرسال دعوة الدخول إلى ${client.email}` : result?.error || "تعذر إرسال الدعوة");
    } finally { setUpdatingId(""); }
  }

  async function saveClientProfile(client: Client, form: HTMLFormElement, confirmPhoneDuplicate = false) {
    const data = new FormData(form);
    const password = String(data.get("password") || "");
    setUpdatingId(client.id);
    try {
      const response = await fetch("/api/admin/clients", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: client.id,
          profile: true,
          name: data.get("name"),
          email: data.get("email"),
          phone: data.get("phone"),
          company: data.get("company"),
          preferredLanguage: data.get("preferredLanguage"),
          clientSource: data.get("clientSource"),
          internalNotes: data.get("internalNotes"),
          password,
          confirmPhoneDuplicate,
        }),
      });
      const result = await response.json().catch(() => null);
      if (result?.error === "PHONE_MATCH_REQUIRES_CONFIRMATION" && !confirmPhoneDuplicate) {
        if (window.confirm("رقم الهاتف مستخدم في حساب آخر. هل تريد حفظه رغم ذلك؟")) {
          await saveClientProfile(client, form, true);
        }
        return;
      }
      setMessage(response.ok ? "تم حفظ بيانات العميل" : result?.message || result?.error || "تعذر حفظ بيانات العميل");
      if (response.ok) {
        const passwordInput = form.elements.namedItem("password") as HTMLInputElement | null;
        if (passwordInput) passwordInput.value = "";
        await load(false);
      }
    } finally {
      setUpdatingId("");
    }
  }

  return (
    <AdminShell active="clients" title="إدارة حسابات العملاء" description="ملف واحد لكل عميل، وتحته جميع المشاريع المرتبطة به.">
      {message && <p role="status" className="mt-5 rounded-xl border border-[#D8D2C4] bg-white p-4 font-bold">{message}</p>}

      <section className="mt-7 grid gap-5">
        <div className="flex items-center gap-3"><UsersRound className="h-6 w-6" /><h2 className="text-2xl font-black">حسابات العملاء</h2></div>
        {loading ? <p className="rounded-2xl bg-white p-8 text-center">جارٍ التحميل...</p> : clients.length ? clients.map((client) => (
          <details key={client.id} className="group rounded-2xl border border-[#D8D2C4] bg-white shadow-sm">
            <summary className="flex cursor-pointer list-none flex-wrap justify-between gap-4 p-6">
            <div className="flex flex-wrap justify-between gap-4">
              <div>
                <Link href={`/admin/clients/${client.id}`} className="text-xl font-black underline decoration-[#B89A5A] decoration-2 underline-offset-4 hover:text-[#9A7D43]">{client.name || "دون اسم"}</Link>
                <p className="mt-1 text-sm text-slate-500">{client.email}{client.phone ? ` · ${client.phone}` : ""}</p>
                {client.company && <p className="mt-1 text-sm text-slate-500">{client.company}</p>}
                <p className="mt-1 text-xs font-bold text-[#9A7D43]">{client.hasLogin ? "بيانات الدخول مضبوطة" : "لم يضبط العميل كلمة المرور بعد"}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-black ${client.isActive ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>{client.isActive ? "الحساب فعال" : "الحساب معلّق"}</span>
            </div>
            <span className="flex items-center gap-2 font-black text-[#9A7D43]">تعديل البيانات<ChevronDown className="h-5 w-5 transition group-open:rotate-180" /></span>
            </summary>
            <form onSubmit={(event) => { event.preventDefault(); void saveClientProfile(client, event.currentTarget); }} className="border-t border-[#D8D2C4] p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 font-bold">اسم العميل<input name="name" required minLength={2} defaultValue={client.name || ""} className="rounded-xl border border-[#D8D2C4] px-4 py-3 font-normal" /></label>
              <label className="grid gap-2 font-bold">البريد الإلكتروني<input name="email" type="email" required defaultValue={client.email} className="rounded-xl border border-[#D8D2C4] px-4 py-3 font-normal" /></label>
              <label className="grid gap-2 font-bold">رقم الهاتف<input name="phone" defaultValue={client.phone || ""} className="rounded-xl border border-[#D8D2C4] px-4 py-3 font-normal" /></label>
              <label className="grid gap-2 font-bold">الشركة<input name="company" defaultValue={client.company || ""} className="rounded-xl border border-[#D8D2C4] px-4 py-3 font-normal" /></label>
              <label className="grid gap-2 font-bold">اللغة<select name="preferredLanguage" defaultValue={client.preferredLanguage || "ar"} className="rounded-xl border border-[#D8D2C4] bg-white px-4 py-3 font-normal"><option value="ar">العربية</option><option value="en">English</option></select></label>
              <label className="grid gap-2 font-bold">مصدر العميل<input name="clientSource" defaultValue={client.clientSource || ""} className="rounded-xl border border-[#D8D2C4] px-4 py-3 font-normal" /></label>
              <label className="grid gap-2 font-bold md:col-span-2">ملاحظات داخلية<textarea name="internalNotes" rows={3} defaultValue={client.internalNotes || ""} className="rounded-xl border border-[#D8D2C4] px-4 py-3 font-normal" /></label>
            </div>
            <div className="mt-5 rounded-xl bg-[#F7F3EB] p-4"><p className="font-black">مشاريع العميل</p>
              <div className="mt-3 grid gap-2">{client.clientProjects.length ? client.clientProjects.map((project) => <Link href={`/admin/clients/${client.id}`} key={project.id} className="flex justify-between rounded-lg bg-white px-4 py-3 hover:ring-1 hover:ring-[#B89A5A]"><b>{project.title}</b><span>{project.progress}%</span></Link>) : <p className="text-sm text-slate-500">لا توجد مشاريع مرتبطة.</p>}</div>
            </div>
            <div className="relative mt-5 max-w-xl">
              <input name="password" autoComplete="new-password" type={visiblePasswords.includes(client.id) ? "text" : "password"} minLength={8} placeholder="كلمة مرور جديدة" className="w-full rounded-xl border border-[#D8D2C4] px-4 py-3 pl-12" />
              <button type="button" onClick={() => setVisiblePasswords((items) => items.includes(client.id) ? items.filter((id) => id !== client.id) : [...items, client.id])} className="absolute left-3 top-1/2 -translate-y-1/2 p-2">{visiblePasswords.includes(client.id) ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <button disabled={updatingId === client.id} className="rounded-xl bg-[#111827] px-5 py-3 font-black text-white disabled:opacity-50">حفظ التعديلات</button>
              <button type="button" disabled={updatingId === client.id} onClick={() => void sendInvitation(client)} className="flex items-center gap-2 rounded-xl border border-[#B89A5A] px-5 py-3 font-black text-[#9A7D43] disabled:opacity-50"><MailPlus className="h-5 w-5" />إرسال دعوة الدخول</button>
              <button type="button" disabled={updatingId === client.id} onClick={() => void updateClient(client, { isActive: !client.isActive })} className="flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-5 py-3 font-black text-amber-800">
                {client.isActive ? <PauseCircle className="h-5 w-5" /> : <PlayCircle className="h-5 w-5" />}{client.isActive ? "تعليق الحساب" : "تفعيل الحساب"}
              </button>
            </div>
            </form>
          </details>
        )) : <p className="rounded-2xl bg-white p-8 text-center">لا توجد حسابات عملاء بعد.</p>}
      </section>

      <section className="mt-7 rounded-2xl border border-[#D8D2C4] bg-white shadow-sm">
        <button type="button" aria-expanded={createOpen} aria-controls="create-client-form" onClick={() => setCreateOpen((value) => !value)} className="flex w-full items-center justify-between gap-4 p-6 text-right">
          <span><span className="flex items-center gap-3"><UserPlus className="h-6 w-6" /><span className="text-2xl font-black">إضافة عميل جديد</span></span><span className="mt-2 block text-sm text-slate-500">نموذج العميل فقط؛ بلا إحالات أو عمولات أو إنشاء مشروع تلقائي.</span></span>
          <ChevronDown className={`h-6 w-6 shrink-0 transition-transform ${createOpen ? "rotate-180" : ""}`} />
        </button>
        {createOpen && (
          <form id="create-client-form" onSubmit={createClient} className="grid gap-4 border-t border-[#D8D2C4] p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <input name="name" required minLength={2} placeholder="اسم العميل" className="rounded-xl border border-[#D8D2C4] px-4 py-3" />
              <input name="email" type="email" required placeholder="البريد الإلكتروني" className="rounded-xl border border-[#D8D2C4] px-4 py-3" />
              <input name="phone" placeholder="الهاتف — اختياري" className="rounded-xl border border-[#D8D2C4] px-4 py-3" />
              <input name="company" placeholder="الشركة — اختياري" className="rounded-xl border border-[#D8D2C4] px-4 py-3" />
              <select name="preferredLanguage" defaultValue="ar" className="rounded-xl border border-[#D8D2C4] bg-white px-4 py-3"><option value="ar">العربية</option><option value="en">English</option></select>
              <select name="isActive" defaultValue="ACTIVE" className="rounded-xl border border-[#D8D2C4] bg-white px-4 py-3"><option value="ACTIVE">الحساب فعال</option><option value="SUSPENDED">الحساب معلّق</option></select>
              <input name="clientSource" defaultValue="DIRECT" placeholder="مصدر العميل" className="rounded-xl border border-[#D8D2C4] px-4 py-3" />
              <select value={accessMethod} onChange={(event) => setAccessMethod(event.target.value as typeof accessMethod)} className="rounded-xl border border-[#D8D2C4] bg-white px-4 py-3"><option value="INVITE">إرسال دعوة لتعيين كلمة المرور</option><option value="PASSWORD">تحديد كلمة مرور الآن</option><option value="NONE">الحفظ دون دعوة أو كلمة مرور</option></select>
            </div>
            {accessMethod === "PASSWORD" && <div className="relative max-w-xl"><input name="password" required minLength={8} autoComplete="new-password" type={showCreatePassword ? "text" : "password"} placeholder="كلمة مرور مؤقتة — 8 أحرف على الأقل" className="w-full rounded-xl border border-[#D8D2C4] px-4 py-3 pl-12" /><button type="button" onClick={() => setShowCreatePassword((value) => !value)} className="absolute left-3 top-1/2 -translate-y-1/2 p-2">{showCreatePassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button></div>}
            <textarea name="internalNotes" rows={4} placeholder="ملاحظات داخلية — لا تظهر للعميل" className="rounded-xl border border-[#D8D2C4] px-4 py-3" />
            {pendingPhonePayload && <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900"><p className="font-black">رقم الهاتف موجود في حساب آخر</p><p className="mt-1 text-sm">{phoneMatchLabel}. البريد هو المعرّف الأساسي؛ تابع فقط إذا كان تكرار الهاتف مقصودًا.</p><div className="mt-3 flex gap-2"><button type="button" disabled={creating} onClick={() => void submitClient({ ...pendingPhonePayload, confirmPhoneDuplicate: true })} className="rounded-lg bg-amber-800 px-4 py-2 font-bold text-white">تأكيد الحفظ</button><button type="button" onClick={() => setPendingPhonePayload(null)} className="rounded-lg border border-amber-400 px-4 py-2 font-bold">إلغاء</button></div></div>}
            <button disabled={creating} className="w-fit rounded-xl bg-[#B89A5A] px-6 py-3 font-black disabled:opacity-60">{creating ? "جارٍ الحفظ..." : "حفظ العميل"}</button>
          </form>
        )}
      </section>
    </AdminShell>
  );
}
