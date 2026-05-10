import type { ApiResponse, PaginationMeta } from "@/types";

export interface OrderItem {
  id: number;
  productId: number;
  productCode: string;
  productName: string;
  productNameEn: string;
  productNameUr: string;
  unitId: number;
  quantity: number;
  unitPrice: number;
  priceBeforeTax: number;
  taxPercentage: number;
  taxAmount: number;
  taxAmountProduct: number;
  discountPercentage: number;
  discountValue: number;
  sellingPrice: number;
  lineTotal: number;
  taxCalculation: number;
  priceAfterTax: number;
}

export interface OrderPayment {
  id: number;
  paymentNumber: number;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  notes: string;
}

export interface SalesOrder {
  id: number;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerId: number;
  createdBy: string;
  orderDate: string;
  orderType: "Delivery" | "TakeAway" | "InDine";
  tableId: number;
  warehouseName: string;
  subTotal: number;
  taxAmount: number;
  discountAmount: number;
  grandTotal: number;
  orderStatus: "Confirmed" | "UnConfirmed" | "InProgress" | "Cancelled";
  paymentStatus: string;
  zatcaStatus: "NotSendYet" | "Sent" | "Rejected";
  zatcaResponse: string;
  notes: string;
  items: OrderItem[];
  payments: OrderPayment[];
  isHolding: boolean;
  holdingOrderId: number;
}

export type UploadFileResponse = ApiResponse<{
  url: string;
}>;

export type CreateSalesOrder = {
  customerId: number;
  warehouseId: number;
  notes: string;
  description: string;
  globalDiscountPercentage: number;
  globalDiscountValue: number;
  items: {
    productId: number;
    quantity: number;
    discountPercentage: number;
    discountValue: number;
  }[];
  payments: {
    amount: number;
    paymentMethod: string;
    treasuryId: number;
    notes: string;
  }[];
};

export interface GetAllSalesOrderResponse extends PaginationMeta {
  items: SalesOrder[];
}
