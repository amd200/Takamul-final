import { create } from "zustand";
import { type CartItem, calcTotals } from "@/constants/data";
import { Supplier } from "@/features/suppliers/types/suppliers.types";
import { useBranchStore } from "@/store/employeeStore";
import { CreatePurchaseOrder } from "@/features/purchases/types/purchase.types";

interface PurchaseState {
  cart: CartItem[];
  setCart: (cart: CartItem[] | ((prev: CartItem[]) => CartItem[])) => void;
  addToCart: (item: CartItem) => void;
  discount: { type: "pct" | "flat"; value: number };
  setDiscount: (d: { type: "pct" | "flat"; value: number }) => void;
  
  selectedSupplier: Supplier | null;
  setSelectedSupplier: (s: Supplier | null) => void;

  selectedVaultId: number | null;
  setSelectedVaultId: (id: number | null) => void;

  paidAmount: number;
  setPaidAmount: (a: number) => void;

  orderNote: string;
  setOrderNote: (note: string) => void;

  resetCart: () => void;

  handleConfirmPurchase: (params: {
    payments?: { amount: number; treasuryId: number; notes: string }[];
    createPurchaseOrder: (p: CreatePurchaseOrder) => Promise<any>;
    warehouseId: number;
  }) => Promise<any>;
}

export const usePurchaseStore = create<PurchaseState>((set, get) => ({
  cart: [],
  setCart: (cart) =>
    set((state) => ({
      cart: typeof cart === "function" ? cart(state.cart) : cart,
    })),

  discount: { type: "pct", value: 0 },
  setDiscount: (discount) => set({ discount }),

  selectedSupplier: null,
  setSelectedSupplier: (selectedSupplier) => set({ selectedSupplier }),

  selectedVaultId: null,
  setSelectedVaultId: (selectedVaultId) => set({ selectedVaultId }),

  paidAmount: 0,
  setPaidAmount: (paidAmount) => set({ paidAmount }),

  orderNote: "",
  setOrderNote: (orderNote) => set({ orderNote }),

  addToCart: (product) =>
    set((state) => {
      const existing = state.cart.find((i) => i.productId === product.productId);

      if (existing) {
        return {
          cart: state.cart.map((i) => (i.productId === product.productId ? { ...i, qty: i.qty + 1 } : i)),
        };
      }

      return {
        cart: [...state.cart, { ...product, isNew: true }],
      };
    }),

  resetCart: () => {
    set({
      cart: [],
      discount: { type: "pct", value: 0 },
      orderNote: "",
      paidAmount: 0,
    });
  },

  handleConfirmPurchase: async ({ payments: externalPayments, createPurchaseOrder, warehouseId }) => {
    const { cart, discount, selectedSupplier, selectedVaultId, paidAmount, orderNote, resetCart } = get();

    const payments = externalPayments?.map((p) => ({
      amount: p.amount,
      treasuryId: p.treasuryId,
      notes: (p.notes || "") as "",
    })) ?? [
      {
        amount: paidAmount,
        treasuryId: selectedVaultId!,
        notes: "" as "",
      },
    ];

    const payload: CreatePurchaseOrder = {
      supplierId: selectedSupplier?.id || 0,
      warehouseId: warehouseId || 1,
      notes: orderNote,
      orderDate: new Date().toISOString(),
      items: cart.map((c) => ({
        productId: c.productId!,
        quantity: c.qty,
        discountValue: c.itemDiscount?.type === "flat" ? c.itemDiscount.value : 0,
        discountPercentage: c.itemDiscount?.type === "pct" ? c.itemDiscount.value : 0,
        unitPrice: c.price,
        taxId: c.taxId || 1, 
        unitId: c.unitId || 1, 
      })),
      payments,
    };

    try {
      const res = await createPurchaseOrder(payload);
      resetCart();
      return res;
    } catch (error) {
      console.error("Purchase error:", error);
      throw error;
    }
  },
}));
