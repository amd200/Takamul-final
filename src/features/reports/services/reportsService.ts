import { httpClient } from "@/api/httpClient";
import { TopSellingProduct, TopSellingParams, PaginatedResponse, ProductMovement, ProductMovementParams, InventoryStockItem, InventoryStockParams, StatementItem, CustomerStatementParams, SupplierStatementParams, ExpensesReportParams, ExpensesReportResponse, ItemSalesReportParams, ItemSalesReportResponse, DailySalesReportItem, DailySalesReportParams, SalesInvoiceReportItem, SalesInvoiceReportParams, ProductPurchasesResponse, ProductPurchasesParams, DailyPurchasesReportItem, DailyPurchasesReportParams, PurchaseInvoiceReportItem, PurchaseInvoiceReportParams, ProfitReportResponse, ProfitReportParams, StockAlertReportParams, StockAlertItem, SalesReturnReportItem, SalesReturnReportParams, EmployeeSalesItem, EmployeeSalesParams } from "../types/reports.types";

// ─── Top Selling ───────────────────────────────────────────────
// بترجع paginated response
export const getTopSellingProducts = async (params: TopSellingParams): Promise<PaginatedResponse<TopSellingProduct>> => {
  return httpClient<PaginatedResponse<TopSellingProduct>>("/reports/products/TopSelling", { params });
};

// ─── Product Movement ──────────────────────────────────────────
// بترجع array مباشرة
export const getProductMovement = async (params: ProductMovementParams): Promise<ProductMovement[]> => {
  if (!params.productId) return [];
  return httpClient<ProductMovement[]>("/reports/products/Movement", { params });
};

// ─── Inventory Stock ───────────────────────────────────────────
// بترجع paginated response
export const getInventoryStock = async (params: InventoryStockParams): Promise<PaginatedResponse<InventoryStockItem>> => {
  return httpClient<PaginatedResponse<InventoryStockItem>>("/reports/products/InventoryStock", { params });
};

// ─── Customer Statement ────────────────────────────────────────
export const getCustomerStatement = async (params: CustomerStatementParams): Promise<PaginatedResponse<StatementItem>> => {
  if (!params.customerId) return { items: [], totalCount: 0, pageNumber: 1, pageSize: 20 };

  return httpClient<PaginatedResponse<StatementItem>>("/reports/products/CustomarsStatement", { 
    params: { 
      CustomerId: params?.customerId, 
      From: params?.from, 
      To: params?.to,
      Type: params?.type,
      Page: params?.page,
      PageSize: params?.pageSize
    } 
  });
};

// ─── Expenses Report ───────────────────────────────────────────
export const getExpensesReport = async (params: ExpensesReportParams): Promise<ExpensesReportResponse> => {
  return httpClient<ExpensesReportResponse>("/reports/products/ExpensesReport", { params });
};

// ─── Item Sales Report (ProductSalesForBrunch) ──────────────────
export const getItemSalesReport = async (params: ItemSalesReportParams): Promise<ItemSalesReportResponse> => {
  return httpClient<ItemSalesReportResponse>("/reports/products/ProductSalesForBrunch", { params });
};

// ─── Daily Sales Report ────────────────────────────────────────
export const getDailySalesReport = async (params: DailySalesReportParams): Promise<DailySalesReportItem[]> => {
  return httpClient<DailySalesReportItem[]>("/reports/products/DailySales", { params });
};

// ─── Sales Invoices Report ─────────────────────────────────────
export const getSalesInvoicesReport = async (params: SalesInvoiceReportParams): Promise<SalesInvoiceReportItem[]> => {
  return httpClient<SalesInvoiceReportItem[]>("/reports/products/SalesInvoices", { params });
};

// ─── Supplier Statement ────────────────────────────────────────
// بترجع paginated response
export const getSupplierStatement = async (params: SupplierStatementParams): Promise<PaginatedResponse<StatementItem>> => {
  if (!params.supplierId) return { items: [], totalCount: 0, pageNumber: 1, pageSize: 20 };
  const { supplierId, ...rest } = params;
  return httpClient<PaginatedResponse<StatementItem>>("/reports/products/SupplierStatement", { params: { SupplierId: supplierId, ...rest } });
};

// ─── Product Purchases Report ──────────────────────────────────
export const getProductPurchases = async (params: ProductPurchasesParams): Promise<ProductPurchasesResponse> => {
  return httpClient<ProductPurchasesResponse>("/reports/products/ProductPurchases", { params });
};

// ─── Daily Purchases Report ────────────────────────────────────
export const getDailyPurchasesReport = async (params: DailyPurchasesReportParams): Promise<DailyPurchasesReportItem[]> => {
  return httpClient<DailyPurchasesReportItem[]>("/reports/products/DailyPurchases", { params });
};

// ─── Purchase Invoices Report ──────────────────────────────────
export const getPurchaseInvoicesReport = async (params: PurchaseInvoiceReportParams): Promise<PurchaseInvoiceReportItem[]> => {
  return httpClient<PurchaseInvoiceReportItem[]>("/reports/products/PurchaseInvoices", { params });
};

// ─── Profit Report ─────────────────────────────────────────────
export const getProfitReport = async (params: ProfitReportParams): Promise<ProfitReportResponse> => {
  return httpClient<ProfitReportResponse>("/reports/products/Profit", { params });
};

// ─── Stock Alert Report ─────────────────────────────────────────
export const getStockAlertReport = async (params: StockAlertReportParams): Promise<StockAlertItem[]> => {
  return httpClient<StockAlertItem[]>("/reports/products/StockAlerts", { params });
};

// ─── Sales Return Report ───────────────────────────────────────
export const getSalesReturnReport = async (params: SalesReturnReportParams): Promise<PaginatedResponse<SalesReturnReportItem>> => {
  return httpClient<PaginatedResponse<SalesReturnReportItem>>("/reports/products/SalesReturn", { params });
};

// ─── Employee Sales Report ─────────────────────────────────────
export const getEmployeeSalesReport = async (params: EmployeeSalesParams): Promise<PaginatedResponse<EmployeeSalesItem>> => {
  return httpClient<PaginatedResponse<EmployeeSalesItem>>("/reports/products/employee-sales", { params });
};
