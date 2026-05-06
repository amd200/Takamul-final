import { httpClient } from "@/api/httpClient";
import { CheckoutDineInOrder, CreateDeliveryOrder, CreateDevicePOS, CreateDevicePOSResponse, CreateDineInOrder, CreateTakeawayOrder, DeleteDevicePOSResponse, GenereateSerialResponse, GetAllDeviceTypesResponse, GetAllPOSDevicesResponse, GetPOSDevicesResponse, TakeawayOrdeResponse, UpdateDevicePOS, UpdateDineInOrder } from "../types/pos.types";
import { GetAllTablesResponse } from "@/features/tables/types/tables.types";
import { SalesOrder } from "@/features/sales/types/sales.types";

// ===================
// GET
// ===================

export const getSummaryPosDeviceWithId = (id: number) => httpClient<GetAllPOSDevicesResponse>(`/certificates/device/${id}/summary`);

// export const getCategoryClient = (idOrSlug: string | number) =>
//   httpClient<Category>(`/categories/${idOrSlug}`);

// ===================
// MUTATIONS (Dashboard)
// // ===================
