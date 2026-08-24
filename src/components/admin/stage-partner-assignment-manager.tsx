"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { CheckCircle2, ChevronDown, ExternalLink, Pencil, Trash2, UserRoundCheck } from "lucide-react";
import { DateInput } from "@/components/ui/date-input";
import { DateText } from "@/components/ui/date-text";

type PaymentStatus = "PENDING" | "APPROVED" | "PAID" | "CANCELLED";
type Assignment = {
  id: string;
  projectStageId: string;
  partnerId: string;
  partnerName: string | null;
  partnerEmail: string;
  tasks: string[];
  deliverables: string[];
  status: string;
  progress: number;
  feeAmount: string | null;
  feeCurrency: string;
  paymentStatus: PaymentStatus;
  approvedAt: string | null;
  dueAt: string | null;
  paidAt: string | null;
  paymentMethod: string | null;
  paymentReference: string | null;
  paymentProofUrl: string | null;
  paymentProofName: string | null;
};
type Stage = {
  id: string;
  name: string;
  status: string;
  paymentStatus: string;
  amount: string;
  currency: string;
  startsAt: string | null;
  assignments: Assignment[];
};
type Partner = { id: string; name: string; email: string };
type Payload = {
  project: { id: string; title: string; status: string; currency: string; projectStages: Stage[] };
  partners: Partner[];
};
type Draft = {
  partnerId: string;
  tasks: string;
  deliverables: string;
  feeAmount: string;
  feeCurrency: string;
  dueAt: string;
};

const paymentLabel: Record<PaymentStatus, string> = {
  PENDING: "متوقع / غير مستحق",
  APPROVED: "مستحق للدفع",
  PAID: "مدفوع",
  CANCELLED: "ملغى",
};

const assignmentLabel: Record<string, string> = {
  ASSIGNED: "تم الإسناد",
  IN_PROGRESS: "قيد التنفيذ",
  REVIEW: "بانتظار مراجعة الإدارة",
  COMPLETED: "اعتمد التسليم",
  ON_HOLD: "متوقف مؤقتًا",
  CANCELLED: "ملغى",
};

function emptyDraft(currency: string): Draft {
  return {
    partnerId: "",
    tasks: "",
    deliverables: "",
    feeAmount: "",
    feeCurrency: currency || "USD",
    dueAt: "",
  };
}

export function StagePartnerAssignmentManager({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<Payload | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function load() {
    setMessage("");
    try {
      const response = await fetch(`/api/admin/stage-partner-assignments?projectId=${encodeURIComponent(projectId)}`, { cache: "no-store" });
      const payload = await response.json().catch(() => null);
      if (!response.ok) return setMessage(payload?.error || "تعذر تحميل إسنادات شركاء التنفيذ");
      setData(payload);
      setDrafts((current) => {
        const next = { ...current };
        for (const stage of payload.project.projectStages as Stage[]) {
          if (!next[stage.id]) next[stage.id] = emptyDraft(payload.project.currency);
        }
        return next;
      });
    } catch {
      setMessage("تعذر الاتصال بخدمة إسناد شركاء التنفيذ");
    }
  }

  useEffect(() => {
    if (open && !data) void load();
  }, [open, data]);

  const assignedPartnerNames = useMemo(() => {
    const names = data?.project.projectStages.flatMap((stage) => stage.assignments.map((item) => item.partnerName || item.partnerEmail)) || [];
    return [...new Set(names)];
  }, [data]);

  function updateDraft(stageId: string, patch: Partial<Draft>) {
    setDrafts((current) => ({
      ...current,
      [stageId]: { ...(current[stageId] || emptyDraft(data?.project.currency || "USD")), ...patch },
    }));
  }

  function editAssignment(stage: Stage, assignment: Assignment) {
    setDrafts((current) => ({
      ...current,
      [stage.id]: {
        partnerId: assignment.partnerId,
        tasks: assignment.tasks.join("\n"),
        deliverables: assignment.deliverables.join("\n"),
        feeAmount: assignment.feeAmount || "",
        feeCurrency: assignment.feeCurrency || stage.currency,
        dueAt: assignment.dueAt?.slice(0, 10) || "",
      },
    }));
  }

  async function save(event: FormEvent<HTMLFormElement>, stage: Stage) {
    event.preventDefault();
    const draft = drafts[stage.id] || emptyDraft(data?.project.currency || stage.currency);
    if (!draft.partnerId) return setMessage(`اختر شريك التنفيذ للمرحلة «${stage.name}».`);
    if (!Number.isFinite(Number(draft.feeAmount)) || Number(draft.feeAmount) <= 0) {
      return setMessage(`حدد مستحقًا صحيحًا لشريك التنفيذ في المرحلة «${stage.name}».`);
    }
    setBusy(stage.id);
    setMessage("");
    try {
      const response = await fetch("/api/admin/stage-partner-assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "upsert",
          projectStageId: stage.id,
          partnerId: draft.partnerId,
          tasks: draft.tasks,
          deliverables: draft.deliverables,
          feeAmount: draft.feeAmount,
          feeCurrency: draft.feeCurrency,
          dueAt: draft.dueAt || null,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) return setMessage(payload?.error || "تعذر حفظ إسناد المرحلة");
      setMessage(`✓ تم حفظ إسناد «${stage.name}». المستحق الآن متوقع فقط حتى يعتمد التسليم.`);
      setDrafts((current) => ({ ...current, [stage.id]: emptyDraft(data?.project.currency || stage.currency) }));
      await load();
      window.dispatchEvent(new Event("admin-projects-refresh"));
    } catch {
      setMessage("تعذر الاتصال بالخادم. لم يُحفظ الإسناد.");
    } finally {
      setBusy(null);
    }
  }

  async function approveDelivery(stage: Stage, assignment: Assignment) {
    if (!window.confirm(`اعتماد تسليم ${assignment.partnerName || assignment.partnerEmail} للمرحلة «${stage.name}» وتحويل مستحقه إلى «مستحق للدفع»؟`)) return;
    setBusy(assignment.id);
    setMessage("");
    try {
      const response = await fetch("/api/admin/stage-partner-assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve_delivery", assignmentId: assignment.id }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) return setMessage(payload?.error || "تعذر اعتماد تسليم الشريك");
      setMessage(`✓ تم اعتماد تسليم «${stage.name}». أصبح مستحق الشريك جاهزًا للدفع.`);
      await load();
    } catch {
      setMessage("تعذر الاتصال بالخادم. لم يُعتمد التسليم.");
    } finally {
      setBusy(null);
    }
  }

  async function recordPayment(event: FormEvent<HTMLFormElement>, assignment: Assignment) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const paymentMethod = String(form.get("paymentMethod") || "").trim();
    const paymentReference = String(form.get("paymentReference") || "").trim();
    const paidAt = String(form.get("paidAt") || "").trim();
    const proof = form.get("paymentProof");
    if (!paymentMethod || !paymentReference || !paidAt) {
      return setMessage("لتسجيل الدفع: أدخل طريقة الدفع والمرجع وتاريخ الدفع. المرفق اختياري.");
    }

    setBusy(assignment.id);
    setMessage("");
    try {
      let paymentProofUrl: string | null = null;
      let paymentProofName: string | null = null;
      if (proof instanceof File && proof.size > 0) {
        const upload = new FormData();
        upload.set("assignmentId", assignment.id);
        upload.set("file", proof);
        const uploadResponse = await fetch("/api/admin/stage-partner-assignments/payment-proof-upload", {
          method: "POST",
          body: upload,
        });
        const uploadPayload = await uploadResponse.json().catch(() => null);
        if (!uploadResponse.ok) return setMessage(uploadPayload?.error || "تعذر رفع إثبات الدفع");
        paymentProofUrl = uploadPayload.url || null;
        paymentProofName = uploadPayload.originalName || null;
      }

      const response = await fetch("/api/admin/stage-partner-assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "record_payment",
          assignmentId: assignment.id,
          paymentMethod,
          paymentReference,
          paidAt,
          paymentProofUrl,
          paymentProofName,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) return setMessage(payload?.error || "تعذر تسجيل دفع مستحق الشريك");
      setMessage(`✓ تم تسجيل دفع ${assignment.feeAmount} ${assignment.feeCurrency} إلى ${assignment.partnerName || assignment.partnerEmail}.`);
      await load();
    } catch {
      setMessage("تعذر الاتصال بالخادم. لم يُسجل الدفع.");
    } finally {
      setBusy(null);
    }
  }

  async function remove(stage: Stage, assignment: Assignment) {
    if (!window.confirm(`إلغاء إسناد ${assignment.partnerName || assignment.partnerEmail} من مرحلة «${stage.name}»؟`)) return;
    setBusy(assignment.id);
    setMessage("");
    try {
      const response = await fetch("/api/admin/stage-partner-assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", assignmentId: assignment.id }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) return setMessage(payload?.error || "تعذر حذف الإسناد");
      setMessage("تم حذف الإسناد قبل بدء التنفيذ.");
      await load();
      window.dispatchEvent(new Event("admin-projects-refresh"));
    } catch {
      setMessage("تعذر الاتصال بالخادم. لم يُحذف الإسناد.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <details open={open} onToggle={(event) => setOpen(event.currentTarget.open)} className="group mt-2 rounded-xl border border-[#D8D2C4] bg-white">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-lg px-4 py-3 text-sm font-black text-[#9A7D43]">
        <span className="flex items-center gap-2">
          <UserRoundCheck className="h-4 w-4" />
          إسناد التنفيذ للشركاء
          {!!assignedPartnerNames.length && <span className="rounded-full bg-[#F7F3EB] px-2.5 py-1 text-xs text-[#111827]">{assignedPartnerNames.length}</span>}
        </span>
        <ChevronDown className="h-5 w-5 transition group-open:rotate-180" />
      </summary>

      <div className="grid gap-4 border-t border-[#E6E0D4] p-4">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-900">
          دورة مستحق الشريك: متوقع عند الإسناد ← مستحق للدفع بعد وصول الشريك إلى 100٪ واعتماد الإدارة ← مدفوع بعد تسجيل طريقة الدفع والمرجع والتاريخ. دفع الشريك مستقل عن إغلاق مشروع العميل.
        </div>
        {message && <p role="status" className="rounded-xl border border-[#D8D2C4] bg-white p-3 text-sm font-bold">{message}</p>}
        {!data && <p className="rounded-xl bg-[#F7F3EB] p-4 text-sm font-bold">جارٍ تحميل المراحل والشركاء...</p>}
        {data && !data.project.projectStages.length && (
          <p className="rounded-xl bg-amber-50 p-4 text-sm font-bold text-amber-900">أنشئ مراحل المشروع أولًا. لا يمكن إسناد العمل إلى الشريك من مستوى المشروع.</p>
        )}
        {data?.project.projectStages.map((stage, index) => {
          const draft = drafts[stage.id] || emptyDraft(data.project.currency);
          const canCreateAssignment = !["COMPLETED", "CANCELLED"].includes(stage.status) && !["COMPLETED", "CANCELLED"].includes(data.project.status);
          return (
            <section key={stage.id} className="rounded-2xl border border-[#D8D2C4] bg-[#FCFAF6] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black text-[#9A7D43]">المرحلة {index + 1}</p>
                  <h4 className="mt-1 text-lg font-black">{stage.name}</h4>
                  <p className="mt-1 text-xs font-bold text-slate-500">قيمة مرحلة العميل: {stage.amount} {stage.currency}</p>
                </div>
                <span className="rounded-full bg-white px-3 py-1.5 text-xs font-black">{stage.status === "NOT_STARTED" ? "لم تبدأ" : stage.status === "IN_PROGRESS" ? "قيد التنفيذ" : stage.status === "COMPLETED" ? "مكتملة" : "ملغاة"}</span>
              </div>

              {!!stage.assignments.length && (
                <div className="mt-4 grid gap-3">
                  {stage.assignments.map((assignment) => {
                    const canEdit = canCreateAssignment && assignment.progress === 0 && assignment.status === "ASSIGNED" && assignment.paymentStatus === "PENDING";
                    const canApprove = assignment.progress === 100 && assignment.status === "REVIEW" && assignment.paymentStatus === "PENDING";
                    const canPay = assignment.status === "COMPLETED" && assignment.paymentStatus === "APPROVED";
                    return (
                      <article key={assignment.id} className="rounded-xl border border-[#E6E0D4] bg-white p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <strong>{assignment.partnerName || assignment.partnerEmail}</strong>
                            <p dir="ltr" className="mt-1 w-fit text-xs text-slate-500">{assignment.partnerEmail}</p>
                          </div>
                          <div className="flex flex-wrap gap-2 text-xs font-black">
                            <span className="rounded-full bg-[#F7F3EB] px-3 py-1.5">{assignmentLabel[assignment.status] || assignment.status}</span>
                            <span className="rounded-full bg-[#F7F3EB] px-3 py-1.5">التقدم {assignment.progress}%</span>
                            <span className="rounded-full bg-[#F7F3EB] px-3 py-1.5">{paymentLabel[assignment.paymentStatus]}</span>
                          </div>
                        </div>
                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                          <div><p className="text-xs font-black text-slate-500">المهام</p><ul className="mt-1 list-inside list-disc text-sm">{assignment.tasks.map((task) => <li key={task}>{task}</li>)}</ul></div>
                          <div><p className="text-xs font-black text-slate-500">التسليمات</p><ul className="mt-1 list-inside list-disc text-sm">{assignment.deliverables.map((item) => <li key={item}>{item}</li>)}</ul></div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-3 text-xs font-bold text-slate-600">
                          <span>المستحق: {assignment.feeAmount ? `${assignment.feeAmount} ${assignment.feeCurrency}` : "غير محدد"}</span>
                          <span>موعد الشريك: <DateText value={assignment.dueAt} fallback="غير محدد" /></span>
                          {assignment.approvedAt && <span>اعتماد التسليم: <DateText value={assignment.approvedAt} /></span>}
                        </div>

                        {canEdit && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button type="button" onClick={() => editAssignment(stage, assignment)} className="inline-flex items-center gap-2 rounded-lg border border-[#D8D2C4] px-3 py-2 text-xs font-black"><Pencil className="h-3.5 w-3.5" />تعديل الإسناد</button>
                            <button type="button" disabled={busy === assignment.id} onClick={() => void remove(stage, assignment)} className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-black text-rose-800 disabled:opacity-50"><Trash2 className="h-3.5 w-3.5" />حذف</button>
                          </div>
                        )}

                        {canApprove && (
                          <div className="mt-4 rounded-xl border border-violet-200 bg-violet-50 p-4">
                            <p className="text-sm font-bold text-violet-900">أرسل الشريك العمل للمراجعة عند 100٪. اعتمادك هنا يحول مستحقه من «متوقع» إلى «مستحق للدفع».</p>
                            <button type="button" disabled={busy === assignment.id} onClick={() => void approveDelivery(stage, assignment)} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-black text-white disabled:opacity-50"><CheckCircle2 className="h-4 w-4" />اعتماد تسليم الشريك</button>
                          </div>
                        )}

                        {canPay && (
                          <form onSubmit={(event) => void recordPayment(event, assignment)} className="mt-4 grid gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 md:grid-cols-2">
                            <p className="text-sm font-black text-blue-950 md:col-span-2">تسجيل دفع مستحق الشريك — {assignment.feeAmount} {assignment.feeCurrency}</p>
                            <label className="grid gap-2 text-sm font-black">طريقة الدفع<input name="paymentMethod" required placeholder="مثال: شام كاش" className="field bg-white font-normal" /></label>
                            <label className="grid gap-2 text-sm font-black">مرجع عملية الدفع<input name="paymentReference" required className="field bg-white font-normal" /></label>
                            <label className="grid gap-2 text-sm font-black">تاريخ الدفع<DateInput name="paidAt" required className="field bg-white font-normal" /></label>
                            <label className="grid gap-2 text-sm font-black">إثبات الدفع — اختياري<input name="paymentProof" type="file" accept="image/png,image/jpeg,image/webp,application/pdf" className="field bg-white font-normal" /></label>
                            <button disabled={busy === assignment.id} className="rounded-xl bg-[#111827] px-5 py-3 font-black text-white disabled:opacity-50 md:col-span-2">{busy === assignment.id ? "جارٍ التسجيل..." : "تسجيل الدفع"}</button>
                          </form>
                        )}

                        {assignment.paymentStatus === "PAID" && (
                          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
                            <p className="font-black">تم دفع مستحق الشريك</p>
                            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 font-bold">
                              <span>الطريقة: {assignment.paymentMethod || "—"}</span>
                              <span>المرجع: {assignment.paymentReference || "—"}</span>
                              <span>التاريخ: <DateText value={assignment.paidAt} /></span>
                              {assignment.paymentProofUrl && <a href={`/api/partner/stage-assignments/${assignment.id}/payment-proof`} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 text-emerald-800 underline"><ExternalLink className="h-3.5 w-3.5" />عرض إثبات الدفع</a>}
                            </div>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}

              {canCreateAssignment && (
                <form onSubmit={(event) => void save(event, stage)} className="mt-4 grid gap-3 rounded-xl border border-[#E6E0D4] bg-white p-4 md:grid-cols-2">
                  <label className="grid gap-2 text-sm font-black md:col-span-2">شريك التنفيذ
                    <select value={draft.partnerId} onChange={(event) => updateDraft(stage.id, { partnerId: event.target.value })} className="field font-normal">
                      <option value="">اختر الشريك</option>
                      {data.partners.map((partner) => <option key={partner.id} value={partner.id}>{partner.name} — {partner.email}</option>)}
                    </select>
                  </label>
                  <label className="grid gap-2 text-sm font-black">المهام — مهمة في كل سطر<textarea value={draft.tasks} onChange={(event) => updateDraft(stage.id, { tasks: event.target.value })} rows={4} className="field font-normal" /></label>
                  <label className="grid gap-2 text-sm font-black">التسليمات المطلوبة — عنصر في كل سطر<textarea value={draft.deliverables} onChange={(event) => updateDraft(stage.id, { deliverables: event.target.value })} rows={4} className="field font-normal" /></label>
                  <label className="grid gap-2 text-sm font-black">مستحق الشريك لهذه المرحلة<input value={draft.feeAmount} onChange={(event) => updateDraft(stage.id, { feeAmount: event.target.value })} type="number" min="0.01" step="0.01" required className="field font-normal" /></label>
                  <label className="grid gap-2 text-sm font-black">العملة<select value={draft.feeCurrency} onChange={(event) => updateDraft(stage.id, { feeCurrency: event.target.value })} className="field font-normal">{["USD", "EUR", "SYP", "TRY"].map((currency) => <option key={currency}>{currency}</option>)}</select></label>
                  <label className="grid gap-2 text-sm font-black md:col-span-2">موعد التسليم الداخلي<DateInput value={draft.dueAt} onChange={(event) => updateDraft(stage.id, { dueAt: event.target.value })} className="field font-normal" /></label>
                  <button disabled={busy === stage.id} className="rounded-xl bg-[#111827] px-5 py-3 font-black text-white disabled:opacity-50 md:col-span-2">{busy === stage.id ? "جارٍ الحفظ..." : "حفظ إسناد المرحلة"}</button>
                </form>
              )}
            </section>
          );
        })}
      </div>
    </details>
  );
}
