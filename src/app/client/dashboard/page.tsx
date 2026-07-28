"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, Bell, BriefcaseBusiness, CreditCard, Eye, EyeOff, FileText, Home, KeyRound, LogOut, Mail, ReceiptText, RefreshCw, Send, UserCog } from "lucide-react";
import { Logo } from "@/components/brand/logo";

type Section = "overview" | "projects" | "files" | "invoices" | "payments" | "messages" | "account";
type Client = { id: string; name: string | null; email: string; createdAt: string };
type Project = { id: string; title: string; description: string | null; status: string; progress: number; startsAt: string | null; dueAt: string | null; updatedAt: string };
type FileItem = { id: string; name: string; url: string; kind: string | null; size: number | null; createdAt: string; projectTitle: string };
type Invoice = { id: string; number: string; type: "STANDARD" | "RETURN"; amount: number; currency: string; status: string; dueAt: string | null; paidAt: string | null; projectTitle: string };
type Message = { id: string; subject: string | null; body: string; fromAdmin: boolean; readAt: string | null; createdAt: string };
type Notification = { id: string; title: string; body: string | null; section: Section; readAt: string | null; createdAt: string };
type Stats = { projects: number; activeProjects: number; files: number; dueInvoices: number; unreadMessages: number; unreadNotifications: number };

const projectLabel: Record<string, string> = { PLANNING: "التخطيط", IN_PROGRESS: "قيد التنفيذ", REVIEW: "المراجعة", COMPLETED: "مكتمل", ON_HOLD: "متوقف مؤقتًا" };
const invoiceLabel: Record<string, string> = { DRAFT: "مسودة", DUE: "مستحقة", PAID: "مدفوعة", OVERDUE: "متأخرة", CANCELLED: "ملغاة" };

export default function ClientDashboardPage() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [section, setSection] = useState<Section>("overview");
  const [client, setClient] = useState<Client | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Invoice[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  async function load(clearNotice = true) {
    setLoading(true);
    if (clearNotice) setNotice("");
    const response = await fetch("/api/client/dashboard", { cache: "no-store" });
    if (response.status === 401 || response.status === 403) {
      router.replace("/login");
      return;
    }
    const data = await response.json();
    if (!response.ok) setNotice(data.error || "تعذر تحميل لوحة العميل");
    else {
      setClient(data.client);
      setStats(data.stats);
      setProjects(data.projects || []);
      setFiles(data.files || []);
      setInvoices(data.invoices || []);
      setPayments(data.payments || []);
      setMessages(data.messages || []);
      setNotifications(data.notifications || []);
    }
    setLoading(false);
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, []);

  async function saveAccount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/client/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.get("name"), email: form.get("email"), currentPassword: form.get("currentPassword"), newPassword: form.get("newPassword") }),
    });
    const data = await response.json();
    if (!response.ok) return setNotice(data.error || "تعذر حفظ الحساب");
    setClient(data.client);
    setNotice("تم حفظ بيانات حسابك بنجاح");
    formRef.current?.querySelectorAll<HTMLInputElement>('input[type="password"], input[name="currentPassword"], input[name="newPassword"]').forEach((input) => { input.value = ""; });
    setShowCurrentPassword(false);
    setShowNewPassword(false);
  }

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
      const response = await fetch("/api/client/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: form.get("projectId"),
          subject: form.get("subject"),
          body: form.get("body"),
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) return setNotice(data?.error || "تعذر إرسال الرسالة");
      formElement.reset();
      await load(false);
      setNotice("تم إرسال رسالتك وحفظها في سجل المشروع");
      setSection("messages");
    } finally {
      setSendingMessage(false);
    }
  }

  async function openNotification(notification: Notification) {
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
    setSection(notification.section);
  }

  const nav = [
    ["overview", "نظرة عامة", BarChart3],
    ["projects", "المشاريع", BriefcaseBusiness],
    ["files", "الملفات والتسليمات", FileText],
    ["invoices", "الفواتير", ReceiptText],
    ["payments", "المدفوعات", CreditCard],
    ["messages", "الرسائل والتحديثات", Mail],
    ["account", "الحساب", UserCog],
  ] as const;

  const sectionDescriptions: Record<Section, string> = {
    overview: "ملخص سريع عن مشاريعك وآخر المستجدات.",
    projects: "جميع مشاريعك وحالة التنفيذ ونسبة الإنجاز.",
    files: "هنا ستجد الملفات والتسليمات التي سنسلّمها لك.",
    invoices: "جميع الفواتير الصادرة وحالة كل فاتورة.",
    payments: "المبالغ المدفوعة والمسجلة على فواتيرك.",
    messages: "جميع رسائلنا وتحديثات المشاريع ستجدها هنا. هذا هو سجل التواصل الرسمي.",
    account: "بيانات حسابك وكلمة المرور وإعدادات الدخول.",
  };

  return (
    <main dir="rtl" className="min-h-screen bg-[#F7F3EB] text-[#111827]">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="bg-[#111827] p-5 text-white lg:sticky lg:top-0 lg:h-screen">
          <button onClick={() => router.push("/")} className="flex w-full items-center gap-3 border-b border-white/10 pb-5 text-right">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-white"><Logo size={36} /></span>
            <span><strong className="block">CyberWeel</strong><span className="text-xs text-white/50">بوابة العميل</span></span>
          </button>
          <nav className="mt-6 grid gap-2">
            {nav.map(([key, label, Icon]) => <button key={key} onClick={() => setSection(key)} className={`flex items-center gap-3 rounded-xl px-4 py-3 text-right font-bold transition ${section === key ? "bg-[#B89A5A] text-[#111827]" : "text-white/70 hover:bg-white/10 hover:text-white"}`}><Icon className="h-5 w-5" />{label}</button>)}
          </nav>
          <button onClick={() => router.push("/")} className="mt-8 flex w-full items-center gap-3 rounded-xl border border-white/10 px-4 py-3 font-bold text-white/70 hover:bg-white/10"><Home className="h-5 w-5" />العودة إلى الموقع</button>
          <button onClick={logout} className="mt-2 flex w-full items-center gap-3 rounded-xl border border-white/10 px-4 py-3 font-bold text-white/70 hover:bg-white/10"><LogOut className="h-5 w-5" />تسجيل الخروج</button>
        </aside>

        <section className="p-4 sm:p-7 lg:p-10">
          <header className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="text-sm font-bold text-[#9A7D43]">مساحة العميل</p><h1 className="mt-1 text-3xl font-black">مرحبًا {client?.name || "بك"}</h1></div>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => setNotificationsOpen((value) => !value)} className="relative flex items-center justify-center gap-2 rounded-xl border border-[#D8D2C4] bg-white px-4 py-3 font-bold shadow-sm">
                <Bell className="h-5 w-5" />الإشعارات
                {!!stats?.unreadNotifications && <span className="grid min-w-6 place-items-center rounded-full bg-red-600 px-1.5 py-0.5 text-xs text-white">{stats.unreadNotifications}</span>}
              </button>
              <button onClick={() => void load()} disabled={loading} className="flex items-center justify-center gap-2 rounded-xl border border-[#D8D2C4] bg-white px-4 py-3 font-bold shadow-sm"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />تحديث البيانات</button>
            </div>
            {notificationsOpen && (
              <div className="absolute left-0 top-full z-20 mt-3 w-full max-w-md rounded-2xl border border-[#D8D2C4] bg-white p-3 shadow-xl">
                <div className="flex items-center justify-between px-2 py-2"><strong>الإشعارات</strong><span className="text-xs text-slate-500">{stats?.unreadNotifications || 0} غير مقروء</span></div>
                <div className="max-h-96 space-y-2 overflow-y-auto">
                  {notifications.map((notification) => (
                    <button key={notification.id} onClick={() => void openNotification(notification)} className={`w-full rounded-xl p-3 text-right ${notification.readAt ? "bg-slate-50 text-slate-600" : "bg-amber-50 text-[#111827]"}`}>
                      <div className="flex items-start justify-between gap-3">
                        <span className="flex items-center gap-2">
                          <strong className="text-sm">{notification.title}</strong>
                          {!notification.readAt && <span className="h-2 w-2 shrink-0 rounded-full bg-red-600" />}
                        </span>
                        <time dateTime={notification.createdAt} dir="ltr" className="shrink-0 text-xs text-slate-500">
                          {new Date(notification.createdAt).toLocaleDateString("ar")}
                        </time>
                      </div>
                      {notification.body && <p className="mt-1 text-xs leading-5 text-slate-500">{notification.body}</p>}
                    </button>
                  ))}
                  {!notifications.length && <p className="p-6 text-center text-sm text-slate-500">لا توجد إشعارات جديدة.</p>}
                </div>
              </div>
            )}
          </header>

          {notice && <p className="mt-5 rounded-xl border border-[#D8D2C4] bg-white p-4 font-bold shadow-sm">{notice}</p>}
          {loading && <div className="mt-10 rounded-2xl bg-white p-10 text-center shadow-sm">جارٍ تحميل لوحة العميل...</div>}

          {!loading && <p className="mt-7 text-sm font-semibold text-slate-500">{sectionDescriptions[section]}</p>}

          {!loading && section === "overview" && stats && <>
            <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {[["المشاريع", stats.projects], ["المشاريع النشطة", stats.activeProjects], ["الملفات", stats.files], ["الفواتير المستحقة", stats.dueInvoices], ["الرسائل الجديدة", stats.unreadMessages]].map(([label, value]) => <article key={String(label)} className="rounded-2xl border border-[#D8D2C4] bg-white p-5 shadow-sm"><p className="text-sm font-bold text-slate-500">{label}</p><p className="mt-3 text-4xl font-black">{value}</p></article>)}
            </div>
            <section className="mt-6 rounded-2xl border border-[#D8D2C4] bg-white p-6 shadow-sm"><h2 className="text-xl font-black">آخر تحديثات المشاريع</h2><div className="mt-5 grid gap-3">{projects.slice(0, 4).map((project) => <button key={project.id} onClick={() => setSection("projects")} className="rounded-xl bg-[#F7F3EB] p-4 text-right"><div className="flex items-center justify-between gap-3"><strong>{project.title}</strong><span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#9A7D43]">{projectLabel[project.status] || project.status}</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-white"><div className="h-full bg-[#B89A5A]" style={{ width: `${Math.max(0, Math.min(100, project.progress))}%` }} /></div><p className="mt-2 text-xs text-slate-500">نسبة الإنجاز {project.progress}%</p></button>)}{!projects.length && <p className="text-slate-500">لا توجد مشاريع مرتبطة بالحساب بعد.</p>}</div></section>
          </>}

          {!loading && section === "projects" && <section className="mt-7 grid gap-4"><h2 className="text-2xl font-black">المشاريع</h2>{projects.map((project) => <article key={project.id} className="rounded-2xl border border-[#D8D2C4] bg-white p-6 shadow-sm"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h3 className="text-xl font-black">{project.title}</h3><p className="mt-2 text-slate-500">{project.description || "لا يوجد وصف مضاف بعد."}</p></div><span className="w-fit rounded-full bg-[#F7F3EB] px-4 py-2 text-sm font-black text-[#9A7D43]">{projectLabel[project.status] || project.status}</span></div><div className="mt-5 h-3 overflow-hidden rounded-full bg-[#F7F3EB]"><div className="h-full bg-[#B89A5A]" style={{ width: `${Math.max(0, Math.min(100, project.progress))}%` }} /></div><div className="mt-3 flex flex-wrap justify-between gap-3 text-sm text-slate-500"><span>الإنجاز: {project.progress}%</span><span>آخر تحديث: {new Date(project.updatedAt).toLocaleDateString("ar")}</span></div></article>)}{!projects.length && <Empty text="لا توجد مشاريع حتى الآن." />}</section>}

          {!loading && section === "files" && <section className="mt-7"><h2 className="text-2xl font-black">الملفات والتسليمات</h2><div className="mt-5 grid gap-3">{files.map((file) => <a key={file.id} href={file.url} target="_blank" rel="noreferrer" className="flex flex-col justify-between gap-3 rounded-2xl border border-[#D8D2C4] bg-white p-5 shadow-sm sm:flex-row sm:items-center"><div><strong>{file.name}</strong><p className="mt-1 text-sm text-slate-500">{file.projectTitle}</p></div><span className="text-sm font-bold text-[#9A7D43]">فتح الملف</span></a>)}{!files.length && <Empty text="لا توجد ملفات أو تسليمات بعد." />}</div></section>}

          {!loading && section === "invoices" && <section className="mt-7"><h2 className="text-2xl font-black">الفواتير</h2><div className="mt-5 overflow-x-auto rounded-2xl border border-[#D8D2C4] bg-white shadow-sm"><table className="w-full min-w-[820px] text-right text-sm"><thead><tr className="border-b"><th className="p-4">رقم الفاتورة</th><th className="p-4">النوع</th><th className="p-4">المشروع</th><th className="p-4">المبلغ</th><th className="p-4">الحالة</th><th className="p-4">الاستحقاق</th></tr></thead><tbody>{invoices.map((invoice) => <tr key={invoice.id} className="border-b border-slate-100"><td className="p-4 font-bold">{invoice.number}</td><td className="p-4">{invoice.type === "RETURN" ? "مرتجع" : "فاتورة"}</td><td className="p-4">{invoice.projectTitle}</td><td className="p-4">{invoice.amount.toLocaleString("ar")} {invoice.currency}</td><td className="p-4">{invoiceLabel[invoice.status] || invoice.status}</td><td className="p-4">{invoice.dueAt ? new Date(invoice.dueAt).toLocaleDateString("ar") : "—"}</td></tr>)}</tbody></table>{!invoices.length && <div className="p-8 text-center text-slate-500">لا توجد فواتير بعد.</div>}</div></section>}

          {!loading && section === "payments" && <section className="mt-7"><h2 className="text-2xl font-black">المدفوعات</h2><div className="mt-5 overflow-x-auto rounded-2xl border border-[#D8D2C4] bg-white shadow-sm"><table className="w-full min-w-[640px] text-right text-sm"><thead><tr className="border-b"><th className="p-4">الفاتورة</th><th className="p-4">المشروع</th><th className="p-4">المبلغ المدفوع</th><th className="p-4">تاريخ الدفع</th></tr></thead><tbody>{payments.map((payment) => <tr key={payment.id} className="border-b border-slate-100"><td className="p-4 font-bold">{payment.number}</td><td className="p-4">{payment.projectTitle}</td><td className="p-4">{payment.amount.toLocaleString("ar")} {payment.currency}</td><td className="p-4">{payment.paidAt ? new Date(payment.paidAt).toLocaleDateString("ar") : "مسجلة كمدفوعة"}</td></tr>)}</tbody></table>{!payments.length && <div className="p-8 text-center text-slate-500">لا توجد مدفوعات مسجلة بعد.</div>}</div></section>}

          {!loading && section === "messages" && <section className="mt-7">
            <h2 className="text-2xl font-black">الرسائل والتحديثات</h2>
            <form onSubmit={sendMessage} className="mt-5 grid gap-4 rounded-2xl border border-[#D8D2C4] bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 font-black"><Send className="h-5 w-5" />إرسال رسالة</div>
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
            <div className="mt-5 grid gap-3">{messages.map((message) => <article key={message.id} className="rounded-2xl border border-[#D8D2C4] bg-white p-5 shadow-sm"><div className="flex items-center justify-between gap-3"><strong>{message.subject || (message.fromAdmin ? "تحديث من فريق CyberWeel" : "رسالتك")}</strong><span className="text-xs text-slate-500">{new Date(message.createdAt).toLocaleString("ar")}</span></div><span className={`mt-2 inline-block rounded-full px-2.5 py-1 text-xs font-bold ${message.fromAdmin ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"}`}>{message.fromAdmin ? "فريق CyberWeel" : "أنت"}</span><p className="mt-3 whitespace-pre-wrap leading-7 text-slate-600">{message.body}</p></article>)}{!messages.length && <Empty text="لا توجد رسائل بعد." />}</div>
          </section>}

          {!loading && section === "account" && <section className="mt-7 max-w-2xl rounded-2xl border border-[#D8D2C4] bg-white p-6 shadow-sm"><h2 className="text-2xl font-black">الحساب</h2><p className="mt-2 text-sm text-slate-500">تعديل بيانات الحساب وكلمة المرور.</p><form ref={formRef} onSubmit={saveAccount} className="mt-7 grid gap-4"><label className="grid gap-2 font-bold">الاسم<input name="name" defaultValue={client?.name || ""} className="rounded-xl border border-[#D8D2C4] px-4 py-3" /></label><label className="grid gap-2 font-bold">البريد الإلكتروني<input name="email" type="email" defaultValue={client?.email || ""} required className="rounded-xl border border-[#D8D2C4] px-4 py-3" /></label><div className="mt-3 flex items-center gap-2 font-black"><KeyRound className="h-5 w-5" />تغيير كلمة المرور</div><PasswordField label="كلمة المرور الحالية" name="currentPassword" visible={showCurrentPassword} onToggle={() => setShowCurrentPassword((value) => !value)} /><PasswordField label="كلمة المرور الجديدة" name="newPassword" visible={showNewPassword} onToggle={() => setShowNewPassword((value) => !value)} minLength={8} /><button className="mt-2 rounded-xl bg-[#111827] px-5 py-3.5 font-black text-white">حفظ التعديلات</button></form></section>}
        </section>
      </div>
    </main>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-[#D8D2C4] bg-white p-10 text-center text-slate-500">{text}</div>;
}

function PasswordField({ label, name, visible, onToggle, minLength }: { label: string; name: string; visible: boolean; onToggle: () => void; minLength?: number }) {
  return <label className="grid gap-2 font-bold">{label}<div className="relative"><input name={name} type={visible ? "text" : "password"} minLength={minLength} className="w-full rounded-xl border border-[#D8D2C4] px-4 py-3 pl-12" /><button type="button" onClick={onToggle} className="absolute left-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-500 hover:bg-[#F7F3EB]" aria-label={visible ? `إخفاء ${label}` : `إظهار ${label}`}>{visible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button></div></label>;
}
