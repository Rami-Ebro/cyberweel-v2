"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { CheckCircle2, Paperclip, Send, Share2, X } from "lucide-react";
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
  trackReferral?: boolean;
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
  trackReferral = false,
}: MailtoFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const { t } = useI18n();
  const isArabic = t.dir === "rtl";

  const handleShare = async () => {
    const shareData = {
      title: document.title,
      text: isArabic
        ? "شارك CyberWeel مع شخص لديه مشكلة أو مشروع يحتاج إلى خطوة واضحة."
        : "Share CyberWeel with someone who has a challenge or project and needs a clear next step.",
      url: window.location.origin,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }

      await navigator.clipboard.writeText(window.location.origin);
      toast.success(isArabic ? "تم نسخ رابط المشاركة" : "Share link copied");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      toast.error(isArabic ? "تعذرت المشاركة الآن" : "Sharing is unavailable right now");
    }
  };

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

      if (trackReferral) {
        const organization = String(data.get("organization") ?? "").trim();
        const details = fields
          .filter((field) => !["name", "email", "phone", "organization"].includes(field.name))
          .map((field) => {
            const value = String(data.get(field.name) ?? "").trim();
            return value ? `${field.label}: ${value}` : "";
          })
          .filter(Boolean);

        if (organization) details.unshift(`${isArabic ? "المؤسسة" : "Organization"}: ${organization}`);

        const referralCode = new URLSearchParams(window.location.search).get("ref")?.trim() || "";
        const referralResponse = await fetch("/api/referrals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: String(data.get("name") ?? organization).trim(),
            email: String(data.get("email") ?? "").trim(),
            phone: String(data.get("phone") ?? "").trim(),
            notes: details.join("\n\n"),
            referralCode,
          }),
        });

        const referralResult = (await referralResponse.json().catch(() => null)) as
          | { ok?: boolean; attributed?: boolean; error?: string }
          | null;

        if (!referralResponse.ok || !referralResult?.ok) {
          throw new Error(referralResult?.error || "REFERRAL_FAILED");
        }

        if (referralCode && referralResult.attributed !== true) {
          throw new Error("REFERRAL_NOT_ATTRIBUTED");
        }
      }

      form.reset();
      setSelectedFiles([]);
      setSuccessOpen(true);
    } catch (error) {
      console.error("[mailto-form] Submission failed", error);
      toast.error(
        isArabic ? "تعذر إرسال الطلب كاملًا الآن" : "We couldn't complete your request right now",
        {
          description: isArabic
            ? `لم نؤكد تسجيل الطلب. يمكنك مراسلتنا مباشرة على ${to}`
            : `We could not confirm the request. You can email us directly at ${to}`,
        },
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
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

      {successOpen && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-[#111827]/65 px-4 py-8 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="submission-success-title">
          <button type="button" aria-label={isArabic ? "إغلاق نافذة النجاح" : "Close success dialog"} className="absolute inset-0 cursor-default" onClick={() => setSuccessOpen(false)} />
          <section dir={isArabic ? "rtl" : "ltr"} className="relative z-10 w-full max-w-lg rounded-3xl border border-emerald-200 bg-white p-7 text-center shadow-2xl sm:p-9">
            <button type="button" onClick={() => setSuccessOpen(false)} className="absolute left-4 top-4 grid h-10 w-10 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100" aria-label={isArabic ? "إغلاق" : "Close"}>
              <X className="h-5 w-5" />
            </button>

            <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-emerald-100 text-emerald-700 ring-8 ring-emerald-50">
              <CheckCircle2 className="h-11 w-11" strokeWidth={2.2} />
            </span>

            <p className="mt-6 text-sm font-extrabold text-emerald-700">{isArabic ? "تم الإرسال بنجاح" : "Sent successfully"}</p>
            <h2 id="submission-success-title" className="mt-2 text-3xl font-black text-ink">
              {isArabic ? "شكرًا لك" : "Thank you"}
            </h2>
            <p className="mt-4 text-base leading-8 text-muted-foreground">
              {successMessage ??
                (isArabic
                  ? "وصل طلبك بنجاح، وسنراجعه ونتواصل معك قريبًا."
                  : "Your request was received successfully. We will review it and contact you soon.")}
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              {isArabic
                ? "ساعد شخصًا تحبه أو شخصًا لديه مشكلة مشابهة، وشارك معه CyberWeel."
                : "Help someone you care about, or someone facing a similar challenge, by sharing CyberWeel with them."}
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={handleShare} className="focus-ring inline-flex items-center justify-center gap-2 rounded-xl bg-[#111827] px-5 py-3.5 font-bold text-white transition hover:bg-[#1F2937]">
                <Share2 className="h-5 w-5" />
                {isArabic ? "مشاركة" : "Share"}
              </button>
              <button type="button" onClick={() => setSuccessOpen(false)} className="focus-ring rounded-xl border border-[#D8D2C4] bg-white px-5 py-3.5 font-bold text-[#111827] transition hover:bg-[#F7F3EB]">
                {isArabic ? "إغلاق" : "Close"}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
