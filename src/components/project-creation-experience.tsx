"use client";

import { useEffect } from "react";

const AUTO_NOTE_CLASS = "cyberweel-auto-referral-note";

function projectCreationForms() {
  return Array.from(document.querySelectorAll<HTMLFormElement>("form")).filter((form) => {
    const action = form.querySelector<HTMLInputElement>('input[name="action"][value="project"]');
    const projectId = form.querySelector<HTMLInputElement>('input[name="projectId"]');
    return Boolean(action) && !projectId;
  });
}

function replaceLabelText(label: HTMLLabelElement, text: string) {
  const textNode = Array.from(label.childNodes).find((node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim());
  if (textNode) textNode.textContent = `\n      ${text}\n      `;
}

function enhanceForm(form: HTMLFormElement) {
  const description = form.querySelector<HTMLTextAreaElement>('textarea[name="description"]');
  description?.closest("label")?.classList.add("hidden");

  const progress = form.querySelector<HTMLInputElement>('input[name="progress"]');
  progress?.closest("label")?.classList.add("hidden");

  const scope = form.querySelector<HTMLTextAreaElement>('textarea[name="agreementDetails"]');
  const scopeLabel = scope?.closest("label");
  if (scopeLabel instanceof HTMLLabelElement) replaceLabelText(scopeLabel, "نطاق المشروع");

  const referralSelect = form.querySelector<HTMLSelectElement>('select[name="referralId"]');
  if (!referralSelect) return;

  const referralOptions = Array.from(referralSelect.options).filter((option) => option.value);
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

export function ProjectCreationExperience() {
  useEffect(() => {
    const apply = () => projectCreationForms().forEach(enhanceForm);
    apply();

    const observer = new MutationObserver(apply);
    observer.observe(document.body, { childList: true, subtree: true });

    const captureSubmit = (event: Event) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement) || !projectCreationForms().includes(form)) return;
      const referralSelect = form.querySelector<HTMLSelectElement>('select[name="referralId"]');
      if (!referralSelect) return;
      const realReferrals = Array.from(referralSelect.options).filter((option) => option.value && option.value !== "__NONE__");
      if (realReferrals.length === 1) referralSelect.value = realReferrals[0].value;
      if (referralSelect.value === "__NONE__") referralSelect.value = "";
    };

    document.addEventListener("submit", captureSubmit, true);
    return () => {
      observer.disconnect();
      document.removeEventListener("submit", captureSubmit, true);
    };
  }, []);

  return null;
}
