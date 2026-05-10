import axios from "axios";
import { useAuthStore } from "@/store/authStore";
import { jwtDecode } from "jwt-decode";
import { AppJwtPayload } from "@/types";
import { LoginResponse } from "@/features/auth/types/auth.types";

const authChannel = new BroadcastChannel("auth");

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
});

const REFRESH_TIMEOUT = 10_000;

let isRefreshing = false;
let failedQueue: { resolve: (token: string) => void; reject: (err: unknown) => void }[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token!);
  });
  failedQueue = [];
};

const logout = () => {
  authChannel.postMessage("logout");
  useAuthStore.getState().clearAuth();
};

apiClient.interceptors.request.use((config) => {
  const isExternal = config.baseURL && !config.baseURL.startsWith(import.meta.env.VITE_API_BASE_URL);

  if (!isExternal) {
    const { accessToken } = useAuthStore.getState();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
  }

  return config;
});
apiClient.interceptors.response.use(
  (response) => response,
  async (err) => {
    const originalRequest = err.config;

    const isAuthRoute = originalRequest.url?.includes("/Auth/login") || originalRequest.url?.includes("/Auth/refresh-token");

    if (isAuthRoute) return Promise.reject(err);

    if (err.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers["Authorization"] = "Bearer " + token;
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshRequest = apiClient.post<LoginResponse>("/Auth/refresh-token");

      const timeoutPromise = new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Token refresh timeout")), REFRESH_TIMEOUT));

      return Promise.race([refreshRequest, timeoutPromise])
        .then(({ data }) => {
          const decoded = jwtDecode<AppJwtPayload>(data.accessToken);
          useAuthStore.getState().setAuth(data.accessToken, new Date(data.accessTokenExpiration).getTime(), decoded.Permission, decoded?.UserId, decoded?.email, decoded?.username, decoded?.BranchId, decoded?.ShiftId);
          apiClient.defaults.headers.common["Authorization"] = "Bearer " + data.accessToken;
          originalRequest.headers["Authorization"] = "Bearer " + data.accessToken;
          processQueue(null, data.accessToken);
          return apiClient(originalRequest);
        })
        .catch((refreshErr) => {
          processQueue(refreshErr, null);
          logout();
          return Promise.reject(refreshErr);
        })
        .finally(() => {
          isRefreshing = false;
        });
    }

    return Promise.reject(err);
  },
);

export const closeAuthChannel = () => authChannel.close();
