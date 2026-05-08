import { useQuery } from "@tanstack/react-query";
import { getProductMovement } from "../services/reportsService";
import { reportsKeys } from "../keys/reports.keys";
import { ProductMovementParams } from "../types/reports.types";

export const useGetProductMovement = (params: ProductMovementParams & { enabled?: boolean }) => {
  const { enabled, ...apiParams } = params;
  return useQuery({
    queryKey: reportsKeys.movement(apiParams),
    queryFn: () => getProductMovement(apiParams),
    enabled: enabled !== undefined ? enabled : !!(apiParams.productId && apiParams.from && apiParams.to),
  });
};