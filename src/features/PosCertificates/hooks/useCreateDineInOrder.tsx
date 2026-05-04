import { useMutation, useQueryClient } from "@tanstack/react-query";
import { posKeys } from "../keys/pos.keys";
import useToast from "@/hooks/useToast";
import { handleApiError } from "@/lib/handleApiError";
import { handleApiSuccess } from "@/lib/handleApiSuccess";
import { checkoutDineInOrder, createDeliveryOrder, createDineInOrder } from "../services/pos";
import { CheckoutDineInOrder, CreateDeliveryOrder, CreateDineInOrder } from "../types/pos.types";
import { salesKeys } from "@/features/sales/keys/sales.keys";

export function useCreateDineInOrder() {
  const queryClient = useQueryClient();
  const { notifyError, notifySuccess } = useToast();
  return useMutation({
    mutationFn: (data: CreateDineInOrder) => createDineInOrder(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: salesKeys.all });
      queryClient.invalidateQueries({ queryKey: posKeys.all });

      handleApiSuccess(response?.message, notifySuccess);
    },
    onError: (error) => handleApiError(error, notifyError),
  });
}

export function useCheckoutDineInOrder() {
  const queryClient = useQueryClient();
  const { notifyError, notifySuccess } = useToast();
  return useMutation({
    mutationFn: (data: CheckoutDineInOrder) => checkoutDineInOrder(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: salesKeys.all });
      queryClient.invalidateQueries({ queryKey: posKeys.all });

      handleApiSuccess(response?.message, notifySuccess);
    },
    onError: (error) => handleApiError(error, notifyError),
  });
}
