import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { settingsKeys } from "../keys/settings.keys";
import { SettingsResponse } from "../types/settings.types";
import { getAllSettings } from "../services/settings";
import { useSettingsStore } from "../store/settingsStore";
import { useAuthStore } from "@/store/authStore";

export const useGetAllSettings = () => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const setSettings = useSettingsStore((s) => s.setSettings);
  const query = useQuery<SettingsResponse>({
    queryKey: settingsKeys.list(),
    queryFn: getAllSettings,
    staleTime: Infinity,
    enabled: !!accessToken,
  });

  useEffect(() => {
    if (query.data) setSettings(query.data);
  }, [query.data]);

  return query;
};
