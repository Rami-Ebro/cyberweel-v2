"use client";

import Link from "next/link";
import { FormEvent, Fragment, useEffect, useState } from "react";
import { ChevronDown, Eye, EyeOff, UserRoundCheck } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { DateText } from "@/components/ui/date-text";
import { dashboardErrorMessage, dashboardLabel } from "@/lib/dashboard-labels";

type RewardTotal = {
  currency: string;
  due: string;
  paid: string;
};

type Ambassador = {
  id: string;
  referralNumber: number;
  status: "ACTIVE" | "SUSPENDED" | "PENDING";
  age: number | null;
  profileCompletedAt: string | null;
  createdAt: string;
  lastActivityAt: string;
  user: { name: string | null; email: string; phone: string | null; isActive: boolean };
  referralStats: { total: number; successful: number; successfulThisMonth: number };
  currentLevel: {
    id: string;
    name: string;
    minSuccessfulReferrals: number;
    rate: string;
  } | null;
  rewardTotals: RewardTotal[];
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

const statusStyles: Record<Ambassador["status"], string> = {
  ACTIVE: "bg-emerald-100 text-emerald-800",
  SUSPENDED: "bg-rose-100 text-rose-800",
  PENDING: "bg-amber-100 text-amber-800",
};

export default function AmbassadorsAdmin() {
  const [data, setData] = useState<{ ambassadors: Ambassador[]; applications: Application[] }>({
    ambassadors: [],
    applications: [],
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const pendingApplications = data.applications.filter((application) => application.status === "PENDING");
  const decidedApplications = data.applications.filter((application) => application.status !== "PENDING");

  async function load() {
    const response = await fetch("/api/admin/ambassadors", { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok) throw new Error(dashboardErrorMessage(payload.error, "تعذر تحميل إدارة السفراء"));
    setData(payload);
  }

  useEffect(() => {
    void Promise.resolve()
      .then(() => load())
      .catch((cause) => setError(cause instanceof Error ? cause.message : "تعذر تحميل البيانات"))
      .finally(() => setLoading(false));
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
      if (!response.ok) throw new Error(dashboardErrorMessage(payload.error, "تعذر تحديث حالة السفير"));
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
      if (!response.ok) throw new Error(dashboardErrorMessage(payload?.error, "تعذر تعديل بيانات السفير"));
      setMessage("تم تعديل بيانات السفير بنجاح.");
      setEditingId(null);
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
    <AdminShell active="ambassadors" title="إدارة السفراء" description="الحسابات، رموز الإحالة، الأداء، العمولات وقرارات الطلبات.">
      {message && <p className="mt-4 rounded-xl bg-emerald-50 p-3 font-bold text-emerald-800">{message}</p>}
      {error && <p className="mt-4 rounded-xl bg-rose-50 p-3 font-bold text-rose-800">{error}</p>}

      {loading ? (
        <p className="mt-7 rounded-2xl bg-white p-8 text-center font-bold text-slate-500 shadow-sm">جارٍ تحميل إدارة السفراء...</p>
      ) : (
        <>
          <section aria-labelledby="pending-ambassador-applications" className="mt-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="pending-ambassador-applications" className="text-2xl font-black">طلبات السفراء المعلّقة</h2>
              <span className="rounded-full bg-white px-3 py-1 text-sm font-black text-[#9A7D43] shadow-sm">{pendingApplications.length}</span>
            </div>
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
          </section>

          {decidedApplications.length > 0 && (
            <details className="mt-7 rounded-2xl bg-white shadow-sm">
              <summary className="cursor-pointer list-none p-5 text-lg font-black">
                سجل قرارات طلبات السفراء ({decidedApplications.length})
                <span className="me-2 text-sm font-normal text-slate-500">مقبولة ومرفوضة — سجل تاريخي</span>
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

          <section aria-labelledby="current-ambassadors" className="mt-10">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 id="current-ambassadors" className="text-2xl font-black">السفراء الحاليون</h2>
                <p className="mt-1 text-sm text-slate-500">عرض موحّد للحسابات والأداء والمكافآت المتاحة حاليًا.</p>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-sm font-black text-[#9A7D43] shadow-sm">{data.ambassadors.length}</span>
            </div>

            {data.ambassadors.length ? (
              <div className="mt-4 overflow-x-auto rounded-2xl border border-[#D8D2C4] bg-white shadow-sm">
                <table className="w-full min-w-[1540px] text-right text-sm">
                  <thead className="bg-[#F3EEE5] text-[#6F5A32]">
                    <tr>
                      <th className="p-4">الاسم</th>
                      <th className="p-4">التواصل</th>
                      <th className="p-4">كود السفير</th>
                      <th className="p-4">الحالة والملف</th>
                      <th className="p-4">المستوى الحالي</th>
                      <th className="p-4">إجمالي الإحالات</th>
                      <th className="p-4">الإحالات الناجحة</th>
                      <th className="p-4">الإحالات الناجحة هذا الشهر</th>
                      <th className="p-4">المكافآت المستحقة</th>
                      <th className="p-4">المكافآت المدفوعة</th>
                      <th className="p-4">آخر نشاط</th>
                      <th className="p-4">الإجراء</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.ambassadors.map((ambassador) => (
                      <Fragment key={ambassador.id}>
                        <tr className="border-t border-slate-100 align-top hover:bg-[#FCFAF6]">
                          <td className="p-4 font-black">{ambassador.user.name || "غير محدد"}</td>
                          <td className="p-4">
                            <span dir="ltr" className="block text-right [unicode-bidi:isolate]">{ambassador.user.email}</span>
                            <span dir="ltr" className="mt-1 block text-right text-slate-500 [unicode-bidi:isolate]">{ambassador.user.phone || "—"}</span>
                          </td>
                          <td dir="ltr" className="p-4 text-right font-black [unicode-bidi:isolate]">CWA-{String(ambassador.referralNumber).padStart(4, "0")}</td>
                          <td className="p-4">
                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${statusStyles[ambassador.status]}`}>
                              {dashboardLabel(ambassador.status, "حالة غير معروفة")}
                            </span>
                            <span className="mt-2 block text-xs text-slate-500">{ambassador.profileCompletedAt ? "مكتمل" : "غير مكتمل"}</span>
                          </td>
                          <td className="p-4">
                            {ambassador.currentLevel ? (
                              <>
                                <strong className="block">{ambassador.currentLevel.name}</strong>
                                <span dir="ltr" className="mt-1 block text-right text-xs text-slate-500 [unicode-bidi:isolate]">{ambassador.currentLevel.rate}%</span>
                              </>
                            ) : "غير محدد"}
                          </td>
                          <td dir="ltr" className="p-4 text-right font-black tabular-nums [unicode-bidi:isolate]">{ambassador.referralStats.total}</td>
                          <td dir="ltr" className="p-4 text-right font-black tabular-nums [unicode-bidi:isolate]">{ambassador.referralStats.successful}</td>
                          <td dir="ltr" className="p-4 text-right font-black tabular-nums [unicode-bidi:isolate]">{ambassador.referralStats.successfulThisMonth}</td>
                          <td className="p-4"><MoneyTotals totals={ambassador.rewardTotals} field="due" /></td>
                          <td className="p-4"><MoneyTotals totals={ambassador.rewardTotals} field="paid" /></td>
                          <td className="p-4"><DateText value={ambassador.lastActivityAt} withTime /></td>
                          <td className="p-4">
                            <div className="flex flex-wrap gap-2">
                              <Link href={`/ambassador/dashboard?adminPreview=${ambassador.id}`} className="rounded-lg border border-[#D8D2C4] px-3 py-2 font-bold hover:border-[#B89A5A]">عرض</Link>
                              <button type="button" onClick={() => setEditingId((current) => current === ambassador.id ? null : ambassador.id)} className="rounded-lg border border-[#D8D2C4] px-3 py-2 font-bold hover:border-[#B89A5A]">تعديل</button>
                              {ambassador.status !== "ACTIVE" && <button type="button" disabled={busyId === ambassador.id} onClick={() => void updateStatus(ambassador.id, "ACTIVE")} className="rounded-lg bg-emerald-600 px-3 py-2 font-bold text-white disabled:opacity-40">تفعيل</button>}
                              {ambassador.status !== "SUSPENDED" && <button type="button" disabled={busyId === ambassador.id} onClick={() => void updateStatus(ambassador.id, "SUSPENDED")} className="rounded-lg bg-rose-600 px-3 py-2 font-bold text-white disabled:opacity-40">تعليق</button>}
                            </div>
                          </td>
                        </tr>
                        {editingId === ambassador.id && (
                          <tr className="border-t border-[#E6E0D4] bg-[#FCFAF6]">
                            <td colSpan={12} className="p-4">
                              <form onSubmit={(event) => void saveAmbassadorAccount(event, ambassador.id)} className="grid gap-3 md:grid-cols-4">
                                <label className="grid gap-2 font-bold">الاسم<input name="name" required minLength={2} defaultValue={ambassador.user.name || ""} className="rounded-lg border bg-white p-3 font-normal" /></label>
                                <label className="grid gap-2 font-bold">البريد الإلكتروني<input name="email" type="email" required defaultValue={ambassador.user.email} className="rounded-lg border bg-white p-3 font-normal" /></label>
                                <label className="grid gap-2 font-bold">رقم الهاتف<input name="phone" defaultValue={ambassador.user.phone || ""} className="rounded-lg border bg-white p-3 font-normal" /></label>
                                <label className="grid gap-2 font-bold">العمر<input name="age" type="number" min="1" max="120" defaultValue={ambassador.age ?? ""} className="rounded-lg border bg-white p-3 font-normal" /></label>
                                <div className="flex flex-wrap gap-2 md:col-span-4">
                                  <button disabled={busyId === ambassador.id} className="rounded-lg bg-[#111827] px-4 py-3 font-black text-white disabled:opacity-40">{busyId === ambassador.id ? "جارٍ الحفظ..." : "حفظ بيانات السفير"}</button>
                                  <button type="button" onClick={() => setEditingId(null)} className="rounded-lg border border-[#D8D2C4] bg-white px-4 py-3 font-bold">إلغاء</button>
                                </div>
                              </form>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-[#D8D2C4] bg-white p-7 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#F3EEE5] text-[#9A7D43]"><UserRoundCheck className="h-5 w-5" /></span>
                  <div>
                    <h3 className="font-black">لا يوجد سفراء حاليًا.</h3>
                    <p className="mt-1 text-sm text-slate-500">ستظهر هنا حسابات السفراء بعد قبول طلباتهم وإنشاء حساباتهم.</p>
                  </div>
                </div>
              </div>
            )}
          </section>
        </>
      )}
    </AdminShell>
  );
}

function MoneyTotals({ totals, field }: { totals: RewardTotal[]; field: "due" | "paid" }) {
  if (!totals.length) return <span className="text-slate-400">—</span>;

  return (
    <span className="grid gap-1">
      {totals.map((total) => (
        <span key={total.currency} dir="ltr" className="whitespace-nowrap text-right font-black tabular-nums [unicode-bidi:isolate]">
          {Number(total[field]).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {total.currency}
        </span>
      ))}
    </span>
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
    await onDecision(application.id, status, String(form.get("notes") || "").trim(), String(form.get("password") || ""));
  }

  return (
    <article className="rounded-xl bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <b>{application.name}</b>
          <p className="text-sm text-slate-500">{application.email} · {application.market || "—"} · العمر {application.age != null ? application.age : "غير محدد"}</p>
        </div>
        <span className="rounded-full bg-[#F4F1EA] px-3 py-1 text-xs font-black">{dashboardLabel(application.status, "حالة غير معروفة")}</span>
      </div>
      {application.details && <p className="mt-3">{application.details}</p>}
      {application.status === "PENDING" ? (
        <details className="group mt-4 rounded-xl border border-[#D8D2C4] bg-[#F7F3EB]">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 font-black text-[#9A7D43]">مراجعة الطلب واتخاذ القرار<ChevronDown className="h-5 w-5 transition group-open:rotate-180" /></summary>
          <form onSubmit={(event) => { event.preventDefault(); void submit(event.currentTarget, "ACCEPTED"); }} className="grid gap-3 border-t border-[#D8D2C4] p-4 md:grid-cols-2">
            <input name="notes" required placeholder="ملاحظة القرار" className="rounded-lg border p-3" />
            <div className="relative">
              <input name="password" type={showPassword ? "text" : "password"} minLength={10} autoComplete="new-password" placeholder="كلمة مرور مؤقتة عند القبول" className="w-full rounded-lg border p-3 pl-12" />
              <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"} className="absolute left-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-500 hover:bg-slate-100">
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            <div className="flex gap-2 md:col-span-2">
              <button type="submit" disabled={busy} className="rounded-lg bg-emerald-600 px-4 py-2 font-bold text-white disabled:opacity-40">قبول وإنشاء الحساب</button>
              <button type="button" disabled={busy} onClick={(event) => void submit(event.currentTarget.form!, "REJECTED")} className="rounded-lg bg-rose-600 px-4 py-2 font-bold text-white disabled:opacity-40">رفض</button>
            </div>
          </form>
        </details>
      ) : (
        <div className="mt-3 text-sm text-slate-500">
          <p className="font-bold text-slate-700">حالة القرار: {application.status === "ACCEPTED" ? "مقبول — تم إنشاء الحساب" : "مرفوض — لم يُنشأ حساب"}</p>
          {application.decisionNotes && <p className="mt-1">ملاحظات الإدارة: {application.decisionNotes}</p>}
        </div>
      )}
    </article>
  );
}
