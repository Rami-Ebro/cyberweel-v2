"use client";

import { FormEvent, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, ExternalLink, FileUp, History, Paperclip, Send, Trash2, X } from "lucide-react";
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

type UploadedChunk = { url: string; size: number };

const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_TOTAL_SIZE = 30 * 1024 * 1024;
const UPLOAD_CHUNK_SIZE = 3 * 1024 * 1024;
const UPLOAD_INACTIVITY_TIMEOUT_MS = 20_000;

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

function fileKey(file: File) {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

function fileSize(size: number) {
  return size < 1024 * 1024 ? `${(size / 1024).toFixed(1)} KB` : `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function createFileId() {
  const value = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return value.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 80);
}

function uploadChunkViaApp(input: {
  endpoint: string;
  chunk: Blob;
  onProgress: (loaded: number) => void;
}) {
  return new Promise<UploadedChunk>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    let inactivityTimer: ReturnType<typeof setTimeout> | null = null;
    let settled = false;
    let timedOut = false;

    const clearTimer = () => {
      if (inactivityTimer) clearTimeout(inactivityTimer);
      inactivityTimer = null;
    };
    const armTimer = () => {
      clearTimer();
      inactivityTimer = setTimeout(() => {
        timedOut = true;
        xhr.abort();
      }, UPLOAD_INACTIVITY_TIMEOUT_MS);
    };
    const fail = (error: Error) => {
      if (settled) return;
      settled = true;
      clearTimer();
      reject(error);
    };
    const succeed = (value: UploadedChunk) => {
      if (settled) return;
      settled = true;
      clearTimer();
      resolve(value);
    };

    xhr.open("POST", input.endpoint);
    xhr.responseType = "json";
    xhr.setRequestHeader("Content-Type", "application/octet-stream");

    xhr.upload.onprogress = (event) => {
      armTimer();
      input.onProgress(event.loaded);
    };
    xhr.onload = () => {
      const payload = xhr.response && typeof xhr.response === "object" ? xhr.response as Record<string, unknown> : null;
      if (xhr.status >= 200 && xhr.status < 300 && typeof payload?.url === "string" && typeof payload?.size === "number") {
        succeed({ url: payload.url, size: payload.size });
        return;
      }
      fail(new Error(typeof payload?.error === "string" ? payload.error : `تعذر رفع جزء الملف (${xhr.status || "network"})`));
    };
    xhr.onerror = () => fail(new Error("تعذر الاتصال بخادم CyberWeel أثناء رفع الملف"));
    xhr.onabort = () => fail(new Error(timedOut ? "UPLOAD_STALLED" : "تم إلغاء رفع الملف"));

    armTimer();
    xhr.send(input.chunk);
  });
}

const subscribeToMount = () => () => {};

export function PartnerDeliveryWorkspace() {
  const mounted = useSyncExternalStore(subscribeToMount, () => true, () => false);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [busyText, setBusyText] = useState<Record<string, string>>({});
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null);
  const [submissions, setSubmissions] = useState<Record<string, Submission[]>>({});
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File[]>>({});

  useEffect(() => {
    if (!mounted) return;
    const syncGuard = () => {
      document.querySelectorAll<HTMLInputElement>('input[data-stage-progress="true"]').forEach((input) => {
        input.max = "99";
        input.title = "التقدم اليدوي يصل إلى 99٪. الإكمال يتم عبر إرسال تسليم المرحلة.";
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

  const assignments = useMemo(() => dashboard?.projects.filter((item) => Boolean(item.projectStageId)) || [], [dashboard]);
  const pendingCount = assignments.filter((item) => item.status === "REVIEW").length;

  function addFiles(assignmentId: string, list: FileList | null) {
    if (!list?.length) return;
    const current = selectedFiles[assignmentId] || [];
    const known = new Set(current.map(fileKey));
    const next = [...current];
    for (const file of Array.from(list)) {
      if (file.size > MAX_FILE_SIZE) return setError(`الملف «${file.name}» يتجاوز 10 MB.`);
      if (!known.has(fileKey(file))) {
        known.add(fileKey(file));
        next.push(file);
      }
    }
    if (next.length > MAX_FILES) return setError("يمكن إرفاق 5 ملفات كحد أقصى في كل تسليم.");
    if (next.reduce((sum, file) => sum + file.size, 0) > MAX_TOTAL_SIZE) return setError("إجمالي الملفات يجب ألا يتجاوز 30 MB.");
    setSelectedFiles((value) => ({ ...value, [assignmentId]: next }));
    setError("");
  }

  function removeFile(assignmentId: string, key: string) {
    setSelectedFiles((value) => ({ ...value, [assignmentId]: (value[assignmentId] || []).filter((file) => fileKey(file) !== key) }));
  }

  async function submitDelivery(event: FormEvent<HTMLFormElement>, assignment: Assignment) {
    event.preventDefault();
    if (dashboard?.isAdminPreview) return;
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const note = String(form.get("note") || "").trim();
    const links = String(form.get("links") || "").trim();
    const files = selectedFiles[assignment.id] || [];
    if (!note && !links && !files.length) return setError("أرسل ملاحظة تسليم أو رابطًا أو ملفًا واحدًا على الأقل.");

    setBusy(assignment.id);
    setUploadProgress((value) => ({ ...value, [assignment.id]: 0 }));
    setBusyText((value) => ({ ...value, [assignment.id]: files.length ? `جارٍ تجهيز رفع الملف 1 من ${files.length}...` : "جارٍ إرسال التسليم..." }));
    setError("");
    setNotice("");

    try {
      const uploadedFiles: Array<{ url: string; name: string; type: string }> = [];
      const totalUploadBytes = files.reduce((sum, file) => sum + file.size, 0);
      let completedUploadBytes = 0;

      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        const fileId = createFileId();
        const chunkCount = Math.ceil(file.size / UPLOAD_CHUNK_SIZE);
        const uploadedChunks: UploadedChunk[] = [];
        let completedFileBytes = 0;
        const uploadEndpoint = `/api/partner/stage-assignments/${encodeURIComponent(assignment.id)}/submissions/upload`;

        for (let chunkIndex = 0; chunkIndex < chunkCount; chunkIndex += 1) {
          const start = chunkIndex * UPLOAD_CHUNK_SIZE;
          const end = Math.min(file.size, start + UPLOAD_CHUNK_SIZE);
          const chunk = file.slice(start, end);
          const params = new URLSearchParams({
            action: "chunk",
            fileId,
            fileName: file.name,
            fileType: file.type || "application/octet-stream",
            totalSize: String(file.size),
            chunkIndex: String(chunkIndex),
          });

          setBusyText((value) => ({ ...value, [assignment.id]: `جارٍ رفع الملف ${index + 1} من ${files.length} — ${Math.round((completedFileBytes / file.size) * 100)}٪` }));

          try {
            const uploadedChunk = await uploadChunkViaApp({
              endpoint: `${uploadEndpoint}?${params.toString()}`,
              chunk,
              onProgress: (loaded) => {
                const fileLoaded = Math.min(file.size, completedFileBytes + loaded);
                const filePercentage = Math.max(0, Math.min(100, Math.round((fileLoaded / file.size) * 100)));
                const overallLoaded = completedUploadBytes + loaded;
                const overallPercentage = totalUploadBytes > 0
                  ? Math.max(0, Math.min(90, Math.round((overallLoaded / totalUploadBytes) * 90)))
                  : 90;
                setUploadProgress((value) => ({ ...value, [assignment.id]: overallPercentage }));
                setBusyText((value) => ({ ...value, [assignment.id]: `جارٍ رفع الملف ${index + 1} من ${files.length} — ${filePercentage}٪` }));
              },
            });
            uploadedChunks.push(uploadedChunk);
            completedFileBytes += chunk.size;
            completedUploadBytes += chunk.size;
            const completedPercentage = totalUploadBytes > 0
              ? Math.min(90, Math.round((completedUploadBytes / totalUploadBytes) * 90))
              : 90;
            setUploadProgress((value) => ({ ...value, [assignment.id]: completedPercentage }));
          } catch (uploadError) {
            if (uploadError instanceof Error && uploadError.message === "UPLOAD_STALLED") {
              throw new Error(`توقف رفع الملف «${file.name}» لأنه لم يحقق أي تقدم لمدة 20 ثانية عبر خادم CyberWeel. تحقق من الاتصال وحاول مجددًا.`);
            }
            throw uploadError;
          }
        }

        setBusyText((value) => ({ ...value, [assignment.id]: `جارٍ تثبيت الملف ${index + 1} من ${files.length}...` }));
        const manifestResponse = await fetch(`${uploadEndpoint}?action=manifest`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileId,
            fileName: file.name,
            fileType: file.type || "application/octet-stream",
            totalSize: file.size,
            chunks: uploadedChunks,
          }),
        });
        const manifestPayload = await manifestResponse.json().catch(() => null);
        if (!manifestResponse.ok || !manifestPayload?.url) {
          throw new Error(manifestPayload?.error || `تعذر تثبيت الملف «${file.name}»`);
        }

        uploadedFiles.push({
          url: manifestPayload.url,
          name: file.name,
          type: file.type || manifestPayload.type || "application/octet-stream",
        });
      }

      setUploadProgress((value) => ({ ...value, [assignment.id]: files.length ? 94 : 90 }));
      setBusyText((value) => ({ ...value, [assignment.id]: "جارٍ تثبيت التسليم لدى الإدارة..." }));
      const response = await fetch(`/api/partner/stage-assignments/${encodeURIComponent(assignment.id)}/submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note, links, files: uploadedFiles }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error || "تعذر إرسال التسليم");

      setUploadProgress((value) => ({ ...value, [assignment.id]: 100 }));
      setNotice(`✓ تم الإرسال بنجاح. النسخة ${payload.submission?.version || "الجديدة"} محفوظة لدى الإدارة وبانتظار المراجعة.`);
      setSelectedFiles((value) => ({ ...value, [assignment.id]: [] }));
      formElement.reset();
      await load();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "تعذر إرسال التسليم";
      setError(message.includes("413") || message.toLowerCase().includes("payload too large")
        ? "تعذر رفع الملفات بسبب حجم الطلب. حاول مجددًا بعد تحديث الصفحة."
        : message);
    } finally {
      setBusy(null);
      setBusyText((value) => {
        const next = { ...value };
        delete next[assignment.id];
        return next;
      });
      setUploadProgress((value) => {
        const next = { ...value };
        delete next[assignment.id];
        return next;
      });
    }
  }

  if (!mounted) return null;

  return createPortal(
    <>
      <button type="button" onClick={() => { setOpen(true); void load(); }} className="fixed bottom-6 left-6 z-[80] inline-flex items-center gap-2 rounded-2xl bg-[#111827] px-5 py-3.5 text-sm font-black text-white shadow-2xl transition hover:bg-[#9f7d3d]">
        <FileUp className="h-5 w-5" />تسليم المرحلة
        {pendingCount > 0 && <span className="rounded-full bg-violet-500 px-2 py-0.5 text-xs text-white">{pendingCount}</span>}
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-6" dir="rtl">
          <button aria-label="إغلاق" className="absolute inset-0" onClick={() => setOpen(false)} />
          <section className="relative z-10 max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-t-3xl bg-[#F7F3EB] shadow-2xl sm:rounded-3xl">
            <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[#D8D2C4] bg-[#F7F3EB]/95 p-5 backdrop-blur sm:p-7">
              <div><p className="text-xs font-black tracking-[0.12em] text-[#9A7D43]">تسليمات شركاء التنفيذ</p><h2 className="mt-1 text-2xl font-black text-[#111827]">أرسل العمل الحقيقي للمراجعة</h2><p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">التقدم اليدوي يتوقف عند 99٪. أرسل الملاحظة أو الروابط أو الملفات هنا، وستُحفظ كل نسخة مستقلة حتى تراجعها الإدارة.</p></div>
              <button onClick={() => setOpen(false)} className="rounded-xl border border-[#D8D2C4] bg-white p-2.5 text-slate-700"><X className="h-5 w-5" /></button>
            </header>

            <div className="grid gap-5 p-5 sm:p-7">
              {dashboard?.isAdminPreview && <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm font-bold text-blue-900">معاينة الإدارة للقراءة فقط. يمكنك رؤية سجل تسليمات الشريك دون إرسال نسخة باسمه.</div>}
              {error && <div role="alert" className="flex items-start gap-3 rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm font-bold text-rose-900"><span className="flex-1">{error}</span><button type="button" onClick={() => setError("")} aria-label="إغلاق رسالة الخطأ"><X className="h-4 w-4" /></button></div>}
              {notice && <div role="status" className="flex items-start gap-3 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm font-bold text-emerald-900"><span className="flex-1">{notice}</span><button type="button" onClick={() => setNotice("")} aria-label="إغلاق رسالة النجاح"><X className="h-4 w-4" /></button></div>}
              {loading && <div className="rounded-xl bg-white p-6 text-center font-bold text-slate-500">جارٍ تحميل التسليمات...</div>}
              {!loading && dashboard && !assignments.length && <div className="rounded-xl border border-dashed border-[#D8D2C4] bg-white p-8 text-center font-bold text-slate-500">لا توجد مرحلة مسندة إلى هذا الشريك حاليًا.</div>}

              {assignments.map((assignment) => {
                const history = submissions[assignment.id] || [];
                const latest = history[history.length - 1] || null;
                const waiting = latest?.status === "SUBMITTED" || assignment.status === "REVIEW";
                const approved = assignment.status === "COMPLETED" || ["APPROVED", "PAID"].includes(assignment.paymentStatus);
                const canSubmit = !dashboard?.isAdminPreview && !waiting && !approved && assignment.status !== "CANCELLED";
                const files = selectedFiles[assignment.id] || [];
                return (
                  <article key={assignment.id} className="rounded-2xl border border-[#D8D2C4] bg-white p-5 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div><h3 className="text-lg font-black text-[#111827]">{assignment.title}</h3><p className="mt-1 text-sm font-bold text-slate-500">{assignment.description}</p><p className="mt-2 text-xs text-slate-500">موعد التسليم: <DateText value={assignment.dueAt} fallback="غير محدد" /></p></div>
                      <div className="flex flex-wrap gap-2 text-xs font-black"><span className="rounded-full bg-[#F7F3EB] px-3 py-1.5">التقدم {assignment.progress}٪</span><span className="rounded-full bg-[#F7F3EB] px-3 py-1.5">{waiting ? "بانتظار المراجعة" : approved ? "معتمد" : "قيد العمل"}</span></div>
                    </div>

                    {latest?.status === "CHANGES_REQUESTED" && <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"><p className="font-black">طلبت الإدارة تعديلات على النسخة {latest.version}</p><p className="mt-2 whitespace-pre-wrap leading-7 font-bold">{latest.reviewNote || "راجع ملاحظات الإدارة وأرسل نسخة جديدة."}</p></div>}
                    {waiting && <div className="mt-4 grid gap-3 rounded-xl border border-violet-200 bg-violet-50 p-4 text-sm font-bold text-violet-900"><p>النسخة الحالية وصلت إلى الإدارة. لا يمكن استبدالها حتى يتم اعتمادها أو طلب تعديل عليها.</p><button type="button" disabled className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 font-black text-white"><CheckCircle2 className="h-5 w-5" />تم الإرسال</button></div>}
                    {approved && <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-900">تم اعتماد التسليم. أصبحت هذه النسخة جزءًا من السجل ولا يمكن تعديلها.</div>}

                    {canSubmit && (
                      <form onSubmit={(event) => void submitDelivery(event, assignment)} className="mt-4 grid gap-4 rounded-xl border border-[#E6E0D4] bg-[#FCFAF6] p-4">
                        <p className="font-black text-[#111827]">{latest?.status === "CHANGES_REQUESTED" ? `إرسال النسخة ${latest.version + 1}` : `إرسال ${history.length ? `النسخة ${history.length + 1}` : "التسليم الأول"}`}</p>
                        <label className="grid gap-2 text-sm font-black">ملاحظة التسليم<textarea name="note" rows={3} maxLength={4000} placeholder="اشرح باختصار ما تم إنجازه وما يجب أن تراجعه الإدارة" className="rounded-xl border border-[#D8D2C4] bg-white px-4 py-3 font-normal outline-none focus:border-[#B89A5A]" /></label>
                        <label className="grid gap-2 text-sm font-black">روابط التسليم — رابط في كل سطر<textarea name="links" rows={2} placeholder="https://..." className="rounded-xl border border-[#D8D2C4] bg-white px-4 py-3 font-normal outline-none focus:border-[#B89A5A]" /></label>

                        <div className="grid gap-3 rounded-xl border border-dashed border-[#CFC5B3] bg-white p-4">
                          <div className="flex items-center justify-between gap-3"><span className="inline-flex items-center gap-2 text-sm font-black"><Paperclip className="h-4 w-4 text-[#9A7D43]" />ملفات التسليم</span><span className="rounded-full bg-[#F7F3EB] px-3 py-1 text-xs font-black">{files.length} / {MAX_FILES}</span></div>
                          <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-xl border border-[#D8D2C4] bg-[#F7F3EB] px-4 py-2.5 text-sm font-black text-[#755D32]"><FileUp className="h-4 w-4" />إضافة ملفات<input type="file" multiple accept=".png,.jpg,.jpeg,.webp,.pdf,.zip,.txt,.csv,.docx,.xlsx,.pptx" className="sr-only" onChange={(event) => { addFiles(assignment.id, event.currentTarget.files); event.currentTarget.value = ""; }} /></label>
                          {files.length ? <div className="grid gap-2">{files.map((file) => <div key={fileKey(file)} className="flex items-center gap-3 rounded-xl border border-[#E6E0D4] bg-[#FCFAF6] px-3 py-2"><Paperclip className="h-4 w-4 shrink-0 text-[#9A7D43]" /><div className="min-w-0 flex-1"><p dir="auto" className="truncate text-sm font-black">{file.name}</p><p className="text-xs text-slate-500">{fileSize(file.size)}</p></div><button type="button" onClick={() => removeFile(assignment.id, fileKey(file))} className="rounded-lg bg-rose-50 p-2 text-rose-700" aria-label={`حذف ${file.name}`}><Trash2 className="h-4 w-4" /></button></div>)}</div> : <p className="text-xs text-slate-500">يمكنك اختيار صورتين أو أكثر على دفعات، حتى 5 ملفات.</p>}
                          <span className="text-xs text-slate-500">10 MB للملف الواحد، و30 MB كحد إجمالي. تُقسم الملفات إلى أجزاء آمنة وتُرفع عبر خادم CyberWeel نفسه، ثم يُرسل سجل التسليم إلى الإدارة.</span>
                        </div>

                        {busy === assignment.id && (
                          <div className="grid gap-2 rounded-xl border border-[#D8D2C4] bg-white p-3">
                            <div className="flex items-center justify-between gap-3 text-xs font-black text-[#111827]">
                              <span>{busyText[assignment.id] || "جارٍ الإرسال..."}</span>
                              <span>{Math.round(uploadProgress[assignment.id] || 0)}٪</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-[#E6E0D4]">
                              <div
                                className="h-full bg-[#B89A5A] transition-[width] duration-200"
                                style={{ width: `${Math.max(0, Math.min(100, uploadProgress[assignment.id] || 0))}%` }}
                              />
                            </div>
                            <p className="text-[11px] font-bold text-slate-500">إذا توقف النقل بلا أي تقدم لمدة 20 ثانية، سيُلغى تلقائيًا وتظهر رسالة السبب بدل أن يبقى عالقًا.</p>
                          </div>
                        )}

                        <button
                          type="submit"
                          disabled={busy === assignment.id}
                          className={`inline-flex items-center justify-center gap-2 rounded-xl border px-5 py-3 font-black transition ${busy === assignment.id ? "border-[#D8D2C4] bg-white text-[#111827]" : "border-[#111827] bg-[#111827] text-white hover:border-[#9f7d3d] hover:bg-[#9f7d3d]"}`}
                        >
                          <Send className="h-4 w-4" />
                          {busy === assignment.id ? (busyText[assignment.id] || "جارٍ الإرسال...") : "إرسال التسليم إلى الإدارة"}
                        </button>
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
                              {!!submission.files.length && <div className="mt-3 grid gap-2 sm:grid-cols-2">{submission.files.map((file) => <a key={file.path} href={file.path} target="_blank" rel="noreferrer noopener" className="inline-flex min-w-0 items-center gap-2 rounded-lg bg-white/80 px-3 py-2 text-xs font-black underline"><FileUp className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{file.name}</span></a>)}</div>}
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
