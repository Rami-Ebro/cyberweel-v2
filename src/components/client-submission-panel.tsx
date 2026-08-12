"use client";

import { upload } from "@vercel/blob/client";
import { FilePlus2, Link2, Send, Trash2 } from "lucide-react";
import { type FormEvent, useRef, useState } from "react";
import { DateText } from "@/components/ui/date-text";
import { MAX_SUBMISSION_FILES, MAX_SUBMISSION_FILE_SIZE, SUBMISSION_ALLOWED_EXTENSIONS } from "@/lib/client-submissions";
import { dashboardErrorMessage, dashboardLabel } from "@/lib/dashboard-labels";

type ProjectOption = { id: string; title: string };
type SubmissionFile = { id: string; name: string; url: string; size: number | null };
export type ClientSubmissionView = {
  id: string;
  projectId: string;
  projectTitle: string;
  note: string | null;
  links: string[];
  status: string;
  createdAt: string;
  files: SubmissionFile[];
};

const statusLabels: Record<string, string> = {
  RECEIVED: "تم الاستلام",
  REVIEWED: "تمت المراجعة",
  APPROVED: "معتمد",
  NEEDS_MORE_INFO: "يحتاج استكمالًا",
  ARCHIVED: "مؤرشف",
};

function fileIdentity(file: File) {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

export function ClientSubmissionPanel({
  projects,
  submissions,
  clientId,
  canSubmit,
  onSubmitted,
}: {
  projects: ProjectOption[];
  submissions: ClientSubmissionView[];
  clientId: string;
  canSubmit: boolean;
  onSubmitted: () => Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");

  function chooseFiles(files: FileList | null) {
    const combined = [...selectedFiles, ...Array.from(files || [])].filter(
      (file, index, all) => all.findIndex((candidate) => fileIdentity(candidate) === fileIdentity(file)) === index,
    );
    if (combined.length > MAX_SUBMISSION_FILES) return setMessage(`يمكن رفع ${MAX_SUBMISSION_FILES} ملفًا في كل إرسال`);
    const invalid = combined.find((file) => {
      const extension = file.name.split(".").pop()?.toLowerCase() || "";
      return file.size <= 0 || file.size > MAX_SUBMISSION_FILE_SIZE || !SUBMISSION_ALLOWED_EXTENSIONS.has(extension);
    });
    if (invalid) return setMessage(`الملف ${invalid.name} غير مدعوم أو أكبر من 25 ميغابايت`);
    setMessage("");
    setSelectedFiles(combined);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const links = String(data.get("links") || "").split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
    const note = String(data.get("note") || "").trim();
    if (!selectedFiles.length && !links.length && !note) return setMessage("أضف ملفًا أو رابطًا أو ملاحظة قبل الإرسال");

    setSending(true);
    setMessage("");
    try {
      const createResponse = await fetch("/api/client/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: data.get("projectId"), note, links }),
      });
      const created = await createResponse.json().catch(() => null);
      if (!createResponse.ok) throw new Error(dashboardErrorMessage(created?.error, "تعذر بدء الإرسال"));

      const submissionId = created.submission.id as string;
      const projectId = String(data.get("projectId"));
      const uploadedFiles: Array<{ url: string; name: string; size: number }> = [];
      for (const file of selectedFiles) {
        const cleanName = file.name.replace(/[^\p{L}\p{N}._-]+/gu, "-");
        const blob = await upload(`clients/${clientId}/submissions/${submissionId}/${crypto.randomUUID()}-${cleanName}`, file, {
          access: "private",
          handleUploadUrl: "/api/client/submissions/upload",
          clientPayload: JSON.stringify({
            clientId,
            projectId,
            submissionId,
            originalName: file.name,
            size: file.size,
          }),
          multipart: file.size > 5 * 1024 * 1024,
        });
        uploadedFiles.push({ url: blob.url, name: file.name, size: file.size });
      }

      const completeResponse = await fetch(`/api/client/submissions/${submissionId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: uploadedFiles }),
      });
      const completed = await completeResponse.json().catch(() => null);
      if (!completeResponse.ok) throw new Error(dashboardErrorMessage(completed?.error, "تعذر إكمال الإرسال"));

      form.reset();
      setSelectedFiles([]);
      setMessage("تم إرسال المواد وإشعار الإدارة بنجاح");
      await onSubmitted();
    } catch (error) {
      setMessage(dashboardErrorMessage(error instanceof Error ? error.message : null, "تعذر إرسال المواد أو رفع الملفات"));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="grid gap-6">
      {canSubmit && (
        <form onSubmit={submit} className="grid gap-4 rounded-2xl border border-[#D8D2C4] bg-white p-5 shadow-sm">
          <div><h3 className="text-xl font-black">إرسال ملفات وروابط للمشروع</h3><p className="mt-1 text-sm text-slate-500">للصور، قوائم المنتجات، المستندات والروابط التي يحتاجها فريق CyberWeel.</p></div>
          <label className="grid gap-2 font-bold">المشروع<select name="projectId" required className="field font-normal"><option value="">اختر المشروع</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}</select></label>
          <label className="grid gap-2 font-bold">ملاحظة — اختيارية<textarea name="note" maxLength={2000} rows={3} placeholder="مثال: صور المجموعة الصيفية وملف الأسعار" className="field font-normal" /></label>
          <label className="grid gap-2 font-bold">الروابط — رابط في كل سطر<textarea name="links" rows={3} placeholder="رابط Google Drive أو صفحة مرجعية" className="field font-normal" dir="ltr" /></label>
          <div className="rounded-xl border border-dashed border-[#B89A5A] bg-[#F7F3EB] p-4">
            <label className="flex cursor-pointer items-center gap-3 font-black"><FilePlus2 className="h-5 w-5" />اختيار صور أو ملفات<input ref={inputRef} type="file" multiple className="sr-only" accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.png,.jpg,.jpeg,.webp,.txt" onChange={(event) => chooseFiles(event.target.files)} /></label>
            <p className="mt-2 text-xs text-slate-500">حتى 20 ملفًا، وبحد أقصى 25 ميغابايت للملف.</p>
            {!!selectedFiles.length && <div className="mt-4 grid gap-2">{selectedFiles.map((file, index) => <div key={fileIdentity(file)} className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 text-sm"><span className="min-w-0 truncate">{file.name}</span><button type="button" aria-label={`إزالة ${file.name}`} onClick={() => setSelectedFiles((items) => items.filter((_, itemIndex) => itemIndex !== index))} className="shrink-0 text-red-600"><Trash2 className="h-4 w-4" /></button></div>)}</div>}
          </div>
          {message && <p role="status" className="rounded-lg bg-[#F7F3EB] p-3 text-sm font-bold">{message}</p>}
          <button disabled={sending || !projects.length} className="flex w-fit items-center gap-2 rounded-xl bg-[#111827] px-5 py-3 font-black text-white disabled:opacity-50"><Send className="h-4 w-4" />{sending ? "جارٍ الرفع والإرسال..." : "إرسال المواد"}</button>
        </form>
      )}

      <section><h3 className="text-xl font-black">{canSubmit ? "المواد التي أرسلتها" : "المواد المرسلة من العميل"}</h3><div className="mt-4 grid gap-3">{submissions.map((submission) => <article key={submission.id} className="rounded-2xl border border-[#D8D2C4] bg-white p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><strong>{submission.projectTitle}</strong><p className="mt-1 text-xs text-slate-500"><DateText value={submission.createdAt} withTime /></p></div><span className="rounded-full bg-[#F7F3EB] px-3 py-1 text-xs font-black text-[#9A7D43]">{statusLabels[submission.status] || dashboardLabel(submission.status, "حالة غير معروفة")}</span></div>{submission.note && <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-600">{submission.note}</p>}{!!submission.links.length && <div className="mt-4 grid gap-2">{submission.links.map((link) => <a key={link} href={link} target="_blank" rel="noreferrer" dir="ltr" className="flex items-center gap-2 break-all text-left text-sm font-bold text-[#9A7D43] underline"><Link2 className="h-4 w-4 shrink-0" />{link}</a>)}</div>}{!!submission.files.length && <div className="mt-4 grid gap-2 sm:grid-cols-2">{submission.files.map((file) => <a key={file.id} href={file.url} target="_blank" rel="noreferrer" className="rounded-lg bg-[#F7F3EB] px-3 py-3 text-sm font-bold hover:ring-1 hover:ring-[#B89A5A]">{file.name}</a>)}</div>}</article>)}{!submissions.length && <p className="rounded-2xl border border-dashed border-[#D8D2C4] bg-white p-8 text-center text-slate-500">لم تُرسل مواد للمشروع بعد.</p>}</div></section>
    </div>
  );
}
