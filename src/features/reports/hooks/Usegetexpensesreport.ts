import { useQuery } from "@tanstack/react-query";
import { getExpensesReport } from "../services/reportsService";
import { reportsKeys } from "../keys/reports.keys";
import { ExpensesReportParams } from "../types/reports.types";

export const useGetExpensesReport = (params: ExpensesReportParams & { enabled?: boolean }) => {
  const { enabled, ...apiParams } = params;
  return useQuery({
    queryKey: reportsKeys.expenses(apiParams),
    queryFn: () => getExpensesReport(apiParams),
    enabled: enabled !== undefined ? enabled : true,
  });
};
