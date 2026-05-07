import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import useToast from "@/hooks/useToast";
import { handleApiError } from "@/lib/handleApiError";
import { handleApiSuccess } from "@/lib/handleApiSuccess";
import { generateQR, getInvoiceStatisticsToday, sendInoviceSell } from "../services/zatchaInvoice";
import { GetInvoiceStatisticsTodayResponse } from "../types/zarchaInvoices.types";
import { zatcaInvoiceKeys } from "../keys/zatcaInvoice.keys";
import { salesKeys } from "@/features/sales/keys/sales.keys";

export function useSendInvoiceSell() {
  const queryClient = useQueryClient();
  const { notifyError, notifySuccess } = useToast();
  return useMutation({
    mutationFn: (data: { invoiceId: number }) => sendInoviceSell(data),
    onSuccess: (response) => {
      handleApiSuccess(response, notifySuccess);
      queryClient.invalidateQueries({
        queryKey: zatcaInvoiceKeys.invoiceStatisticsToday(),
      });
      queryClient.invalidateQueries({
        queryKey: salesKeys.all,
      });
    },
    onError: (error) => handleApiError(error, notifyError),
  });
}
