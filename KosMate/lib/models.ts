import type { Kost } from "@/lib/data";

export type PartnerKind = "kost_owner" | "food_merchant" | "errand_provider";
export type UserRole = "customer" | PartnerKind | "support";
export type LoginRole = "customer" | "partner" | "support";
export type ServiceMode = "provider" | "errand" | "provider_or_errand" | "consultation";
export type ProviderType = "MITRA" | "JASA_SURUH" | "CS_KOSMATE";
export type PricingMode = "fixed_price" | "customer_offer" | "provider_quote" | "negotiable" | "support_quote";
export type ServiceIconKind = "water" | "basket" | "food" | "cleaning" | "repair" | "package" | "moving" | "home" | "tech" | "luggage" | "chat";
export type OrderStatus = "received" | "accepted" | "in_progress" | "ready_for_delivery" | "on_the_way" | "completed" | "cancelled" | "awaiting_quote" | "awaiting_approval";
export type ConversationKind = "kost_owner" | "food_merchant" | "errand_provider" | "support";

export type Account = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  partnerId?: string;
  passwordSalt: string;
  passwordHash: string;
  createdAt: string;
};
export type Partner = { id: string; userId: string; type: PartnerKind; displayName: string; verified: boolean; active: boolean; createdAt: string };

export type KostPhoto = { id: string; url: string; name: string; category: "Kamar" | "Kamar mandi" | "Bagian luar" | "Fasilitas" | "Area bersama"; isPrimary: boolean };
export type RoomType = { id: string; name: string; size: string; price: number; facilities: string[]; availability: number };
export type MockCoordinate = { latitude: number | null; longitude: number | null; isMock: true };
export type Location = { latitude: number; longitude: number; address: string; isMock: true };
export type KostListing = Kost & {
  ownerId?: string;
  active?: boolean;
  address?: string;
  mockCoordinate?: MockCoordinate;
  photos?: KostPhoto[];
  amenities?: string[];
  rules?: string[];
  roomTypes?: RoomType[];
  roomCount?: number;
};

export type ServiceCategory = { id: string; slug: string; name: string; description: string; icon: ServiceIconKind; active: boolean };
export type ServiceDefinition = {
  id: string;
  slug: string;
  categoryId: string;
  name: string;
  description: string;
  mode: ServiceMode;
  pricingMode: PricingMode;
  providerTypes: ProviderType[];
  icon: ServiceIconKind;
  active: boolean;
  ownerId?: string;
  providerId?: string;
};
export type ProviderProduct = { id: string; name: string; description?: string; priceFeeId?: string };
export type ServiceProvider = { id: string; userId?: string; name: string; phone?: string; area: string; serviceIds: string[]; products: ProviderProduct[]; verified: boolean; active: boolean };
export type ServiceFee = {
  id: string;
  serviceId: string;
  name: string;
  amount: number | null;
  unit: string;
  pricing: "fixed" | "quote";
  active: boolean;
  currency: "IDR";
  updatedBy: "support" | "provider";
  updatedAt: string;
};
export type Quote = { id: string; orderId?: string; conversationId?: string; createdBy: string; itemsAmount: number; shippingFee: number; serviceFee: number; otherFees: number; totalAmount: number; status: "sent" | "accepted" | "rejected" | "superseded"; createdAt: string; updatedAt: string };
export type Negotiation = { id: string; orderId: string; authorId: string; amount: number; note?: string; status: "proposed" | "accepted" | "rejected" | "superseded"; createdAt: string };
export type Review = { id: string; customerId: string; partnerId: string; orderId: string; rating: number; comment: string; createdAt: string };

export type FoodMenuItem = { id: string; merchantId: string; name: string; description: string; image: string; price: number; available: boolean };
export type FoodMerchant = { id: string; userId?: string; slug: string; name: string; photo: string; rating: number; location: string; area: string; estimate: string; available: boolean; verified: boolean; menuItemIds: string[]; mockCoordinate?: Location; mockRouteDistanceMeters?: number; serviceFee?: number; otherFees?: number };
export type KostRequest = { id: string; kostSlug: string; customerId: string; status: "new" | "replied" | "closed"; createdAt: string };

export type OrderItem = { id: string; orderId: string; serviceId: string; name: string; quantity: number; unitAmount: number | null; feeId?: string; notes?: string; image?: string };
export type CartItem = { id: string; customerId: string; merchantId: string; menuItemId: string; quantity: number; deliveryLocation?: string; deliveryCoordinate?: Location; updatedAt: string };
export type MockPayment = { id: string; orderId: string; amount: number; status: "succeeded_mock"; method: "mock"; createdAt: string };
export type ServiceOrder = {
  id: string;
  customerId: string;
  providerId?: string;
  merchantId?: string;
  serviceId: string;
  status: OrderStatus;
  pricingMode: PricingMode;
  pricingStatus: "none" | "waiting_provider" | "countered" | "quoted" | "accepted" | "rejected";
  customerOffer?: number;
  providerOffer?: number;
  serviceFee: number;
  additionalFee?: number | null;
  otherFees: number;
  shippingFee: number;
  routeDistanceMeters?: number;
  pickupCoordinate?: Location;
  deliveryCoordinate?: Location;
  itemsAmount: number;
  totalAmount: number | null;
  paymentStatus: "not_started" | "unpaid_mock" | "paid_mock";
  currency: "IDR";
  pickupLocation?: string;
  deliveryLocation?: string;
  address?: string;
  scheduledAt?: string;
  details: Record<string, string>;
  conversationId?: string;
  createdAt: string;
  updatedAt: string;
};

export type Conversation = {
  id: string;
  kind: ConversationKind;
  customerId: string;
  participantId?: string;
  serviceId?: string;
  kostSlug?: string;
  orderId?: string;
  status: "consulting" | "quoted" | "approved" | "declined" | "closed";
  serviceFeeId?: string;
  quotedAmount?: number;
  serviceFee?: number;
  otherFees?: number;
  createdAt: string;
  updatedAt: string;
};
export type Message = { id: string; conversationId: string; senderId: string; senderRole: UserRole | "support"; body: string; createdAt: string };

export type LocalData = {
  schemaVersion: number;
  accounts: Account[];
  partners: Partner[];
  kosts: KostListing[];
  serviceCategories: ServiceCategory[];
  services: ServiceDefinition[];
  serviceProviders: ServiceProvider[];
  serviceFees: ServiceFee[];
  foodMerchants: FoodMerchant[];
  foodMenuItems: FoodMenuItem[];
  orders: ServiceOrder[];
  orderItems: OrderItem[];
  cartItems: CartItem[];
  payments: MockPayment[];
  quotes: Quote[];
  negotiations: Negotiation[];
  reviews: Review[];
  kostRequests: KostRequest[];
  conversations: Conversation[];
  messages: Message[];
  currentUserId?: string;
};
