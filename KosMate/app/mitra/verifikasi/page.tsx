"use client";

import Link from "next/link";
import { useState } from "react";
import { BadgeCheck, Clock3, ShieldCheck } from "lucide-react";
import { ProtectedRoute } from "@/components/protected-route";
import { useAuth } from "@/lib/auth-context";
import { kosmateRepository } from "@/lib/local-repository";
import { useLocalData } from "@/lib/use-local-data";

function VerificationContent() {
  const { user } = useAuth();
  const [data, setData] = useLocalData();
  const [complete, setComplete] = useState(false);
  const partner = data.partners.find((item) => item.userId === user?.id);
  const label = partner?.type === "kost_owner" ? "Pemilik Kost" : partner?.type === "food_merchant" ? "Mitra Makanan" : "Jasa Suruh";
  function finishDemo() {
    const next = kosmateRepository.update((current) => ({
      ...current,
      partners: current.partners.map((item) => item.userId === user?.id ? { ...item, verified: true } : item),
      serviceProviders: current.serviceProviders.map((item) => item.userId === user?.id ? { ...item, verified: true } : item),
      kosts: current.kosts.map((item) => item.ownerId === user?.id ? { ...item, verified: true } : item),
    }));
    setData(next);
    setComplete(true);
  }
  return <section className="page-wrap py-10 sm:py-16"><div className="mx-auto max-w-2xl rounded-3xl border border-slate-100 bg-white p-6 shadow-card sm:p-9"><span className="grid size-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-800"><ShieldCheck size={22}/></span><p className="mt-5 text-xs font-bold uppercase tracking-widest text-emerald-700">Pendaftaran Kemitraan</p><h1 className="mt-2 text-3xl font-black">Verifikasi {label}</h1><p className="mt-3 text-sm leading-6 text-slate-500">Pendaftaranmu sudah tercatat di KosMate. Tahap verifikasi ini berupa simulasi lokal; tidak ada dokumen yang dikirim ke server.</p><div className="mt-6 flex gap-3 rounded-2xl bg-amber-50 p-4"><Clock3 className="mt-0.5 shrink-0 text-amber-700" size={18}/><div><p className="font-bold text-amber-900">Status: {partner?.verified ? "Terverifikasi (demo)" : "Menunggu verifikasi"}</p><p className="mt-1 text-xs leading-5 text-amber-800">Selesaikan langkah demo untuk membuka dashboard. Status dapat diubah kembali pada data lokal.</p></div></div>{complete||partner?.verified?<><div className="mt-5 flex items-center gap-2 rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800"><BadgeCheck size={18}/>Verifikasi mock selesai.</div><Link href="/mitra/dashboard" className="button-primary mt-5 w-full">Buka Dashboard Mitra</Link></>:<><button onClick={finishDemo} className="button-primary mt-5 w-full">Selesaikan verifikasi demo</button><Link href="/mitra/dashboard" className="button-secondary mt-3 w-full">Lanjut dengan status menunggu</Link></>}</div></section>;
}
export default function PartnerVerificationPage() { return <ProtectedRoute role="partner"><VerificationContent/></ProtectedRoute>; }
