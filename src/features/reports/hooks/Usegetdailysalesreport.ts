import { useQuery } from "@tanstack/react-query";
import { getDailySalesReport } from "../services/reportsService";
import { reportsKeys } from "../keys/reports.keys";
import { DailySalesReportParams } from "../types/reports.types";

export const useGetDailySalesReport = (params: DailySalesReportParams & { enabled?: boolean }) => {
  const { enabled, ...apiParams } = params;
  return useQuery({
    queryKey: reportsKeys.dailySales(apiParams),
    queryFn: () => getDailySalesReport(apiParams),
    enabled: enabled !== undefined ? enabled : !!(apiParams.From && apiParams.To),
  });
};
