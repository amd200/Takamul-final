// import type { PaginationMeta } from "@/types/common";

export const purchasesKeys = {
  all: ["purchases"] as const,

  list: (param: { page: number; limit: number; searchTerm?: string; branchId?: string; from?: string; to?: string }) => [...purchasesKeys.all, "list", param] as const,

  detail: (id: string | number) => [...purchasesKeys.all, "detail", id] as const,
};
