import { initialLocalData } from "@/lib/mock-data";
import type { LocalData } from "@/lib/models";
import { persistLocalChanges } from "@/lib/supabase/data-sync";

const STORAGE_KEY = "kosmate.prototype.data.v1";

export interface KosMateRepository {
  read(): LocalData;
  write(data: LocalData): void;
  update(updater: (current: LocalData) => LocalData): LocalData;
}

function cloneSeed(): LocalData {
  return JSON.parse(JSON.stringify(initialLocalData)) as LocalData;
}

function read(): LocalData {
  if (typeof window === "undefined") return cloneSeed();
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return cloneSeed();
    const parsed = JSON.parse(stored) as Partial<LocalData>;
    const seed = cloneSeed();
    const services = seed.services.map((defaults) => {
      const saved = (parsed.services ?? []).find((item) => item.id === defaults.id || item.slug === defaults.slug);
      return { ...defaults, ...saved, pricingMode: saved?.pricingMode ?? defaults.pricingMode, providerTypes: saved?.providerTypes ?? defaults.providerTypes };
    });
    const serviceCategories = seed.serviceCategories.map((defaults) => (parsed.serviceCategories ?? []).find((item) => item.id === defaults.id || item.slug === defaults.slug) ?? defaults);
    return {
      ...seed,
      ...parsed,
      schemaVersion: 3,
      accounts: [...seed.accounts, ...(parsed.accounts ?? [])].map((account) => ({ ...account, role: account.role === ("partner" as never) ? "errand_provider" as const : account.role })).filter((account, index, all) => all.findIndex((candidate) => candidate.id === account.id) === index),
      partners: parsed.partners ?? seed.partners,
      kosts: [...(parsed.kosts ?? []), ...seed.kosts].map((kost) => ({ ...kost, address: kost.address ?? kost.location, photos: kost.photos ?? [{ id: `${kost.slug}-primary`, url: kost.image, name: kost.name, category: "Kamar" as const, isPrimary: true }], amenities: kost.amenities ?? kost.facilities, rules: kost.rules ?? [], roomTypes: kost.roomTypes ?? [{ id: `${kost.slug}-standard`, name: "Kamar Standard", size: "Belum diisi", price: kost.price, facilities: kost.facilities, availability: 1 }], mockCoordinate: kost.mockCoordinate ?? { latitude: null, longitude: null, isMock: true } })).filter((kost, index, all) => all.findIndex((candidate) => candidate.slug === kost.slug) === index),
      serviceCategories,
      services,
      serviceProviders: [...seed.serviceProviders.map((defaults) => ({ ...defaults, ...(parsed.serviceProviders ?? []).find((item) => item.id === defaults.id) })), ...(parsed.serviceProviders ?? []).filter((item) => !seed.serviceProviders.some((defaults) => defaults.id === item.id))],
      serviceFees: [...seed.serviceFees.map((defaults) => ({ ...defaults, ...(parsed.serviceFees ?? []).find((item) => item.id === defaults.id) })), ...(parsed.serviceFees ?? []).filter((item) => !seed.serviceFees.some((defaults) => defaults.id === item.id))].map((fee) => ({ ...fee, updatedBy: fee.updatedBy === ("finance" as never) ? "support" as const : fee.updatedBy })),
      foodMerchants: [...seed.foodMerchants.map((defaults) => ({ ...defaults, ...(parsed.foodMerchants ?? []).find((item) => item.id === defaults.id) })), ...(parsed.foodMerchants ?? []).filter((item) => !seed.foodMerchants.some((defaults) => defaults.id === item.id))],
      foodMenuItems: [...seed.foodMenuItems.map((defaults) => ({ ...defaults, ...(parsed.foodMenuItems ?? []).find((item) => item.id === defaults.id) })), ...(parsed.foodMenuItems ?? []).filter((item) => !seed.foodMenuItems.some((defaults) => defaults.id === item.id))],
      orders: (parsed.orders ?? seed.orders).map((order) => { const service = services.find((item) => item.id === order.serviceId); const itemsAmount = (parsed.orderItems ?? []).filter((item) => item.orderId === order.id).reduce((sum, item) => sum + (item.unitAmount ?? 0) * item.quantity, 0); return { ...order, pricingMode: order.pricingMode ?? service?.pricingMode ?? "customer_offer", pricingStatus: order.pricingStatus ?? (order.status === "awaiting_approval" ? "countered" as const : order.status === "accepted" || order.status === "received" ? "accepted" as const : order.totalAmount === null ? "waiting_provider" as const : "none" as const), serviceFee: order.serviceFee ?? 0, otherFees: order.otherFees ?? 0, shippingFee: order.shippingFee ?? 0, itemsAmount: order.itemsAmount ?? itemsAmount, paymentStatus: order.paymentStatus ?? (order.totalAmount === null ? "not_started" as const : "unpaid_mock" as const), pickupLocation: order.pickupLocation, deliveryLocation: order.deliveryLocation ?? order.address }; }),
      orderItems: parsed.orderItems ?? seed.orderItems,
      cartItems: parsed.cartItems ?? seed.cartItems,
      payments: parsed.payments ?? seed.payments,
      quotes: parsed.quotes ?? seed.quotes,
      negotiations: parsed.negotiations ?? seed.negotiations,
      reviews: parsed.reviews ?? seed.reviews,
      kostRequests: parsed.kostRequests ?? seed.kostRequests,
      conversations: (parsed.conversations ?? seed.conversations).map((conversation) => ({ ...conversation, kind: conversation.kind ?? (conversation.serviceId === "service-jasa-lainnya" ? "support" as const : "errand_provider" as const), status: conversation.status === ("approved" as never) ? "approved" as const : conversation.status })),
      messages: (parsed.messages ?? seed.messages).map((message) => ({ ...message, senderRole: message.senderRole === ("kosmate" as never) ? "support" as const : message.senderRole })),
    };
  } catch {
    return cloneSeed();
  }
}

function write(data: LocalData) {
  if (typeof window === "undefined") return;
  const before = read();
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  window.dispatchEvent(new CustomEvent("kosmate:data-updated"));
  void persistLocalChanges(before, data).catch((error: unknown) => console.error("KosMate gagal menyimpan perubahan ke Supabase", error));
}

export const kosmateRepository: KosMateRepository = {
  read,
  write,
  update(updater) {
    const next = updater(read());
    write(next);
    return next;
  },
};

export function createId(prefix: string) {
  const id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}-${id}`;
}

export function formatMoney(amount: number | null | undefined) {
  if (amount === null || amount === undefined) return "Menunggu rincian biaya";
  return `Rp${amount.toLocaleString("id-ID")}`;
}
