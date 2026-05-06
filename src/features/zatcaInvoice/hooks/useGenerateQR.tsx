import { useMutation, useQueryClient } from "@tanstack/react-query";
import useToast from "@/hooks/useToast";
import { handleApiError } from "@/lib/handleApiError";
import { handleApiSuccess } from "@/lib/handleApiSuccess";
import { generateQR } from "../services/zatchaInvoice";
import { GenereateQRRequest } from "../types/zarchaInvoices.types";

export function useGenerateQR() {
  const queryClient = useQueryClient();
  const { notifyError, notifySuccess } = useToast();
  return useMutation({
    mutationFn: (data: GenereateQRRequest) => generateQR(data),
    onSuccess: (response) => {},
    onError: (error) => handleApiError(error, notifyError),
  });
}
