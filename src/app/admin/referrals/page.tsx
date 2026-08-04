"use client";

import { FormEvent, useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { formatDate } from "@/lib/date-format";

type ReferralStatus = "NEW" | "CONTACTED" | "QUALIFIED" | "CONVERTED" | "REJECTED";
type CommissionStatus = "PENDING" | "APPROVED" | "PAID" | "CANCELLED";
type Owner = { user: { name: string | null; email: string } };
type Referral = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  status: ReferralStatus;
  createdAt: string;
  source: string | null;
  sourcePath: string | null;
  contactMethod: string | null;
  adminDecision: string | null;
  commissionAmount: string | null;
  commissionCurrency: string;
  commissionStatus: CommissionStatus;
  ambassador: Owner | null;
  partner: Owner | null;
};
type AmbassadorOption = { id: string; user: { name: string | null; email: string } };

const referralLabels: Record<ReferralStatus, string> = {
  NEW: "جديدة",
  CONTACTED: "تم التواصل",
  QUALIFIED: "مؤهلة",
  CONVERTED: "تحولت إلى مشروع",
  REJECTED: "غير مناسبة",
};
const commissionLabels: Record<CommissionStatus, string> = {
  PENDING: "قيد التحقق",
  APPROVED: "معتمدة",
  PAID: "مدفوعة",
  CANCELLED: "ملغاة",
};

export default function ReferralAdmin() {
  const [items, setItems] = useState<Referral[]>([]);
  const [ambassadors, setAmbassadors] = useState<AmbassadorOption[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load(query = "") {
    const response = await fetch(`/api/admin/referrals?${query}`, { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "تعذر تحميل الإحالات");
    setItems(payload.referrals || []);
    setAmbassadors(payload.ambassadors || []);
  }

  useEffect(() => {
    void Promise.resolve().then(() => load()).catch((cause) => setError(cause instanceof Error ? cause.message : "تعذر تحميل الإحالات"));
  }, []);

  function filter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    const query = new URLSearchParams(new FormData(event.currentTarget) as never).toString();
    load(query).catch((cause) => setError(cause instanceof Error ? cause.message : "تعذر تطبيق الفلاتر"));
  }

  async function saveReferral(referral: Referral, values: ReferralDraft) {
    setBusyId(referral.id);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/referrals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: referral.id, ...values }),
      });
      const payload = await response.json();
      if (!response.ok) {
        const labels: Record<string, string> = {
          INVALID_COMMISSION: "قيمة العمولة غير صالحة.",
          INVALID_CURRENCY: "عملة العمولة غير صالحة.",
          INVALID_COMMISSION_STATUS: "حالة العمولة غير صالحة.",
        };
        throw new Error(labels[payload.error] || "تعذر حفظ الإحالة");
      }
      setMessage(`تم حفظ إحالة «${referral.name || "دون اسم"}» وتحديث العمولة.`);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذر حفظ الإحالة");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AdminShell active="referrals" title="إدارة الإحالات" description="بحث وفلاتر وقرار الإدارة وحالة العميل والعمولة في شاشة واحدة.">
        {message && <p className="mt-4 rounded-xl bg-emerald-50 p-3 font-bold text-emerald-800">{message}</p>}
        {error && <p className="mt-4 rounded-xl bg-rose-50 p-3 font-bold text-rose-800">{error}</p>}

        <form onSubmit={filter} className="mt-6 grid gap-3 rounded-2xl bg-white p-4 md:grid-cols-4">
          <input name="search" placeholder="بحث بالعميل" className="rounded-lg border p-2" />
          <select name="status" className="rounded-lg border p-2">
            <option value="">كل الحالات</option>
            {(Object.keys(referralLabels) as ReferralStatus[]).map((status) => (
              <option key={status} value={status}>{referralLabels[status]}</option>
            ))}
          </select>
          <select name="ambassadorId" className="rounded-lg border p-2">
            <option value="">كل السفراء</option>
            {ambassadors.map((ambassador) => (
              <option key={ambassador.id} value={ambassador.id}>
                {ambassador.user.name || ambassador.user.email}
              </option>
            ))}
          </select>
          <input name="contactMethod" placeholder="طريقة التواصل" className="rounded-lg border p-2" />
          <input name="source" placeholder="مصدر الإحالة" className="rounded-lg border p-2" />
          <label className="grid gap-1 text-xs font-bold text-slate-500">
            من تاريخ
            <input type="date" name="from" className="rounded-lg border p-2 text-base text-slate-900" />
          </label>
          <label className="grid gap-1 text-xs font-bold text-slate-500">
            إلى تاريخ
            <input type="date" name="to" className="rounded-lg border p-2 text-base text-slate-900" />
          </label>
          <button className="self-end rounded-lg bg-[#111827] p-2.5 font-bold text-white">تطبيق الفلاتر</button>
        </form>

        <div className="mt-6 grid gap-4">
          {items.map((referral) => (
            <ReferralEditor
              key={referral.id}
              referral={referral}
              busy={busyId === referral.id}
              onSave={saveReferral}
            />
          ))}
          {!items.length && <p className="rounded-2xl bg-white p-6 text-slate-500">لا توجد إحالات مطابقة.</p>}
        </div>
    </AdminShell>
  );
}

type ReferralDraft = {
  status: ReferralStatus;
  adminDecision: string;
  commissionAmount: string | null;
  commissionCurrency: string;
  commissionStatus: CommissionStatus;
};

function ReferralEditor({
  referral,
  busy,
  onSave,
}: {
  referral: Referral;
  busy: boolean;
  onSave: (referral: Referral, values: ReferralDraft) => Promise<void>;
}) {
  const [draft, setDraft] = useState<ReferralDraft>({
    status: referral.status,
    adminDecision: referral.adminDecision || "",
    commissionAmount: referral.commissionAmount,
    commissionCurrency: referral.commissionCurrency || "USD",
    commissionStatus: referral.commissionStatus,
  });
  const owner = referral.ambassador?.user || referral.partner?.user;

  return (
    <article className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr_1fr_1fr_auto] xl:items-end">
        <div>
          <h2 className="font-black">{referral.name || "دون اسم"}</h2>
          <p className="mt-1 text-sm text-slate-500">{referral.email || referral.phone || "لا توجد وسيلة تواصل"}</p>
          <p className="mt-1 text-xs text-slate-400">
            عن طريق {owner?.name || owner?.email || "إحالة مباشرة"} · {formatDate(referral.createdAt)}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {referral.contactMethod || "—"} · {referral.source || referral.sourcePath || "—"}
          </p>
        </div>
        <label className="grid gap-1 text-xs font-bold text-slate-500">
          حالة الإحالة
          <select
            value={draft.status}
            onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value as ReferralStatus }))}
            className="rounded-lg border p-2 text-base text-slate-900"
          >
            {(Object.keys(referralLabels) as ReferralStatus[]).map((status) => (
              <option key={status} value={status}>{referralLabels[status]}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-xs font-bold text-slate-500">
          قرار الإدارة
          <input
            value={draft.adminDecision}
            onChange={(event) => setDraft((current) => ({ ...current, adminDecision: event.target.value }))}
            className="rounded-lg border p-2 text-base text-slate-900"
          />
        </label>
        <div className="grid grid-cols-[1fr_90px] gap-2">
          <label className="grid gap-1 text-xs font-bold text-slate-500">
            العمولة
            <input
              type="number"
              min="0"
              step="0.01"
              value={draft.commissionAmount || ""}
              onChange={(event) => setDraft((current) => ({ ...current, commissionAmount: event.target.value || null }))}
              className="rounded-lg border p-2 text-base text-slate-900"
            />
          </label>
          <label className="grid gap-1 text-xs font-bold text-slate-500">
            العملة
            <select
              value={draft.commissionCurrency}
              onChange={(event) => setDraft((current) => ({ ...current, commissionCurrency: event.target.value }))}
              className="rounded-lg border p-2 text-base text-slate-900"
            >
              {["USD", "EUR", "SYP", "TRY"].map((currency) => <option key={currency}>{currency}</option>)}
            </select>
          </label>
          <label className="col-span-2 grid gap-1 text-xs font-bold text-slate-500">
            حالة العمولة
            <select
              value={draft.commissionStatus}
              onChange={(event) => setDraft((current) => ({ ...current, commissionStatus: event.target.value as CommissionStatus }))}
              className="rounded-lg border p-2 text-base text-slate-900"
            >
              {(Object.keys(commissionLabels) as CommissionStatus[]).map((status) => (
                <option key={status} value={status}>{commissionLabels[status]}</option>
              ))}
            </select>
          </label>
        </div>
        <button
          disabled={busy}
          onClick={() => void onSave(referral, draft)}
          className="rounded-lg bg-[#B89A5A] px-5 py-3 font-black text-[#111827] disabled:opacity-40"
        >
          {busy ? "جارٍ الحفظ..." : "حفظ"}
        </button>
      </div>
    </article>
  );
}
