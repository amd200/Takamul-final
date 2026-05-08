import { useQuery } from "@tanstack/react-query";
import { getProfitReport } from "../services/reportsService";
import { reportsKeys } from "../keys/reports.keys";
import { ProfitReportParams } from "../types/reports.types";

export const useGetProfitReport = (params: ProfitReportParams & { enabled?: boolean }) => {
  const { enabled, ...apiParams } = params;
  return useQuery({
    queryKey: reportsKeys.profit(apiParams),
    queryFn: () => getProfitReport(apiParams),
    enabled: enabled !== undefined ? enabled : true,
  });
};
