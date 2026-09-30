"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, MapPin, Star, Wifi } from "lucide-react";
import { useState } from "react";
import type { Kost } from "@/lib/data";
import { formatRupiah } from "@/lib/data";

export function KostCard({ kost, compact = false }: { kost: Kost; compact?: boolean }) {
  const [saved, setSaved] = useState(false);
  return <article className={`group overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-card transition hover:-translate-y-0.5 hover:shadow-card-hover ${compact ? "sm:flex" : ""}`}>
    <Link href={`/kost/${kost.slug}`} className={`relative block shrink-0 overflow-hidden ${compact ? "h-52 sm:h-auto sm:w-[36%]" : "h-52"}`}>
      <Image src={kost.image} alt={`Kamar di ${kost.name}`} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 35vw" className="object-cover transition duration-500 group-hover:scale-[1.03]" />
      <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-emerald-800">{kost.tags[0]}</span>
    </Link>
    <div className="min-w-0 flex-1 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3"><div><Link href={`/kost/${kost.slug}`} className="font-bold text-slate-900 hover:text-emerald-800">{kost.name}</Link><div className="mt-1.5 flex items-center gap-1 text-xs text-slate-500"><MapPin size={13} />{kost.area}</div></div><button onClick={() => setSaved(!saved)} aria-label={saved ? "Hapus dari simpanan" : "Simpan kost"} className={`grid size-9 shrink-0 place-items-center rounded-full border transition ${saved ? "border-rose-100 bg-rose-50 text-rose-500" : "border-slate-100 text-slate-400 hover:text-rose-500"}`}><Heart size={17} fill={saved ? "currentColor" : "none"} /></button></div>
      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-slate-500"><span className="flex items-center gap-1 font-semibold text-slate-700"><Star size={14} fill="#f5ad32" className="text-amber-400" />{kost.rating} <span className="font-normal text-slate-400">({kost.reviews} ulasan)</span></span><span className="flex items-center gap-1"><Wifi size={14} />WiFi</span><span>{kost.facilities[0]}</span></div>
      <div className="mt-5 flex items-end justify-between gap-2 border-t border-slate-100 pt-4"><p className="font-extrabold text-emerald-800">{formatRupiah(kost.price)}<span className="ml-1 text-xs font-normal text-slate-400">/ bulan</span></p><Link href={`/kost/${kost.slug}`} className="button-primary !px-4 !py-2 text-xs">Lihat detail</Link></div>
    </div>
  </article>;
}
