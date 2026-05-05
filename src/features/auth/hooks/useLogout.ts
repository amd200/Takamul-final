// features/auth/hooks/useLogout.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { login, logout } from "../services/auth";
import { handleApiSuccess } from "@/lib/handleApiSuccess";
import useToast from "@/hooks/useToast";
import { handleApiError } from "@/lib/handleApiError";
import { useAuthStore } from "@/store/authStore";

export const useLogout = () => {
  const { notifyError, notifySuccess } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => logout(),
    onSuccess: (response) => {
      handleApiSuccess(response, notifySuccess);

      const channel = new BroadcastChannel("auth");
      channel.postMessage("logout");
      channel.close();

      useAuthStore.getState().clearAuth();
      queryClient.clear();
      window.location.href = "/login";
    },
    onError: (error) => handleApiError(error, notifyError),
  });
};
