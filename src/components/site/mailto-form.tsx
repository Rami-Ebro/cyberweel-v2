"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Send } from "lucide-react";
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
};

/**
 * Frontend-only form. No backend. On submit it constructs a mailto: link
 * with the entered content and opens the user's email client — honest and
 * functional. Shows a confirmation toast.
 */
export function MailtoForm({
  to,
  subject,
  fields,
  submitLabel = "Send",
  successMessage,
  className,
}: MailtoFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const { t } = useI18n();

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const form = e.currentTarget;
    const data = new FormData(form);

    const lines: string[] = [];
    for (const f of fields) {
      const val = String(data.get(f.name) ?? "").trim();
      lines.push(`${f.label}: ${val || "—"}`);
    }
    const body = lines.join("\n\n");

    const mailto = `mailto:${to}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;

    try {
      window.location.href = mailto;
      toast.success(
        successMessage ?? "Your email client should open now.",
        {
          description: `If it didn't, write to us directly at ${to}.`,
        }
      );
      form.reset();
    } catch {
      toast.error("Something went wrong. Please email us directly.", {
        description: to,
      });
    } finally {
      setTimeout(() => setSubmitting(false), 600);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("space-y-6", className)}
      noValidate
    >
      <div className="grid gap-6 sm:grid-cols-2">
        {fields.map((f) => (
          <div
            key={f.name}
            className={cn(f.full && "sm:col-span-2")}
          >
            <label
              htmlFor={f.name}
              className="mb-2 block text-sm font-medium text-ink"
            >
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

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {t.common.noPitches}
        </p>
        <button
          type="submit"
          disabled={submitting}
          className="focus-ring inline-flex items-center justify-center gap-2 rounded-md bg-ink px-7 py-3.5 text-sm font-medium text-floral transition-colors hover:bg-ink/90 disabled:opacity-60"
        >
          {submitLabel}
          <Send className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}
