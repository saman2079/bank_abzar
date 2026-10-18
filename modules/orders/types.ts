import type { AddressSnapshot } from "./schemas";
import type { OrderStatus } from "./constants";

export type OrderListItem = {
  id: string;
  number: number;
  status: OrderStatus;
  total: number;
  itemCount: number;
  createdAt: Date;
};

export type OrderDetail = {
  id: string;
  number: number;
  status: OrderStatus;
  subtotal: number;
  shippingCost: number;
  discount: number;
  total: number;
  note: string | null;
  expiresAt: Date | null;
  createdAt: Date;
  address: AddressSnapshot | null;
  items: { id: string; name: string; sku: string; unitPrice: number; quantity: number }[];
  history: { id: string; to: OrderStatus; note: string | null; createdAt: Date }[];
  /// آخرین پرداخت موفق (اگر باشد)
  payment: { refId: string | null; paidAt: Date | null; needsRefund: boolean } | null;
};
