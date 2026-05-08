import { useQuery } from "@tanstack/react-query";
import { getTopSellingProducts } from "../services/reportsService";
import { reportsKeys } from "../keys/reports.keys";
import { TopSellingParams } from "../types/reports.types";

export const useGetTopSellingProducts = (params: TopSellingParams & { enabled?: boolean }) => {
  const { enabled, ...apiParams } = params;
  return useQuery({
    queryKey: reportsKeys.topSelling(apiParams),
    queryFn: () => getTopSellingProducts(apiParams),
    enabled: enabled !== undefined ? enabled : !!(apiParams.from && apiParams.to),
    select: (data) => data.items ?? [],
  });
};