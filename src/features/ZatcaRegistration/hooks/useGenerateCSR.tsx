import { useMutation, useQueryClient } from "@tanstack/react-query";
import useToast from "@/hooks/useToast";
import { handleApiError } from "@/lib/handleApiError";
import { handleApiSuccess } from "@/lib/handleApiSuccess";
import { generateCSR } from "../services/zatcha";
import { GenerateCSR } from "../types/zarcha.types";
import { zatchaKeys } from "../keys/zatca.keys";

export function useGenerateCSR() {
  const queryClient = useQueryClient();
  const { notifyError, notifySuccess } = useToast();
  return useMutation({
    mutationFn: (data: GenerateCSR) => generateCSR(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: zatchaKeys.all });
      handleApiSuccess(response?.message, notifySuccess);
    },
    onError: (error) => handleApiError(error, notifyError),
  });
}
