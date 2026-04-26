import { categoriesKeys } from "@/features/categories/keys/categories.keys";
import { getCategoryById } from "@/features/categories/services/categories";
import type { Category } from "@/features/categories/types/categories.types";
import { useQuery } from "@tanstack/react-query";
import { salesKeys } from "../keys/pos.keys";
import { getSalesOrderById } from "../services/sales";
import type { SalesOrder } from "../types/sales.types";

export const useGetSalesOrderById = (id?: number) =>
  useQuery<SalesOrder>({
    queryKey: salesKeys.detail(id as number),
    queryFn: () => getSalesOrderById(id as number),
    enabled: !!id,
  });
