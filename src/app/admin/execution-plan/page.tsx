"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronDown, ClipboardList, Plus } from "lucide-react";
import { DateInput } from "@/components/ui/date-input";
import { DateText } from "@/components/ui/date-text";
import { dashboardLabel } from "@/lib/dashboard-labels";

type StageStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
type StagePaymentStatus = "PENDING" | "PAID" | "CANCELLED";

type Stage = {
  id: string;
  projectId: string;
  name: string;
  amount: string;
  currency: string;
  status: StageStatus;
  paymentStatus: StagePaymentStatus;
  startsAt: string | null;
  completedAt: string | null;
  paidAt: string | null;
  approvedAt: string | null;
};

type Project = {
  id: string;
  title: string;
  currency: string;
  status: string;
  client: { id: string; name: string | null; email: string };
  referral: { ambassadorId: string | null } | null;
  ambassadorRewardRate: string | null;
  projectStages: Stage[];
};

const stageStatusLabel: Record<StageStatus, string> = {
  NOT_STARTED: "لم تبدأ",
  IN_PROGRESS: "قيد التنفيذ",
  COMPLETED: "مكتملة",
  CANCELLED: "ملغاة",
};

const paymentStatusLabel: Record<StagePaymentStatus, string> = {
  PENDING: "بانتظار الدفع",
  PAID: "مدفوعة",
  CANCELLED: "ملغاة",
};

export default function ExecutionPlanPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/project-stages", { cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(data.error || "تعذر تحميل خطة التنفيذ");
        return;
      }
      const nextProjects = data.projects || [];
      setProjects(nextProjects);
      setSelectedProjectId((current) => current || nextProjects[0]?.id || "");
    } catch {
      setMessage("تعذر الاتصال بخدمة خطة التنفيذ");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) || null,
    [projects, selectedProjectId],
  );

  async function createStage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedProject) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy("create");
    setMessage("");
    try {
      const response = await fetch("/api/admin/project-stages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          projectId: selectedProject.id,
          name: data.get("name"),
          amount: Number(data.get("amount")),
          dueAt: data.get("dueAt"),
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(payload.error || "تعذر إضافة المرحلة");
        return;
      }
      form.reset();
      setMessage("تمت إضافة المرحلة إلى خطة التنفيذ.");
      await load();
    } catch {
      setMessage("تعذر الاتصال بالخادم. لم تُحفظ المرحلة.");
    } finally {
      setBusy(null);
    }
  }

  async function updateStage(event: FormEvent<HTMLFormElement>, stage: Stage) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(stage.id);
    setMessage("");
    try {
      const response = await fetch("/api/admin/project-stages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          stageId: stage.id,
          name: data.get("name"),
          amount: Number(data.get("amount")),
          status: data.get("status"),
          paymentStatus: data.get("paymentStatus"),
          dueAt: data.get("dueAt"),
          approved: data.get("approved") === "on",
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(payload.error || "تعذر تحديث المرحلة");
        return;
      }
      setMessage("تم تحديث المرحلة.");
      await load();
    } catch {
      setMessage("تعذر الاتصال بالخادم. لم تُحفظ التعديلات.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[#F7F3EB] px-4 py-8 text-[#111827] sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-black text-[#9A7D43]">إدارة المشاريع</p>
            <h1 className="mt-1 text-3xl font-black">خطة التنفيذ</h1>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
              مساحة تشغيلية مستقلة لمتابعة مراحل التنفيذ. الاتفاق الأساسي ونطاق المشروع والخطة المالية الأصلية تبقى دون تغيير.
            </p>
          </div>
          <Link href="/admin/partners?section=projects" className="rounded-xl border border-[#D8D2C4] bg-white px-4 py-3 text-sm font-black shadow-sm">
            العودة إلى المشاريع
          </Link>
        </div>

        {message && <p className="mt-5 rounded-xl border border-[#D8D2C4] bg-white p-4 font-bold shadow-sm">{message}</p>}

        <section className="mt-6 rounded-2xl border border-[#D8D2C4] bg-white p-6 shadow-sm">
          <label className="grid gap-2 font-black">
            المشروع
            <select value={selectedProjectId} onChange={(event) => setSelectedProjectId(event.target.value)} className="field max-w-xl">
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.title} — {project.client.name || project.client.email}
                </option>
              ))}
            </select>
          </label>
        </section>

        {loading ? (
          <div className="mt-6 rounded-2xl bg-white p-10 text-center shadow-sm">جارٍ تحميل خطة التنفيذ...</div>
        ) : selectedProject ? (
          <>
            <section className="mt-6 rounded-2xl border border-[#D8D2C4] bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black">{selectedProject.title}</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    العميل: {selectedProject.client.name || selectedProject.client.email} · الحالة: {dashboardLabel(selectedProject.status, selectedProject.status)}
                  </p>
                </div>
                <span className="rounded-xl bg-[#F7F3EB] px-4 py-2 text-sm font-black text-[#9A7D43]">
                  {selectedProject.projectStages.length} مرحلة
                </span>
              </div>

              <div className="mt-6 grid gap-4">
                {selectedProject.projectStages.length ? selectedProject.projectStages.map((stage, index) => (
                  <article key={stage.id} className="rounded-2xl border border-[#D8D2C4] bg-[#FCFAF6] p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-black text-[#9A7D43]">المرحلة {index + 1}</p>
                        <h3 className="mt-1 text-xl font-black">{stage.name}</h3>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs font-black">
                        <span className="rounded-full bg-white px-3 py-1.5">{stageStatusLabel[stage.status]}</span>
                        <span className="rounded-full bg-white px-3 py-1.5">{paymentStatusLabel[stage.paymentStatus]}</span>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <Fact label="المبلغ" value={`${stage.amount} ${stage.currency}`} />
                      <Fact label="حالة الدفع" value={paymentStatusLabel[stage.paymentStatus]} />
                      <Fact label="تاريخ الاستحقاق" value={<DateText value={stage.startsAt} fallback="غير محدد" />} />
                    </div>

                    <details className="group mt-4 rounded-xl border border-[#D8D2C4] bg-white">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 font-black">
                        تحديث المرحلة
                        <ChevronDown className="h-5 w-5 transition group-open:rotate-180" />
                      </summary>
                      <form onSubmit={(event) => updateStage(event, stage)} className="grid gap-4 border-t border-[#E6E0D4] p-4 md:grid-cols-2">
                        <Field label="اسم المرحلة"><input name="name" defaultValue={stage.name} required className="field" /></Field>
                        <Field label="المبلغ"><input name="amount" type="number" min="0.01" step="0.01" defaultValue={stage.amount} required className="field" /></Field>
                        <Field label="الحالة">
                          <select name="status" defaultValue={stage.status} className="field">
                            {Object.entries(stageStatusLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                          </select>
                        </Field>
                        <Field label="حالة الدفع">
                          <select name="paymentStatus" defaultValue={stage.paymentStatus} className="field">
                            {Object.entries(paymentStatusLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                          </select>
                        </Field>
                        <Field label="تاريخ الاستحقاق"><DateInput name="dueAt" defaultValue={stage.startsAt?.slice(0, 10) || ""} className="field" /></Field>
                        <label className="flex items-center gap-3 rounded-xl bg-[#F7F3EB] p-4 font-bold">
                          <input name="approved" type="checkbox" defaultChecked={Boolean(stage.approvedAt)} />
                          اعتماد المرحلة بعد اكتمالها
                        </label>
                        <button disabled={busy === stage.id} className="rounded-xl bg-[#111827] px-5 py-3 font-black text-white disabled:opacity-50 md:col-span-2">
                          {busy === stage.id ? "جارٍ الحفظ..." : "حفظ تحديث المرحلة"}
                        </button>
                      </form>
                    </details>
                  </article>
                )) : (
                  <div className="rounded-2xl border border-dashed border-[#D8D2C4] bg-[#F7F3EB] p-8 text-center">
                    <ClipboardList className="mx-auto h-8 w-8 text-[#9A7D43]" />
                    <p className="mt-3 font-black">لم تُضف مراحل تنفيذ بعد.</p>
                    <p className="mt-1 text-sm text-slate-500">ابدأ بإضافة أول مرحلة من الزر أدناه.</p>
                  </div>
                )}
              </div>
            </section>

            <details className="group mt-6 rounded-2xl border border-[#D8D2C4] bg-white shadow-sm">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-6">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#111827] text-white"><Plus className="h-5 w-5" /></span>
                  <div>
                    <h2 className="text-xl font-black">+ إضافة مرحلة</h2>
                    <p className="mt-1 text-sm text-slate-500">أضف مرحلة تشغيلية جديدة دون تعديل الاتفاق الأساسي.</p>
                  </div>
                </div>
                <ChevronDown className="h-5 w-5 transition group-open:rotate-180" />
              </summary>
              <form onSubmit={createStage} className="grid gap-4 border-t border-[#E6E0D4] p-6 md:grid-cols-2">
                <Field label="اسم المرحلة"><input name="name" required placeholder="مثال: التحليل والتصميم" className="field" /></Field>
                <Field label="المبلغ"><input name="amount" type="number" min="0.01" step="0.01" required placeholder="0.00" className="field" /></Field>
                <Field label="تاريخ الاستحقاق"><DateInput name="dueAt" className="field" /></Field>
                <div className="rounded-xl bg-[#F7F3EB] p-4 text-sm text-slate-600">
                  <div className="flex items-center gap-2 font-black text-[#111827]"><CalendarDays className="h-4 w-4" /> الحالة الأولية</div>
                  <p className="mt-2">لم تبدأ · بانتظار الدفع. ويمكن تحديثها لاحقًا من بطاقة المرحلة.</p>
                </div>
                <button disabled={busy === "create"} className="rounded-xl bg-[#111827] px-5 py-3.5 font-black text-white disabled:opacity-50 md:col-span-2">
                  {busy === "create" ? "جارٍ الإضافة..." : "+ إضافة المرحلة"}
                </button>
              </form>
            </details>
          </>
        ) : (
          <div className="mt-6 rounded-2xl bg-white p-10 text-center shadow-sm">لا توجد مشاريع متاحة.</div>
        )}
      </div>

      <style jsx global>{`
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-2 text-sm font-black">{label}{children}</label>;
}

function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="rounded-xl bg-white p-4"><p className="text-xs font-bold text-slate-500">{label}</p><div className="mt-1 font-black">{value}</div></div>;
}
