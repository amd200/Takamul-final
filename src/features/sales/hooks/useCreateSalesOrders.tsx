import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createSalesOrders } from "../services/sales";
import type { CreateSalesOrder } from "../types/sales.types";
import { salesKeys } from "../keys/sales.keys";
import { shiftsKeys } from "@/features/shifts/keys/shifts.keys";
import axios from "axios";
import useToast from "@/hooks/useToast";
import { handleApiError } from "@/lib/handleApiError";

export function useCreateSalesOrders() {
  const queryClient = useQueryClient();
  const { notifyError, notifySuccess } = useToast();

  return useMutation({
    mutationFn: (data: CreateSalesOrder) => createSalesOrders(data),
    onSuccess: (response) => {
      console.log(response);
      queryClient.invalidateQueries({ queryKey: salesKeys.all });
      queryClient.invalidateQueries({ queryKey: shiftsKeys.all });
      notifySuccess(response?.message)
    },
       onError: (error) => handleApiError(error, notifyError),

   
  });
}
