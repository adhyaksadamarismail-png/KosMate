import Link from "next/link";
import { BriefcaseBusiness, Building2, Store } from "lucide-react";

const memberships = [
  { kind: "kost-owner", title: "Pemilik Kost", description: "Daftarkan dan kelola kost kamu di KosMate.", icon: Building2 },
  { kind: "food-merchant", title: "Mitra Makanan", description: "Jual makanan dan minuman kepada pengguna KosMate.", icon: Store },
  { kind: "errand-provider", title: "Jasa Suruh", description: "Bantu pengguna memenuhi berbagai kebutuhan mereka.", icon: BriefcaseBusiness },
];

export default function ChooseMembershipPage() {
  return <section className="page-wrap py-10 sm:py-16"><div className="mx-auto max-w-4xl"><span className="eyebrow-pill">Mitra KosMate</span><h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Pilih Jenis Kemitraan</h1><p className="mt-2 text-sm text-slate-500 sm:text-base">Pilih jenis kemitraan yang ingin kamu daftarkan di KosMate.</p><div className="mt-7 grid gap-4 md:grid-cols-3">{memberships.map(({ kind, title, description, icon: Icon }) => <Link key={kind} href={`/mitra/register/${kind}`} className="group rounded-3xl border border-slate-100 bg-white p-6 shadow-card transition hover:-translate-y-1 hover:border-emerald-200"><span className="grid size-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-800"><Icon size={23} /></span><h2 className="mt-5 text-lg font-extrabold text-slate-900">{title}</h2><p className="mt-2 min-h-12 text-sm leading-6 text-slate-500">{description}</p><span className="button-primary mt-5 w-full">Pilih kemitraan</span></Link>)}</div><p className="mt-6 text-sm text-slate-500">Sudah terdaftar sebagai mitra? <Link href="/mitra/login" className="font-bold text-emerald-800">Masuk</Link></p></div></section>;
}
