import { create } from "zustand";
import { apiClient } from "@/api/client";

export interface BranchInfo {
  id: number;
  code: string;
  name: string;
  nameEn: string;
  imageUrl: string | null;
  businessName: string;
  commercialRegister: string;
  taxNumber: string;
  footerNote: string;
  email: string;
  phone: string;
  address: string | null;
  countryId: number;
  countryName: string;
  cityName: string;
  stateName: string;
  district: string;
  street: string;
  buildingNumber: string;
  postalCode: string;
  organizationName: string;
  organizationUnitName: string;
  industryBusinessCategory: string;
  environment: string;
  isActive: boolean;
}

interface BranchStore {
  branch: BranchInfo | null;
  loading: boolean;
  error: string | null;

  // fetchBranch: () => Promise<void>;
  setBranch: (branch: BranchInfo) => void;
}

export const useBranchStore = create<BranchStore>((set) => ({
  branch: null,
  loading: false,
  error: null,

  setBranch: (branch) => set({ branch }),

  // fetchBranch: async () => {
  //   try {
  //     set({ loading: true, error: null });

  //     const response = await apiClient.get("/Branch/Employeebranch");
  //     const branchData = response.data?.data || response.data;

  //     set({
  //       branch: branchData,
  //       loading: false,
  //     });
  //   } catch (err: any) {
  //     set({
  //       error: err.message || "Failed to fetch branch",
  //       loading: false,
  //     });
  //   }
  // },
}));
