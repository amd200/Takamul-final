import { CreateSalesOrder, SalesOrder } from "@/features/sales/types/sales.types";
import type { ApiResponse, PaginationMeta } from "@/types";

export interface POSDevice {
  id: number;
  deviceName: string;
  commonName: string;
  serialNumber: string;
  status: "NotRegistered" | "PendingOTP" | "CCSIDRegistered" | "PCSIDRegistered";
  certificateType: string;
  currentICV: number;
  lastPIH: string;
  registrationNumber: string;
  certificateIssuedAt: string;
  certificateExpiresAt: string;
  isCertificateExpired: boolean;
  daysUntilExpiry: number;
  branchName: string | null;
  deviceTypeId: number;
  branchId: number;
  isActive: boolean;
  location: string;
  createdAt: string;
  updatedAt: string;
}

// export interface SalesOrder {
//   id: number;
//   orderNumber: string;
//   customerName: string;
//   warehouseName: string;
//   orderDate: string;
//   subTotal: number;
//   taxAmount: number;
//   discountAmount: number;
//   grandTotal: number;
//   orderStatus: "UnConfirmed" | "Confirmed";
//   items: {
//     productId: number;
//     unitId: number;
//     quantity: number;
//     discountPercentage: number;
//     discountValue: number;
//   }[];
//   payments: {
//     amount: number;
//     paymentMethod: "Cash" | "Visa" | "CreditCard" | "DebitCard" | "BankTransfer" | "Check" | "MobilePayment" | "OnlinePayment" | "Other";
//     notes: string;
//   }[];
// }
export type CreateTakeawayOrder = {
  customerId: number;
  warehouseId: number;
  notes: string;
  globalDiscountPercentage: number;
  globalDiscountValue: number;
  giftCardId: number | null;
  isHolding?: boolean;
  holdingOrderId: number;
  items: {
    productId: number;
    quantity: number;
    discountPercentage: number;
    discountValue: number;
  }[];
  payments: CreateSalesOrder["payments"];
  additionIds: number[];
};
export type TakeawayOrdeResponse = ApiResponse<SalesOrder>;

export type CreateDeliveryOrder = CreateTakeawayOrder & {
  deliveryCompanyId: number;
};
export type CreateDineInOrder = Omit<CreateTakeawayOrder, "giftCardId" | "payments" | "globalDiscountPercentage" | "globalDiscountValue" | "holdingOrderId"> & {
  tableId: number;
};

export interface UpdateDineInOrder {
  items: { productId: number; quantity: number; discountValue: number; discountPercentage: number }[];
  additionIds: number[];
  notes: string;
}
// export type CheckoutDineInOrder = Omit<CreateTakeawayOrder, "items" | "additionIds"> & {
//   tableId: number;
// };
export type CheckoutDineInOrder = {
  tableId: number;
  globalDiscountValue: number;
  globalDiscountPercentage: number;
  giftCardId: number | null;
  payments: {
    amount: number;
    treasuryId: number;
    notes: string;
  }[];
};

export interface OrderItem {
  id: number;
  productId: number;
  productCode: string;
  productName: string;
  unitId: number;
  quantity: number;
  unitPrice: number;
  priceBeforeTax: number;
  taxPercentage: number;
  taxAmount: number;
  discountPercentage: number;
  discountValue: number;
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

export interface Order {
  id: number;
  orderNumber: string;
  customerName: string;
  customerId: number;
  createdBy: string;
  orderDate: string;
  warehouseName: string;
  subTotal: number;
  taxAmount: number;
  discountAmount: number;
  grandTotal: number;
  orderStatus: string;
  paymentStatus: string;
  notes: string;
  items: OrderItem[];
  payments: OrderPayment[];
}

export interface Table {
  id: number;
  tableName: string;
  status: "Free" | "Occupied";
  currentOrderId: number;
}

export interface DeviceType {
  value: number;
  text: string;
}
export interface CreateDevicePOS {
  deviceName: string;
  serialNumber: string;
  deviceTypeId: number;
  branchId: number;
}
export interface UpdateDevicePOS extends CreateDevicePOS {
  isActive: boolean;
  allowOnlineInvoicing: boolean;
}

export type GetAllPOSDevicesResponse = ApiResponse<POSDevice[]>;
export type GetPOSDevicesResponse = ApiResponse<POSDevice>;
export type GenereateSerialResponse = ApiResponse<string>;
export type GetAllDeviceTypesResponse = ApiResponse<DeviceType[]>;
export type CreateDevicePOSResponse = ApiResponse<POSDevice>;
export type DeleteDevicePOSResponse = ApiResponse<boolean>;
