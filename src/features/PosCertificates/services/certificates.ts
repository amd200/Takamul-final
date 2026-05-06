import { httpClient } from "@/api/httpClient";
import { GetAllTablesResponse } from "@/features/tables/types/tables.types";
import { SalesOrder } from "@/features/sales/types/sales.types";
import { GetAllSummaryResponse } from "../types/pos.types";

// ===================
// GET
// ===================

export const getAllSummary = () => httpClient<GetAllSummaryResponse>(`/certificates/all-summary`);

// export const getCategoryClient = (idOrSlug: string | number) =>
//   httpClient<Category>(`/categories/${idOrSlug}`);

// ===================
// MUTATIONS (Dashboard)
// // ===================
