import { useMutation, useQueryClient } from "@tanstack/react-query";
import { login } from "../services/auth";
import { handleApiSuccess } from "@/lib/handleApiSuccess";
import useToast from "@/hooks/useToast";
import { LoginPayload } from "../types/auth.types";
import { handleApiError } from "@/lib/handleApiError";
import { useAuthStore } from "@/store/authStore";
import { jwtDecode } from "jwt-decode";
import { AppJwtPayload } from "@/types";

type TokenPayload = {
  sub: string;
  name?: string;
  role?: string;
  exp: number;
};

export const useLogin = () => {
  const { notifyError, notifySuccess } = useToast();
  const setAuth = useAuthStore((s) => s.setAuth);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: LoginPayload) => login(data),

    onSuccess: (response) => {
      handleApiSuccess(response, notifySuccess);

      if (!response?.accessToken || !response?.accessTokenExpiration) return;

      const token = response.accessToken;

      const expiresAt = new Date(response.accessTokenExpiration).getTime();

      const decoded = jwtDecode<AppJwtPayload>(token);

      const roleClaim = decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
      const role = Array.isArray(roleClaim) ? roleClaim[0] : roleClaim || "";
      setAuth(token, expiresAt, decoded?.Permission, decoded?.UserId, decoded?.email, decoded?.username, decoded?.BranchId, decoded?.ShiftId);
    },

    // onError: (error) => handleApiError(error, notifyError),
  });
};
