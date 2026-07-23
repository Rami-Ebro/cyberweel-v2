import Link from "next/link";
import {
  ArrowLeft,
  Banknote,
  BriefcaseBusiness,
  CircleDollarSign,
  Copy,
  CreditCard,
  Home,
  Link2,
  Menu,
  Settings,
  TrendingUp,
  UserRound,
  UsersRound,
} from "lucide-react";

const stats = [
  { label: "العملاء المحالون", value: "24", note: "+3 هذا الشهر", icon: UsersRound },
  { label: "المشاريع النشطة", value: "7", note: "5 قيد التنفيذ", icon: BriefcaseBusiness },
  { label: "إجمالي العمولات", value: "$8,450", note: "+18% عن الشهر السابق", icon: CircleDollarSign },
  { label: "الرصيد المستحق", value: "$520", note: "بانتظار موعد الدفع", icon: Banknote },
];

const navigation = [
  { label: "نظرة عامة", icon: Home, active: true },
  { label: "العملاء المحالون", icon: UsersRound },
  { label: "المشاريع", icon: BriefcaseBusiness },
  { label: "العمولات", icon: CircleDollarSign },
  { label: "الدفعات", icon: CreditCard },
  { label: "رابط الإحالة", icon: Link2 },
  { label: "الملف الشخصي", icon: UserRound },
];

const projects = [
  { client: "أحمد الخالد", project: "متجر إلكتروني", value: "$2,500", commission: "$500", status: "مكتمل", tone: "success" },
  { client: "سارة المحمد", project: "موقع شركة", value: "$1,200", commission: "$240", status: "مكتمل", tone: "success" },
  { client: "محمد العلي", project: "حملة إعلانية", value: "$800", commission: "$120", status: "قيد التنفيذ", tone: "active" },
  { client: "نور الحسن", project: "تصميم هوية", value: "$600", commission: "$90", status: "بانتظار الموافقة", tone: "pending" },
];

const statusStyles = {
  success: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  active: "bg-blue-50 text-blue-700 ring-blue-100",
  pending: "bg-amber-50 text-amber-700 ring-amber-100",
};

export default function PartnerDashboardPage() {
  return (
    <main dir="rtl" className="min-h-screen bg-[#F7F3EB] text-[#111827]">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-72 shrink-0 border-l border-[#D8D2C4]/70 bg-[#111827] px-5 py-7 text-white lg:flex lg:flex-col">
          <Link href="/" className="mb-10 flex items-center gap-3 px-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl border border-[#B89A5A]/50 bg-white/5 text-lg font-black text-[#B89A5A]">CW</div>
            <div>
              <p className="text-xl font-extrabold tracking-tight">CyberWeel</p>
              <p className="text-xs text-white/55">بوابة الشركاء</p>
            </div>
          </Link>

          <nav className="space-y-1.5">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  type="button"
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-right text-sm font-semibold transition ${
                    item.active
                      ? "bg-[#B89A5A] text-[#111827]"
                      : "text-white/70 hover:bg-white/7 hover:text-white"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="mt-auto rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm font-bold">تحتاج إلى مساعدة؟</p>
            <p className="mt-1 text-xs leading-6 text-white/55">فريق CyberWeel جاهز لمتابعة أي استفسار يتعلق بحساب الشريك</p>
            <Link href="/contact" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#B89A5A]">
              تواصل معنا <ArrowLeft className="h-4 w-4" />
            </Link>
          </div>
        </aside>

        <section className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          <header className="mb-6 flex items-center justify-between rounded-2xl border border-[#D8D2C4]/80 bg-white px-4 py-4 shadow-sm sm:px-6">
            <div>
              <p className="text-xs font-bold text-[#B89A5A]">لوحة تحكم الشريك</p>
              <h1 className="mt-1 text-xl font-extrabold sm:text-2xl">صباح الخير، رامي</h1>
              <p className="mt-1 text-xs text-slate-500 sm:text-sm">تابع العملاء والمشاريع والعمولات من مكان واحد</p>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" className="grid h-10 w-10 place-items-center rounded-xl border border-[#D8D2C4] bg-white lg:hidden" aria-label="فتح القائمة">
                <Menu className="h-5 w-5" />
              </button>
              <button type="button" className="hidden items-center gap-2 rounded-xl border border-[#D8D2C4] px-4 py-2 text-sm font-bold sm:flex">
                <Settings className="h-4 w-4" /> الإعدادات
              </button>
              <div className="grid h-10 w-10 place-items-center rounded-full bg-[#111827] text-sm font-extrabold text-white">ر</div>
            </div>
          </header>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <article key={stat.label} className="rounded-2xl border border-[#D8D2C4]/80 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-500">{stat.label}</p>
                      <p className="mt-3 text-3xl font-black tracking-tight">{stat.value}</p>
                    </div>
                    <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#F7F3EB] text-[#B89A5A]">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  <p className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-600" /> {stat.note}
                  </p>
                </article>
              );
            })}
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_0.8fr]">
            <section className="overflow-hidden rounded-2xl border border-[#D8D2C4]/80 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-[#D8D2C4]/70 px-5 py-4 sm:px-6">
                <div>
                  <h2 className="font-extrabold">آخر المشاريع</h2>
                  <p className="mt-1 text-xs text-slate-500">أحدث المشاريع المسجلة من خلال إحالاتك</p>
                </div>
                <button type="button" className="text-sm font-bold text-[#9A7D43]">عرض الكل</button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead className="bg-[#FAF8F3] text-xs text-slate-500">
                    <tr>
                      <th className="px-5 py-3 text-right font-bold">العميل</th>
                      <th className="px-5 py-3 text-right font-bold">المشروع</th>
                      <th className="px-5 py-3 text-right font-bold">القيمة</th>
                      <th className="px-5 py-3 text-right font-bold">عمولتك</th>
                      <th className="px-5 py-3 text-right font-bold">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E2D8]">
                    {projects.map((row) => (
                      <tr key={`${row.client}-${row.project}`} className="transition hover:bg-[#FCFAF6]">
                        <td className="px-5 py-4 font-bold">{row.client}</td>
                        <td className="px-5 py-4 text-slate-600">{row.project}</td>
                        <td className="px-5 py-4 font-semibold">{row.value}</td>
                        <td className="px-5 py-4 font-extrabold text-[#9A7D43]">{row.commission}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ${statusStyles[row.tone as keyof typeof statusStyles]}`}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <div className="space-y-6">
              <section className="rounded-2xl bg-[#111827] p-6 text-white shadow-sm">
                <p className="text-xs font-bold text-[#B89A5A]">رابط الإحالة الخاص بك</p>
                <h2 className="mt-2 text-xl font-extrabold">شارك الرابط وابدأ الإحالة</h2>
                <p className="mt-2 text-sm leading-7 text-white/60">كل عميل يسجل عبر هذا الرابط سيظهر تلقائيًا داخل حسابك</p>
                <div className="mt-5 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-2">
                  <code dir="ltr" className="min-w-0 flex-1 truncate px-2 text-xs text-white/75">cyberweel.com/ref/rami</code>
                  <button type="button" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#B89A5A] text-[#111827]" aria-label="نسخ رابط الإحالة">
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </section>

              <section className="rounded-2xl border border-[#D8D2C4]/80 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-500">الدفعة القادمة</p>
                    <p className="mt-2 text-3xl font-black">$520</p>
                  </div>
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#F7F3EB] text-[#B89A5A]">
                    <CreditCard className="h-6 w-6" />
                  </div>
                </div>
                <div className="mt-5 border-t border-[#E8E2D8] pt-4 text-sm">
                  <div className="flex justify-between text-slate-500"><span>موعد الاستحقاق</span><strong className="text-[#111827]">01 أغسطس 2026</strong></div>
                  <div className="mt-3 flex justify-between text-slate-500"><span>طريقة الدفع</span><strong className="text-[#111827]">تحويل بنكي</strong></div>
                </div>
              </section>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
