import type { ApiResponse, PaginationMeta } from "@/types";

export interface SendWhatsAppTemplateRequest {
  messaging_product?: "whatsapp";
  to: string;
  type?: "template";
  template: {
    name: string;
    language: {
      code: string;
    };

    components?: {
      type: string;
      parameters?: any[];
      sub_type?: string;
      index?: number;
    }[];
  };
}
export interface SendWhatsAppTemplateResponse {
  messaging_product: "whatsapp";

  contacts: {
    input: string;
    wa_id: string;
  }[];

  messages: {
    id: string;
    message_status: string;
  }[];
}
