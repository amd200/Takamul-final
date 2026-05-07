import { httpClient } from "@/api/httpClient";
import { GetAllTablesResponse } from "@/features/tables/types/tables.types";
import { SalesOrder } from "@/features/sales/types/sales.types";
import { GetAllCertificatesResponse } from "../types/pos.types";

// ===================
// GET
// ===================

export const getAllCertificates = () => httpClient<GetAllCertificatesResponse>(`/certificates/all-certificates/summary`);

// export const getCategoryClient = (idOrSlug: string | number) =>
//   httpClient<Category>(`/categories/${idOrSlug}`);

// ===================
// MUTATIONS (Dashboard)
// // ===================
