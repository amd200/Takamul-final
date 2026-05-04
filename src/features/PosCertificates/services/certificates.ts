import { httpClient } from "@/api/httpClient";
import { CheckoutDineInOrder, CreateDeliveryOrder, CreateDevicePOS, CreateDevicePOSResponse, CreateDineInOrder, CreateTakeawayOrder, DeleteDevicePOSResponse, GenereateSerialResponse, GetAllDeviceTypesResponse, GetAllPOSDevicesResponse, GetPOSDevicesResponse, TakeawayOrdeResponse, UpdateDevicePOS, UpdateDineInOrder } from "../types/pos.types";
import { GetAllTablesResponse } from "@/features/tables/types/tables.types";
import { SalesOrder } from "@/features/sales/types/sales.types";

// ===================
// GET
// ===================

export const getSummaryPosDeviceWithId = (id: number) => httpClient<GetAllPOSDevicesResponse>(`/certificates/device/${id}/summary`);
export const updatePOSDevice = ({ id, data }: { id: number; data: UpdateDevicePOS }) =>
  httpClient<GetAllPOSDevicesResponse>(`/pos-devices/${id}`, {
    method: "PUT",
    data,
  });
export const genereateSerial = () => httpClient<GenereateSerialResponse>(`/pos-devices/generate-serial`);
export const getAllDevicesTypes = () => httpClient<GetAllDeviceTypesResponse>(`/pos-devices/device-types`);
export const CreateDevice = (data: CreateDevicePOS) =>
  httpClient<CreateDevicePOSResponse>(`/pos-devices`, {
    method: "POST",
    data,
  });
export const DeleteDevicePOS = (id: number) =>
  httpClient<DeleteDevicePOSResponse>(`/pos-devices/${id}`, {
    method: "DELETE",
  });
export const getPOSDeviceById = (id: number) => httpClient<GetPOSDevicesResponse>(`/pos-devices/${id}`);
// export const getCategoryClient = (idOrSlug: string | number) =>
//   httpClient<Category>(`/categories/${idOrSlug}`);

// ===================
// MUTATIONS (Dashboard)
// // ===================

export const cancelOrder = (id: number) =>
  httpClient<{ message: string }>(`/sales-orders/${id}/cancel`, {
    method: "PUT",
  });
export const createTakwayOrder = (data: CreateTakeawayOrder) =>
  httpClient<TakeawayOrdeResponse>("/sales-orders/pos/takeaway", {
    method: "POST",
    data,
  });
export const createDeliveryOrder = (data: CreateDeliveryOrder) =>
  httpClient<{ message: string }>("/sales-orders/pos/delivery", {
    method: "POST",
    data,
  });
export const createDineInOrder = (data: CreateDineInOrder) =>
  httpClient<{ message: string }>("/sales-orders/pos/indine", {
    method: "POST",
    data,
  });
export const updateDineInOrder = ({ data, id }: { data: UpdateDineInOrder; id: number }) =>
  httpClient<{ message: string }>(`/sales-orders/pos/in-dine/${id}`, {
    method: "PUT",
    data,
  });
export const checkoutDineInOrder = (data: CheckoutDineInOrder) =>
  httpClient<{ message: string }>("/sales-orders/pos/indine/checkout", {
    method: "POST",
    data,
  });
export const getOrderByTableId = (id: number) =>
  httpClient<SalesOrder>(`/sales-orders/pos/indine/table/${id}`, {
    method: "GET",
  });
export const getAllTables = () =>
  httpClient<GetAllTablesResponse>("/dining-tables", {
    method: "GET",
  });
export const getAllFreeTables = () =>
  httpClient<GetAllTablesResponse>("/dining-tables/free", {
    method: "GET",
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

// export function getSalesOrderById(id: number) {
//   return httpClient<SalesOrder>(`/sales-orders/${id}`);
// }
