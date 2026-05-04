import { useAuthStore } from "@/store/authStore";
import { jwtDecode } from "jwt-decode";
import { AppJwtPayload } from "@/types";
import { LoginResponse } from "@/features/auth/types/auth.types";
import { apiClient } from "@/api/client";

const authChannel = new BroadcastChannel("auth");
authChannel.onmessage = (event) => {
  if (event.data?.type === "LOGOUT") {
    useAuthStore.getState().clearAuth();
    window.location.href = "/login";
  }
};

export const initAuth = async (): Promise<void> => {
  try {
    const { data } = await apiClient.post<LoginResponse>("/Auth/refresh-token");
    const decoded = jwtDecode<AppJwtPayload>(data.accessToken);
    useAuthStore.getState().setAuth(data.accessToken, new Date(data.accessTokenExpiration).getTime(), decoded.Permission, decoded?.UserId, decoded?.email, decoded?.username);
  } catch {
    useAuthStore.getState().clearAuth();
    useAuthStore.getState().setInitialized(true);
  }
};
