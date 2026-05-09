import { useMutation, useQueryClient } from "@tanstack/react-query";

import useToast from "@/hooks/useToast";

import { handleApiError } from "@/lib/handleApiError";
import { handleApiSuccess } from "@/lib/handleApiSuccess";
import { sendWhatsAppTemplate } from "../services/whatsapp";
import { SendWhatsAppTemplateRequest } from "../types/whatsapp.types";

export interface SendWhatsAppTemplateMutationRequest {
  phoneNumberId: string;
  data: SendWhatsAppTemplateRequest;
}
export function useSendWhatsAppTemplate() {
  const { notifyError, notifySuccess } = useToast();

  return useMutation({
    mutationFn: ({ phoneNumberId, data }: SendWhatsAppTemplateMutationRequest) => sendWhatsAppTemplate(phoneNumberId, data),

    onSuccess: (response) => {
      handleApiSuccess(response, notifySuccess);
    },

    onError: (error) => notifyError("حدث خطأ اثناء إرسال الرسالة"),
  });
}
