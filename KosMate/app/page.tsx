import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, CalendarCheck, ChevronRight, MapPin, Search, ShieldCheck, Sparkles, UsersRound } from "lucide-react";
import { KostCard } from "@/components/kost-card";
import { MapPreview } from "@/components/map-preview";
import { SectionHeading } from "@/components/section-heading";
import { ServiceIcon } from "@/components/icons";
import { kosts, services } from "@/lib/data";

const benefits = [
  { icon: BadgeCheck, title: "Kost Terpercaya", text: "100+ kost terverifikasi" },
  { icon: Search, title: "Layanan Lengkap", text: "Semua kebutuhan anak kos" },
  { icon: ShieldCheck, title: "Transaksi Aman", text: "Pembayaran terpercaya" },
  { icon: UsersRound, title: "Mitra Berkualitas", text: "Dari penyedia pilihan" },
];

export default function HomePage() {
  return <>
    <section className="page-wrap pt-5 sm:pt-8">
      <div className="hero-panel relative grid overflow-hidden rounded-[28px] bg-emerald-50 lg:min-h-[460px] lg:grid-cols-[.9fr_1.1fr]">
        <div className="relative z-10 flex flex-col items-start justify-center px-6 py-10 sm:px-10 lg:px-12 lg:py-12">
          <span className="eyebrow-pill"><Sparkles size={14} /> #TemanHidupAnakKos</span>
          <h1 className="mt-5 max-w-[560px] text-[38px] font-black leading-[1.08] tracking-[-.045em] text-slate-950 sm:text-5xl xl:text-[58px]">Semua Kebutuhan Anak Kos, <span className="text-emerald-800">Dalam Satu Platform</span></h1>
          <p className="mt-5 max-w-lg text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">Cari kost yang sesuai, dan nikmati berbagai layanan harian tanpa ribet. KosMate hadir untuk membuat hidup anak kos jadi lebih mudah.</p>
          <div className="mt-7 flex w-full flex-wrap gap-3"><Link href="/kost" className="button-primary !px-6 !py-3">Cari Kost <ArrowRight size={17} /></Link><Link href="/layanan" className="button-secondary !px-6 !py-3">Lihat Layanan</Link></div>
        </div>
        <div className="hero-image relative min-h-[270px] sm:min-h-[360px] lg:min-h-full">
          <Image src="https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1500&q=90" alt="Kamar kost yang terang dan nyaman" fill priority sizes="(max-width: 1024px) 100vw, 55vw" className="object-cover" />
          <div className="absolute left-4 top-4 z-10 flex items-center gap-3 rounded-2xl bg-white/95 p-3 shadow-card sm:left-8 sm:top-8 sm:p-4"><span className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><MapPin size={22} fill="currentColor" /></span><div><p className="text-xs text-slate-500">Kost dekat kampus mulai dari</p><p className="mt-0.5 font-extrabold text-emerald-800">Rp700.000/bulan</p></div></div>
          <Link href="/layanan" className="absolute bottom-4 right-4 z-10 flex items-center gap-3 rounded-2xl bg-white/95 p-3 shadow-card sm:bottom-8 sm:right-8 sm:p-4"><span className="grid size-10 place-items-center rounded-xl bg-amber-50 text-amber-600"><CalendarCheck size={22} /></span><span><strong className="block text-sm text-slate-900">Layanan Kos</strong><small className="text-xs text-slate-500">Galon, cleaning, makanan</small></span><ChevronRight size={16} className="text-slate-400" /></Link>
        </div>
      </div>
    </section>
    <section className="page-wrap pt-5 sm:pt-7"><div className="grid grid-cols-2 gap-3 rounded-3xl border border-slate-100 bg-white p-3 shadow-card sm:grid-cols-4 sm:p-5">{benefits.map(({ icon: Icon, title, text }) => <div key={title} className="flex items-center gap-3 rounded-2xl p-3"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-700"><Icon size={20} /></span><span><strong className="block text-xs font-bold text-slate-900 sm:text-sm">{title}</strong><small className="mt-1 block text-[10px] text-slate-500 sm:text-xs">{text}</small></span></div>)}</div></section>
    <section className="page-wrap pt-14 sm:pt-20"><SectionHeading eyebrow="Hunian yang bikin betah" title="Cari Kost" description="Temukan kost yang sesuai dengan kebutuhan dan lokasi kamu." href="/kost" />
      <Link href="/kost" className="search-bar group mb-5 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm transition hover:border-emerald-300 sm:max-w-2xl"><Search size={20} className="text-emerald-800" /><span className="flex-1 text-left text-sm text-slate-400">Cari daerah, kampus, atau nama kost...</span><span className="button-primary !px-4 !py-2 text-xs">Cari Kost</span></Link>
      <div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]"><div className="grid gap-4">{kosts.slice(0, 3).map((kost) => <KostCard key={kost.slug} kost={kost} compact />)}<Link href="/kost" className="button-secondary mx-auto mt-1">Lihat semua kost <ArrowRight size={16} /></Link></div><MapPreview className="min-h-[300px] lg:min-h-full" /></div>
    </section>
    <section className="page-wrap pt-16 sm:pt-20"><SectionHeading eyebrow="Biar makin praktis" title="Jasa Layanan" description="Beragam layanan harian untuk memenuhi kebutuhan kamu." href="/layanan" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{services.slice(0, 3).map((service) => <Link key={service.name} href="/layanan" className="service-card group"><span className={`service-illustration ${service.color}`}><ServiceIcon kind={service.icon} className="size-10" /></span><div className="min-w-0 flex-1"><h3 className="font-bold text-slate-900">{service.name}</h3><p className="mt-1 text-xs leading-5 text-slate-500">{service.description}</p><span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-emerald-800">{service.price}<ChevronRight size={14} className="transition group-hover:translate-x-1" /></span></div></Link>)}</div>
    </section>
    <section id="tentang-kami" className="page-wrap pt-14 sm:pt-20"><div className="cta-panel flex flex-col items-start justify-between gap-6 rounded-3xl px-6 py-8 sm:flex-row sm:items-center sm:px-10 sm:py-10"><div><p className="text-sm font-bold text-emerald-800">KosMate selalu dekat</p><h2 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl">Mulai hidup kos yang lebih mudah</h2><p className="mt-2 text-sm text-slate-600">Kost nyaman dan kebutuhan harian, semua ada di sini.</p></div><Link href="/kost" className="button-primary shrink-0 !px-6 !py-3">Jelajahi sekarang <ArrowRight size={17} /></Link></div></section>
  </>;
}
