// import type { PaginationMeta } from "@/types/common";

export const zatcaInvoiceKeys = {
  all: ["zatca-invoice"] as const,
  invoiceStatisticsToday: () => [...zatcaInvoiceKeys.all, "invoiceStatisticsToday"] as const,
 

};
