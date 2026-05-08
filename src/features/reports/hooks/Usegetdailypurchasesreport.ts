import { useQuery } from "@tanstack/react-query";
import { getDailyPurchasesReport } from "../services/reportsService";
import { reportsKeys } from "../keys/reports.keys";
import { DailyPurchasesReportParams } from "../types/reports.types";

export const useGetDailyPurchasesReport = (params: DailyPurchasesReportParams & { enabled?: boolean }) => {
  const { enabled, ...apiParams } = params;
  return useQuery({
    queryKey: reportsKeys.dailyPurchases(apiParams),
    queryFn: () => getDailyPurchasesReport(apiParams),
    enabled: enabled !== undefined ? enabled : true,
  });
};
