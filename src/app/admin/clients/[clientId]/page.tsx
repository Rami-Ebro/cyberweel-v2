"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { BarChart3, Bell, BriefcaseBusiness, ChevronDown, FileText, Mail, ReceiptText, RefreshCw, UserCog } from "lucide-react";
import { Logo } from "@/components/brand/logo";

type Section = "overview" | "projects" | "files" | "invoices" | "messages" | "account";
type Project = {
  id: string; title: string; description: string | null; status: string; progress: number;
  agreementDetails: string | null; financialPlan: string | null; stages: string | null;
  links: string[]; notes: string | null;
  dueAt: string | null; updatedAt: string;
  files: Array<{ id: string; name: string; url: string; kind: string | null; createdAt: string }>;
  invoices: Array<{ id: string; number: string; amount: number; currency: string; status: string; dueAt: string | null; paidAt: string | null; createdAt: string }>;
};
type Message = { id: string; subject: string | null; body: string; fromAdmin: boolean; createdAt: string; projectId: string | null };
type Notification = { id: string; title: string; body: string | null; section: string; readAt: string | null; createdAt: string };
type Client = {
  id: string; name: string | null; email: string; phone: string | null; isActive: boolean; createdAt: string;
  clientProjects: Project[]; clientMessages: Message[]; clientNotifications: Notification[];
};

const projectStatuses = [
  ["PLANNING", "التخطيط"], ["IN_PROGRESS", "قيد التنفيذ"], ["REVIEW", "المراجعة"],
  ["COMPLETED", "مكتمل"], ["ON_HOLD", "متوقف مؤقتًا"],
] as const;
const invoiceStatuses = [["DRAFT", "مسودة"], ["DUE", "مستحقة"], ["OVERDUE", "متأخرة"]] as const;

export default function AdminClientWorkspacePage() {
  const params = useParams<{ clientId: string }>();
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [section, setSection] = useState<Section>("overview");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [projectFormOpen, setProjectFormOpen] = useState(false);
  const [invoiceFormOpen, setInvoiceFormOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState("");

  async function load(clearNotice = true) {
    setLoading(true);
    if (clearNotice) setNotice("");
    const response = await fetch(`/api/admin/clients/${params.clientId}`, { cache: "no-store" });
    const data = await response.json().catch(() => null);
    if (response.status === 401 || response.status === 403) {
      setNotice(data?.error || "لا تملك صلاحية إدارة العملاء");
    } else if (!response.ok) {
      setNotice(data?.error || "تعذر تحميل لوحة العميل");
    } else {
      setClient(data.client);
    }
    setLoading(false);
  }

  useEffect(() => { void load(); }, [params.clientId]);
  useEffect(() => {
    const projects = client?.clientProjects || [];
    if (!projects.length) return setSelectedProjectId("");
    if (!projects.some((project) => project.id === selectedProjectId)) {
      setSelectedProjectId(projects[0].id);
    }
  }, [client, selectedProjectId]);

  async function submit(event: FormEvent<HTMLFormElement>, method: "POST" | "PATCH", success: string) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const values = Object.fromEntries(new FormData(formElement));
    setSaving(true);
    setNotice("");
    try {
      const response = await fetch(`/api/admin/clients/${params.clientId}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) return setNotice(data?.error || "تعذر حفظ العملية");
      if (method === "POST") formElement.reset();
      await load(false);
      if (values.action === "project") setProjectFormOpen(false);
      if (values.action === "invoice") setInvoiceFormOpen(false);
      setNotice(success);
    } finally {
      setSaving(false);
    }
  }

  const projects = client?.clientProjects || [];
  const files = projects.flatMap((project) => project.files.map((file) => ({ ...file, projectId: project.id, projectTitle: project.title })));
  const invoices = projects.flatMap((project) => project.invoices.map((invoice) => ({ ...invoice, projectId: project.id, projectTitle: project.title })));
  const sortedInvoices = [...invoices].sort((a, b) => {
    return b.createdAt.localeCompare(a.createdAt);
  });
  const selectedProject = projects.find((project) => project.id === selectedProjectId) || null;
  const selectedInvoices = sortedInvoices.filter((invoice) => invoice.projectId === selectedProjectId);
  const nav = [
    ["overview", "نظرة عامة", BarChart3], ["projects", "المشاريع", BriefcaseBusiness],
    ["files", "الملفات والتسليمات", FileText], ["invoices", "الفواتير", ReceiptText],
    ["messages", "الرسائل والتحديثات", Mail],
    ["account", "الحساب", UserCog],
  ] as const;

  return (
    <main dir="rtl" className="min-h-screen bg-[#F7F3EB] text-[#111827]">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="bg-[#111827] p-5 text-white lg:sticky lg:top-0 lg:h-screen">
          <button onClick={() => router.push("/admin/clients")} className="flex w-full items-center gap-3 border-b border-white/10 pb-5 text-right">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-white"><Logo size={36} /></span>
            <span><strong className="block">CyberWeel</strong><span className="text-xs text-white/50">إدارة لوحة العميل</span></span>
          </button>
          <nav className="mt-6 grid gap-2">
            {nav.map(([key, label, Icon]) => <button key={key} onClick={() => setSection(key)} className={`flex items-center gap-3 rounded-xl px-4 py-3 text-right font-bold ${section === key ? "bg-[#B89A5A] text-[#111827]" : "text-white/70 hover:bg-white/10 hover:text-white"}`}><Icon className="h-5 w-5" />{label}</button>)}
          </nav>
          <Link href="/admin/clients" className="mt-8 block rounded-xl border border-white/10 px-4 py-3 text-center font-bold text-white/70 hover:bg-white/10">العودة إلى حسابات العملاء</Link>
        </aside>

        <section className="p-4 sm:p-7 lg:p-10">
          <header className="relative flex flex-wrap items-center justify-between gap-4">
            <div><p className="text-sm font-bold text-[#9A7D43]">عرض الإدارة — التعديلات تظهر للعميل مباشرة</p><h1 className="mt-1 text-3xl font-black">{client?.name || "لوحة العميل"}</h1></div>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => setNotificationsOpen((value) => !value)} className="relative flex items-center gap-2 rounded-xl border border-[#D8D2C4] bg-white px-4 py-3 font-bold shadow-sm">
                <Bell className="h-5 w-5" />الإشعارات
                {!!client?.clientNotifications.filter((item) => !item.readAt).length && <span className="grid min-w-6 place-items-center rounded-full bg-red-600 px-1.5 py-0.5 text-xs text-white">{client.clientNotifications.filter((item) => !item.readAt).length}</span>}
              </button>
              <button onClick={() => void load()} disabled={loading} className="flex items-center gap-2 rounded-xl border border-[#D8D2C4] bg-white px-4 py-3 font-bold shadow-sm"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />تحديث</button>
            </div>
            {notificationsOpen && client && <div className="absolute left-0 top-full z-20 mt-3 w-full max-w-md rounded-2xl border border-[#D8D2C4] bg-white p-3 shadow-xl"><div className="flex items-center justify-between px-2 py-2"><strong>إشعارات العميل</strong><button onClick={() => setNotificationsOpen(false)} className="text-xs text-slate-500">إغلاق</button></div><div className="max-h-96 space-y-2 overflow-y-auto">{client.clientNotifications.slice(0, 10).map((item) => <div key={item.id} className={`rounded-xl p-3 ${item.readAt ? "bg-slate-50" : "bg-amber-50"}`}><strong className="text-sm">{item.title}</strong>{item.body && <p className="mt-1 text-xs leading-5 text-slate-500">{item.body}</p>}</div>)}{!client.clientNotifications.length && <p className="p-5 text-center text-sm text-slate-500">لا توجد إشعارات بعد.</p>}</div></div>}
          </header>
          {notice && <p role="status" className="mt-5 rounded-xl border border-[#D8D2C4] bg-white p-4 font-bold shadow-sm">{notice}</p>}
          {loading && <div className="mt-8 rounded-2xl bg-white p-10 text-center">جارٍ تحميل لوحة العميل...</div>}

          {!loading && client && section === "overview" && <div className="mt-7">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                ["المشاريع", projects.length, "projects"],
                ["الفواتير", invoices.length, "invoices"],
                ["الملفات", files.length, "files"],
                ["الإشعارات", client.clientNotifications.filter((item) => !item.readAt).length, "notifications"],
              ].map(([label, value, target]) => <button key={String(label)} onClick={() => target === "notifications" ? setNotificationsOpen(true) : setSection(target as Section)} className="rounded-2xl border border-[#D8D2C4] bg-white p-5 text-right shadow-sm transition hover:-translate-y-1 hover:border-[#B89A5A] hover:shadow-md"><p className="text-sm font-bold text-slate-500">{label}</p><p className="mt-3 text-4xl font-black">{value}</p><p className="mt-3 text-xs font-bold text-[#9A7D43]">فتح القسم</p></button>)}
            </div>
            <section className="mt-6 rounded-2xl border border-[#D8D2C4] bg-white p-6 shadow-sm"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><Bell className="h-5 w-5" /><h2 className="text-xl font-black">آخر الإشعارات</h2></div><button onClick={() => setNotificationsOpen(true)} className="text-sm font-bold text-[#9A7D43]">عرض من الجرس</button></div><div className="mt-4 grid gap-2">{client.clientNotifications.slice(0, 5).map((item) => <div key={item.id} className="rounded-xl bg-[#F7F3EB] p-4"><strong>{item.title}</strong>{item.body && <p className="mt-1 text-sm text-slate-500">{item.body}</p>}</div>)}{!client.clientNotifications.length && <p className="text-slate-500">لا توجد إشعارات بعد.</p>}</div></section>
          </div>}

          {!loading && client && section === "projects" && <div className="mt-7 grid gap-5">
            <section className="rounded-2xl border border-[#D8D2C4] bg-white shadow-sm">
              <button onClick={() => setProjectFormOpen((value) => !value)} className="flex w-full items-center justify-between gap-3 p-6 text-right"><div><h2 className="text-xl font-black">إضافة مشروع جديد</h2><p className="mt-1 text-sm text-slate-500">افتح البطاقة عند الحاجة فقط.</p></div><ChevronDown className={`h-5 w-5 transition ${projectFormOpen ? "rotate-180" : ""}`} /></button>
              {projectFormOpen && <form onSubmit={(event) => void submit(event, "POST", "تمت إضافة المشروع وإشعار العميل")} className="grid gap-3 border-t border-[#D8D2C4] p-6"><input type="hidden" name="action" value="project" /><input name="title" required placeholder="اسم المشروع" className="field" /><textarea name="description" placeholder="وصف مختصر للمشروع" rows={3} className="field" /><textarea name="agreementDetails" placeholder="تفاصيل الاتفاق ونطاق العمل" rows={4} className="field" /><textarea name="financialPlan" placeholder="الخطة المالية المتفق عليها" rows={4} className="field" /><textarea name="stages" placeholder="مراحل المشروع — مرحلة في كل سطر" rows={4} className="field" /><textarea name="links" placeholder={"روابط المشروع — رابط في كل سطر\nhttps://..."} rows={3} className="field" /><textarea name="notes" placeholder="ملاحظات داخلية أو اختيارية" rows={3} className="field" /><SaveButton saving={saving} label="إضافة المشروع" /></form>}
            </section>
            {projects.map((project) => <details key={project.id} className="rounded-2xl border border-[#D8D2C4] bg-white shadow-sm"><summary className="cursor-pointer list-none p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-black">{project.title}</h2><p className="mt-1 text-sm text-slate-500">{project.description || "لا يوجد وصف مختصر."}</p></div><span className="rounded-full bg-[#F7F3EB] px-3 py-1 text-sm font-bold text-[#9A7D43]">{project.progress}%</span></div></summary><form onSubmit={(event) => void submit(event, "PATCH", "تم تحديث المشروع وإشعار العميل")} className="grid gap-3 border-t border-[#D8D2C4] p-6"><input type="hidden" name="action" value="project" /><input type="hidden" name="projectId" value={project.id} /><input name="title" defaultValue={project.title} required className="field" /><textarea name="description" defaultValue={project.description || ""} rows={3} className="field" /><textarea name="agreementDetails" defaultValue={project.agreementDetails || ""} placeholder="تفاصيل الاتفاق ونطاق العمل" rows={4} className="field" /><textarea name="financialPlan" defaultValue={project.financialPlan || ""} placeholder="الخطة المالية المتفق عليها" rows={4} className="field" /><textarea name="stages" defaultValue={project.stages || ""} placeholder="مراحل المشروع" rows={4} className="field" /><textarea name="links" defaultValue={(project.links || []).join("\n")} placeholder="روابط المشروع — رابط في كل سطر" rows={3} className="field" /><textarea name="notes" defaultValue={project.notes || ""} placeholder="ملاحظات اختيارية" rows={3} className="field" /><div className="grid gap-3 md:grid-cols-3"><select name="status" defaultValue={project.status} className="field">{projectStatuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><input name="progress" type="number" min={0} max={100} defaultValue={project.progress} className="field" /><input name="dueAt" type="date" defaultValue={project.dueAt?.slice(0, 10) || ""} className="field" /></div><SaveButton saving={saving} label="حفظ بيانات المشروع" /></form></details>)}
          </div>}

          {!loading && client && section === "files" && <div className="mt-7 grid gap-5">
            <Editor title="إضافة ملف أو تسليم"><form onSubmit={(event) => void submit(event, "POST", "تمت إضافة الملف وإشعار العميل")} className="grid gap-3"><input type="hidden" name="action" value="file" /><ProjectSelect projects={projects} /><input name="name" required placeholder="اسم الملف أو التسليم" className="field" /><input name="url" type="url" required placeholder="رابط الملف https://..." className="field" /><select name="kind" className="field"><option value="DELIVERABLE">تسليم نهائي</option><option value="WORKING">ملف عمل</option><option value="REFERENCE">مرجع</option><option value="CONTRACT">اتفاق أو عقد</option><option value="OTHER">أخرى</option></select><SaveButton saving={saving} label="إضافة الملف" /></form></Editor>
            <ListEmpty empty={!files.length} text="لا توجد ملفات بعد.">{files.map((file) => <a key={file.id} href={file.url} target="_blank" rel="noreferrer" className="rounded-2xl border border-[#D8D2C4] bg-white p-5 shadow-sm"><strong>{file.name}</strong><p className="mt-1 text-sm text-slate-500">{file.projectTitle}</p></a>)}</ListEmpty>
          </div>}

          {!loading && client && section === "invoices" && <div className="mt-7 grid gap-5">
            {!projects.length ? <ListEmpty empty text="أنشئ مشروعًا أولًا؛ الفواتير لا تُنشأ دون مشروع." children={null} /> : <>
              {projects.length > 1 && <label className="grid gap-2 font-bold">المشروع<select value={selectedProjectId} onChange={(event) => setSelectedProjectId(event.target.value)} className="field">{projects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}</select></label>}
              {projects.length === 1 && <p className="rounded-xl bg-white p-4 text-sm font-bold shadow-sm">المشروع المحدد تلقائيًا: {projects[0].title}</p>}

              {selectedProject && <details className="rounded-2xl border border-[#D8D2C4] bg-white shadow-sm"><summary className="cursor-pointer list-none p-6"><div className="flex items-center justify-between gap-3"><div><h2 className="text-xl font-black">ملخص اتفاق المشروع</h2><p className="mt-1 text-sm text-slate-500">{selectedProject.title} — للعرض فقط</p></div><ChevronDown className="h-5 w-5" /></div></summary><div className="grid gap-4 border-t border-[#D8D2C4] p-6 text-sm"><ReadOnly label="نطاق المشروع" value={selectedProject.agreementDetails || selectedProject.description} /><ReadOnly label="الخطة المالية" value={selectedProject.financialPlan} /><ReadOnly label="المراحل" value={selectedProject.stages} /><ReadOnly label="الملاحظات" value={selectedProject.notes} />{!!selectedProject.links?.length && <div><p className="font-black">روابط المشروع</p><div className="mt-2 grid gap-1">{selectedProject.links.map((link) => <a key={link} href={link} target="_blank" rel="noreferrer" className="text-[#9A7D43] underline">{link}</a>)}</div></div>}<p className="text-xs text-slate-500">لتعديل هذه البيانات انتقل إلى صفحة المشاريع.</p></div></details>}

              <section><h2 className="text-xl font-black">سجل الفواتير</h2><div className="mt-4"><ListEmpty empty={!selectedInvoices.length} text="لا توجد فواتير لهذا المشروع.">{selectedInvoices.map((invoice) => <div key={invoice.id} className="rounded-2xl border border-[#D8D2C4] bg-white p-5 shadow-sm"><div className="flex flex-wrap justify-between gap-3"><strong>{invoice.number}</strong><span>{invoice.amount.toLocaleString("ar")} {invoice.currency}</span></div><p className="mt-2 text-sm text-slate-500">{invoice.status} — {invoice.dueAt ? new Date(invoice.dueAt).toLocaleDateString("ar") : "دون تاريخ استحقاق"}</p>{invoice.status !== "PAID" && <form onSubmit={(event) => void submit(event, "POST", "تم تسجيل الفاتورة كمدفوعة وإشعار العميل")} className="mt-3"><input type="hidden" name="action" value="payment" /><input type="hidden" name="invoiceId" value={invoice.id} /><button disabled={saving} className="rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-800">تسجيلها كمدفوعة</button></form>}</div>)}</ListEmpty></div></section>

              <section className="rounded-2xl border border-[#D8D2C4] bg-white shadow-sm"><button onClick={() => setInvoiceFormOpen((value) => !value)} className="flex w-full items-center justify-between gap-3 p-6 text-right"><div><h2 className="text-xl font-black">إصدار فاتورة</h2><p className="mt-1 text-sm text-slate-500">تُسحب بيانات الاتفاق من المشروع ولا تُكرر هنا.</p></div><ChevronDown className={`h-5 w-5 transition ${invoiceFormOpen ? "rotate-180" : ""}`} /></button>{invoiceFormOpen && <form onSubmit={(event) => void submit(event, "POST", "تم إصدار الفاتورة وإشعار العميل")} className="grid gap-3 border-t border-[#D8D2C4] p-6"><input type="hidden" name="action" value="invoice" /><input type="hidden" name="projectId" value={selectedProjectId} /><div className="grid gap-3 md:grid-cols-2"><input name="number" required placeholder="رقم الفاتورة" className="field" /><input name="amount" type="number" min="0.01" step="0.01" required placeholder="المبلغ" className="field" /></div><div className="grid gap-3 md:grid-cols-3"><input name="currency" defaultValue="USD" className="field" /><select name="status" defaultValue="DUE" className="field">{invoiceStatuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><input name="dueAt" type="date" className="field" /></div><SaveButton saving={saving} label="إصدار الفاتورة" /></form>}</section>
            </>}
          </div>}

          {!loading && client && section === "messages" && <div className="mt-7 grid gap-5">
            <Editor title="إرسال رسالة أو تحديث"><form onSubmit={(event) => void submit(event, "POST", "تم إرسال الرسالة وإشعار العميل")} className="grid gap-3"><input type="hidden" name="action" value="message" /><ProjectSelect projects={projects} optional /><input name="subject" placeholder="عنوان الرسالة — اختياري" className="field" /><textarea name="body" required minLength={2} maxLength={5000} rows={5} placeholder="اكتب الرسالة أو التحديث..." className="field" /><p className="text-xs text-slate-500">بعد الإرسال لا يمكن تعديل الرسالة أو حذفها من الإدارة أو العميل.</p><SaveButton saving={saving} label="إرسال الرسالة" /></form></Editor>
            <ListEmpty empty={!client.clientMessages.length} text="لا توجد رسائل بعد.">{client.clientMessages.map((message) => <article key={message.id} className="rounded-2xl border border-[#D8D2C4] bg-white p-5 shadow-sm"><div className="flex flex-wrap justify-between gap-3"><strong>{message.subject || (message.fromAdmin ? "تحديث من الإدارة" : "رسالة العميل")}</strong><span className="text-xs text-slate-500">{new Date(message.createdAt).toLocaleString("ar")}</span></div><span className="mt-2 inline-block rounded-full bg-[#F7F3EB] px-3 py-1 text-xs font-bold">{message.fromAdmin ? "الإدارة" : "العميل"}</span><p className="mt-3 whitespace-pre-wrap leading-7 text-slate-600">{message.body}</p></article>)}</ListEmpty>
          </div>}

          {!loading && client && section === "account" && <Editor title="بيانات حساب العميل"><div className="grid gap-3 text-sm"><p><b>الاسم:</b> {client.name || "—"}</p><p><b>البريد:</b> {client.email}</p><p><b>الهاتف:</b> {client.phone || "—"}</p><p><b>الحالة:</b> {client.isActive ? "فعال" : "معلّق"}</p><Link href="/admin/clients" className="mt-3 w-fit rounded-xl bg-[#111827] px-5 py-3 font-black text-white">إدارة الحساب وكلمة المرور</Link></div></Editor>}
        </section>
      </div>
    </main>
  );
}

function Editor({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-2xl border border-[#D8D2C4] bg-white p-6 shadow-sm"><h2 className="mb-5 text-xl font-black">{title}</h2>{children}</section>;
}

function ProjectSelect({ projects, optional = false }: { projects: Project[]; optional?: boolean }) {
  return <select name="projectId" required={!optional} className="field"><option value="">{optional ? "رسالة عامة — دون مشروع" : "اختر المشروع"}</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}</select>;
}

function SaveButton({ saving, label }: { saving: boolean; label: string }) {
  return <button disabled={saving} className="w-fit rounded-xl bg-[#B89A5A] px-5 py-3 font-black disabled:opacity-50">{saving ? "جارٍ الحفظ..." : label}</button>;
}

function ListEmpty({ empty, text, children }: { empty: boolean; text: string; children: React.ReactNode }) {
  return <div className="grid gap-3">{empty ? <div className="rounded-2xl border border-dashed border-[#D8D2C4] bg-white p-8 text-center text-slate-500">{text}</div> : children}</div>;
}

function ReadOnly({ label, value }: { label: string; value: string | null | undefined }) {
  return <div><p className="font-black">{label}</p><p className="mt-1 whitespace-pre-wrap leading-6 text-slate-600">{value || "لم تُضف هذه البيانات بعد."}</p></div>;
}
