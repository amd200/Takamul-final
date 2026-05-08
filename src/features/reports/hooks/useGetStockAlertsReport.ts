import { useQuery } from "@tanstack/react-query";
import { getStockAlertReport } from "../services/reportsService";
import { reportsKeys } from "../keys/reports.keys";
import { StockAlertReportParams } from "../types/reports.types";

export const useGetStockAlertsReport = (params: StockAlertReportParams & { enabled?: boolean }) => {
  const { enabled, ...apiParams } = params;
  return useQuery({
    queryKey: reportsKeys.stockAlerts(apiParams),
    queryFn: () => getStockAlertReport(apiParams),
    enabled: enabled !== undefined ? enabled : true,
  });
};
