import type { FoodMerchant } from "@/lib/models";

export function calculateMockShipping(distanceMeters: number) {
  return Math.max(1, Math.ceil(Math.max(0, distanceMeters) / 500)) * 3000;
}

export function getFoodFees(merchant: FoodMerchant, itemsSubtotal: number) {
  return {
    subtotal: itemsSubtotal,
    distanceMeters: merchant.mockRouteDistanceMeters ?? 1000,
    shippingFee: calculateMockShipping(merchant.mockRouteDistanceMeters ?? 1000),
    serviceFee: merchant.serviceFee ?? 0,
    otherFees: merchant.otherFees ?? 0,
  };
}

export function getOrderTotal(parts: { subtotal: number; shippingFee?: number; serviceFee: number; otherFees: number }) {
  return parts.subtotal + (parts.shippingFee ?? 0) + parts.serviceFee + parts.otherFees;
}
