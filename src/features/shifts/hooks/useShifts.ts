import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAllShifts, openShift, closeShift, getEmployeesByBranch, getShiftReport } from "../services/shifts.service";
import { shiftsKeys } from "../keys/shifts.keys";
import { toast } from "react-toastify";
import { salesKeys } from "@/features/sales/keys/sales.keys";
import { handleApiError } from "@/lib/handleApiError";
import useToast from "@/hooks/useToast";
import { apiClient } from "@/api/client";
import { useAuthStore } from "@/store/authStore";
import { jwtDecode } from "jwt-decode";
import { AppJwtPayload } from "@/types";
import { LoginResponse } from "@/features/auth/types/auth.types";

export const useGetAllShifts = () => {
  return useQuery({
    queryKey: shiftsKeys.lists(),
    queryFn: getAllShifts,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    staleTime: 0,
  });
};

export const useOpenShift = () => {
  const queryClient = useQueryClient();
  const {notifyError} = useToast();
  return useMutation({
    mutationFn: openShift,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: shiftsKeys.all });
      
      // Refresh token to get the new ShiftId in the JWT
      try {
        const { data } = await apiClient.post<LoginResponse>("/Auth/refresh-token");
        const decoded = jwtDecode<AppJwtPayload>(data.accessToken);
        useAuthStore.getState().setAuth(
          data.accessToken, 
          new Date(data.accessTokenExpiration).getTime(), 
          decoded.Permission, 
          decoded?.UserId, 
          decoded?.email, 
          decoded?.username, 
          decoded?.BranchId, 
          decoded?.ShiftId
        );
      } catch (err) {
        console.error("Failed to refresh token after opening shift:", err);
      }

      toast.success("تم فتح الوردية بنجاح");
    },
    onError: (error: any) => {
      handleApiError(error, notifyError);
    },
  });
};

export const useCloseShift = () => {
  const queryClient = useQueryClient();
  const {notifyError} = useToast();
  return useMutation({
    mutationFn: closeShift,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shiftsKeys.all });
      queryClient.invalidateQueries({ queryKey: salesKeys.all });
      toast.success("تم إغلاق الوردية بنجاح");
    },
    onError: (error: any) => {
     handleApiError(error, notifyError);
    },
  });
};

export const useGetEmployeesByBranch = (branchId: number) => {
  return useQuery({
    queryKey: [...shiftsKeys.all, "employees", branchId],
    queryFn: () => getEmployeesByBranch(branchId),
    enabled: !!branchId,
  });
};

export const useGetShiftReport = (id: number) => {
  return useQuery({
    queryKey: [...shiftsKeys.all, "report", id],
    queryFn: () => getShiftReport(id),
    enabled: !!id,
    refetchOnMount: "always",
    staleTime: 0,
  });
};
