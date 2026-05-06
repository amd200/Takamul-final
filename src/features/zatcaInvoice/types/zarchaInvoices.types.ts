import type { ApiResponse, PaginationMeta } from "@/types";

export interface GenereateQRRequest {
  invoiceId: number;
}

export type GenereateQRResponse = {
  isValid: boolean;
  errorMessage: string | null;
  signedEInvoice: string | null;
  steps: any[];
  qrCode: string;
};
export type GetInvoiceStatisticsToday = {
  totalinvoiceValid: number;
  totalinvoiceRejected: number;
  totalinvoiceNotSent: number;
};

export type CSRBase = {
  success: boolean;
  message: string;
  token: string | null;
  secretKey: string | null;
  registrationNumber: string | null;
  expiresAt: string | null;
};
export type GenerateCSRData = CSRBase & {
  newStatus: "PendingOTP" | "CCSIDRegistered";
};

export type UpgradePcsidData = CSRBase & {
  newStatus: "NotRegistered";
};
export type GenerateCSRResponse = ApiResponse<GenerateCSRData>;
export type UpgradePcsidResponse = ApiResponse<GenerateCSRData>;
export type GetInvoiceStatisticsTodayResponse = ApiResponse<GetInvoiceStatisticsToday>;
