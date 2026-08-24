"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ExternalLink, FileUp, History, Send, X } from "lucide-react";
import { DateText } from "@/components/ui/date-text";

type Submission = {
  id: string;
  assignmentId: string;
  version: number;
  note: string | null;
  links: string[];
  files: Array<{ name: string; type: string | null; path: string }>;
  status: "SUBMITTED" | "CHANGES_REQUESTED" | "APPROVED";
  reviewNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
};

type Assignment = {
  id: string;
  projectStageId?: string;
  title: string;
  description: string | null;
  status: string;
  progress: number;
  paymentStatus: "PENDING" | "APPROVED" | "PAID" | "CANCELLED";
  dueAt: string | null;
};

type DashboardPayload = {
  isAdminPreview: boolean;
  projects: Assignment[];
};

const statusLabel: Record<Submission["status"], string> = {
  SUBMITTED: "بانتظار مراجعة الإدارة",
  CHANGES_REQUESTED: "مطلوب تعديل",
  APPROVED: "معتمد",
};

const statusClass: Record<Submission["status"], string> = {
  SUBMITTED: "border-violet-200 bg-violet-50 text-violet-900",
  CHANGES_REQUESTED: "border-amber-200 bg-amber-50 text-amber-900",
  APPROVED: "border-emerald-200 bg-emerald-50 text-emerald-900",
};

export function PartnerDeliveryWorkspace() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null);
  const [submissions, setSubmissions] = useState<Record<string, Submission[]>>({});

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    const syncGuard = () => {
      document.querySelectorAll<HTMLInputElement>('input[aria-label="نسبة تقدم المشروع"]').forEach((input) => {
        input.max = "99";
        input.title = "التقدم اليدوي يصل إلى 99٪. الإكمال يتم عبر إرسال تسليم المرحلة.";
      });
      document.querySelectorAll<HTMLInputElement>('input[type="number"][max="100"]').forEach((input) => {
        if (input.closest("main")) input.max = "99";
      });
      document.querySelectorAll<HTMLButtonElement>("button").forEach((button) => {
        if (button.textContent?.trim() === "إرسال للمراجعة") {
          button.disabled = true;
          button.textContent = "استخدم «تسليم المرحلة»";
          button.title = "أرسل ملاحظة أو رابطًا أو ملفًا من زر تسليم المرحلة.";
        }
      });
      document.querySelectorAll<HTMLParagraphElement>("p").forEach((paragraph) => {
        if (paragraph.textContent?.includes("عند 100٪ ينتقل التسليم إلى مراجعة الإدارة")) {
          paragraph.textContent = "حدّث التقدم حتى 99٪. عند اكتمال العمل أرسل تسليمًا حقيقيًا من زر «تسليم المرحلة»؛ عندها فقط ينتقل العمل إلى مراجعة الإدارة.";
        }
      });
    };
    syncGuard();
    const observer = new MutationObserver(syncGuard);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [mounted]);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const previewId = new URLSearchParams(window.location.search).get("adminPreview");
      const endpoint = previewId ? `/api/partner/dashboard?adminPreview=${encodeURIComponent(previewId)}` : "/api/partner/dashboard";
      const response = await fetch(endpoint, { cache: "no-store" });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error || "تعذر تحميل إسنادات الشريك");
      setDashboard(payload);

      const structured = (payload.projects as Assignment[]).filter((item) => Boolean(item.projectStageId));
      const pairs = await Promise.all(structured.map(async (assignment) => {
        const result = await fetch(`/api/partner/stage-assignments/${encodeURIComponent(assignment.id)}/submissions`, { cache: "no-store" });
        const body = await result.json().catch(() => null);
        return [assignment.id, result.ok && Array.isArray(body?.submissions) ? body.submissions : []] as const;
      }));
      setSubmissions(Object.fromEntries(pairs));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذر تحميل مساحة التسليم");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) void load();
  }, [open]);

  const assignments = useMemo(() => dashboard?.projects.filter((item) => Boolean(item.projectStageId)) || [], [dashboard]);
  const pendingCount = assignments.filter((item) => item.status === "REVIEW").length;

  async function submitDelivery(event: FormEvent<HTMLFormElement>, assignment: Assignment) {
    event.preventDefault();
    if (dashboard?.isAdminPreview) return;
    const form = new FormData(event.currentTarget);
    const note = String(form.get("note") || "").trim();
    const links = String(form.get("links") || "").trim();
    const files = form.getAll("files").filter((item) => item instanceof File && item.size > 0);
    if (!note && !links && !files.length) return setError("أرسل ملاحظة تسليم أو رابطًا أو ملفًا واحدًا على الأقل.");

    setBusy(assignment.id);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/partner/stage-assignments/${encodeURIComponent(assignment.id)}/submissions`, {
        method: "POST",
        body: form,
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error || "تعذر إرسال التسليم");
      setNotice(`✓ تم إرسال النسخة ${payload.submission?.version || "الجديدة"} إلى الإدارة. أصبح التقدم 100٪ وبانتظار المراجعة.`);
      event.currentTarget.reset();
      await load();
      window.setTimeout(() => window.location.reload(), 900);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذر إرسال التسليم");
    } finally {
      setBusy(null);
    }
  }

  if (!mounted) return null;

  return createPortal(
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 left-6 z-[80] inline-flex items-center gap-2 rounded-2xl bg-[#111827] px-5 py-3.5 text-sm font-black text-white shadow-2xl transition hover:bg-[#9f7d3d]"
      >
        <FileUp className="h-5 w-5" />
        تسليم المرحلة
        {pendingCount > 0 && <span className="rounded-full bg-violet-500 px-2 py-0.5 text-xs text-white">{pendingCount}</span>}
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-6" dir="rtl">
          <button aria-label="إغلاق" className="absolute inset-0" onClick={() => setOpen(false)} />
          <section className="relative z-10 max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-t-3xl bg-[#F7F3EB] shadow-2xl sm:rounded-3xl">
            <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[#D8D2C4] bg-[#F7F3EB]/95 p-5 backdrop-blur sm:p-7">
              <div>
                <p className="text-xs font-black tracking-[0.12em] text-[#9A7D43]">تسليمات شركاء التنفيذ</p>
                <h2 className="mt-1 text-2xl font-black text-[#111827]">أرسل العمل الحقيقي للمراجعة</h2>
                <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">التقدم اليدوي يتوقف عند 99٪. الملاحظة أو الرابط أو الملف هنا هو الذي يحول المرحلة إلى 100٪ وبانتظار مراجعة الإدارة. كل نسخة محفوظة ولا تضيع النسخ السابقة.</p>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-xl border border-[#D8D2C4] bg-white p-2.5 text-slate-700"><X className="h-5 w-5" /></button>
            </header>

            <div className="grid gap-5 p-5 sm:p-7">
              {dashboard?.isAdminPreview && <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm font-bold text-blue-900">معاينة الإدارة للقراءة فقط. يمكنك رؤية سجل تسليمات الشريك دون إرسال نسخة باسمه.</div>}
              {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-800">{error}</div>}
              {notice && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-900">{notice}</div>}
              {loading && <div className="rounded-xl bg-white p-6 text-center font-bold text-slate-500">جارٍ تحميل التسليمات...</div>}
              {!loading && dashboard && !assignments.length && <div className="rounded-xl border border-dashed border-[#D8D2C4] bg-white p-8 text-center font-bold text-slate-500">لا توجد مرحلة مسندة إلى هذا الشريك حاليًا.</div>}

              {assignments.map((assignment) => {
                const history = submissions[assignment.id] || [];
                const latest = history[history.length - 1] || null;
                const waiting = latest?.status === "SUBMITTED" || assignment.status === "REVIEW";
                const approved = assignment.status === "COMPLETED" || ["APPROVED", "PAID"].includes(assignment.paymentStatus);
                const canSubmit = !dashboard?.isAdminPreview && !waiting && !approved && assignment.status !== "CANCELLED";
                return (
                  <article key={assignment.id} className="rounded-2xl border border-[#D8D2C4] bg-white p-5 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-black text-[#111827]">{assignment.title}</h3>
                        <p className="mt-1 text-sm font-bold text-slate-500">{assignment.description}</p>
                        <p className="mt-2 text-xs text-slate-500">موعد التسليم: <DateText value={assignment.dueAt} fallback="غير محدد" /></p>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs font-black">
                        <span className="rounded-full bg-[#F7F3EB] px-3 py-1.5">التقدم {assignment.progress}٪</span>
                        <span className="rounded-full bg-[#F7F3EB] px-3 py-1.5">{waiting ? "بانتظار المراجعة" : approved ? "معتمد" : "قيد العمل"}</span>
                      </div>
                    </div>

                    {latest?.status === "CHANGES_REQUESTED" && (
                      <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
                        <p className="font-black">طلبت الإدارة تعديلات على النسخة {latest.version}</p>
                        <p className="mt-2 whitespace-pre-wrap leading-7 font-bold">{latest.reviewNote || "راجع ملاحظات الإدارة وأرسل نسخة جديدة."}</p>
                      </div>
                    )}
                    {waiting && <div className="mt-4 rounded-xl border border-violet-200 bg-violet-50 p-4 text-sm font-bold text-violet-900">النسخة الحالية وصلت إلى الإدارة. لا يمكن استبدالها حتى يتم اعتمادها أو طلب تعديل عليها.</div>}
                    {approved && <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-900">تم اعتماد التسليم. أصبحت هذه النسخة جزءًا من السجل ولا يمكن تعديلها.</div>}

                    {canSubmit && (
                      <form onSubmit={(event) => void submitDelivery(event, assignment)} className="mt-4 grid gap-3 rounded-xl border border-[#E6E0D4] bg-[#FCFAF6] p-4">
                        <p className="font-black text-[#111827]">{latest?.status === "CHANGES_REQUESTED" ? `إرسال النسخة ${latest.version + 1}` : `إرسال ${history.length ? `النسخة ${history.length + 1}` : "التسليم الأول"}`}</p>
                        <label className="grid gap-2 text-sm font-black">ملاحظة التسليم<textarea name="note" rows={3} maxLength={4000} placeholder="اشرح باختصار ما تم إنجازه وما يجب أن تراجعه الإدارة" className="rounded-xl border border-[#D8D2C4] bg-white px-4 py-3 font-normal outline-none focus:border-[#B89A5A]" /></label>
                        <label className="grid gap-2 text-sm font-black">روابط التسليم — رابط في كل سطر<textarea name="links" rows={2} placeholder="https://..." className="rounded-xl border border-[#D8D2C4] bg-white px-4 py-3 font-normal outline-none focus:border-[#B89A5A]" /></label>
                        <label className="grid gap-2 text-sm font-black">ملفات التسليم — حتى 5 ملفات<input name="files" type="file" multiple accept=".png,.jpg,.jpeg,.webp,.pdf,.zip,.txt,.csv,.docx,.xlsx,.pptx" className="rounded-xl border border-[#D8D2C4] bg-white px-4 py-3 font-normal" /><span className="text-xs font-normal text-slate-500">10 MB للملف الواحد، و30 MB كحد إجمالي.</span></label>
                        <button disabled={busy === assignment.id} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#111827] px-5 py-3 font-black text-white disabled:opacity-50"><Send className="h-4 w-4" />{busy === assignment.id ? "جارٍ الإرسال..." : "إرسال التسليم إلى الإدارة"}</button>
                      </form>
                    )}

                    {!!history.length && (
                      <details className="mt-4 rounded-xl border border-[#E6E0D4] bg-white">
                        <summary className="flex cursor-pointer list-none items-center gap-2 p-4 text-sm font-black text-[#9A7D43]"><History className="h-4 w-4" />سجل النسخ ({history.length})</summary>
                        <div className="grid gap-3 border-t border-[#E6E0D4] p-4">
                          {history.slice().reverse().map((submission) => (
                            <div key={submission.id} className={`rounded-xl border p-4 ${statusClass[submission.status]}`}>
                              <div className="flex flex-wrap items-center justify-between gap-2"><strong>النسخة {submission.version}</strong><span className="rounded-full bg-white/70 px-2.5 py-1 text-xs font-black">{statusLabel[submission.status]}</span></div>
                              <DateText value={submission.createdAt} className="mt-1 block text-xs opacity-70" />
                              {submission.note && <p className="mt-3 whitespace-pre-wrap text-sm leading-7">{submission.note}</p>}
                              {!!submission.links.length && <div className="mt-3 grid gap-1">{submission.links.map((link) => <a key={link} href={link} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 break-all text-sm font-bold underline"><ExternalLink className="h-3.5 w-3.5" />{link}</a>)}</div>}
                              {!!submission.files.length && <div className="mt-3 flex flex-wrap gap-2">{submission.files.map((file) => <a key={file.path} href={file.path} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 rounded-lg bg-white/80 px-3 py-2 text-xs font-black underline"><FileUp className="h-3.5 w-3.5" />{file.name}</a>)}</div>}
                              {submission.reviewNote && <div className="mt-3 rounded-lg bg-white/70 p-3 text-sm"><strong>ملاحظة الإدارة:</strong><p className="mt-1 whitespace-pre-wrap leading-6">{submission.reviewNote}</p></div>}
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </>,
    document.body,
  );
}
