"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { BadgeDollarSign, ChevronDown, RefreshCw, Search } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { DateText } from "@/components/ui/date-text";
import { dashboardErrorMessage } from "@/lib/dashboard-labels";

type RewardStatus = "EXPECTED" | "EARNED" | "PAID" | "CANCELLED";
type Reward = {
  id: string; rate: string; baseAmount: string; amount: string; currency: string; status: RewardStatus;
  earnedAt: string | null; paidAt: string | null; cancelReason: string | null; adminNotes: string | null;
  ambassador: { id: string; payoutMethod: string | null; payoutDetails: string | null; user: { name: string | null; email: string } };
  referral: { id: string; name: string | null; email: string | null };
  project: { id: string; title: string; client: { id: string; name: string | null; email: string } };
  projectStage: { id: string; name: string; status: string; paymentStatus: string; completedAt: string | null; approvedAt: string | null };
};
type Stage = { id: string; name: string; amount: string; currency: string; status: string; paymentStatus: string; startsAt: string | null; completedAt: string | null; paidAt: string | null; approvedAt: string | null };
type Project = { id: string; title: string; currency: string; ambassadorRewardRate: string | null; ambassadorQualifiedAt: string | null; client: { name: string | null; email: string }; referral: { ambassador: { user: { name: string | null; email: string } } | null }; projectStages: Stage[] };

const FIXED_REWARD_LEVELS = [
  { id: "fixed-1", name: "منطلق", minSuccessfulReferrals: 1, rate: "10" },
  { id: "fixed-2", name: "نشط", minSuccessfulReferrals: 2, rate: "15" },
  { id: "fixed-3", name: "نخبة", minSuccessfulReferrals: 5, rate: "20" },
] as const;

const statusLabels: Record<RewardStatus, string> = { EXPECTED: "متوقعة", EARNED: "مستحقة", PAID: "مدفوعة", CANCELLED: "ملغاة" };
const statusStyles: Record<RewardStatus, string> = { EXPECTED: "bg-amber-100 text-amber-800", EARNED: "bg-emerald-100 text-emerald-800", PAID: "bg-sky-100 text-sky-800", CANCELLED: "bg-rose-100 text-rose-800" };
const stageStatuses = [["NOT_STARTED", "لم تبدأ"], ["IN_PROGRESS", "قيد التنفيذ"], ["COMPLETED", "مكتملة"], ["CANCELLED", "ملغاة"]];
const paymentStatuses = [["PENDING", "بانتظار الدفع"], ["PAID", "مدفوعة"], ["CANCELLED", "ملغاة"]];

function amount(value: string | number, currency: string) {
  return `${Number(value).toLocaleString("ar", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

export default function AdminRewardsPage() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"ALL" | RewardStatus>("ALL");

  const load = useCallback(async () => {
    setLoading(true);
    const response = await fetch("/api/admin/rewards", { cache: "no-store" });
    const data = await response.json().catch(() => null);
    if (response.ok) {
      setRewards(data.rewards || []);
      setProjects(data.projects || []);
    } else setMessage(dashboardErrorMessage(data?.error, "تعذر تحميل المكافآت"));
    setLoading(false);
  }, []);
  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  async function mutate(payload: Record<string, unknown>, success: string) {
    setBusy(String(payload.rewardId || payload.stageId || payload.projectId || payload.id || payload.action));
    setMessage("");
    const response = await fetch("/api/admin/rewards", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await response.json().catch(() => null);
    setMessage(response.ok ? success : dashboardErrorMessage(data?.error, "تعذر حفظ العملية"));
    if (response.ok) await load();
    setBusy("");
    return response.ok;
  }

  async function addStage(event: FormEvent<HTMLFormElement>, projectId: string) {
    event.preventDefault();
    const form = event.currentTarget; const data = new FormData(form);
    if (await mutate({ action: "stage_create", projectId, name: data.get("name"), amount: data.get("amount"), startsAt: data.get("startsAt") }, "تم إنشاء المرحلة والمكافأة المتوقعة")) form.reset();
  }

  async function saveStage(event: FormEvent<HTMLFormElement>, stageId: string) {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    await mutate({ action: "stage_update", stageId, name: data.get("name"), amount: data.get("amount"), status: data.get("status"), paymentStatus: data.get("paymentStatus"), approved: data.get("approved") === "on" }, "تم تحديث المرحلة ومزامنة المكافأة");
  }

  async function changeReward(reward: Reward, next: RewardStatus) {
    const cancelReason = next === "CANCELLED" ? window.prompt("اكتب سبب إلغاء المكافأة:")?.trim() : "";
    if (next === "CANCELLED" && !cancelReason) return;
    await mutate({ action: "reward_status", rewardId: reward.id, status: next, cancelReason }, next === "PAID" ? "تم تعليم المكافأة كمدفوعة" : next === "CANCELLED" ? "تم إلغاء المكافأة" : "تم اعتماد استحقاق المكافأة");
  }

  const filtered = useMemo(() => rewards.filter((reward) => {
    const haystack = [reward.ambassador.user.name, reward.ambassador.user.email, reward.project.client.name, reward.project.client.email, reward.project.title, reward.projectStage.name].filter(Boolean).join(" ").toLowerCase();
    return (status === "ALL" || reward.status === status) && haystack.includes(search.trim().toLowerCase());
  }), [rewards, search, status]);

  const qualifiedProjects = useMemo(() => projects.filter((project) => Boolean(project.ambassadorRewardRate)), [projects]);

  const totals = useMemo(() => {
    const map = new Map<string, Record<RewardStatus, number>>();
    for (const reward of rewards) { const row = map.get(reward.currency) || { EXPECTED: 0, EARNED: 0, PAID: 0, CANCELLED: 0 }; row[reward.status] += Number(reward.amount); map.set(reward.currency, row); }
    return [...map.entries()];
  }, [rewards]);

  return <AdminShell active="rewards" title="مكافآت السفراء" description="مراحل مالية واضحة، نسب محفوظة، واستحقاق لا يسبق الإنجاز والاعتماد والدفع.">
    {message && <p className="mt-6 rounded-xl border border-[#D8D2C4] bg-white p-4 font-bold">{message}</p>}
    {loading ? <p className="mt-7 flex items-center justify-center gap-2 rounded-2xl bg-white p-12"><RefreshCw className="animate-spin" /> جارٍ التحميل...</p> : <>
      <section className="mt-7 rounded-2xl border border-[#D8D2C4] bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><p className="text-sm font-black text-[#9A7D43]">سياسة المكافآت المعتمدة</p><h2 className="mt-1 text-2xl font-black">سلم مستويات السفراء</h2><p className="mt-2 text-sm text-slate-500">سياسة ثابتة غير قابلة للتعديل. يُحسب المستوى من الإحالات التي بدأت استحقاقًا ماليًا فعليًا، وتُثبت النسبة لكل مشروع عند تأهله.</p></div>
          <span className="inline-flex items-center gap-2 rounded-full bg-[#F7F3EB] px-4 py-2 text-sm font-black text-[#7A6233]"><BadgeDollarSign className="h-4 w-4" />السياسة النظامية الثابتة</span>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">{FIXED_REWARD_LEVELS.map((level) => <article key={level.id} className="rounded-2xl border border-[#E6E0D4] bg-[#FCFAF6] p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-black text-[#9A7D43]">من {level.minSuccessfulReferrals} إحالة ناجحة ماليًا</p><h3 className="mt-1 text-xl font-black">{level.name}</h3></div><strong className="text-3xl font-black text-[#9A7D43]">{level.rate}%</strong></div><p className="mt-3 text-sm text-slate-500">{level.minSuccessfulReferrals === 1 ? "يبدأ بعد أول إحالة ناجحة ماليًا في الشهر." : `يبدأ عند الوصول إلى ${level.minSuccessfulReferrals} إحالات ناجحة ماليًا خلال الشهر.`}</p></article>)}</div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">{(["EXPECTED", "EARNED", "PAID", "CANCELLED"] as RewardStatus[]).map((key) => <article key={key} className="rounded-2xl border border-[#D8D2C4] bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">{statusLabels[key]}</p><div className="mt-2 space-y-1">{totals.length ? totals.map(([currency, values]) => <strong key={currency} className="block text-xl">{amount(values[key], currency)}</strong>) : <strong className="text-xl">0.00</strong>}</div></article>)}</section>

      <section className="mt-6 rounded-2xl border border-[#D8D2C4] bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-black text-[#9A7D43]">من الاتفاق حتى الاستحقاق</p><h2 className="mt-1 text-2xl font-black">المشاريع المؤهلة للمكافآت</h2><p className="mt-2 text-sm text-slate-500">تظهر هنا المشاريع التي حُفظت لها نسبة السفير حتى قبل إنشاء أول مرحلة مالية.</p></div><span className="rounded-full bg-[#F7F3EB] px-3 py-1 text-sm font-black text-[#7A6233]">{qualifiedProjects.length}</span></div>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">{qualifiedProjects.map((project) => {
          const ambassadorName = project.referral.ambassador?.user.name || project.referral.ambassador?.user.email || "سفير غير محدد";
          const hasStages = project.projectStages.length > 0;
          return <article key={project.id} className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-black text-emerald-700">{ambassadorName}</p><h3 className="mt-1 text-xl font-black">{project.title}</h3><p className="mt-1 text-sm text-slate-600">العميل: {project.client.name || project.client.email}</p></div><span className="rounded-full bg-emerald-600 px-4 py-2 font-black text-white">{project.ambassadorRewardRate}%</span></div>
            <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2"><p><span className="text-slate-500">النسبة:</span> <strong>{project.ambassadorRewardRate}% محفوظة</strong></p><p><span className="text-slate-500">المراحل المالية:</span> <strong>{project.projectStages.length}</strong></p><p className="sm:col-span-2"><span className="text-slate-500">الحالة:</span> <strong className={hasStages ? "text-amber-700" : "text-[#9A7D43]"}>{hasStages ? "بدأت المراحل المالية — تابع حالتها أدناه" : "تم الاتفاق — بانتظار إنشاء أول مرحلة مالية"}</strong></p></div>
          </article>;
        })}{!qualifiedProjects.length && <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500 lg:col-span-2">لا توجد مشاريع مؤهلة للمكافآت حاليًا.</p>}</div>
      </section>

      <details className="mt-6 rounded-2xl border border-[#D8D2C4] bg-white p-5"><summary className="flex cursor-pointer list-none items-center justify-between font-black"><span>المشاريع والمراحل المالية</span><ChevronDown /></summary><div className="mt-5 grid gap-5">{projects.map((project) => <article key={project.id} className="rounded-2xl border border-slate-200 p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-black">{project.title}</h2><p className="text-sm text-slate-500">{project.client.name || project.client.email} · السفير: {project.referral.ambassador?.user.name || project.referral.ambassador?.user.email}</p></div>{project.ambassadorRewardRate ? <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-black text-emerald-800">نسبة محفوظة {project.ambassadorRewardRate}%</span> : <button disabled={busy === project.id} onClick={() => void mutate({ action: "activate_project", projectId: project.id }, "تم تثبيت نسبة المشروع")} className="rounded-xl bg-[#111827] px-4 py-2 font-black text-white">تفعيل المكافآت</button>}</div>
          <div className="mt-4 grid gap-3">{project.projectStages.map((stage) => <form key={stage.id} onSubmit={(event) => saveStage(event, stage.id)} className="grid gap-3 rounded-xl bg-[#F7F3EB] p-4 md:grid-cols-6"><input name="name" defaultValue={stage.name} required className="field md:col-span-2" /><input name="amount" type="number" min="0.01" step="0.01" defaultValue={stage.amount} required className="field" /><select name="status" defaultValue={stage.status} className="field">{stageStatuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><select name="paymentStatus" defaultValue={stage.paymentStatus} className="field">{paymentStatuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><label className="flex items-center gap-2 rounded-xl border border-[#D8D2C4] bg-white px-3"><input type="checkbox" name="approved" defaultChecked={Boolean(stage.approvedAt)} /> معتمدة</label><button disabled={busy === stage.id} className="rounded-xl bg-[#B89A5A] px-4 py-2 font-black md:col-start-6">حفظ المرحلة</button></form>)}</div>
          {project.ambassadorRewardRate && <form onSubmit={(event) => addStage(event, project.id)} className="mt-4 grid gap-3 rounded-xl border border-dashed border-[#B89A5A] p-4 md:grid-cols-4"><input name="name" required placeholder="اسم المرحلة" className="field" /><input name="amount" required type="number" min="0.01" step="0.01" placeholder={`القيمة — ${project.currency}`} className="field" /><input name="startsAt" type="date" className="field" /><button disabled={busy === project.id} className="rounded-xl bg-[#111827] px-4 py-2 font-black text-white">إضافة مرحلة</button></form>}
        </article>)}</div></details>

      <section className="mt-6 rounded-2xl border border-[#D8D2C4] bg-white p-5"><div className="flex flex-col gap-3 md:flex-row"><label className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 px-4"><Search className="h-4 w-4 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="بحث بالسفير أو العميل أو المشروع" className="w-full py-3 outline-none" /></label><select value={status} onChange={(event) => setStatus(event.target.value as typeof status)} className="field md:max-w-52"><option value="ALL">كل الحالات</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div><div className="mt-5 overflow-x-auto"><table className="w-full min-w-[1150px] text-right text-sm"><thead className="bg-[#F7F3EB]"><tr><th className="p-3">السفير</th><th className="p-3">العميل</th><th className="p-3">المشروع / المرحلة</th><th className="p-3">قيمة المرحلة</th><th className="p-3">النسبة</th><th className="p-3">المكافأة</th><th className="p-3">الحالة</th><th className="p-3">طريقة الدفع</th><th className="p-3">الإجراء</th></tr></thead><tbody>{filtered.map((reward) => <tr key={reward.id} className="border-t border-slate-100"><td className="p-3 font-black">{reward.ambassador.user.name || reward.ambassador.user.email}</td><td className="p-3">{reward.project.client.name || reward.project.client.email}</td><td className="p-3"><strong>{reward.project.title}</strong><span className="block text-slate-500">{reward.projectStage.name}</span></td><td className="p-3">{amount(reward.baseAmount, reward.currency)}</td><td className="p-3">{reward.rate}%</td><td className="p-3 font-black">{amount(reward.amount, reward.currency)}</td><td className="p-3"><span className={`rounded-full px-3 py-1 text-xs font-black ${statusStyles[reward.status]}`}>{statusLabels[reward.status]}</span>{reward.earnedAt && <span className="mt-1 block text-xs text-slate-500"><DateText value={reward.earnedAt} /></span>}{reward.paidAt && <span className="block text-xs text-slate-500">دُفعت <DateText value={reward.paidAt} /></span>}</td><td className="p-3">{reward.ambassador.payoutMethod || "غير مسجلة"}</td><td className="p-3"><div className="flex flex-wrap gap-2">{reward.status === "EXPECTED" && <button onClick={() => void changeReward(reward, "EARNED")} className="rounded-lg bg-emerald-100 px-3 py-2 font-bold text-emerald-800">اعتماد</button>}{reward.status === "EARNED" && <button onClick={() => void changeReward(reward, "PAID")} className="rounded-lg bg-sky-100 px-3 py-2 font-bold text-sky-800">تعليم كمدفوعة</button>}{reward.status !== "PAID" && reward.status !== "CANCELLED" && <button onClick={() => void changeReward(reward, "CANCELLED")} className="rounded-lg bg-rose-100 px-3 py-2 font-bold text-rose-800">إلغاء</button>}</div></td></tr>)}</tbody></table>{!filtered.length && <p className="p-10 text-center text-slate-500">{qualifiedProjects.length ? "لا توجد مكافآت مالية بعد. المشاريع المؤهلة ونسبها المحفوظة ظاهرة أعلاه بانتظار المراحل المالية." : "لا توجد مكافآت مطابقة."}</p>}</div></section>
    </>}
  </AdminShell>;
}