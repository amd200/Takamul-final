import axios from "axios";
import { apiClient } from "./client";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
type HttpClientOptions = {
  method?: HttpMethod;
  params?: Record<string, any>;
  data?: any;
  headers?: Record<string, string>;
  responseType?: "json" | "blob";
  baseURL?: string;
  withCredentials?: boolean; // ← جديد
};

export async function httpClient<T>(url: string, options?: HttpClientOptions): Promise<T> {
  try {
    const response = await apiClient({
      baseURL: options?.baseURL,
      url,
      method: options?.method ?? "GET",
      params: options?.params,
      data: options?.data,
      headers: options?.headers,
      responseType: options?.responseType ?? "json",
      withCredentials: options?.withCredentials,
    });

    return response.data as T;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw error.response?.data ?? new Error("حدث خطأ أثناء الاتصال بالسيرفر");
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error("حدث خطأ غير متوقع");
  }
}
