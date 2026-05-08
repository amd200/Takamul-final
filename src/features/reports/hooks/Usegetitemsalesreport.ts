import { useQuery } from "@tanstack/react-query";
import { getItemSalesReport } from "../services/reportsService";
import { reportsKeys } from "../keys/reports.keys";
import { ItemSalesReportParams } from "../types/reports.types";

export const useGetItemSalesReport = (params: ItemSalesReportParams & { enabled?: boolean }) => {
  const { enabled, ...apiParams } = params;
  return useQuery({
    queryKey: reportsKeys.itemSales(apiParams),
    queryFn: () => getItemSalesReport(apiParams),
    enabled: enabled !== undefined ? enabled : !!apiParams.productCode,
  });
};
