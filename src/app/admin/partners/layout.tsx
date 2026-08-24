"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ProjectExecutionPlan } from "@/components/admin/project-execution-plan";
import { ProjectWorkflowGuard } from "@/components/admin/project-workflow-guard";
import { StagePartnerAssignmentManager } from "@/components/admin/stage-partner-assignment-manager";

type Project = {
  id: string;
  title: string;
  description: string | null;
  agreementDetails: string | null;
  financialPlan: string | null;
  stages: string | null;
  links: string[];
  notes: string | null;
  clientStatus: string;
  projectCurrency: string;
  progress: number;
  dueAt: string | null;
  clientName: string;
  clientEmail: string;
  partners: Array<{ name: string }>;
};

type ExecutionStage = {
  amount: string;
  paymentStatus: string;
};

type ExecutionProject = {
  status?: string;
  progress?: number;
  projectStages?: ExecutionStage[];
};

type AssignmentProject = {
  projectStages?: Array<{
    assignments?: Array<{
      partnerId: string;
      partnerName: string | null;
      partnerEmail: string;
    }>;
  }>;
};

type Target = {
  project: Project;
  host: HTMLElement;
};

const projectStatusLabel: Record<string, string> = {
  PLANNING: "التخطيط",
  IN_PROGRESS: "قيد التنفيذ",
  REVIEW: "المراجعة",
  COMPLETED: "مكتمل",
  ON_HOLD: "متوقف مؤقتًا",
  CANCELLED: "ملغى",
};

function updateProjectFact(card: HTMLElement, labels: string[], nextLabel: string, value: string) {
  const labelNode = Array.from(card.querySelectorAll<HTMLParagraphElement>("p")).find((node) =>
    labels.includes(node.textContent?.trim() || ""),
  );
  if (!labelNode?.parentElement) return;

  const valueNode = Array.from(labelNode.parentElement.querySelectorAll<HTMLParagraphElement>("p")).find((node) => node !== labelNode);
  labelNode.textContent = nextLabel;
  if (valueNode) valueNode.textContent = value;
}

function updatePartnerSummary(card: HTMLElement, names: string[]) {
  const summary = Array.from(card.querySelectorAll<HTMLParagraphElement>("p")).find((node) =>
    node.textContent?.trim().startsWith("الشركاء:"),
  );
  if (summary) summary.textContent = names.length ? `الشركاء: ${names.join("، ")}` : "الشركاء: غير مسند";
  updateProjectFact(card, ["الشركاء"], "الشركاء", names.length ? `${names.length} شريك` : "غير مسند");
}

export default function AdminPartnersLayout({ children }: { children: ReactNode }) {
  const [targets, setTargets] = useState<Target[]>([]);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let lastSignature = "";

    async function sync(force = false) {
      if (cancelled) return;

      const projectCards = Array.from(document.querySelectorAll<HTMLElement>("article")).filter((article) =>
        Array.from(article.querySelectorAll("summary")).some((summary) => summary.textContent?.includes("تعديل المشروع هنا")),
      );

      if (!projectCards.length) {
        lastSignature = "";
        setTargets([]);
        return;
      }

      const signature = projectCards
        .map((card) => `${card.querySelector("h3")?.textContent || ""}|${card.textContent?.match(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/)?.[0] || ""}`)
        .join("||");

      if (!force && signature === lastSignature && projectCards.every((card) => card.querySelector("[data-execution-plan-host]"))) return;
      lastSignature = signature;

      try {
        const response = await fetch("/api/admin/partners?scope=projects", { cache: "no-store" });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || cancelled) return;
        const projects = (data.projects || []) as Project[];

        const executionPairs = await Promise.all(projects.map(async (project) => {
          try {
            const [executionResponse, assignmentResponse] = await Promise.all([
              fetch(`/api/admin/project-stages?projectId=${encodeURIComponent(project.id)}`, { cache: "no-store" }),
              fetch(`/api/admin/stage-partner-assignments?projectId=${encodeURIComponent(project.id)}`, { cache: "no-store" }),
            ]);
            const [executionData, assignmentData] = await Promise.all([
              executionResponse.json().catch(() => ({})),
              assignmentResponse.json().catch(() => ({})),
            ]);
            return [
              project.id,
              {
                execution: executionResponse.ok ? executionData.projects?.[0] as ExecutionProject | undefined : undefined,
                assignments: assignmentResponse.ok ? assignmentData.project as AssignmentProject | undefined : undefined,
              },
            ] as const;
          } catch {
            return [project.id, { execution: undefined, assignments: undefined }] as const;
          }
        }));
        const projectRuntimeById = new Map(executionPairs);
        const nextTargets: Target[] = [];

        for (const project of projects) {
          const card = projectCards.find((candidate) => {
            const title = candidate.querySelector("h3")?.textContent?.trim();
            return title === project.title && candidate.textContent?.includes(project.clientEmail);
          });
          if (!card) continue;

          const runtime = projectRuntimeById.get(project.id);
          const execution = runtime?.execution;
          const executionStages = execution?.projectStages || [];
          const status = execution?.status || project.clientStatus;
          const progress = typeof execution?.progress === "number" ? execution.progress : project.progress;
          const totalAmount = executionStages.reduce((sum, stage) => sum + Number(stage.amount || 0), 0);
          const paidAmount = executionStages
            .filter((stage) => stage.paymentStatus === "PAID")
            .reduce((sum, stage) => sum + Number(stage.amount || 0), 0);
          const paymentState = totalAmount <= 0
            ? "لم تبدأ الفوترة"
            : paidAmount >= totalAmount
              ? "مدفوع بالكامل"
              : paidAmount > 0
                ? "مدفوع جزئيًا"
                : "بانتظار الدفع";
          const financialSummary = totalAmount > 0
            ? `${paidAmount.toLocaleString("ar")} من ${totalAmount.toLocaleString("ar")} ${project.projectCurrency}`
            : "لم تبدأ الفوترة";

          const stagePartnerNames = [...new Set(
            (runtime?.assignments?.projectStages || [])
              .flatMap((stage) => stage.assignments || [])
              .map((assignment) => assignment.partnerName || assignment.partnerEmail),
          )];
          const displayPartnerNames = stagePartnerNames.length
            ? stagePartnerNames
            : project.partners.map((partner) => partner.name);

          updateProjectFact(card, ["الحالة"], "الحالة", projectStatusLabel[status] || status);
          updateProjectFact(card, ["التقدم"], "التقدم", `${progress}%`);
          updateProjectFact(card, ["المستحق", "مالي المشروع"], "مالي المشروع", financialSummary);
          updateProjectFact(card, ["الدفع", "دفع العميل"], "دفع العميل", paymentState);
          updatePartnerSummary(card, displayPartnerNames);

          const editDetails = Array.from(card.querySelectorAll<HTMLDetailsElement>("details")).find((details) =>
            details.querySelector("summary")?.textContent?.includes("تعديل المشروع هنا"),
          );
          if (!editDetails) continue;

          let host = card.querySelector<HTMLElement>(`[data-execution-plan-host="${project.id}"]`);
          if (!host) {
            host = document.createElement("div");
            host.dataset.executionPlanHost = project.id;
            editDetails.insertAdjacentElement("afterend", host);
          }

          nextTargets.push({
            project: {
              ...project,
              clientStatus: status,
              progress,
              partners: displayPartnerNames.map((name) => ({ name })),
            },
            host,
          });
        }

        if (!cancelled) setTargets(nextTargets);
      } catch {
        // The host page already handles dashboard network errors.
      }
    }

    function scheduleSync() {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => void sync(), 120);
    }

    function forceSync() {
      void sync(true);
    }

    const observer = new MutationObserver(scheduleSync);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("admin-projects-refresh", forceSync);
    scheduleSync();

    return () => {
      cancelled = true;
      observer.disconnect();
      window.removeEventListener("admin-projects-refresh", forceSync);
      if (timer) clearTimeout(timer);
    };
  }, []);

  return (
    <>
      <ProjectWorkflowGuard />
      {children}
      {targets.map(({ project, host }) =>
        createPortal(
          <div key={project.id}>
            <ProjectExecutionPlan
              projectId={project.id}
              title={project.title}
              clientName={project.clientName}
              clientEmail={project.clientEmail}
              partners={project.partners.map((partner) => partner.name)}
              status={project.clientStatus}
              progress={project.progress}
              currency={project.projectCurrency}
              dueAt={project.dueAt}
              description={project.description}
              agreementDetails={project.agreementDetails}
              financialPlan={project.financialPlan}
              legacyStages={project.stages}
              links={project.links}
              notes={project.notes}
            />
            <StagePartnerAssignmentManager projectId={project.id} />
          </div>,
          host,
        ),
      )}
    </>
  );
}
