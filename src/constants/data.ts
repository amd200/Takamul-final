// ─── NAVIGATION ──────────────────────────────────────────────────────────────
import { Home, LayoutGrid, ClipboardList, ShoppingCart, Store } from "lucide-react";

export const NAV_ITEMS = [
  { id: "main-home", icon: Home, label: "Home", isNav: true },
  { id: "home", icon: ShoppingCart, label: "Sales" },
  { id: "tables", icon: LayoutGrid, label: "Tables" },
  { id: "orders", icon: ClipboardList, label: "Orders" },
];

// ─── MENU DATA ────────────────────────────────────────────────────────────────

export const TABLES_LIST = ["T-01", "T-02", "T-03", "T-04", "T-05", "T-06", "T-07", "T-08"];
export const DELIVERY_COMPANIES = ["Talabat", "Careem", "Noon Food", "Deliveroo"];

// ─── TYPES ────────────────────────────────────────────────────────────────────
export type OrderType = "Delivery" | "InDine" | "TakeAway";
export type NetworkSpeed = "slow" | "medium" | "fast";
export type Screen = "home" | "customers" | "tables" | "cashier" | "orders" | "reports" | "settings" | "success" | "hold-list";

export interface CartExtra {
  name: string;
  nameEn?: string;
  nameUr?: string;
  id: number;
}

export interface CartItem {
  productId?: number;
  name?: string;
  productNameEn?: string;
  productNameUr?: string;
  price: number;
  qty: number;
  note?: string;
  taxamount: number;
  itemDiscount?: { type: "pct" | "flat"; value: number } | null;
  taxCalculation: number;
  taxPercentage?: number;
  extras?: CartExtra[];
  isNew?: boolean;
  taxId?: number;
  unitId?: number;
}

export interface HeldCart {
  note: string;
  items: CartItem[];
  total: number;
  time: string;
}

export function itemUnitPriceRaw(item: Omit<CartItem, "name" | "op" | "productId" | "note">): number {
  const unitPrice = item.price;
  const taxValue = item.taxamount ?? 0;
  if (item.taxCalculation === 2 || item.taxCalculation === 3) return unitPrice - taxValue;
  return unitPrice;
}
// ─── HELPERS ─────────────────────────────────────────────────────────────────
// بترجع السعر قبل الضريبة
export function itemBasePriceRaw(item: Omit<CartItem, "name" | "op" | "productId" | "note">): number {
  const base = item.price * item.qty;
  return base;
}

// بترجع السعر بعد الخصم
export function itemBasePrice(item: Omit<CartItem, "name" | "op" | "productId" | "note">): number {
  const baseBeforeTax = itemBasePriceRaw(item);

  if (item.itemDiscount) {
    const disc = item.itemDiscount.type === "pct" ? baseBeforeTax * (item.itemDiscount.value / 100) : item.itemDiscount.value;
    return Math.max(0, baseBeforeTax - disc);
  }
  return baseBeforeTax;
}

export function calcItemTax(item: CartItem): number {
  if (!item.taxCalculation || item.taxCalculation === 1) return 0;

  if (item.taxCalculation === 2 || item.taxCalculation === 3) {
    return item.taxamount * item.qty;
  }

  return 0;
}

export const format = (n) =>
  new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);

export function itemTotal(item: CartItem): number {
  return itemBasePrice(item) + calcItemTax(item);
}

export function calcTotals(cart: CartItem[], discount: { type: "pct" | "flat"; value: number }) {
  const sub = cart.reduce((s, item) => s + itemBasePrice(item), 0);
  const originalTax = cart.reduce((s, item) => s + calcItemTax(item), 0);
  const itemDiscountsTotal = cart.reduce((s, item) => s + (itemBasePriceRaw(item) - itemBasePrice(item)), 0);

  const discountAmount = discount.type === "flat" ? discount.value : (sub * discount.value) / 100;

  const subAfterDiscount = Math.max(0, sub - discountAmount);
  const discountRatio = sub > 0 ? discountAmount / sub : 0;

  const tax = cart.reduce((s, item) => {
    return s + (Number(item.taxamount) || 0) * item.qty * (1 - discountRatio);
  }, 0);

  const total = Number((subAfterDiscount + tax).toFixed(2));

  return {
    sub,
    subAfterDiscount,
    tax,
    total,
    originalTax,
    itemDiscountsTotal,
    discountAmount,
  };
}
