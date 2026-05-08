import { useQuery } from "@tanstack/react-query";
import { getEmployeeSalesReport } from "../services/reportsService";
import { EmployeeSalesParams } from "../types/reports.types";

export const useGetEmployeeSalesReport = (params: EmployeeSalesParams & { enabled?: boolean }) => {
  const { enabled, ...apiParams } = params;
  return useQuery({
    queryKey: ["employee-sales-report", apiParams],
    queryFn: () => getEmployeeSalesReport(apiParams),
    enabled: enabled !== undefined ? enabled : true,
  });
};
