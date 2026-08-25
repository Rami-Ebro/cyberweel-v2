"use client";

import { useEffect } from "react";

/** Routes the legacy projects form to the canonical atomic project-creation API. */
export function CanonicalProjectCreationRouter() {
  useEffect(() => {
    const originalFetch = window.fetch.bind(window);

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      const isLegacyProjectCreate = url.includes("/api/admin/partners") && init?.method === "PATCH" && typeof init.body === "string";
      if (!isLegacyProjectCreate) return originalFetch(input, init);

      let payload: Record<string, unknown> | null = null;
      try {
        payload = JSON.parse(init.body as string) as Record<string, unknown>;
      } catch {
        return originalFetch(input, init);
      }
      if (payload.entity !== "project") return originalFetch(input, init);

      const canonical: Record<string, unknown> = {
        clientId: payload.clientId,
        title: payload.title,
        description: payload.description,
        agreementDetails: payload.agreementDetails,
        stages: payload.stages,
        financialPlan: payload.financialPlan,
        currency: typeof payload.feeCurrency === "string" ? payload.feeCurrency : payload.currency,
        dueAt: payload.dueAt,
        links: payload.links,
        notes: payload.notes,
        referralId: payload.referralId,
      };

      return originalFetch("/api/admin/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(canonical),
      });
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return null;
}
