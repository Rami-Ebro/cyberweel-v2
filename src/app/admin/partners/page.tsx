"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

type Partner = {
  id: string;
  referralNumber: number;
  status: "PENDING" | "ACTIVE" | "SUSPENDED";
  createdAt: string;
  user: { name: string | null; email: string };
  _count: { referrals: number };
};

const statusLabel: Record<Partner["status"], string> = {
  ACTIVE: "نشط",
  PENDING: "بانتظار الموافقة",
  SUSPENDED: "معلّق",
};

export default function AdminPartnersPage() {
  const [key, setKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [message, setMessage] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function load() {
    setMessage("");
    const response = await fetch("/api/admin/partners", { headers: { "x-admin-key": key } });
    const data = await response.json();
    if (!response.ok) return setMessage(data.error || "تعذر التحميل");
    setPartners(data.partners);
  }

  async function changeStatus(id: string, status: Partner["status"]) {
    setUpdatingId(id);
    setMessage("");

    const response = await fetch("/api/admin/partners", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-key": key },
      body: JSON.stringify({ id, status }),
    });
    const data = await response.json();

    if (!response.ok) {
      setUpdatingId(null);
      setMessage(data.error || "تعذر التحديث");
      return;
    }

    setPartners((current) =>
      current.map((partner) => (partner.id === id ? { ...partner, status } : partner)),
    );
    setUpdatingId(null);
    setMessage(`تم تحديث الحالة إلى: ${statusLabel[status]}`);
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[#F7F3EB] px-4 py-10 text-[#111827]">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-black">إدارة الشركاء</h1>
        <div className="mt-6 flex gap-3 rounded-2xl bg-white p-4 shadow-sm">
          <div className="relative min-w-0 flex-1">
            <input type={showKey ? "text" : "password"} value={key} onChange={(e) => setKey(e.target.value)} placeholder="مفتاح الإدارة" className="w-full rounded-xl border border-[#D8D2C4] px-4 py-3 pl-12" />
            <button type="button" onClick={() => setShowKey((value) => !value)} className="absolute left-3 top-1/2 -translate-y-1/2 cursor-pointer rounded-lg p-2 text-slate-500 hover:bg-[#F7F3EB]" aria-label={showKey ? "إخفاء مفتاح الإدارة" : "إظهار مفتاح الإدارة"}>
              {showKey ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          <button type="button" onClick={load} className="cursor-pointer rounded-xl bg-[#111827] px-5 py-3 font-bold text-white">عرض الشركاء</button>
        </div>

        {message && <p className="mt-4 rounded-xl bg-white p-3 font-semibold text-[#111827] shadow-sm">{message}</p>}

        <div className="mt-6 space-y-3">
          {partners.map((partner) => {
            const isUpdating = updatingId === partner.id;

            return (
              <article key={partner.id} className="rounded-2xl border border-[#D8D2C4] bg-white p-5 shadow-sm">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="font-extrabold">{partner.user.name || "دون اسم"}</h2>
                      <span className="rounded-full bg-[#F7F3EB] px-3 py-1 text-xs font-bold text-[#9A7D43]">{statusLabel[partner.status]}</span>
                    </div>
                    <p className="text-sm text-slate-500">{partner.user.email}</p>
                    <p className="mt-2 text-sm">الكود: <b>CW-{String(partner.referralNumber).padStart(4, "0")}</b> — الإحالات: {partner._count.referrals}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" disabled={isUpdating || partner.status === "ACTIVE"} onClick={() => changeStatus(partner.id, "ACTIVE")} className="cursor-pointer rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">قبول</button>
                    <button type="button" disabled={isUpdating || partner.status === "PENDING"} onClick={() => changeStatus(partner.id, "PENDING")} className="cursor-pointer rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">انتظار</button>
                    <button type="button" disabled={isUpdating || partner.status === "SUSPENDED"} onClick={() => changeStatus(partner.id, "SUSPENDED")} className="cursor-pointer rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">تعليق</button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </main>
  );
}
