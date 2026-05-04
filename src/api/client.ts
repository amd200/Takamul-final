// apiClient.ts
import axios from "axios";
import { useAuthStore } from "@/store/authStore";
import { jwtDecode } from "jwt-decode";
import { AppJwtPayload } from "@/types";
import { LoginResponse } from "@/features/auth/types/auth.types";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue: { resolve: (token: string) => void; reject: (err: any) => void }[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token!);
  });
  failedQueue = [];
};

// Request
apiClient.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Response
apiClient.interceptors.response.use(
  (response) => response,
  async (err) => {
    const originalRequest = err.config;

    if (originalRequest.url?.includes("/Auth/refresh-token")) {
      useAuthStore.getState().clearAuth();
      return Promise.reject(err);
    }

    if (err.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers["Authorization"] = "Bearer " + token;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      return new Promise((resolve, reject) => {
        apiClient
          .post<LoginResponse>("/Auth/refresh-token")
          .then(({ data }) => {
            const decoded = jwtDecode<AppJwtPayload>(data.accessToken);
            useAuthStore.getState().setAuth(
              data.accessToken,
              new Date(data.accessTokenExpiration).getTime(),
              decoded.Permission,
              decoded?.UserId,
              decoded?.email,
              decoded?.username,
            );
            apiClient.defaults.headers.common["Authorization"] = "Bearer " + data.accessToken;
            originalRequest.headers["Authorization"] = "Bearer " + data.accessToken;
            processQueue(null, data.accessToken);
            resolve(apiClient(originalRequest));
          })
          .catch((err) => {
            processQueue(err, null);  
            useAuthStore.getState().clearAuth();
            reject(err);
          })
          .finally(() => {
            isRefreshing = false;
          });
      });
    }

    return Promise.reject(err);
  },
);