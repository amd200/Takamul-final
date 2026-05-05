import { useMutation, useQueryClient } from "@tanstack/react-query";
import { login, logout } from "../services/auth";
import { handleApiSuccess } from "@/lib/handleApiSuccess";
import useToast from "@/hooks/useToast";
import { LoginPayload } from "../types/auth.types";
import { handleApiError } from "@/lib/handleApiError";
import { useAuthStore } from "@/store/authStore";
import { jwtDecode } from "jwt-decode";
import { AppJwtPayload } from "@/types";

export const useLogout = () => {
  const { notifyError, notifySuccess } = useToast();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => logout(),
    onSuccess: (response) => {
      handleApiSuccess(response, notifySuccess);
      new BroadcastChannel("auth").postMessage("logout");
      useAuthStore.getState().clearAuth();
      queryClient.clear();
      window.location.href = "/login";
    },
    onError: (error) => handleApiError(error, notifyError),
  });
};
