import { httpClient } from "@/api/httpClient";
import type { CreateSalesOrder, GetAllSalesOrderResponse, SalesOrder, UploadFileResponse } from "../types/sales.types";

// ===================
// GET
// ===================

export const getAllSalesOrders = ({ page = 1, limit = 5, OrderType, SearchTerm, branchId, from, to }: { page: number; limit: number; SearchTerm?: string; OrderType?: "POS" | "A4"; branchId?: string; from?: string; to?: string }) =>
  httpClient<GetAllSalesOrderResponse>(`/sales-orders`, {
    params: {
      Page: page,
      PageSize: limit,
      OrderType: OrderType,
      SearchTerm: SearchTerm,
      branchid: branchId,
      From: from,
      To: to,
    },
  });
// export const getCategoryClient = (idOrSlug: string | number) =>
//   httpClient<Category>(`/categories/${idOrSlug}`);

// ===================
// MUTATIONS (Dashboard)
// // ===================

export const createSalesOrders = (data: CreateSalesOrder) =>
  httpClient<{ message: string }>("/sales-orders/a4", {
    method: "POST",
    data,
  });
export const uploadFile = (data: FormData) =>
  httpClient<UploadFileResponse>("/sales-orders/upload", {
    method: "POST",
    data,
  });

// export const updateCategory = (id: number, data: CreateCategory) =>
//   httpClient<CreateResponse>(`/blog/category/${id}`, {
//     method: "PUT",
//     data,
//   });

// export const deleteCategory = (id: number) =>
//   httpClient<void>(`/blog/category/${id}`, {
//     method: "DELETE",
//   });

export function getSalesOrderById(id: number) {
  return httpClient<SalesOrder>(`/sales-orders/${id}`);
}
export function releaseHolding({ id, data }: { id: number; data: CreateSalesOrder["payments"] }) {
  return httpClient<{ message: string }>(`/sales-orders/${id}/release-holding`, {
    method: "POST",
    data,
  });
}
