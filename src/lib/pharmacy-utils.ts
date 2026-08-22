import type { Medicine } from "./pharmacy-types";

export const GST_RATE = 0.05;
export const EXPIRY_WARNING_DAYS = 90;

export const round2 = (n: number) => Math.round(n * 100) / 100;

export function formatINR(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

export function toLocalISODate(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export function formatDate(dateStr: string): string {
  const d = dateStr.includes("T") ? new Date(dateStr) : parseLocalDate(dateStr);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function isSameLocalDay(iso: string, ref: Date = new Date()): boolean {
  const d = new Date(iso);
  return (
    d.getFullYear() === ref.getFullYear() &&
    d.getMonth() === ref.getMonth() &&
    d.getDate() === ref.getDate()
  );
}

export function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = parseLocalDate(dateStr);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export type ExpiryStatus = "expired" | "expiring" | "ok";

export function getExpiryStatus(medicine: Medicine): ExpiryStatus {
  const days = daysUntil(medicine.expiryDate);
  if (days < 0) return "expired";
  if (days <= EXPIRY_WARNING_DAYS) return "expiring";
  return "ok";
}

export function isOutOfStock(medicine: Medicine): boolean {
  return medicine.stock <= 0;
}

export function isLowStock(medicine: Medicine): boolean {
  return medicine.stock > 0 && medicine.stock <= medicine.reorderLevel;
}

export function computeTotals(
  items: Array<{ quantity: number; unitPrice: number }>,
  discountPercent: number,
) {
  const subtotal = round2(
    items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),
  );
  const discountAmount = round2((subtotal * discountPercent) / 100);
  const taxable = subtotal - discountAmount;
  const taxAmount = round2(taxable * GST_RATE);
  const total = round2(taxable + taxAmount);
  return { subtotal, discountAmount, taxAmount, total };
}
