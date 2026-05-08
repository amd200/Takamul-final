import { useQuery } from "@tanstack/react-query";
import { getInventoryStock } from "../services/reportsService";
import { reportsKeys } from "../keys/reports.keys";
import { InventoryStockParams } from "../types/reports.types";

export const useGetInventoryStock = (params: InventoryStockParams & { enabled?: boolean }) => {
  const { enabled, ...apiParams } = params;
  return useQuery({
    queryKey: reportsKeys.inventoryStock(apiParams),
    queryFn: () => getInventoryStock(apiParams),
    enabled: enabled !== undefined ? enabled : !!(apiParams.from && apiParams.to),
    select: (data) => data.items ?? [],
  });
};