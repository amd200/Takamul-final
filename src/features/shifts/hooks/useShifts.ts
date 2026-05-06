import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAllShifts, openShift, closeShift, getEmployeesByBranch, getShiftReport } from "../services/shifts.service";
import { shiftsKeys } from "../keys/shifts.keys";
import { toast } from "react-toastify";
import { salesKeys } from "@/features/sales/keys/sales.keys";
import { handleApiError } from "@/lib/handleApiError";
import useToast from "@/hooks/useToast";

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shiftsKeys.all });
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
