"use client";

import Link from "next/link";
import { type FormEvent, type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronDown,
  CirclePause,
  ClipboardList,
  ExternalLink,
  FolderPlus,
  MessageSquarePlus,
  Pencil,
  RefreshCw,
  UserRoundCog,
} from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { DateText } from "@/components/ui/date-text";

type PartnerStatus = "PENDING" | "ACTIVE" | "SUSPENDED";
type ProjectStatus = "PLANNING" | "IN_PROGRESS" | "REVIEW" | "COMPLETED" | "ON_HOLD";

type ProjectSummary = {
  id: string;
  title: string;
  status: ProjectStatus;
  progress: number;
  currency: string;
  dueAt: string | null;
  client: { id: string; name: string | null; email: string };
};

type Assignment = {
  id: string;
  title: string;
  status: string;
  progress: number;
  feeAmount: string | null;
  feeCurrency: string;
  paymentStatus: string;
  dueAt: string | null;
  createdAt: string;
  clientProject: ProjectSummary | null;
};

type PartnerDetails = {
  id: string;
  status: PartnerStatus;
  profileCompletedAt: string | null;
  phone: string | null;
  specialty: string | null;
  experience: string | null;
  availability: string | null;
  portfolioUrl: string | null;
  contactMethod: string | null;
  workTypes: string | null;
  clientAcquisition: string | null;
  payoutMethods: string | null;
  adminNotes: string | null;
  decisionNotes: string | null;
  createdAt: string;
  updatedAt: string;
  user: { name: string | null; email: string; phone: string | null; isActive: boolean; createdAt: string };
  application: {
    details: string | null;
    market: string | null;
    createdAt: string;
  } | null;
  assignments: Assignment[];
  _count: { referrals: number };
};

const projectStatusLabel: Record<string, string> = {
  ASSIGNED: "مسند",
  PLANNING: "التخطيط",
  IN_PROGRESS: "قيد التنفيذ",
  REVIEW: "قيد المراجعة",
  COMPLETED: "مكتمل",
  ON_HOLD: "متوقف مؤقتًا",
};

function profileStatus(partner: PartnerDetails) {
  if (partner.status === "SUSPENDED" || !partner.user.isActive) return { label: "موقوف", style: "bg-rose-100 text-rose-800" };
  if (partner.status === "PENDING") return { label: "قيد المراجعة", style: "bg-amber-100 text-amber-800" };
  if (!partner.profileCompletedAt) return { label: "غير مكتمل البيانات", style: "bg-sky-100 text-sky-800" };
  return { label: "فعال", style: "bg-emerald-100 text-emerald-800" };
}

export default function AdminPartnerDetailsPage() {
  const params = useParams<{ partnerId: string }>();
  const router = useRouter();
  const [partner, setPartner] = useState<PartnerDetails | null>(null);
  const [projectOptions, setProjectOptions] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const response = await fetch(`/api/admin/partners?partnerId=${encodeURIComponent(params.partnerId)}`, { cache: "no-store" });
      if (response.status === 401) return router.replace("/login");
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(data?.error || "تعذر تحميل ملف الشريك");
        return;
      }
      setPartner(data.partner);
      setProjectOptions(data.projectOptions || []);
    } catch {
      setMessage("تعذر الاتصال بالخادم لتحميل ملف الشريك");
    } finally {
      setLoading(false);
    }
  }, [params.partnerId, router]);

  useEffect(() => { void Promise.resolve().then(() => load()); }, [load]);

  async function patch(body: Record<string, unknown>, successMessage: string) {
    const response = await fetch("/api/admin/partners", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: params.partnerId, ...body }),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      setMessage(data?.error || "تعذر حفظ التعديل");
      return false;
    }
    setMessage(successMessage);
    await load(true);
    return true;
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setSaving("profile");
    setMessage("");
    try {
      await patch({
        entity: "partner_profile",
        name: data.get("name"),
        email: data.get("email"),
        phone: data.get("phone"),
        specialty: data.get("specialty"),
        experience: data.get("experience"),
        availability: data.get("availability"),
        portfolioUrl: data.get("portfolioUrl"),
        contactMethod: data.get("contactMethod"),
        workTypes: data.get("workTypes"),
        clientAcquisition: data.get("clientAcquisition"),
        payoutMethods: data.get("payoutMethods"),
      }, "تم حفظ بيانات الشريك وقدراته بنجاح");
    } finally {
      setSaving("");
    }
  }

  async function changeStatus(status: PartnerStatus) {
    setSaving("status");
    setMessage("");
    try {
      await patch({ entity: "partner", status }, status === "ACTIVE" ? "تم تفعيل حساب الشريك" : status === "SUSPENDED" ? "تم إيقاف حساب الشريك" : "تم نقل الشريك إلى قيد المراجعة");
    } finally {
      setSaving("");
    }
  }

  async function addNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setSaving("note");
    setMessage("");
    try {
      const ok = await patch({ entity: "partner_note", note: data.get("note") }, "تمت إضافة الملاحظة الإدارية");
      if (ok) form.reset();
    } finally {
      setSaving("");
    }
  }

  async function assignProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setSaving("assignment");
    setMessage("");
    try {
      const ok = await patch({ entity: "partner_assignment", projectId: data.get("projectId") }, "تم إسناد المشروع للشريك بنجاح");
      if (ok) form.reset();
    } finally {
      setSaving("");
    }
  }

  const currentProjects = useMemo(() => partner?.assignments.filter((assignment) => (assignment.clientProject?.status || assignment.status) !== "COMPLETED") || [], [partner]);
  const completedProjects = useMemo(() => partner?.assignments.filter((assignment) => (assignment.clientProject?.status || assignment.status) === "COMPLETED") || [], [partner]);

  return (
    <AdminShell
      active="partners"
      eyebrow="إدارة الشركاء"
      title={partner?.user.name || "ملف الشريك"}
      description="ملف تشغيلي موحد لبيانات الشريك وقدراته ومشاريعه وإجراءات الإدارة."
      actions={<Link href="/admin/partners?section=partners" className="inline-flex items-center gap-2 rounded-xl border border-[#D8D2C4] bg-white px-4 py-3 font-black shadow-sm"><ArrowRight className="h-4 w-4" />قائمة الشركاء</Link>}
    >
      {message && <p role="status" className="mt-5 rounded-xl border border-[#D8D2C4] bg-white p-4 font-bold shadow-sm">{message}</p>}
      {loading ? <div className="mt-7 flex items-center justify-center gap-3 rounded-2xl bg-white p-12"><RefreshCw className="h-5 w-5 animate-spin" />جارٍ تحميل ملف الشريك...</div> : !partner ? <p className="mt-7 rounded-2xl bg-white p-10 text-center">لم يُعثر على ملف الشريك.</p> : (
        <div className="mt-7 grid gap-6">
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard label="حالة الشريك" value={<span className={`rounded-full px-3 py-1 text-sm ${profileStatus(partner).style}`}>{profileStatus(partner).label}</span>} />
            <SummaryCard label="المشاريع الحالية" value={currentProjects.length} />
            <SummaryCard label="المشاريع المكتملة" value={completedProjects.length} />
            <SummaryCard label="الإحالات" value={partner._count.referrals} />
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
            <article className="rounded-2xl border border-[#D8D2C4] bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-bold text-[#9A7D43]">البيانات الأساسية</p><h2 className="mt-1 text-2xl font-black">هوية الشريك والتواصل</h2></div><span className="rounded-full bg-[#F7F3EB] px-3 py-1 text-xs font-black">شريك تنفيذ</span></div>
              <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                <Fact label="الاسم" value={partner.user.name || "غير محدد"} />
                <Fact label="البريد" value={partner.user.email} ltr />
                <Fact label="الهاتف" value={partner.user.phone || partner.phone || "غير محدد"} ltr />
                <Fact label="طريقة التواصل" value={partner.contactMethod || "غير محددة"} />
                <Fact label="تاريخ التسجيل" value={<DateText value={partner.createdAt} />} />
                <Fact label="آخر تحديث" value={<DateText value={partner.updatedAt} />} />
              </dl>
              <div className="mt-5 rounded-xl bg-[#F7F3EB] p-4"><p className="text-xs font-bold text-slate-500">نبذة الشريك</p><p className="mt-2 whitespace-pre-wrap leading-7">{partner.application?.details || partner.experience || "لم تُضف نبذة بعد."}</p></div>
              {partner.portfolioUrl && <a href={partner.portfolioUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 font-black text-[#8A6E38]">فتح معرض الأعمال <ExternalLink className="h-4 w-4" /></a>}
            </article>

            <article className="rounded-2xl border border-[#D8D2C4] bg-white p-6 shadow-sm">
              <p className="text-sm font-bold text-[#9A7D43]">قدرات الشريك</p><h2 className="mt-1 text-2xl font-black">الملاءمة التشغيلية</h2>
              <dl className="mt-6 grid gap-4">
                <Fact label="مجالات الخبرة" value={partner.specialty || "غير محددة"} />
                <Fact label="نوع الأعمال التي يستطيع تنفيذها" value={partner.workTypes || partner.experience || "غير محدد"} />
                <Fact label="مستوى التفرغ" value={partner.availability || "غير محدد"} />
                <Fact label="طريقة جلب العملاء" value={partner.clientAcquisition || "غير محددة"} />
                <Fact label="طرق استلام الدفعات" value={partner.payoutMethods || "غير محددة"} />
              </dl>
            </article>
          </section>

          <details className="group rounded-2xl border border-[#D8D2C4] bg-white shadow-sm">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-6"><span className="flex items-center gap-3 text-xl font-black"><Pencil className="h-5 w-5 text-[#9A7D43]" />تعديل بيانات الشريك وقدراته</span><ChevronDown className="h-5 w-5 transition group-open:rotate-180" /></summary>
            <form onSubmit={saveProfile} className="grid gap-4 border-t border-[#E6E0D4] p-6 md:grid-cols-2">
              <Field label="الاسم"><input required minLength={2} name="name" defaultValue={partner.user.name || ""} className="field" /></Field>
              <Field label="البريد الإلكتروني"><input required type="email" name="email" defaultValue={partner.user.email} className="field" dir="ltr" /></Field>
              <Field label="رقم الهاتف"><input name="phone" defaultValue={partner.user.phone || partner.phone || ""} className="field" dir="ltr" /></Field>
              <Field label="طريقة التواصل المفضلة"><input name="contactMethod" defaultValue={partner.contactMethod || ""} className="field" placeholder="واتساب، بريد، مكالمة..." /></Field>
              <Field label="مجالات الخبرة"><textarea name="specialty" rows={3} defaultValue={partner.specialty || ""} className="field" /></Field>
              <Field label="مستوى التفرغ"><textarea name="availability" rows={3} defaultValue={partner.availability || ""} className="field" placeholder="كامل، جزئي، عدد الساعات..." /></Field>
              <Field label="الخبرة المهنية / نبذة الشريك"><textarea name="experience" rows={5} defaultValue={partner.experience || ""} className="field" /></Field>
              <Field label="أنواع الأعمال التي يستطيع تنفيذها"><textarea name="workTypes" rows={5} defaultValue={partner.workTypes || ""} className="field" /></Field>
              <Field label="طريقة جلب العملاء"><textarea name="clientAcquisition" rows={3} defaultValue={partner.clientAcquisition || ""} className="field" /></Field>
              <Field label="طرق استلام الدفعات"><textarea name="payoutMethods" rows={3} defaultValue={partner.payoutMethods || ""} className="field" /></Field>
              <Field label="رابط معرض الأعمال" wide><input name="portfolioUrl" type="url" defaultValue={partner.portfolioUrl || ""} className="field" dir="ltr" placeholder="https://..." /></Field>
              <button disabled={saving === "profile"} className="rounded-xl bg-[#111827] px-5 py-3 font-black text-white disabled:opacity-50 md:col-span-2">{saving === "profile" ? "جارٍ الحفظ..." : "حفظ بيانات الشريك"}</button>
            </form>
          </details>

          <section className="rounded-2xl border border-[#D8D2C4] bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm font-bold text-[#9A7D43]">المشاريع</p><h2 className="mt-1 text-2xl font-black">المشاريع المسندة للشريك</h2></div><span className="rounded-xl bg-[#F7F3EB] px-4 py-2 font-bold">{partner.assignments.length} مشروع</span></div>
            <details className="group mt-5 rounded-xl border border-[#D8D2C4] bg-[#F7F3EB]">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 font-black"><span className="flex items-center gap-2"><FolderPlus className="h-5 w-5 text-[#9A7D43]" />إسناد مشروع جديد</span><ChevronDown className="h-5 w-5 transition group-open:rotate-180" /></summary>
              <form onSubmit={assignProject} className="flex flex-col gap-3 border-t border-[#D8D2C4] p-4 sm:flex-row">
                <select name="projectId" required defaultValue="" className="field flex-1"><option value="">اختر مشروعًا غير مسند لهذا الشريك</option>{projectOptions.map((project) => <option key={project.id} value={project.id}>{project.title} — {project.client.name || project.client.email}</option>)}</select>
                <button disabled={saving === "assignment" || !projectOptions.length} className="rounded-xl bg-[#B89A5A] px-5 py-3 font-black text-[#111827] disabled:opacity-50">{saving === "assignment" ? "جارٍ الإسناد..." : "إسناد المشروع"}</button>
              </form>
              {!projectOptions.length && <p className="px-4 pb-4 text-sm text-slate-500">لا توجد مشاريع أخرى متاحة للإسناد.</p>}
            </details>
            <ProjectGroup title="المشاريع الحالية" projects={currentProjects} empty="لا توجد مشاريع حالية." />
            <ProjectGroup title="المشاريع المكتملة" projects={completedProjects} empty="لا توجد مشاريع مكتملة بعد." />
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <article className="rounded-2xl border border-[#D8D2C4] bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3"><UserRoundCog className="h-6 w-6 text-[#9A7D43]" /><h2 className="text-2xl font-black">إجراءات الإدارة</h2></div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <button type="button" disabled={saving === "status" || (partner.status === "ACTIVE" && partner.user.isActive)} onClick={() => void changeStatus("ACTIVE")} className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 font-black text-white disabled:opacity-40"><CheckCircle2 className="h-5 w-5" />تفعيل الحساب</button>
                <button type="button" disabled={saving === "status" || partner.status === "SUSPENDED"} onClick={() => void changeStatus("SUSPENDED")} className="flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-3 font-black text-white disabled:opacity-40"><CirclePause className="h-5 w-5" />إيقاف الحساب</button>
                <button type="button" disabled={saving === "status" || partner.status === "PENDING"} onClick={() => void changeStatus("PENDING")} className="flex items-center justify-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 font-black text-amber-800 disabled:opacity-40"><ClipboardList className="h-5 w-5" />نقل إلى قيد المراجعة</button>
                <Link href={`/partner/dashboard?adminPreview=${partner.id}`} className="flex items-center justify-center gap-2 rounded-xl border border-[#111827] px-4 py-3 font-black"><BriefcaseBusiness className="h-5 w-5" />معاينة لوحة الشريك</Link>
              </div>
              {partner.decisionNotes && <div className="mt-5 rounded-xl bg-[#F7F3EB] p-4"><p className="text-xs font-bold text-slate-500">ملاحظات قرار الاعتماد</p><p className="mt-2 whitespace-pre-wrap">{partner.decisionNotes}</p></div>}
            </article>

            <article className="rounded-2xl border border-[#D8D2C4] bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3"><MessageSquarePlus className="h-6 w-6 text-[#9A7D43]" /><h2 className="text-2xl font-black">ملاحظات الإدارة</h2></div>
              <form onSubmit={addNote} className="mt-5 grid gap-3"><textarea required name="note" rows={3} maxLength={2000} className="field" placeholder="أضف ملاحظة داخلية جديدة..." /><button disabled={saving === "note"} className="rounded-xl bg-[#111827] px-5 py-3 font-black text-white disabled:opacity-50">{saving === "note" ? "جارٍ الإضافة..." : "إضافة ملاحظة إدارية"}</button></form>
              <div className="mt-5 max-h-72 overflow-y-auto rounded-xl bg-[#F7F3EB] p-4"><p className="whitespace-pre-wrap text-sm leading-7 text-slate-600">{partner.adminNotes || "لا توجد ملاحظات إدارية بعد."}</p></div>
            </article>
          </section>
        </div>
      )}
    </AdminShell>
  );
}

function SummaryCard({ label, value }: { label: string; value: ReactNode }) {
  return <div className="rounded-2xl border border-[#D8D2C4] bg-white p-5 shadow-sm"><p className="text-sm font-bold text-slate-500">{label}</p><div className="mt-3 text-3xl font-black">{value}</div></div>;
}

function Fact({ label, value, ltr = false }: { label: string; value: ReactNode; ltr?: boolean }) {
  return <div><dt className="text-xs font-bold text-slate-500">{label}</dt><dd className="mt-1 whitespace-pre-wrap font-black" dir={ltr ? "ltr" : undefined}>{value}</dd></div>;
}

function Field({ label, wide = false, children }: { label: string; wide?: boolean; children: ReactNode }) {
  return <label className={`grid gap-2 font-bold ${wide ? "md:col-span-2" : ""}`}>{label}{children}</label>;
}

function ProjectGroup({ title, projects, empty }: { title: string; projects: Assignment[]; empty: string }) {
  return <div className="mt-6"><h3 className="text-lg font-black">{title} <span className="text-sm font-normal text-slate-500">({projects.length})</span></h3><div className="mt-3 grid gap-3">{projects.length ? projects.map((assignment) => {
    const project = assignment.clientProject;
    const status = project?.status || assignment.status;
    return <article key={assignment.id} className="flex flex-col justify-between gap-4 rounded-xl border border-[#E6E0D4] bg-[#FCFAF6] p-4 sm:flex-row sm:items-center"><div><h4 className="font-black">{project?.title || assignment.title}</h4><p className="mt-1 text-sm text-slate-500">العميل: {project ? project.client.name || project.client.email : "مشروع قديم غير مربوط بعميل"}</p><p className="mt-2 text-sm">الحالة: {projectStatusLabel[status] || status} · التقدم {project?.progress ?? assignment.progress}%</p></div><div className="flex flex-wrap items-center gap-2">{project && <Link href={`/admin/clients/${project.client.id}?manage=projects`} className="rounded-lg border border-[#111827] px-3 py-2 text-sm font-black">فتح المشروع</Link>}<span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#8A6E38]"><DateText value={project?.dueAt || assignment.dueAt} fallback="دون موعد" /></span></div></article>;
  }) : <p className="rounded-xl bg-[#F7F3EB] p-5 text-slate-500">{empty}</p>}</div></div>;
}
