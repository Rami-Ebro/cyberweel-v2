"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, History, LockKeyhole, RefreshCw, Search } from "lucide-react";
import { formatDateTime } from "@/lib/date-format";

type AuditLog = {
  id: string;
  actorName: string | null;
  actorEmail: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityLabel: string | null;
  summary: string;
  beforeData: unknown;
  afterData: unknown;
  createdAt: string;
};

type AuditResponse = {
  logs: AuditLog[];
  total: number;
  page: number;
  pages: number;
  actors: Array<{ actorEmail: string; actorName: string | null }>;
  entityTypes: string[];
};

const actionLabels: Record<string, string> = {
  CREATE: "إنشاء",
  UPDATE: "تعديل",
  DELETE: "حذف",
  SUSPEND: "تعليق",
  ACTIVATE: "تفعيل",
  PASSWORD_RESET: "تغيير كلمة مرور",
  SEND: "إرسال",
};

const entityLabels: Record<string, string> = {
  ADMIN_ACCOUNT: "حساب إدارة",
  CLIENT_ACCOUNT: "حساب عميل",
  CLIENT_PROJECT: "مشروع",
  CLIENT_FILE: "ملف",
  CLIENT_INVOICE: "فاتورة",
  CLIENT_PAYMENT: "دفعة",
  CLIENT_MESSAGE: "رسالة",
  PARTNER: "شريك",
  REFERRAL: "إحالة",
  SMART_LINK: "رابط ذكي",
  ADMIN_SETTINGS: "إعدادات الإدارة",
};

function JsonDetails({ title, value }: { title: string; value: unknown }) {
  if (!value) return null;
  return <div><p className="mb-2 text-xs font-black text-slate-500">{title}</p><pre dir="ltr" className="max-h-64 overflow-auto rounded-xl bg-[#111827] p-4 text-left text-xs leading-6 text-white">{JSON.stringify(value, null, 2)}</pre></div>;
}

function FilterDateInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-1 text-xs font-bold text-slate-500">
      {label}
      <span className="relative">
        {!value && <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-4 z-10 flex items-center text-sm font-normal text-slate-400">يوم / شهر / سنة</span>}
        <input
          type="date"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-label={`${label}: يوم ثم شهر ثم سنة`}
          className={`w-full rounded-xl border border-[#D8D2C4] px-4 py-3 text-[#111827] ${value ? "" : "[&::-webkit-datetime-edit]:text-transparent"}`}
        />
      </span>
    </label>
  );
}

export default function AdminAuditLogPage() {
  const [data, setData] = useState<AuditResponse | null>(null);
  const [filters, setFilters] = useState({ search: "", action: "", entityType: "", actor: "", from: "", to: "" });
  const [activeFilters, setActiveFilters] = useState(filters);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);
    setMessage("");
    const query = new URLSearchParams({ page: String(page) });
    Object.entries(activeFilters).forEach(([key, value]) => { if (value) query.set(key, value); });
    const response = await fetch(`/api/admin/audit-log?${query}`, { cache: "no-store" });
    const result = await response.json().catch(() => null);
    if (!response.ok) setMessage(result?.error || "تعذر تحميل سجل النشاط");
    else setData(result);
    setLoading(false);
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [page, activeFilters]);

  function submitFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setActiveFilters(filters);
  }

  function clearFilters() {
    const empty = { search: "", action: "", entityType: "", actor: "", from: "", to: "" };
    setFilters(empty);
    setActiveFilters(empty);
    setPage(1);
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[#F7F3EB] p-4 text-[#111827] sm:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-[#9A7D43]">لوحة الإدارة</p>
            <h1 className="mt-1 flex items-center gap-3 text-3xl font-black"><History className="h-8 w-8" />سجل النشاط</h1>
            <p className="mt-2 text-sm text-slate-500">سجل ثابت للعمليات الإدارية، مرتب من الأحدث إلى الأقدم.</p>
          </div>
          <Link href="/admin/partners" className="rounded-xl bg-[#111827] px-5 py-3 font-bold text-white">العودة إلى لوحة الإدارة</Link>
        </header>

        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-900">
          <LockKeyhole className="h-5 w-5 shrink-0" />
          هذا السجل للقراءة فقط؛ لا توجد واجهة أو API لتعديله أو حذفه.
        </div>

        <form onSubmit={submitFilters} className="mt-6 grid gap-3 rounded-2xl border border-[#D8D2C4] bg-white p-5 shadow-sm md:grid-cols-2 xl:grid-cols-4">
          <label className="relative xl:col-span-2"><Search className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={filters.search} onChange={(event) => setFilters((value) => ({ ...value, search: event.target.value }))} placeholder="ابحث باسم العضو أو العملية أو العنصر" className="w-full rounded-xl border border-[#D8D2C4] py-3 pr-11 pl-4" /></label>
          <select value={filters.action} onChange={(event) => setFilters((value) => ({ ...value, action: event.target.value }))} className="rounded-xl border border-[#D8D2C4] bg-white px-4 py-3"><option value="">كل العمليات</option>{Object.entries(actionLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
          <select value={filters.entityType} onChange={(event) => setFilters((value) => ({ ...value, entityType: event.target.value }))} className="rounded-xl border border-[#D8D2C4] bg-white px-4 py-3"><option value="">كل الأقسام</option>{(data?.entityTypes || []).map((value) => <option key={value} value={value}>{entityLabels[value] || value}</option>)}</select>
          <select value={filters.actor} onChange={(event) => setFilters((value) => ({ ...value, actor: event.target.value }))} className="rounded-xl border border-[#D8D2C4] bg-white px-4 py-3"><option value="">كل أعضاء الإدارة</option>{(data?.actors || []).map((actor) => <option key={actor.actorEmail} value={actor.actorEmail}>{actor.actorName || actor.actorEmail}</option>)}</select>
          <FilterDateInput label="من تاريخ" value={filters.from} onChange={(from) => setFilters((value) => ({ ...value, from }))} />
          <FilterDateInput label="إلى تاريخ" value={filters.to} onChange={(to) => setFilters((value) => ({ ...value, to }))} />
          <div className="flex gap-2 self-end"><button className="rounded-xl bg-[#B89A5A] px-5 py-3 font-black">تطبيق</button><button type="button" onClick={clearFilters} className="rounded-xl border border-[#D8D2C4] px-5 py-3 font-bold">مسح</button></div>
        </form>

        {message && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 font-bold text-red-800">{message}</p>}
        <div className="mt-6 flex items-center justify-between gap-3"><p className="font-black">{data?.total || 0} عملية مسجلة</p><button onClick={() => void load()} disabled={loading} className="flex items-center gap-2 rounded-xl border border-[#D8D2C4] bg-white px-4 py-2 font-bold"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />تحديث</button></div>

        <section className="mt-4 grid gap-3">
          {loading ? <div className="rounded-2xl bg-white p-10 text-center">جارٍ تحميل السجل...</div> : data?.logs.length ? data.logs.map((log) => (
            <article key={log.id} className="rounded-2xl border border-[#D8D2C4] bg-white p-5 shadow-sm">
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                <div>
                  <div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-[#111827] px-3 py-1 text-xs font-black text-white">{actionLabels[log.action] || log.action}</span><span className="rounded-full bg-[#F7F3EB] px-3 py-1 text-xs font-black text-[#9A7D43]">{entityLabels[log.entityType] || log.entityType}</span></div>
                  <h2 className="mt-3 text-lg font-black">{log.summary}</h2>
                  {log.entityLabel && <p className="mt-1 text-sm text-slate-500">{log.entityLabel}</p>}
                </div>
                <div className="text-sm lg:text-left"><p className="font-black">{log.actorName || "حساب إدارة"}</p><p dir="ltr" className="mt-1 text-slate-500">{log.actorEmail}</p><time dateTime={log.createdAt} className="mt-2 block text-xs font-bold text-[#9A7D43]">{formatDateTime(log.createdAt)}</time></div>
              </div>
              {(log.beforeData != null || log.afterData != null) && <details className="mt-4 rounded-xl bg-[#F7F3EB] p-4"><summary className="cursor-pointer font-black">عرض تفاصيل التغيير</summary><div className="mt-4 grid gap-4 lg:grid-cols-2"><JsonDetails title="قبل التعديل" value={log.beforeData} /><JsonDetails title="بعد التعديل" value={log.afterData} /></div></details>}
            </article>
          )) : <div className="rounded-2xl border border-dashed border-[#D8D2C4] bg-white p-10 text-center text-slate-500">لا توجد عمليات مطابقة.</div>}
        </section>

        {!!data && data.pages > 1 && <nav className="mt-6 flex items-center justify-center gap-3"><button disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded-xl border border-[#D8D2C4] bg-white p-3 disabled:opacity-40"><ChevronRight className="h-5 w-5" /></button><span className="font-black">صفحة {data.page} من {data.pages}</span><button disabled={page >= data.pages} onClick={() => setPage((value) => value + 1)} className="rounded-xl border border-[#D8D2C4] bg-white p-3 disabled:opacity-40"><ChevronLeft className="h-5 w-5" /></button></nav>}
      </div>
    </main>
  );
}
