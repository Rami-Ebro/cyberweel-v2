"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  CheckCircle2,
  Eye,
  EyeOff,
  FolderKanban,
  Home,
  KeyRound,
  Link2,
  LogOut,
  RefreshCw,
  ShieldCheck,
  UserCog,
  UserRound,
  UsersRound,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { formatDate } from "@/lib/date-format";

type PartnerStatus = "PENDING" | "ACTIVE" | "SUSPENDED";
type ReferralStatus = "NEW" | "CONTACTED" | "QUALIFIED" | "CONVERTED" | "REJECTED";
type ApplicationStatus = "PENDING" | "ACCEPTED" | "REJECTED";
type PaymentStatus = "PENDING" | "APPROVED" | "PAID" | "CANCELLED";

type PartnerProject = {
  id: string;
  title: string;
  description: string | null;
  tasks: string[];
  deliverables: string[];
  files: string[];
  updates: string[];
  status: string;
  progress: number;
  feeAmount: string | null;
  feeCurrency: string;
  paymentStatus: PaymentStatus;
  dueAt: string | null;
  createdAt: string;
};

type Partner = {
  id: string;
  status: PartnerStatus;
  createdAt: string;
  user: { name: string | null; email: string };
  assignments: PartnerProject[];
};

type ReferralOwner = { user: { name: string | null; email: string } };
type Referral = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  status: ReferralStatus;
  createdAt: string;
  partner: ReferralOwner | null;
  ambassador: ReferralOwner | null;
};

type Application = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  specialty: string | null;
  market: string | null;
  details: string | null;
  status: ApplicationStatus;
  createdAt: string;
};

type Stats = {
  clients: number;
  projects: number;
  invoices: number;
  referrals: number;
  partners: number;
  ambassadors: number;
};

type Admin = {
  id: string;
  name: string | null;
  email: string;
  createdAt: string;
  isOwner: boolean;
  permissions: string[];
};

type Section = "overview" | "partners" | "projects" | "account";

const partnerLabel: Record<PartnerStatus, string> = {
  ACTIVE: "نشط",
  PENDING: "بانتظار الموافقة",
  SUSPENDED: "معلّق",
};

const referralLabel: Record<ReferralStatus, string> = {
  NEW: "جديد",
  CONTACTED: "تم التواصل",
  QUALIFIED: "مؤهل",
  CONVERTED: "مشروع",
  REJECTED: "غير مناسب",
};

const paymentLabel: Record<PaymentStatus, string> = {
  PENDING: "قيد المراجعة",
  APPROVED: "معتمد",
  PAID: "مدفوع",
  CANCELLED: "ملغى",
};

function referralOwner(item: Referral) {
  const user = item.partner?.user || item.ambassador?.user;
  return user?.name || user?.email || "إحالة مباشرة";
}

function toList(value: FormDataEntryValue | null) {
  return String(value || "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function AdminPartnersPage() {
  const router = useRouter();
  const [section, setSection] = useState<Section>("overview");
  const [partners, setPartners] = useState<Partner[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  async function load() {
    setLoading(true);
    const dashboardPromise = fetch("/api/admin/partners", { cache: "no-store" });
    const accountPromise = fetch("/api/admin/account", { cache: "no-store" });

    try {
      const accountResponse = await accountPromise;
      if (accountResponse.status === 401) {
        router.replace("/login");
        return;
      }

      const account = await accountResponse.json();
      if (accountResponse.ok) {
        setAdmin(account.admin);
        const allowedSections = ["overview", "partners", "projects"].filter(
          (key) => account.admin.isOwner || account.admin.permissions?.includes(key),
        ) as Section[];
        setSection((current) => {
          if (current === "account" || allowedSections.includes(current)) return current;
          return allowedSections[0] || "account";
        });
      } else {
        setMessage(account.error || "تعذر تحميل صلاحيات حساب الإدارة");
      }

      const dashboardResponse = await dashboardPromise;
      if (dashboardResponse.status === 401) {
        router.replace("/login");
        return;
      }

      const dashboard = await dashboardResponse.json();
      if (!dashboardResponse.ok && dashboardResponse.status !== 403) {
        setMessage(dashboard.error || "تعذر تحميل لوحة الإدارة");
      } else {
        setPartners(dashboard.partners || []);
        setApplications(dashboard.applications || []);
        setReferrals(dashboard.referrals || []);
        setStats(dashboard.stats || null);
      }
    } catch {
      setMessage("تعذر الاتصال بخدمات لوحة الإدارة. أعد المحاولة.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function changePartnerStatus(id: string, status: PartnerStatus) {
    setUpdatingId(id);
    const response = await fetch("/api/admin/partners", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status, entity: "partner" }),
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error || "تعذر تحديث حالة الشريك");
    } else {
      setPartners((items) => items.map((item) => (item.id === id ? { ...item, status } : item)));
      setMessage(`تم تحديث حالة الشريك إلى ${partnerLabel[status]}`);
    }
    setUpdatingId(null);
  }

  async function decideApplication(
    id: string,
    status: "ACCEPTED" | "REJECTED",
    notes: string,
    password: string,
  ) {
    setUpdatingId(id);
    setMessage("");
    const response = await fetch("/api/admin/partners", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entity: "application",
        id,
        status,
        notes,
        password,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      const known: Record<string, string> = {
        ALREADY_DECIDED: "سبق اتخاذ قرار بشأن هذا الطلب. حدّث الصفحة.",
        EMAIL_EXISTS: "يوجد حساب مسجل بهذا البريد أو رقم الهاتف.",
      };
      setMessage(known[data.error] || data.error || "تعذر حفظ القرار");
    } else {
      setMessage(status === "ACCEPTED" ? "تم قبول الطلب وإنشاء حساب الشريك." : "تم رفض الطلب.");
      await load();
    }
    setUpdatingId(null);
  }

  async function createProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const partnerId = String(form.get("partnerId") || "");
    if (!partnerId) {
      setMessage("اختر الشريك الذي سيُسند إليه المشروع.");
      return;
    }

    setUpdatingId("new-project");
    setMessage("");
    const response = await fetch("/api/admin/partners", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entity: "project",
        id: partnerId,
        title: form.get("title"),
        description: form.get("description"),
        tasks: toList(form.get("tasks")),
        deliverables: toList(form.get("deliverables")),
        files: toList(form.get("files")),
        updates: toList(form.get("updates")),
        projectStatus: form.get("projectStatus"),
        progress: Number(form.get("progress") || 0),
        feeAmount: form.get("feeAmount"),
        feeCurrency: form.get("feeCurrency"),
        paymentStatus: form.get("paymentStatus"),
        dueAt: form.get("dueAt") || null,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error || "تعذر إنشاء المشروع وإسناده");
    } else {
      formElement.reset();
      setMessage("تم إنشاء المشروع وإسناده إلى الشريك بنجاح.");
      await load();
      setSection("projects");
    }
    setUpdatingId(null);
  }

  async function saveAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const response = await fetch("/api/admin/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        currentPassword: form.get("currentPassword"),
        newPassword: form.get("newPassword"),
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error || "تعذر حفظ الحساب");
      return;
    }
    setAdmin(data.admin);
    setMessage("تم حفظ بيانات حساب الإدارة بنجاح");
    const current = formElement.elements.namedItem("currentPassword") as HTMLInputElement | null;
    const next = formElement.elements.namedItem("newPassword") as HTMLInputElement | null;
    if (current) current.value = "";
    if (next) next.value = "";
    setShowCurrentPassword(false);
    setShowNewPassword(false);
  }

  async function logout() {
    await fetch("/api/partner/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  const latestReferrals = useMemo(() => referrals.slice(0, 8), [referrals]);
  const projects = useMemo(
    () =>
      partners.flatMap((partner) =>
        partner.assignments.map((project) => ({
          ...project,
          partnerId: partner.id,
          partnerName: partner.user.name || partner.user.email,
          partnerEmail: partner.user.email,
        })),
      ),
    [partners],
  );
  const pendingApplications = useMemo(
    () => applications.filter((application) => application.status === "PENDING"),
    [applications],
  );

  const canSeeReferrals = admin?.isOwner || admin?.permissions.includes("referrals");

  if (loading && !admin) {
    return (
      <main
        dir="rtl"
        className="grid min-h-screen place-items-center bg-[#F7F3EB] px-5 text-[#111827]"
      >
        <div className="flex max-w-sm flex-col items-center text-center">
          <span className="grid h-20 w-20 place-items-center rounded-2xl bg-white shadow-sm">
            <Logo size={52} />
          </span>
          <RefreshCw className="mt-7 h-6 w-6 animate-spin text-[#9A7D43]" />
          <h1 className="mt-4 text-2xl font-black">جارٍ تجهيز لوحة الإدارة</h1>
          <p className="mt-2 text-sm font-bold text-slate-500">
            يتم تحميل الحساب والصلاحيات والبيانات…
          </p>
        </div>
      </main>
    );
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[#F7F3EB] text-[#111827]">
      <div className="grid min-h-screen lg:grid-cols-[290px_1fr]">
        <aside className="flex flex-col bg-[#111827] p-5 text-white lg:sticky lg:top-0 lg:h-screen">
          <Link href="/" className="flex items-center gap-3 border-b border-white/10 pb-5">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-white">
              <Logo size={36} />
            </span>
            <div>
              <p className="font-black">CyberWeel</p>
              <p className="text-xs text-white/50">لوحة الإدارة</p>
            </div>
          </Link>

          <nav className="mt-6 grid gap-2">
            {(admin?.isOwner || admin?.permissions.includes("overview")) && (
              <button
                onClick={() => setSection("overview")}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-right font-bold transition ${
                  section === "overview"
                    ? "bg-[#B89A5A] text-[#111827]"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <BarChart3 className="h-5 w-5" />
                نظرة عامة
              </button>
            )}
            {(admin?.isOwner || admin?.permissions.includes("clients")) && (
              <Link href="/admin/clients" className="nav-link">
                <UserRound className="h-5 w-5" />
                العملاء
              </Link>
            )}
            {(admin?.isOwner || admin?.permissions.includes("projects")) && (
              <button
                onClick={() => setSection("projects")}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-right font-bold transition ${
                  section === "projects"
                    ? "bg-[#B89A5A] text-[#111827]"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <FolderKanban className="h-5 w-5" />
                المشاريع
              </button>
            )}
            {(admin?.isOwner || admin?.permissions.includes("invoices")) && (
              <Link
                href="/admin/clients"
                title="تُدار الفواتير من داخل حساب العميل"
                className="nav-link"
              >
                <BarChart3 className="h-5 w-5" />
                الفواتير
              </Link>
            )}
            {canSeeReferrals && (
              <Link href="/admin/referrals" className="nav-link">
                <CheckCircle2 className="h-5 w-5" />
                الإحالات
              </Link>
            )}
            {(admin?.isOwner || admin?.permissions.includes("partners")) && (
              <button
                onClick={() => setSection("partners")}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-right font-bold transition ${
                  section === "partners"
                    ? "bg-[#B89A5A] text-[#111827]"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <UsersRound className="h-5 w-5" />
                الشركاء
              </button>
            )}
            {(admin?.isOwner || admin?.permissions.includes("ambassadors")) && (
              <Link href="/admin/ambassadors" className="nav-link">
                <UsersRound className="h-5 w-5" />
                السفراء
              </Link>
            )}
            <button
              onClick={() => setSection("account")}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-right font-bold transition ${
                section === "account"
                  ? "bg-[#B89A5A] text-[#111827]"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <UserCog className="h-5 w-5" />
              حساب الإدارة
            </button>
            {admin?.isOwner && (
              <Link href="/admin/team" className="nav-link">
                <ShieldCheck className="h-5 w-5" />
                إدارة الفريق والصلاحيات
              </Link>
            )}
            {(admin?.isOwner || admin?.permissions.includes("smart_links")) && (
              <Link href="/admin/smart-links" className="nav-link">
                <Link2 className="h-5 w-5" />
                الروابط الذكية
              </Link>
            )}
          </nav>

          <div className="mt-auto grid gap-2 pt-8">
            <Link
              href="/"
              className="flex items-center gap-3 rounded-xl bg-[#B89A5A] px-4 py-3 font-black text-[#111827]"
            >
              <Home className="h-5 w-5" />
              العودة إلى الموقع
            </Link>
            <button
              onClick={logout}
              className="flex w-full items-center gap-3 rounded-xl border border-white/10 px-4 py-3 font-bold text-white/70 hover:bg-white/10"
            >
              <LogOut className="h-5 w-5" />
              تسجيل الخروج
            </button>
          </div>
        </aside>

        <section className="p-4 sm:p-7 lg:p-10">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold text-[#9A7D43]">مركز التحكم</p>
              <h1 className="mt-1 text-3xl font-black">مرحبًا {admin?.name || "بك"}</h1>
            </div>
            <button
              onClick={load}
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-xl border border-[#D8D2C4] bg-white px-4 py-3 font-bold shadow-sm"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              تحديث البيانات
            </button>
          </header>

          {message && (
            <p className="mt-5 rounded-xl border border-[#D8D2C4] bg-white p-4 font-bold shadow-sm">
              {message}
            </p>
          )}
          {loading && (
            <div className="mt-10 rounded-2xl bg-white p-10 text-center shadow-sm">
              جارٍ تحميل لوحة الإدارة...
            </div>
          )}

          {!loading && section === "overview" && stats && (
            <>
              <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {[
                  {
                    label: "العملاء",
                    value: stats.clients,
                    actionLabel: "فتح إدارة العملاء",
                    action: () => router.push("/admin/clients"),
                  },
                  {
                    label: "المشاريع",
                    value: stats.projects,
                    actionLabel: "فتح إدارة المشاريع",
                    action: () => setSection("projects"),
                  },
                  {
                    label: "الفواتير",
                    value: stats.invoices,
                    actionLabel: "فتح العملاء والفواتير",
                    action: () => router.push("/admin/clients"),
                  },
                  {
                    label: "الإحالات",
                    value: stats.referrals,
                    actionLabel: "فتح إدارة الإحالات",
                    action: () => router.push("/admin/referrals"),
                  },
                  {
                    label: "الشركاء",
                    value: stats.partners,
                    actionLabel: "فتح إدارة الشركاء",
                    action: () => setSection("partners"),
                  },
                  {
                    label: "السفراء",
                    value: stats.ambassadors,
                    actionLabel: "فتح إدارة السفراء",
                    action: () => router.push("/admin/ambassadors"),
                  },
                ].map(({ label, value, actionLabel, action }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={action}
                    className="group w-full cursor-pointer rounded-2xl border border-[#D8D2C4] bg-white p-5 text-right shadow-sm transition duration-200 hover:-translate-y-1 hover:border-[#B89A5A] hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B89A5A] focus-visible:ring-offset-2"
                    aria-label={actionLabel}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-bold text-slate-500 transition group-hover:text-[#9A7D43]">
                          {label}
                        </p>
                        <p className="mt-3 text-4xl font-black">{value}</p>
                      </div>
                      <span className="rounded-full bg-[#F7F3EB] px-3 py-1.5 text-xs font-black text-[#9A7D43] transition group-hover:bg-[#B89A5A] group-hover:text-[#111827]">
                        فتح
                      </span>
                    </div>
                    <p className="mt-4 text-xs font-bold text-slate-400 transition group-hover:text-[#9A7D43]">
                      {actionLabel}
                    </p>
                  </button>
                ))}
              </div>
              <section className="mt-6 rounded-2xl border border-[#D8D2C4] bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-xl font-black">أحدث الإحالات</h2>
                  {canSeeReferrals && (
                    <Link href="/admin/referrals" className="font-black text-[#9A7D43]">
                      فتح إدارة الإحالات
                    </Link>
                  )}
                </div>
                <div className="mt-5 grid gap-3">
                  {latestReferrals.length ? (
                    latestReferrals.map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-col justify-between gap-3 rounded-xl bg-[#F7F3EB] p-4 sm:flex-row sm:items-center"
                      >
                        <div>
                          <p className="font-black">{item.name || "دون اسم"}</p>
                          <p className="text-sm text-slate-500">عن طريق: {referralOwner(item)}</p>
                        </div>
                        <span className="w-fit rounded-full bg-white px-3 py-1 text-xs font-black text-[#9A7D43]">
                          {referralLabel[item.status]}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500">لا توجد إحالات.</p>
                  )}
                </div>
              </section>
            </>
          )}

          {!loading && section === "partners" && (
            <div className="mt-7 grid gap-6">
              <section className="rounded-2xl border border-[#D8D2C4] bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-black">طلبات شريك التنفيذ</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      لا يُنشأ الحساب إلا بعد قبول الطلب وتحديد كلمة مرور مؤقتة.
                    </p>
                  </div>
                  <span className="rounded-xl bg-[#F7F3EB] px-4 py-2 font-bold">
                    {pendingApplications.length} طلب معلق
                  </span>
                </div>
                <div className="mt-6 grid gap-4">
                  {pendingApplications.length ? (
                    pendingApplications.map((application) => (
                      <ApplicationCard
                        key={application.id}
                        application={application}
                        busy={updatingId === application.id}
                        decide={decideApplication}
                      />
                    ))
                  ) : (
                    <p className="rounded-xl bg-[#F7F3EB] p-5 text-slate-500">
                      لا توجد طلبات شراكة معلقة.
                    </p>
                  )}
                </div>
              </section>

              <section className="rounded-2xl border border-[#D8D2C4] bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-black">حسابات الشركاء</h2>
                  <span className="rounded-xl bg-[#F7F3EB] px-4 py-2 font-bold">
                    {partners.length} شريك
                  </span>
                </div>
                <div className="mt-6 grid gap-4">
                  {partners.map((partner) => (
                    <article key={partner.id} className="rounded-2xl border border-[#D8D2C4] p-5">
                      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
                        <div>
                          <h3 className="font-black">{partner.user.name || "دون اسم"}</h3>
                          <p className="mt-1 text-sm text-slate-500">{partner.user.email}</p>
                          <p className="mt-2 text-sm">
                            {partner.assignments.length} مشروع مسند · {partnerLabel[partner.status]}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Link
                            href={`/partner/dashboard?adminPreview=${partner.id}`}
                            className="rounded-lg border border-[#111827] px-4 py-2 text-sm font-black"
                          >
                            معاينة اللوحة
                          </Link>
                          {(["ACTIVE", "PENDING", "SUSPENDED"] as PartnerStatus[]).map((status) => (
                            <button
                              key={status}
                              disabled={updatingId === partner.id || partner.status === status}
                              onClick={() => changePartnerStatus(partner.id, status)}
                              className={`rounded-lg px-4 py-2 text-sm font-black text-white disabled:opacity-40 ${
                                status === "ACTIVE"
                                  ? "bg-emerald-600"
                                  : status === "PENDING"
                                    ? "bg-amber-500"
                                    : "bg-red-600"
                              }`}
                            >
                              {status === "ACTIVE" ? "تفعيل" : status === "PENDING" ? "انتظار" : "تعليق"}
                            </button>
                          ))}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </div>
          )}

          {!loading && section === "projects" && (
            <div className="mt-7 grid gap-6">
              <section className="rounded-2xl border border-[#D8D2C4] bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-black">إنشاء مشروع وإسناده</h2>
                <p className="mt-2 text-sm text-slate-500">
                  سيظهر المشروع داخل لوحة الشريك المحدد فقط، مع المهام والتسليمات والمستحقات.
                </p>
                <form onSubmit={createProject} className="mt-6 grid gap-4 md:grid-cols-2">
                  <Field label="الشريك">
                    <select name="partnerId" required className="field">
                      <option value="">اختر الشريك</option>
                      {partners
                        .filter((partner) => partner.status === "ACTIVE")
                        .map((partner) => (
                          <option key={partner.id} value={partner.id}>
                            {partner.user.name || partner.user.email}
                          </option>
                        ))}
                    </select>
                  </Field>
                  <Field label="اسم المشروع">
                    <input name="title" required className="field" />
                  </Field>
                  <Field label="حالة المشروع">
                    <select name="projectStatus" defaultValue="ASSIGNED" className="field">
                      <option value="ASSIGNED">مسند</option>
                      <option value="IN_PROGRESS">قيد التنفيذ</option>
                      <option value="REVIEW">قيد المراجعة</option>
                      <option value="COMPLETED">مكتمل</option>
                      <option value="ON_HOLD">متوقف مؤقتًا</option>
                    </select>
                  </Field>
                  <Field label="نسبة التقدم">
                    <input name="progress" type="number" min="0" max="100" defaultValue="0" className="field" />
                  </Field>
                  <Field label="موعد التسليم">
                    <input name="dueAt" type="date" className="field" />
                  </Field>
                  <Field label="حالة المستحق">
                    <select name="paymentStatus" defaultValue="PENDING" className="field">
                      {Object.entries(paymentLabel).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="قيمة المستحق">
                    <input name="feeAmount" type="number" min="0" step="0.01" className="field" />
                  </Field>
                  <Field label="العملة">
                    <select name="feeCurrency" defaultValue="USD" className="field">
                      {["USD", "EUR", "SYP", "TRY"].map((currency) => (
                        <option key={currency}>{currency}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="الوصف" wide>
                    <textarea name="description" rows={3} className="field" />
                  </Field>
                  <Field label="المهام — مهمة في كل سطر">
                    <textarea name="tasks" rows={4} className="field" />
                  </Field>
                  <Field label="التسليمات — عنصر في كل سطر">
                    <textarea name="deliverables" rows={4} className="field" />
                  </Field>
                  <Field label="روابط الملفات — رابط في كل سطر">
                    <textarea name="files" rows={4} className="field" />
                  </Field>
                  <Field label="التحديثات الأولية — تحديث في كل سطر">
                    <textarea name="updates" rows={4} className="field" />
                  </Field>
                  <button
                    disabled={updatingId === "new-project"}
                    className="rounded-xl bg-[#111827] px-5 py-3.5 font-black text-white disabled:opacity-50 md:col-span-2"
                  >
                    {updatingId === "new-project" ? "جارٍ الإسناد..." : "إنشاء المشروع وإسناده"}
                  </button>
                </form>
              </section>

              <section className="rounded-2xl border border-[#D8D2C4] bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-black">المشاريع المسندة فعليًا</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      هذه القائمة مصدرها مهام الشركاء، وليست الإحالات المحوّلة.
                    </p>
                  </div>
                  <span className="rounded-xl bg-[#F7F3EB] px-4 py-2 font-bold">
                    {projects.length} مشروع
                  </span>
                </div>
                <div className="mt-6 grid gap-4">
                  {projects.length ? (
                    projects.map((project) => (
                      <article key={project.id} className="rounded-2xl border border-[#D8D2C4] p-5">
                        <div className="flex flex-col justify-between gap-4 lg:flex-row">
                          <div>
                            <h3 className="text-lg font-black">{project.title}</h3>
                            <p className="mt-1 text-sm text-slate-500">
                              الشريك: {project.partnerName} · {project.partnerEmail}
                            </p>
                            {project.description && <p className="mt-3">{project.description}</p>}
                          </div>
                          <div className="grid min-w-64 grid-cols-2 gap-2 text-sm">
                            <ProjectFact label="الحالة" value={project.status} />
                            <ProjectFact label="التقدم" value={`${project.progress}%`} />
                            <ProjectFact
                              label="المستحق"
                              value={
                                project.feeAmount
                                  ? `${project.feeAmount} ${project.feeCurrency}`
                                  : "غير محدد"
                              }
                            />
                            <ProjectFact label="الدفع" value={paymentLabel[project.paymentStatus]} />
                            <ProjectFact
                              label="التسليم"
                              value={project.dueAt ? formatDate(project.dueAt) : "غير محدد"}
                            />
                            <ProjectFact
                              label="المحتوى"
                              value={`${project.tasks.length} مهام · ${project.deliverables.length} تسليمات`}
                            />
                          </div>
                        </div>
                      </article>
                    ))
                  ) : (
                    <p className="rounded-xl bg-[#F7F3EB] p-5 text-slate-500">
                      لا توجد مشاريع مسندة بعد.
                    </p>
                  )}
                </div>
              </section>
            </div>
          )}

          {!loading && section === "account" && (
            <section className="mt-7 max-w-2xl rounded-2xl border border-[#D8D2C4] bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-[#111827] text-white">
                  <ShieldCheck className="h-6 w-6" />
                </span>
                <div>
                  <h2 className="text-2xl font-black">حساب الإدارة</h2>
                  <p className="text-sm text-slate-500">تعديل الاسم والبريد وكلمة المرور</p>
                </div>
              </div>
              <form onSubmit={saveAccount} className="mt-7 grid gap-4">
                <Field label="الاسم">
                  <input name="name" defaultValue={admin?.name || ""} className="field" />
                </Field>
                <Field label="البريد الإلكتروني">
                  <input name="email" type="email" defaultValue={admin?.email || ""} required className="field" />
                </Field>
                <div className="mt-3 flex items-center gap-2 font-black">
                  <KeyRound className="h-5 w-5" />
                  تغيير كلمة المرور
                </div>
                <PasswordField
                  name="currentPassword"
                  label="كلمة المرور الحالية"
                  visible={showCurrentPassword}
                  toggle={() => setShowCurrentPassword((value) => !value)}
                />
                <PasswordField
                  name="newPassword"
                  label="كلمة المرور الجديدة"
                  visible={showNewPassword}
                  toggle={() => setShowNewPassword((value) => !value)}
                  minLength={8}
                />
                <button className="mt-2 rounded-xl bg-[#111827] px-5 py-3.5 font-black text-white">
                  حفظ التعديلات
                </button>
              </form>
            </section>
          )}
        </section>
      </div>
      <style jsx global>{`
        .nav-link {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          border-radius: 0.75rem;
          padding: 0.75rem 1rem;
          font-weight: 700;
          color: rgb(255 255 255 / 0.7);
          transition: 150ms;
        }
        .nav-link:hover {
          background: rgb(255 255 255 / 0.1);
          color: white;
        }
        .field {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid #d8d2c4;
          padding: 0.75rem 1rem;
          background: white;
        }
      `}</style>
    </main>
  );
}

function ApplicationCard({
  application,
  busy,
  decide,
}: {
  application: Application;
  busy: boolean;
  decide: (
    id: string,
    status: "ACCEPTED" | "REJECTED",
    notes: string,
    password: string,
  ) => Promise<void>;
}) {
  const [notes, setNotes] = useState("");
  const [password, setPassword] = useState("");

  return (
    <article className="rounded-2xl border border-[#D8D2C4] p-5">
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div>
          <h3 className="text-lg font-black">{application.name}</h3>
          <p className="mt-1 text-sm text-slate-500">
            {application.email} {application.phone ? `· ${application.phone}` : ""}
          </p>
          <p className="mt-2 text-sm">
            {application.specialty || "التخصص غير محدد"}
            {application.market ? ` · السوق: ${application.market}` : ""}
          </p>
          {application.details && <p className="mt-3 rounded-xl bg-[#F7F3EB] p-4">{application.details}</p>}
          <p className="mt-2 text-xs text-slate-400">تاريخ الطلب: {formatDate(application.createdAt)}</p>
        </div>
        <div className="grid gap-3">
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={2}
            placeholder="ملاحظات القرار"
            className="field"
          />
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            minLength={10}
            placeholder="كلمة مرور مؤقتة (10 أحرف على الأقل)"
            className="field"
          />
          <div className="grid grid-cols-2 gap-2">
            <button
              disabled={busy || password.length < 10 || !notes.trim()}
              onClick={() => decide(application.id, "ACCEPTED", notes, password)}
              className="rounded-xl bg-emerald-600 px-4 py-3 font-black text-white disabled:opacity-40"
            >
              قبول وإنشاء الحساب
            </button>
            <button
              disabled={busy || !notes.trim()}
              onClick={() => decide(application.id, "REJECTED", notes, "")}
              className="rounded-xl bg-red-600 px-4 py-3 font-black text-white disabled:opacity-40"
            >
              رفض الطلب
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function Field({
  label,
  wide,
  children,
}: {
  label: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={`grid gap-2 font-bold ${wide ? "md:col-span-2" : ""}`}>
      {label}
      {children}
    </label>
  );
}

function ProjectFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[#F7F3EB] p-3">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-1 font-black">{value}</p>
    </div>
  );
}

function PasswordField({
  name,
  label,
  visible,
  toggle,
  minLength,
}: {
  name: string;
  label: string;
  visible: boolean;
  toggle: () => void;
  minLength?: number;
}) {
  return (
    <Field label={label}>
      <div className="relative">
        <input
          name={name}
          type={visible ? "text" : "password"}
          minLength={minLength}
          className="field pl-12"
        />
        <button
          type="button"
          onClick={toggle}
          className="absolute left-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-500 hover:bg-[#F7F3EB]"
          aria-label={visible ? `إخفاء ${label}` : `إظهار ${label}`}
        >
          {visible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>
    </Field>
  );
}
