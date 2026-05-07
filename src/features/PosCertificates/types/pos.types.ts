import { CreateSalesOrder, SalesOrder } from "@/features/sales/types/sales.types";
import type { ApiResponse, PaginationMeta } from "@/types";

export interface Certificate {
  deviceId: number;
  deviceName: string;
  deviceCertificateId: number;
  hasActiveCertificate: boolean;
  currentCertificateType: "CSR" | "PCSID" | "CCSID";
  registrationNumber: string | null;
  expiresAt: string | null;
  isExpired: boolean;
  daysUntilExpiry: number | null;
  totalCertificates: number;
  activeCertificates: number;
  expiredCertificates: number;
}

export type GetAllCertificatesResponse = ApiResponse<Certificate[]>;
