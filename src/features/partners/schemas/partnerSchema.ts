// features/partners/schema/partnerSchema.ts
import * as z from "zod";

export const createPartnerSchema = (t: (key: string) => string) =>
  z
    .object({
      name: z.string().min(3, t("validation_name_min_3")),

      phone: z.string(),

      commercialRegister: z.string().optional(),

      isTaxable: z.boolean(),

      taxNumber: z.string().optional(),

      countryId: z.number().optional(),
      cityId: z.number().optional(),
      stateId: z.number().optional(),

      district: z.string().optional(),
      street: z.string().optional(),
      postalCode: z.string().optional(),

      buildingNumber: z
        .string()
        .optional()
        .refine((val) => !val || /^\d+$/.test(val), {
          message: t("validation_numbers_only"),
        }),

      additionalNumber: z
        .string()
        .optional()
        .refine((val) => !val || /^\d+$/.test(val), {
          message: t("validation_numbers_only"),
        }),
    })
    .superRefine((data, ctx) => {
      if (!data.isTaxable) return;

      const requiredFields: { field: keyof typeof data; message: string }[] = [
        { field: "taxNumber", message: t("validation_tax_number_required") },
        { field: "countryId", message: t("validation_country_required") },
        { field: "cityId", message: t("validation_region_required") },
        { field: "stateId", message: t("validation_city_required") },
        { field: "district", message: t("validation_district_required") },
        { field: "street", message: t("validation_street_required") },
        { field: "postalCode", message: t("validation_postal_code_required") },
        { field: "buildingNumber", message: t("validation_building_number_required") },
        { field: "additionalNumber", message: t("validation_additional_number_required") },
      ];

      requiredFields.forEach(({ field, message }) => {
        if (!data[field]) {
          ctx.addIssue({ path: [field], message, code: z.ZodIssueCode.custom });
        }
      });

      if (!data.commercialRegister) {
        ctx.addIssue({ path: ["commercialRegister"], message: t("validation_commercial_register_required"), code: z.ZodIssueCode.custom });
      } else if (!/^\d+$/.test(data.commercialRegister)) {
        ctx.addIssue({ path: ["commercialRegister"], message: t("validation_numbers_only"), code: z.ZodIssueCode.custom });
      }
    });

export type PartnerFormValues = z.infer<ReturnType<typeof createPartnerSchema>>;
