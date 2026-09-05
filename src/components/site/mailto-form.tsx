"use client";

import { useEffect, useRef, useState, type FormEvent, type InvalidEvent } from "react";
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

type ReferralIdentityStatus = "idle" | "checking" | "clear" | "blocked";
type ReferralIdentityResult = "clear" | "blocked" | "not-applicable" | "error";

const MAX_FILES = 3;
const MAX_TOTAL_BYTES = 4 * 1024 * 1024;
const ACCEPTED_FILES = ".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp";
const ACCEPTED_EXTENSIONS = new Set(["pdf", "doc", "docx", "xls", "xlsx", "png", "jpg", "jpeg", "webp"]);

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
  const [referralIdentityStatus, setReferralIdentityStatus] = useState<ReferralIdentityStatus>("idle");
  const [referralIdentityField, setReferralIdentityField] = useState<"email" | "phone" | null>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const identityCheckTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const identityCheckRequestRef = useRef(0);
  const { t } = useI18n();
  const isArabic = t.dir === "rtl";

  const requiredMessage = isArabic ? "يرجى تعبئة هذا الحقل" : "Please complete this field.";
  const emailMessage = isArabic ? "يرجى إدخال بريد إلكتروني صحيح" : "Please enter a valid email address.";
  const existingClientMessage = isArabic
    ? "هذا البريد أو رقم الهاتف مرتبط بعميل مسجل مسبقًا، ولا يمكن تسجيله كإحالة جديدة."
    : "This email or phone number already belongs to a registered client and cannot be submitted as a new referral.";

  useEffect(() => () => {
    if (identityCheckTimerRef.current) clearTimeout(identityCheckTimerRef.current);
    identityCheckRequestRef.current += 1;
  }, []);

  const handleInvalid = (event: InvalidEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const target = event.currentTarget;
    if (target.validity.valueMissing) {
      target.setCustomValidity(requiredMessage);
    } else if (target.validity.typeMismatch && target instanceof HTMLInputElement && target.type === "email") {
      target.setCustomValidity(emailMessage);
    }
  };

  const clearValidationMessage = (target: HTMLInputElement | HTMLTextAreaElement) => {
    target.setCustomValidity("");
  };

  const referralCode = () => new URLSearchParams(window.location.search).get("ref")?.trim() || "";

  async function fetchReferralIdentity(email: string, phone: string): Promise<ReferralIdentityResult> {
    try {
      const response = await fetch("/api/referrals/check-identity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, phone, referralCode: referralCode() }),
      });
      const result = (await response.json().catch(() => null)) as
        | { ok?: boolean; applicable?: boolean; existingClient?: boolean }
        | null;

      if (!response.ok || !result?.ok) return "error";
      if (result.applicable !== true) return "not-applicable";
      return result.existingClient ? "blocked" : "clear";
    } catch {
      return "error";
    }
  }

  function scheduleReferralIdentityCheck(form: HTMLFormElement | null, fieldName: "email" | "phone") {
    if (!trackReferral || !form) return;

    const data = new FormData(form);
    const email = String(data.get("email") ?? "").trim();
    const phone = String(data.get("phone") ?? "").trim();
    const emailUsable = !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const phoneUsable = !phone || phone.replace(/\D/g, "").length >= 8;

    if ((!email && !phone) || !emailUsable || !phoneUsable) {
      if (identityCheckTimerRef.current) clearTimeout(identityCheckTimerRef.current);
      identityCheckRequestRef.current += 1;
      setReferralIdentityStatus("idle");
      setReferralIdentityField(fieldName);
      return;
    }

    if (identityCheckTimerRef.current) clearTimeout(identityCheckTimerRef.current);
    const requestId = ++identityCheckRequestRef.current;
    setReferralIdentityField(fieldName);
    setReferralIdentityStatus("checking");

    identityCheckTimerRef.current = setTimeout(() => {
      void fetchReferralIdentity(email, phone).then((result) => {
        if (requestId !== identityCheckRequestRef.current) return;
        if (result === "blocked") setReferralIdentityStatus("blocked");
        else if (result === "clear") setReferralIdentityStatus("clear");
        else setReferralIdentityStatus("idle");
      });
    }, 500);
  }

  async function verifyReferralIdentityBeforeSubmit(data: FormData) {
    if (!trackReferral) return true;

    if (identityCheckTimerRef.current) clearTimeout(identityCheckTimerRef.current);
    identityCheckRequestRef.current += 1;

    const email = String(data.get("email") ?? "").trim();
    const phone = String(data.get("phone") ?? "").trim();
    setReferralIdentityField(email ? "email" : phone ? "phone" : null);
    setReferralIdentityStatus("checking");

    const result = await fetchReferralIdentity(email, phone);
    if (result === "blocked") {
      setReferralIdentityStatus("blocked");
      toast.error(existingClientMessage);
      return false;
    }

    setReferralIdentityStatus(result === "clear" ? "clear" : "idle");
    return true;
  }

  const handleShare = async () => {
    const shareData = {
      title: document.title,
      text: isArabic
        ? "شارك CyberWeel مع شخص لديه مشكلة أو مشروع يحتاج إلى خطوة واضحة."
        : "Share CyberWeel with someone facing a challenge or project that needs a clearer next step.",
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

  const handleFiles = (files: FileList | null, input: HTMLInputElement) => {
    const addedFiles = Array.from(files ?? []);
    const nextFiles = [...selectedFiles, ...addedFiles].filter(
      (file, index, allFiles) => allFiles.findIndex((candidate) => fileIdentity(candidate) === fileIdentity(file)) === index,
    );

    if (nextFiles.length > MAX_FILES) {
      input.value = "";
      toast.error(isArabic ? "يمكن إرفاق 3 ملفات كحد أقصى" : "You can attach up to 3 files.");
      return;
    }

    const unsupported = nextFiles.find((file) => {
      const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
      return !ACCEPTED_EXTENSIONS.has(extension);
    });

    if (unsupported) {
      input.value = "";
      toast.error(isArabic ? "نوع الملف غير مدعوم" : "This file type is not supported.", {
        description: isArabic
          ? "استخدم ملف PDF أو Word أو Excel أو صورة."
          : "Use a PDF, Word, Excel, or image file.",
      });
      return;
    }

    const totalBytes = nextFiles.reduce((sum, file) => sum + file.size, 0);
    if (totalBytes > MAX_TOTAL_BYTES) {
      input.value = "";
      toast.error(isArabic ? "حجم المرفقات كبير جدًا" : "The attachments are too large.", {
        description: isArabic
          ? "يجب ألا يتجاوز الحجم الإجمالي 4 ميغابايت."
          : "The combined file size must not exceed 4 MB.",
      });
      return;
    }

    setSelectedFiles(nextFiles);
  };

  const removeSelectedFile = (fileIndex: number) => {
    setSelectedFiles((files) => files.filter((_, index) => index !== fileIndex));
    if (attachmentInputRef.current) attachmentInputRef.current.value = "";
  };

  const clearSelectedFiles = () => {
    setSelectedFiles([]);
    if (attachmentInputRef.current) attachmentInputRef.current.value = "";
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;

    if (!form.reportValidity()) return;

    setSubmitting(true);
    const data = new FormData(form);

    if (!(await verifyReferralIdentityBeforeSubmit(data))) {
      setSubmitting(false);
      return;
    }

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
        try {
          const organization = String(data.get("organization") ?? "").trim();
          const details = fields
            .filter((field) => !["name", "email", "phone", "organization"].includes(field.name))
            .map((field) => {
              const value = String(data.get(field.name) ?? "").trim();
              return value ? `${field.label}: ${value}` : "";
            })
            .filter(Boolean);

          if (organization) details.unshift(`${isArabic ? "المؤسسة" : "Organization"}: ${organization}`);

          const currentReferralCode = referralCode();
          const referralResponse = await fetch("/api/referrals", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: String(data.get("name") ?? organization).trim(),
              email: String(data.get("email") ?? "").trim(),
              phone: String(data.get("phone") ?? "").trim(),
              company: organization,
              notes: details.join("\n\n"),
              referralCode: currentReferralCode,
            }),
          });

          const referralResult = (await referralResponse.json().catch(() => null)) as
            | { ok?: boolean; attributed?: boolean; error?: string }
            | null;

          if (!referralResponse.ok || !referralResult?.ok) {
            throw new Error(referralResult?.error || "REFERRAL_FAILED");
          }

          if (currentReferralCode && referralResult.attributed !== true) {
            throw new Error("REFERRAL_NOT_ATTRIBUTED");
          }
        } catch (referralError) {
          // The contact request has already been confirmed by /api/contact.
          // Referral attribution is secondary bookkeeping and must never turn
          // a successful customer submission into a false send-error state.
          console.error("[mailto-form] Referral tracking failed after confirmed contact submission", referralError);
        }
      }

      form.reset();
      setSelectedFiles([]);
      setReferralIdentityStatus("idle");
      setReferralIdentityField(null);
      setSuccessOpen(true);
    } catch (error) {
      console.error("[mailto-form] Submission failed", error);
      toast.error(
        isArabic ? "تعذر إرسال الطلب الآن" : "We could not send your request right now.",
        {
          description: isArabic
            ? `لم يتم تأكيد الإرسال. يمكنك مراسلتنا مباشرة على ${to}`
            : `The submission was not confirmed. You can email us directly at ${to}.`,
        },
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className={cn("space-y-6", className)} noValidate={false}>
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          className="hidden"
          aria-hidden="true"
        />

        <div className="grid gap-6 sm:grid-cols-2">
          {fields.map((field) => (
            <div key={field.name} className={cn(field.full && "sm:col-span-2")}>
              <label htmlFor={field.name} className="mb-2 block text-sm font-medium text-ink">
                {field.label}
                {field.required && <span className="ms-1 text-accent" aria-hidden="true">*</span>}
              </label>
              {field.kind === "text" ? (
                <>
                  <input
                    id={field.name}
                    name={field.name}
                    type={field.type ?? "text"}
                    required={field.required}
                    placeholder={field.placeholder}
                    onInvalid={handleInvalid}
                    onInput={(event) => {
                      clearValidationMessage(event.currentTarget);
                      if (field.name === "email" || field.name === "phone") {
                        scheduleReferralIdentityCheck(event.currentTarget.form, field.name);
                      }
                    }}
                    aria-required={field.required || undefined}
                    aria-invalid={
                      referralIdentityStatus === "blocked" && referralIdentityField === field.name
                        ? true
                        : undefined
                    }
                    className={cn(
                      "focus-ring h-12 w-full rounded-md border bg-white px-4 text-sm text-ink shadow-sm transition-all duration-200 placeholder:text-muted-foreground/60 focus:shadow-md",
                      referralIdentityStatus === "blocked" && referralIdentityField === field.name
                        ? "border-rose-400 focus:border-rose-500 focus:shadow-rose-100"
                        : "border-border focus:border-camel focus:shadow-camel/10",
                    )}
                  />
                  {trackReferral && referralIdentityField === field.name && referralIdentityStatus === "checking" && (
                    <p className="mt-2 text-xs font-medium text-muted-foreground" aria-live="polite">
                      {isArabic ? "جارٍ التحقق من بيانات العميل..." : "Checking client details..."}
                    </p>
                  )}
                  {trackReferral && referralIdentityField === field.name && referralIdentityStatus === "blocked" && (
                    <p className="mt-2 text-xs font-bold leading-5 text-rose-700" role="alert">
                      {existingClientMessage}
                    </p>
                  )}
                </>
              ) : (
                <textarea
                  id={field.name}
                  name={field.name}
                  required={field.required}
                  placeholder={field.placeholder}
                  rows={field.rows ?? 5}
                  onInvalid={handleInvalid}
                  onInput={(event) => clearValidationMessage(event.currentTarget)}
                  aria-required={field.required || undefined}
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
                    ? "إضافة ملفات أخرى"
                    : "Add more files"
                  : isArabic
                    ? "اختر ملفات تساعدنا على فهم رسالتك"
                    : "Choose files that help us understand your message"}
              </span>
            </label>
            <input
              ref={attachmentInputRef}
              id="attachments"
              name="attachments"
              type="file"
              multiple
              accept={ACCEPTED_FILES}
              className="sr-only"
              onChange={(event) => handleFiles(event.target.files, event.currentTarget)}
            />
            {!!selectedFiles.length && (
              <div className="mt-3 grid gap-2" aria-live="polite">
                {selectedFiles.map((file, index) => (
                  <div
                    key={`${file.name}-${file.size}-${file.lastModified}`}
                    className="group flex items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5 text-sm shadow-sm transition hover:border-blue-300 hover:bg-blue-100/70"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-bold text-blue-950" dir="auto">{file.name}</p>
                      <p className="mt-0.5 text-xs text-blue-700/70">{formatFileSize(file.size, isArabic)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeSelectedFile(index)}
                      className="focus-ring shrink-0 rounded-full bg-white p-2 text-blue-700 opacity-100 shadow-sm transition hover:bg-red-50 hover:text-red-700 sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
                      aria-label={isArabic ? `إزالة ${file.name}` : `Remove ${file.name}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={clearSelectedFiles}
                  className="w-fit text-xs font-medium text-muted-foreground underline underline-offset-4 hover:text-ink"
                >
                  {isArabic ? "إزالة كل الملفات" : "Remove all files"}
                </button>
              </div>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              {isArabic
                ? "حتى 3 ملفات بصيغة PDF أو Word أو Excel أو صورة، وبحجم إجمالي لا يتجاوز 4 ميغابايت"
                : "Up to 3 PDF, Word, Excel, or image files, with a combined limit of 4 MB."}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">{t.common.noPitches}</p>
          <button
            type="submit"
            disabled={submitting || referralIdentityStatus === "blocked"}
            aria-busy={submitting || referralIdentityStatus === "checking"}
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
                ? "قد تكون هذه الصفحة مفيدة لشخص آخر يواجه مشكلة مشابهة."
                : "This page may also be useful to someone facing a similar challenge."}
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={handleShare} className="focus-ring inline-flex items-center justify-center gap-2 rounded-xl bg-[#111827] px-5 py-3.5 font-bold text-white transition hover:bg-[#1f2937]">
                <Share2 className="h-4 w-4" />
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

function formatFileSize(bytes: number, isArabic: boolean) {
  if (bytes < 1024) return `${bytes} ${isArabic ? "بايت" : "B"}`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} ${isArabic ? "ك.ب" : "KB"}`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} ${isArabic ? "م.ب" : "MB"}`;
}

function fileIdentity(file: File) {
  return `${file.name}:${file.size}:${file.lastModified}`;
}
