"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, MapPin, Menu, LocateFixed } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useActiveLocation } from "@/lib/location-context";
import { useState as useReactState } from "react";

const links = [
  { href: "/", label: "Beranda" },
  { href: "/kost", label: "Cari Kost" },
  { href: "/layanan", label: "Jasa Layanan" },
  { href: "/#tentang-kami", label: "Tentang Kami" },
];

export function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const { location, setLocation, locate } = useActiveLocation();
  const [locationOpen, setLocationOpen] = useReactState(false);
  const [locationError, setLocationError] = useReactState("");
  const [city, setCity] = useReactState("Bandung");
  const [address, setAddress] = useReactState("");
  const cities = [{ name: "Bandung", lat: -6.9175, lng: 107.6191 }, { name: "Jakarta", lat: -6.2088, lng: 106.8456 }, { name: "Yogyakarta", lat: -7.7956, lng: 110.3695 }, { name: "Surabaya", lat: -7.2575, lng: 112.7521 }];
  const chooseLocation = () => { const point = cities.find((item) => item.name === city)!; setLocation({ latitude: point.lat, longitude: point.lng, city: point.name, address: address.trim() || `Area ${point.name} (lokasi manual)`, isMock: true }); setLocationOpen(false); setLocationError(""); };
  const accountHome = user?.role === "customer" ? "/pesanan" : user?.role === "support" ? "/internal/cs" : "/mitra/dashboard";
  const accountHomeLabel = user?.role === "customer" ? "Pesanan" : user?.role === "support" ? "Dashboard CS" : "Dashboard";
  return (
    <header className="sticky top-0 z-40 border-b border-emerald-950/5 bg-white/95 backdrop-blur-xl">
      <div className="page-wrap flex h-[70px] items-center justify-between gap-5">
        <Link href="/" className="flex shrink-0 items-center gap-2 text-[21px] font-extrabold tracking-tight text-emerald-900">
          <span className="grid size-9 place-items-center rounded-xl bg-emerald-700 text-white"><House size={20} fill="currentColor" strokeWidth={2.5} /></span>
          KosMate
        </Link>
        <nav className="hidden items-center gap-8 md:flex" aria-label="Navigasi utama">
          {links.map((link) => <Link key={link.label} href={link.href} className={`nav-link ${pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href)) ? "nav-link-active" : ""}`}>{link.label}</Link>)}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <button className="button-secondary !px-3 !py-2.5" onClick={() => setLocationOpen(true)}><MapPin size={16}/>{location?.city ?? "Pilih lokasi"}</button>
          {user ? <><span className="max-w-32 truncate px-2 text-xs font-semibold text-slate-600">Hai, {user.name.split(" ")[0]}</span><Link href={accountHome} className="button-secondary !px-4 !py-2.5">{accountHomeLabel}</Link><button className="button-primary !px-4 !py-2.5" onClick={logout}>Keluar</button></> : <><Link href="/login" className="button-secondary !px-5 !py-2.5">Masuk</Link><Link href="/register" className="button-primary !px-5 !py-2.5">Daftar</Link></>}
        </div>
        <div className="flex items-center gap-2 md:hidden">
          <button className="button-secondary !px-2.5 !py-2" onClick={() => setLocationOpen(true)}><MapPin size={16}/><span className="max-w-20 truncate">{location?.city ?? "Lokasi"}</span></button>
          <button className="icon-button" aria-label="Buka navigasi" onClick={() => setMenuOpen(!menuOpen)}><Menu size={20} /></button>
        </div>
      </div>
      {menuOpen && <nav className="absolute inset-x-0 top-full border-b border-slate-100 bg-white p-4 shadow-lg md:hidden" aria-label="Navigasi mobile">{links.map((link) => <Link key={link.label} href={link.href} onClick={() => setMenuOpen(false)} className="block rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-emerald-50">{link.label}</Link>)}<div className="mt-2 flex gap-2">{user ? <><Link onClick={() => setMenuOpen(false)} href={accountHome} className="button-secondary flex-1">{accountHomeLabel}</Link><button className="button-primary flex-1" onClick={() => { logout(); setMenuOpen(false); }}>Keluar</button></> : <><Link onClick={() => setMenuOpen(false)} href="/login" className="button-secondary flex-1">Masuk</Link><Link onClick={() => setMenuOpen(false)} href="/register" className="button-primary flex-1">Daftar</Link></>}</div></nav>}
      {locationOpen && <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/40 p-4" role="dialog" aria-modal="true" aria-label="Pilih lokasi"><div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"><h2 className="text-xl font-extrabold">Lokasi Aktif</h2><p className="mt-1 text-sm text-slate-500">Gunakan lokasi perangkat atau pilih area secara manual.</p><button className="button-primary mt-5 w-full" onClick={async()=>{try{await locate();setLocationOpen(false);setLocationError("");}catch(error){setLocationError(error instanceof Error?error.message:"Lokasi tidak tersedia.");}}}><LocateFixed size={17}/>Izinkan Lokasi</button>{locationError&&<p role="status" className="mt-2 text-xs text-amber-700">{locationError}</p>}<div className="mt-5 grid gap-3"><label className="form-label">Pilih kota<select className="form-input" value={city} onChange={(event)=>setCity(event.target.value)}>{cities.map((item)=><option key={item.name}>{item.name}</option>)}</select></label><label className="form-label">Area atau alamat (opsional)<input className="form-input" value={address} onChange={(event)=>setAddress(event.target.value)} placeholder="Contoh: Dago, Bandung"/></label><button className="button-secondary w-full" onClick={chooseLocation}>Pilih Lokasi Manual</button></div><button className="mt-4 w-full text-sm font-semibold text-slate-500" onClick={()=>setLocationOpen(false)}>Tutup</button></div></div>}
    </header>
  );
}
