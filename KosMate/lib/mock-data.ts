import type { LocalData, ServiceDefinition } from "@/lib/models";
import { kosts } from "@/lib/data";

const now = "2026-09-20T09:00:00.000Z";
const categorySeeds = [
  ["galon", "Isi Ulang Galon", "Pilih produk isi ulang dari penyedia.", "water", "provider", "fixed_price"],
  ["titip-belanja", "Titip Belanja", "Titip pembelian barang dari toko pilihanmu.", "basket", "errand", "customer_offer"],
  ["pesan-makanan", "Pesan Makanan", "Pesan menu dari merchant makanan sekitar.", "food", "provider_or_errand", "fixed_price"],
  ["cleaning", "Cleaning Kamar", "Atur jadwal layanan kebersihan kamar.", "cleaning", "errand", "customer_offer"],
  ["perbaikan", "Jasa Perbaikan", "Ceritakan masalah dan minta estimasi perbaikan.", "repair", "errand", "provider_quote"],
  ["paket", "Ambil / Antar Paket", "Atur pengambilan dan pengantaran paket.", "package", "errand", "customer_offer"],
  ["pindahan", "Bantuan Pindahan Kos", "Minta bantuan tenaga untuk pindah kos.", "moving", "errand", "provider_quote"],
  ["teknologi", "Bantuan Teknologi", "Bantuan WiFi, komputer, laptop, dan printer.", "tech", "errand", "provider_quote"],
  ["angkut", "Angkut / Pindah Barang", "Bantuan mengangkat dan memindahkan barang.", "luggage", "errand", "provider_quote"],
  ["lainnya", "Jasa Lainnya", "Konsultasikan kebutuhan khususmu bersama CS KosMate.", "chat", "consultation", "support_quote"],
] as const;

export const serviceCategories = categorySeeds.map(([slug, name, description, icon]) => ({ id: `cat-${slug}`, slug, name, description, icon, active: true })) as LocalData["serviceCategories"];
const providerTypesBySlug: Record<string, ServiceDefinition["providerTypes"]> = {
  galon: ["MITRA", "JASA_SURUH"],
  "titip-belanja": ["JASA_SURUH"],
  "pesan-makanan": ["MITRA", "JASA_SURUH"],
  cleaning: ["JASA_SURUH"],
  perbaikan: ["JASA_SURUH"],
  paket: ["JASA_SURUH"],
  pindahan: ["JASA_SURUH"],
  teknologi: ["JASA_SURUH"],
  angkut: ["JASA_SURUH"],
  lainnya: ["CS_KOSMATE"],
};
export const serviceDefinitions: ServiceDefinition[] = categorySeeds.map(([slug, name, description, icon, mode, pricingMode]) => ({ id: `service-${slug}`, slug: slug === "paket" ? "ambil-antar-paket" : slug === "pindahan" ? "bantuan-pindahan-kos" : slug === "angkut" ? "angkut-pindah-barang" : slug === "teknologi" ? "bantuan-teknologi" : slug === "titip-belanja" ? "titip-belanja" : slug === "cleaning" ? "cleaning-kamar" : slug === "perbaikan" ? "jasa-perbaikan" : slug === "lainnya" ? "jasa-lainnya" : slug === "galon" ? "isi-ulang-galon" : slug === "pesan-makanan" ? "pesan-makanan" : slug, categoryId: `cat-${slug}`, name, description, mode, pricingMode, providerTypes: providerTypesBySlug[slug], icon, active: true }));

const serviceId = (slug: string) => serviceDefinitions.find((service) => service.slug === slug)!.id;
const kostPhotos = (image: string, name: string) => [
  { id: `${name}-room`, url: image, name: `${name} kamar`, category: "Kamar" as const, isPrimary: true },
  { id: `${name}-bath`, url: "https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=900&q=80", name: `${name} kamar mandi`, category: "Kamar mandi" as const, isPrimary: false },
  { id: `${name}-common`, url: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=900&q=80", name: `${name} area bersama`, category: "Area bersama" as const, isPrimary: false },
];

export const initialLocalData: LocalData = {
  schemaVersion: 3,
  accounts: [{ id: "support-demo", name: "CS KosMate", email: "cs@kosmate.local", phone: "", role: "support", passwordSalt: "kosmate-support-demo", passwordHash: "11d81653c643f845260d758591de5683aa601eaaae15e9c2781d3bbc2b143703", createdAt: now }],
  partners: [],
  kosts: kosts.map((kost, index) => ({ ...kost, address: kost.location, photos: kostPhotos(kost.image, kost.slug), amenities: kost.facilities, rules: ["Tidak merokok di dalam kamar", "Tamu wajib melapor", "Menjaga kebersihan area bersama"], roomCount: 12, mockCoordinate: { latitude: -6.897 + index * 0.008, longitude: 107.604 + index * 0.006, isMock: true }, roomTypes: [{ id: `${kost.slug}-standard`, name: "Kamar Standard", size: "3 × 4 m (mock)", price: kost.price, facilities: kost.facilities.slice(0, 4), availability: 2 }], active: true })),
  serviceCategories,
  services: serviceDefinitions,
  serviceProviders: [
    { id: "provider-aqua-sehat", name: "Depot Aqua Sehat", area: "Bandung", serviceIds: [serviceId("isi-ulang-galon")], products: [{ id: "product-aqua-19", name: "Aqua 19L", priceFeeId: "fee-galon-aqua-19" }, { id: "product-le-minerale-19", name: "Le Minerale 19L", priceFeeId: "fee-galon-le-minerale" }, { id: "product-cleo-19", name: "Cleo 19L", priceFeeId: "fee-galon-cleo" }], verified: true, active: true },
    { id: "provider-warung-rina", name: "Dapur Bu Rina", area: "Bandung", serviceIds: [serviceId("pesan-makanan")], products: [], verified: true, active: true },
    { id: "provider-belanja-yuk", name: "Belanja Yuk", area: "Bandung", serviceIds: [serviceId("titip-belanja")], products: [], verified: true, active: true },
    { id: "provider-errand-queue", name: "Jasa Suruh KosMate", area: "Bandung (mock)", serviceIds: serviceDefinitions.filter((service) => service.providerTypes.includes("JASA_SURUH")).map((service) => service.id), products: [], verified: true, active: true },
  ],
  serviceFees: [
    { id: "fee-galon-aqua-19", serviceId: serviceId("isi-ulang-galon"), name: "Aqua 19L", amount: 22000, unit: "per galon", pricing: "fixed", active: true, currency: "IDR", updatedBy: "provider", updatedAt: now },
    { id: "fee-galon-le-minerale", serviceId: serviceId("isi-ulang-galon"), name: "Le Minerale 19L", amount: 21000, unit: "per galon", pricing: "fixed", active: true, currency: "IDR", updatedBy: "provider", updatedAt: now },
    { id: "fee-galon-cleo", serviceId: serviceId("isi-ulang-galon"), name: "Cleo 19L", amount: 20000, unit: "per galon", pricing: "fixed", active: true, currency: "IDR", updatedBy: "provider", updatedAt: now },
    { id: "fee-galon-delivery", serviceId: serviceId("isi-ulang-galon"), name: "Biaya bantuan pengantaran", amount: 5000, unit: "per pesanan", pricing: "fixed", active: true, currency: "IDR", updatedBy: "provider", updatedAt: now },
    { id: "fee-food-nasi-ayam", serviceId: serviceId("pesan-makanan"), name: "Nasi ayam", amount: 25000, unit: "per porsi", pricing: "fixed", active: true, currency: "IDR", updatedBy: "provider", updatedAt: now },
    { id: "fee-food-nasi-goreng", serviceId: serviceId("pesan-makanan"), name: "Nasi goreng", amount: 22000, unit: "per porsi", pricing: "fixed", active: true, currency: "IDR", updatedBy: "provider", updatedAt: now },
    { id: "fee-food-mie", serviceId: serviceId("pesan-makanan"), name: "Mie kuah", amount: 18000, unit: "per porsi", pricing: "fixed", active: true, currency: "IDR", updatedBy: "provider", updatedAt: now },
    { id: "fee-food-platform", serviceId: serviceId("pesan-makanan"), name: "Biaya layanan KosMate", amount: 2000, unit: "per pesanan", pricing: "fixed", active: true, currency: "IDR", updatedBy: "support", updatedAt: now },
  ],
  foodMerchants: [
    { id: "merchant-rina", slug: "dapur-bu-rina", name: "Dapur Bu Rina", photo: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=900&q=80", rating: 4.8, location: "Jl. Setiabudi (mock)", area: "Bandung", estimate: "20–30 menit", available: true, verified: true, menuItemIds: ["menu-ayam", "menu-goreng", "menu-mie"], mockCoordinate: { latitude: -6.9002, longitude: 107.6049, address: "Jl. Setiabudi (mock)", isMock: true }, mockRouteDistanceMeters: 1300, serviceFee: 2000, otherFees: 0 },
    { id: "merchant-kedai", slug: "kedai-senja", name: "Kedai Senja", photo: "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=900&q=80", rating: 4.7, location: "Area Dago (mock)", area: "Bandung", estimate: "25–35 menit", available: true, verified: true, menuItemIds: ["menu-soto", "menu-nasi"], mockCoordinate: { latitude: -6.8953, longitude: 107.6112, address: "Area Dago (mock)", isMock: true }, mockRouteDistanceMeters: 850, serviceFee: 2000, otherFees: 0 },
    { id: "merchant-warung", slug: "warung-hangat", name: "Warung Hangat", photo: "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=900&q=80", rating: 4.6, location: "Area Tamansari (mock)", area: "Bandung", estimate: "20–35 menit", available: false, verified: false, menuItemIds: ["menu-sayur", "menu-tempe"], mockCoordinate: { latitude: -6.9134, longitude: 107.6001, address: "Area Tamansari (mock)", isMock: true }, mockRouteDistanceMeters: 1650, serviceFee: 2000, otherFees: 0 },
  ],
  foodMenuItems: [
    { id: "menu-ayam", merchantId: "merchant-rina", name: "Nasi Ayam Sambal", description: "Ayam goreng, nasi hangat, dan sambal rumahan.", image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=700&q=80", price: 25000, available: true },
    { id: "menu-goreng", merchantId: "merchant-rina", name: "Nasi Goreng Spesial", description: "Nasi goreng dengan telur dan sayuran.", image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=700&q=80", price: 22000, available: true },
    { id: "menu-mie", merchantId: "merchant-rina", name: "Mie Kuah", description: "Mie kuah hangat dengan sayuran.", image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=700&q=80", price: 18000, available: true },
    { id: "menu-soto", merchantId: "merchant-kedai", name: "Soto Ayam", description: "Soto ayam dan nasi.", image: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=700&q=80", price: 24000, available: true },
    { id: "menu-nasi", merchantId: "merchant-kedai", name: "Nasi Telur", description: "Nasi, telur, dan sambal.", image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=700&q=80", price: 16000, available: true },
    { id: "menu-sayur", merchantId: "merchant-warung", name: "Sayur Asem", description: "Sayur asem rumahan.", image: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=700&q=80", price: 12000, available: true },
    { id: "menu-tempe", merchantId: "merchant-warung", name: "Tempe Goreng", description: "Tempe goreng hangat.", image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=700&q=80", price: 8000, available: true },
  ],
  orders: [], orderItems: [], cartItems: [], payments: [], quotes: [], negotiations: [], reviews: [], kostRequests: [], conversations: [], messages: [],
};
