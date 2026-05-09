import { httpClient } from "@/api/httpClient";
import { GetAllTablesResponse } from "@/features/tables/types/tables.types";
import { SendWhatsAppTemplateRequest, SendWhatsAppTemplateResponse } from "../types/whatsapp.types";
import { useSettingsStore } from "@/features/settings/store/settingsStore";

// ===================
// GET
// ===================

export const sendWhatsAppTemplate = (phoneNumberId: string, data: SendWhatsAppTemplateRequest) => {
  const accessToken = useSettingsStore.getState().settings.whatsApp.whatsAppAccessToken;
  console.log(accessToken)

  return httpClient<SendWhatsAppTemplateResponse>(`/messages`, {
    method: "POST",
    data,
    baseURL: `https://graph.facebook.com/v25.0/${phoneNumberId}`,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    withCredentials: false,
  });
};
