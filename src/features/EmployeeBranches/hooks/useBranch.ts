import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { useAuthStore } from "@/store/authStore";
import { useBranchStore } from "@/store/employeeStore";

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

export const useBranch = () => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const setBranch = useBranchStore((state) => state?.setBranch);

  return useQuery<BranchInfo>({
    queryKey: ["employee-branch"],
    queryFn: async () => {
      const response = await apiClient.get("/Branch/Employeebranch");
      const branchData = response.data;
      setBranch(branchData);
      return branchData;
    },
    staleTime: 1000 * 60 * 60,
    enabled: !!accessToken,
  });
};
