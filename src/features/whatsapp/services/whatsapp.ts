import { httpClient } from "@/api/httpClient";
import { GetAllTablesResponse } from "@/features/tables/types/tables.types";
import { SendWhatsAppTemplateRequest, SendWhatsAppTemplateResponse } from "../types/whatsapp.types";
import { useSettingsStore } from "@/features/settings/store/settingsStore";

// ===================
// GET
// ===================

import axios from "axios";

// instance نظيفة بدون أي interceptors
const facebookClient = axios.create();

export const sendWhatsAppTemplate = (phoneNumberId: string, data: SendWhatsAppTemplateRequest) => {
  const accessToken = useSettingsStore.getState().settings.whatsApp.whatsAppAccessToken;

  return facebookClient.post<SendWhatsAppTemplateResponse>(`https://graph.facebook.com/v25.0/${phoneNumberId}/messages`, data, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    withCredentials: false,
  });
};
