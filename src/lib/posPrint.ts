import { calcTotals, type CartItem, calcItemTax, itemBasePrice, itemBasePriceRaw } from "@/constants/data";
import { Customer } from "@/features/customers/types/customers.types";
import { InvoiceData, printInvoice } from "@/components/pos/orders/printInvoice";
import { BonData, printPreparationBon } from "@/components/pos/orders/printPreparationBon";
import formatDate from "@/lib/formatDate";
import { BranchInfo } from "@/features/EmployeeBranches/hooks/useBranch";

type Discount = { type: "pct" | "flat"; value: number };

export type PrintOrderInvoiceParams = {
  cart: CartItem[];
  discount: Discount;
  selectedCustomer: Customer | null;
  orderNote: string;
  branch: BranchInfo | null;
  paidAmount: number;
  qrCode: string;
  orderNumber: string;
};

export type PrintKitchenBonParams = {
  cart: CartItem[];
  originalItems: CartItem[];
  selectedCustomer: Customer | null;
};

export async function printOrderInvoice({ cart, discount, selectedCustomer, orderNote, branch, paidAmount, qrCode }: PrintOrderInvoiceParams): Promise<void> {
  const hasItemDiscounts = cart.some((item) => item.itemDiscount && item.itemDiscount.value > 0);
  const totals = calcTotals(cart, hasItemDiscounts ? { type: "pct", value: 0 } : discount);

  const discountAmount = hasItemDiscounts
    ? cart.reduce((acc, item) => {
        const raw = itemBasePriceRaw(item);
        const afterDisc = itemBasePrice(item);
        return acc + (raw - afterDisc);
      }, 0)
    : totals.discountAmount;

  await printInvoice({
    branch,
    invoiceNumber: `—`,
    customer: selectedCustomer,
    invoiceDate: formatDate(new Date()),
    items: cart.map((item) => {
      const base = itemBasePrice(item);
      const tax = calcItemTax(item);
      return {
        productName: item.name,
        quantity: item.qty,
        unitPrice: Number(base.toFixed(2)),
        taxAmount: Number(tax.toFixed(2)),
        total: Number((base + tax).toFixed(2)),
      };
    }),
    subTotal: Number(totals.sub.toFixed(2)),
    discountAmount: Number(discountAmount),
    taxAmount: totals.originalTax,
    grandTotal: totals.total,
    notes: orderNote,
    paidAmount: paidAmount,
    qrCode: qrCode,
  });
}

export async function PrintKitchenBon({ cart, originalItems, selectedCustomer }: PrintKitchenBonParams): Promise<void> {
  const currentItems = cart.filter((c) => c.qty > 0);

  const hasRemoved = originalItems.some((orig) => {
    const current = cart.find((c) => c.productId === orig.productId);
    const currentQty = current?.qty ?? 0;
    return currentQty < orig.qty;
  });

  const addedItems = currentItems
    .filter((c) => {
      const original = originalItems.find((o) => o.productId === c.productId);
      const addedQty = original ? c.qty - original.qty : c.qty;
      return addedQty > 0;
    })
    .map((c) => {
      const original = originalItems.find((o) => o.productId === c.productId);
      const addedQty = original ? c.qty - original.qty : c.qty;
      return { ...c, qty: addedQty };
    });

  const hasAdded = addedItems.length > 0;

  if (!hasAdded && !hasRemoved) return;

  if (hasRemoved) {
    await printPreparationBon({
      institutionName: "بون تعديل",
      invoiceNumber: "-",
      invoiceDate: formatDate(new Date()),
      customerName: selectedCustomer?.customerName,
      items: currentItems.map((c) => ({
        productName: c.name ?? "",
        quantity: c.qty,
      })),
    });
    return;
  }

  await printPreparationBon({
    institutionName: "بون التحضير",
    invoiceNumber: "-",
    invoiceDate: formatDate(new Date()),
    customerName: selectedCustomer?.customerName,
    items: addedItems.map((c) => ({
      productName: c.name ?? "",
      quantity: c.qty,
    })),
  });
}
