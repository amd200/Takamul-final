import { httpClient } from "@/api/httpClient";
import type { CreatePurchaseOrder, GetAllPurchasesResponse, Purchase } from "../types/purchase.types";

// ===================
// GET
// ===================

export const getAllPurchases = (page: number, limit: number, searchTerm?: string) =>
  httpClient<GetAllPurchasesResponse>(`/PurchaseOrder`, {
    params: { Page: page, PageSize: limit, SearchTerm: searchTerm },
  });
// export const getCategoryClient = (idOrSlug: string | number) =>
//   httpClient<Category>(`/categories/${idOrSlug}`);

// ===================
// MUTATIONS (Dashboard)
// // ===================

export const createPurchaseOrder = (data: CreatePurchaseOrder) =>
  httpClient<any>("/PurchaseOrder", {
    method: "POST",
    data,
  });
export const updatePurchaseOrder = ({ data, id }: { data: CreatePurchaseOrder; id: number }) =>
  httpClient<{ message: string }>(`/PurchaseOrder/${id}`, {
    method: "PUT",
    data,
  });

// export const updateCategory = (id: number, data: CreateCategory) =>
//   httpClient<CreateResponse>(`/blog/category/${id}`, {
//     method: "PUT",
//     data,
//   });

export const deletePurchaseOrder = (id: number) =>
  httpClient<{ message: string }>(`/PurchaseOrder/${id}`, {
    method: "DELETE",
  });

export function getPurchaseOrderById(id: number) {
  return httpClient<Purchase>(`/PurchaseOrder/${id}`);
}
