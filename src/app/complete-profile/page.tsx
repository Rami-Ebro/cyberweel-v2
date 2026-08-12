"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BriefcaseBusiness, Megaphone, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { dashboardErrorMessage } from "@/lib/dashboard-labels";

type Role = "PARTNER" | "AMBASSADOR";
type Profile = Record<string, string | number | null>;
const educationLevels = ["الثانوية أو أقل", "دبلوم", "بكالوريوس", "ماجستير", "دكتوراه", "تدريب مهني / شهادة تخصصية"];

export default function CompleteProfilePage() {
  const router = useRouter();
  const [role, setRole] = useState<Role | null>(null);
  const [profile, setProfile] = useState<Profile>({});
  const [educationLevel, setEducationLevel] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const capability = new URLSearchParams(window.location.search).get("capability");
    const query = capability ? `?capability=${encodeURIComponent(capability)}` : "";
    fetch(`/api/profile${query}`, { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) {
          router.replace("/login");
          return;
        }
        const loadedProfile = payload.profile || {};
        setRole(payload.role);
        setProfile(loadedProfile);
        if (payload.role === "PARTNER" && loadedProfile.educationLevel) {
          const savedEducationLevel = String(loadedProfile.educationLevel);
          setEducationLevel(educationLevels.includes(savedEducationLevel) ? savedEducationLevel : "أخرى");
        }
      })
      .catch(() => setMessage("تعذر تحميل بيانات الحساب. حاول مرة أخرى."));
  }, [router]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!role || saving) return;
    setSaving(true);
    setMessage("");
    try {
      const body = { ...Object.fromEntries(new FormData(event.currentTarget)), capability: role };
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(dashboardErrorMessage(payload.error, "تعذر حفظ الملف"));
      router.replace(payload.redirectTo);
      router.refresh();
    } catch {
      setMessage("أكمل جميع الحقول المطلوبة وتحقق من البيانات.");
      setSaving(false);
    }
  }

  if (!role) {
    return <main dir="rtl" className="grid min-h-screen place-items-center bg-[#f5f1e8]"><div className="h-12 w-12 animate-spin rounded-full border-4 border-[#bd9850] border-t-transparent" /></main>;
  }

  const isAmbassador = role === "AMBASSADOR";
  const Icon = isAmbassador ? Megaphone : BriefcaseBusiness;

  return (
    <main dir="rtl" className="relative min-h-screen overflow-hidden bg-[#f5f1e8] px-4 py-10 text-slate-950 sm:py-16">
      <div className="pointer-events-none absolute -right-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-white/80 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-52 -left-36 h-[34rem] w-[34rem] rounded-full bg-[#bd9850]/10 blur-3xl" />
      <form onSubmit={submit} className="relative mx-auto max-w-3xl overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(17,24,39,0.12)]">
        <header className="bg-[#101827] p-6 text-white sm:p-9">
          <div className="flex items-start justify-between gap-5">
            <div><p className="text-sm font-black text-[#d5b873]">خطوة واحدة قبل بدء العمل</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">استكمال ملف {isAmbassador ? "السفير" : "شريك التنفيذ"}</h1><p className="mt-4 max-w-2xl leading-8 text-white/60">{isAmbassador ? "نحتاج بيانات التواصل وطريقة استلام العمولة حتى تبدأ مشاركة رابطك ومتابعة نتائجك بوضوح." : "نحتاج بياناتك المهنية حتى نعرض لك المشاريع المناسبة وتبدأ التنفيذ من لوحة عملك مباشرة."}</p></div><span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-white"><Logo size={46} /></span>
          </div>
          <div className="mt-7 flex w-fit items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"><Icon size={21} className="text-[#d5b873]" /><strong>{isAmbassador ? "سفير CyberWeel" : "شريك تنفيذ CyberWeel"}</strong></div>
        </header>

        <div className="p-6 sm:p-9">
          <div className="mb-6 flex items-center gap-3 rounded-2xl bg-[#f5f1e8] p-4 text-sm leading-7 text-slate-600"><ShieldCheck size={22} className="shrink-0 text-[#9f7d3d]" /><p>تستخدم هذه المعلومات لإدارة العمل أو تسوية العمولات، ولا تُعرض للعامة.</p></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-black">رقم التواصل<input required name="phone" maxLength={40} defaultValue={profile.phone || ""} className="rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#bd9850] focus:ring-4 focus:ring-[#bd9850]/10" /></label>
            <label className="grid gap-2 text-sm font-black">العمر<input required type="number" min="1" max="120" inputMode="numeric" name="age" defaultValue={profile.age || ""} className="rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#bd9850] focus:ring-4 focus:ring-[#bd9850]/10" /></label>
            {isAmbassador ? <>
              <label className="grid gap-2 text-sm font-black">البلد<input required name="country" maxLength={100} defaultValue={profile.country || ""} className="rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#bd9850] focus:ring-4 focus:ring-[#bd9850]/10" /></label>
              <label className="grid gap-2 text-sm font-black">طريقة التواصل المفضلة<input required name="contactMethod" maxLength={100} defaultValue={profile.contactMethod || ""} placeholder="واتساب، اتصال، بريد..." className="rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#bd9850] focus:ring-4 focus:ring-[#bd9850]/10" /></label>
              <label className="grid gap-2 text-sm font-black">طريقة استلام العمولة<input required name="payoutMethod" maxLength={100} defaultValue={profile.payoutMethod || ""} placeholder="حوالة، محفظة إلكترونية..." className="rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#bd9850] focus:ring-4 focus:ring-[#bd9850]/10" /></label>
              <label className="grid gap-2 text-sm font-black sm:col-span-2">بيانات استلام العمولة<textarea required name="payoutDetails" maxLength={2000} rows={4} defaultValue={profile.payoutDetails || ""} className="rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#bd9850] focus:ring-4 focus:ring-[#bd9850]/10" /></label>
            </> : <>
              <label className="grid gap-2 text-sm font-black">المستوى التعليمي / الشهادة<select required name="educationLevel" value={educationLevel} onChange={(event) => setEducationLevel(event.target.value)} className="rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#bd9850] focus:ring-4 focus:ring-[#bd9850]/10"><option value="" disabled>اختر المستوى التعليمي</option>{educationLevels.map((level) => <option key={level}>{level}</option>)}<option>أخرى</option></select></label>
              {educationLevel === "أخرى" && <label className="grid gap-2 text-sm font-black">المستوى التعليمي أو الشهادة<input required name="educationLevelOther" maxLength={120} defaultValue={profile.educationLevel && !educationLevels.includes(String(profile.educationLevel)) ? profile.educationLevel : ""} className="rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#bd9850] focus:ring-4 focus:ring-[#bd9850]/10" /></label>}
              <label className="grid gap-2 text-sm font-black">التخصص <span className="font-normal text-slate-400">إن وجد</span><input name="educationSpecialty" maxLength={160} defaultValue={profile.educationSpecialty || ""} className="rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#bd9850] focus:ring-4 focus:ring-[#bd9850]/10" /></label>
              <label className="grid gap-2 text-sm font-black">التخصص المهني / مجال العمل<input required name="specialty" maxLength={1000} defaultValue={profile.specialty || ""} className="rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#bd9850] focus:ring-4 focus:ring-[#bd9850]/10" /></label>
              <label className="grid gap-2 text-sm font-black">التوفر الحالي<input required name="availability" maxLength={1000} defaultValue={profile.availability || ""} placeholder="متاح لمشروع، ساعات أسبوعية..." className="rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#bd9850] focus:ring-4 focus:ring-[#bd9850]/10" /></label>
              <label className="grid gap-2 text-sm font-black">رابط معرض الأعمال <span className="font-normal text-slate-400">اختياري</span><input name="portfolioUrl" maxLength={500} defaultValue={profile.portfolioUrl || ""} className="rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#bd9850] focus:ring-4 focus:ring-[#bd9850]/10" /></label>
              <label className="grid gap-2 text-sm font-black sm:col-span-2">الخبرة المهنية<textarea required name="experience" maxLength={5000} rows={5} defaultValue={profile.experience || ""} className="rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#bd9850] focus:ring-4 focus:ring-[#bd9850]/10" /></label>
            </>}
          </div>
          <button disabled={saving} className="mt-6 w-full rounded-2xl bg-[#101827] px-6 py-4 font-black text-white transition hover:bg-[#bd9850] hover:text-slate-950 disabled:opacity-60">{saving ? "جارٍ حفظ الملف..." : "حفظ وبدء العمل"}</button>
          {message && <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">{message}</p>}
        </div>
      </form>
    </main>
  );
}
