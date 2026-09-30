"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BadgeCheck, MessageCircle, Search, Star } from "lucide-react";
import { ServiceIcon } from "@/components/icons";
import { initialLocalData } from "@/lib/mock-data";
import { kosmateRepository } from "@/lib/local-repository";
import type { LocalData } from "@/lib/models";

export default function ServicesPage() {
  const [data, setData] = useState<LocalData>(initialLocalData);
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const refresh = () => setData(kosmateRepository.read());
    refresh();
    window.addEventListener("kosmate:data-updated", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("kosmate:data-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const activeServices = data.services.filter((service) => service.active);
  const categories = [{ id: "Semua", name: "Semua" }, ...data.serviceCategories.filter((category) => category.active).map((category) => ({ id: category.id, name: category.name }))];
  const filtered = useMemo(() => activeServices.filter((service) => (activeCategory === "Semua" || service.categoryId === activeCategory) && `${service.name} ${service.description}`.toLowerCase().includes(query.toLowerCase())), [activeServices, activeCategory, query]);

  return <section className="page-wrap py-8 sm:py-12">
    <div className="mb-7"><span className="eyebrow-pill"><BadgeCheck size={14} /> Teman kebutuhan harian</span><h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Jasa Layanan</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">Berbagai layanan untuk memenuhi kebutuhan harianmu. Praktis, aman, dan dekat dari tempat kost.</p></div>
    <label className="search-input flex max-w-3xl items-center gap-3"><Search size={19} className="shrink-0 text-slate-400" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari layanan, misal: isi galon, cleaning..." aria-label="Cari layanan" />{query && <button onClick={() => setQuery("")} className="text-xs font-semibold text-emerald-800">Hapus</button>}</label>
    <div className="mt-5 flex flex-wrap gap-2" aria-label="Kategori layanan">{categories.map((category) => <button key={category.id} onClick={() => setActiveCategory(category.id)} className={`chip ${activeCategory === category.id ? "chip-active" : ""}`}>{category.name}</button>)}</div>
    <div className="mb-4 mt-7 flex items-center justify-between"><h2 className="text-lg font-extrabold text-slate-900">Layanan untuk kamu <span className="ml-1 text-sm font-medium text-slate-400">({filtered.length})</span></h2><span className="hidden text-xs text-slate-500 sm:block">Area layanan mengikuti ketersediaan mitra</span></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{filtered.map((service) => {
      const providers = data.serviceProviders.filter((provider) => provider.active && provider.serviceIds.includes(service.id));
      const fee = service.pricingMode === "fixed_price" ? data.serviceFees.find((item) => item.serviceId === service.id && item.active && item.pricing === "fixed") : undefined;
      return <article key={service.id} className="service-result-card"><div className="flex items-start gap-4"><span className={`service-illustration ${service.icon === "food" || service.icon === "basket" || service.icon === "home" ? "orange" : "blue"}`}><ServiceIcon kind={service.icon} className="size-10" /></span><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><h3 className="font-extrabold text-slate-900">{service.name}</h3>{providers.length > 0 && <span className="flex shrink-0 items-center gap-1 text-[11px] font-bold text-slate-700"><Star size={13} fill="#f5ad32" className="text-amber-400" />Tersedia</span>}</div><p className="mt-2 min-h-10 text-xs leading-5 text-slate-500">{service.description}</p></div></div><div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4"><div><p className="text-xs text-slate-500">{fee ? "Harga produk tersedia" : "Jelaskan kebutuhanmu"}</p><p className="mt-1 text-xs font-bold text-emerald-800">{fee ? `Mulai Rp${fee.amount?.toLocaleString("id-ID")}` : service.pricingMode === "support_quote" ? "Konsultasi tanpa harga tetap" : service.pricingMode === "provider_quote" ? "Tanyakan estimasi biaya" : "Ajukan fee layanan"}</p></div><Link href={`/layanan/${service.slug}`} className="button-primary shrink-0 !px-3.5 !py-2.5 text-xs">{service.pricingMode === "support_quote" ? <><MessageCircle size={14} /> Chat dengan CS</> : <>Pilih layanan <ArrowRight size={14} /></>}</Link></div></article>;
    })}</div>
    {!filtered.length && <div className="mt-4 rounded-3xl border border-dashed border-slate-200 px-5 py-14 text-center"><h2 className="font-bold text-slate-900">Layanan belum ditemukan</h2><p className="mt-1 text-sm text-slate-500">Coba kata kunci atau kategori lainnya.</p></div>}
    <div className="mt-12 rounded-3xl border border-emerald-100 bg-emerald-50/70 px-6 py-7 sm:flex sm:items-center sm:justify-between sm:px-9"><div><p className="text-xs font-bold uppercase tracking-widest text-emerald-800">Mau jadi mitra KosMate?</p><h2 className="mt-2 text-xl font-extrabold text-slate-900">Bantu kebutuhan anak kos dan kembangkan usahamu.</h2><p className="mt-2 text-sm text-slate-600">Jangkau lebih banyak pelanggan di sekitar lokasi kamu.</p></div><Link href="/mitra/register" className="button-secondary mt-5 shrink-0 !border-emerald-200 !bg-white sm:mt-0">Daftar jadi mitra <ArrowRight size={16} /></Link></div>
  </section>;
}
