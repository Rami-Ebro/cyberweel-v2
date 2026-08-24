"use client";

import { FormEvent, Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { BadgeDollarSign, RefreshCw, Search } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { DateText } from "@/components/ui/date-text";
import { dashboardErrorMessage } from "@/lib/dashboard-labels";

type RewardStatus = "EXPECTED" | "EARNED" | "PAID" | "CANCELLED";
type PaymentProof = {
  method: string;
  reference: string;
  paidAt: string;
  note: string | null;
  attachmentUrl: string | null;
  attachmentName: string | null;
  attachmentType: string | null;
};
type Reward = {
  id: string;
  rate: string;
  baseAmount: string;
  amount: string;
  currency: string;
  status: RewardStatus;
  earnedAt: string | null;
  paidAt: string | null;
  cancelReason: string | null;
  adminNotes: string | null;
  ambassador: {
    id: string;
    payoutMethod: string | null;
    payoutDetails: string | null;
    user: { name: string | null; email: string };
  };
  referral: { id: string; name: string | null; email: string | null };
  project: { id: string; title: string; client: { id: string; name: string | null; email: string } };
  projectStage: {
    id: string;
    name: string;
    status: string;
    paymentStatus: string;
    completedAt: string | null;
    approvedAt: string | null;
  };
};
type Project = {
  id: string;
  title: string;
  currency: string;
  financialPlan: string | null;
  ambassadorRewardRate: string | null;
  client: { name: string | null; email: string };
  referral: {
    ambassadorId: string | null;
    ambassador: { user: { name: string | null; email: string } } | null;
  };
  projectStages: Array<{ id: string; amount: string }>;
};
type AdminAmbassador = {
  id: string;
  user: { name: string | null; email: string };
  referralStats: { successfulThisMonth: number };
  currentLevel: { id: string; name: string; minSuccessfulReferrals: number; rate: string } | null;
};
type AccountSummary = {
  currency: string;
  total: number;
  remaining: number;
  earned: number;
  paid: number;
};

const FIXED_REWARD_LEVELS = [
  { id: "fixed-1", name: "منطلق", minSuccessfulReferrals: 1, rate: "10" },
  { id: "fixed-2", name: "نشط", minSuccessfulReferrals: 2, rate: "15" },
  { id: "fixed-3", name: "نخبة", minSuccessfulReferrals: 5, rate: "20" },
] as const;

const PAYMENT_PROOF_PREFIX = "PAYMENT_PROOF:";
const MAX_PAYMENT_PROOF_SIZE = 4 * 1024 * 1024;
const ALLOWED_PAYMENT_PROOF_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "application/pdf"]);
const statusLabels: Record<RewardStatus, string> = {
  EXPECTED: "قيد الاستحقاق",
  EARNED: "بانتظار الدفع",
  PAID: "مدفوعة",
  CANCELLED: "ملغاة",
};
const statusStyles: Record<RewardStatus, string> = {
  EXPECTED: "bg-amber-100 text-amber-800",
  EARNED: "bg-emerald-100 text-emerald-800",
  PAID: "bg-sky-100 text-sky-800",
  CANCELLED: "bg-rose-100 text-rose-800",
};

function amount(value: string | number, currency: string) {
  return `${Number(value).toLocaleString("ar", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

function normalizeDigits(value: string) {
  const arabic = "٠١٢٣٤٥٦٧٨٩";
  const eastern = "۰۱۲۳۴۵۶۷۸۹";
  return value
    .replace(/[٠-٩]/g, (digit) => String(arabic.indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String(eastern.indexOf(digit)));
}

function financialPlanAmounts(value: string | null) {
  if (!value) return [];
  return value
    .split(/\r?\n/)
    .map((line) => normalizeDigits(line))
    .map((line) => {
      const match = line.match(/(?:\$\s*([0-9][0-9.,]*)|([0-9][0-9.,]*)\s*(?:\$|USD|EUR|SYP|TRY|دولار|دولارات|يورو|ليرة))/i);
      return Number((match?.[1] || match?.[2] || "0").replace(/,/g, ""));
    })
    .filter((value) => Number.isFinite(value) && value > 0);
}

function plannedProjectAmount(project: Project) {
  const planned = financialPlanAmounts(project.financialPlan);
  if (planned.length) return planned.reduce((sum, value) => sum + value, 0);
  return project.projectStages.reduce((sum, stage) => {
    const value = Number(stage.amount);
    return Number.isFinite(value) ? sum + value : sum;
  }, 0);
}

function paymentProof(value: string | null): PaymentProof | null {
  if (!value?.startsWith(PAYMENT_PROOF_PREFIX)) return null;
  try {
    const parsed = JSON.parse(value.slice(PAYMENT_PROOF_PREFIX.length)) as Partial<PaymentProof>;
    if (!parsed.method || !parsed.reference || !parsed.paidAt) return null;
    return {
      method: String(parsed.method),
      reference: String(parsed.reference),
      paidAt: String(parsed.paidAt),
      note: parsed.note ? String(parsed.note) : null,
      attachmentUrl: parsed.attachmentUrl ? String(parsed.attachmentUrl) : null,
      attachmentName: parsed.attachmentName ? String(parsed.attachmentName) : null,
      attachmentType: parsed.attachmentType ? String(parsed.attachmentType) : null,
    };
  } catch {
    return null;
  }
}

export default function AdminRewardsPage() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [adminAmbassadors, setAdminAmbassadors] = useState<AdminAmbassador[]>([]);
  const [selectedAmbassadorId, setSelectedAmbassadorId] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"ALL" | RewardStatus>("ALL");
  const [payingRewardId, setPayingRewardId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [rewardsResponse, ambassadorsResponse] = await Promise.all([
      fetch("/api/admin/rewards", { cache: "no-store" }),
      fetch("/api/admin/ambassadors", { cache: "no-store" }),
    ]);
    const data = await rewardsResponse.json().catch(() => null);
    if (rewardsResponse.ok) {
      setRewards(data.rewards || []);
      setProjects(data.projects || []);
    } else {
      setMessage(dashboardErrorMessage(data?.error, "تعذر تحميل المكافآت"));
    }

    if (ambassadorsResponse.ok) {
      const ambassadorData = await ambassadorsResponse.json().catch(() => null);
      const rows = (ambassadorData?.ambassadors || []) as AdminAmbassador[];
      setAdminAmbassadors(rows);
      setSelectedAmbassadorId((current) => rows.some((item) => item.id === current) ? current : rows[0]?.id || "");
    }
    setLoading(false);
  }, []);

  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  async function mutate(payload: Record<string, unknown>, success: string) {
    setBusy(String(payload.rewardId || payload.id || payload.action));
    setMessage("");
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch("/api/admin/rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      const data = await response.json().catch(() => null);
      setMessage(response.ok ? success : dashboardErrorMessage(data?.error, "تعذر حفظ العملية"));
      if (response.ok) await load();
      return response.ok;
    } catch (cause) {
      setMessage(cause instanceof DOMException && cause.name === "AbortError" ? "انتهت مهلة الحفظ. حاول مرة أخرى." : "تعذر حفظ العملية");
      return false;
    } finally {
      window.clearTimeout(timeout);
      setBusy("");
    }
  }

  async function submitPayment(event: FormEvent<HTMLFormElement>, reward: Reward) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const proof = paymentProof(reward.adminNotes);
    const proofExists = Boolean(proof);
    const attachment = data.get("paymentAttachment");
    let attachmentUrl = proof?.attachmentUrl || null;
    let attachmentName = proof?.attachmentName || null;
    let attachmentType = proof?.attachmentType || null;

    if (attachment instanceof File && attachment.size > 0) {
      if (attachment.size > MAX_PAYMENT_PROOF_SIZE) {
        setMessage("حجم مرفق إثبات الدفع يجب ألا يتجاوز 4 MB");
        return;
      }
      if (!ALLOWED_PAYMENT_PROOF_TYPES.has(attachment.type)) {
        setMessage("صيغة المرفق غير مدعومة. استخدم PNG أو JPG أو WebP أو PDF");
        return;
      }

      setBusy(reward.id);
      setMessage("جارٍ رفع مرفق إثبات الدفع...");
      const uploadController = new AbortController();
      const uploadTimeout = window.setTimeout(() => uploadController.abort(), 30000);
      try {
        const uploadForm = new FormData();
        uploadForm.append("rewardId", reward.id);
        uploadForm.append("file", attachment);
        const response = await fetch("/api/admin/rewards/payment-proof-upload", {
          method: "POST",
          body: uploadForm,
          signal: uploadController.signal,
        });
        const uploaded = await response.json().catch(() => null);
        if (!response.ok || !uploaded?.url) {
          setMessage(dashboardErrorMessage(uploaded?.error, "تعذر رفع مرفق إثبات الدفع"));
          setBusy("");
          return;
        }
        attachmentUrl = String(uploaded.url);
        attachmentName = attachment.name;
        attachmentType = attachment.type;
      } catch (cause) {
        setBusy("");
        setMessage(cause instanceof DOMException && cause.name === "AbortError" ? "انتهت مهلة رفع المرفق. حاول مرة أخرى." : "تعذر رفع مرفق إثبات الدفع");
        return;
      } finally {
        window.clearTimeout(uploadTimeout);
      }
    }

    setMessage("جارٍ حفظ إثبات الدفع...");
    const saved = await mutate({
      action: "reward_status",
      rewardId: reward.id,
      status: "PAID",
      paymentMethod: data.get("paymentMethod"),
      paymentReference: data.get("paymentReference"),
      paymentDate: data.get("paymentDate"),
      adminNotes: data.get("adminNotes"),
      paymentAttachmentUrl: attachmentUrl,
      paymentAttachmentName: attachmentName,
      paymentAttachmentType: attachmentType,
    }, proofExists ? "تم تحديث إثبات الدفع" : reward.status === "PAID" ? "تم استكمال إثبات الدفع" : "تم تسجيل المكافأة كمدفوعة مع إثبات الدفع");
    if (saved) setPayingRewardId(null);
  }

  async function cancelReward(reward: Reward) {
    const cancelReason = window.prompt("اكتب سبب إلغاء المكافأة:")?.trim();
    if (!cancelReason) return;
    await mutate({ action: "reward_status", rewardId: reward.id, status: "CANCELLED", cancelReason }, "تم إلغاء المكافأة");
  }

  const selectedAmbassador = useMemo(
    () => adminAmbassadors.find((ambassador) => ambassador.id === selectedAmbassadorId) || null,
    [adminAmbassadors, selectedAmbassadorId],
  );

  const selectedRewards = useMemo(
    () => selectedAmbassadorId ? rewards.filter((reward) => reward.ambassador.id === selectedAmbassadorId) : rewards,
    [rewards, selectedAmbassadorId],
  );

  const qualifiedProjects = useMemo(
    () => projects.filter((project) => Boolean(project.ambassadorRewardRate) && (!selectedAmbassadorId || project.referral.ambassadorId === selectedAmbassadorId)),
    [projects, selectedAmbassadorId],
  );

  const filtered = useMemo(() => selectedRewards.filter((reward) => {
    const haystack = [reward.ambassador.user.name, reward.ambassador.user.email, reward.project.client.name, reward.project.client.email, reward.project.title, reward.projectStage.name].filter(Boolean).join(" ").toLowerCase();
    return (status === "ALL" || reward.status === status) && haystack.includes(search.trim().toLowerCase());
  }), [selectedRewards, search, status]);

  const accountSummary = useMemo(() => {
    const map = new Map<string, AccountSummary>();

    for (const project of qualifiedProjects) {
      const rate = Number(project.ambassadorRewardRate || 0);
      const planned = plannedProjectAmount(project);
      if (!Number.isFinite(rate) || rate <= 0 || !Number.isFinite(planned) || planned <= 0) continue;
      const currency = project.currency.toUpperCase();
      const row = map.get(currency) || { currency, total: 0, remaining: 0, earned: 0, paid: 0 };
      row.total += planned * rate / 100;
      map.set(currency, row);
    }

    for (const reward of selectedRewards) {
      const value = Number(reward.amount);
      if (!Number.isFinite(value)) continue;
      const currency = reward.currency.toUpperCase();
      const row = map.get(currency) || { currency, total: 0, remaining: 0, earned: 0, paid: 0 };
      if (reward.status === "EARNED") row.earned += value;
      if (reward.status === "PAID") row.paid += value;
      if (!row.total && reward.status !== "CANCELLED") row.total += value;
      map.set(currency, row);
    }

    for (const row of map.values()) {
      row.total = Math.max(row.total, row.earned + row.paid);
      row.remaining = Math.max(0, row.total - row.earned - row.paid);
    }
    return [...map.values()];
  }, [qualifiedProjects, selectedRewards]);

  const quickCards = [
    { key: "total", label: "إجمالي المكافأة" },
    { key: "remaining", label: "متبقية متوقعة" },
    { key: "earned", label: "بانتظار الدفع" },
    { key: "paid", label: "مدفوعة" },
  ] as const;

  return <AdminShell active="rewards" title="مكافآت السفراء" description="المراحل تأتي من بيانات المشروع؛ هنا نتابع المتوقع وما ينتظر الدفع وما تم دفعه.">
    {message && <p className="mt-6 rounded-xl border border-[#D8D2C4] bg-white p-4 font-bold">{message}</p>}
    {loading ? <p className="mt-7 flex items-center justify-center gap-2 rounded-2xl bg-white p-12"><RefreshCw className="animate-spin" /> جارٍ التحميل...</p> : <>
      <section className="mt-7 rounded-2xl border border-[#D8D2C4] bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><p className="text-sm font-black text-[#9A7D43]">سياسة المكافآت المعتمدة</p><h2 className="mt-1 text-2xl font-black">سلم مستويات السفراء</h2><p className="mt-2 text-sm text-slate-500">اختر السفير لتظهر بياناته المالية ومستواه الحالي من نفس مصدر البيانات المستخدم في لوحة السفير.</p></div>
          <div className="grid gap-2 sm:min-w-72">
            {adminAmbassadors.length ? <label className="grid gap-1 text-sm font-black text-[#6F5A32]">السفير
              <select value={selectedAmbassadorId} onChange={(event) => setSelectedAmbassadorId(event.target.value)} className="field bg-white font-normal text-slate-900">
                {adminAmbassadors.map((ambassador) => <option key={ambassador.id} value={ambassador.id}>{ambassador.user.name || ambassador.user.email}</option>)}
              </select>
            </label> : <span className="inline-flex items-center gap-2 rounded-full bg-[#F7F3EB] px-4 py-2 text-sm font-black text-[#7A6233]"><BadgeDollarSign className="h-4 w-4" />السياسة النظامية الثابتة</span>}
            {selectedAmbassador && <p className="text-xs font-bold text-slate-500">الإحالات الناجحة ماليًا هذا الشهر: {selectedAmbassador.referralStats.successfulThisMonth}</p>}
          </div>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">{FIXED_REWARD_LEVELS.map((level) => {
          const current = Boolean(selectedAmbassador?.currentLevel && selectedAmbassador.currentLevel.name === level.name && selectedAmbassador.currentLevel.rate === level.rate);
          return <article key={level.id} className={`relative rounded-2xl border p-5 transition ${current ? "border-2 border-[#B89A5A] bg-[#FFF7DF] shadow-lg ring-2 ring-[#B89A5A]/20" : "border-[#E6E0D4] bg-[#FCFAF6]"}`}>
            {current && <span className="absolute -top-3 right-4 rounded-full bg-[#B89A5A] px-3 py-1 text-xs font-black text-[#111827] shadow">✓ المستوى الحالي</span>}
            <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-black text-[#9A7D43]">{current ? "مستوى السفير المحدد" : `من ${level.minSuccessfulReferrals} إحالة ناجحة ماليًا`}</p><h3 className="mt-1 text-xl font-black">{level.name}</h3></div><strong className="text-3xl font-black text-[#9A7D43]">{level.rate}%</strong></div><p className="mt-3 text-sm text-slate-500">{level.minSuccessfulReferrals === 1 ? "يبدأ بعد أول إحالة ناجحة ماليًا في الشهر." : `يبدأ عند الوصول إلى ${level.minSuccessfulReferrals} إحالات ناجحة ماليًا خلال الشهر.`}</p>
          </article>;
        })}</div>
        {selectedAmbassador && !selectedAmbassador.currentLevel && <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm font-bold text-slate-600">هذا السفير لم يصل بعد إلى مستوى «منطلق»؛ يبدأ المستوى بعد أول إحالة ناجحة ماليًا.</p>}
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">{quickCards.map((card) => <article key={card.key} className="rounded-2xl border border-[#D8D2C4] bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">{card.label}</p><div className="mt-2 space-y-1">{accountSummary.length ? accountSummary.map((summary) => <strong key={summary.currency} className="block text-xl">{amount(summary[card.key], summary.currency)}</strong>) : <strong className="text-xl">0.00</strong>}</div></article>)}</section>

      <section className="mt-6 rounded-2xl border border-[#D8D2C4] bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-black text-[#9A7D43]">من الاتفاق حتى الدفع</p><h2 className="mt-1 text-2xl font-black">المشاريع المؤهلة للمكافآت</h2><p className="mt-2 text-sm text-slate-500">تأتي المراحل تلقائيًا من معلومات المشروع وتُدار من صفحة المشروع، وليست من قسم مكافآت السفراء.</p></div><span className="rounded-full bg-[#F7F3EB] px-3 py-1 text-sm font-black text-[#7A6233]">{qualifiedProjects.length}</span></div>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">{qualifiedProjects.map((project) => {
          const ambassadorName = project.referral.ambassador?.user.name || project.referral.ambassador?.user.email || "سفير غير محدد";
          const hasStages = project.projectStages.length > 0;
          return <article key={project.id} className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-black text-emerald-700">{ambassadorName}</p><h3 className="mt-1 text-xl font-black">{project.title}</h3><p className="mt-1 text-sm text-slate-600">العميل: {project.client.name || project.client.email}</p></div><span className="rounded-full bg-emerald-600 px-4 py-2 font-black text-white">{project.ambassadorRewardRate}%</span></div>
            <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2"><p><span className="text-slate-500">النسبة:</span> <strong>{project.ambassadorRewardRate}% محفوظة</strong></p><p><span className="text-slate-500">عدد المراحل:</span> <strong>{project.projectStages.length}</strong></p><p className="sm:col-span-2"><span className="text-slate-500">الحالة:</span> <strong className={hasStages ? "text-emerald-700" : "text-[#9A7D43]"}>{hasStages ? "المراحل مرتبطة بالمشروع وتدار من صفحة المشروع" : "لا توجد مراحل منظمة لهذا المشروع القديم؛ عدّل بيانات المشروع"}</strong></p></div>
          </article>;
        })}{!qualifiedProjects.length && <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500 lg:col-span-2">لا توجد مشاريع مؤهلة للمكافآت حاليًا.</p>}</div>
      </section>

      <section className="mt-6 rounded-2xl border border-[#D8D2C4] bg-white p-5"><div className="flex flex-col gap-3 md:flex-row"><label className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 px-4"><Search className="h-4 w-4 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="بحث بالعميل أو المشروع أو المرحلة" className="w-full py-3 outline-none" /></label><select value={status} onChange={(event) => setStatus(event.target.value as typeof status)} className="field md:max-w-52"><option value="ALL">كل الحالات</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div><div className="mt-5 overflow-x-auto"><table className="w-full min-w-[1150px] text-right text-sm"><thead className="bg-[#F7F3EB]"><tr><th className="p-3">السفير</th><th className="p-3">العميل</th><th className="p-3">المشروع / المرحلة</th><th className="p-3">قيمة المرحلة</th><th className="p-3">النسبة</th><th className="p-3">المكافأة</th><th className="p-3">الحالة</th><th className="p-3">إثبات الدفع</th><th className="p-3">الإجراء</th></tr></thead><tbody>{filtered.map((reward) => {
        const proof = paymentProof(reward.adminNotes);
        const canEditProof = reward.status === "PAID";
        const proofHref = `/api/rewards/${reward.id}/payment-proof`;
        return <Fragment key={reward.id}>
          <tr className="border-t border-slate-100"><td className="p-3 font-black">{reward.ambassador.user.name || reward.ambassador.user.email}</td><td className="p-3">{reward.project.client.name || reward.project.client.email}</td><td className="p-3"><strong>{reward.project.title}</strong><span className="block text-slate-500">{reward.projectStage.name}</span></td><td className="p-3">{amount(reward.baseAmount, reward.currency)}</td><td className="p-3">{reward.rate}%</td><td className="p-3 font-black">{amount(reward.amount, reward.currency)}</td><td className="p-3"><span className={`rounded-full px-3 py-1 text-xs font-black ${statusStyles[reward.status]}`}>{statusLabels[reward.status]}</span>{reward.earnedAt && <span className="mt-1 block text-xs text-slate-500"><DateText value={reward.earnedAt} /></span>}{reward.paidAt && <span className="block text-xs text-slate-500">دُفعت <DateText value={reward.paidAt} /></span>}</td><td className="p-3">{proof ? <div className="space-y-1 text-xs"><strong className="block text-slate-900">{proof.method}</strong><span dir="ltr" className="block text-right text-slate-600 [unicode-bidi:isolate]">{proof.reference}</span><span className="block text-slate-500"><DateText value={proof.paidAt} /></span>{proof.attachmentUrl && <a href={proofHref} target="_blank" rel="noreferrer" className="block font-black text-sky-700 underline">عرض المرفق{proof.attachmentName ? ` — ${proof.attachmentName}` : ""}</a>}{proof.note && <span className="block text-slate-500">{proof.note}</span>}</div> : reward.status === "PAID" ? <span className="font-bold text-rose-700">لم يُسجل إثبات الدفع</span> : <span className="text-slate-500">{reward.ambassador.payoutMethod || "غير مسجلة"}</span>}</td><td className="p-3"><div className="flex flex-wrap gap-2">{reward.status === "EXPECTED" && <span className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">بانتظار اكتمال المرحلة والدفع والاعتماد</span>}{reward.status === "EARNED" && <button type="button" onClick={() => setPayingRewardId(reward.id)} className="rounded-lg bg-sky-100 px-3 py-2 font-bold text-sky-800">تسجيل الدفع</button>}{canEditProof && <button type="button" onClick={() => setPayingRewardId(reward.id)} className="rounded-lg bg-amber-100 px-3 py-2 font-bold text-amber-900">{proof ? "تعديل الإثبات" : "إضافة إثبات الدفع"}</button>}{reward.status !== "PAID" && reward.status !== "CANCELLED" && <button type="button" onClick={() => void cancelReward(reward)} className="rounded-lg bg-rose-100 px-3 py-2 font-bold text-rose-800">إلغاء</button>}</div></td></tr>
          {payingRewardId === reward.id && <tr className="border-t border-sky-100 bg-sky-50/50"><td colSpan={9} className="p-4"><form onSubmit={(event) => void submitPayment(event, reward)} className="grid gap-3 md:grid-cols-4"><label className="grid gap-2 font-bold">وسيلة الدفع<input name="paymentMethod" required maxLength={120} defaultValue={proof?.method || reward.ambassador.payoutMethod || ""} placeholder="مثال: شام كاش / تحويل بنكي" className="field bg-white font-normal" /></label><label className="grid gap-2 font-bold">مرجع العملية<input name="paymentReference" required maxLength={180} defaultValue={proof?.reference || ""} placeholder="رقم الحوالة أو مرجع التحويل" className="field bg-white font-normal" /></label><label className="grid gap-2 font-bold">تاريخ الدفع<input name="paymentDate" type="date" required defaultValue={(proof?.paidAt || reward.paidAt || new Date().toISOString()).slice(0, 10)} className="field bg-white font-normal" /></label><label className="grid gap-2 font-bold">ملاحظة — اختياري<input name="adminNotes" maxLength={2000} defaultValue={proof?.note || ""} className="field bg-white font-normal" /></label><label className="grid gap-2 font-bold md:col-span-4">مرفق إثبات الدفع — اختياري<input name="paymentAttachment" type="file" accept="image/png,image/jpeg,image/webp,application/pdf" className="field bg-white font-normal" /><span className="text-xs font-normal text-slate-500">صورة إشعار أو إيصال بصيغة PNG/JPG/WebP أو PDF، بحد أقصى 4 MB.</span>{proof?.attachmentUrl && <a href={proofHref} target="_blank" rel="noreferrer" className="w-fit text-xs font-black text-sky-700 underline">المرفق الحالي: {proof.attachmentName || "عرض المرفق"}</a>}</label><div className="flex gap-2 md:col-span-4"><button disabled={busy === reward.id} className="rounded-xl bg-sky-700 px-5 py-2.5 font-black text-white disabled:opacity-50">{busy === reward.id ? "جارٍ الحفظ..." : "تأكيد إثبات الدفع"}</button><button type="button" disabled={busy === reward.id} onClick={() => setPayingRewardId(null)} className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 font-black disabled:opacity-50">إلغاء</button></div></form></td></tr>}
        </Fragment>;
      })}</tbody></table>{!filtered.length && <p className="p-10 text-center text-slate-500">{qualifiedProjects.length ? "لا توجد مكافآت مالية مطابقة للفلاتر الحالية." : "لا توجد مكافآت مطابقة."}</p>}</div></section>
    </>}
  </AdminShell>;
}
