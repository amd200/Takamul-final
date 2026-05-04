import { useMutation, useQueryClient } from "@tanstack/react-query";
import { posKeys } from "../keys/pos.keys";
import useToast from "@/hooks/useToast";
import { handleApiError } from "@/lib/handleApiError";
import { handleApiSuccess } from "@/lib/handleApiSuccess";
import { cancelOrder, createDeliveryOrder } from "../services/pos";
import { CreateDeliveryOrder } from "../types/pos.types";
import { salesKeys } from "@/features/sales/keys/sales.keys";
import { tablesKeys } from "@/features/tables/keys/tables.keys";

export function useCancelOrder() {
  const queryClient = useQueryClient();
  const { notifyError, notifySuccess } = useToast();
  return useMutation({
    mutationFn: (id: number) => cancelOrder(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: salesKeys.all });
      queryClient.invalidateQueries({ queryKey: posKeys.all });
      queryClient.invalidateQueries({ queryKey: tablesKeys.all });
      handleApiSuccess(response?.message, notifySuccess);
    },
    onError: (error) => handleApiError(error, notifyError),
  });
}
