"use client";

import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { readSessionStorage, removeSessionStorage, writeSessionStorage } from "@/lib/browser-storage";

const STORAGE_KEY = "cyberweel-partner-delivery-feedback";

type Feedback = { kind: "success" | "error"; message: string };

export function PartnerDeliveryFeedback() {
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const lastMessage = useRef("");

  useEffect(() => {
    queueMicrotask(() => {
      const stored = readSessionStorage(STORAGE_KEY);
      if (stored) {
        removeSessionStorage(STORAGE_KEY);
        setFeedback({ kind: "success", message: stored });
        lastMessage.current = stored;
      }
    });

    const scan = () => {
      const heading = Array.from(document.querySelectorAll("h2")).find(
        (node) => node.textContent?.trim() === "أرسل العمل الحقيقي للمراجعة",
      );
      const modal = heading?.closest("section");
      if (!modal) return;

      const errorNode = modal.querySelector<HTMLElement>('[class*="border-rose-200"][class*="bg-rose-50"]');
      const noticeNode = modal.querySelector<HTMLElement>('[class*="border-emerald-200"][class*="bg-emerald-50"]');
      const message = (errorNode?.textContent || noticeNode?.textContent || "").trim();
      if (!message || message === lastMessage.current) return;

      const kind: Feedback["kind"] = errorNode ? "error" : "success";
      lastMessage.current = message;
      setFeedback({ kind, message });
      if (kind === "success") writeSessionStorage(STORAGE_KEY, message);
    };

    scan();
    const observer = new MutationObserver(scan);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, []);

  if (!feedback) return null;

  return (
    <div
      dir="rtl"
      role={feedback.kind === "error" ? "alert" : "status"}
      aria-live={feedback.kind === "error" ? "assertive" : "polite"}
      className={`fixed left-1/2 top-5 z-[220] flex w-[min(92vw,44rem)] -translate-x-1/2 items-start gap-3 rounded-2xl border px-5 py-4 text-sm font-black shadow-2xl ${
        feedback.kind === "success"
          ? "border-emerald-300 bg-emerald-50 text-emerald-900"
          : "border-rose-300 bg-rose-50 text-rose-900"
      }`}
    >
      <p className="min-w-0 flex-1 text-center leading-7">{feedback.message}</p>
      <button
        type="button"
        onClick={() => setFeedback(null)}
        aria-label="إغلاق الرسالة"
        className="shrink-0 rounded-lg border border-current/20 bg-white/60 p-1.5 transition hover:bg-white"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
