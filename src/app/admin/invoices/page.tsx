"use client";

import { FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import { ChevronDown, ReceiptText, RefreshCw } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { DateText } from "@/components/ui/date-text";
import { DateInput } from "@/components/ui/date-input";

type Project = {
  id: string;
  title: string;
  description: string | null;
  agreementDetails: string | null;
  financialPlan: string | null;
  currency: string;
  stages: string | null;
  status: string;
  progress: number;
  dueAt: string | null;
};
type Client = { id: string; name: string | null; email: string; clientProjects: Project[] };
type Invoice = {
  id: string;
  number: string;
  type: "STANDARD" | "RETURN";
  amount: number;
  currency: string;
  status: string;
  dueAt: string | null;
  paidAt: string | null;
  createdAt: string;
  project: { id: string; title: string; client: { id: string; name: string | null; email: string } };
};

const statusLabels: Record<string, string> = {
  DRAFT: "مسودة",
  DUE: "مستحقة",
  PAID: "مدفوعة",
  OVERDUE: "متأخرة",
  CANCELLED: "ملغاة",
};

export default function AdminInvoicesPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [nextNumber, setNextNumber] = useState("");
  const [clientId, setClientId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/invoices", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "تعذر تحميل الفواتير");
      const nextClients = payload.clients || [];
      setClients(nextClients);
      setInvoices(payload.invoices || []);
      setNextNumber(payload.nextInvoiceNumber || "");
      setClientId((current) => current || nextClients[0]?.id || "");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذر تحميل الفواتير");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void Promise.resolve().then(load);
  }, []);

  const selectedClient = clients.find((client) => client.id === clientId) || null;
  const projects = selectedClient?.clientProjects || [];
  const selectedProject = projects.find((project) => project.id === projectId) || projects[0] || null;

  const filteredInvoices = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return invoices.filter((invoice) => {
      const matchesStatus = !statusFilter || invoice.status === statusFilter;
      const haystack = `${invoice.number} ${invoice.project.title} ${invoice.project.client.name || ""} ${invoice.project.client.email}`.toLowerCase();
      return matchesStatus && (!needle || haystack.includes(needle));
    });
  }, [invoices, search, statusFilter]);

  const totals = useMemo(
    () => ({
      all: invoices.length,
      due: invoices.filter((invoice) => ["DUE", "OVERDUE"].includes(invoice.status)).length,
      paid: invoices.filter((invoice) => invoice.status === "PAID").length,
      returns: invoices.filter((invoice) => invoice.type === "RETURN").length,
    }),
    [invoices],
  );

  async function createInvoice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedProject) return;
    setSaving(true);
    setMessage("");
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/admin/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "invoice",
          projectId: selectedProject.id,
          type: data.get("type"),
          amount: data.get("amount"),
          currency: data.get("currency"),
          status: data.get("status"),
          dueAt: data.get("dueAt") || null,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "تعذر إصدار الفاتورة");
      setMessage(`تم إصدار الفاتورة ${payload.invoice.number} وإشعار العميل.`);
      setFormOpen(false);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذر إصدار الفاتورة");
    } finally {
      setSaving(false);
    }
  }

  async function markPaid(invoice: Invoice) {
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/admin/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "payment", invoiceId: invoice.id }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "تعذر تسجيل الدفع");
      setMessage(`تم تسجيل الفاتورة ${invoice.number} كمدفوعة وإشعار العميل.`);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذر تسجيل الدفع");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminShell active="invoices" title="إدارة الفواتير" description="الفواتير والمرتجعات والدفعات مرتبطة بالمشاريع والعملاء." actions={
            <button onClick={() => void load()} disabled={loading} className="flex items-center gap-2 rounded-xl border border-[#D8D2C4] bg-white px-4 py-3 font-bold">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> تحديث
            </button>
    }>

        {message && <p className="mt-5 rounded-xl bg-emerald-50 p-4 font-bold text-emerald-800">{message}</p>}
        {error && <p className="mt-5 rounded-xl bg-rose-50 p-4 font-bold text-rose-800">{error}</p>}

        <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[["كل الفواتير", totals.all], ["مستحقة أو متأخرة", totals.due], ["مدفوعة", totals.paid], ["مرتجعات", totals.returns]].map(([label, value]) => (
            <article key={String(label)} className="rounded-2xl border border-[#D8D2C4] bg-white p-5 shadow-sm">
              <p className="text-sm font-bold text-slate-500">{label}</p><p className="mt-3 text-3xl font-black">{value}</p>
            </article>
          ))}
        </section>

        <section className="mt-6 overflow-hidden rounded-2xl border border-[#D8D2C4] bg-white shadow-sm">
          <button type="button" onClick={() => setFormOpen((value) => !value)} className="flex w-full items-center justify-between gap-4 p-6 text-right">
            <div className="flex items-center gap-3"><ReceiptText className="h-6 w-6 text-[#9A7D43]" /><div><h2 className="text-xl font-black">إصدار فاتورة أو مرتجع</h2><p className="mt-1 text-sm text-slate-500">اختر العميل والمشروع؛ رقم الفاتورة يُنشأ تلقائيًا.</p></div></div>
            <ChevronDown className={`h-5 w-5 transition ${formOpen ? "rotate-180" : ""}`} />
          </button>
          {formOpen && (
            <form onSubmit={createInvoice} className="grid gap-4 border-t border-[#D8D2C4] p-6 md:grid-cols-2">
              <div className="rounded-xl bg-[#F7F3EB] p-4 md:col-span-2"><p className="font-black">رقم الفاتورة التالي</p><p dir="ltr" className="mt-1 w-fit font-black text-[#9A7D43]">{nextNumber || "جارٍ التحديد…"}</p></div>
              <label className="grid gap-2 font-bold">العميل<select value={clientId} onChange={(event) => { const nextClientId = event.target.value; const nextClient = clients.find((client) => client.id === nextClientId); setClientId(nextClientId); setProjectId(nextClient?.clientProjects[0]?.id || ""); }} required className="field font-normal"><option value="">اختر العميل</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name || client.email}</option>)}</select></label>
              {projects.length > 1 ? <label className="grid gap-2 font-bold">المشروع<select value={selectedProject?.id || ""} onChange={(event) => setProjectId(event.target.value)} required className="field font-normal">{projects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}</select></label> : <div className="rounded-xl border border-[#D8D2C4] p-4"><p className="text-xs font-bold text-slate-500">المشروع</p><p className="mt-1 font-black">{selectedProject?.title || "لا يوجد مشروع لهذا العميل"}</p></div>}

              {selectedProject && <details open className="rounded-xl border border-[#D8D2C4] bg-[#F7F3EB] p-4 md:col-span-2"><summary className="cursor-pointer font-black">ملخص المشروع والاتفاق</summary><div className="mt-4 grid gap-3 sm:grid-cols-2"><ProjectFact label="المشروع" value={selectedProject.title} /><ProjectFact label="الحالة والتقدم" value={`${selectedProject.status} — ${selectedProject.progress}%`} /><ProjectFact label="الخطة المالية" value={selectedProject.financialPlan || "غير محددة"} /><ProjectFact label="مراحل المشروع" value={selectedProject.stages || "غير محددة"} /><ProjectFact label="تفاصيل الاتفاق" value={selectedProject.agreementDetails || "غير محددة"} /><ProjectFact label="موعد المشروع" value={<DateText value={selectedProject.dueAt} fallback="غير محدد" />} /></div></details>}

              <label className="grid gap-2 font-bold">نوع المستند<select name="type" defaultValue="STANDARD" className="field font-normal"><option value="STANDARD">فاتورة</option><option value="RETURN">مرتجع</option></select></label>
              <label className="grid gap-2 font-bold">الحالة<select name="status" defaultValue="DUE" className="field font-normal"><option value="DRAFT">مسودة</option><option value="DUE">مستحقة</option><option value="OVERDUE">متأخرة</option><option value="CANCELLED">ملغاة</option></select></label>
              <label className="grid gap-2 font-bold">المبلغ<input name="amount" type="number" min="0.01" step="0.01" required className="field font-normal" /></label>
              <label className="grid gap-2 font-bold">العملة<select key={selectedProject?.id || "currency"} name="currency" defaultValue={selectedProject?.currency || "USD"} className="field font-normal">{["USD", "EUR", "SYP", "TRY"].map((currency) => <option key={currency}>{currency}</option>)}</select></label>
              <label className="grid gap-2 font-bold md:col-span-2">تاريخ الاستحقاق<DateInput name="dueAt" className="field font-normal" /></label>
              <button disabled={saving || !selectedProject} className="rounded-xl bg-[#111827] px-5 py-3.5 font-black text-white disabled:opacity-40 md:col-span-2">{saving ? "جارٍ الإصدار…" : "إصدار الفاتورة وإشعار العميل"}</button>
              {!clients.length && <p className="text-sm font-bold text-amber-700 md:col-span-2">لا يوجد عملاء بعد. أنشئ حساب عميل ومشروعًا أولًا.</p>}
            </form>
          )}
        </section>

        <section className="mt-6 rounded-2xl border border-[#D8D2C4] bg-white p-5 shadow-sm">
          <div className="grid gap-3 md:grid-cols-[1fr_240px]">
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="بحث برقم الفاتورة أو العميل أو المشروع" className="field" />
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="field"><option value="">كل الحالات</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
          </div>
          <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[1000px] text-right text-sm"><thead><tr className="border-b"><th className="p-4">الرقم</th><th className="p-4">النوع</th><th className="p-4">العميل</th><th className="p-4">المشروع</th><th className="p-4">المبلغ</th><th className="p-4">الحالة</th><th className="p-4">الاستحقاق</th><th className="p-4">الإجراء</th></tr></thead><tbody>{filteredInvoices.map((invoice) => <tr key={invoice.id} className="border-b border-slate-100"><td dir="ltr" className="p-4 text-right font-black">{invoice.number}</td><td className="p-4">{invoice.type === "RETURN" ? "مرتجع" : "فاتورة"}</td><td className="p-4">{invoice.project.client.name || invoice.project.client.email}</td><td className="p-4">{invoice.project.title}</td><td className="p-4 font-black">{invoice.amount.toLocaleString("ar")} {invoice.currency}</td><td className="p-4">{statusLabels[invoice.status] || invoice.status}</td><td className="p-4"><DateText value={invoice.dueAt} /></td><td className="p-4">{invoice.status !== "PAID" && invoice.status !== "CANCELLED" ? <button onClick={() => void markPaid(invoice)} disabled={saving} className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 font-black text-emerald-800 disabled:opacity-40">تسجيل مدفوعة</button> : "—"}</td></tr>)}</tbody></table>{!loading && !filteredInvoices.length && <p className="p-8 text-center text-slate-500">لا توجد فواتير مطابقة.</p>}</div>
        </section>
      <style jsx global>{`.field{width:100%;border-radius:.75rem;border:1px solid #d8d2c4;padding:.75rem 1rem;background:white}`}</style>
    </AdminShell>
  );
}

function ProjectFact({ label, value }: { label: string; value: ReactNode }) {
  return <div className="rounded-xl bg-white p-3"><p className="text-xs font-bold text-slate-500">{label}</p><p className="mt-1 whitespace-pre-wrap font-bold">{value}</p></div>;
}
