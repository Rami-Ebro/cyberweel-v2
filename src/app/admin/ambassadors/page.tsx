"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/admin-shell";

type Ambassador = {
  id: string;
  referralNumber: number;
  status: "ACTIVE" | "SUSPENDED" | "PENDING";
  profileCompletedAt: string | null;
  user: { name: string | null; email: string; isActive: boolean };
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
                      {ambassador.user.email} · CWA-{String(ambassador.referralNumber).padStart(4, "0")}
                    </p>
                    <p className="mt-2 text-sm">
                      {ambassador.referrals.length} إحالة · عمولات مسجلة {total.toFixed(2)} · الملف{" "}
                      {ambassador.profileCompletedAt ? "مكتمل" : "غير مكتمل"} · الحالة {ambassador.status}
                    </p>
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
              </article>
            );
          })}
        </section>

        <h2 className="mt-10 text-2xl font-black">طلبات السفراء</h2>
        <div className="mt-4 grid gap-3">
          {data.applications.map((application) => (
            <ApplicationCard
              key={application.id}
              application={application}
              busy={busyId === application.id}
              onDecision={decideApplication}
            />
          ))}
          {!data.applications.length && <p className="rounded-xl bg-white p-5 text-slate-500">لا توجد طلبات سفراء.</p>}
        </div>
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
            {application.email} · {application.market || "—"}
          </p>
        </div>
        <span className="rounded-full bg-[#F4F1EA] px-3 py-1 text-xs font-black">{application.status}</span>
      </div>
      {application.details && <p className="mt-3">{application.details}</p>}
      {application.status === "PENDING" ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void submit(event.currentTarget, "ACCEPTED");
          }}
          className="mt-4 grid gap-3 md:grid-cols-2"
        >
          <input name="notes" required placeholder="ملاحظة القرار" className="rounded-lg border p-3" />
          <input
            name="password"
            type="password"
            minLength={10}
            placeholder="كلمة مرور مؤقتة عند القبول"
            className="rounded-lg border p-3"
          />
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
      ) : (
        application.decisionNotes && <p className="mt-3 text-sm text-slate-500">القرار: {application.decisionNotes}</p>
      )}
    </article>
  );
}
