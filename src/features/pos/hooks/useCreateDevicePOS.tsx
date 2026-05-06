import { useMutation, useQueryClient } from "@tanstack/react-query";
import { posKeys } from "../keys/pos.keys";
import useToast from "@/hooks/useToast";
import { handleApiError } from "@/lib/handleApiError";
import { handleApiSuccess } from "@/lib/handleApiSuccess";
import { salesKeys } from "@/features/sales/keys/sales.keys";
import { CreateDevice } from "@/features/posDevice/services/posDevice";
import { CreateDevicePOS } from "@/features/posDevice/types/posDevice.types";

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
