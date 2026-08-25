"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FileUp } from "lucide-react";

export function PartnerProjectDeliveryLauncher() {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [trigger, setTrigger] = useState<HTMLButtonElement | null>(null);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const sync = () => {
      const original = Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find((button) => {
        const text = (button.textContent || "").trim();
        return text.startsWith("تسليم المرحلة") || text.startsWith("Stage delivery");
      }) || null;

      if (original) {
        original.dataset.cyberweelOriginalDeliveryTrigger = "true";
        original.style.display = "none";
        setTrigger(original);
        const badge = Array.from(original.querySelectorAll<HTMLElement>("span"))
          .map((element) => Number((element.textContent || "").trim()))
          .find((value) => Number.isInteger(value) && value > 0);
        setPendingCount(badge || 0);
      }

      const intro = document.querySelector<HTMLElement>('[data-cyberweel-partner-projects-intro="true"]');
      setTarget(intro || null);
    };

    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, []);

  if (!target || !trigger) return null;

  return createPortal(
    <div data-cyberweel-delivery-launcher="true" className="absolute left-6 top-1/2 z-10 -translate-y-1/2">
      <button
        type="button"
        onClick={() => trigger.click()}
        className="group inline-flex min-w-[190px] items-center justify-center gap-3 rounded-xl border border-[#D0AF68] bg-[#B89A5A] px-5 py-3.5 text-sm font-black text-[#111827] shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:bg-[#C5A763] hover:shadow-xl"
      >
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#111827] text-white">
          <FileUp className="h-4 w-4" />
        </span>
        <span className="text-right leading-5">
          <span className="block">إرسال التسليم</span>
          <span className="block text-[11px] font-bold text-[#111827]/65">إلى مراجعة الإدارة</span>
        </span>
        {pendingCount > 0 && (
          <span className="grid min-h-6 min-w-6 place-items-center rounded-full bg-[#111827] px-1.5 text-[10px] font-black text-white">
            {pendingCount > 9 ? "9+" : pendingCount}
          </span>
        )}
      </button>
    </div>,
    target,
  );
}
