"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BadgeCheck, CreditCard, LoaderCircle } from "lucide-react";
import { ProtectedRoute } from "@/components/protected-route";
import { useAuth } from "@/lib/auth-context";
import { createId, formatMoney, kosmateRepository } from "@/lib/local-repository";
import { useLocalData } from "@/lib/use-local-data";
import { getFoodFees, getOrderTotal } from "@/lib/pricing";
import type { ServiceOrder } from "@/lib/models";

function PaymentContent() {
  const { user } = useAuth();
  const [data, setData] = useLocalData();
  const [orderId, setOrderId] = useState<string | null>(null);
  const [completeOrder, setCompleteOrder] = useState<ServiceOrder | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { setOrderId(new URLSearchParams(window.location.search).get("orderId")); }, []);

  const serviceOrder = orderId ? data.orders.find((item) => item.id === orderId && item.customerId === user?.id) : undefined;
  const cart = useMemo(() => data.cartItems.filter((item) => item.customerId === user?.id), [data.cartItems, user?.id]);
  const merchant = cart[0] ? data.foodMerchants.find((item) => item.id === cart[0].merchantId) : undefined;
  const cartLines = cart.flatMap((line) => {
    const menu = data.foodMenuItems.find((item) => item.id === line.menuItemId);
    return menu ? [{ line, menu }] : [];
  });
  const subtotal = cartLines.reduce((sum, row) => sum + row.menu.price * row.line.quantity, 0);
  const fees = merchant ? getFoodFees(merchant, subtotal) : undefined;
  const cartTotal = fees ? getOrderTotal({ subtotal, shippingFee: fees.shippingFee, serviceFee: fees.serviceFee, otherFees: fees.otherFees }) : 0;
  const isCartFlow = !orderId;
  const serviceReady = Boolean(serviceOrder && serviceOrder.totalAmount !== null && serviceOrder.pricingStatus === "accepted" && serviceOrder.paymentStatus === "unpaid_mock");
  const cartReady = Boolean(isCartFlow && cart.length && cartLines.length && merchant && cart[0]?.deliveryLocation?.trim());
  const canPay = isCartFlow ? cartReady : serviceReady;
  const total = isCartFlow ? cartTotal : serviceOrder?.totalAmount ?? 0;

  function recordPayment(order: ServiceOrder, clearCart: boolean) {
    const now = new Date().toISOString();
    const payment = { id: createId("payment"), orderId: order.id, amount: order.totalAmount ?? 0, status: "succeeded_mock" as const, method: "mock" as const, createdAt: now };
    const next = kosmateRepository.update((current) => ({
      ...current,
      orders: [...current.orders.filter((item) => item.id !== order.id), { ...order, status: "accepted" as const, paymentStatus: "paid_mock" as const, updatedAt: now }],
      payments: [...current.payments, payment],
      cartItems: clearCart ? current.cartItems.filter((item) => item.customerId !== user?.id) : current.cartItems,
    }));
    setData(next);
    setCompleteOrder({ ...order, status: "accepted", paymentStatus: "paid_mock", updatedAt: now });
  }

  function pay() {
    if (!canPay || !user || busy) return;
    setBusy(true);
    if (!isCartFlow && serviceOrder) {
      recordPayment(serviceOrder, false);
      setBusy(false);
      return;
    }
    if (!merchant || !fees || !cartLines.length) { setBusy(false); return; }
    const now = new Date().toISOString();
    const order: ServiceOrder = {
      id: createId("order"), customerId: user.id,
      providerId: data.serviceProviders.find((provider) => provider.name === merchant.name)?.id,
      merchantId: merchant.id, serviceId: "service-pesan-makanan", status: "accepted",
      pricingMode: "fixed_price", pricingStatus: "accepted", itemsAmount: fees.subtotal,
      shippingFee: fees.shippingFee, routeDistanceMeters: fees.distanceMeters,
      serviceFee: fees.serviceFee, otherFees: fees.otherFees,
      totalAmount: cartTotal, paymentStatus: "unpaid_mock", currency: "IDR",
      pickupLocation: merchant.location, deliveryLocation: cart[0]?.deliveryLocation, pickupCoordinate: merchant.mockCoordinate, deliveryCoordinate: cart[0]?.deliveryCoordinate,
      details: { merchantName: merchant.name, request: "Pesanan menu merchant", paymentFlow: "mock" },
      createdAt: now, updatedAt: now,
    };
    const conversationId = createId("conversation");
    order.conversationId = conversationId;
    order.status = "accepted";
    const conversation = { id: conversationId, kind: "food_merchant" as const, customerId: user.id, participantId: merchant.userId ?? merchant.id, serviceId: order.serviceId, orderId: order.id, status: "consulting" as const, createdAt: now, updatedAt: now };
    const orderItems = cartLines.map(({ line, menu }) => ({ id: createId("order-item"), orderId: order.id, serviceId: order.serviceId, name: menu.name, quantity: line.quantity, unitAmount: menu.price, image: menu.image }));
    const message = { id: createId("message"), conversationId, senderId: user.id, senderRole: "customer" as const, body: `Pembayaran mock diterima. Pesanan dari ${merchant.name} sedang diproses.`, createdAt: now };
    const payment = { id: createId("payment"), orderId: order.id, amount: cartTotal, status: "succeeded_mock" as const, method: "mock" as const, createdAt: now };
    const next = kosmateRepository.update((current) => ({
      ...current,
      orders: [...current.orders, { ...order, paymentStatus: "paid_mock" as const }],
      orderItems: [...current.orderItems, ...orderItems],
      conversations: [...current.conversations, conversation],
      messages: [...current.messages, message],
      payments: [...current.payments, payment],
      cartItems: current.cartItems.filter((item) => item.customerId !== user.id),
    }));
    setData(next);
    setCompleteOrder({ ...order, paymentStatus: "paid_mock" });
    setBusy(false);
  }

  if (completeOrder) return <section className="page-wrap py-12"><div className="mx-auto max-w-xl rounded-3xl border border-emerald-100 bg-white p-8 text-center shadow-card sm:p-10"><span className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-50 text-emerald-700"><BadgeCheck size={28}/></span><h1 className="mt-5 text-2xl font-black">Pembayaran berhasil</h1><p className="mt-2 text-sm text-slate-500">Mock payment diterima. Pesanan langsung diteruskan untuk diproses.</p><p className="mt-3 text-sm font-bold">{formatMoney(completeOrder.totalAmount)}</p><Link className="button-primary mt-6" href="/pesanan">Lihat status pesanan</Link></div></section>;

  if (orderId && !serviceOrder) return <section className="page-wrap py-16 text-center"><h1 className="text-2xl font-extrabold">Pesanan tidak ditemukan</h1><Link href="/pesanan" className="button-primary mt-5">Kembali ke pesanan</Link></section>;
  if (!canPay) return <section className="page-wrap py-12"><div className="mx-auto max-w-xl rounded-3xl border border-amber-100 bg-white p-7 text-center shadow-card"><h1 className="text-2xl font-black">Pembayaran belum tersedia</h1><p className="mt-2 text-sm text-slate-500">{isCartFlow ? "Lengkapi keranjang dan alamat pengantaran terlebih dahulu." : "Pembayaran akan muncul setelah quotation diterima dan harga final disepakati."}</p><Link href={isCartFlow ? "/keranjang" : "/pesanan"} className="button-primary mt-5">Kembali</Link></div></section>;

  return <section className="page-wrap py-8 sm:py-12"><Link href={isCartFlow ? "/keranjang" : "/pesanan"} className="text-sm font-semibold text-slate-500">← Kembali</Link><div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]"><div><span className="eyebrow-pill"><CreditCard size={14}/> Pembayaran simulasi</span><h1 className="mt-4 text-3xl font-black">Lanjut ke Pembayaran</h1><p className="mt-2 text-sm text-slate-500">Tidak ada transaksi uang sungguhan pada prototype ini.</p>{isCartFlow&&<div className="mt-6 rounded-3xl border border-slate-100 bg-white p-5 shadow-card"><h2 className="font-extrabold">{merchant?.name}</h2><div className="mt-4 grid gap-3">{cartLines.map(({line,menu})=><div key={line.id} className="flex items-center gap-3"><div className="relative size-14 overflow-hidden rounded-xl"><Image src={menu.image} alt={menu.name} fill unoptimized sizes="56px" className="object-cover"/></div><div className="flex-1"><p className="text-sm font-bold">{menu.name} × {line.quantity}</p><p className="text-xs text-slate-500">{formatMoney(menu.price*line.quantity)}</p></div></div>)}</div><div className="mt-4 grid gap-2 border-t border-slate-100 pt-4 text-xs text-slate-500"><p>Pickup: {merchant?.location}</p><p>Delivery: {cart[0]?.deliveryLocation}</p><p>Rute mock: {fees?.distanceMeters} m</p></div></div>}</div><aside className="h-fit rounded-3xl border border-slate-100 bg-white p-5 shadow-card sm:p-6"><h2 className="text-lg font-extrabold">Rincian pembayaran</h2><div className="mt-5 grid gap-3 text-sm"><div className="flex justify-between"><span className="text-slate-500">Subtotal produk / kebutuhan</span><span>{formatMoney(isCartFlow?fees?.subtotal:serviceOrder?.itemsAmount)}</span></div><div className="flex justify-between"><span className="text-slate-500">Ongkir</span><span>{formatMoney(isCartFlow?fees?.shippingFee:serviceOrder?.shippingFee??0)}</span></div><div className="flex justify-between"><span className="text-slate-500">Biaya layanan</span><span>{formatMoney(isCartFlow?fees?.serviceFee:serviceOrder?.serviceFee)}</span></div><div className="flex justify-between"><span className="text-slate-500">Biaya lainnya</span><span>{formatMoney(isCartFlow?fees?.otherFees:serviceOrder?.otherFees)}</span></div><div className="flex justify-between border-t border-slate-100 pt-4 text-base"><strong>Total</strong><strong className="text-emerald-800">{formatMoney(total)}</strong></div></div><div className="mt-5 rounded-2xl bg-emerald-50 p-4 text-xs leading-5 text-emerald-900">Ini simulasi pembayaran lokal. Tidak ada QRIS atau payment gateway sungguhan.</div><button onClick={pay} disabled={busy} className="button-primary mt-5 w-full">{busy?<><LoaderCircle size={16} className="animate-spin"/>Memproses mock payment</>:"Simulasikan pembayaran berhasil"}</button></aside></div></section>;
}

export default function PaymentPage() { return <ProtectedRoute role="customer"><PaymentContent/></ProtectedRoute>; }
