"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import { BarChart3, Bell, BriefcaseBusiness, ChevronDown, FileText, Mail, Paperclip, Plus, ReceiptText, RefreshCw, Trash2, UserCog } from "lucide-react";
import { Logo } from "@/components/brand/logo";

type Section = "overview" | "projects" | "files" | "invoices" | "messages" | "account";
type Project = {
  id: string; title: string; description: string | null; status: string; progress: number;
  agreementDetails: string | null; financialPlan: string | null; currency: string; stages: string | null;
  links: string[]; notes: string | null;
  dueAt: string | null; updatedAt: string;
  files: Array<{ id: string; name: string; url: string; kind: string | null; size: number | null; storageProvider: string | null; createdAt: string }>;
  invoices: Array<{ id: string; number: string; type: "STANDARD" | "RETURN"; amount: number; currency: string; status: string; dueAt: string | null; paidAt: string | null; createdAt: string }>;
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
  const [fileFormOpen, setFileFormOpen] = useState(false);
  const [invoiceFormOpen, setInvoiceFormOpen] = useState(false);
  const [messageFormOpen, setMessageFormOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState("");
  const [newProjectFormVersion, setNewProjectFormVersion] = useState(0);

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
      setNextInvoiceNumber(data.nextInvoiceNumber || "");
      const loadedProjects = data.client?.clientProjects || [];
      setSelectedProjectId((current) => loadedProjects.some((project: Project) => project.id === current) ? current : loadedProjects[0]?.id || "");
    }
    setLoading(false);
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [params.clientId]);

  async function submit(event: FormEvent<HTMLFormElement>, method: "POST" | "PATCH", success: string) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const formData = new FormData(formElement);
    const values: Record<string, unknown> = Object.fromEntries(formData);
    if (formData.has("links")) values.links = formData.getAll("links").map(String);
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
      if (values.action === "file") setFileFormOpen(false);
      if (values.action === "invoice") setInvoiceFormOpen(false);
      if (values.action === "message") setMessageFormOpen(false);
      setNotice(success);
    } finally {
      setSaving(false);
    }
  }

  async function saveProject(event: FormEvent<HTMLFormElement>, method: "POST" | "PATCH") {
    event.preventDefault();
    const formElement = event.currentTarget;
    const formData = new FormData(formElement);
    const attachments = formData.getAll("attachments").filter((item): item is File => item instanceof File && item.size > 0);
    const oversized = attachments.find((file) => file.size > 25 * 1024 * 1024);
    if (oversized) return setNotice(`الملف ${oversized.name} أكبر من 25 ميغابايت`);

    const values: Record<string, unknown> = Object.fromEntries(
      [...formData.entries()].filter(([key]) => key !== "attachments" && key !== "links"),
    );
    values.links = formData.getAll("links").map(String).filter(Boolean);

    setSaving(true);
    setNotice("");
    try {
      const response = await fetch(`/api/admin/clients/${params.clientId}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) return setNotice(data?.error || "تعذر حفظ المشروع");

      const projectId = data?.project?.id;
      if (attachments.length && projectId) {
        try {
          for (const file of attachments) {
            const cleanName = file.name.replace(/[^\p{L}\p{N}._-]+/gu, "-");
            await upload(
              `clients/${params.clientId}/projects/${projectId}/${crypto.randomUUID()}-${cleanName}`,
              file,
              {
                access: "private",
                handleUploadUrl: `/api/admin/clients/${params.clientId}/project-files/upload`,
                clientPayload: JSON.stringify({
                  clientId: params.clientId,
                  projectId,
                  originalName: file.name,
                  size: file.size,
                }),
                multipart: file.size > 5 * 1024 * 1024,
              },
            );
          }
        } catch {
          await load(false);
          return setNotice("تم حفظ المشروع، لكن تعذر رفع بعض المرفقات. تحقق من ربط Vercel Blob ثم أعد رفعها.");
        }
      }

      if (method === "POST") {
        formElement.reset();
        setNewProjectFormVersion((value) => value + 1);
        setProjectFormOpen(false);
      }
      await load(false);
      setNotice(method === "POST" ? "تم حفظ المشروع وإشعار العميل" : "تم تحديث المشروع وإشعار العميل");
    } finally {
      setSaving(false);
    }
  }

  const projects = client?.clientProjects || [];
  const files = projects
    .flatMap((project) => project.files.map((file) => ({ ...file, projectId: project.id, projectTitle: project.title })))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const invoices = projects.flatMap((project) => project.invoices.map((invoice) => ({ ...invoice, projectId: project.id, projectTitle: project.title })));
  const sortedInvoices = [...invoices].sort((a, b) => {
    return b.createdAt.localeCompare(a.createdAt);
  });
  const selectedProject = projects.find((project) => project.id === selectedProjectId) || null;
  const selectedInvoices = sortedInvoices.filter((invoice) => invoice.projectId === selectedProjectId);
  const clientUnreadCount = client?.clientNotifications.filter((item) => !item.readAt).length || 0;
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
              <button onClick={() => setNotificationsOpen((value) => !value)} title="يعرض العداد الإشعارات التي لم يفتحها العميل بعد" className="relative flex items-center gap-2 rounded-xl border border-[#D8D2C4] bg-white px-4 py-3 font-bold shadow-sm">
                <Bell className="h-5 w-5" />إشعارات العميل
                {!!clientUnreadCount && <span className="grid min-w-6 place-items-center rounded-full bg-red-600 px-1.5 py-0.5 text-xs text-white">{clientUnreadCount}</span>}
              </button>
              <button onClick={() => void load()} disabled={loading} className="flex items-center gap-2 rounded-xl border border-[#D8D2C4] bg-white px-4 py-3 font-bold shadow-sm"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />تحديث</button>
            </div>
            {notificationsOpen && client && <div className="absolute left-0 top-full z-20 mt-3 w-full max-w-md rounded-2xl border border-[#D8D2C4] bg-white p-3 shadow-xl"><div className="flex items-center justify-between px-2 py-2"><div><strong>إشعارات العميل</strong><p className="mt-1 text-xs text-slate-500">{clientUnreadCount} لم يفتحها العميل بعد</p><p className="mt-1 text-xs text-[#9A7D43]">للعرض فقط؛ تتغير الحالة عندما يفتح العميل الإشعار.</p></div><button onClick={() => setNotificationsOpen(false)} className="text-xs text-slate-500">إغلاق</button></div><div className="max-h-96 space-y-2 overflow-y-auto">{client.clientNotifications.slice(0, 10).map((item) => <div key={item.id} className={`rounded-xl p-3 ${item.readAt ? "bg-slate-50 text-slate-600" : "bg-amber-50 text-[#111827]"}`}><div className="flex items-start justify-between gap-3"><strong className="text-sm">{item.title}</strong><time dateTime={item.createdAt} dir="ltr" className="shrink-0 text-xs text-slate-500">{new Date(item.createdAt).toLocaleDateString("ar")}</time></div>{item.body && <p className="mt-1 text-xs leading-5 text-slate-500">{item.body}</p>}</div>)}{!client.clientNotifications.length && <p className="p-5 text-center text-sm text-slate-500">لا توجد إشعارات بعد.</p>}</div></div>}
          </header>
          {notice && <p role="status" className="mt-5 rounded-xl border border-[#D8D2C4] bg-white p-4 font-bold shadow-sm">{notice}</p>}
          {loading && <div className="mt-8 rounded-2xl bg-white p-10 text-center">جارٍ تحميل لوحة العميل...</div>}

          {!loading && client && section === "overview" && <div className="mt-7">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                ["المشاريع", projects.length, "projects"],
                ["الفواتير", invoices.length, "invoices"],
                ["الملفات", files.length, "files"],
                ["الإشعارات", clientUnreadCount, "notifications"],
              ].map(([label, value, target]) => <button key={String(label)} onClick={() => target === "notifications" ? setNotificationsOpen(true) : setSection(target as Section)} className="rounded-2xl border border-[#D8D2C4] bg-white p-5 text-right shadow-sm transition hover:-translate-y-1 hover:border-[#B89A5A] hover:shadow-md"><p className="text-sm font-bold text-slate-500">{label}</p><p className="mt-3 text-4xl font-black">{value}</p><p className="mt-3 text-xs font-bold text-[#9A7D43]">فتح القسم</p></button>)}
            </div>
            <section className="mt-6 rounded-2xl border border-[#D8D2C4] bg-white p-6 shadow-sm"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><Bell className="h-5 w-5" /><h2 className="text-xl font-black">آخر الإشعارات</h2></div><button onClick={() => setNotificationsOpen(true)} className="text-sm font-bold text-[#9A7D43]">عرض من الجرس</button></div><div className="mt-4 grid gap-2">{client.clientNotifications.slice(0, 5).map((item) => <div key={item.id} className={`rounded-xl p-4 ${item.readAt ? "bg-slate-50 text-slate-600" : "bg-amber-50 text-[#111827]"}`}><div className="flex items-start justify-between gap-3"><strong>{item.title}</strong><time dateTime={item.createdAt} dir="ltr" className="shrink-0 text-xs text-slate-500">{new Date(item.createdAt).toLocaleDateString("ar")}</time></div>{item.body && <p className="mt-1 text-sm text-slate-500">{item.body}</p>}</div>)}{!client.clientNotifications.length && <p className="text-slate-500">لا توجد إشعارات بعد.</p>}</div></section>
          </div>}

          {!loading && client && section === "projects" && <div className="mt-7 grid gap-5">
            {projects.map((project) => (
              <details key={project.id} className="rounded-2xl border border-[#D8D2C4] bg-white shadow-sm">
                <summary className="cursor-pointer list-none p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-black">{project.title}</h2>
                      <p className="mt-1 text-sm text-slate-500">{project.description || "لا يوجد وصف مختصر."}</p>
                    </div>
                    <span className="rounded-full bg-[#F7F3EB] px-3 py-1 text-sm font-bold text-[#9A7D43]">{project.progress}%</span>
                  </div>
                </summary>
                <form onSubmit={(event) => void saveProject(event, "PATCH")} className="grid gap-4 border-t border-[#D8D2C4] p-6">
                  <input type="hidden" name="action" value="project" />
                  <input type="hidden" name="projectId" value={project.id} />
                  <ProjectCoreFields project={project} />
                  <ProjectLinksFields initialLinks={project.links} />
                  <ProjectAttachmentsInput files={project.files} />
                  <label className="grid gap-2 font-bold">
                    ملاحظات داخلية اختيارية
                    <textarea name="notes" defaultValue={project.notes || ""} placeholder="لا تظهر هذه الملاحظات للعميل" rows={3} className="field font-normal" />
                  </label>
                  <div className="grid gap-3 md:grid-cols-3">
                    <label className="grid gap-2 font-bold">حالة المشروع<select name="status" defaultValue={project.status} className="field font-normal">{projectStatuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                    <label className="grid gap-2 font-bold">نسبة الإنجاز<input name="progress" type="number" min={0} max={100} defaultValue={project.progress} className="field font-normal" /></label>
                    <ProjectDueDateInput value={project.dueAt} />
                  </div>
                  <SaveButton saving={saving} label="حفظ بيانات المشروع" />
                </form>
              </details>
            ))}
            {!projects.length && <ListEmpty empty text="لا توجد مشاريع بعد.">{null}</ListEmpty>}
            <CreationPanel title="إضافة مشروع جديد" description="افتح البطاقة عند الحاجة فقط." open={projectFormOpen} onToggle={() => setProjectFormOpen((value) => !value)}>
              <form key={newProjectFormVersion} onSubmit={(event) => void saveProject(event, "POST")} className="grid gap-4">
                <input type="hidden" name="action" value="project" />
                <ProjectCoreFields />
                <ProjectLinksFields />
                <ProjectAttachmentsInput />
                <label className="grid gap-2 font-bold">
                  ملاحظات داخلية اختيارية
                  <textarea name="notes" placeholder="لا تظهر هذه الملاحظات للعميل" rows={3} className="field font-normal" />
                </label>
                <div className="grid gap-3 md:grid-cols-3">
                  <label className="grid gap-2 font-bold">حالة المشروع<select name="status" defaultValue="PLANNING" className="field font-normal">{projectStatuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                  <label className="grid gap-2 font-bold">نسبة الإنجاز<input name="progress" type="number" min={0} max={100} defaultValue={0} className="field font-normal" /></label>
                  <ProjectDueDateInput value={null} />
                </div>
                <SaveButton saving={saving} label="حفظ المشروع" />
              </form>
            </CreationPanel>
          </div>}

          {!loading && client && section === "files" && <div className="mt-7 grid gap-5">
            <ListEmpty empty={!files.length} text="لا توجد ملفات بعد.">{files.map((file) => <a key={file.id} href={file.storageProvider === "VERCEL_BLOB" ? `/api/client/files/${file.id}` : file.url} target="_blank" rel="noreferrer" className="rounded-2xl border border-[#D8D2C4] bg-white p-5 shadow-sm"><strong>{file.name}</strong><p className="mt-1 text-sm text-slate-500">{file.projectTitle}</p></a>)}</ListEmpty>
            <CreationPanel title="إضافة ملف أو تسليم" description="الملفات الحالية في الأعلى، والإضافة عند الحاجة فقط." open={fileFormOpen} onToggle={() => setFileFormOpen((value) => !value)}>
              <form onSubmit={(event) => void submit(event, "POST", "تمت إضافة الملف وإشعار العميل")} className="grid gap-3"><input type="hidden" name="action" value="file" /><ProjectSelect projects={projects} /><input name="name" required placeholder="اسم الملف أو التسليم" className="field" /><input name="url" type="url" required placeholder="رابط الملف https://..." className="field" /><select name="kind" className="field"><option value="DELIVERABLE">تسليم نهائي</option><option value="WORKING">ملف عمل</option><option value="REFERENCE">مرجع</option><option value="CONTRACT">اتفاق أو عقد</option><option value="OTHER">أخرى</option></select><SaveButton saving={saving} label="إضافة الملف" /></form>
            </CreationPanel>
          </div>}

          {!loading && client && section === "invoices" && <div className="mt-7 grid gap-5">
            {!projects.length ? <ListEmpty empty text="أنشئ مشروعًا أولًا؛ الفواتير لا تُنشأ دون مشروع.">{null}</ListEmpty> : <>
              {projects.length > 1 && <label className="grid gap-2 font-bold">المشروع<select value={selectedProjectId} onChange={(event) => setSelectedProjectId(event.target.value)} className="field">{projects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}</select></label>}
              {projects.length === 1 && <p className="rounded-xl bg-white p-4 text-sm font-bold shadow-sm">المشروع المحدد تلقائيًا: {projects[0].title}</p>}

              {selectedProject && <details className="rounded-2xl border border-[#D8D2C4] bg-white shadow-sm"><summary className="cursor-pointer list-none p-6"><div className="flex items-center justify-between gap-3"><div><h2 className="text-xl font-black">ملخص اتفاق المشروع</h2><p className="mt-1 text-sm text-slate-500">{selectedProject.title} — للعرض فقط</p></div><ChevronDown className="h-5 w-5" /></div></summary><div className="grid gap-4 border-t border-[#D8D2C4] p-6 text-sm"><ReadOnly label="نطاق المشروع" value={selectedProject.agreementDetails || selectedProject.description} /><ReadOnly label={`الخطة المالية — ${selectedProject.currency}`} value={selectedProject.financialPlan} /><ReadOnly label="المراحل" value={selectedProject.stages} /><ReadOnly label="الملاحظات الداخلية" value={selectedProject.notes} />{!!selectedProject.links?.length && <div><p className="font-black">روابط المشروع</p><div className="mt-2 grid gap-1">{selectedProject.links.map((link) => <a key={link} href={link} target="_blank" rel="noreferrer" className="text-[#9A7D43] underline">{link}</a>)}</div></div>}<p className="text-xs text-slate-500">لتعديل هذه البيانات انتقل إلى صفحة المشاريع.</p></div></details>}

              <section><h2 className="text-xl font-black">سجل الفواتير</h2><div className="mt-4"><ListEmpty empty={!selectedInvoices.length} text="لا توجد فواتير لهذا المشروع.">{selectedInvoices.map((invoice) => <div key={invoice.id} className="rounded-2xl border border-[#D8D2C4] bg-white p-5 shadow-sm"><div className="flex flex-wrap justify-between gap-3"><div className="flex items-center gap-2"><strong>{invoice.number}</strong><span className="rounded-full bg-[#F7F3EB] px-3 py-1 text-xs font-bold text-[#9A7D43]">{invoice.type === "RETURN" ? "مرتجع" : "فاتورة"}</span></div><span>{invoice.amount.toLocaleString("ar")} {invoice.currency}</span></div><p className="mt-2 text-sm text-slate-500">{invoice.status} — {invoice.dueAt ? new Date(invoice.dueAt).toLocaleDateString("ar") : "دون تاريخ استحقاق"}</p>{invoice.status !== "PAID" && <form onSubmit={(event) => void submit(event, "POST", "تم تسجيل الفاتورة كمدفوعة وإشعار العميل")} className="mt-3"><input type="hidden" name="action" value="payment" /><input type="hidden" name="invoiceId" value={invoice.id} /><button disabled={saving} className="rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-800">تسجيلها كمدفوعة</button></form>}</div>)}</ListEmpty></div></section>

              <section className="rounded-2xl border border-[#D8D2C4] bg-white shadow-sm">
                <button onClick={() => setInvoiceFormOpen((value) => !value)} className="flex w-full items-center justify-between gap-3 p-6 text-right">
                  <div><h2 className="text-xl font-black">إصدار فاتورة</h2><p className="mt-1 text-sm text-slate-500">تُسحب بيانات الاتفاق من المشروع ولا تُكرر هنا.</p></div>
                  <ChevronDown className={`h-5 w-5 transition ${invoiceFormOpen ? "rotate-180" : ""}`} />
                </button>
                {invoiceFormOpen && (
                  <form onSubmit={(event) => void submit(event, "POST", "تم إصدار الفاتورة وإشعار العميل")} className="grid gap-3 border-t border-[#D8D2C4] p-6">
                    <input type="hidden" name="action" value="invoice" />
                    <input type="hidden" name="projectId" value={selectedProjectId} />
                    <input type="hidden" name="currency" value={selectedProject?.currency || "USD"} />
                    <div className="rounded-xl bg-[#F7F3EB] p-4">
                      <p className="font-black">رقم الفاتورة يُنشأ تلقائيًا</p>
                      <p dir="ltr" className="mt-1 w-fit text-sm font-bold text-[#9A7D43]">{nextInvoiceNumber || "جارٍ تحديد الرقم..."}</p>
                    </div>
                    <input name="amount" type="number" min="0.01" step="0.01" required placeholder="المبلغ" className="field" />
                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="grid gap-2 font-bold">نوع الفاتورة<select name="type" defaultValue="STANDARD" className="field font-normal"><option value="STANDARD">فاتورة</option><option value="RETURN">مرتجع</option></select></label>
                      <label className="grid gap-2 font-bold">الحالة<select name="status" defaultValue="DUE" className="field font-normal">{invoiceStatuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                      <div className="field bg-slate-50 font-bold">{selectedProject?.currency || "USD"}</div>
                      <NativeDateInput label="تاريخ الاستحقاق" ariaLabel="تاريخ الاستحقاق: يوم ثم شهر ثم سنة" />
                    </div>
                    <SaveButton saving={saving} label="إصدار الفاتورة" />
                  </form>
                )}
              </section>
            </>}
          </div>}

          {!loading && client && section === "messages" && <div className="mt-7 grid gap-5">
            <ListEmpty empty={!client.clientMessages.length} text="لا توجد رسائل بعد.">{[...client.clientMessages].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((message) => <article key={message.id} className="rounded-2xl border border-[#D8D2C4] bg-white p-5 shadow-sm"><div className="flex flex-wrap justify-between gap-3"><strong>{message.subject || (message.fromAdmin ? "تحديث من الإدارة" : "رسالة العميل")}</strong><span className="text-xs text-slate-500">{new Date(message.createdAt).toLocaleString("ar")}</span></div><span className="mt-2 inline-block rounded-full bg-[#F7F3EB] px-3 py-1 text-xs font-bold">{message.fromAdmin ? "الإدارة" : "العميل"}</span><p className="mt-3 whitespace-pre-wrap leading-7 text-slate-600">{message.body}</p></article>)}</ListEmpty>
            <CreationPanel title="إرسال رسالة أو تحديث" description="الرسائل الحالية في الأعلى، ونموذج الإرسال مطوي بالأسفل." open={messageFormOpen} onToggle={() => setMessageFormOpen((value) => !value)}>
              <form onSubmit={(event) => void submit(event, "POST", "تم إرسال الرسالة وإشعار العميل")} className="grid gap-3"><input type="hidden" name="action" value="message" /><ProjectSelect projects={projects} optional /><input name="subject" placeholder="عنوان الرسالة — اختياري" className="field" /><textarea name="body" required minLength={2} maxLength={5000} rows={5} placeholder="اكتب الرسالة أو التحديث..." className="field" /><p className="text-xs text-slate-500">بعد الإرسال لا يمكن تعديل الرسالة أو حذفها من الإدارة أو العميل.</p><SaveButton saving={saving} label="إرسال الرسالة" /></form>
            </CreationPanel>
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

function CreationPanel({ title, description, open, onToggle, children }: { title: string; description: string; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return <section className="rounded-2xl border border-[#D8D2C4] bg-white shadow-sm"><button type="button" aria-expanded={open} onClick={onToggle} className="flex w-full items-center justify-between gap-3 p-6 text-right"><div><h2 className="text-xl font-black">{title}</h2><p className="mt-1 text-sm text-slate-500">{description}</p></div><ChevronDown className={`h-5 w-5 shrink-0 transition ${open ? "rotate-180" : ""}`} /></button>{open && <div className="border-t border-[#D8D2C4] p-6">{children}</div>}</section>;
}

function ProjectCoreFields({ project }: { project?: Project }) {
  return <>
    <label className="grid gap-2 font-bold">
      اسم المشروع
      <input name="title" defaultValue={project?.title || ""} required minLength={2} placeholder="اسم المشروع" className="field font-normal" />
    </label>
    <label className="grid gap-2 font-bold">
      الوصف المختصر
      <textarea name="description" defaultValue={project?.description || ""} placeholder="ملخص سريع يوضح فكرة المشروع" rows={3} className="field font-normal" />
    </label>
    <label className="grid gap-2 font-bold">
      تفاصيل الاتفاق ونطاق العمل
      <textarea name="agreementDetails" defaultValue={project?.agreementDetails || ""} placeholder="ما الذي يشمله المشروع وما الذي سيتم تنفيذه؟" rows={5} className="field font-normal" />
    </label>
    <label className="grid gap-2 font-bold">
      الخطة المالية
      <textarea name="financialPlan" defaultValue={project?.financialPlan || ""} placeholder="قيمة الاتفاق، الدفعات، ومواعيدها" rows={4} className="field font-normal" />
    </label>
    <label className="grid gap-2 font-bold">
      العملة
      <select name="currency" defaultValue={project?.currency || "USD"} required className="field font-normal">
        <option value="USD">دولار</option>
        <option value="EUR">يورو</option>
        <option value="SYP">ليرة سورية</option>
        <option value="TRY">ليرة تركية</option>
      </select>
    </label>
    <label className="grid gap-2 font-bold">
      مراحل المشروع
      <textarea name="stages" defaultValue={project?.stages || ""} placeholder={"اكتب كل مرحلة في سطر مستقل\nمثال: التحليل\nالتصميم\nالتنفيذ"} rows={5} className="field font-normal" />
    </label>
  </>;
}

function ProjectDueDateInput({ value }: { value: string | null }) {
  return <NativeDateInput label="موعد التسليم" ariaLabel="موعد التسليم: يوم ثم شهر ثم سنة" value={value?.slice(0, 10) || ""} />;
}

function NativeDateInput({ label, ariaLabel, value = "" }: { label: string; ariaLabel: string; value?: string }) {
  const [dateValue, setDateValue] = useState(value);
  return <label className="grid gap-2 font-bold">
    <span>{label}</span>
    <span className="relative">
      {!dateValue && <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-4 z-10 flex items-center text-sm font-normal text-slate-400">يوم / شهر / سنة</span>}
      <input
        name="dueAt"
        type="date"
        value={dateValue}
        onChange={(event) => setDateValue(event.target.value)}
        aria-label={ariaLabel}
        className={`field w-full font-normal ${dateValue ? "" : "[&::-webkit-datetime-edit]:text-transparent"}`}
      />
    </span>
  </label>;
}

function ProjectLinksFields({ initialLinks = [] }: { initialLinks?: string[] }) {
  const [links, setLinks] = useState(initialLinks.length ? initialLinks : [""]);

  return <fieldset className="grid gap-3 rounded-xl border border-[#D8D2C4] p-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <legend className="font-black">روابط المشروع</legend>
        <p className="mt-1 text-xs text-slate-500">يمكن إضافة أي عدد من روابط الموقع أو Figma أو GitHub أو غيرها.</p>
      </div>
      <button type="button" onClick={() => setLinks((items) => [...items, ""])} className="flex items-center gap-2 rounded-lg border border-[#D8D2C4] px-3 py-2 text-sm font-bold">
        <Plus className="h-4 w-4" />إضافة رابط
      </button>
    </div>
    {links.map((link, index) => (
      <div key={index} className="flex gap-2">
        <input
          name="links"
          type="url"
          value={link}
          onChange={(event) => setLinks((items) => items.map((item, itemIndex) => itemIndex === index ? event.target.value : item))}
          placeholder="https://..."
          className="field min-w-0 flex-1 font-normal"
        />
        <button
          type="button"
          aria-label="حذف الرابط"
          onClick={() => setLinks((items) => items.length === 1 ? [""] : items.filter((_, itemIndex) => itemIndex !== index))}
          className="rounded-xl border border-red-200 px-3 text-red-700"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    ))}
  </fieldset>;
}

function ProjectAttachmentsInput({ files = [] }: { files?: Project["files"] }) {
  const attachments = files.filter((file) => file.kind === "PROJECT_ATTACHMENT");
  const [selectedNames, setSelectedNames] = useState<string[]>([]);

  return <fieldset className="grid gap-3 rounded-xl border border-[#D8D2C4] p-4">
    <div>
      <legend className="font-black">مرفقات المشروع</legend>
      <p className="mt-1 text-xs text-slate-500">يمكن اختيار عدة ملفات. الحد الأقصى 25 ميغابايت لكل ملف.</p>
    </div>
    {!!attachments.length && <div className="flex flex-wrap gap-2">
      {attachments.map((file) => (
        <a key={file.id} href={`/api/client/files/${file.id}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg bg-[#F7F3EB] px-3 py-2 text-sm font-bold text-[#9A7D43]">
          <Paperclip className="h-4 w-4" />{file.name}
        </a>
      ))}
    </div>}
    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-[#B89A5A] bg-[#F7F3EB] p-4 font-bold">
      <Paperclip className="h-5 w-5" />
      <span>اختيار ملفات من الجهاز</span>
      <input
        name="attachments"
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.png,.jpg,.jpeg,.webp,.txt"
        onChange={(event) => setSelectedNames(Array.from(event.target.files || []).map((file) => file.name))}
        className="sr-only"
      />
    </label>
    {!!selectedNames.length && <div className="rounded-lg bg-emerald-50 p-3 text-sm font-bold text-emerald-800">تم اختيار: {selectedNames.join("، ")}</div>}
  </fieldset>;
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
