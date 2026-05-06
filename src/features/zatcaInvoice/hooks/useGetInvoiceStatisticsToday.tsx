import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import useToast from "@/hooks/useToast";
import { handleApiError } from "@/lib/handleApiError";
import { handleApiSuccess } from "@/lib/handleApiSuccess";
import { generateQR, getInvoiceStatisticsToday } from "../services/zatchaInvoice";
import { GetInvoiceStatisticsTodayResponse } from "../types/zarchaInvoices.types";
import { zatcaInvoiceKeys } from "../keys/zatcaInvoice.keys";

export function useGetInvoiceStatisticsToday() {
  const queryClient = useQueryClient();
  const { notifyError, notifySuccess } = useToast();
  return useQuery<GetInvoiceStatisticsTodayResponse>({
    queryKey: zatcaInvoiceKeys.invoiceStatisticsToday(),
    queryFn: () => getInvoiceStatisticsToday(),
  });
}
