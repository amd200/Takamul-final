import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAllShifts, openShift, closeShift, getEmployeesByBranch } from "../services/shifts.service";
import { shiftsKeys } from "../keys/shifts.keys";
import { toast } from "react-toastify";

export const useGetAllShifts = () => {
  return useQuery({
    queryKey: shiftsKeys.lists(),
    queryFn: getAllShifts,
  });
};

export const useOpenShift = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: openShift,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shiftsKeys.all });
      toast.success("تم فتح الوردية بنجاح");
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.error || error?.response?.data?.message || error?.message || "حدث خطأ أثناء فتح الوردية";
      toast.error(msg);
    },
  });
};

export const useCloseShift = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: closeShift,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shiftsKeys.all });
      toast.success("تم إغلاق الوردية بنجاح");
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.error || error?.response?.data?.message || error?.message || "حدث خطأ أثناء إغلاق الوردية";
      toast.error(msg);
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
