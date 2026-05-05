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
    const roleClaim = decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
    const role = Array.isArray(roleClaim) ? roleClaim[0] : roleClaim || "";
    useAuthStore.getState().setAuth(data.accessToken, new Date(data.accessTokenExpiration).getTime(), decoded.Permission, decoded?.UserId, decoded?.email, decoded?.username, decoded?.BranchId, role);
  } catch {
    useAuthStore.getState().clearAuth();
    useAuthStore.getState().setInitialized(true);
  }
};
