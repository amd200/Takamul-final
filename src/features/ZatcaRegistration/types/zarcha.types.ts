import type { ApiResponse, PaginationMeta } from "@/types";

export interface GenerateCSR {
  deviceId: number;
}
export interface UpgradeToPcsidRequest {
  certificateId: number;
}
export interface RegisterCCSIDRequest {
  certificateId: number;
  otp: string;
}

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
