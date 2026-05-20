import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string | { toNumber: () => number }): string {
  const value =
    typeof amount === "object" && "toNumber" in amount
      ? amount.toNumber()
      : Number(amount);
  return new Intl.NumberFormat("en-GM", {
    style: "currency",
    currency: "GMD",
    minimumFractionDigits: 2,
  }).format(value);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-GM", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat("en-GM", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  packed: "Packed",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  packed: "bg-purple-100 text-purple-800",
  out_for_delivery: "bg-orange-100 text-orange-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export const COMPLAINT_TYPE_LABELS: Record<string, string> = {
  wrong_item: "Wrong Item",
  damaged_item: "Damaged Item",
  missing_item: "Missing Item",
  delayed_delivery: "Delayed Delivery",
  billing_issue: "Billing Issue",
  other: "Other",
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "Cash",
  mobile_money: "Mobile Money",
  bank_transfer: "Bank Transfer",
};

export const LOW_STOCK_THRESHOLD = 10;
export const CATALOG_PAGE_SIZE = 12;
