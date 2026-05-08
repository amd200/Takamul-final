import { useQuery } from "@tanstack/react-query";
import { getPurchaseInvoicesReport } from "../services/reportsService";
import { reportsKeys } from "../keys/reports.keys";
import { PurchaseInvoiceReportParams } from "../types/reports.types";

export const useGetPurchaseInvoicesReport = (params: PurchaseInvoiceReportParams & { enabled?: boolean }) => {
  const { enabled, ...apiParams } = params;
  return useQuery({
    queryKey: reportsKeys.purchaseInvoices(apiParams),
    queryFn: () => getPurchaseInvoicesReport(apiParams),
    enabled: enabled !== undefined ? enabled : true,
  });
};
