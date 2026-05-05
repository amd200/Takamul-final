import { Permission } from "@/lib/permissions";
import { JwtPayload } from "jwt-decode";

export type Paginated<T> = {
  items: T;
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
};
export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
  errors: string[];
};

export const PurchaseStatus = {
  RECEIVED: "RECEIVED",
  PENDING: "PENDING",
  ORDERED: "ORDERED",
} as const;

export type PurchaseStatus = (typeof PurchaseStatus)[keyof typeof PurchaseStatus];

export const PaymentStatus = {
  PAID: "PAID",
  PARTIAL: "PARTIAL",
  DUE: "DUE",
  OVERDUE: "OVERDUE",
} as const;

export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export interface Treasury {
  id: number;
  name: string;
  openingBalance: number;
  currentBalance?: number;
}

export interface Bank {
  id: string;
  code: string;
  name: string;
  openingBalance: number;
  currentBalance?: number;
  notes?: string;
}

export interface ExternalTransfer {
  id: string;
  date: string;
  bankId: string;
  amount: number;
  notes?: string;
}

export interface InternalTransfer {
  id: string;
  date: string;
  type: string;
  from: string;
  to: string;
  amount: number;
  notes?: string;
}

export interface PaymentCompany {
  id: string;
  code: string;
  name: string;
}

export interface PaymentMethod {
  id: string;
  image?: string;
  code: string;
  name: string;
  status: "available" | "unavailable";
}

export interface SpecialPromotion {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  basicItem: string;
  basicItemQty: number;
  freeItem: string;
  freeItemQty: number;
  discount: number;
  policy: string;
  details: string;
}

export interface GeneralPromotion {
  id: string;
  startDate: string;
  endDate: string;
  discount: number;
  branch: string;
}

export interface Expense {
  id: string;
  date: string;
  reference: string;
  category: string;
  amount: number;
  description: string;
  createdBy: string;
  hasAttachment: boolean;
}

export interface SaleItem {
  id: string;
  code: string;
  name: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  vatAmount: number;
  total: number;
}

export interface Sale {
  id: string;
  invoiceNo: string;
  date: string;
  refNo: string;
  cashier: string;
  customer: string;
  saleStatus: "completed" | "returned";
  grandTotal: number;
  paid: number;
  remaining: number;
  paymentStatus: "paid" | "partial" | "unpaid";
  paymentType: "mada" | "cash" | "bank_transfer";
  items?: SaleItem[];
}

export interface Purchase {
  id: string;
  date: string;
  reference: string;
  supplier: string;
  status: PurchaseStatus;
  total: number;
  paid: number;
  balance: number;
  paymentStatus: PaymentStatus;
  branch?: string;
  notes?: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  gender: "male" | "female";
  company: string;
  phone: string;
  email: string;
  usernameEmail: string;
  status: "active" | "inactive";
  group: string;
  defaultPaymentMethod: string;
  defaultPaymentCompany: string;
  defaultInvoiceType: string;
  notifyEmail: boolean;
  createdAt: string;
}

export interface PriceGroup {
  id: string;
  name: string;
}

export interface DeliveryCompany {
  id: string;
  name: string;
}

export interface ExpenseCategory {
  id: string;
  code: string;
  name: string;
}

export interface Delegate {
  id: string;
  code: string;
  name: string;
  phone: string;
  region: string;
}

export interface Bond {
  id: string;
  type: "receipt" | "payment" | "deposit" | "withdrawal";
  date: string;
  beneficiary?: string;
  branch: string;
  treasury?: string;
  amount: number;
  notes?: string;
}

export interface PaginationMeta {
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

export interface AppJwtPayload extends JwtPayload {
  Permission: Permission[];
  UserId: string;
  username: string;
  BranchId: string;
  IsActive: string;
  email: string;
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"?: string | string[];
}
