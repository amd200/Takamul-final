import { useQuery } from "@tanstack/react-query";
import { getSupplierStatement } from "../services/reportsService";
import { reportsKeys } from "../keys/reports.keys";
import { SupplierStatementParams } from "../types/reports.types";

export const useGetSupplierStatement = (params: SupplierStatementParams & { enabled?: boolean }) => {
  const { enabled, ...apiParams } = params;
  return useQuery({
    queryKey: reportsKeys.supplierStatement(apiParams),
    queryFn: () => getSupplierStatement(apiParams),
    enabled: enabled !== undefined ? enabled : !!(apiParams.supplierId && apiParams.from && apiParams.to),
    select: (data) => data.items ?? [],
  });
};