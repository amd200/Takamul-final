import { CreateSalesOrder, SalesOrder } from "@/features/sales/types/sales.types";
import type { ApiResponse, PaginationMeta } from "@/types";

export interface AllSummary {
  totalDevices: number;
  activeCertificates: number;
  expiredCertificates: number;
  expiringIn30Days: number;
  expiringIn7Days: number;
  devicesNeedingAttention: any[];
}

export type GetAllSummaryResponse = ApiResponse<AllSummary>;
