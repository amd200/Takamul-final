import { useQuery } from "@tanstack/react-query";
import { getSalesReturnReport } from "../services/reportsService";
import { SalesReturnReportParams } from "../types/reports.types";

export const useGetSalesReturnReport = (params: SalesReturnReportParams & { enabled?: boolean }) => {
  const { enabled, ...apiParams } = params;
  return useQuery({
    queryKey: ["sales-return-report", apiParams],
    queryFn: () => getSalesReturnReport(apiParams),
    enabled: enabled !== undefined ? enabled : true,
  });
};
