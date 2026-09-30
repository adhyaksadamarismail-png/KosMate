import { Droplets, ShoppingBasket, CookingPot, Brush, Wrench, Package, Boxes, Home, Laptop, Luggage, MessageCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ServiceIconKind } from "@/lib/models";

const serviceIcons: Record<ServiceIconKind, LucideIcon> = {
  water: Droplets,
  basket: ShoppingBasket,
  food: CookingPot,
  cleaning: Brush,
  repair: Wrench,
  package: Package,
  moving: Boxes,
  home: Home,
  tech: Laptop,
  luggage: Luggage,
  chat: MessageCircle,
};

export function ServiceIcon({ kind, className = "" }: { kind: ServiceIconKind; className?: string }) {
  const Icon = serviceIcons[kind];
  return <Icon className={className} strokeWidth={1.7} aria-hidden="true" />;
}
