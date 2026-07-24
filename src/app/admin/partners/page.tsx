"use client";

import { useState } from "react";

type Partner = {
  id: string;
  referralNumber: number;
  status: "PENDING" | "ACTIVE" | "SUSPENDED";
  createdAt: string;
  user: { name: string | null; email: string };
  _count: { referrals: number };
};

export default function AdminPartnersPage() {
  const [key, setKey] = useState("");
  const [partners, setPartners] = useState<Partner[]>([]);
  const [message, setMessage] = useState("");

  async function load() {
    const response = await fetch("/api/admin/partners", { headers: { "x-admin-key": key } });
    const data = await response.json();
    if (!response.ok) return setMessage(data.error || "تعذر التحميل");
    setPartners(data.partners);
    setMessage("");
  }

  async function changeStatus(id: string, status: Partner["status"]) {
    const response = await fetch("/api/admin/partners", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-key": key },
      body: JSON.stringify({ id, status }),
    });
    const data = await response.json();
    if (!response.ok) return setMessage(data.error || "تعذر التحديث");
    await load();
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[#F7F3EB] px-4 py-10 text-[#111827]">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-black">إدارة الشركاء</h1>
        <div className="mt-6 flex gap-3 rounded-2xl bg-white p-4 shadow-sm">
          <input type="password" value={key} onChange={(e) => setKey(e.target.value)} placeholder="مفتاح الإدارة" className="min-w-0 flex-1 rounded-xl border border-[#D8D2C4] px-4 py-3" />
          <button onClick={load} className="rounded-xl bg-[#111827] px-5 py-3 font-bold text-white">عرض الشركاء</button>
        </div>
        {message && <p className="mt-4 rounded-xl bg-red-50 p-3 text-red-700">{message}</p>}
        <div className="mt-6 space-y-3">
          {partners.map((partner) => (
            <article key={partner.id} className="rounded-2xl border border-[#D8D2C4] bg-white p-5 shadow-sm">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <h2 className="font-extrabold">{partner.user.name || "دون اسم"}</h2>
                  <p className="text-sm text-slate-500">{partner.user.email}</p>
                  <p className="mt-2 text-sm">الكود: <b>CW-{String(partner.referralNumber).padStart(4, "0")}</b> — الإحالات: {partner._count.referrals}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => changeStatus(partner.id, "ACTIVE")} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white">قبول</button>
                  <button onClick={() => changeStatus(partner.id, "PENDING")} className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-white">انتظار</button>
                  <button onClick={() => changeStatus(partner.id, "SUSPENDED")} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white">تعليق</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
