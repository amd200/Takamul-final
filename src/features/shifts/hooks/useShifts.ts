import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAllShifts, openShift, closeShift } from "../services/shifts.service";
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
      const msg = error?.error || error?.message || "حدث خطأ أثناء فتح الوردية";
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
      toast.error(error?.response?.data?.message || "حدث خطأ أثناء إغلاق الوردية");
    },
  });
};
