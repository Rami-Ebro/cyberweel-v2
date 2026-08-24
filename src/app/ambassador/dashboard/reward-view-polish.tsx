"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type PaymentProof = {
  attachmentUrl: string | null;
  attachmentName: string | null;
};

type Reward = {
  id: string;
  paymentProof: PaymentProof | null;
  project: {
    title: string;
    client: { name: string | null; email: string };
  };
  projectStage: { name: string };
};

type ProofTarget = {
  rewardId: string;
  host: HTMLElement;
  label: string;
};

const bidiMarks = /[\u200e\u200f\u202a-\u202e\u2066-\u2069]/g;

function normalizeUsdText(root: ParentNode) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();

  while (node) {
    const text = node.textContent || "";
    const clean = text.replace(bidiMarks, "");
    const normalized = clean
      .replace(/\$US[\s\u00a0]*([0-9٠-٩۰-۹][0-9٠-٩۰-۹.,٬٫]*)/g, "$1 USD")
      .replace(/US\$[\s\u00a0]*([0-9٠-٩۰-۹][0-9٠-٩۰-۹.,٬٫]*)/g, "$1 USD")
      .replace(/([0-9٠-٩۰-۹][0-9٠-٩۰-۹.,٬٫]*)[\s\u00a0]*US\$/g, "$1 USD");

    if (normalized !== text && /USD/.test(normalized)) node.textContent = normalized;
    node = walker.nextNode();
  }
}

function rewardApiUrl() {
  const previewId = new URLSearchParams(window.location.search).get("adminPreview");
  return previewId
    ? `/api/ambassador/dashboard?adminPreview=${encodeURIComponent(previewId)}`
    : "/api/ambassador/dashboard";
}

export function RewardViewPolish() {
  const [targets, setTargets] = useState<ProofTarget[]>([]);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function sync() {
      if (cancelled) return;
      normalizeUsdText(document.body);

      try {
        const response = await fetch(rewardApiUrl(), { cache: "no-store" });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || cancelled) return;

        const rewards = (data.rewards || []) as Reward[];
        const rows = Array.from(document.querySelectorAll<HTMLTableRowElement>("tbody tr"))
          .filter((row) => row.querySelectorAll("td").length >= 8);
        const nextTargets: ProofTarget[] = [];

        for (const reward of rewards) {
          if (!reward.paymentProof?.attachmentUrl) continue;
          const client = reward.project.client.name || reward.project.client.email;
          const row = rows.find((candidate) => {
            const text = candidate.textContent || "";
            return text.includes(client) && text.includes(reward.project.title) && text.includes(reward.projectStage.name);
          });
          if (!row) continue;

          const cells = row.querySelectorAll<HTMLTableCellElement>("td");
          const paymentCell = cells[cells.length - 1];
          if (!paymentCell) continue;

          let host = paymentCell.querySelector<HTMLElement>(`[data-ambassador-proof-host="${reward.id}"]`);
          if (!host) {
            host = document.createElement("span");
            host.dataset.ambassadorProofHost = reward.id;
            host.className = "mt-2 block";
            paymentCell.appendChild(host);
          }

          nextTargets.push({
            rewardId: reward.id,
            host,
            label: reward.paymentProof.attachmentName
              ? `عرض إثبات الدفع — ${reward.paymentProof.attachmentName}`
              : "عرض إثبات الدفع",
          });
        }

        if (!cancelled) setTargets(nextTargets);
      } catch {
        // Dashboard data and payment details remain usable even if this visual enhancement cannot refresh.
      }
    }

    function scheduleSync() {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => void sync(), 120);
    }

    const observer = new MutationObserver(scheduleSync);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    scheduleSync();

    return () => {
      cancelled = true;
      observer.disconnect();
      if (timer) clearTimeout(timer);
    };
  }, []);

  return (
    <>
      {targets.map((target) =>
        createPortal(
          <a
            key={target.rewardId}
            href={`/api/rewards/${encodeURIComponent(target.rewardId)}/payment-proof`}
            target="_blank"
            rel="noreferrer"
            className="font-black text-sky-700 underline dark:text-sky-300"
          >
            {target.label}
          </a>,
          target.host,
        ),
      )}
    </>
  );
}
