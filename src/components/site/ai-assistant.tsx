"use client";

import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRightToLine,
  Bot,
  Loader2,
  MessageCircle,
  RotateCcw,
  Send,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { useI18n } from "@/components/site/i18n";
import type { AssistantTurn } from "@/lib/ai/types";
import { cn } from "@/lib/utils";

type UiMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  languageCode?: string;
  welcome?: boolean;
};

type ServiceStatus = "idle" | "checking" | "ready" | "limited" | "unavailable";

type ChatState = {
  messages: UiMessage[];
  lastTurn: AssistantTurn | null;
  leadSubmitted: boolean;
  privacyAccepted: boolean;
};

const STORAGE_KEY = "cyberweel-ai-chat-session-v1";
const RTL_LANGUAGES = new Set(["ar", "fa", "he", "ur", "ps", "dv", "ku", "sd"]);

function messageId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function defaultHandoffUi(arabic: boolean) {
  return arabic
    ? {
        cta: "حوّل طلبي إلى الفريق",
        title: "دع فريق سايبرويل يراجع احتياجك",
        intro: "سنحفظ بيانات التواصل والملخص العربي فقط ضمن نظام الإحالات.",
        nameLabel: "الاسم",
        emailLabel: "البريد الإلكتروني",
        phoneLabel: "رقم الهاتف أو واتساب",
        companyLabel: "الشركة — اختياري",
        needLabel: "وصف الاحتياج",
        submitLabel: "إرسال الطلب",
        cancelLabel: "إلغاء",
        successMessage: "تم تسجيل طلبك بنجاح. سيطّلع عليه فريق سايبرويل.",
      }
    : {
        cta: "Send my request to the team",
        title: "Let the CyberWeel team review your need",
        intro: "Only your contact details and a concise Arabic summary will be saved in our referral system.",
        nameLabel: "Name",
        emailLabel: "Email",
        phoneLabel: "Phone or WhatsApp",
        companyLabel: "Company — optional",
        needLabel: "Describe your need",
        submitLabel: "Send request",
        cancelLabel: "Cancel",
        successMessage: "Your request has been recorded successfully for the CyberWeel team.",
      };
}

function welcomeMessage(arabic: boolean): UiMessage {
  return {
    id: "welcome",
    role: "assistant",
    languageCode: arabic ? "ar" : "en",
    welcome: true,
    content: arabic
      ? "أنا هنا لأفهم احتياجك أولًا، ثم أساعدك في تحديد الخطوة الأنسب. أخبرني بلغتك: ما المشكلة أو المهمة الرقمية التي تحاول حلّها؟"
      : "I’m here to understand what you need first, then help identify the most useful next step. Tell me in your language: what problem or digital task are you trying to solve?",
  };
}

function initialState(arabic: boolean): ChatState {
  if (typeof window !== "undefined") {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as ChatState;
        if (Array.isArray(parsed.messages) && parsed.messages.length) {
          const hasUserMessage = parsed.messages.some((message) => message.role === "user");
          const messages = parsed.messages.map((message) => {
            if (!message.welcome) return message;
            const welcomeIsArabic = hasUserMessage
              ? primaryLanguage(message.languageCode) === "ar"
              : arabic;
            return welcomeMessage(welcomeIsArabic);
          });
          return { ...parsed, messages, privacyAccepted: parsed.privacyAccepted === true };
        }
      }
    } catch {
      // A corrupt browser-only session should never block the assistant.
    }
  }
  return { messages: [welcomeMessage(arabic)], lastTurn: null, leadSubmitted: false, privacyAccepted: false };
}

function primaryLanguage(code?: string) {
  return code?.toLowerCase().split("-")[0] || "en";
}

function directionFor(code?: string) {
  return RTL_LANGUAGES.has(primaryLanguage(code)) ? "rtl" : "ltr";
}

function directionFromText(value: string) {
  return /[\u0590-\u08FF]/.test(value) ? "rtl" : "ltr";
}

function errorText(code: string, languageCode: string) {
  const language = primaryLanguage(languageCode);
  const unavailable: Record<string, string> = {
    ar: "تعذّر تشغيل المساعد الذكي حاليًا. يمكنك المحاولة لاحقًا أو التواصل مباشرة مع فريق سايبرويل.",
    fr: "L’assistant intelligent est momentanément indisponible. Réessayez plus tard ou contactez l’équipe CyberWeel.",
    de: "Der KI-Assistent ist derzeit nicht verfügbar. Versuchen Sie es später erneut oder kontaktieren Sie das CyberWeel-Team.",
    tr: "Akıllı asistan şu anda kullanılamıyor. Daha sonra tekrar deneyin veya CyberWeel ekibiyle iletişime geçin.",
    es: "El asistente inteligente no está disponible en este momento. Inténtalo más tarde o contacta al equipo de CyberWeel.",
  };
  const limited: Record<string, string> = {
    ar: "وصل المساعد إلى حد الاستخدام المجاني حاليًا. لن ننتقل إلى خدمة مدفوعة تلقائيًا؛ حاول لاحقًا أو تواصل مع الفريق.",
    fr: "La limite gratuite est atteinte. Aucun service payant ne sera activé automatiquement. Réessayez plus tard.",
    de: "Das kostenlose Nutzungslimit ist erreicht. Es wird kein kostenpflichtiger Dienst automatisch aktiviert.",
    tr: "Ücretsiz kullanım sınırına ulaşıldı. Ücretli bir hizmet otomatik olarak etkinleştirilmeyecek.",
    es: "Se alcanzó el límite gratuito. No se activará automáticamente ningún servicio de pago.",
  };
  const fallback = code === "QUOTA_EXHAUSTED" || code === "AI_RATE_LIMITED"
    ? "The free usage limit has been reached. No paid service will be enabled automatically. Please try again later."
    : "The AI assistant is temporarily unavailable. Please try again later or contact the CyberWeel team.";
  return (code === "QUOTA_EXHAUSTED" || code === "AI_RATE_LIMITED" ? limited[language] : unavailable[language]) || fallback;
}

function serviceStatusUi(status: ServiceStatus, arabic: boolean) {
  if (status === "ready") {
    return { label: arabic ? "متصل الآن" : "Online", dot: "bg-emerald-400" };
  }
  if (status === "limited") {
    return { label: arabic ? "الخدمة محدودة حاليًا" : "Service limited", dot: "bg-amber-400" };
  }
  if (status === "unavailable") {
    return { label: arabic ? "غير متاح حاليًا" : "Temporarily unavailable", dot: "bg-rose-400" };
  }
  return { label: arabic ? "جارٍ التحقق من الخدمة…" : "Checking service…", dot: "bg-slate-400 animate-pulse" };
}

export function CyberWeelAiAssistant() {
  const { lang } = useI18n();
  const arabicSite = lang === "ar";
  const [open, setOpen] = useState(false);
  const [chat, setChat] = useState<ChatState>(() => initialState(arabicSite));
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [leadOpen, setLeadOpen] = useState(false);
  const [leadBusy, setLeadBusy] = useState(false);
  const [leadError, setLeadError] = useState("");
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus>("idle");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const activeLanguage = chat.lastTurn?.detectedLanguage.primaryCode || (arabicSite ? "ar" : "en");
  const activeDirection = directionFor(activeLanguage);
  const handoffUi = chat.lastTurn?.handoffUi || defaultHandoffUi(arabicSite);
  const statusUi = serviceStatusUi(serviceStatus, arabicSite);
  const latestNeed = useMemo(
    () => [...chat.messages].reverse().find((message) => message.role === "user")?.content || "",
    [chat.messages],
  );
  const hasUserMessage = useMemo(
    () => chat.messages.some((message) => message.role === "user"),
    [chat.messages],
  );
  const apiMessages = useMemo(
    () => chat.messages
      .filter((message) => !message.welcome)
      .map(({ role, content }) => ({ role, content }))
      .slice(-12),
    [chat.messages],
  );

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(chat));
    } catch {
      // The conversation still works when browser storage is unavailable.
    }
  }, [chat]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("cyberweel:ai-assistant-state", {
      detail: { open },
    }));

    return () => {
      if (open) {
        window.dispatchEvent(new CustomEvent("cyberweel:ai-assistant-state", {
          detail: { open: false },
        }));
      }
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void fetch("/api/ai/chat", { method: "GET", headers: { Accept: "application/json" } })
      .then((response) => response.json().catch(() => null))
      .then((payload) => {
        if (cancelled) return;
        const next = payload?.status;
        setServiceStatus((current) => current === "checking"
          ? (next === "ready" || next === "limited" || next === "unavailable" ? next : "unavailable")
          : current);
      })
      .catch(() => {
        if (!cancelled) {
          setServiceStatus((current) => current === "checking" ? "unavailable" : current);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [chat.messages, busy, leadOpen, open]);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  async function requestTurn(messages: Array<{ role: "user" | "assistant"; content: string }>) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.turn) {
        throw new Error(typeof payload.error === "string" ? payload.error : "UNAVAILABLE");
      }
      const turn = payload.turn as AssistantTurn;
      setServiceStatus("ready");
      const assistantMessage: UiMessage = {
        id: messageId(),
        role: "assistant",
        content: turn.reply,
        languageCode: turn.detectedLanguage.code,
      };
      setChat((current) => ({
        ...current,
        lastTurn: turn,
        messages: [...current.messages, assistantMessage].slice(-24),
      }));
    } catch (cause) {
      const code = cause instanceof Error ? cause.message : "UNAVAILABLE";
      if (code === "QUOTA_EXHAUSTED" || code === "AI_RATE_LIMITED") setServiceStatus("limited");
      else setServiceStatus("unavailable");
      setError(errorText(code, activeLanguage));
    } finally {
      setBusy(false);
    }
  }

  async function sendMessage(event: FormEvent) {
    event.preventDefault();
    const content = input.trim().slice(0, 2000);
    if (!content || busy || !chat.privacyAccepted) return;
    const userMessage: UiMessage = { id: messageId(), role: "user", content };
    const next = [...apiMessages, { role: "user" as const, content }].slice(-12);
    setChat((current) => ({
      ...current,
      messages: [
        ...current.messages.map((message) => (
          message.welcome ? welcomeMessage(arabicSite) : message
        )),
        userMessage,
      ].slice(-24),
    }));
    setInput("");
    await requestTurn(next);
  }

  function resetConversation() {
    const next = {
      messages: [welcomeMessage(arabicSite)],
      lastTurn: null,
      leadSubmitted: false,
      privacyAccepted: chat.privacyAccepted,
    };
    setChat(next);
    setError("");
    setLeadOpen(false);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // no-op
    }
  }

  async function submitLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLeadError("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "").trim();
    const phone = String(form.get("phone") || "").trim();
    if (!email && !phone) {
      setLeadError(arabicSite ? "أدخل البريد الإلكتروني أو رقم الهاتف." : "Enter an email address or phone number.");
      return;
    }

    setLeadBusy(true);
    try {
      const response = await fetch("/api/ai/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: String(form.get("name") || ""),
          email,
          phone,
          company: String(form.get("company") || ""),
          need: String(form.get("need") || ""),
          website: String(form.get("website") || ""),
          suggestedServiceArabic: chat.lastTurn?.suggestedServiceArabic || "",
          languageName: chat.lastTurn?.detectedLanguage.name || (arabicSite ? "العربية" : "English"),
          languageCode: chat.lastTurn?.detectedLanguage.code || activeLanguage,
          arabicSummary: chat.lastTurn?.arabicSummary || "لم يتوفر ملخص آلي؛ يحتاج الطلب إلى مراجعة بشرية.",
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "LEAD_SAVE_FAILED");
      setChat((current) => ({ ...current, leadSubmitted: true }));
      setLeadOpen(false);
    } catch {
      setLeadError(arabicSite ? "تعذّر تسجيل الطلب. حاول مرة أخرى." : "The request could not be saved. Please try again.");
    } finally {
      setLeadBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          const nextOpen = !open;
          if (nextOpen) setServiceStatus("checking");
          setOpen(nextOpen);
          window.setTimeout(() => inputRef.current?.focus(), 80);
        }}
        aria-label={arabicSite ? "فتح مساعد سايبرويل الذكي" : "Open CyberWeel AI Assistant"}
        aria-expanded={open}
        className={cn(
          "fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom))] right-4 z-40 grid h-14 w-14 place-items-center rounded-full border border-[#D7BD82] bg-[#111827] text-[#D7BD82] shadow-[0_18px_45px_rgba(17,24,39,0.28)] transition hover:-translate-y-0.5 hover:bg-[#1F2937] sm:right-6",
          open && "bg-[#B89A5A] text-[#111827]",
        )}
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {open && (
        <section
          role="dialog"
          aria-label="CyberWeel AI Assistant"
          dir={activeDirection}
          className="fixed inset-x-3 bottom-[calc(6rem+env(safe-area-inset-bottom))] z-40 flex h-[min(32rem,calc(100dvh_-_7.5rem_-_env(safe-area-inset-bottom)))] max-h-[76dvh] flex-col overflow-hidden rounded-[1.6rem] border border-[#D8D2C4] bg-[#FCFAF6] shadow-[0_28px_80px_rgba(17,24,39,0.28)] sm:inset-x-auto sm:right-6 sm:w-[25rem]"
        >
          <header className="flex items-center justify-between gap-3 border-b border-[#E7E0D4] bg-[#111827] px-4 py-3.5 text-white">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#B89A5A]/50 bg-white/5 text-[#D7BD82]">
                <Sparkles className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h2 className="truncate text-sm font-black">CyberWeel AI Assistant</h2>
                <p className="mt-0.5 flex items-center gap-1.5 truncate text-[11px] text-slate-300" role="status" aria-live="polite">
                  <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", statusUi.dot)} aria-hidden />
                  {statusUi.label}
                </p>
              </div>
            </div>
            <button type="button" onClick={resetConversation} className="rounded-lg p-2 text-slate-300 transition hover:bg-white/10 hover:text-white" aria-label={arabicSite ? "محادثة جديدة" : "New conversation"}>
              <RotateCcw className="h-4 w-4" />
            </button>
          </header>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-3.5 py-4" aria-live="polite">
            {!chat.privacyAccepted ? (
              <div className="rounded-2xl border border-[#D7BD82] bg-white p-4 text-sm leading-6 text-slate-700" dir={arabicSite ? "rtl" : "ltr"}>
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-[#9A7D43]" />
                  <div>
                    <h3 className="font-black text-[#111827]">{arabicSite ? "قبل أن نبدأ" : "Before we begin"}</h3>
                    <p className="mt-2">{arabicSite ? "تُرسل رسائلك إلى Gemini ضمن الخطة المجانية، وقد تستخدم Google المحتوى لتحسين منتجاتها. ننقّح أنماط البريد والهاتف الواضحة ولا نحفظ المحادثة على خادم سايبرويل، لكن لا ترسل كلمات مرور أو بيانات دفع أو معلومات حساسة." : "Your messages are sent to Gemini under its Free Tier, and Google may use the content to improve its products. We redact obvious email and phone patterns and do not store the chat on CyberWeel servers, but do not send passwords, payment details, or sensitive information."}</p>
                    <button type="button" onClick={() => setChat((current) => ({ ...current, privacyAccepted: true }))} className="mt-3 rounded-xl bg-[#111827] px-4 py-2.5 text-xs font-black text-white">
                      {arabicSite ? "مفهوم، ابدأ المحادثة" : "Understood, start the conversation"}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2 rounded-xl border border-[#E5DED0] bg-white/70 px-3 py-2.5 text-[11px] leading-5 text-slate-600" dir={arabicSite ? "rtl" : "ltr"}>
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#9A7D43]" />
                <span>{arabicSite ? "لا ترسل كلمات مرور أو بيانات دفع. تُنقّح أنماط البريد والهاتف الواضحة قبل إرسال النص إلى Gemini." : "Do not send passwords or payment data. Obvious email and phone patterns are redacted before text is sent to Gemini."}</span>
              </div>
            )}

            {chat.messages.map((message) => {
              const messageDirection = message.role === "user"
                ? directionFromText(message.content)
                : directionFor(message.languageCode);
              return (
                <div key={message.id} className={cn("flex items-end gap-2", message.role === "user" ? "justify-end" : "justify-start")} dir={messageDirection}>
                  {message.role === "assistant" && <span className="mb-1 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#111827] text-[#D7BD82]"><Bot className="h-3.5 w-3.5" /></span>}
                  <p className={cn(
                    "max-w-[82%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-sm leading-6",
                    message.role === "user"
                      ? "rounded-ee-md bg-[#111827] text-white"
                      : "rounded-es-md border border-[#E4DCCF] bg-white text-[#1F2937]",
                  )}>
                    {message.welcome && !hasUserMessage
                      ? welcomeMessage(arabicSite).content
                      : message.content}
                  </p>
                </div>
              );
            })}

            {busy && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-[#111827] text-[#D7BD82]"><Bot className="h-3.5 w-3.5" /></span>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{arabicSite ? "يفكر في الخطوة الأنسب…" : "Thinking through the next step…"}</span>
              </div>
            )}

            {error && (
              <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
                <p>{error}</p>
                {apiMessages.at(-1)?.role === "user" && (
                  <button type="button" disabled={busy} onClick={() => void requestTurn(apiMessages)} className="mt-2 font-black underline underline-offset-4">
                    {arabicSite ? "إعادة المحاولة" : "Try again"}
                  </button>
                )}
              </div>
            )}

            {chat.leadSubmitted ? (
              <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold leading-6 text-emerald-900" dir={activeDirection}>
                {handoffUi.successMessage}
              </p>
            ) : chat.lastTurn?.shouldOfferLeadForm && !leadOpen ? (
              <button type="button" onClick={() => setLeadOpen(true)} className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#B89A5A] bg-[#F7F3EB] px-4 py-3 text-sm font-black text-[#7C6334] transition hover:bg-[#EFE6D4]">
                <ArrowRightToLine className="h-4 w-4" />
                {handoffUi.cta}
              </button>
            ) : null}

            {leadOpen && !chat.leadSubmitted && (
              <form onSubmit={submitLead} className="space-y-3 rounded-2xl border border-[#D7BD82] bg-white p-4 shadow-sm" dir={activeDirection}>
                <div>
                  <h3 className="font-black text-[#111827]">{handoffUi.title}</h3>
                  <p className="mt-1 text-xs leading-5 text-slate-600">{handoffUi.intro}</p>
                </div>
                <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
                <input name="name" required maxLength={120} placeholder={handoffUi.nameLabel} className="w-full rounded-xl border border-[#D8D2C4] bg-[#FCFAF6] px-3 py-2.5 text-sm outline-none focus:border-[#B89A5A]" />
                <div className="grid gap-3 sm:grid-cols-2">
                  <input name="email" type="email" maxLength={254} placeholder={handoffUi.emailLabel} dir="ltr" className="w-full rounded-xl border border-[#D8D2C4] bg-[#FCFAF6] px-3 py-2.5 text-sm outline-none focus:border-[#B89A5A]" />
                  <input name="phone" maxLength={40} placeholder={handoffUi.phoneLabel} dir="ltr" className="w-full rounded-xl border border-[#D8D2C4] bg-[#FCFAF6] px-3 py-2.5 text-sm outline-none focus:border-[#B89A5A]" />
                </div>
                <input name="company" maxLength={160} placeholder={handoffUi.companyLabel} className="w-full rounded-xl border border-[#D8D2C4] bg-[#FCFAF6] px-3 py-2.5 text-sm outline-none focus:border-[#B89A5A]" />
                <label className="grid gap-1.5 text-xs font-bold text-slate-600">
                  {handoffUi.needLabel}
                  <textarea name="need" required maxLength={3000} rows={4} defaultValue={latestNeed} className="resize-y rounded-xl border border-[#D8D2C4] bg-[#FCFAF6] px-3 py-2.5 text-sm font-normal text-slate-900 outline-none focus:border-[#B89A5A]" />
                </label>
                {leadError && <p role="alert" className="text-xs font-bold text-rose-700">{leadError}</p>}
                <div className="flex gap-2">
                  <button disabled={leadBusy} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#111827] px-4 py-2.5 text-sm font-black text-white disabled:opacity-60">
                    {leadBusy && <Loader2 className="h-4 w-4 animate-spin" />}
                    {handoffUi.submitLabel}
                  </button>
                  <button type="button" onClick={() => setLeadOpen(false)} className="rounded-xl border border-[#D8D2C4] px-4 py-2.5 text-sm font-bold text-slate-600">
                    {handoffUi.cancelLabel}
                  </button>
                </div>
              </form>
            )}
          </div>

          <form onSubmit={sendMessage} className="border-t border-[#E7E0D4] bg-white p-3">
            <div className="flex items-end gap-2" dir={directionFromText(input)}>
              <textarea
                ref={inputRef}
                value={input}
                disabled={!chat.privacyAccepted}
                onChange={(event) => setInput(event.target.value.slice(0, 2000))}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                  }
                }}
                rows={1}
                maxLength={2000}
                placeholder={!chat.privacyAccepted ? (arabicSite ? "وافق على إشعار الخصوصية أولًا" : "Accept the privacy notice first") : (arabicSite ? "اكتب بلغتك…" : "Write in your language…")}
                aria-label={arabicSite ? "رسالتك" : "Your message"}
                className="max-h-28 min-h-11 flex-1 resize-none rounded-xl border border-[#D8D2C4] bg-[#FCFAF6] px-3 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-[#B89A5A]"
              />
              <button type="submit" disabled={busy || !input.trim() || !chat.privacyAccepted} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#B89A5A] text-[#111827] transition hover:bg-[#A9894E] disabled:cursor-not-allowed disabled:opacity-40" aria-label={arabicSite ? "إرسال" : "Send"}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
            <p className="mt-2 text-center text-[10px] text-slate-400" dir={arabicSite ? "rtl" : "ltr"}>
              {arabicSite ? "قد يخطئ الذكاء الاصطناعي؛ لا تُعدّ الإجابات عرضًا أو التزامًا من سايبرويل." : "AI can make mistakes. Replies are not a quote or commitment from CyberWeel."}
            </p>
          </form>
        </section>
      )}
    </>
  );
}
