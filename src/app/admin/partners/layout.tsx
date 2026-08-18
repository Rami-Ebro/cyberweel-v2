"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ProjectExecutionPlan } from "@/components/admin/project-execution-plan";

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

type Target = {
  project: Project;
  host: HTMLElement;
};

export default function AdminPartnersLayout({ children }: { children: ReactNode }) {
  const [targets, setTargets] = useState<Target[]>([]);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let lastSignature = "";

    async function sync() {
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

      const accordionReady = projectCards.every((card) => {
        const editDetails = Array.from(card.querySelectorAll<HTMLDetailsElement>("details")).find((details) =>
          details.querySelector("summary")?.textContent?.includes("تعديل المشروع هنا"),
        );
        const host = card.querySelector<HTMLElement>("[data-execution-plan-host]");
        const executionDetails = host?.querySelector<HTMLDetailsElement>("details");
        return Boolean(editDetails?.getAttribute("name") && executionDetails?.getAttribute("name"));
      });

      if (signature === lastSignature && accordionReady) return;
      lastSignature = signature;

      try {
        const response = await fetch("/api/admin/partners?scope=projects", { cache: "no-store" });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || cancelled) return;
        const projects = (data.projects || []) as Project[];
        const nextTargets: Target[] = [];

        for (const project of projects) {
          const card = projectCards.find((candidate) => {
            const title = candidate.querySelector("h3")?.textContent?.trim();
            return title === project.title && candidate.textContent?.includes(project.clientEmail);
          });
          if (!card) continue;

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

          const accordionName = `project-actions-${project.id}`;
          editDetails.setAttribute("name", accordionName);
          const executionDetails = host.querySelector<HTMLDetailsElement>("details");
          if (executionDetails) executionDetails.setAttribute("name", accordionName);

          nextTargets.push({ project, host });
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

    const observer = new MutationObserver(scheduleSync);
    observer.observe(document.body, { childList: true, subtree: true });
    scheduleSync();

    return () => {
      cancelled = true;
      observer.disconnect();
      if (timer) clearTimeout(timer);
    };
  }, []);

  return (
    <>
      {children}
      {targets.map(({ project, host }) =>
        createPortal(
          <ProjectExecutionPlan
            key={project.id}
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
          />,
          host,
        ),
      )}
    </>
  );
}
