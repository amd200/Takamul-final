// initAuth.ts
import { useAuthStore } from "@/store/authStore";
import { jwtDecode } from "jwt-decode";
import { AppJwtPayload } from "@/types";
import { LoginResponse } from "@/features/auth/types/auth.types";
import { apiClient } from "@/api/client";

export const initAuth = async (): Promise<void> => {
  try {
    const { data } = await apiClient.post<LoginResponse>("/Auth/refresh-token");
    const decoded = jwtDecode<AppJwtPayload>(data.accessToken);
    console.log(data?.accessToken);
    console.log(decoded);
    useAuthStore.getState().setAuth(data.accessToken, new Date(data.accessTokenExpiration).getTime(), decoded.Permission, decoded?.UserId, decoded?.email, decoded?.username);
  } catch {
    useAuthStore.getState().clearAuth();
    useAuthStore.getState().setInitialized(true);
  }
};
