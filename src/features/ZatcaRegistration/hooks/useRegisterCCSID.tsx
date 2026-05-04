import { useMutation, useQueryClient } from "@tanstack/react-query";
import useToast from "@/hooks/useToast";
import { handleApiError } from "@/lib/handleApiError";
import { handleApiSuccess } from "@/lib/handleApiSuccess";
import { registerCCSID } from "../services/zatcha";
import { RegisterCCSIDRequest } from "../types/zarcha.types";
import { zatchaKeys } from "../keys/zatca.keys";

export function useRegisterCCSID() {
  const queryClient = useQueryClient();
  const { notifyError, notifySuccess } = useToast();
  return useMutation({
    mutationFn: (data: RegisterCCSIDRequest) => registerCCSID(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: zatchaKeys.all });
      handleApiSuccess(response?.message, notifySuccess);
    },
    onError: (error) => handleApiError(error, notifyError),
  });
}
