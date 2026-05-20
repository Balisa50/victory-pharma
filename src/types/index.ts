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
  price: number;
  quantity: number;
  stock: number;
};

export type CartState = {
  items: CartItem[];
};

export type CartAction =
  | { type: "ADD_ITEM"; payload: CartItem }
  | { type: "REMOVE_ITEM"; payload: { productId: string } }
  | { type: "UPDATE_QUANTITY"; payload: { productId: string; quantity: number } }
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
