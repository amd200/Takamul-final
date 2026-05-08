import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { salesKeys } from "../keys/sales.keys";
import { getAllSalesOrders } from "../services/sales";
import type { GetAllSalesOrderResponse } from "../types/sales.types";

export const useGetAllSales = ({ 
  page, 
  limit, 
  SearchTerm, 
  OrderType,
  branchId,
  from,
  to,
  enabled
}: { 
  page: number; 
  limit: number; 
  SearchTerm?: string; 
  OrderType?: "POS" | "A4";
  branchId?: string;
  from?: string;
  to?: string;
  enabled?: boolean;
}) =>
  useQuery<GetAllSalesOrderResponse>({
    queryKey: salesKeys.list({ page, limit, OrderType, SearchTerm, branchId, from, to }),
    queryFn: () => getAllSalesOrders({ page, limit, SearchTerm, OrderType, branchId, from, to }),
    placeholderData: keepPreviousData,
    enabled: enabled !== undefined ? enabled : true,
  });
