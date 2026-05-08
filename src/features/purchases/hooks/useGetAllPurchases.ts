import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { GetAllPurchasesResponse } from "../types/purchase.types";
import { getAllPurchases } from "../services/purchases";
import { purchasesKeys } from "../keys/purchases.keys";

export const useGetAllPurchases = ({ 
  page, 
  limit, 
  searchTerm, 
  branchId, 
  from, 
  to,
  enabled 
}: { 
  page: number; 
  limit: number; 
  searchTerm?: string;
  branchId?: string;
  from?: string;
  to?: string;
  enabled?: boolean;
}) =>
  useQuery<GetAllPurchasesResponse>({
    queryKey: purchasesKeys.list({ page, limit, searchTerm, branchId, from, to }),
    queryFn: async () => {
      try {
        return await getAllPurchases(page, limit, searchTerm, branchId, from, to);
      } catch (err) {
        if (typeof err === "string" && err.includes("لا يوجد")) {
          return {
            items: [],
            totalCount: 0,
            pageNumber: page,
            pageSize: limit,
          };
        }
        throw err;
      }
    },
    placeholderData: keepPreviousData,
    enabled: enabled !== undefined ? enabled : true,
  });
