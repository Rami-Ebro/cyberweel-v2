"use client";

import { useEffect } from "react";

const HIDDEN_CLASS = "cyberweel-project-level-partner-field";
const STAGE_EDITOR_CLASS = "cyberweel-stage-plan-editor";
const STAGE_LOCK_NOTE_CLASS = "cyberweel-stage-plan-lock-note";
const WORKFLOW_NOTE_CLASS = "cyberweel-project-workflow-note";

type StageRow = { name: string; amount: string };

function projectForms() {
  return Array.from(document.querySelectorAll<HTMLFormElement>("form")).filter((form) => {
    const action = form.querySelector<HTMLInputElement>('input[name="action"][value="project"]');
    const clientId = form.querySelector<HTMLSelectElement>('select[name="clientId"]');
    const title = form.querySelector<HTMLInputElement>('input[name="title"]');
    return Boolean(action || (clientId && title));
  });
}

function isCreationForm(form: HTMLFormElement) {
  return !form.querySelector<HTMLInputElement>('input[name="projectId"]');
}

function fieldContainer(element: Element | null) {
  if (!element) return null;
  return element.closest("fieldset") || element.closest("label") || element.parentElement;
}

function hideElementField(element: Element | null) {
  const container = fieldContainer(element);
  if (!(container instanceof HTMLElement)) return;
  container.classList.add(HIDDEN_CLASS, "hidden");
  container.setAttribute("aria-hidden", "true");
}

function hideProjectLevelPartnerFields(form: HTMLFormElement) {
  if (!window.location.pathname.startsWith("/admin/partners")) return;

  const partnerInputs = Array.from(form.querySelectorAll<HTMLInputElement>('input[name="partnerIds"]'));
  if (partnerInputs.length) {
    const fieldset = partnerInputs[0].closest("fieldset");
    if (fieldset instanceof HTMLElement) {
      fieldset.classList.add(HIDDEN_CLASS, "hidden");
      fieldset.setAttribute("aria-hidden", "true");
    }
  }

  ["paymentStatus", "feeAmount", "tasks", "deliverables", "files", "updates"].forEach((name) => {
    hideElementField(form.elements.namedItem(name) as Element | null);
  });

  const partnerSection = Array.from(form.querySelectorAll<HTMLElement>("div")).find((node) =>
    node.textContent?.includes("بيانات شركاء التنفيذ"),
  );
  if (partnerSection) partnerSection.classList.add(HIDDEN_CLASS, "hidden");

  const details = form.closest("details");
  const description = details?.querySelector("summary p");
  if (description && description.textContent?.includes("شريك")) {
    description.textContent = "أدخل بيانات المشروع ومراحله مرة واحدة. إسناد شركاء التنفيذ يتم لاحقًا داخل كل مرحلة.";
  }

  if (!form.querySelector(`.${WORKFLOW_NOTE_CLASS}`)) {
    const titleField = fieldContainer(form.elements.namedItem("title") as Element | null);
    if (titleField) {
      const note = document.createElement("div");
      note.className = `${WORKFLOW_NOTE_CLASS} rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-900 md:col-span-2`;
      note.textContent = "المشروع يُنشأ دون إسناد شريك. بعد الإنشاء افتح «خطة التنفيذ» ثم أسند كل مرحلة إلى شريك التنفيذ المناسب مع مهامه وتسليماته.";
      titleField.insertAdjacentElement("beforebegin", note);
    }
  }
}

function lines(value: string) {
  return value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
}

function amountFromLine(line: string) {
  const normalized = line
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)));
  const match = normalized.match(/(?:\$\s*([0-9][0-9.,]*)|([0-9][0-9.,]*)\s*(?:\$|USD|EUR|SYP|TRY|دولار|دولارات|يورو|ليرة)|^([0-9][0-9.,]*)(?:\s|$))/i);
  return (match?.[1] || match?.[2] || match?.[3] || "").replace(/,/g, "");
}

function initialRows(stages: HTMLTextAreaElement, financialPlan: HTMLTextAreaElement): StageRow[] {
  const names = lines(stages.value);
  const amounts = lines(financialPlan.value).map(amountFromLine);
  const count = Math.max(names.length, amounts.length, 1);
  return Array.from({ length: count }, (_, index) => ({ name: names[index] || "", amount: amounts[index] || "" }));
}

function syncRows(rowsHost: HTMLElement, stages: HTMLTextAreaElement, financialPlan: HTMLTextAreaElement) {
  const rowNodes = Array.from(rowsHost.querySelectorAll<HTMLElement>("[data-stage-row]"));
  const rows = rowNodes.map((row) => ({
    name: row.querySelector<HTMLInputElement>('input[data-stage-name]')?.value.trim() || "",
    amount: row.querySelector<HTMLInputElement>('input[data-stage-amount]')?.value.trim() || "",
  })).filter((row) => row.name || row.amount);
  stages.value = rows.map((row) => row.name).join("\n");
  financialPlan.value = rows.map((row) => row.amount).join("\n");
  stages.dispatchEvent(new Event("input", { bubbles: true }));
  financialPlan.dispatchEvent(new Event("input", { bubbles: true }));
}

function stageRowElement(row: StageRow, currency: string, onChange: () => void, onRemove: (node: HTMLElement) => void) {
  const wrapper = document.createElement("div");
  wrapper.dataset.stageRow = "true";
  wrapper.className = "grid gap-2 rounded-xl border border-[#E6E0D4] bg-white p-3 sm:grid-cols-[1fr_180px_auto] sm:items-end";

  const nameLabel = document.createElement("label");
  nameLabel.className = "grid gap-1 text-sm font-black";
  nameLabel.textContent = "اسم المرحلة";
  const nameInput = document.createElement("input");
  nameInput.dataset.stageName = "true";
  nameInput.className = "field font-normal";
  nameInput.placeholder = "مثال: تصميم واعتماد الواجهات";
  nameInput.value = row.name;
  nameInput.required = true;
  nameInput.addEventListener("input", onChange);
  nameLabel.appendChild(nameInput);

  const amountLabel = document.createElement("label");
  amountLabel.className = "grid gap-1 text-sm font-black";
  amountLabel.textContent = `مبلغ المرحلة — ${currency}`;
  const amountInput = document.createElement("input");
  amountInput.dataset.stageAmount = "true";
  amountInput.className = "field font-normal";
  amountInput.type = "number";
  amountInput.min = "0.01";
  amountInput.step = "0.01";
  amountInput.placeholder = "500";
  amountInput.value = row.amount;
  amountInput.required = true;
  amountInput.addEventListener("input", onChange);
  amountLabel.appendChild(amountInput);

  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-black text-rose-800";
  remove.textContent = "حذف";
  remove.addEventListener("click", () => onRemove(wrapper));

  wrapper.append(nameLabel, amountLabel, remove);
  return wrapper;
}

function enhanceStageCreation(form: HTMLFormElement) {
  if (!isCreationForm(form) || form.querySelector(`.${STAGE_EDITOR_CLASS}`)) return;
  const stages = form.elements.namedItem("stages");
  const financialPlan = form.elements.namedItem("financialPlan");
  if (!(stages instanceof HTMLTextAreaElement) || !(financialPlan instanceof HTMLTextAreaElement)) return;

  const stagesContainer = fieldContainer(stages);
  const financialContainer = fieldContainer(financialPlan);
  if (!(stagesContainer instanceof HTMLElement) || !(financialContainer instanceof HTMLElement)) return;
  stagesContainer.classList.add("hidden");
  financialContainer.classList.add("hidden");
  stagesContainer.setAttribute("aria-hidden", "true");
  financialContainer.setAttribute("aria-hidden", "true");

  const currencyField = form.elements.namedItem("currency") || form.elements.namedItem("feeCurrency");
  const currency = currencyField instanceof HTMLSelectElement ? currencyField.value || "USD" : "USD";

  const editor = document.createElement("fieldset");
  editor.className = `${STAGE_EDITOR_CLASS} grid gap-3 rounded-xl border border-[#D8D2C4] bg-[#FCFAF6] p-4 md:col-span-2`;
  const legend = document.createElement("legend");
  legend.className = "px-2 font-black";
  legend.textContent = "مراحل المشروع والخطة المالية";
  const hint = document.createElement("p");
  hint.className = "text-sm font-bold text-slate-500";
  hint.textContent = "أدخل كل مرحلة مرة واحدة مع مبلغها. هذه البيانات تصبح مصدر الحقيقة للمشروع والفواتير والسفير وشركاء التنفيذ.";
  const rowsHost = document.createElement("div");
  rowsHost.className = "grid gap-3";

  const update = () => syncRows(rowsHost, stages, financialPlan);
  const addRow = (row: StageRow = { name: "", amount: "" }) => {
    const node = stageRowElement(row, currency, update, (target) => {
      if (rowsHost.querySelectorAll("[data-stage-row]").length <= 1) {
        const name = target.querySelector<HTMLInputElement>('input[data-stage-name]');
        const amount = target.querySelector<HTMLInputElement>('input[data-stage-amount]');
        if (name) name.value = "";
        if (amount) amount.value = "";
      } else {
        target.remove();
      }
      update();
    });
    rowsHost.appendChild(node);
  };

  initialRows(stages, financialPlan).forEach(addRow);

  const addButton = document.createElement("button");
  addButton.type = "button";
  addButton.className = "w-fit rounded-xl border border-[#D8D2C4] bg-white px-4 py-2.5 text-sm font-black text-[#9A7D43]";
  addButton.textContent = "+ إضافة مرحلة";
  addButton.addEventListener("click", () => addRow());

  editor.append(legend, hint, rowsHost, addButton);
  stagesContainer.insertAdjacentElement("beforebegin", editor);
  update();
}

function lockLegacyStageEditors(form: HTMLFormElement) {
  if (isCreationForm(form)) return;
  const stages = form.elements.namedItem("stages");
  const financialPlan = form.elements.namedItem("financialPlan");
  if (!(stages instanceof HTMLTextAreaElement) || !(financialPlan instanceof HTMLTextAreaElement)) return;
  const stagesContainer = fieldContainer(stages);
  const financialContainer = fieldContainer(financialPlan);
  if (stagesContainer instanceof HTMLElement) stagesContainer.classList.add("hidden");
  if (financialContainer instanceof HTMLElement) financialContainer.classList.add("hidden");
  if (form.querySelector(`.${STAGE_LOCK_NOTE_CLASS}`)) return;
  const note = document.createElement("div");
  note.className = `${STAGE_LOCK_NOTE_CLASS} rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm font-bold text-sky-900 md:col-span-2`;
  note.textContent = "المراحل والمبالغ التشغيلية مقفلة هنا لمنع تضارب البيانات. إدارتها تتم من «خطة التنفيذ» أسفل بطاقة المشروع.";
  stagesContainer?.insertAdjacentElement("beforebegin", note);
}

export function ProjectWorkflowGuard() {
  useEffect(() => {
    const apply = () => {
      for (const form of projectForms()) {
        hideProjectLevelPartnerFields(form);
        enhanceStageCreation(form);
        lockLegacyStageEditors(form);
      }
    };
    apply();

    const observer = new MutationObserver(apply);
    observer.observe(document.body, { childList: true, subtree: true });

    const originalFetch = window.fetch.bind(window);
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      const isAdminProjects = url.includes("/api/admin/partners") && init?.method === "PATCH" && typeof init.body === "string";
      if (!isAdminProjects) return originalFetch(input, init);

      let payload: Record<string, unknown> | null = null;
      try {
        payload = JSON.parse(init.body as string) as Record<string, unknown>;
      } catch {
        return originalFetch(input, init);
      }

      if (payload.entity !== "project" && payload.entity !== "project_update") return originalFetch(input, init);

      const cleaned: Record<string, unknown> = { ...payload, partnerIds: [] };
      for (const key of ["partnerId", "tasks", "deliverables", "files", "updates", "feeAmount", "paymentStatus"]) delete cleaned[key];
      const response = await originalFetch(input, { ...init, body: JSON.stringify(cleaned) });
      if (!response.ok || payload.entity !== "project") return response;

      try {
        const result = await response.clone().json() as { project?: { id?: string } };
        const projectId = result.project?.id;
        const clientId = typeof cleaned.clientId === "string" ? cleaned.clientId : "";
        if (projectId && clientId) {
          await originalFetch("/api/admin/projects/auto-link-referral", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ projectId, clientId }),
          }).catch(() => null);
          const syncResponse = await originalFetch("/api/admin/project-stages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "sync_from_project", projectId }),
          });
          if (!syncResponse.ok) {
            console.error("[project-workflow] Structured stage sync failed", await syncResponse.text());
          }
        }
      } catch (error) {
        console.error("[project-workflow] Project post-create sync failed", error);
      }
      return response;
    };

    return () => {
      observer.disconnect();
      window.fetch = originalFetch;
    };
  }, []);

  return null;
}
