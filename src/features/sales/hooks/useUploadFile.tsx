import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createSalesOrders, uploadFile } from "../services/sales";
import type { CreateSalesOrder } from "../types/sales.types";
import { salesKeys } from "../keys/sales.keys";
import { shiftsKeys } from "@/features/shifts/keys/shifts.keys";
import axios from "axios";
import useToast from "@/hooks/useToast";
import { handleApiError } from "@/lib/handleApiError";

export function useUploadFile() {
  const queryClient = useQueryClient();
  const { notifyError, notifySuccess } = useToast();
  return useMutation({
    mutationFn: (data: FormData) => uploadFile(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: salesKeys.all });
      notifySuccess(response?.message);
    },
    onError: (error) => {
      console.log(error);
      return handleApiError(error, notifyError);
    },
  });
}
