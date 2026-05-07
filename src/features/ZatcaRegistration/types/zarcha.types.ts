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

// "data": {
//       "certificateId": 17,
//       "success": true,
//       "message": "تم توليد CSR بنجاح. الخطوة التالية: إدخال OTP من بوابة ZATCA",
//       "token": "LS0tLS1CRUdJTiBDRVJUSUZJQ0FURSBSRVFVRVNULS0tLS0NCk1JSUNjVENDQWhjQ0FRQXdnYjB4Q3pBSkJnTlZCQVlUQWxOQk1TMHdLd1lEVlFRTERDVFpnZGl4MkxrZzJLZloNCmhObUYySy9aaXRtRzJLa2cyS2ZaaE5tRjJZYlppTml4MktreFFEQStCZ05WQkFvTU45bUYyS1RZczlpejJLa2cNCjJLclpnOWluMllYWmhDRFlwOW1FMktqWml0aW4yWWJZcDlpcUlOaW4yWVRZcXRpczJLZllzZG1LMktreFBUQTcNCkJnTlZCQU1NTkZCUFV5MHdNakU1TnpSak5ESmhPVGswTW1Sa09EVTFOakZrTUdRNFlqWXpZMlZoT0Mwek1URXkNCk9UWTBPRGcxTURBd01ETXdWakFRQmdjcWhrak9QUUlCQmdVcmdRUUFDZ05DQUFSbGwwc0oyVFNWckt3UVlJNmUNCm8wd0lYNmRIZHZhb0FnMEFFYmQ2TFo4RHNJQnZzNnNQYmdqb3h1c2VyOXZ1M2xidGw5ekpXQ21qdGxEQ3VzQ1kNClhQNGFvSUg1TUlIMkJna3Foa2lHOXcwQkNRNHhnZWd3Z2VVd0pBWUpLd1lCQkFHQ054UUNCQmNURlZCU1JWcEINClZFTkJMVU52WkdVdFUybG5ibWx1WnpDQnZBWURWUjBSQklHME1JR3hwSUd1TUlHck1Vb3dTQVlEVlFRRURFRXgNCkxXUm1aR1p6WkdaelpHWjhNaTB6TVRFeU9UWTBPRGcxTURBd01ETjhNeTB3TWpFNU56UmpOREpoT1RrME1tUmsNCk9EVTFOakZrTUdRNFlqWXpZMlZoT0RFZk1CMEdDZ21TSm9tVDhpeGtBUUVNRHpNeE1USTVOalE0T0RVd01EQXcNCk16RU5NQXNHQTFVRURBd0VNVEV3TURFUk1BOEdBMVVFR2d3SVJFMVFRek0wTURFeEdqQVlCZ05WQkE4TUVWTjENCmNIQnNlU0JoWTNScGRtbDBhV1Z6TUFvR0NDcUdTTTQ5QkFNQ0EwZ0FNRVVDSUJ3aVdXRnI0eHh6MkpEYnhBTXANCmlMOUZFejdRVlgvY3A2cUpnMzhlTHc0MEFpRUE3MGFoRWFjUm9HdWlPeHNsd002QzA5bkJYNnVHSWhvUndLUVINCnBRMElYL0k9DQotLS0tLUVORCBDRVJUSUZJQ0FURSBSRVFVRVNULS0tLS0NCg==",
//       "privateKey": "MHQCAQEEIDjUyobR4uLrsP+VYmY/d/Naa2UhHtLmRQ8A5Y0JRoYYoAcGBSuBBAAKoUQDQgAEZZdLCdk0laysEGCOnqNMCF+nR3b2qAINABG3ei2fA7CAb7OrD24I6MbrHq/b7t5W7ZfcyVgpo7ZQwrrAmFz+Gg==",
//       "secretKey": null,
//       "registrationNumber": null,
//       "expiresAt": null,
//       "newStatus": "PendingOTP"
//   },
export type GenerateCSRData = {
  certificateId: number;
  success: boolean;
  message: string;
  token: string | null;
  secretKey: string | null;
  registrationNumber: string | null;
  expiresAt: string | null;
  newStatus: "PendingOTP" | "CCSIDRegistered";
};

export type UpgradePcsidData = CSRBase & {
  newStatus: "NotRegistered";
};
export type GenerateCSRResponse = ApiResponse<GenerateCSRData>;
export type UpgradePcsidResponse = ApiResponse<GenerateCSRData>;
