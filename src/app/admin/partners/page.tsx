"use client";

import Link from "next/link";
import { FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Eye,
  EyeOff,
  FolderKanban,
  Home,
  KeyRound,
  Link2,
  LogOut,
  Pencil,
  RefreshCw,
  ShieldCheck,
  UserCog,
  UserRound,
  UsersRound,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { AdminNotificationCenter } from "@/components/admin/admin-notification-center";
import { DateText } from "@/components/ui/date-text";
import { DateInput } from "@/components/ui/date-input";

type PartnerStatus = "PENDING" | "ACTIVE" | "SUSPENDED";
type ReferralStatus = "NEW" | "CONTACTED" | "INTERESTED" | "AWAITING_RESPONSE" | "NOT_INTERESTED" | "CONVERTED";
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

type ProjectPartner = {
  assignmentId: string;
  id: string;
  name: string;
  email: string;
  feeAmount: string | null;
  feeCurrency: string;
  paymentStatus: PaymentStatus;
};

type ProjectListItem = Omit<PartnerProject, "files" | "updates"> & {
  agreementDetails: string | null;
  financialPlan: string | null;
  stages: string | null;
  links: string[];
  notes: string | null;
  clientStatus: "PLANNING" | "IN_PROGRESS" | "REVIEW" | "COMPLETED" | "ON_HOLD" | "CANCELLED";
  projectCurrency: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  partnerIds: string[];
  partners: ProjectPartner[];
};

type Partner = {
  id: string;
  applicationId: string | null;
  status: PartnerStatus;
  profileCompletedAt: string | null;
  specialty: string | null;
  partnerType: string | null;
  createdAt: string;
  user: { name: string | null; email: string; phone: string | null; isActive: boolean };
  assignments: PartnerProject[];
};

type ReferralOwner = { user: { name: string | null; email: string } };
type Client = { id: string; name: string | null; email: string; company: string | null };
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
  age: number | null;
  educationLevel: string | null;
  educationSpecialty: string | null;
  specialty: string | null;
  market: string | null;
  details: string | null;
  status: ApplicationStatus;
  reviewState: string;
  decisionNotes: string | null;
  decidedAt: string | null;
  decidedBy: { name: string | null; email: string } | null;
  createdAt: string;
  countryRegion: string | null;
  partnerType: string | null;
  workAreas: string[];
  supportServices: string[];
  experienceLevel: string | null;
  experienceYears: number | null;
  availabilityType: string | null;
  weeklyHours: number | null;
  cooperationTypes: string[];
  paymentMethods: string[];
  otherPaymentMethod: string | null;
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
  phone: string | null;
  createdAt: string;
  isOwner: boolean;
  permissions: string[];
};

type Section = "overview" | "partners" | "projects" | "account";
type DecisionResult = { ok: boolean; message: string };

function partnerOperationalStatus(partner: Partner) {
  if (partner.status === "SUSPENDED" || !partner.user.isActive) return { label: "موقوف", className: "bg-rose-100 text-rose-800" };
  if (partner.status === "PENDING") return { label: "قيد المراجعة", className: "bg-amber-100 text-amber-800" };
  if (!partner.profileCompletedAt) return { label: "غير مكتمل البيانات", className: "bg-sky-100 text-sky-800" };
  return { label: "فعال", className: "bg-emerald-100 text-emerald-800" };
}

const referralLabel: Record<ReferralStatus, string> = {
  NEW: "جديد",
  CONTACTED: "تم التواصل",
  INTERESTED: "مهتم",
  AWAITING_RESPONSE: "بانتظار الرد",
  NOT_INTERESTED: "غير مهتم",
  CONVERTED: "تحول إلى عميل",
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
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  function selectSection(nextSection: Section) {
    setSection(nextSection);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("section", nextSection);
      window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
    }
  }

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
          const requested = typeof window === "undefined" ? null : (new URLSearchParams(window.location.search).get("section") as Section | null);
          if (requested === "account" || (requested && allowedSections.includes(requested))) return requested;
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
        setClients(dashboard.clients || []);
        setProjects(dashboard.projects || []);
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
    void Promise.resolve().then(() => load());
  }, []);

  async function decideApplication(
    id: string,
    status: "ACCEPTED" | "REJECTED",
    notes: string,
    password: string,
  ): Promise<DecisionResult> {
    setUpdatingId(id);
    setMessage("");
    try {
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
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const known: Record<string, string> = {
          ALREADY_DECIDED: "سبق اتخاذ قرار بشأن هذا الطلب. حدّث الصفحة.",
          EMAIL_EXISTS: "يوجد حساب مسجل بهذا البريد الإلكتروني، لذلك لم يُنشأ حساب مكرر.",
          PHONE_EXISTS: "يوجد حساب مسجل برقم الهاتف، لذلك لم يُنشأ حساب مكرر.",
        };
        const errorMessage = known[data.error] || data.error || "تعذر حفظ القرار. حاول مرة أخرى.";
        setMessage(errorMessage);
        return { ok: false, message: errorMessage };
      }

      const successMessage = status === "ACCEPTED"
        ? data.invitationSent === false
          ? "تم إنشاء حساب الشريك، لكن تعذر إرسال دعوة الدخول. يمكنك إرسالها لاحقًا."
          : "تم قبول الطلب وإنشاء حساب الشريك بنجاح."
        : "تم رفض الطلب وتسجيل القرار.";
      setMessage(successMessage);
      await load();
      window.dispatchEvent(new Event("admin-notifications-refresh"));
      return { ok: true, message: successMessage };
    } catch {
      const errorMessage = "تعذر الاتصال بالخادم. لم يُحفظ القرار، حاول مرة أخرى.";
      setMessage(errorMessage);
      return { ok: false, message: errorMessage };
    } finally {
      setUpdatingId(null);
    }
  }

  async function updateApplicationReview(id: string, reviewState: "NEW" | "IN_REVIEW" | "NEEDS_INFO") {
    setUpdatingId(id);
    setMessage("");
    try {
      const response = await fetch("/api/admin/partners", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entity: "application_review", id, reviewState }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(data?.error || "تعذر تحديث حالة مراجعة الطلب");
        return false;
      }
      setApplications((items) => items.map((item) => item.id === id ? { ...item, reviewState } : item));
      setMessage(reviewState === "IN_REVIEW" ? "تم نقل الطلب إلى قيد المراجعة" : reviewState === "NEEDS_INFO" ? "تم تعليم الطلب بأنه يحتاج معلومات إضافية" : "تمت إعادة الطلب إلى حالة جديد");
      return true;
    } catch {
      setMessage("تعذر الاتصال بالخادم. لم تتغير حالة الطلب.");
      return false;
    } finally {
      setUpdatingId(null);
    }
  }

  async function createProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const partnerIds = form.getAll("partnerIds").map(String).filter(Boolean);
    const clientId = String(form.get("clientId") || "");
    if (!clientId) {
      setMessage("اختر العميل صاحب المشروع.");
      return;
    }

    setUpdatingId("new-project");
    setMessage("");
    const response = await fetch("/api/admin/partners", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entity: "project",
        clientId,
        partnerIds,
        title: form.get("title"),
        description: form.get("description"),
        agreementDetails: form.get("agreementDetails"),
        financialPlan: form.get("financialPlan"),
        stages: form.get("stages"),
        links: toList(form.get("links")),
        notes: form.get("notes"),
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
      setMessage(
        data.assignments?.length
          ? `تم إنشاء مشروع العميل وإسناده إلى ${data.assignments.length} شريك بنجاح.`
          : "تم إنشاء مشروع العميل بنجاح دون إسناده إلى شريك.",
      );
      await load();
      selectSection("projects");
    }
    setUpdatingId(null);
  }

  async function updateProject(event: FormEvent<HTMLFormElement>, projectId: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setUpdatingId(projectId);
    setMessage("");
    try {
      const response = await fetch("/api/admin/partners", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity: "project_update",
          id: projectId,
          projectId,
          title: form.get("title"),
          description: form.get("description"),
          agreementDetails: form.get("agreementDetails"),
          financialPlan: form.get("financialPlan"),
          currency: form.get("currency"),
          stages: form.get("stages"),
          links: toList(form.get("links")),
          notes: form.get("notes"),
          partnerIds: form.getAll("partnerIds").map(String).filter(Boolean),
          projectStatus: form.get("projectStatus"),
          progress: Number(form.get("progress")),
          dueAt: form.get("dueAt") || null,
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(data?.error || "تعذر تحديث المشروع");
        return;
      }
      setMessage("تم تحديث المشروع وإشعار العميل بنجاح.");
      await load();
      selectSection("projects");
    } catch {
      setMessage("تعذر الاتصال بالخادم. لم يُحفظ التعديل.");
    } finally {
      setUpdatingId(null);
    }
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
        phone: form.get("phone"),
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
  const pendingApplications = useMemo(
    () => applications.filter((application) => application.status === "PENDING"),
    [applications],
  );
  const decidedApplications = useMemo(() => applications.filter((application) => application.status !== "PENDING"), [applications]);

  const canSeeReferrals = admin?.isOwner || admin?.permissions.includes("referrals");

  if (loading && !admin) {
    return (
      <main
        dir="rtl"
        className="grid min-h-screen place-items-center bg-[#F7F3EB] px-5 text-[#111827]"
      >
        <div
          role="status"
          aria-live="polite"
          className="flex max-w-sm flex-col items-center text-center"
        >
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
                onClick={() => selectSection("overview")}
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
                onClick={() => selectSection("projects")}
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
              <Link href="/admin/invoices" className="nav-link">
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
                onClick={() => selectSection("partners")}
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
              onClick={() => selectSection("account")}
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
            <div className="flex items-center gap-2">
              <AdminNotificationCenter />
              <button
                onClick={load}
                disabled={loading}
                className="flex items-center justify-center gap-2 rounded-xl border border-[#D8D2C4] bg-white px-4 py-3 font-bold shadow-sm"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                تحديث البيانات
              </button>
            </div>
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
                    action: () => selectSection("projects"),
                  },
                  {
                    label: "الفواتير",
                    value: stats.invoices,
                    actionLabel: "فتح إدارة الفواتير",
                    action: () => router.push("/admin/invoices"),
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
                    action: () => selectSection("partners"),
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
                        updateReview={updateApplicationReview}
                      />
                    ))
                  ) : (
                    <p className="rounded-xl bg-[#F7F3EB] p-5 text-slate-500">
                      لا توجد طلبات شراكة معلقة.
                    </p>
                  )}
                </div>
              </section>

              {!!decidedApplications.length && (
                <details className="rounded-2xl border border-[#D8D2C4] bg-white shadow-sm">
                  <summary className="cursor-pointer list-none p-6 text-xl font-black">
                    سجل قرارات طلبات الشركاء ({decidedApplications.length})
                    <span className="mr-2 text-sm font-normal text-slate-500">مقبولة ومرفوضة — سجل تاريخي</span>
                  </summary>
                  <div className="grid gap-3 border-t border-[#E6E0D4] p-6">
                    {decidedApplications.map((application) => (
                      <div key={application.id} className="flex flex-wrap items-start justify-between gap-4 rounded-xl bg-[#F7F3EB] p-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <strong>{application.name}</strong>
                            <span className={`rounded-full px-3 py-1 text-xs font-bold ${application.status === "ACCEPTED" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
                              {application.status === "ACCEPTED" ? "مقبول — تم إنشاء الحساب" : "مرفوض — لم يُنشأ حساب"}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-slate-500">{application.email}</p>
                          {application.decisionNotes && <p className="mt-2 text-sm">ملاحظات الإدارة: {application.decisionNotes}</p>}
                        </div>
                        <div className="grid justify-items-end gap-2">
                          <p className="text-xs text-slate-500">
                            {application.decidedBy ? `${application.decidedBy.name || application.decidedBy.email} · ` : ""}
                            <DateText value={application.decidedAt} fallback="" />
                          </p>
                          {partners.find((partner) => partner.applicationId === application.id) && (
                            <Link href={`/admin/partners/${partners.find((partner) => partner.applicationId === application.id)!.id}`} className="inline-flex items-center gap-2 rounded-lg border border-[#111827] bg-white px-3 py-2 text-xs font-black">
                              فتح ملف الشريك <ArrowLeft className="h-4 w-4" />
                            </Link>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              )}

              <section className="overflow-hidden rounded-2xl border border-[#D8D2C4] bg-white shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 p-6">
                  <div>
                    <h2 className="text-2xl font-black">قائمة الشركاء</h2>
                    <p className="mt-1 text-sm text-slate-500">افتح ملف الشريك لإدارة بياناته وحالته والمشاريع المسندة إليه.</p>
                  </div>
                  <span className="rounded-xl bg-[#F7F3EB] px-4 py-2 font-bold">{partners.length} شريك</span>
                </div>
                {partners.length ? (
                  <div className="overflow-x-auto border-t border-[#E6E0D4]">
                    <table className="w-full min-w-[980px] text-right">
                      <thead className="bg-[#F7F3EB] text-sm text-slate-500">
                        <tr>
                          <th className="px-5 py-4">اسم الشريك</th>
                          <th className="px-5 py-4">البريد الإلكتروني</th>
                          <th className="px-5 py-4">رقم التواصل</th>
                          <th className="px-5 py-4">نوع الشريك</th>
                          <th className="px-5 py-4">تاريخ التسجيل</th>
                          <th className="px-5 py-4">الحالة</th>
                          <th className="px-5 py-4">المشاريع</th>
                        </tr>
                      </thead>
                      <tbody>
                        {partners.map((partner) => {
                          const operationalStatus = partnerOperationalStatus(partner);
                          return (
                            <tr key={partner.id} className="border-t border-[#E6E0D4] transition hover:bg-[#FCFAF6]">
                              <td className="px-5 py-4">
                                <Link href={`/admin/partners/${partner.id}`} className="inline-flex items-center gap-2 font-black text-[#8A6E38] hover:underline">
                                  {partner.user.name || "دون اسم"}<ArrowLeft className="h-4 w-4" />
                                </Link>
                              </td>
                              <td className="px-5 py-4 text-sm" dir="ltr">{partner.user.email}</td>
                              <td className="px-5 py-4 text-sm" dir="ltr">{partner.user.phone || "غير محدد"}</td>
                              <td className="px-5 py-4 text-sm">{partner.partnerType || "شريك تنفيذ"}</td>
                              <td className="px-5 py-4 text-sm"><DateText value={partner.createdAt} /></td>
                              <td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-black ${operationalStatus.className}`}>{operationalStatus.label}</span></td>
                              <td className="px-5 py-4 text-sm font-bold">{partner.assignments.length}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : <p className="border-t border-[#E6E0D4] p-8 text-center text-slate-500">لا توجد حسابات شركاء حالية.</p>}
              </section>
            </div>
          )}

          {!loading && section === "projects" && (
            <div className="mt-7 grid gap-6">
              <details className="group rounded-2xl border border-[#D8D2C4] bg-white shadow-sm">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-6">
                  <div>
                    <h2 className="text-2xl font-black">إنشاء مشروع عميل</h2>
                    <p className="mt-2 text-sm text-slate-500">
                      اختر العميل أولًا، ثم اختر شريكًا واحدًا أو عدة شركاء، أو اترك المشروع دون إسناد مؤقتًا.
                    </p>
                  </div>
                  <span className="flex shrink-0 items-center gap-2 rounded-xl bg-[#F7F3EB] px-4 py-2 text-sm font-black text-[#9A7D43]">
                    فتح النموذج
                    <ChevronDown className="h-5 w-5 transition group-open:rotate-180" />
                  </span>
                </summary>
                <form onSubmit={createProject} className="grid gap-4 border-t border-[#E6E0D4] p-6 md:grid-cols-2">
                  <Field label="العميل">
                    <select name="clientId" required className="field">
                      <option value="">اختر العميل</option>
                      {clients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.name || client.email}{client.company ? ` — ${client.company}` : ""}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <PartnerMultiSelect partners={partners} />
                  <Field label="اسم المشروع">
                    <input name="title" required className="field" />
                  </Field>
                  <Field label="حالة المشروع">
                    <select name="projectStatus" defaultValue="PLANNING" className="field">
                      <option value="PLANNING">تخطيط</option>
                      <option value="ASSIGNED">مسند</option>
                      <option value="IN_PROGRESS">قيد التنفيذ</option>
                      <option value="REVIEW">قيد المراجعة</option>
                      <option value="COMPLETED">مكتمل</option>
                      <option value="ON_HOLD">متوقف مؤقتًا</option>
                      <option value="CANCELLED">ملغى</option>
                    </select>
                  </Field>
                  <Field label="نسبة التقدم">
                    <input name="progress" type="number" min="0" max="100" defaultValue="0" className="field" />
                  </Field>
                  <Field label="موعد التسليم">
                    <DateInput name="dueAt" className="field" />
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
                  <div className="rounded-xl bg-[#F7F3EB] p-4 md:col-span-2">
                    <p className="font-black">المعلومات الظاهرة للعميل</p>
                    <p className="mt-1 text-sm text-slate-500">تظهر هذه التفاصيل مباشرة داخل قسم المشاريع في حساب العميل.</p>
                  </div>
                  <Field label="تفاصيل الاتفاق ونطاق العمل" wide>
                    <textarea name="agreementDetails" rows={5} className="field" />
                  </Field>
                  <Field label="الخطة المالية" wide>
                    <textarea name="financialPlan" rows={4} className="field" />
                  </Field>
                  <Field label="مراحل المشروع" wide>
                    <textarea name="stages" rows={5} placeholder="اكتب كل مرحلة في سطر مستقل" className="field" />
                  </Field>
                  <Field label="روابط المشروع للعميل — رابط في كل سطر" wide>
                    <textarea name="links" rows={4} className="field" />
                  </Field>
                  <Field label="ملاحظات داخلية — لا تظهر للعميل" wide>
                    <textarea name="notes" rows={3} className="field" />
                  </Field>
                  <div className="rounded-xl bg-[#F7F3EB] p-4 md:col-span-2">
                    <p className="font-black">بيانات شركاء التنفيذ</p>
                    <p className="mt-1 text-sm text-slate-500">عند اختيار عدة شركاء تُنشأ لكل شريك نسخة مستقلة من المهام والتسليمات والمستحق الأولي.</p>
                  </div>
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
                    {updatingId === "new-project" ? "جارٍ الإنشاء..." : "إنشاء مشروع العميل"}
                  </button>
                </form>
              </details>

              <section className="rounded-2xl border border-[#D8D2C4] bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-black">جميع مشاريع العملاء</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      تشمل المشاريع المسندة لشريك والمشاريع التي لم تُسند بعد.
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
                              العميل: {project.clientName} · {project.clientEmail}
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              {project.partners.length
                                ? <>الشركاء: {project.partners.map((partner) => partner.name).join("، ")}</>
                                : "الشركاء: غير مسند"}
                            </p>
                            {project.description && <p className="mt-3">{project.description}</p>}
                            <details className="mt-4 rounded-xl border border-[#D8D2C4] bg-[#F7F3EB] open:p-4">
                              <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg px-4 py-2 text-sm font-black text-[#9A7D43]">
                                <Pencil className="h-4 w-4" />
                                تعديل المشروع هنا
                              </summary>
                              <form onSubmit={(event) => updateProject(event, project.id)} className="mt-4 grid gap-4 md:grid-cols-2">
                                <Field label="العميل">
                                  <input value={`${project.clientName} — ${project.clientEmail}`} disabled className="field bg-slate-100" />
                                </Field>
                                <PartnerMultiSelect partners={partners} selectedIds={project.partnerIds} lockSelected />
                                <Field label="اسم المشروع">
                                  <input name="title" required defaultValue={project.title} className="field" />
                                </Field>
                                <Field label="الحالة">
                                  <select name="projectStatus" defaultValue={project.clientStatus} className="field">
                                    <option value="PLANNING">التخطيط</option>
                                    <option value="IN_PROGRESS">قيد التنفيذ</option>
                                    <option value="REVIEW">قيد المراجعة</option>
                                    <option value="COMPLETED">مكتمل</option>
                                    <option value="ON_HOLD">متوقف مؤقتًا</option>
                                    <option value="CANCELLED">ملغى</option>
                                  </select>
                                </Field>
                                <Field label="نسبة التقدم">
                                  <input name="progress" type="number" min="0" max="100" required defaultValue={project.progress} className="field" />
                                </Field>
                                <Field label="موعد التسليم">
                                  <DateInput name="dueAt" defaultValue={project.dueAt?.slice(0, 10) || ""} className="field" />
                                </Field>
                                <Field label="العملة">
                                  <select name="currency" defaultValue={project.projectCurrency || "USD"} className="field">
                                    {["USD", "EUR", "SYP", "TRY"].map((currency) => <option key={currency}>{currency}</option>)}
                                  </select>
                                </Field>
                                <Field label="الوصف" wide>
                                  <textarea name="description" rows={3} defaultValue={project.description || ""} className="field" />
                                </Field>
                                <Field label="تفاصيل الاتفاق ونطاق العمل" wide>
                                  <textarea name="agreementDetails" rows={4} defaultValue={project.agreementDetails || ""} className="field" />
                                </Field>
                                <Field label="الخطة المالية" wide>
                                  <textarea name="financialPlan" rows={3} defaultValue={project.financialPlan || ""} className="field" />
                                </Field>
                                <Field label="مراحل المشروع" wide>
                                  <textarea name="stages" rows={4} defaultValue={project.stages || ""} className="field" />
                                </Field>
                                <Field label="روابط المشروع — رابط في كل سطر" wide>
                                  <textarea name="links" rows={3} dir="ltr" defaultValue={project.links.join("\n")} className="field text-left" />
                                </Field>
                                <Field label="ملاحظات داخلية — لا تظهر للعميل" wide>
                                  <textarea name="notes" rows={3} defaultValue={project.notes || ""} className="field" />
                                </Field>
                                <button disabled={updatingId === project.id} className="rounded-xl bg-[#111827] px-5 py-3 font-black text-white disabled:opacity-50 md:col-span-2">
                                  {updatingId === project.id ? "جارٍ الحفظ..." : "حفظ تعديلات المشروع"}
                                </button>
                              </form>
                            </details>
                          </div>
                          <div className="grid min-w-64 grid-cols-2 gap-2 text-sm">
                            <ProjectFact label="الحالة" value={project.status} />
                            <ProjectFact label="التقدم" value={`${project.progress}%`} />
                            <ProjectFact
                              label="المستحق"
                              value={
                                project.partners.length > 1
                                  ? "حسب كل شريك"
                                  : project.feeAmount
                                  ? `${project.feeAmount} ${project.feeCurrency}`
                                  : "غير محدد"
                              }
                            />
                            <ProjectFact label="الدفع" value={project.partners.length > 1 ? "حسب كل شريك" : paymentLabel[project.paymentStatus]} />
                            <ProjectFact
                              label="التسليم"
                              value={<DateText value={project.dueAt} fallback="غير محدد" />}
                            />
                            <ProjectFact
                              label="الشركاء"
                              value={project.partners.length ? `${project.partners.length} شريك` : "غير مسند"}
                            />
                          </div>
                        </div>
                      </article>
                    ))
                  ) : (
                    <p className="rounded-xl bg-[#F7F3EB] p-5 text-slate-500">
                      لا توجد مشاريع عملاء بعد.
                    </p>
                  )}
                </div>
              </section>
            </div>
          )}

          {!loading && section === "account" && (
            <details className="group mt-7 max-w-2xl rounded-2xl border border-[#D8D2C4] bg-white shadow-sm">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-6">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-[#111827] text-white">
                  <ShieldCheck className="h-6 w-6" />
                </span>
                <div>
                  <h2 className="text-2xl font-black">حساب الإدارة</h2>
                  <p className="text-sm text-slate-500">تعديل الاسم والبريد وكلمة المرور</p>
                </div>
              </div>
              <ChevronDown className="h-5 w-5 transition group-open:rotate-180" />
              </summary>
              <form onSubmit={saveAccount} className="grid gap-4 border-t border-[#D8D2C4] p-6">
                <Field label="الاسم">
                  <input name="name" defaultValue={admin?.name || ""} className="field" />
                </Field>
                <Field label="البريد الإلكتروني">
                  <input name="email" type="email" defaultValue={admin?.email || ""} required className="field" />
                </Field>
                <Field label="رقم الهاتف">
                  <input name="phone" defaultValue={admin?.phone || ""} className="field" />
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
            </details>
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
  updateReview,
}: {
  application: Application;
  busy: boolean;
  decide: (
    id: string,
    status: "ACCEPTED" | "REJECTED",
    notes: string,
    password: string,
  ) => Promise<DecisionResult>;
  updateReview: (id: string, reviewState: "NEW" | "IN_REVIEW" | "NEEDS_INFO") => Promise<boolean>;
}) {
  const [notes, setNotes] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pendingAction, setPendingAction] = useState<"ACCEPTED" | "REJECTED" | null>(null);
  const [decisionMessage, setDecisionMessage] = useState<DecisionResult | null>(null);
  const [open, setOpen] = useState(false);

  async function startReview(reviewState: "IN_REVIEW" | "NEEDS_INFO") {
    if (busy || pendingAction) return;
    const ok = await updateReview(application.id, reviewState);
    if (ok) setOpen(true);
  }

  async function acceptApplication() {
    if (busy || pendingAction) return;
    setDecisionMessage(null);
    setPendingAction("ACCEPTED");
    try {
      const result = await decide(application.id, "ACCEPTED", notes, password);
      setDecisionMessage(result);
    } finally {
      setPendingAction(null);
    }
  }

  async function rejectApplication() {
    if (busy || pendingAction) return;
    if (!notes.trim()) {
      setDecisionMessage({ ok: false, message: "اكتب سبب الرفض في ملاحظات الإدارة أولًا." });
      return;
    }
    if (!window.confirm("هل أنت متأكد من رفض طلب الشريك؟ لن يتم إنشاء حساب لهذا الطلب.")) return;
    setDecisionMessage(null);
    setPendingAction("REJECTED");
    try {
      const result = await decide(application.id, "REJECTED", notes, "");
      setDecisionMessage(result);
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <article className="rounded-2xl border border-[#D8D2C4] p-5">
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="flex flex-wrap items-center gap-2"><h3 className="text-lg font-black">{application.name}</h3><span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">{application.reviewState === "NEEDS_INFO" ? "يحتاج استكمال بيانات" : application.reviewState === "IN_REVIEW" ? "قيد المراجعة" : "جديد"}</span></div>
          <p className="mt-1 text-sm text-slate-500">
            {application.email} {application.phone ? `· ${application.phone}` : ""}
          </p>
          <p className="mt-2 text-sm">{application.partnerType || "نوع الشريك غير محدد"} · {application.countryRegion || application.market || "المنطقة غير محددة"}</p>
          <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2"><p><strong>العمر:</strong> {application.age != null ? `${application.age} سنة` : "غير محدد"}</p><p><strong>التعليم:</strong> {[application.educationLevel, application.educationSpecialty].filter(Boolean).join(" · ") || "غير محدد"}</p><p><strong>المجالات:</strong> {application.workAreas.join("، ") || application.specialty || "غير محددة"}</p><p><strong>الخدمات:</strong> {application.supportServices.join("، ") || "غير محددة"}</p><p><strong>الخبرة:</strong> {[application.experienceLevel, application.experienceYears != null ? `${application.experienceYears} سنوات` : ""].filter(Boolean).join(" · ") || "غير محددة"}</p><p><strong>التفرغ:</strong> {application.availabilityType === "FULL_TIME" ? "كامل" : application.availabilityType === "PART_TIME" ? `جزئي${application.weeklyHours ? ` · ${application.weeklyHours} ساعة` : ""}` : "غير محدد"}</p><p><strong>التعاون:</strong> {application.cooperationTypes.join("، ") || "غير محدد"}</p><p><strong>الدفع:</strong> {[...application.paymentMethods, application.otherPaymentMethod].filter(Boolean).join("، ") || "غير محدد"}</p></div>
          {application.details && <p className="mt-3 rounded-xl bg-[#F7F3EB] p-4">{application.details}</p>}
          <p className="mt-2 text-xs text-slate-400">تاريخ الطلب: <DateText value={application.createdAt} /></p>
        </div>
        <div className="grid content-start gap-3">
          <div className="grid grid-cols-2 gap-2">
            <button type="button" disabled={busy} onClick={() => void startReview("IN_REVIEW")} className="rounded-xl bg-[#111827] px-3 py-2 text-sm font-black text-white disabled:opacity-40">مراجعة الطلب</button>
            <button type="button" disabled={busy} onClick={() => void startReview("NEEDS_INFO")} className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-black text-amber-800 disabled:opacity-40">يحتاج معلومات</button>
          </div>
          <details open={open} onToggle={(event) => setOpen(event.currentTarget.open)} className="group rounded-xl border border-[#D8D2C4] bg-[#F7F3EB]">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 font-black text-[#9A7D43]">فتح الطلب واتخاذ القرار<ChevronDown className="h-5 w-5 transition group-open:rotate-180" /></summary>
        <div className="grid gap-3 border-t border-[#D8D2C4] p-4">
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={2}
            placeholder="ملاحظات الإدارة (اختيارية عند القبول، مطلوبة عند الرفض)"
            className="field"
          />
          <div className="relative">
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type={showPassword ? "text" : "password"}
              minLength={10}
              autoComplete="new-password"
              placeholder="كلمة مرور مؤقتة (10 أحرف على الأقل)"
              className="field pl-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {password.length > 0 && password.length < 10 && (
            <p className="text-xs font-bold text-amber-700">أدخل 10 أحرف على الأقل لتفعيل القبول.</p>
          )}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={busy || pendingAction !== null || password.length < 10}
              onClick={() => void acceptApplication()}
              className="rounded-xl bg-emerald-600 px-4 py-3 font-black text-white disabled:opacity-40"
            >
              {pendingAction === "ACCEPTED" ? "جارٍ إنشاء الحساب…" : "قبول وإنشاء الحساب"}
            </button>
            <button
              type="button"
              disabled={busy || pendingAction !== null}
              onClick={() => void rejectApplication()}
              className="rounded-xl bg-red-600 px-4 py-3 font-black text-white disabled:opacity-40"
            >
              {pendingAction === "REJECTED" ? "جارٍ رفض الطلب…" : "رفض الطلب"}
            </button>
          </div>
          {!notes.trim() && (
            <p className="text-xs font-bold text-rose-700">اكتب سبب الرفض في «ملاحظات الإدارة» لتفعيل زر الرفض.</p>
          )}
          {decisionMessage && (
            <p
              role="status"
              className={`rounded-xl px-4 py-3 text-sm font-bold ${
                decisionMessage.ok ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"
              }`}
            >
              {decisionMessage.message}
            </p>
          )}
        </div>
          </details>
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

function PartnerMultiSelect({
  partners,
  selectedIds = [],
  lockSelected = false,
}: {
  partners: Partner[];
  selectedIds?: string[];
  lockSelected?: boolean;
}) {
  const selected = new Set(selectedIds);
  const activePartners = partners.filter((partner) => partner.status === "ACTIVE");
  return (
    <fieldset className="grid gap-2 md:col-span-2">
      <legend className="font-bold">شركاء التنفيذ — اختياري ويمكن اختيار أكثر من شريك</legend>
      <div className="grid gap-2 rounded-xl border border-[#D8D2C4] bg-white p-3 sm:grid-cols-2">
        {activePartners.map((partner) => {
          const alreadyAssigned = selected.has(partner.id);
          return (
            <label key={partner.id} className={`flex items-center gap-3 rounded-lg border p-3 ${alreadyAssigned ? "border-emerald-200 bg-emerald-50" : "border-[#E6E0D4] bg-[#FCFAF6]"}`}>
              <input
                type="checkbox"
                name="partnerIds"
                value={partner.id}
                defaultChecked={alreadyAssigned}
                disabled={lockSelected && alreadyAssigned}
                className="h-4 w-4"
              />
              <span className="min-w-0">
                <strong className="block truncate text-sm">{partner.user.name || partner.user.email}</strong>
                <span className="block truncate text-xs text-slate-500">{partner.user.email}</span>
              </span>
            </label>
          );
        })}
        {!activePartners.length && <p className="p-2 text-sm text-slate-500">لا يوجد شركاء نشطون متاحون للإسناد.</p>}
      </div>
      {lockSelected && selectedIds.length > 0 && (
        <p className="text-xs text-slate-500">الشركاء المسندون حاليًا مقفلون هنا لحماية مهامهم ومستحقاتهم؛ يمكنك إضافة شركاء آخرين دون حذف الإسنادات السابقة.</p>
      )}
    </fieldset>
  );
}

function ProjectFact({ label, value }: { label: string; value: ReactNode }) {
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
