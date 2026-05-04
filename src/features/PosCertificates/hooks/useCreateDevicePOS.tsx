import { useMutation, useQueryClient } from "@tanstack/react-query";
import { posKeys } from "../keys/pos.keys";
import useToast from "@/hooks/useToast";
import { handleApiError } from "@/lib/handleApiError";
import { handleApiSuccess } from "@/lib/handleApiSuccess";
import { createDeliveryOrder, CreateDevice } from "../services/pos";
import { CreateDeliveryOrder, CreateDevicePOS } from "../types/pos.types";
import { salesKeys } from "@/features/sales/keys/sales.keys";

export function useCreateDevicePOS() {
  const queryClient = useQueryClient();
  const { notifyError, notifySuccess } = useToast();
  return useMutation({
    mutationFn: (data: CreateDevicePOS) => CreateDevice(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: posKeys.all });
      handleApiSuccess(response?.message, notifySuccess);
    },
    onError: (error) => handleApiError(error, notifyError),
  });
}
