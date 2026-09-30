import type { LocalData, ServiceOrder } from "@/lib/models";
import { getSupabaseClient } from "@/lib/supabase/client";

const changed = <T extends { id: string }>(oldRows: T[], nextRows: T[]) => nextRows.filter((row) => JSON.stringify(oldRows.find((item) => item.id === row.id)) !== JSON.stringify(row));
const uuid = (value: string | undefined) => value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value) ? value : null;

export async function persistLocalChanges(before: LocalData, next: LocalData) {
  const db = getSupabaseClient(); if (!db) return;
  const { data: auth } = await db.auth.getUser(); const profileId = auth.user?.id; if (!profileId) return;
  const catalogJobs: PromiseLike<unknown>[] = [];
  for (const account of changed(before.accounts, next.accounts)) if (account.id === profileId) catalogJobs.push(db.from("profiles").update({ name: account.name, phone: account.phone ?? null }).eq("id", profileId));
  const changedKosts = next.kosts.filter((row) => JSON.stringify(before.kosts.find((item) => item.slug === row.slug)) !== JSON.stringify(row));
  for (const kost of changedKosts) if (kost.ownerId === profileId) {
    const coordinate = kost.mockCoordinate;
    const kostId = `kost-${kost.slug}`;
    catalogJobs.push(db.from("kosts").upsert({ id: kostId, slug: kost.slug, owner_id: profileId, name: kost.name, type: kost.tags?.[0] ?? "Campur", price: kost.price, address: kost.address ?? kost.location, city: "Bandung", area: kost.area, latitude: coordinate?.latitude ?? null, longitude: coordinate?.longitude ?? null, description: kost.description, rules: kost.rules ?? [], facilities: kost.amenities ?? kost.facilities, photos: kost.photos ?? [], main_photo: kost.photos?.find((photo) => photo.isPrimary)?.url ?? kost.image, rating: kost.rating, review_count: kost.reviews, verified: kost.verified, active: kost.active !== false }));
    for (const room of kost.roomTypes ?? []) catalogJobs.push(db.from("kost_rooms").upsert({ id: room.id, kost_id: kostId, name: room.name, room_type: kost.tags?.[0] ?? "standard", size: room.size, price: room.price, availability: room.availability, facilities: room.facilities }));
  }
  for (const kost of before.kosts.filter((row) => row.ownerId === profileId && !next.kosts.some((item) => item.slug === row.slug))) catalogJobs.push(db.from("kosts").update({ active: false }).eq("slug", kost.slug).eq("owner_id", profileId));
  for (const merchant of changed(before.foodMerchants, next.foodMerchants)) if (merchant.userId === profileId) {
    const account = next.accounts.find((item) => item.id === profileId);
    catalogJobs.push(db.from("merchants").upsert({ id: merchant.id, mitra_id: account?.partnerId ?? merchant.id, slug: merchant.slug, name: merchant.name, description: (merchant as typeof merchant & { description?: string }).description ?? "", address: merchant.location, city: merchant.area || "Bandung", latitude: merchant.mockCoordinate?.latitude ?? null, longitude: merchant.mockCoordinate?.longitude ?? null, rating: merchant.rating, photo: merchant.photo, estimate: merchant.estimate, service_fee: merchant.serviceFee ?? 0, additional_fee: merchant.otherFees ?? 0, is_open: merchant.available, verified: merchant.verified }));
  }
  for (const item of changed(before.foodMenuItems, next.foodMenuItems)) {
    const merchant = next.foodMerchants.find((row) => row.id === item.merchantId); if (merchant?.userId !== profileId) continue;
    catalogJobs.push(db.from("menu_items").upsert({ id: item.id, merchant_id: item.merchantId, name: item.name, description: item.description, price: item.price, image: item.image, is_available: item.available }));
  }
  for (const item of before.foodMenuItems.filter((row) => !next.foodMenuItems.some((nextItem) => nextItem.id === row.id))) {
    const merchant = before.foodMerchants.find((row) => row.id === item.merchantId); if (merchant?.userId === profileId) catalogJobs.push(db.from("menu_items").update({ is_available: false }).eq("id", item.id));
  }
  for (const provider of changed(before.serviceProviders, next.serviceProviders)) if (provider.userId === profileId) {
    const account = next.accounts.find((item) => item.id === profileId);
    catalogJobs.push(db.from("service_providers").upsert({ id: provider.id, mitra_id: account?.partnerId ?? provider.id, name: provider.name, phone: provider.phone ?? null, area: provider.area, service_ids: provider.serviceIds, products: provider.products, verified: provider.verified, active: provider.active }));
  }
  for (const partner of changed(before.partners, next.partners)) if (partner.userId === profileId) catalogJobs.push(db.from("mitras").update({ display_name: partner.displayName }).eq("profile_id", profileId));
  const catalogResults: unknown[] = []; for (const job of catalogJobs) catalogResults.push(await job);
  const orderJobs: PromiseLike<unknown>[] = []; const itemJobs: PromiseLike<unknown>[] = []; const roomJobs: PromiseLike<unknown>[] = []; const messageJobs: PromiseLike<unknown>[] = [];
  for (const order of changed(before.orders, next.orders)) {
    if (order.customerId !== profileId) continue;
    const row = { id: order.id, customer_id: profileId, service_id: order.serviceId, provider_id: order.providerId ?? null, merchant_id: order.merchantId ?? null, status: order.status, pricing_mode: order.pricingMode, pricing_status: order.pricingStatus, subtotal: order.itemsAmount, delivery_fee: order.shippingFee, service_fee: order.serviceFee, additional_fee: order.additionalFee === undefined ? order.otherFees : order.additionalFee, total: order.totalAmount, customer_offer: order.customerOffer ?? null, provider_offer: order.providerOffer ?? null, payment_status: order.paymentStatus, pickup_address: order.pickupLocation ?? null, pickup_latitude: order.pickupCoordinate?.latitude ?? null, pickup_longitude: order.pickupCoordinate?.longitude ?? null, delivery_address: order.deliveryLocation ?? order.address ?? null, delivery_latitude: order.deliveryCoordinate?.latitude ?? null, delivery_longitude: order.deliveryCoordinate?.longitude ?? null, route_distance_meters: order.routeDistanceMeters ?? null, weight_kg: Number(order.details.weightKg) || null, length_cm: Number(order.details.lengthCm) || null, width_cm: Number(order.details.widthCm) || null, height_cm: Number(order.details.heightCm) || null, details: order.details, created_at: order.createdAt, updated_at: order.updatedAt };
    orderJobs.push(db.from("orders").upsert(row));
  }
  for (const item of changed(before.orderItems, next.orderItems)) {
    const order = next.orders.find((row) => row.id === item.orderId); if (order?.customerId !== profileId) continue;
    itemJobs.push(db.from("order_items").upsert({ id: item.id, order_id: item.orderId, item_name: item.name, quantity: item.quantity, price: item.unitAmount, subtotal: item.unitAmount === null ? null : item.unitAmount * item.quantity, details: { service_id: item.serviceId, fee_id: item.feeId, notes: item.notes, image: item.image } }));
  }
  for (const room of changed(before.conversations, next.conversations)) {
    if (room.customerId !== profileId) continue;
    const participant = uuid(room.participantId);
    roomJobs.push(db.from("chat_rooms").upsert({ id: room.id, customer_id: profileId, provider_id: participant, provider_mitra_id: room.participantId && !participant ? room.participantId : null, type: room.kind, service_id: room.serviceId ?? null, kost_id: room.kostSlug ?? null, order_id: room.orderId ?? null, status: room.status, quoted_amount: room.quotedAmount ?? null, service_fee: room.serviceFee ?? null, additional_fee: room.otherFees ?? null, created_at: room.createdAt, updated_at: room.updatedAt }));
  }
  for (const message of changed(before.messages, next.messages)) {
    const room = next.conversations.find((row) => row.id === message.conversationId); if (room?.customerId !== profileId) continue;
    messageJobs.push(db.from("chat_messages").upsert({ id: message.id, room_id: message.conversationId, sender_id: profileId, message: message.body, created_at: message.createdAt }));
  }
  const results = [...catalogResults, ...await Promise.all(orderJobs), ...await Promise.all(itemJobs), ...await Promise.all(roomJobs), ...await Promise.all(messageJobs)];
  const failure = results.find((result) => "error" in (result as object) && (result as { error: unknown }).error);
  if (failure) console.error("Perubahan belum tersinkron ke Supabase", failure);
}

export async function hydrateSupabaseData(seed: LocalData): Promise<LocalData> {
  const db = getSupabaseClient(); if (!db) return seed;
  const { data: auth } = await db.auth.getUser(); const userId = auth.user?.id;
  const requests = await Promise.all([
    db.from("service_categories").select("*").eq("active", true), db.from("services").select("*").eq("active", true),
    db.from("kosts").select("*").eq("active", true), db.from("kost_rooms").select("*"), db.from("merchants").select("*").eq("is_open", true),
    db.from("menu_items").select("*").eq("is_available", true), db.from("service_fees").select("*").eq("active", true), db.from("service_providers").select("*").eq("active", true),
    userId ? db.from("orders").select("*").eq("customer_id", userId).order("created_at", { ascending: false }) : Promise.resolve({ data: [] }),
    userId ? db.from("order_items").select("*,orders!inner(customer_id)").eq("orders.customer_id", userId) : Promise.resolve({ data: [] }),
    userId ? db.from("chat_rooms").select("*").eq("customer_id", userId) : Promise.resolve({ data: [] }),
  ]);
  const [categories, services, kosts, rooms, merchants, menus, fees, providers, orders, orderItems, conversations] = requests.map((result) => result.data ?? []) as [Record<string, unknown>[], Record<string, unknown>[], Record<string, unknown>[], Record<string, unknown>[], Record<string, unknown>[], Record<string, unknown>[], Record<string, unknown>[], Record<string, unknown>[], Record<string, unknown>[], Record<string, unknown>[], Record<string, unknown>[]];
  if (requests.some((item) => "error" in item && item.error)) console.error("Sebagian data Supabase belum dapat dibaca.");
  const map = new Map(rooms.map((room) => [String(room.kost_id), room]));
  const remoteKosts = kosts.map((row) => { const room = map.get(String(row.id)); return { slug: row.slug, name: row.name, location: row.address, address: row.address, area: row.area, price: row.price, rating: Number(row.rating), reviews: row.review_count, image: row.main_photo, tags: [row.type, row.area], facilities: row.facilities ?? [], amenities: row.facilities ?? [], description: row.description, rules: row.rules ?? [], verified: row.verified, active: row.active, ownerId: row.owner_id, mockCoordinate: { latitude: row.latitude, longitude: row.longitude, isMock: true as const }, photos: row.photos ?? [], roomTypes: room ? [{ id: room.id, name: room.name, size: room.size, price: room.price, facilities: room.facilities ?? [], availability: room.availability }] : [] }; });
  const remoteServices = services.map((row) => ({ ...row, categoryId: row.category_id, pricingMode: row.pricing_mode, providerTypes: row.provider_types, mode: row.mode, icon: row.icon, active: row.active })) as LocalData["services"];
  const remoteMerchants = merchants.map((row) => ({ id: row.id, slug: row.slug, name: row.name, photo: row.photo, rating: Number(row.rating), location: row.address, area: row.city, estimate: row.estimate, available: row.is_open, verified: row.verified, menuItemIds: menus.filter((item) => item.merchant_id === row.id).map((item) => String(item.id)), mockCoordinate: { latitude: row.latitude, longitude: row.longitude, address: row.address, isMock: true as const }, serviceFee: row.service_fee, otherFees: row.additional_fee })) as LocalData["foodMerchants"];
  const remoteMenus = menus.map((row) => ({ id: row.id, merchantId: row.merchant_id, name: row.name, description: row.description, image: row.image, price: row.price, available: row.is_available })) as LocalData["foodMenuItems"];
  const remoteProviders = providers.map((row) => ({ id: row.id, name: row.name, phone: row.phone, area: row.area, serviceIds: row.service_ids ?? [], products: row.products ?? [], verified: row.verified, active: row.active })) as LocalData["serviceProviders"];
  const remoteFees = fees.map((row) => ({ id: row.id, serviceId: row.service_id, name: row.name, amount: row.amount, unit: row.unit, pricing: row.pricing, active: row.active, currency: "IDR" as const, updatedBy: "support" as const, updatedAt: row.updated_at })) as LocalData["serviceFees"];
  const remoteOrders = orders.map((row) => ({ id: row.id, customerId: row.customer_id, providerId: row.provider_id, merchantId: row.merchant_id, serviceId: row.service_id, status: row.status, pricingMode: row.pricing_mode, pricingStatus: row.pricing_status, serviceFee: row.service_fee, additionalFee: row.additional_fee, otherFees: 0, shippingFee: row.delivery_fee, routeDistanceMeters: row.route_distance_meters, pickupLocation: row.pickup_address, deliveryLocation: row.delivery_address, address: row.delivery_address, pickupCoordinate: row.pickup_latitude ? { latitude: row.pickup_latitude, longitude: row.pickup_longitude, address: row.pickup_address, isMock: true as const } : undefined, deliveryCoordinate: row.delivery_latitude ? { latitude: row.delivery_latitude, longitude: row.delivery_longitude, address: row.delivery_address, isMock: true as const } : undefined, itemsAmount: row.subtotal, totalAmount: row.total, paymentStatus: row.payment_status, currency: "IDR" as const, details: row.details ?? {}, createdAt: row.created_at, updatedAt: row.updated_at })) as ServiceOrder[];
  const remoteOrderItems = orderItems.map((row) => { const details = (row.details ?? {}) as Record<string, string | undefined>; return { id: String(row.id), orderId: String(row.order_id), serviceId: details.service_id ?? "", name: String(row.item_name), quantity: Number(row.quantity), unitAmount: row.price === null ? null : Number(row.price), feeId: details.fee_id, notes: details.notes, image: details.image }; }) as LocalData["orderItems"];
  const roomIds = conversations.map((row) => row.id);
  const messageResult = userId && roomIds.length ? await db.from("chat_messages").select("*").in("room_id", roomIds).order("created_at") : { data: [] };
  const remoteConversations = conversations.map((row) => ({ id: row.id, kind: row.type, customerId: row.customer_id, participantId: row.provider_id ?? row.provider_mitra_id ?? undefined, serviceId: row.service_id ?? undefined, kostSlug: row.kost_id ?? undefined, orderId: row.order_id ?? undefined, status: row.status, quotedAmount: row.quoted_amount ?? undefined, serviceFee: row.service_fee ?? undefined, otherFees: row.additional_fee ?? undefined, createdAt: row.created_at, updatedAt: row.updated_at })) as LocalData["conversations"];
  const remoteMessages = (messageResult.data ?? []).map((row) => ({ id: row.id, conversationId: row.room_id, senderId: row.sender_id, senderRole: row.sender_id === userId ? "customer" as const : "support" as const, body: row.message, createdAt: row.created_at })) as LocalData["messages"];
  return { ...seed, serviceCategories: categories.map((row) => ({ id: row.id, slug: row.slug, name: row.name, description: row.description, icon: row.icon, active: row.active })) as LocalData["serviceCategories"], services: remoteServices, kosts: remoteKosts as LocalData["kosts"], foodMerchants: remoteMerchants, foodMenuItems: remoteMenus, serviceProviders: remoteProviders, serviceFees: remoteFees, orders: remoteOrders, orderItems: remoteOrderItems, conversations: remoteConversations, messages: remoteMessages };
}
