"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Minus, Plus, Trash2 } from "lucide-react";
import { MapPreview } from "@/components/map-preview";
import type { MapPoint } from "@/components/leaflet-map";
import { ProtectedRoute } from "@/components/protected-route";
import { useAuth } from "@/lib/auth-context";
import { formatMoney, kosmateRepository } from "@/lib/local-repository";
import { useLocalData } from "@/lib/use-local-data";
import { getFoodFees, getOrderTotal } from "@/lib/pricing";
import type { CartItem, FoodMerchant } from "@/lib/models";

const demoDelivery = { latitude: -6.906, longitude: 107.615, address: "Alamat kos (lokasi mock)", isMock: true as const };

function CartContent() {
  const { user } = useAuth();
  const [data, setData] = useLocalData();
  const cart = useMemo(() => data.cartItems.filter((item) => item.customerId === user?.id), [data.cartItems, user?.id]);
  const [deliveryAddress, setDeliveryAddress] = useState(cart[0]?.deliveryLocation ?? "");
  const firstCartId = cart[0]?.id ?? "";
  const savedDeliveryAddress = cart[0]?.deliveryLocation ?? "";
  useEffect(() => { setDeliveryAddress(savedDeliveryAddress); }, [firstCartId, savedDeliveryAddress]);
  const merchant: FoodMerchant | undefined = cart[0] ? data.foodMerchants.find((item) => item.id === cart[0].merchantId) : undefined;
  const items = cart.flatMap((line) => {
    const menuItem = data.foodMenuItems.find((item) => item.id === line.menuItemId);
    return menuItem ? [{ line, menuItem }] : [];
  });
  const subtotal = items.reduce((sum, row) => sum + row.menuItem.price * row.line.quantity, 0);
  const fees = merchant ? getFoodFees(merchant, subtotal) : undefined;
  const total = fees ? getOrderTotal({ subtotal, shippingFee: fees.shippingFee, serviceFee: fees.serviceFee, otherFees: fees.otherFees }) : 0;
  const pickupPoint = merchant?.mockCoordinate ?? { latitude: -6.9, longitude: 107.61, address: merchant?.location ?? "Merchant (mock)", isMock: true as const };
  const deliveryPoint = cart[0]?.deliveryCoordinate ?? demoDelivery;
  const points: MapPoint[] = merchant ? [
    { id: merchant.id, label: merchant.name, ...pickupPoint },
    { id: "customer-delivery", label: "Alamat pengantaran", ...deliveryPoint },
  ] : [];

  function setQuantity(line: CartItem, delta: number) {
    const quantity = Math.max(0, line.quantity + delta);
    const next = kosmateRepository.update((current) => ({
      ...current,
      cartItems: quantity === 0 ? current.cartItems.filter((item) => item.id !== line.id) : current.cartItems.map((item) => item.id === line.id ? { ...item, quantity, updatedAt: new Date().toISOString() } : item),
    }));
    setData(next);
  }

  function updateDelivery(value: string) {
    setDeliveryAddress(value);
    if (!user) return;
    setData(kosmateRepository.update((current) => ({
      ...current,
      cartItems: current.cartItems.map((item) => item.customerId === user.id ? {
        ...item,
        deliveryLocation: value,
        deliveryCoordinate: { ...demoDelivery, address: value || demoDelivery.address },
        updatedAt: new Date().toISOString(),
      } : item),
    })));
  }

  function clearCart() {
    if (!user) return;
    setData(kosmateRepository.update((current) => ({ ...current, cartItems: current.cartItems.filter((item) => item.customerId !== user.id) })));
  }

  return <section className="page-wrap py-8 sm:py-12">
    <Link href="/layanan/pesan-makanan" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500"><ArrowLeft size={16}/>Kembali ke merchant</Link>
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div>
        <h1 className="text-3xl font-black">Keranjang</h1>
        <p className="mt-2 text-sm text-slate-500">Tinjau menu dan lokasi pengantaran sebelum pembayaran.</p>
        {!items.length ? <div className="mt-6 rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center"><h2 className="font-bold">Keranjangmu kosong</h2><p className="mt-2 text-sm text-slate-500">Pilih makanan dari merchant untuk memulai pesanan.</p><Link href="/layanan/pesan-makanan" className="button-primary mt-5">Jelajahi merchant</Link></div> : <>
          <div className="mt-6 rounded-3xl border border-slate-100 bg-white p-5 shadow-card sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3"><div><p className="text-xs font-bold text-emerald-800">Merchant</p><h2 className="mt-1 text-lg font-extrabold">{merchant?.name}</h2></div><button onClick={clearCart} className="button-secondary !px-3 !py-2 text-xs"><Trash2 size={14}/>Kosongkan</button></div>
            <div className="divide-y divide-slate-100">{items.map(({ line, menuItem }) => <article key={line.id} className="flex items-center gap-3 py-4 first:pt-0 last:pb-0"><div className="relative size-16 shrink-0 overflow-hidden rounded-xl"><Image src={menuItem.image} alt={menuItem.name} fill unoptimized sizes="64px" className="object-cover"/></div><div className="min-w-0 flex-1"><h3 className="text-sm font-bold">{menuItem.name}</h3><p className="mt-1 text-xs text-slate-500">{formatMoney(menuItem.price)} / item</p></div><div className="flex items-center gap-2"><button onClick={() => setQuantity(line, -1)} aria-label={`Kurangi ${menuItem.name}`} className="icon-button !size-8"><Minus size={14}/></button><span className="min-w-5 text-center text-sm font-bold">{line.quantity}</span><button onClick={() => setQuantity(line, 1)} aria-label={`Tambah ${menuItem.name}`} className="icon-button !size-8"><Plus size={14}/></button></div><strong className="w-24 text-right text-sm">{formatMoney(menuItem.price * line.quantity)}</strong></article>)}</div>
          </div>
          <div className="mt-5 grid gap-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-card sm:p-6">
            <h2 className="font-extrabold">Lokasi Pesanan</h2>
            <div className="grid gap-3 sm:grid-cols-2"><div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold text-slate-500">Lokasi Pengambilan / Pickup</p><p className="mt-1 text-sm font-semibold">{merchant?.location}</p></div><label className="form-label rounded-2xl bg-slate-50 p-3">Alamat Pengantaran / Delivery<input required className="form-input" value={deliveryAddress} onChange={(event) => updateDelivery(event.target.value)} placeholder="Nama kost, jalan, nomor kamar"/></label></div>
            {merchant && <MapPreview points={points} route className="h-64"/>}
            <p className="text-xs text-slate-500">Jarak rute mock {((fees?.distanceMeters ?? 0) / 1000).toFixed(1)} km · ongkir dihitung Rp3.000 per 500 meter rute. Titik belum memakai routing API.</p>
          </div>
        </>}
      </div>
      {fees && <aside className="h-fit rounded-3xl border border-slate-100 bg-white p-5 shadow-card sm:p-6 lg:sticky lg:top-24"><h2 className="text-lg font-extrabold">Rincian pembayaran</h2><div className="mt-5 grid gap-3 text-sm"><div className="flex justify-between gap-3"><span className="text-slate-500">Subtotal produk</span><span className="font-semibold">{formatMoney(fees.subtotal)}</span></div><div className="flex justify-between gap-3"><span className="text-slate-500">Ongkir · {fees.distanceMeters} m</span><span className="font-semibold">{formatMoney(fees.shippingFee)}</span></div><div className="flex justify-between gap-3"><span className="text-slate-500">Biaya layanan KosMate</span><span className="font-semibold">{formatMoney(fees.serviceFee)}</span></div><div className="flex justify-between gap-3"><span className="text-slate-500">Biaya lainnya</span><span className="font-semibold">{formatMoney(fees.otherFees)}</span></div><div className="mt-1 flex justify-between border-t border-slate-100 pt-4 text-base"><span className="font-bold">Total</span><strong className="text-emerald-800">{formatMoney(total)}</strong></div></div><Link href="/pembayaran" aria-disabled={!items.length || !deliveryAddress.trim()} className={`button-primary mt-5 w-full ${!items.length || !deliveryAddress.trim() ? "pointer-events-none opacity-50" : ""}`}>Lanjut ke Pembayaran</Link><p className="mt-3 text-center text-xs text-slate-500">Jarak dan ongkir masih berupa estimasi demo.</p></aside>}
    </div>
  </section>;
}

export default function CartPage() { return <ProtectedRoute role="customer"><CartContent/></ProtectedRoute>; }
