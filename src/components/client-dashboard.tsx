"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, Bell, BriefcaseBusiness, FileText, Home, LogOut, Mail, Pencil, ReceiptText, RefreshCw, Send, UserCog } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { DashboardLanguageButton } from "@/components/dashboard-i18n-provider";
import { DateText } from "@/components/ui/date-text";
import { ClientSubmissionPanel, type ClientSubmissionView } from "@/components/client-submission-panel";
import { ClientExecutionPlan, type ClientProjectStage } from "@/components/client-execution-plan";
import { dashboardErrorMessage, dashboardLabel } from "@/lib/dashboard-labels";

type Section = "overview" | "projects" | "files" | "invoices" | "messages" | "account";
type Client = { id: string; name: string | null; email: string; createdAt: string };
type Project = {
  id: string;
  title: string;
  description: string | null;
  agreementDetails: string | null;
  financialPlan: string | null;
  currency: string;
  stages: string | null;
  links: string[];
  status: string;
  progress: number;
  startsAt: string | null;
  dueAt: string | null;
  updatedAt: string;
  projectStages?: ClientProjectStage[];
};
type FileItem = { id: string; name: string; url: string; kind: string | null; size: number | null; source?: string; storageProvider?: string | null; createdAt: string; projectTitle: string };
type Invoice = { id: string; number: string; type: "STANDARD" | "RETURN"; amount: number; currency: string; status: string; dueAt: string | null; paidAt: string | null; createdAt: string; projectTitle: string };
type Message = { id: string; subject: string | null; body: string; fromAdmin: boolean; readAt: string | null; createdAt: string };
type Notification = { id: string; title: string; body: string | null; section: Section; readAt: string | null; createdAt: string };
type Stats = { projects: number; activeProjects: number; files: number; dueInvoices: number; unreadMessages: number; unreadNotifications: number };

const projectLabel: Record<string, string> = { PLANNING: "التخطيط", IN_PROGRESS: "قيد التنفيذ", REVIEW: "المراجعة", COMPLETED: "مكتمل", ON_HOLD: "متوقف مؤقتًا", CANCELLED: "ملغى" };
const invoiceLabel: Record<string, string> = { DRAFT: "مسودة", DUE: "مستحقة", PAID: "مدفوعة", OVERDUE: "متأخرة", CANCELLED: "ملغاة" };

export function ClientDashboard({
  adminClientId,
  initialNotice = "",
  onManage,
}: {
  adminClientId?: string;
  initialNotice?: string;
  onManage?: (section: "projects" | "files" | "invoices" | "account") => void;
}) {
  const router = useRouter();
  const isAdminMirror = Boolean(adminClientId);
  const [section, setSection] = useState<Section>("overview");
  const [client, setClient] = useState<Client | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [submissions, setSubmissions] = useState<ClientSubmissionView[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(initialNotice);

  async function load(clearNotice = true) {
    setLoading(true);
    if (clearNotice) setNotice("");
    const response = await fetch(isAdminMirror ? `/api/admin/clients/${adminClientId}` : "/api/client/dashboard", { cache: "no-store" });
    if (response.status === 401 || response.status === 403) {
      if (isAdminMirror) {
        const denied = await response.json().catch(() => null);
        setNotice(denied?.error || "لا تملك صلاحية عرض العميل");
        setLoading(false);
      } else {
        router.replace("/login");
      }
      return;
    }
    const data = await response.json();
    if (!response.ok) setNotice(dashboardErrorMessage(data.error, "تعذر تحميل لوحة العميل"));
    else if (isAdminMirror) {
      const adminClient = data.client;
      const adminProjects = adminClient?.clientProjects || [];
      const adminFiles = adminProjects.flatMap((project: Project & { files?: FileItem[] }) =>
        (project.files || []).filter((file) => file.source !== "CLIENT").map((file) => ({
          ...file,
          url: file.storageProvider === "VERCEL_BLOB" ? `/api/client/files/${file.id}` : file.url,
          projectTitle: project.title,
        })),
      );
      const adminSubmissions = adminProjects.flatMap((project: Project & { submissions?: Array<Omit<ClientSubmissionView, "projectTitle">> }) =>
        (project.submissions || []).map((submission) => ({
          ...submission,
          projectTitle: project.title,
          files: submission.files.map((file) => ({ ...file, url: `/api/client/files/${file.id}` })),
        })),
      );
      const adminInvoices = adminProjects.flatMap((project: Project & { invoices?: Invoice[] }) =>
        (project.invoices || []).map((invoice) => ({ ...invoice, projectTitle: project.title })),
      );
      const adminMessages = adminClient?.clientMessages || [];
      const adminNotifications = adminClient?.clientNotifications || [];

      setClient(adminClient ? { id: adminClient.id, name: adminClient.name, email: adminClient.email, createdAt: adminClient.createdAt } : null);
      setProjects(adminProjects);
      setFiles(adminFiles);
      setSubmissions(adminSubmissions);
      setInvoices(adminInvoices);
      setMessages(adminMessages);
      setNotifications(adminNotifications);
      setStats({
        projects: adminProjects.length,
        activeProjects: adminProjects.filter((project: Project) => !["COMPLETED", "ON_HOLD"].includes(project.status)).length,
        files: adminFiles.length,
        dueInvoices: adminInvoices.filter((invoice: Invoice) => ["DUE", "OVERDUE"].includes(invoice.status)).length,
        unreadMessages: adminMessages.filter((message: Message) => message.fromAdmin && !message.readAt).length,
        unreadNotifications: adminNotifications.filter((notification: Notification) => !notification.readAt).length,
      });
    } else {
      setClient(data.client);
      setStats(data.stats);
      setProjects(data.projects || []);
      setFiles(data.files || []);
      setSubmissions(data.submissions || []);
      setInvoices(data.invoices || []);
      setMessages(data.messages || []);
      setNotifications(data.notifications || []);
    }
    setLoading(false);
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [adminClientId]);

  useEffect(() => {
    if (!notificationsOpen) return;

    function closeNotificationsOutside(event: PointerEvent) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    }

    function closeNotificationsWithEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setNotificationsOpen(false);
    }

    document.addEventListener("pointerdown", closeNotificationsOutside);
    document.addEventListener("keydown", closeNotificationsWithEscape);
    return () => {
      document.removeEventListener("pointerdown", closeNotificationsOutside);
      document.removeEventListener("keydown", closeNotificationsWithEscape);
    };
  }, [notificationsOpen]);

  async function logout() {
    await fetch("/api/partner/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  async function sendMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setSendingMessage(true);
    setNotice("");
    try {
      const response = await fetch(isAdminMirror ? `/api/admin/clients/${adminClientId}` : "/api/client/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(isAdminMirror ? { action: "message" } : {}),
          projectId: form.get("projectId"),
          subject: form.get("subject"),
          body: form.get("body"),
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) return setNotice(dashboardErrorMessage(data?.error, "تعذر إرسال الرسالة"));
      formElement.reset();
      await load(false);
      setNotice(isAdminMirror ? "تم إرسال الرسالة إلى العميل وحفظها في السجل" : "تم إرسال رسالتك وحفظها في سجل المشروع");
      setSection("messages");
    } finally {
      setSendingMessage(false);
    }
  }

  async function openNotification(notification: Notification) {
    if (isAdminMirror) return;
    if (!notification.readAt) {
      const readAt = new Date().toISOString();
      setNotifications((items) => items.map((item) => item.id === notification.id ? { ...item, readAt } : item));
      setStats((value) => value ? { ...value, unreadNotifications: Math.max(0, value.unreadNotifications - 1) } : value);

      const response = await fetch("/api/client/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: notification.id }),
      });
      if (!response.ok) {
        setNotifications((items) => items.map((item) => item.id === notification.id ? { ...item, readAt: null } : item));
        setStats((value) => value ? { ...value, unreadNotifications: value.unreadNotifications + 1 } : value);
        return setNotice("تعذر تحديث حالة الإشعار");
      }
    }
    setNotificationsOpen(false);
    setSection(notification.section);
  }

  const nav = [
    ["overview", "نظرة عامة", BarChart3],
    ["projects", "المشاريع", BriefcaseBusiness],
    ["files", "الملفات والتسليمات", FileText],
    ["invoices", "الفواتير", ReceiptText],
    ["messages", "الرسائل والتحديثات", Mail],
    ["account", "الحساب", UserCog],
  ] as const;

  const sectionDescriptions: Record<Section, string> = {
    overview: "ملخص سريع عن مشاريعك وآخر المستجدات.",
    projects: "جميع مشاريعك وحالة التنفيذ ونسبة الإنجاز.",
    files: "هنا ستجد الملفات والتسليمات التي سنسلّمها لك.",
    invoices: "جميع الفواتير الصادرة وحالة كل فاتورة.",
    messages: "جميع رسائلنا وتحديثات المشاريع ستجدها هنا. هذا هو سجل التواصل الرسمي.",
    account: "بيانات حسابك للعرض فقط.",
  };

  return (
    <main dir="rtl" className="min-h-screen bg-[#F7F3EB] text-[#111827]">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="bg-[#111827] p-5 text-white lg:sticky lg:top-0 lg:h-screen">
          <button onClick={() => router.push(isAdminMirror ? "/admin/clients" : "/")} className="flex w-full items-center gap-3 border-b border-white/10 pb-5 text-right">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-white"><Logo size={36} /></span>
            <span><strong className="block">CyberWeel</strong><span className="text-xs text-white/50">بوابة العميل</span></span>
          </button>
          <nav className="mt-6 grid gap-2">
            {nav.map(([key, label, Icon]) => <button key={key} onClick={() => setSection(key)} className={`flex items-center gap-3 rounded-xl px-4 py-3 text-right font-bold transition ${section === key ? "bg-[#B89A5A] text-[#111827]" : "text-white/70 hover:bg-white/10 hover:text-white"}`}><Icon className="h-5 w-5" />{label}</button>)}
          </nav>
          {isAdminMirror ? <>
            <button onClick={() => router.push("/admin/clients")} className="mt-8 flex w-full items-center gap-3 rounded-xl border border-white/10 px-4 py-3 font-bold text-white/70 hover:bg-white/10"><Home className="h-5 w-5" />العودة إلى العملاء</button>
          </> : <>
            <button onClick={() => router.push("/")} className="mt-8 flex w-full items-center gap-3 rounded-xl border border-white/10 px-4 py-3 font-bold text-white/70 hover:bg-white/10"><Home className="h-5 w-5" />العودة إلى الموقع</button>
            <button onClick={logout} className="mt-2 flex w-full items-center gap-3 rounded-xl border border-white/10 px-4 py-3 font-bold text-white/70 hover:bg-white/10"><LogOut className="h-5 w-5" />تسجيل الخروج</button>
          </>}
        </aside>

        <section className="p-4 sm:p-7 lg:p-10">
          <header className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="text-sm font-bold text-[#9A7D43]">مساحة العميل</p><h1 className="mt-1 text-3xl font-black">مرحبًا {client?.name || "بك"}</h1></div>
            <div className="flex flex-wrap gap-3">
              <div ref={notificationsRef} className="static sm:relative">
                <button type="button" aria-expanded={notificationsOpen} aria-haspopup="dialog" aria-controls="client-notifications-popover" onClick={() => setNotificationsOpen((value) => !value)} className="relative flex items-center justify-center gap-2 rounded-xl border border-[#D8D2C4] bg-white px-4 py-3 font-bold shadow-sm">
                  <Bell className="h-5 w-5" />الإشعارات
                  {!!stats?.unreadNotifications && <span className="grid min-w-6 place-items-center rounded-full bg-red-600 px-1.5 py-0.5 text-xs text-white">{stats.unreadNotifications}</span>}
                </button>
                {notificationsOpen && (
                  <div id="client-notifications-popover" role="dialog" aria-label="إشعارات العميل" className="absolute inset-x-0 top-full z-20 mt-3 w-auto rounded-2xl border border-[#D8D2C4] bg-white p-3 shadow-xl sm:inset-x-auto sm:right-0 sm:w-[min(92vw,28rem)]">
                    <div className="flex items-center justify-between px-2 py-2"><strong>الإشعارات</strong><span className="text-xs text-slate-500">{stats?.unreadNotifications || 0} غير مقروء</span></div>
                    <div className="max-h-96 space-y-2 overflow-y-auto">
                      {notifications.map((notification) => (
                        <button key={notification.id} type="button" onClick={() => void openNotification(notification)} disabled={isAdminMirror} className={`w-full rounded-xl p-3 text-right ${notification.readAt ? "bg-slate-50 text-slate-600" : "bg-amber-50 text-[#111827]"} ${isAdminMirror ? "cursor-default" : ""}`}>
                          <div className="flex items-start justify-between gap-3">
                            <span className="flex items-center gap-2">
                              <strong className="text-sm">{notification.title}</strong>
                              {!notification.readAt && <span className="h-2 w-2 shrink-0 rounded-full bg-red-600" />}
                            </span>
                            <time dateTime={notification.createdAt} dir="ltr" className="shrink-0 text-xs text-slate-500">
                              <DateText value={notification.createdAt} />
                            </time>
                          </div>
                          {notification.body && <p className="mt-1 text-xs leading-5 text-slate-500">{notification.body}</p>}
                        </button>
                      ))}
                      {!notifications.length && <p className="p-6 text-center text-sm text-slate-500">لا توجد إشعارات جديدة.</p>}
                    </div>
                  </div>
                )}
              </div>
              <DashboardLanguageButton />
              <button onClick={() => void load()} disabled={loading} className="flex items-center justify-center gap-2 rounded-xl border border-[#D8D2C4] bg-white px-4 py-3 font-bold shadow-sm"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />تحديث البيانات</button>
            </div>
          </header>

          {notice && <p className="mt-5 rounded-xl border border-[#D8D2C4] bg-white p-4 font-bold shadow-sm">{notice}</p>}
          {loading && <div className="mt-10 rounded-2xl bg-white p-10 text-center shadow-sm">جارٍ تحميل لوحة العميل...</div>}

          {!loading && <p className="mt-7 text-sm font-semibold text-slate-500">{sectionDescriptions[section]}</p>}

          {!loading && section === "overview" && stats && <>
            <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                ["المشاريع", projects.length, "projects"],
                ["الفواتير", invoices.length, "invoices"],
                ["الملفات", files.length, "files"],
                ["الإشعارات", stats.unreadNotifications, "notifications"],
              ].map(([label, value, target]) => (
                <button
                  key={String(label)}
                  type="button"
                  onClick={() => target === "notifications" ? setNotificationsOpen(true) : setSection(target as Section)}
                  className="rounded-2xl border border-[#D8D2C4] bg-white p-5 text-right shadow-sm transition hover:-translate-y-1 hover:border-[#B89A5A] hover:shadow-md"
                >
                  <p className="text-sm font-bold text-slate-500">{label}</p>
                  <p className="mt-3 text-4xl font-black">{value}</p>
                  <p className="mt-3 text-xs font-black text-[#9A7D43]">فتح القسم</p>
                </button>
              ))}
            </div>
            <section className="mt-6 rounded-2xl border border-[#D8D2C4] bg-white p-6 shadow-sm"><h2 className="text-xl font-black">آخر تحديثات المشاريع</h2><div className="mt-5 grid gap-3">{projects.slice(0, 4).map((project) => <button key={project.id} onClick={() => setSection("projects")} className="rounded-xl bg-[#F7F3EB] p-4 text-right"><div className="flex items-center justify-between gap-3"><strong>{project.title}</strong><span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#9A7D43]">{projectLabel[project.status] || dashboardLabel(project.status, "حالة غير معروفة")}</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-white"><div className="h-full bg-[#B89A5A]" style={{ width: `${Math.max(0, Math.min(100, project.progress))}%` }} /></div><p className="mt-2 text-xs text-slate-500">نسبة الإنجاز {project.progress}%</p></button>)}{!projects.length && <p className="text-slate-500">لا توجد مشاريع مرتبطة بالحساب بعد.</p>}</div></section>
          </>}

          {!loading && section === "projects" && <section className="mt-7 grid gap-4">
            <div className="flex items-center justify-between gap-3"><h2 className="text-2xl font-black">المشاريع</h2>{isAdminMirror && <EditSectionButton onClick={() => onManage?.("projects")} />}</div>
            {projects.map((project) => (
              <article key={project.id} className="rounded-2xl border border-[#D8D2C4] bg-white p-6 shadow-sm">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div>
                    <h3 className="text-xl font-black">{project.title}</h3>
                    <p className="mt-2 whitespace-pre-wrap leading-7 text-slate-500">{project.description || "لا يوجد وصف مضاف بعد."}</p>
                  </div>
                  <span className="w-fit shrink-0 rounded-full bg-[#F7F3EB] px-4 py-2 text-sm font-black text-[#9A7D43]">{projectLabel[project.status] || dashboardLabel(project.status, "حالة غير معروفة")}</span>
                </div>

                <div className="mt-5 h-3 overflow-hidden rounded-full bg-[#F7F3EB]"><div className="h-full bg-[#B89A5A]" style={{ width: `${Math.max(0, Math.min(100, project.progress))}%` }} /></div>
                <div className="mt-3 flex flex-wrap justify-between gap-3 text-sm text-slate-500">
                  <span>الإنجاز: {project.progress}%</span>
                  <span>آخر تحديث: <DateText value={project.updatedAt} /></span>
                </div>

                <div className="mt-6 grid gap-3 md:grid-cols-2">
                  <ProjectDetail title="تفاصيل الاتفاق ونطاق العمل" value={project.agreementDetails} />
                  <ProjectDetail title={`الخطة المالية — ${project.currency || "USD"}`} value={project.financialPlan} />
                  <ProjectDetail title="مراحل المشروع" value={project.stages} />
                  <ProjectDetail title="موعد التسليم" value={<DateText value={project.dueAt} fallback="لم تُضف معلومات بعد." />} />
                </div>

                <ClientExecutionPlan stages={project.projectStages || []} />

                {!!project.links?.length && (
                  <div className="mt-3 rounded-xl bg-[#F7F3EB] p-4">
                    <p className="text-xs font-black text-slate-500">روابط المشروع</p>
                    <div className="mt-3 grid gap-2">
                      {project.links.map((link) => <a key={link} href={link} target="_blank" rel="noreferrer" dir="ltr" className="w-fit break-all text-left text-sm font-bold text-[#9A7D43] underline">{link}</a>)}
                    </div>
                  </div>
                )}
              </article>
            ))}
            {!projects.length && <Empty text="لا توجد مشاريع حتى الآن." />}
          </section>}

          {!loading && section === "files" && <section className="mt-7 grid gap-7">
            <div>
              <div className="flex items-center justify-between gap-3"><div><h2 className="text-2xl font-black">تسليمات وملفات CyberWeel</h2><p className="mt-1 text-sm text-slate-500">الملفات التي أرسلها لك فريقنا.</p></div>{isAdminMirror && <EditSectionButton onClick={() => onManage?.("files")} />}</div>
              <div className="mt-5 grid gap-3">{files.map((file) => <a key={file.id} href={file.url} target="_blank" rel="noreferrer" className="flex flex-col justify-between gap-3 rounded-2xl border border-[#D8D2C4] bg-white p-5 shadow-sm sm:flex-row sm:items-center"><div><strong>{file.name}</strong><p className="mt-1 text-sm text-slate-500">{file.projectTitle}</p></div><span className="text-sm font-bold text-[#9A7D43]">فتح الملف</span></a>)}{!files.length && <Empty text="لا توجد تسليمات من الفريق بعد." />}</div>
            </div>
            {client && <ClientSubmissionPanel projects={projects.map(({ id, title }) => ({ id, title }))} submissions={submissions} clientId={client.id} canSubmit={!isAdminMirror} onSubmitted={() => load(false)} />}
          </section>}

          {!loading && section === "invoices" && <section className="mt-7">
            <div className="flex items-center justify-between gap-3"><h2 className="text-2xl font-black">الفواتير</h2>{isAdminMirror && <EditSectionButton onClick={() => onManage?.("invoices")} />}</div>
            <div role="region" aria-label="جدول فواتير العميل" tabIndex={0} className="mt-5 overflow-x-auto rounded-2xl border border-[#D8D2C4] bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#B89A5A] focus:ring-inset">
              <table className="w-full min-w-[900px] table-fixed text-right text-xs xl:text-sm">
                <thead><tr className="border-b">
                  <th className="w-[18%] p-3">رقم الفاتورة</th>
                  <th className="w-[14%] p-3">تاريخ الإصدار</th>
                  <th className="w-[16%] p-3">المشروع</th>
                  <th className="w-[14%] p-3">المبلغ</th>
                  <th className="w-[14%] p-3">الحالة</th>
                  <th className="w-[12%] p-3">الاستحقاق</th>
                  <th className="w-[12%] p-3">الدفع</th>
                </tr></thead>
                <tbody>{invoices.map((invoice) => <tr key={invoice.id} className="border-b border-slate-100 align-middle">
                  <td dir="ltr" className="p-3 text-right font-black"><span className="whitespace-nowrap">{invoice.number}</span>{invoice.type === "RETURN" && <span className="mr-2 inline-block rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-black text-rose-700">مرتجع</span>}</td>
                  <td className="p-3 whitespace-nowrap"><DateText value={invoice.createdAt} /></td>
                  <td className="p-3 truncate" title={invoice.projectTitle}>{invoice.projectTitle}</td>
                  <td className="p-3 whitespace-nowrap font-black">{invoice.amount.toLocaleString("ar")} {invoice.currency}</td>
                  <td className="p-3"><span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-black ${invoice.status === "PAID" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>{invoiceLabel[invoice.status] || dashboardLabel(invoice.status, "حالة غير معروفة")}</span></td>
                  <td className="p-3 whitespace-nowrap"><DateText value={invoice.dueAt} /></td>
                  <td className="p-3 whitespace-nowrap"><DateText value={invoice.paidAt} /></td>
                </tr>)}</tbody>
              </table>
              {!invoices.length && <div className="p-8 text-center text-slate-500">لا توجد فواتير بعد.</div>}
            </div>
          </section>}

          {!loading && section === "messages" && <section className="mt-7">
            <h2 className="text-2xl font-black">الرسائل والتحديثات</h2>
            <form onSubmit={sendMessage} className="mt-5 grid gap-4 rounded-2xl border border-[#D8D2C4] bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 font-black"><Send className="h-5 w-5" />{isAdminMirror ? "إرسال رسالة إلى العميل" : "إرسال رسالة"}</div>
              <div className="grid gap-4 md:grid-cols-2">
                <select name="projectId" className="rounded-xl border border-[#D8D2C4] bg-white px-4 py-3">
                  <option value="">رسالة عامة</option>
                  {projects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}
                </select>
                <input name="subject" maxLength={120} placeholder="عنوان الرسالة — اختياري" className="rounded-xl border border-[#D8D2C4] px-4 py-3" />
              </div>
              <textarea name="body" required minLength={2} maxLength={5000} rows={5} placeholder="اكتب رسالتك هنا..." className="rounded-xl border border-[#D8D2C4] px-4 py-3" />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-slate-500">تُحفظ الرسائل كسجل دائم ولا يمكن حذفها أو تعديلها من أي طرف.</p>
                <button disabled={sendingMessage} className="rounded-xl bg-[#111827] px-5 py-3 font-black text-white disabled:opacity-50">{sendingMessage ? "جارٍ الإرسال..." : "إرسال الرسالة"}</button>
              </div>
            </form>
            <div className="mt-5 grid gap-3">{messages.map((message) => <article key={message.id} className="rounded-2xl border border-[#D8D2C4] bg-white p-5 shadow-sm"><div className="flex items-center justify-between gap-3"><strong>{message.subject || (message.fromAdmin ? "تحديث من فريق CyberWeel" : isAdminMirror ? "رسالة العميل" : "رسالتك")}</strong><span className="text-xs text-slate-500"><DateText value={message.createdAt} withTime /></span></div><span className={`mt-2 inline-block rounded-full px-2.5 py-1 text-xs font-bold ${message.fromAdmin ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"}`}>{message.fromAdmin ? (isAdminMirror ? "أنت" : "فريق CyberWeel") : (isAdminMirror ? "العميل" : "أنت")}</span><p className="mt-3 whitespace-pre-wrap leading-7 text-slate-600">{message.body}</p></article>)}{!messages.length && <Empty text="لا توجد رسائل بعد." />}</div>
          </section>}

          {!loading && section === "account" && <section className="mt-7 max-w-2xl rounded-2xl border border-[#D8D2C4] bg-white p-6 shadow-sm"><div className="flex items-center justify-between gap-3"><h2 className="text-2xl font-black">الحساب</h2>{isAdminMirror && <EditSectionButton onClick={() => onManage?.("account")} />}</div><p className="mt-2 text-sm text-slate-500">بيانات حسابك للعرض فقط. لتعديلها تواصل مع فريق CyberWeel.</p><div className="mt-7 grid gap-4"><div className="rounded-xl bg-[#F7F3EB] p-4"><p className="text-xs font-bold text-slate-500">الاسم</p><p className="mt-1 font-black">{client?.name || "—"}</p></div><div className="rounded-xl bg-[#F7F3EB] p-4"><p className="text-xs font-bold text-slate-500">البريد الإلكتروني</p><p dir="ltr" className="mt-1 w-fit font-bold">{client?.email}</p></div></div></section>}
        </section>
      </div>
    </main>
  );
}

function EditSectionButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex items-center gap-2 rounded-lg border border-[#B89A5A] bg-white px-3 py-2 text-sm font-black text-[#9A7D43] shadow-sm hover:bg-[#F7F3EB]">
      <Pencil className="h-4 w-4" />تعديل
    </button>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-[#D8D2C4] bg-white p-10 text-center text-slate-500">{text}</div>;
}

function ProjectDetail({ title, value }: { title: string; value: ReactNode }) {
  return (
    <div className="rounded-xl bg-[#F7F3EB] p-4">
      <p className="text-xs font-black text-slate-500">{title}</p>
      <p className="mt-2 whitespace-pre-wrap leading-7">{value ?? "لم تُضف معلومات بعد."}</p>
    </div>
  );
}
