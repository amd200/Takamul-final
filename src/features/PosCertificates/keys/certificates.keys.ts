// import type { PaginationMeta } from "@/types/common";

export const certificatesKeys = {
  all: ["certificates"] as const,
  summary: (id) => [...certificatesKeys.all, "summary", id] as const,
  types: () => [...certificatesKeys.all, "types"] as const,
  seiral: () => [...certificatesKeys.all, "seiral"] as const,
  tables: () => [...certificatesKeys.all, "tables"] as const,
  tablesFree: () => [...certificatesKeys.all, "tables", "free"] as const,
  table: (id) => [...certificatesKeys.all, "tables", id] as const,
  takwayOrders: () => [...certificatesKeys.all, "takwayOrders"] as const,
  DeliveryOrders: () => [...certificatesKeys.all, "DeliveryOrders"] as const,
  DineInOrders: () => [...certificatesKeys.all, "DineInOrders"] as const,
  detail: (id: string | number) => [...certificatesKeys.all, "detail", id] as const,
};
