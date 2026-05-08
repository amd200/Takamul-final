import { useQuery } from "@tanstack/react-query";
import { getSalesInvoicesReport } from "../services/reportsService";
import { reportsKeys } from "../keys/reports.keys";
import { SalesInvoiceReportParams } from "../types/reports.types";

export const useGetSalesInvoicesReport = (params: SalesInvoiceReportParams & { enabled?: boolean }) => {
  const { enabled, ...apiParams } = params;
  return useQuery({
    queryKey: reportsKeys.salesInvoices(apiParams),
    queryFn: () => getSalesInvoicesReport(apiParams),
    enabled: enabled !== undefined ? enabled : !!(apiParams.From && apiParams.To),
  });
};
