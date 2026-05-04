import { useMutation, useQueryClient } from "@tanstack/react-query";
import { posKeys } from "../keys/pos.keys";
import useToast from "@/hooks/useToast";
import { handleApiError } from "@/lib/handleApiError";
import { handleApiSuccess } from "@/lib/handleApiSuccess";
import { createDeliveryOrder, CreateDevice, DeleteDevicePOS } from "../services/pos";
import { CreateDeliveryOrder, CreateDevicePOS } from "../types/pos.types";
import { salesKeys } from "@/features/sales/keys/sales.keys";

export function useDeleteDevicePOS() {
  const queryClient = useQueryClient();
  const { notifyError, notifySuccess } = useToast();
  return useMutation({
    mutationFn: (id: number) => DeleteDevicePOS(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: posKeys.all });
    },
    onError: (error) => handleApiError(error, notifyError),
  });
}
