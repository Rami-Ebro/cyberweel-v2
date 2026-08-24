"use client";

import { useEffect } from "react";

const AUTO_NOTE_CLASS = "cyberweel-auto-referral-note";
const PARTNERS_NOTE_CLASS = "cyberweel-partners-referral-note";
const SAVE_FEEDBACK_CLASS = "cyberweel-project-save-feedback";
const INVALID_FIELD_CLASS = "cyberweel-invalid-project-field";

function clientProjectCreationForms() {
  return Array.from(document.querySelectorAll<HTMLFormElement>("form")).filter((form) => {
    const action = form.querySelector<HTMLInputElement>('input[name="action"][value="project"]');
    const projectId = form.querySelector<HTMLInputElement>('input[name="projectId"]');
    return Boolean(action) && !projectId;
  });
}

function partnersProjectCreationForms() {
  if (!window.location.pathname.startsWith("/admin/partners")) return [];
  return Array.from(document.querySelectorAll<HTMLFormElement>("form")).filter((form) => {
    const client = form.querySelector<HTMLSelectElement>('select[name="clientId"]');
    const title = form.querySelector<HTMLInputElement>('input[name="title"]');
    const scope = form.querySelector<HTMLTextAreaElement>('textarea[name="agreementDetails"]');
    const projectId = form.querySelector<HTMLInputElement>('input[name="projectId"]');
    return Boolean(client && title && scope) && !projectId;
  });
}

function projectCreationForms() {
  return [...clientProjectCreationForms(), ...partnersProjectCreationForms()];
}

function projectUpdateForm(form: HTMLFormElement) {
  const title = form.querySelector<HTMLInputElement>('input[name="title"]');
  const currency = form.querySelector<HTMLSelectElement>('select[name="currency"]');
  const links = form.querySelector<HTMLTextAreaElement>('textarea[name="links"]');
  const client = form.querySelector<HTMLSelectElement>('select[name="clientId"]');
  return Boolean(title && currency && links && !client);
}

function replaceLabelText(label: HTMLLabelElement, text: string) {
  const textNode = Array.from(label.childNodes).find((node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim());
  if (textNode) textNode.textContent = `\n      ${text}\n      `;
}

function enhanceCommonFields(form: HTMLFormElement) {
  const description = form.querySelector<HTMLTextAreaElement>('textarea[name="description"]');
  description?.closest("label")?.classList.add("hidden");

  const progress = form.querySelector<HTMLInputElement>('input[name="progress"]');
  if (progress) progress.value = "0";
  progress?.closest("label")?.classList.add("hidden");

  const scope = form.querySelector<HTMLTextAreaElement>('textarea[name="agreementDetails"]');
  const scopeLabel = scope?.closest("label");
  if (scopeLabel instanceof HTMLLabelElement) replaceLabelText(scopeLabel, "نطاق المشروع");
}

function enhanceClientForm(form: HTMLFormElement) {
  const referralSelect = form.querySelector<HTMLSelectElement>('select[name="referralId"]');
  if (!referralSelect) return;

  const referralOptions = Array.from(referralSelect.options).filter((option) => option.value && option.value !== "__NONE__");
  const label = referralSelect.closest("label");
  if (!(label instanceof HTMLLabelElement)) return;

  if (referralOptions.length === 1) {
    referralSelect.value = referralOptions[0].value;
    label.classList.add("hidden");
    if (!form.querySelector(`.${AUTO_NOTE_CLASS}`)) {
      const note = document.createElement("div");
      note.className = `${AUTO_NOTE_CLASS} rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800`;
      note.textContent = "سيُربط هذا المشروع تلقائيًا بالإحالة التي جاء منها العميل.";
      label.insertAdjacentElement("afterend", note);
    }
    return;
  }

  if (referralOptions.length > 1) {
    replaceLabelText(label, "مصدر هذا المشروع");
    referralSelect.required = true;
    const emptyOption = Array.from(referralSelect.options).find((option) => !option.value);
    if (emptyOption) {
      emptyOption.textContent = "اختر الإحالة أو حدّد أنه مشروع مستقل";
      emptyOption.disabled = true;
    }
    if (!Array.from(referralSelect.options).some((option) => option.value === "__NONE__")) {
      referralSelect.add(new Option("مشروع مستقل — دون إحالة", "__NONE__"));
    }
  }
}

function enhancePartnersForm(form: HTMLFormElement) {
  const status = form.querySelector<HTMLSelectElement>('select[name="projectStatus"]');
  if (status) status.value = "PLANNING";
  status?.closest("label")?.classList.add("hidden");

  if (!form.querySelector(`.${PARTNERS_NOTE_CLASS}`)) {
    const client = form.querySelector<HTMLSelectElement>('select[name="clientId"]');
    const label = client?.closest("label");
    if (label instanceof HTMLLabelElement) {
      const note = document.createElement("div");
      note.className = `${PARTNERS_NOTE_CLASS} rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800 md:col-span-2`;
      note.textContent = "إذا كان العميل محولًا من إحالة واحدة غير مرتبطة، سيُربط المشروع بها تلقائيًا.";
      label.insertAdjacentElement("afterend", note);
    }
  }
}

function enhanceForm(form: HTMLFormElement) {
  enhanceCommonFields(form);
  if (clientProjectCreationForms().includes(form)) enhanceClientForm(form);
  if (partnersProjectCreationForms().includes(form)) enhancePartnersForm(form);
}

function syncReferralIntoFormData(form: HTMLFormElement, formData: FormData) {
  const referralSelect = form.querySelector<HTMLSelectElement>('select[name="referralId"]');
  if (!referralSelect) return;

  const realReferrals = Array.from(referralSelect.options).filter((option) => option.value && option.value !== "__NONE__");
  if (realReferrals.length === 1) {
    const referralId = realReferrals[0].value;
    referralSelect.value = referralId;
    formData.set("referralId", referralId);
    return;
  }

  if (referralSelect.value === "__NONE__") formData.set("referralId", "");
}

function clearProjectSaveFeedback(form: HTMLFormElement) {
  form.querySelector(`.${SAVE_FEEDBACK_CLASS}`)?.remove();
  form.querySelectorAll<HTMLElement>(`.${INVALID_FIELD_CLASS}`).forEach((field) => {
    field.classList.remove(INVALID_FIELD_CLASS, "border-rose-500", "ring-2", "ring-rose-200");
    field.removeAttribute("aria-invalid");
  });
}

function fieldForSaveError(form: HTMLFormElement, message: string) {
  const rules: Array<[RegExp, string]> = [
    [/رابط|URL/i, "links"],
    [/اسم المشروع|العنوان/i, "title"],
    [/نسبة التقدم|التقدم/i, "progress"],
    [/العملة/i, "currency"],
    [/موعد التسليم|التاريخ/i, "dueAt"],
    [/حالة المشروع/i, "projectStatus"],
  ];
  const name = rules.find(([pattern]) => pattern.test(message))?.[1];
  return name ? form.elements.namedItem(name) : null;
}

function showProjectSaveFeedback(form: HTMLFormElement, ok: boolean, message: string) {
  clearProjectSaveFeedback(form);

  const feedback = document.createElement("div");
  feedback.className = `${SAVE_FEEDBACK_CLASS} rounded-xl border p-4 text-sm font-bold md:col-span-2 ${
    ok
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : "border-rose-200 bg-rose-50 text-rose-800"
  }`;
  feedback.setAttribute("role", ok ? "status" : "alert");
  feedback.setAttribute("aria-live", "assertive");
  feedback.textContent = ok ? `✓ ${message}` : `⚠ ${message}`;

  const submitButton = Array.from(form.querySelectorAll<HTMLButtonElement>('button[type="submit"], button:not([type])')).find((button) =>
    button.textContent?.includes("حفظ تعديلات المشروع"),
  );
  if (submitButton) submitButton.insertAdjacentElement("beforebegin", feedback);
  else form.prepend(feedback);

  if (!ok) {
    const field = fieldForSaveError(form, message);
    if (field instanceof HTMLElement) {
      field.classList.add(INVALID_FIELD_CLASS, "border-rose-500", "ring-2", "ring-rose-200");
      field.setAttribute("aria-invalid", "true");
      field.focus({ preventScroll: true });
    }
    feedback.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

function invalidProjectLink(links: unknown) {
  if (!Array.isArray(links)) return null;
  for (const value of links) {
    if (typeof value !== "string" || !value.trim()) continue;
    const trimmed = value.trim();
    const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed.replace(/^\/+/, "")}`;
    try {
      const url = new URL(candidate);
      if (!["http:", "https:"].includes(url.protocol) || !url.hostname || !url.hostname.includes(".")) return trimmed;
    } catch {
      return trimmed;
    }
  }
  return null;
}

export function ProjectCreationExperience() {
  useEffect(() => {
    const apply = () => projectCreationForms().forEach(enhanceForm);
    apply();

    const observer = new MutationObserver(apply);
    observer.observe(document.body, { childList: true, subtree: true });

    let lastProjectUpdateForm: HTMLFormElement | null = null;

    const captureFormData = (event: Event) => {
      if (!(event instanceof FormDataEvent)) return;
      const form = event.target;
      if (!(form instanceof HTMLFormElement) || !clientProjectCreationForms().includes(form)) return;
      syncReferralIntoFormData(form, event.formData);
    };

    const captureSubmit = (event: Event) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement) || !projectUpdateForm(form)) return;
      lastProjectUpdateForm = form;
      clearProjectSaveFeedback(form);
    };

    const clearCorrectedField = (event: Event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement) || !target.classList.contains(INVALID_FIELD_CLASS)) return;
      target.classList.remove(INVALID_FIELD_CLASS, "border-rose-500", "ring-2", "ring-rose-200");
      target.removeAttribute("aria-invalid");
    };

    const originalFetch = window.fetch.bind(window);
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      const isPartnersProjectRequest = url.includes("/api/admin/partners") && init?.method === "PATCH" && typeof init.body === "string";
      if (!isPartnersProjectRequest) return originalFetch(input, init);

      let payload: Record<string, unknown> | null = null;
      try {
        payload = JSON.parse(init.body as string) as Record<string, unknown>;
      } catch {
        return originalFetch(input, init);
      }

      if (payload.entity === "project_update") {
        const form = lastProjectUpdateForm && document.contains(lastProjectUpdateForm) ? lastProjectUpdateForm : null;
        const badLink = invalidProjectLink(payload.links);
        if (badLink) {
          const error = `الرابط «${badLink}» غير صالح. أدخل رابطًا صحيحًا مثل https://example.com أو احذفه ثم أعد الحفظ.`;
          if (form) showProjectSaveFeedback(form, false, error);
          return new Response(JSON.stringify({ error }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        const response = await originalFetch(input, init);
        if (form) {
          if (response.ok) {
            showProjectSaveFeedback(form, true, "تم حفظ تعديلات المشروع بنجاح.");
          } else {
            let errorMessage = "تعذر حفظ المشروع. راجع الحقول المحددة ثم أعد المحاولة.";
            try {
              const data = await response.clone().json() as { error?: unknown };
              if (typeof data.error === "string" && data.error.trim()) errorMessage = data.error.trim();
            } catch {
              // Keep the safe fallback message.
            }
            showProjectSaveFeedback(form, false, errorMessage);
          }
        }
        return response;
      }

      if (payload.entity !== "project") return originalFetch(input, init);

      const normalizedPayload: Record<string, unknown> = { ...payload, description: "", projectStatus: "PLANNING", progress: 0 };
      const response = await originalFetch(input, { ...init, body: JSON.stringify(normalizedPayload) });
      if (!response.ok) return response;

      try {
        const data = await response.clone().json() as { project?: { id?: string } };
        const projectId = data.project?.id;
        const clientId = typeof normalizedPayload.clientId === "string" ? normalizedPayload.clientId : "";
        if (projectId && clientId) {
          const linkResponse = await originalFetch("/api/admin/projects/auto-link-referral", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ projectId, clientId }),
          });
          if (!linkResponse.ok && linkResponse.status !== 409) {
            console.error("[project-referral] Automatic referral linkage failed", await linkResponse.text());
          }
        }
      } catch (error) {
        console.error("[project-referral] Automatic referral linkage failed", error);
      }

      return response;
    };

    document.addEventListener("formdata", captureFormData, true);
    document.addEventListener("submit", captureSubmit, true);
    document.addEventListener("input", clearCorrectedField, true);
    document.addEventListener("change", clearCorrectedField, true);
    return () => {
      observer.disconnect();
      document.removeEventListener("formdata", captureFormData, true);
      document.removeEventListener("submit", captureSubmit, true);
      document.removeEventListener("input", clearCorrectedField, true);
      document.removeEventListener("change", clearCorrectedField, true);
      window.fetch = originalFetch;
    };
  }, []);

  return null;
}
