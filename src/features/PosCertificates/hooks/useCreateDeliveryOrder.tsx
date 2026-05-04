import { useMutation, useQueryClient } from "@tanstack/react-query";
import { posKeys } from "../keys/pos.keys";
import useToast from "@/hooks/useToast";
import { handleApiError } from "@/lib/handleApiError";
import { handleApiSuccess } from "@/lib/handleApiSuccess";
import { createDeliveryOrder } from "../services/pos";
import { CreateDeliveryOrder } from "../types/pos.types";
import { salesKeys } from "@/features/sales/keys/sales.keys";

export function useCreateDeliveryOrder({ showSuccess = true }: { showSuccess?: boolean } = {}) {
  const queryClient = useQueryClient();
  const { notifyError, notifySuccess } = useToast();
  return useMutation({
    mutationFn: (data: CreateDeliveryOrder) => createDeliveryOrder(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: salesKeys.all });
      queryClient.invalidateQueries({ queryKey: posKeys.all });
      if (showSuccess) {
        handleApiSuccess(response?.message, notifySuccess);
      }
    },
    onError: (error) => handleApiError(error, notifyError),
  });
}
