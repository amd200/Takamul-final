import { useQuery } from "@tanstack/react-query";
import { getProductPurchases } from "../services/reportsService";
import { reportsKeys } from "../keys/reports.keys";
import { ProductPurchasesParams } from "../types/reports.types";

export const useGetProductPurchases = (params: ProductPurchasesParams & { enabled?: boolean }) => {
  const { enabled, ...apiParams } = params;
  return useQuery({
    queryKey: reportsKeys.itemPurchases(apiParams),
    queryFn: () => getProductPurchases(apiParams),
    enabled: enabled !== undefined ? enabled : !!apiParams.productID,
  });
};
