import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function SectionHeading({ eyebrow, title, description, href, action = "Lihat semua" }: { eyebrow?: string; title: string; description?: string; href?: string; action?: string }) {
  return <div className="mb-6 flex items-end justify-between gap-4"><div>{eyebrow && <p className="mb-2 text-xs font-bold uppercase tracking-[.16em] text-emerald-700">{eyebrow}</p>}<h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-[30px]">{title}</h2>{description && <p className="mt-2 text-sm text-slate-500">{description}</p>}</div>{href && <Link href={href} className="hidden items-center gap-1 text-sm font-bold text-emerald-800 hover:gap-2 sm:flex">{action}<ArrowRight size={16} /></Link>}</div>;
}
