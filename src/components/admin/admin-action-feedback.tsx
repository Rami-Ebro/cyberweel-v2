"use client";

import { useEffect } from "react";

type ActionTarget = {
  form: HTMLFormElement | null;
  button: HTMLElement | null;
  at: number;
};

const ERROR_PATTERN = /^(?:⚠\s*)?(?:تعذر|فشل|خطأ|غير صالح|غير صحيحة|غير موجود|غير مدعوم|مفقود|يجب|لا يمكن|لم يُحفظ|لم يتم|رُفض|رفض|انتهت مهلة|سبق اتخاذ قرار|يوجد حساب|المشروع مطلوب|اسم المشروع مطلوب|حالة .* غير صالحة|نسبة .* يجب|رمز العملة غير صالح|موعد .* غير صالح|الرابط غير صالح)/i;

const FIELD_HINTS: Array<{ pattern: RegExp; names: string[] }> = [
  { pattern: /(رابط|URL|وصلة)/i, names: ["links", "url", "portfolioUrl", "files"] },
  { pattern: /(بريد|email)/i, names: ["email"] },
  { pattern: /(هاتف|تواصل|phone)/i, names: ["phone", "contactMethod"] },
  { pattern: /(كلمة المرور|password)/i, names: ["password", "newPassword", "currentPassword"] },
  { pattern: /(عميل|client)/i, names: ["clientId"] },
  { pattern: /(مشروع|project)/i, names: ["projectId", "title"] },
  { pattern: /(اسم المشروع)/i, names: ["title"] },
  { pattern: /(اسم المرحلة|مرحلة)/i, names: ["name", "status", "projectStatus"] },
  { pattern: /(نسبة التقدم|تقدم)/i, names: ["progress"] },
  { pattern: /(مبلغ|قيمة|مستحق|amount)/i, names: ["amount", "feeAmount", "commissionAmount", "commissionBaseAmount"] },
  { pattern: /(نسبة|rate)/i, names: ["commissionRate"] },
  { pattern: /(عملة|currency)/i, names: ["currency", "feeCurrency", "commissionCurrency"] },
  { pattern: /(تاريخ|موعد|استحقاق)/i, names: ["dueAt", "paymentDate", "from", "to"] },
  { pattern: /(حالة الدفع|الدفع)/i, names: ["paymentStatus"] },
  { pattern: /(حالة المشروع)/i, names: ["projectStatus"] },
  { pattern: /(قرار)/i, names: ["adminDecision", "status"] },
  { pattern: /(ملاحظ)/i, names: ["notes", "adminNotes"] },
  { pattern: /(مرجع|reference)/i, names: ["paymentReference"] },
  { pattern: /(اسم)/i, names: ["name", "title"] },
];

function normalizeMessage(value: string) {
  return value.replace(/^⚠\s*/, "").replace(/\s+/g, " ").trim().slice(0, 420);
}

function clearFieldMarks(scope: ParentNode = document) {
  scope.querySelectorAll<HTMLElement>("[data-admin-action-invalid='true']").forEach((field) => {
    delete field.dataset.adminActionInvalid;
  });
}

function clearInlineFeedback(scope: ParentNode) {
  scope.querySelectorAll<HTMLElement>("[data-admin-action-feedback='true']").forEach((node) => node.remove());
  clearFieldMarks(scope);
}

function likelyField(form: HTMLFormElement, message: string) {
  for (const hint of FIELD_HINTS) {
    if (!hint.pattern.test(message)) continue;
    for (const name of hint.names) {
      const field = form.elements.namedItem(name);
      if (field instanceof HTMLElement && !(field instanceof HTMLInputElement && field.type === "hidden")) return field;
      if (field instanceof RadioNodeList) {
        const first = Array.from(form.querySelectorAll<HTMLElement>(`[name="${CSS.escape(name)}"]`)).find((item) => !(item instanceof HTMLInputElement && item.type === "hidden"));
        if (first) return first;
      }
    }
  }
  return null;
}

function insertFeedback(target: ActionTarget, message: string, source?: HTMLElement | null) {
  const text = normalizeMessage(message);
  if (!text || !ERROR_PATTERN.test(text)) return;

  const form = target.form;
  if (form) {
    const field = likelyField(form, text);
    if (field) {
      field.dataset.adminActionInvalid = "true";
      field.scrollIntoView({ behavior: "smooth", block: "center" });
      window.setTimeout(() => field.focus({ preventScroll: true }), 120);
    }

    if (source && source.closest("form") === form) return;
    clearInlineFeedback(form);
    if (field) field.dataset.adminActionInvalid = "true";

    const feedback = document.createElement("div");
    feedback.dataset.adminActionFeedback = "true";
    feedback.setAttribute("role", "alert");
    feedback.setAttribute("aria-live", "assertive");
    feedback.dir = "rtl";
    feedback.textContent = `⚠ ${text}`;

    const anchor = field?.closest("label, fieldset") || form.querySelector<HTMLElement>('button[type="submit"], input[type="submit"], button:not([type])');
    if (anchor) anchor.insertAdjacentElement("afterend", feedback);
    else form.appendChild(feedback);
    return;
  }

  const button = target.button;
  if (!button || (source && source.contains(button))) return;
  if (source) {
    const localContainer = button.closest("article, details, section");
    if (localContainer && localContainer.contains(source)) return;
  }
  const parent = button.parentElement || button;
  clearInlineFeedback(parent);
  const feedback = document.createElement("div");
  feedback.dataset.adminActionFeedback = "true";
  feedback.setAttribute("role", "alert");
  feedback.setAttribute("aria-live", "assertive");
  feedback.dir = "rtl";
  feedback.textContent = `⚠ ${text}`;
  button.insertAdjacentElement("afterend", feedback);
}

function nativeValidationMessage(field: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement) {
  if (field.validity.valueMissing) return "هذا الحقل مطلوب قبل المتابعة.";
  if (field.validity.typeMismatch) return "القيمة المدخلة ليست بالصيغة الصحيحة.";
  if (field.validity.rangeUnderflow) return `القيمة يجب ألا تقل عن ${field.getAttribute("min") || "الحد الأدنى"}.`;
  if (field.validity.rangeOverflow) return `القيمة يجب ألا تتجاوز ${field.getAttribute("max") || "الحد الأعلى"}.`;
  if (field.validity.tooShort) return `القيمة أقصر من الحد المطلوب (${field.getAttribute("minlength") || ""}).`;
  if (field.validity.patternMismatch) return "القيمة لا تطابق الصيغة المطلوبة.";
  return "راجع هذا الحقل قبل المتابعة.";
}

function candidateElement(node: Node) {
  if (node instanceof HTMLElement) return node;
  return node.parentElement;
}

export function AdminActionFeedback() {
  useEffect(() => {
    let lastAction: ActionTarget | null = null;

    const rememberForm = (event: Event) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;
      clearInlineFeedback(form);
      lastAction = { form, button: null, at: Date.now() };
    };

    const rememberButton = (event: MouseEvent) => {
      const element = event.target;
      if (!(element instanceof Element)) return;
      const button = element.closest<HTMLElement>("button, [role='button']");
      if (!button) return;
      const form = button.closest("form");
      if (form) clearInlineFeedback(form);
      lastAction = { form, button, at: Date.now() };
    };

    const showNativeValidation = (event: Event) => {
      const field = event.target;
      if (!(field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement)) return;
      const form = field.form;
      if (!form) return;
      lastAction = { form, button: null, at: Date.now() };
      clearInlineFeedback(form);
      field.dataset.adminActionInvalid = "true";

      const feedback = document.createElement("div");
      feedback.dataset.adminActionFeedback = "true";
      feedback.setAttribute("role", "alert");
      feedback.dir = "rtl";
      feedback.textContent = `⚠ ${nativeValidationMessage(field)}`;
      (field.closest("label, fieldset") || field).insertAdjacentElement("afterend", feedback);
    };

    const clearChangedField = (event: Event) => {
      const element = event.target;
      if (!(element instanceof HTMLElement)) return;
      delete element.dataset.adminActionInvalid;
      const form = element.closest("form");
      if (form) form.querySelectorAll<HTMLElement>("[data-admin-action-feedback='true']").forEach((node) => node.remove());
    };

    const observer = new MutationObserver((mutations) => {
      if (!lastAction || Date.now() - lastAction.at > 20000) return;
      for (const mutation of mutations) {
        const candidates = [candidateElement(mutation.target), ...Array.from(mutation.addedNodes).map(candidateElement)].filter((item): item is HTMLElement => Boolean(item));
        for (const candidate of candidates) {
          if (candidate.dataset.adminActionFeedback === "true" || candidate.closest("[data-admin-action-feedback='true']")) continue;
          const text = normalizeMessage(candidate.textContent || "");
          if (!text || text.length > 420 || !ERROR_PATTERN.test(text)) continue;
          insertFeedback(lastAction, text, candidate);
          return;
        }
      }
    });

    document.addEventListener("submit", rememberForm, true);
    document.addEventListener("click", rememberButton, true);
    document.addEventListener("invalid", showNativeValidation, true);
    document.addEventListener("input", clearChangedField, true);
    document.addEventListener("change", clearChangedField, true);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });

    return () => {
      document.removeEventListener("submit", rememberForm, true);
      document.removeEventListener("click", rememberButton, true);
      document.removeEventListener("invalid", showNativeValidation, true);
      document.removeEventListener("input", clearChangedField, true);
      document.removeEventListener("change", clearChangedField, true);
      observer.disconnect();
    };
  }, []);

  return (
    <style jsx global>{`
      [data-admin-action-invalid='true'] {
        border-color: #e11d48 !important;
        box-shadow: 0 0 0 2px rgb(225 29 72 / 0.16) !important;
      }
      [data-admin-action-feedback='true'] {
        margin-top: 0.6rem;
        border: 1px solid #fecdd3;
        border-radius: 0.75rem;
        background: #fff1f2;
        padding: 0.75rem 0.9rem;
        color: #9f1239;
        font-size: 0.875rem;
        font-weight: 800;
        line-height: 1.65;
      }
    `}</style>
  );
}
