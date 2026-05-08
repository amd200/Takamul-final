import { CreateSalesOrder, SalesOrder } from "@/features/sales/types/sales.types";
import type { ApiResponse, PaginationMeta } from "@/types";

export interface POSDevice {
  id: number;
  deviceName: string;
  commonName: string;
  serialNumber: string;
  InvoiceSequence: string;
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
  isActive?: boolean;
  location?: string;
  createdAt: string;
  certificateId: number | null;
  updatedAt: string;
}

export interface DeviceType {
  value: number;
  text: string;
}
export interface CreateDevicePOS {
  deviceName: string;
  serialNumber: string;
  InvoiceSequence: string;
  branchId: number;
}

export interface UpdateDevicePOS extends Omit<CreateDevicePOS, "serialNumber"> {
  isActive: boolean;
  allowOnlineInvoicing: boolean;
}
export type GetAllPOSDevicesResponse = ApiResponse<POSDevice[]>;
export type GetPOSDevicesResponse = ApiResponse<POSDevice>;
export type GenereateSerialResponse = ApiResponse<string>;
export type GetAllDeviceTypesResponse = ApiResponse<DeviceType[]>;
export type CreateDevicePOSResponse = ApiResponse<POSDevice>;
export type DeleteDevicePOSResponse = ApiResponse<boolean>;
