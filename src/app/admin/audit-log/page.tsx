"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Search } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { DateInput } from "@/components/ui/date-input";
import { DateText } from "@/components/ui/date-text";
import { formatDateTime } from "@/lib/date-format";

type AuditCategory = "POSITIVE" | "SENSITIVE" | "NORMAL";
type AuditValue = string | number | boolean | null | AuditValue[] | { [key: string]: AuditValue };
type Log = {
  id: string;
  action: string;
  category: AuditCategory;
  entityType: string;
  entityId: string | null;
  entityLabel: string | null;
  before: AuditValue;
  after: AuditValue;
  createdAt: string;
  actor: { id: string; name: string | null; email: string } | null;
};
type Actor = { id: string; name: string | null; email: string };

const labels: Record<string, string> = {
  PARTNER_APPLICATION_SUBMITTED: "تقديم طلب شراكة",
  PARTNER_REVIEW_STARTED: "بدء مراجعة طلب الشريك",
  PARTNER_INFO_REQUESTED: "طلب معلومات إضافية من الشريك",
  PARTNER_APPLICATION_ACCEPTED: "قبول طلب الشراكة",
  PARTNER_APPLICATION_REJECTED: "رفض طلب الشراكة",
  PARTNER_ACCOUNT_ACTIVATED: "تفعيل حساب الشريك",
  PARTNER_ACCOUNT_SUSPENDED: "إيقاف حساب الشريك",
  PARTNER_PROFILE_UPDATED: "تعديل بيانات الشريك",
  PARTNER_NOTE_ADDED: "إضافة ملاحظة إدارية للشريك",
  PARTNER_PROJECT_ASSIGNED: "إسناد مشروع إلى شريك",
  PROJECT_CREATED: "إنشاء مشروع",
  PROJECT_UPDATED: "تحديث المشروع",
  PROJECT_CANCELLED: "إلغاء المشروع وإيقاف مراحله المستقبلية",
  ADMIN_MEMBER_CREATED: "إنشاء حساب عضو إدارة",
  ADMIN_PERMISSIONS_UPDATED: "تعديل صلاحيات عضو الإدارة",
  ADMIN_ACCOUNT_SUSPENDED: "إيقاف حساب عضو الإدارة",
  ADMIN_ACCOUNT_ACTIVATED: "تفعيل حساب عضو الإدارة",
  ADMIN_PROFILE_UPDATED: "تعديل بيانات عضو الإدارة",
  AMBASSADOR_REWARD_RATE_LOCKED: "تثبيت نسبة مكافأة المشروع",
  AMBASSADOR_REWARD_STAGE_CREATED: "إنشاء مرحلة مكافأة",
  AMBASSADOR_REWARD_STAGE_UPDATED: "تحديث مرحلة مكافأة",
  AMBASSADOR_REWARD_EARNED: "اعتماد استحقاق مكافأة",
  AMBASSADOR_REWARD_PAID: "صرف مكافأة سفير",
  AMBASSADOR_REWARD_CANCELLED: "إلغاء مكافأة سفير",
  AMBASSADOR_REWARD_LEVEL_UPDATED: "تعديل مستوى مكافآت السفراء",
};

const categoryStyles: Record<AuditCategory, { card: string; filter: string; active: string }> = {
  POSITIVE: {
    card: "border-emerald-200 bg-emerald-50/80",
    filter: "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100",
    active: "border-emerald-300 bg-emerald-100 text-emerald-950 ring-2 ring-emerald-200 shadow-sm",
  },
  SENSITIVE: {
    card: "border-amber-200 bg-amber-50/90",
    filter: "border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100",
    active: "border-amber-300 bg-amber-100 text-amber-950 ring-2 ring-amber-200 shadow-sm",
  },
  NORMAL: {
    card: "border-sky-200 bg-sky-50/80",
    filter: "border-sky-200 bg-sky-50 text-sky-900 hover:bg-sky-100",
    active: "border-sky-300 bg-sky-100 text-sky-950 ring-2 ring-sky-200 shadow-sm",
  },
};

const categoryFilters: Array<{ value: "" | AuditCategory; label: string }> = [
  { value: "", label: "الكل" },
  { value: "POSITIVE", label: "إيجابية" },
  { value: "SENSITIVE", label: "حساسة" },
  { value: "NORMAL", label: "تعديلات عادية" },
];

function filterClass(value: "" | AuditCategory, active: boolean) {
  if (!value) {
    return active
      ? "border-[#111827] bg-[#111827] text-white ring-2 ring-slate-300 shadow-sm"
      : "border-[#D8D2C4] bg-[#F7F3EB] text-slate-700 hover:bg-white";
  }
  return active ? categoryStyles[value].active : categoryStyles[value].filter;
}

function formatDetailDates(value: AuditValue): AuditValue {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) {
    return formatDateTime(value, value);
  }
  if (Array.isArray(value)) return value.map(formatDetailDates);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, formatDetailDates(item)]));
  }
  return value;
}

export default function AuditLogPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<Log[]>([]);
  const [actors, setActors] = useState<Actor[]>([]);
  const [actions, setActions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ q: "", actorId: "", action: "", category: "", from: "", to: "" });

  const load = useCallback(async () => {
    setLoading(true);
    const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => value));
    const response = await fetch(`/api/admin/audit-log?${query}`, { cache: "no-store" });
    if (response.status === 401) return router.replace("/login");
    const data = await response.json();
    if (response.ok) {
      setLogs(data.logs);
      setActors(data.actors);
      setActions(data.actions);
    }
    setLoading(false);
  }, [filters, router]);

  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  return <AdminShell active="audit-log" title="سجل النشاطات الإدارية" description="سجل زمني غير قابل للتعديل للعمليات المهمة والتغييرات الحساسة داخل لوحة الإدارة.">
    <section className="mt-7 rounded-2xl border border-[#D8D2C4] bg-white p-5 shadow-sm">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <label className="relative xl:col-span-2"><Search className="absolute right-3 top-3.5 h-4 w-4 text-slate-400" /><input value={filters.q} onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))} placeholder="بحث بالعنصر أو المعرّف" className="field pr-10" /></label>
        <select value={filters.actorId} onChange={(event) => setFilters((current) => ({ ...current, actorId: event.target.value }))} className="field"><option value="">كل المستخدمين</option>{actors.map((actor) => <option key={actor.id} value={actor.id}>{actor.name || actor.email}</option>)}</select>
        <select value={filters.action} onChange={(event) => setFilters((current) => ({ ...current, action: event.target.value }))} className="field"><option value="">كل العمليات</option>{actions.map((action) => <option key={action} value={action}>{labels[action] || action}</option>)}</select>
        <label className="grid gap-1 text-xs font-bold text-slate-500">من تاريخ<DateInput value={filters.from} onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value }))} className="field text-base text-slate-900" /></label>
        <label className="grid gap-1 text-xs font-bold text-slate-500">إلى تاريخ<DateInput value={filters.to} onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value }))} className="field text-base text-slate-900" /></label>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {categoryFilters.map((item) => {
          const active = filters.category === item.value;
          return <button key={item.value || "ALL"} type="button" aria-pressed={active} onClick={() => setFilters((current) => ({ ...current, category: item.value }))} className={`rounded-full border px-4 py-2 text-sm font-black transition focus-visible:outline-none ${filterClass(item.value, active)}`}>{item.label}</button>;
        })}
      </div>
    </section>

    <section className="mt-5 grid gap-3">
      {loading ? <p className="flex items-center justify-center gap-2 rounded-2xl bg-white p-10"><RefreshCw className="h-5 w-5 animate-spin" />جارٍ تحميل السجل...</p> : logs.length ? logs.map((log) => <article key={log.id} className={`rounded-2xl border p-5 ${categoryStyles[log.category].card}`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><h2 className="font-black">{labels[log.action] || log.action}</h2><p className="mt-1 text-sm text-slate-600">{log.entityLabel || log.entityId || log.entityType} · بواسطة {log.actor?.name || log.actor?.email || "النظام"}</p></div>
          <span className="text-sm font-bold"><DateText value={log.createdAt} withTime /></span>
        </div>
        {(log.before || log.after) && <details className="mt-4 rounded-xl bg-white/70 p-3"><summary className="cursor-pointer font-bold">عرض القيم قبل وبعد</summary><div className="mt-3 grid gap-3 md:grid-cols-2"><pre className="overflow-auto whitespace-pre-wrap rounded-lg bg-white p-3 text-xs" dir="ltr">{JSON.stringify(formatDetailDates(log.before), null, 2) || "—"}</pre><pre className="overflow-auto whitespace-pre-wrap rounded-lg bg-white p-3 text-xs" dir="ltr">{JSON.stringify(formatDetailDates(log.after), null, 2) || "—"}</pre></div></details>}
      </article>) : <p className="rounded-2xl bg-white p-10 text-center text-slate-500">لا توجد نشاطات مطابقة للفلاتر.</p>}
    </section>
  </AdminShell>;
}
