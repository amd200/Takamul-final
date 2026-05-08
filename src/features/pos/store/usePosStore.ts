// ─── usePosStore.ts ───────────────────────────────────────────────────────────
import { create } from "zustand";
import { calcTotals, type CartItem, type Screen, type OrderType, type NetworkSpeed, itemBasePrice, calcItemTax, itemBasePriceRaw } from "@/constants/data";
import { Customer } from "@/features/customers/types/customers.types";
import { InvoiceData, printInvoice } from "@/components/pos/orders/printInvoice";
import { BonData, printPreparationBon } from "@/components/pos/orders/printPreparationBon";
import formatDate from "@/lib/formatDate";
import { CreateSalesOrder } from "@/features/sales/types/sales.types";
import { Product } from "@/features/products/types/products.types";
import { useBranchStore } from "@/store/employeeStore";
import { BranchInfo } from "@/features/EmployeeBranches/hooks/useBranch";
import { PrintKitchenBon, printOrderInvoice } from "@/lib/posPrint";
import { CreateDeliveryOrder, CreateTakeawayOrder, TakeawayOrdeResponse } from "../types/pos.types";
import { GenereateQRRequest, GenereateQRResponse } from "@/features/zatcaInvoice/types/zarchaInvoices.types";

export type DineInMode = "new-order" | "add-items" | "checkout" | null;

export const INSTITUTION_NAME = "اسم المؤسسة";
export const INSTITUTION_TAX_NO = "310XXXXXXXXX";
export const INSTITUTION_ADDRESS = "عنوان المؤسسة";
export const INSTITUTION_PHONE = "05XXXXXXXX";
export const INSTITUTION_NOTES = "";
export const LOGO_URL: string | undefined = undefined;

export type AddToCartProduct = Pick<Product, "id" | "productNameAr" | "productNameEn" | "productNameUr" | "sellingPrice" | "taxAmount" | "taxCalculation" | "taxPercentage">;
interface PosState {
  screen: Screen;
  setScreen: (s: Screen) => void;

  originalItems: CartItem[];
  setOriginalItems: (items: CartItem[]) => void;

  cart: CartItem[];

  setCart: (cart: CartItem[] | ((prev: CartItem[]) => CartItem[])) => void;
  addToCart: (item: CartItem) => void;
  discount: { type: "pct" | "flat"; value: number };
  setDiscount: (d: { type: "pct" | "flat"; value: number }) => void;

  orderType: OrderType;
  setOrderType: (t: OrderType) => void;

  selectedTable: number | null;
  setSelectedTable: (t: number | null) => void;

  selectedDelivery: string | null;
  setSelectedDelivery: (d: string | null) => void;

  selectedCustomer: Customer | null;
  setSelectedCustomer: (c: Customer | null) => void;

  selectedGiftCardId: number | null;
  setSelectedGiftCardId: (g: number | null) => void;

  selectedVaultId: number | null;
  setSelectedVaultId: (id: number | null) => void;

  paidAmount: number;
  setPaidAmount: (a: number) => void;

  networkSpeed: NetworkSpeed;
  setNetworkSpeed: (s: NetworkSpeed) => void;

  dineInMode: DineInMode;
  setDineInMode: (m: DineInMode) => void;

  selectedOrderId: number | null;
  setSelectedOrderId: (id: number | null) => void;

  holdingOrderId: number | null;
  setHoldingOrderId: (id: number | null) => void;

  search: string;
  setSearch: (s: string) => void;

  selectedItemIdx: number | null;
  setSelectedItemIdx: (idx: number | null) => void;

  orderNote: string;
  setOrderNote: (note: string) => void;

  resetCart: (customers?: { items: Customer[] }) => void;

  handleReleaseHoldingOrder: (
    payments: CreateSalesOrder["payments"],
    deps: {
      releaseHolding: (p: any) => Promise<any>;
      customers?: { items: Customer[] };
      generateQR: (data: GenereateQRRequest) => Promise<GenereateQRResponse>;
      nextOrderNumber: string;
    },
  ) => Promise<void>;

  handleCreateDineInOrder: (deps: { createDineInOrderyOrder: (p: any) => Promise<any>; customers: { items: Customer[] } }) => Promise<void>;

  handleAddItemsToExistingOrder: (deps: { addItemsToOrder: (p: any) => Promise<any>; customers?: { items: Customer[] } }) => Promise<void>;

  handleConfirmPayment: (params: { shouldPrintKitchenBon?: boolean; shouldPrintInvoice?: boolean; isHolding?: boolean; payments?: { amount: number; treasuryId: number; notes: string }[]; createTakwayOrder: (p: CreateTakeawayOrder) => Promise<TakeawayOrdeResponse>; createDeliveryOrder: (p: any) => Promise<any>; checkoutDineInOrder: (p: any) => Promise<any>; releaseHolding: (p: any) => Promise<any>; customers?: { items: Customer[] }; generateQR: (data: GenereateQRRequest) => Promise<GenereateQRResponse>; nextOrderNumber: string }) => Promise<void>;
}

export const usePosStore = create<PosState>((set, get) => ({
  screen: "home",
  originalItems: [],
  setOriginalItems: (items) => set({ originalItems: items }),
  setScreen: (screen) => set({ screen }),
  cart: [],
  setCart: (cart) =>
    set((state) => ({
      cart: typeof cart === "function" ? cart(state.cart) : cart,
    })),

  discount: { type: "pct", value: 0 },
  setDiscount: (discount) => set({ discount }),

  orderType: "TakeAway",
  setOrderType: (orderType) => set({ orderType }),

  selectedTable: null,
  setSelectedTable: (selectedTable) => set({ selectedTable }),

  selectedDelivery: null,
  setSelectedDelivery: (selectedDelivery) => set({ selectedDelivery }),

  selectedCustomer: null,
  setSelectedCustomer: (selectedCustomer) => set({ selectedCustomer }),

  selectedGiftCardId: null,
  setSelectedGiftCardId: (selectedGiftCardId) => set({ selectedGiftCardId }),

  selectedVaultId: null,
  setSelectedVaultId: (selectedVaultId) => set({ selectedVaultId }),

  paidAmount: 0,
  setPaidAmount: (paidAmount) => set({ paidAmount }),

  networkSpeed: "fast",
  setNetworkSpeed: (networkSpeed) => set({ networkSpeed }),

  dineInMode: null,
  setDineInMode: (dineInMode) => set({ dineInMode }),

  selectedOrderId: null,
  setSelectedOrderId: (selectedOrderId) => set({ selectedOrderId }),

  holdingOrderId: null,
  setHoldingOrderId: (holdingOrderId) => set({ holdingOrderId }),

  search: "",
  setSearch: (search) => set({ search }),

  selectedItemIdx: null,
  setSelectedItemIdx: (selectedItemIdx) => set({ selectedItemIdx }),

  orderNote: "",
  setOrderNote: (orderNote) => set({ orderNote }),

  addToCart: (product) =>
    set((state) => {
      const existing = state.cart.find((i) => i.productId === product.productId);

      if (existing) {
        return {
          cart: state.cart.map((i) => (i.productId === product.productId ? { ...i, qty: i.qty + 1, isNew: true } : i)),
        };
      }

      return {
        cart: [...state.cart, { ...product, isNew: true }],
      };
    }),

  resetCart: (customers) => {
    set({
      cart: [],
      holdingOrderId: null,
      discount: { type: "pct", value: 0 },
      selectedGiftCardId: null,
      originalItems: [],
      screen: "home",
      orderNote: "",
      selectedOrderId: null,
      selectedCustomer: customers?.items?.[0] ?? null,
    });
  },

  handleReleaseHoldingOrder: async (payments, { releaseHolding, customers, generateQR, nextOrderNumber }) => {
    const { holdingOrderId, resetCart, cart, selectedCustomer, discount, orderNote, paidAmount } = get();
    const branch = useBranchStore.getState().branch;
    if (!holdingOrderId) return;

    try {
      // res = await releaseHolding({ id: holdingOrderId, data: payments });
      // let qrCode: string | undefined;
      // if (invoiceId) {
      //   const qrRes = await generateQR({ invoiceId: invoiceId });
      //   qrCode = qrRes.qrCode;
      // }
      await printOrderInvoice({ cart, discount, selectedCustomer, orderNote, branch, paidAmount, orderNumber: nextOrderNumber, qrCode: "" });
      resetCart(customers);
    } catch {}
  },

  handleCreateDineInOrder: async ({ createDineInOrderyOrder, customers }) => {
    const { cart, selectedCustomer, discount, selectedGiftCardId, selectedTable, orderNote, resetCart, paidAmount, originalItems } = get();
    const branch = useBranchStore.getState().branch;
    const payload = {
      customerId: selectedCustomer?.id,
      warehouseId: 1,
      notes: orderNote,
      globalDiscountValue: discount.type == "flat" ? discount?.value : 0,
      globalDiscountPercentage: discount.type == "pct" ? discount?.value : 0,
      giftCardId: selectedGiftCardId,
      additionIds: cart.flatMap((c) => (c.extras ?? []).map((e) => e.id!)).filter(Boolean),
      tableId: Number(selectedTable),
      items: cart.map((c) => ({
        productId: c.productId,
        quantity: c.qty,
        discountValue: c.itemDiscount?.type === "flat" ? c.itemDiscount.value : 0,
        discountPercentage: c.itemDiscount?.type === "pct" ? c.itemDiscount.value : 0,
      })),
    };

    try {
      await createDineInOrderyOrder(payload);
      await PrintKitchenBon({ cart, originalItems, selectedCustomer });
      resetCart(customers);
    } catch {}
  },

  handleAddItemsToExistingOrder: async ({ addItemsToOrder, customers }) => {
    const { cart, selectedCustomer, originalItems, selectedOrderId, resetCart, orderNote } = get();
    const orderId = selectedOrderId;

    const payload = {
      orderId,
      items: cart.map((c) => ({
        productId: c.productId,
        quantity: c.qty,
        discountValue: c.itemDiscount?.type === "flat" ? c.itemDiscount.value : 0,
        discountPercentage: c.itemDiscount?.type === "pct" ? c.itemDiscount.value : 0,
      })),
      additionIds: cart.flatMap((c) => (c.extras ?? []).map((e) => e.id!)).filter(Boolean),
      notes: orderNote,
    };

    try {
      await addItemsToOrder({ data: payload, id: orderId });
      await PrintKitchenBon({ cart, originalItems, selectedCustomer });
      resetCart(customers);
    } catch {}
  },

  handleConfirmPayment: async ({ shouldPrintKitchenBon = true, shouldPrintInvoice = true, isHolding = false, payments: externalPayments, createTakwayOrder, createDeliveryOrder, checkoutDineInOrder, releaseHolding, customers, generateQR, nextOrderNumber }) => {
    const { cart, discount, selectedCustomer, selectedGiftCardId, selectedTable, selectedVaultId, paidAmount, orderType, holdingOrderId, orderNote, handleReleaseHoldingOrder, resetCart, originalItems, dineInMode, selectedDelivery } = get();
    const branch = useBranchStore.getState().branch;

    const payments: CreateSalesOrder["payments"] = isHolding
      ? []
      : (externalPayments?.map((p) => ({
          amount: p.amount,
          treasuryId: p.treasuryId,
          notes: p.notes,
          paymentMethod: "Cash",
        })) ?? [
          {
            amount: paidAmount,
            paymentMethod: "Cash",
            treasuryId: selectedVaultId!,
            notes: "",
          },
        ]);

    const basePayload = {
      customerId: selectedCustomer?.id,
      warehouseId: 1,
      notes: orderNote,
      globalDiscountValue: discount.type === "flat" ? discount.value : 0,
      globalDiscountPercentage: discount.type === "pct" ? discount.value : 0,
      giftCardId: selectedGiftCardId,
      additionIds: cart.flatMap((c) => (c.extras ?? []).map((e) => e.id!)).filter(Boolean),
      items: cart.map((cat) => {
        const beforeTax = cat.taxCalculation === 1 ? cat.price : cat.price / (1 + cat.taxPercentage / 100);
        return {
          productId: cat?.productId,
          quantity: cat?.qty,
          discountValue: cat?.itemDiscount?.type === "flat" ? cat?.itemDiscount?.value : 0,
          discountPercentage: cat?.itemDiscount?.type === "pct" ? cat?.itemDiscount?.value : 0,
          unitPrice: beforeTax,
        };
      }),
      payments,
      isHolding,
      holdingOrderId: holdingOrderId ? holdingOrderId : 0,
    };

    try {
      let invoiceId: number | null = null;

      if (orderType === "TakeAway" || orderType === "Delivery") {
        if (holdingOrderId && !isHolding) {
          await handleReleaseHoldingOrder(payments, { releaseHolding, customers, generateQR, nextOrderNumber });
          return;
        }
        if (orderType === "TakeAway") {
          const res = await createTakwayOrder(basePayload);
          invoiceId = res?.data?.id ?? null;
        } else {
          const delvierypaLoad: CreateDeliveryOrder = { ...basePayload, deliveryCompanyId: Number(selectedDelivery) };
          const res = await createDeliveryOrder(delvierypaLoad);
          invoiceId = res?.data?.id ?? null;
        }
      } else if (orderType === "InDine") {
        const res = await checkoutDineInOrder({
          tableId: Number(selectedTable),
          globalDiscountValue: discount.type === "flat" ? discount.value : 0,
          globalDiscountPercentage: discount.type === "pct" ? discount.value : 0,
          giftCardId: selectedGiftCardId,
          payments: isHolding ? [] : [{ amount: paidAmount, treasuryId: selectedVaultId!, notes: "" }],
        });
        invoiceId = res?.data?.id ?? null;
        set({ dineInMode: null });
      }

      if (!isHolding) {
        let qrCode: string | undefined;
        if (invoiceId) {
          const qrRes = await generateQR({ invoiceId: invoiceId });
          qrCode = qrRes.qrCode;
        }

        if (shouldPrintInvoice) {
          await printOrderInvoice({
            cart,
            discount,
            selectedCustomer,
            orderNote,
            branch,
            paidAmount,
            qrCode,
            orderNumber: nextOrderNumber,
          });
        }

        if (dineInMode === "add-items") {
          await PrintKitchenBon({ cart, originalItems, selectedCustomer });
        }

        if (shouldPrintKitchenBon && orderType !== "InDine") {
          await PrintKitchenBon({ cart, originalItems: [], selectedCustomer });
        }
      }

      resetCart(customers);
    } catch {}
  },
}));
