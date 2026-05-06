import { httpClient } from "@/api/httpClient";
import { CheckoutDineInOrder, CreateDeliveryOrder, CreateDevicePOS, CreateDevicePOSResponse, CreateDineInOrder, CreateTakeawayOrder, DeleteDevicePOSResponse, GenereateSerialResponse, GetAllDeviceTypesResponse, GetAllPOSDevicesResponse, GetPOSDevicesResponse, TakeawayOrdeResponse, UpdateDevicePOS, UpdateDineInOrder } from "../types/posDevice.types";
import { GetAllTablesResponse } from "@/features/tables/types/tables.types";
import { SalesOrder } from "@/features/sales/types/sales.types";

export const getAllPOSDevices = () => httpClient<GetAllPOSDevicesResponse>(`/pos-devices`);
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
