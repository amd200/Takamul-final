import type { PaginationMeta } from "@/types";

export interface Purchase {
  id: number;
  purchaseOrderNumber: string;
  supplierId: number;
  supplierName: string;
  orderDate: string;
  expectedDeliveryDate: string;
  orderStatus: "UnConfirmed" | "Confirmed";
  totalAmount: number;
  paidAmount: number;
  taxAmount: number;
  warehouseId?: number;
  notes?: string;
  grandTotal: number;
  payments?: {
    amount: number;
    treasuryId: number;
    paidAmount: number;
  }[];
  items: {
    productId: number;
    unitId: number;
    quantity: number;
    unitPrice: number;
    discountValue?: number;
    discountPercentage?: number;
    lineTotal?: number;
    taxId: number;
  }[];
}
export type CreatePurchaseOrder = {
  orderDate: string;
  warehouseId: number;
  supplierId: number;
  notes: string;
  items: {
    productId: number;
    quantity: number;
    discountPercentage: number;
    discountValue: number;
    unitPrice: number;
    taxId: number;
    unitId: number;
  }[];
  payments: {
    amount: number;
    treasuryId: number;
    notes: "";
  }[];
};

export interface GetAllPurchasesResponse extends PaginationMeta {
  items: Purchase[];
}
