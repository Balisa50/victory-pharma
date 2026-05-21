import type {
  User,
  Product,
  Order,
  OrderItem,
  Payment,
  Receipt,
  Review,
  Complaint,
  OrderStatusHistory,
  UserRole,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ComplaintType,
  ComplaintStatus,
} from "@prisma/client";

export type {
  User,
  Product,
  Order,
  OrderItem,
  Payment,
  Receipt,
  Review,
  Complaint,
  OrderStatusHistory,
  UserRole,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ComplaintType,
  ComplaintStatus,
};

export type CartItem = {
  productId: string;
  name: string;
  packLevel: import("@/lib/packaging").PackLevel;
  unitsPerPack: number; // base units in one pack of this level
  pricePerPack: number; // price for one pack
  quantity: number; // number of packs
  maxPacks: number; // packs the current stock can fulfil
};

export type CartState = {
  items: CartItem[];
};

type CartLineRef = { productId: string; packLevel: import("@/lib/packaging").PackLevel };

export type CartAction =
  | { type: "ADD_ITEM"; payload: CartItem }
  | { type: "REMOVE_ITEM"; payload: CartLineRef }
  | { type: "UPDATE_QUANTITY"; payload: CartLineRef & { quantity: number } }
  | { type: "CLEAR_CART" };

export type OrderWithRelations = Order & {
  orderItems: (OrderItem & { product: Product })[];
  payment: Payment | null;
  statusHistory: OrderStatusHistory[];
  review: Review | null;
  complaints: Complaint[];
  receipt: Receipt | null;
  retailPharmacy: Pick<User, "id" | "name" | "pharmacyName" | "phone" | "email">;
};

export type WholesaleDashboardData = {
  totalRevenue: number;
  pendingPayments: number;
  totalOrders: number;
  lowStockCount: number;
  revenueChart: { date: string; revenue: number }[];
  recentOrders: OrderWithRelations[];
  lowStockProducts: Product[];
};

export type RetailDashboardData = {
  activeOrders: OrderWithRelations[];
  orderHistory: OrderWithRelations[];
  totalSpending: number;
  recentReceipts: (Receipt & { order: Order })[];
};

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };
