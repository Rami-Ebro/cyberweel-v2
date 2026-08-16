"use client";

import { useEffect } from "react";

const AUTO_NOTE_CLASS = "cyberweel-auto-referral-note";
const PARTNERS_NOTE_CLASS = "cyberweel-partners-referral-note";

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

export function ProjectCreationExperience() {
  useEffect(() => {
    const apply = () => projectCreationForms().forEach(enhanceForm);
    apply();

    const observer = new MutationObserver(apply);
    observer.observe(document.body, { childList: true, subtree: true });

    const captureFormData = (event: Event) => {
      if (!(event instanceof FormDataEvent)) return;
      const form = event.target;
      if (!(form instanceof HTMLFormElement) || !clientProjectCreationForms().includes(form)) return;
      syncReferralIntoFormData(form, event.formData);
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
      if (payload.entity !== "project") return originalFetch(input, init);

      const normalizedPayload = { ...payload, description: "", projectStatus: "PLANNING", progress: 0 };
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
    return () => {
      observer.disconnect();
      document.removeEventListener("formdata", captureFormData, true);
      window.fetch = originalFetch;
    };
  }, []);

  return null;
}
