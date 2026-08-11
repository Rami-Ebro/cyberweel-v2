"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { ChevronDown, Eye, EyeOff, Pencil } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";

type Ambassador = {
  id: string;
  referralNumber: number;
  status: "ACTIVE" | "SUSPENDED" | "PENDING";
  age: number | null;
  profileCompletedAt: string | null;
  user: { name: string | null; email: string; phone: string | null; isActive: boolean };
  referrals: {
    status: string;
    commissionAmount: string | null;
    commissionCurrency: string;
    commissionStatus: string;
  }[];
};

type Application = {
  id: string;
  name: string;
  email: string;
  age: number | null;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  market: string | null;
  details: string | null;
  decisionNotes: string | null;
};

export default function AmbassadorsAdmin() {
  const [data, setData] = useState<{ ambassadors: Ambassador[]; applications: Application[] }>({
    ambassadors: [],
    applications: [],
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const pendingApplications = data.applications.filter((application) => application.status === "PENDING");
  const decidedApplications = data.applications.filter((application) => application.status !== "PENDING");

  async function load() {
    const response = await fetch("/api/admin/ambassadors", { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "تعذر تحميل إدارة السفراء");
    setData(payload);
  }

  useEffect(() => {
    void Promise.resolve().then(() => load()).catch((cause) => setError(cause instanceof Error ? cause.message : "تعذر تحميل البيانات"));
  }, []);

  async function updateStatus(id: string, status: "ACTIVE" | "SUSPENDED") {
    setBusyId(id);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/ambassadors", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "تعذر تحديث حالة السفير");
      setMessage(status === "ACTIVE" ? "تم تفعيل السفير." : "تم تعليق السفير.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذر تحديث الحالة");
    } finally {
      setBusyId(null);
    }
  }

  async function saveAmbassadorAccount(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusyId(id);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/ambassadors", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entity: "account", id, name: form.get("name"), email: form.get("email"), phone: form.get("phone"), age: form.get("age") }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error || "تعذر تعديل بيانات السفير");
      setMessage("تم تعديل بيانات السفير بنجاح.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذر تعديل بيانات السفير");
    } finally {
      setBusyId(null);
    }
  }

  async function decideApplication(
    id: string,
    status: "ACCEPTED" | "REJECTED",
    notes: string,
    password: string,
  ) {
    setBusyId(id);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/ambassadors", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entity: "application", id, status, notes, password }),
      });
      const payload = await response.json();
      if (!response.ok) {
        const labels: Record<string, string> = {
          INVALID_DECISION: "ملاحظة القرار مطلوبة.",
          TEMP_PASSWORD_REQUIRED: "عند القبول أدخل كلمة مرور مؤقتة من 10 أحرف على الأقل.",
          EMAIL_EXISTS: "يوجد حساب بهذا البريد بالفعل.",
          ALREADY_DECIDED: "تم اتخاذ قرار سابق على هذا الطلب.",
        };
        throw new Error(labels[payload.error] || "تعذر حفظ القرار");
      }
      setMessage(status === "ACCEPTED" ? "تم قبول الطلب وإنشاء حساب السفير." : "تم رفض الطلب.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذر حفظ القرار");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AdminShell active="ambassadors" title="إدارة السفراء" description="الحسابات، رموز الإحالة، الأداء، العمولات وقرارات الطلبات." wide={false}>
        {message && <p className="mt-4 rounded-xl bg-emerald-50 p-3 font-bold text-emerald-800">{message}</p>}
        {error && <p className="mt-4 rounded-xl bg-rose-50 p-3 font-bold text-rose-800">{error}</p>}

        <section className="mt-7 grid gap-4">
          {data.ambassadors.map((ambassador) => {
            const total = ambassador.referrals.reduce(
              (sum, referral) => sum + Number(referral.commissionAmount || 0),
              0,
            );
            return (
              <article key={ambassador.id} className="rounded-2xl bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="font-black">{ambassador.user.name || ambassador.user.email}</h2>
                    <p className="text-sm text-slate-500">
                      {ambassador.user.email}{ambassador.user.phone ? ` · ${ambassador.user.phone}` : ""} · CWA-{String(ambassador.referralNumber).padStart(4, "0")}
                    </p>
                    <p className="mt-2 text-sm">
                      {ambassador.referrals.length} إحالة · عمولات مسجلة {total.toFixed(2)} · الملف{" "}
                      {ambassador.profileCompletedAt ? "مكتمل" : "غير مكتمل"} · الحالة {ambassador.status}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">العمر: {ambassador.age != null ? `${ambassador.age} سنة` : "غير محدد"}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      disabled={busyId === ambassador.id || ambassador.status === "ACTIVE"}
                      onClick={() => updateStatus(ambassador.id, "ACTIVE")}
                      className="rounded-lg bg-emerald-600 px-4 py-2 text-white disabled:opacity-40"
                    >
                      تفعيل
                    </button>
                    <button
                      disabled={busyId === ambassador.id || ambassador.status === "SUSPENDED"}
                      onClick={() => updateStatus(ambassador.id, "SUSPENDED")}
                      className="rounded-lg bg-red-600 px-4 py-2 text-white disabled:opacity-40"
                    >
                      تعليق
                    </button>
                    <Link
                      href={`/ambassador/dashboard?adminPreview=${ambassador.id}`}
                      className="rounded-lg border px-4 py-2"
                    >
                      فتح اللوحة
                    </Link>
                  </div>
                </div>
                <details className="group mt-4 rounded-xl border border-[#D8D2C4] bg-[#F7F3EB]">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 font-black text-[#9A7D43]"><span className="flex items-center gap-2"><Pencil className="h-4 w-4" />تعديل بيانات السفير</span><ChevronDown className="h-5 w-5 transition group-open:rotate-180" /></summary>
                  <form onSubmit={(event) => void saveAmbassadorAccount(event, ambassador.id)} className="grid gap-3 border-t border-[#D8D2C4] p-4 md:grid-cols-3">
                    <label className="grid gap-2 font-bold">الاسم<input name="name" required minLength={2} defaultValue={ambassador.user.name || ""} className="rounded-lg border p-3 font-normal" /></label>
                    <label className="grid gap-2 font-bold">البريد الإلكتروني<input name="email" type="email" required defaultValue={ambassador.user.email} className="rounded-lg border p-3 font-normal" /></label>
                    <label className="grid gap-2 font-bold">رقم الهاتف<input name="phone" defaultValue={ambassador.user.phone || ""} className="rounded-lg border p-3 font-normal" /></label>
                    <label className="grid gap-2 font-bold">العمر<input name="age" type="number" min="1" max="120" defaultValue={ambassador.age ?? ""} className="rounded-lg border p-3 font-normal" /></label>
                    <button disabled={busyId === ambassador.id} className="rounded-lg bg-[#111827] px-4 py-3 font-black text-white disabled:opacity-40 md:col-span-3">{busyId === ambassador.id ? "جارٍ الحفظ..." : "حفظ بيانات السفير"}</button>
                  </form>
                </details>
              </article>
            );
          })}
        </section>

        <h2 className="mt-10 text-2xl font-black">طلبات السفراء المعلّقة</h2>
        <div className="mt-4 grid gap-3">
          {pendingApplications.map((application) => (
            <ApplicationCard
              key={application.id}
              application={application}
              busy={busyId === application.id}
              onDecision={decideApplication}
            />
          ))}
          {!pendingApplications.length && <p className="rounded-xl bg-white p-5 text-slate-500">لا توجد طلبات سفراء معلّقة.</p>}
        </div>

        {decidedApplications.length > 0 && (
          <details className="mt-7 rounded-2xl bg-white shadow-sm">
            <summary className="cursor-pointer list-none p-5 text-lg font-black">
              سجل قرارات طلبات السفراء ({decidedApplications.length})
              <span className="mr-2 text-sm font-normal text-slate-500">مقبولة ومرفوضة — سجل تاريخي</span>
            </summary>
            <div className="grid gap-3 border-t border-[#E6E0D4] p-5">
              {decidedApplications.map((application) => (
                <ApplicationCard
                  key={application.id}
                  application={application}
                  busy={false}
                  onDecision={decideApplication}
                />
              ))}
            </div>
          </details>
        )}
    </AdminShell>
  );
}

function ApplicationCard({
  application,
  busy,
  onDecision,
}: {
  application: Application;
  busy: boolean;
  onDecision: (id: string, status: "ACCEPTED" | "REJECTED", notes: string, password: string) => Promise<void>;
}) {
  const [showPassword, setShowPassword] = useState(false);

  async function submit(formElement: HTMLFormElement, status: "ACCEPTED" | "REJECTED") {
    const form = new FormData(formElement);
    await onDecision(
      application.id,
      status,
      String(form.get("notes") || "").trim(),
      String(form.get("password") || ""),
    );
  }

  return (
    <article className="rounded-xl bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <b>{application.name}</b>
          <p className="text-sm text-slate-500">
            {application.email} · {application.market || "—"} · العمر {application.age != null ? application.age : "غير محدد"}
          </p>
        </div>
        <span className="rounded-full bg-[#F4F1EA] px-3 py-1 text-xs font-black">{application.status}</span>
      </div>
      {application.details && <p className="mt-3">{application.details}</p>}
      {application.status === "PENDING" ? (
        <details className="group mt-4 rounded-xl border border-[#D8D2C4] bg-[#F7F3EB]">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 font-black text-[#9A7D43]">مراجعة الطلب واتخاذ القرار<ChevronDown className="h-5 w-5 transition group-open:rotate-180" /></summary>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void submit(event.currentTarget, "ACCEPTED");
          }}
          className="grid gap-3 border-t border-[#D8D2C4] p-4 md:grid-cols-2"
        >
          <input name="notes" required placeholder="ملاحظة القرار" className="rounded-lg border p-3" />
          <div className="relative">
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              minLength={10}
              autoComplete="new-password"
              placeholder="كلمة مرور مؤقتة عند القبول"
              className="w-full rounded-lg border p-3 pl-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          <div className="flex gap-2 md:col-span-2">
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-emerald-600 px-4 py-2 font-bold text-white disabled:opacity-40"
            >
              قبول وإنشاء الحساب
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={(event) => void submit(event.currentTarget.form!, "REJECTED")}
              className="rounded-lg bg-rose-600 px-4 py-2 font-bold text-white disabled:opacity-40"
            >
              رفض
            </button>
          </div>
        </form>
        </details>
      ) : (
        <div className="mt-3 text-sm text-slate-500">
          <p className="font-bold text-slate-700">
            حالة القرار: {application.status === "ACCEPTED" ? "مقبول — تم إنشاء الحساب" : "مرفوض — لم يُنشأ حساب"}
          </p>
          {application.decisionNotes && <p className="mt-1">ملاحظات الإدارة: {application.decisionNotes}</p>}
        </div>
      )}
    </article>
  );
}
