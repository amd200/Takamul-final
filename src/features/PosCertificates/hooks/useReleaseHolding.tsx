import { useMutation, useQueryClient } from "@tanstack/react-query";
import { posKeys } from "../keys/pos.keys";
import useToast from "@/hooks/useToast";
import { handleApiError } from "@/lib/handleApiError";
import { handleApiSuccess } from "@/lib/handleApiSuccess";
import { createDeliveryOrder } from "../services/pos";
import { CreateDeliveryOrder } from "../types/pos.types";
import { salesKeys } from "@/features/sales/keys/sales.keys";
import { CreateSalesOrder } from "@/features/sales/types/sales.types";
import { releaseHolding } from "@/features/sales/services/sales";

export function useReleaseHolding() {
  const queryClient = useQueryClient();
  const { notifyError, notifySuccess } = useToast();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CreateSalesOrder["payments"] }) => releaseHolding({ id, data }),
    onSuccess: (response) => {
      console.log(response);
      queryClient.invalidateQueries({ queryKey: salesKeys.all });
      queryClient.invalidateQueries({ queryKey: posKeys.all });
      handleApiSuccess(response?.message, notifySuccess);
    },
    onError: (error) => handleApiError(error, notifyError),
  });
}
