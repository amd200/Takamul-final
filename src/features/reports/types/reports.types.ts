// ─── Shared ────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

// ─── Top Selling ───────────────────────────────────────────────
export interface TopSellingProduct {
  productId: number;
  productName: string;
  barcode: string;
  sellingPrice: number;
  totalQuantitySold: number;
  totalSales: number;
}

export interface TopSellingParams {
  from?: string;
  to?: string;
  branchid?: number | string;
  page?: number;
  pageSize?: number;
  searchTerm?: string;
}

// ─── Product Movement ──────────────────────────────────────────
export interface ProductMovement {
  productId: number;
  productNameAr: string;
  barcode: string;
  transDate: string;
  transType: string;
  qtyIn: number;
  qtyOut: number;
  invoiceNo: number;
  runningBalance: number;
}

export interface ProductMovementParams {
  productId: number | string;
  from?: string;
  to?: string;
  branchid?: number | string;
}

// ─── Inventory Stock ───────────────────────────────────────────
export interface InventoryStockItem {
  productId: number;
  productName: string;
  unitName: string;
  currentQty: number;
  costPrice: number;
  salePrice: number;
  totalCostValue: number;
  totalSaleValue: number;
}

export interface InventoryStockParams {
  branchid?: number | string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
  searchTerm?: string;
}

// ─── Customer Statement ────────────────────────────────────────
export interface StatementItem {
  date: string;
  type: string;
  reference: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface CustomerStatementParams {
  customerId: number | string;
  from?: string;
  to?: string;
  type?: string; // "Sales" | "Collections" | "Returns"
  page?: number;
  pageSize?: number;
}

// ─── Supplier Statement ────────────────────────────────────────
export interface SupplierStatementParams {
  supplierId: number | string;
  from?: string;
  to?: string;
  type?: string; // "Purchases" | "Payments"
  reference?: string;
  page?: number;
  pageSize?: number;
}

// ─── Expenses Report ───────────────────────────────────────────
export interface ExpensesReportItem {
  date: string;
  treasuryName: string;
  itemName: string | null;
  amount: number;
  notes: string;
}

export interface ExpensesReportParams {
  branchid?: number | string;
  TreasuryId?: number | string;
  FromDate?: string;
  ToDate?: string;
  ItemId?: number | string;
  Page?: number;
  PageSize?: number;
  SearchTerm?: string;
}

export interface ExpensesReportResponse {
  data: ExpensesReportItem[];
  totalCount: number;
  totalAmount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

// ─── Item Sales Report (ProductSalesForBrunch) ──────────────────
export interface ItemSalesReportItem {
  date: string;
  orderNumber: string;
  quantitySold: number;
  totalSales: number;
  totalPurchases: number;
}

export interface ItemSalesReportResponse {
  details: ItemSalesReportItem[];
  summary: {
    totalOperations: number;
    totalQuantitySold: number;
    totalSales: number;
    totalPurchases: number;
  };
}

export interface ItemSalesReportParams {
  productCode: number | string;
  from?: string;
  to?: string;
  branchid?: number | string;
}

// ─── Daily Sales Report ────────────────────────────────────────
export interface DailySalesReportItem {
  date: string;
  totalInvoices: number;
  totalSales: number;
  totalDiscount: number;
  totalTax: number;
  netSales: number;
}

export interface DailySalesReportParams {
  branchid?: number | string;
  From?: string;
  To?: string;
  Page?: number;
  PageSize?: number;
}

// ─── Sales Invoices Report ─────────────────────────────────────
export interface SalesInvoiceReportItem {
  date: string;
  orderNumber: string;
  customerName: string;
  subTotal: number;
  discountAmount: number;
  grandTotal: number;
  paidAmount: number;
  remainingAmount: number;
  paymentStatus: string;
}

export interface SalesInvoiceReportParams {
  branchid?: number | string;
  From?: string;
  To?: string;
  Page?: number;
  PageSize?: number;
}

// ─── Product Purchases Report ──────────────────────────────────
export interface ProductPurchasesItem {
  date: string;
  orderNumber: string;
  quantityPurchased: number;
  totalPurchases: number;
}

export interface ProductPurchasesResponse {
  details: ProductPurchasesItem[];
  summary: {
    totalOperations: number;
    totalQuantityPurchased: number;
    totalPurchases: number;
  };
}

export interface ProductPurchasesParams {
  productID: number | string;
  from?: string;
  to?: string;
  branchid?: number | string;
}

// ─── Daily Purchases Report ────────────────────────────────────
export interface DailyPurchasesReportItem {
  date: string;
  totalInvoices: number;
  totalPurchases: number;
  totalDiscount: number;
  netPurchases: number;
}

export interface DailyPurchasesReportParams {
  branchid?: number | string;
  From?: string;
  To?: string;
  Page?: number;
  PageSize?: number;
}

// ─── Purchase Invoices Report ──────────────────────────────────
export interface PurchaseInvoiceReportItem {
  date: string;
  orderNumber: string;
  supplierName: string;
  subTotal: number;
  discountAmount: number;
  grandTotal: number;
  paidAmount: number;
  remainingAmount: number;
  paymentStatus: string;
}

export interface PurchaseInvoiceReportParams {
  branchid?: number | string;
  From?: string;
  To?: string;
  Page?: number;
  PageSize?: number;
}

// ─── Profit Report ─────────────────────────────────────────────
export interface ProfitReportResponse {
  totalSales: number;
  totalCostOfSales: number;
  grossProfit: number;
  totalExpenses: number;
  netProfit: number;
}

export interface ProfitReportParams {
  from?: string;
  to?: string;
  branchid?: number | string;
}

// ─── StockAlert Report ─────────────────────────────────────────────
export interface StockAlertItem {
  productId: number;
  productName: string;
  barcode: string;
  currentQty: number;
  minStockLevel: number;
}

export interface StockAlertReportParams {
  branchId?: string;
  customerId?: string | number;
  from?: string;
  to?: string;
}

// ─── Sales Return Report ───────────────────────────────────────
export interface SalesReturnReportItem {
  returnId: number;
  returnNumber: string;
  returnDate: string;
  customerName: string;
  returnStatus: string;
  refundStatus: string;
  subTotal: number;
  discountAmount: number;
  taxAmount: number;
  grandTotal: number;
  refundedAmount: number;
  createdBy: string;
}

export interface SalesReturnReportParams {
  From?: string;
  To?: string;
  Page?: number;
  PageSize?: number;
  SearchTerm?: string;
  BranchId?: number | string;
}

// ─── Employee Sales Report ─────────────────────────────────────
export interface EmployeeSalesItem {
  employeeId: number;
  employeeName: string;
  orderNumber: string;
  orderDate: string;
  customerName: string;
  subTotal: number;
  discountAmount: number;
  taxAmount: number;
  grandTotal: number;
  orderStatus: string;
  paymentStatus: string;
}

export interface EmployeeSalesParams {
  From?: string;
  To?: string;
  Page?: number;
  PageSize?: number;
  EmployeeId?: number | string;
  BranchId?: number | string;
}
