import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { posKeys } from "../keys/pos.keys";
import { getAllTables, getOrderByTableId } from "../services/pos";
import { SalesOrder } from "@/features/sales/types/sales.types";

export const useGetOrderByTableId = (id?: number) =>
  useQuery<SalesOrder>({
    queryKey: posKeys.table(id),
    queryFn: () => getOrderByTableId(id),
    enabled: false,
  });
