import { httpClient } from "@/api/httpClient";
import { GetAllTablesResponse } from "@/features/tables/types/tables.types";
import { GenereateQRRequest, GenereateQRResponse, GetInvoiceStatisticsTodayResponse } from "../types/zarchaInvoices.types";

// ===================
// GET
// ===================

export const generateQR = (data: GenereateQRRequest) =>
  httpClient<GenereateQRResponse>(`/zatca-invoices/generate-qr`, {
    method: "POST",
    data,
  });
export const getInvoiceStatisticsToday = () =>
  httpClient<GetInvoiceStatisticsTodayResponse>(`/zatca-invoices/invoice-statistics-today/summary`, {
    method: "GET",
  });
export const sendInoviceSell = (data: { invoiceId: number }) =>
  httpClient<void>(`/zatca-invoices/sell`, {
    method: "POST",
    data,
  });

// export const getCategoryClient = (idOrSlug: string | number) =>
//   httpClient<Category>(`/categories/${idOrSlug}`);

// ===================
// MUTATIONS (Dashboard)
// // ===================

// export const updateCategory = (id: number, data: CreateCategory) =>
//   httpClient<CreateResponse>(`/blog/category/${id}`, {
//     method: "PUT",
//     data,
//   });

// export const deleteCategory = (id: number) =>
//   httpClient<void>(`/blog/category/${id}`, {
//     method: "DELETE",
//   });

// export function getSalesOrderById(id: number) {
//   return httpClient<SalesOrder>(`/sales-orders/${id}`);
// }
