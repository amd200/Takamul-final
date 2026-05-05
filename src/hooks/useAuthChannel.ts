// hooks/useAuthChannel.ts
import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

export const useAuthChannel = () => {
  useEffect(() => {
    const channel = new BroadcastChannel("auth");

    channel.onmessage = (event) => {
      if (event.data === "logout") {
        const { accessToken } = useAuthStore.getState();

        if (!accessToken) return;

        useAuthStore.getState().clearAuth();
        window.location.href = "/login";
      }
    };

    return () => channel.close();
  }, []);
};