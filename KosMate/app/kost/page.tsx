"use client";

import { useEffect, useMemo, useState } from "react";
import { Filter, Map, MapPin, Search, SlidersHorizontal, X } from "lucide-react";
import { KostCard } from "@/components/kost-card";
import { MapPreview } from "@/components/map-preview";
import type { MapPoint } from "@/components/leaflet-map";
import { initialLocalData } from "@/lib/mock-data";
import { kosmateRepository } from "@/lib/local-repository";
import type { LocalData } from "@/lib/models";

const filters = ["Semua", "Dekat Unpas", "Dekat ITB", "Dekat Telkom", "Dekat UPI"];

export default function KostSearchPage() {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("Semua");
  const [showMap, setShowMap] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [activeType, setActiveType] = useState("Semua tipe");
  const [maxPrice, setMaxPrice] = useState("Semua harga");
  const [data, setData] = useState<LocalData>(initialLocalData);
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
  const filtered = useMemo(() => data.kosts.filter((kost) => {
    const matchesQuery = `${kost.name} ${kost.location} ${kost.area}`.toLowerCase().includes(query.toLowerCase());
    const matchesArea = activeFilter === "Semua" || kost.area === activeFilter;
    const matchesType = activeType === "Semua tipe" || kost.tags[0] === activeType;
    const matchesPrice = maxPrice === "Semua harga" || kost.price <= Number(maxPrice);
    return kost.active !== false && matchesQuery && matchesArea && matchesType && matchesPrice;
  }), [data.kosts, query, activeFilter, activeType, maxPrice]);
  const mapPoints: MapPoint[] = filtered.map((kost, index) => ({ id: kost.slug, label: kost.name, latitude: kost.mockCoordinate?.latitude ?? -6.897 + index * 0.006, longitude: kost.mockCoordinate?.longitude ?? 107.604 + index * 0.005, address: kost.address ?? kost.location, isMock: true }));
  return <section className="page-wrap py-8 sm:py-12">
    <div className="mb-7 max-w-2xl"><span className="eyebrow-pill"><MapPin size={14} /> Bandung, Jawa Barat</span><h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Cari kost yang cocok</h1><p className="mt-2 text-sm leading-6 text-slate-500 sm:text-base">Jelajahi pilihan kost terverifikasi di lokasi yang kamu inginkan.</p></div>
    <div className="mb-5 flex flex-col gap-3 sm:flex-row"><label className="search-input flex min-w-0 flex-1 items-center gap-3"><Search size={19} className="shrink-0 text-slate-400" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari daerah, kampus, atau nama kost..." aria-label="Cari kost" />{query && <button onClick={() => setQuery("")} aria-label="Hapus pencarian"><X size={17} /></button>}</label><button className={`button-secondary shrink-0 ${showFilters ? "!border-emerald-300 !bg-emerald-50 !text-emerald-800" : ""}`} onClick={() => setShowFilters(!showFilters)} aria-expanded={showFilters}><SlidersHorizontal size={17} /> Filter <span className="hidden sm:inline">lainnya</span></button></div>
    {showFilters && <div className="mb-5 grid gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-card sm:grid-cols-[1fr_220px]"><div><p className="mb-2 text-xs font-bold text-slate-700">Jenis kost</p><div className="flex flex-wrap gap-2">{["Semua tipe", "Putri", "Putra", "Campur"].map((type) => <button key={type} className={`chip ${activeType === type ? "chip-active" : ""}`} onClick={() => setActiveType(type)}>{type}</button>)}</div></div><label className="text-xs font-bold text-slate-700">Harga maksimal per bulan<select className="mt-2 block h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-emerald-600" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}><option>Semua harga</option><option value="900000">Rp900.000</option><option value="1000000">Rp1.000.000</option><option value="1500000">Rp1.500.000</option></select></label></div>}
    <div className="mb-6 flex flex-wrap items-center gap-2" aria-label="Filter area">{filters.map((filter) => <button key={filter} onClick={() => setActiveFilter(filter)} className={`chip ${activeFilter === filter ? "chip-active" : ""}`}>{filter}</button>)}</div>
    <div className="mb-4 flex items-center justify-between"><p className="text-sm text-slate-500"><strong className="text-slate-900">{filtered.length} kost</strong> ditemukan</p><button onClick={() => setShowMap(!showMap)} className="button-secondary !px-3 !py-2 text-xs lg:hidden"><Map size={15} />{showMap ? "Lihat daftar" : "Lihat peta"}</button></div>
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(310px,.78fr)]"><div className={`grid gap-4 ${showMap ? "hidden lg:grid" : ""}`}>{filtered.length ? filtered.map((kost) => <KostCard key={kost.slug} kost={kost} compact />) : <div className="rounded-3xl border border-dashed border-slate-200 px-5 py-16 text-center"><div className="mx-auto grid size-12 place-items-center rounded-full bg-emerald-50 text-emerald-800"><Search size={20} /></div><h2 className="mt-4 font-bold text-slate-900">Kost belum ditemukan</h2><p className="mt-1 text-sm text-slate-500">Coba kata kunci atau filter area lainnya.</p></div>}</div><aside className={`${showMap ? "block" : "hidden"} lg:sticky lg:top-24 lg:block`}><MapPreview className="min-h-[420px] lg:min-h-[calc(100vh-150px)]" points={mapPoints} /><div className="mt-3 flex items-center gap-2 text-xs text-slate-500"><Filter size={14} />Titik pada peta simulasi, bukan alamat terverifikasi</div></aside></div>
  </section>;
}
