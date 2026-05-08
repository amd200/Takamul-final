import { useQuery } from "@tanstack/react-query";
import { getCustomerStatement } from "../services/reportsService";
import { reportsKeys } from "../keys/reports.keys";
import { CustomerStatementParams } from "../types/reports.types";

export const useGetCustomerStatement = (params: CustomerStatementParams & { enabled?: boolean }) => {
  const { enabled, ...apiParams } = params;
  return useQuery({
    queryKey: reportsKeys.customerStatement(apiParams),
    queryFn: () => getCustomerStatement(apiParams),
    enabled: enabled !== undefined ? enabled : !!(apiParams.customerId && apiParams.from && apiParams.to),
    select: (data) => data.items ?? [],
  });
};