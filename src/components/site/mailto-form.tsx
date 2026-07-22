"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { CheckCircle2, Paperclip, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/site/i18n";

type Field =
  | { kind: "text"; name: string; label: string; placeholder?: string; required?: boolean; full?: boolean; type?: string }
  | { kind: "textarea"; name: string; label: string; placeholder?: string; required?: boolean; full?: boolean; rows?: number };

type MailtoFormProps = {
  to: string;
  subject: string;
  fields: Field[];
  submitLabel?: string;
  successMessage?: string;
  className?: string;
  allowAttachments?: boolean;
};

const MAX_FILES = 3;
const MAX_TOTAL_BYTES = 4 * 1024 * 1024;
const ACCEPTED_FILES = ".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp";

export function MailtoForm({
  to,
  subject,
  fields,
  submitLabel = "Send",
  successMessage,
  className,
  allowAttachments = false,
}: MailtoFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const { t } = useI18n();
  const isArabic = t.dir === "rtl";

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;

    if (!form.reportValidity()) return;

    if (selectedFiles.length > MAX_FILES) {
      toast.error(isArabic ? "يمكن رفع 3 ملفات كحد أقصى" : "You can upload up to 3 files");
      return;
    }

    const totalBytes = selectedFiles.reduce((sum, file) => sum + file.size, 0);
    if (totalBytes > MAX_TOTAL_BYTES) {
      toast.error(isArabic ? "يجب ألا يتجاوز مجموع الملفات 4 ميغابايت" : "Files must total no more than 4 MB");
      return;
    }

    setSubmitting(true);
    const data = new FormData(form);
    const requestData = new FormData();

    requestData.set("subject", subject);
    requestData.set("website", String(data.get("website") ?? ""));
    requestData.set(
      "fields",
      JSON.stringify(
        fields.map((field) => ({
          name: field.name,
          label: field.label,
          value: String(data.get(field.name) ?? "").trim(),
        })),
      ),
    );

    selectedFiles.forEach((file) => requestData.append("attachments", file));

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        body: requestData,
      });

      const result = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;

      if (!response.ok || !result?.ok) {
        throw new Error(result?.error || "SEND_FAILED");
      }

      form.reset();
      setSelectedFiles([]);
      setSubmitted(true);
    } catch {
      toast.error(
        isArabic ? "تعذر إرسال الرسالة الآن" : "We couldn't send your message right now",
        {
          description: isArabic
            ? `يمكنك مراسلتنا مباشرة على ${to}`
            : `You can email us directly at ${to}`,
        },
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div
        role="status"
        aria-live="polite"
        className={cn(
          "flex min-h-80 flex-col items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50/70 px-6 py-12 text-center",
          className,
        )}
      >
        <span className="grid size-16 place-items-center rounded-full bg-emerald-100 text-emerald-700">
          <CheckCircle2 className="size-9" strokeWidth={2.2} />
        </span>
        <h3 className="mt-5 font-display text-2xl font-semibold text-ink">
          {isArabic ? "تم إرسال رسالتك بنجاح" : "Your message was sent successfully"}
        </h3>
        <p className="mt-3 max-w-md text-base leading-8 text-muted-foreground">
          {successMessage ??
            (isArabic
              ? "سنراجع رسالتك ونتواصل معك في أقرب وقت مناسب."
              : "We will review your message and get back to you as soon as possible.")}
        </p>
        <button
          type="button"
          onClick={() => setSubmitted(false)}
          className="focus-ring mt-8 rounded-md border border-border bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:border-camel/50 hover:bg-muted/40"
        >
          {isArabic ? "إرسال رسالة أخرى" : "Send another message"}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-6", className)}>
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />

      <div className="grid gap-6 sm:grid-cols-2">
        {fields.map((f) => (
          <div key={f.name} className={cn(f.full && "sm:col-span-2")}>
            <label htmlFor={f.name} className="mb-2 block text-sm font-medium text-ink">
              {f.label}
              {f.required && <span className="ml-1 text-accent">*</span>}
            </label>
            {f.kind === "text" ? (
              <input
                id={f.name}
                name={f.name}
                type={f.type ?? "text"}
                required={f.required}
                placeholder={f.placeholder}
                className="focus-ring h-12 w-full rounded-md border border-border bg-white px-4 text-sm text-ink shadow-sm transition-all duration-200 placeholder:text-muted-foreground/60 focus:border-camel focus:shadow-md focus:shadow-camel/10"
              />
            ) : (
              <textarea
                id={f.name}
                name={f.name}
                required={f.required}
                placeholder={f.placeholder}
                rows={f.rows ?? 5}
                className="focus-ring w-full resize-y rounded-md border border-border bg-white px-4 py-3 text-sm text-ink shadow-sm transition-all duration-200 placeholder:text-muted-foreground/60 focus:border-camel focus:shadow-md focus:shadow-camel/10"
              />
            )}
          </div>
        ))}
      </div>

      {allowAttachments && (
        <div>
          <label htmlFor="attachments" className="mb-2 block text-sm font-medium text-ink">
            {isArabic ? "إرفاق ملفات" : "Attach files"}
          </label>
          <label
            htmlFor="attachments"
            className="focus-ring flex cursor-pointer items-center gap-3 rounded-md border border-dashed border-border bg-muted/30 px-4 py-4 text-sm text-muted-foreground transition-colors hover:border-camel/50 hover:bg-muted/50"
          >
            <Paperclip className="h-4 w-4 text-accent" />
            <span>
              {selectedFiles.length
                ? isArabic
                  ? `تم اختيار ${selectedFiles.length} ملف`
                  : `${selectedFiles.length} file(s) selected`
                : isArabic
                  ? "اختر ملفات تساعدنا على فهم رسالتك"
                  : "Choose files that help us understand your message"}
            </span>
          </label>
          <input
            id="attachments"
            name="attachments"
            type="file"
            multiple
            accept={ACCEPTED_FILES}
            className="sr-only"
            onChange={(event) => setSelectedFiles(Array.from(event.target.files ?? []).slice(0, MAX_FILES))}
          />
          <p className="mt-2 text-xs text-muted-foreground">
            {isArabic
              ? "حتى 3 ملفات بصيغة PDF أو Word أو Excel أو صورة، وبإجمالي 4 ميغابايت"
              : "Up to 3 PDF, Word, Excel, or image files, 4 MB total"}
          </p>
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">{t.common.noPitches}</p>
        <button
          type="submit"
          disabled={submitting}
          className="focus-ring inline-flex items-center justify-center gap-2 rounded-md bg-ink px-7 py-3.5 text-sm font-medium text-floral transition-colors hover:bg-ink/90 disabled:cursor-wait disabled:opacity-60"
        >
          {submitting
            ? isArabic
              ? "جارٍ الإرسال..."
              : "Sending..."
            : submitLabel}
          <Send className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}
