export type PaymentMethod = "card" | "upi" | "cod";

export type PaymentStatus =
  | "pending"
  | "authorized"
  | "paid"
  | "cod_pending"
  | "failed"
  | "refunded";

export type OrderStatus =
  | "pending_payment"
  | "payment_failed"
  | "paid"
  | "cod_confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface OrderItem {
  slug: string;
  name: string;
  size: string;
  color: string;
  image: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  zipCode: string;
  email: string;
  phone: string;
}

export interface PaymentSnapshot {
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  currency: "INR";
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
}

export interface TrackingEvent {
  status: OrderStatus;
  label: string;
  at: string;
  note?: string;
}

export interface ShipmentInfo {
  carrier: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  events: TrackingEvent[];
}

export interface Order {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  subtotal: number;
  shipping: number;
  total: number;
  currency: "INR";
  status: OrderStatus;
  payment: PaymentSnapshot;
  shipment: ShipmentInfo;
  statusHistory: TrackingEvent[];
}

export interface CreateOrderPayload {
  items: Array<{
    slug: string;
    size: string;
    color: string;
    quantity: number;
  }>;
  shippingAddress: ShippingAddress;
}
