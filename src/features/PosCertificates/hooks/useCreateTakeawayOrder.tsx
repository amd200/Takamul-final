import { useMutation, useQueryClient } from "@tanstack/react-query";
import useToast from "@/hooks/useToast";
import { handleApiError } from "@/lib/handleApiError";
import { handleApiSuccess } from "@/lib/handleApiSuccess";
import { createTakwayOrder } from "../services/pos";
import { CreateTakeawayOrder } from "../types/pos.types";
import { posKeys } from "../keys/pos.keys";
import { salesKeys } from "@/features/sales/keys/sales.keys";

export function useCreateTakwayOrder({ showSuccess = true }: { showSuccess?: boolean } = {}) {
  const queryClient = useQueryClient();
  const { notifyError, notifySuccess } = useToast();
  return useMutation({
    mutationFn: (data: CreateTakeawayOrder) => createTakwayOrder(data),
    onSuccess: (response) => {
      console.log(response);
      queryClient.invalidateQueries({ queryKey: salesKeys.all });
      queryClient.invalidateQueries({ queryKey: posKeys.all });
      if (showSuccess) {
        handleApiSuccess(response?.message, notifySuccess);
      }
    },
    onError: (error) => handleApiError(error, notifyError),
  });
}
