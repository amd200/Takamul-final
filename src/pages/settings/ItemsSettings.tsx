import React from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useSettings } from "@/context/SettingsContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Field, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUpdateItemsSettings } from "@/features/settings/hooks/useUpdateSettings";

export default function ItemsSettings() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { systemSettings, updateSystemSettings } = useSettings();
  const { mutate: updateItems } = useUpdateItemsSettings();

  const handleUpdate = (field: string, value: any) => {
    updateSystemSettings({
      items: {
        ...(systemSettings.items as any),
        [field]: value,
      },
    });
  };

  const onSave = () => {
    updateItems({
      itemTax: systemSettings.items.itemTax,
      itemExpiry: systemSettings.items.itemExpiry,
      showWarehouseItems: systemSettings.items.showWarehouseItems === "إظهار جميع الأصناف حتى لو رصيدها صفر",
      enableSecondLanguageItemName: systemSettings.items.enableSecondLangName,
      showProductBalanceAtSale: systemSettings.items.showProductBalanceAtSale,
      allowPriceChangeOnSale: true,
      taxPhase: systemSettings.items.taxPhase,
    });
  };

  const enableStr = t("enable_option") || "تمكين";
  const disableStr = t("disable_option") || "تعطيل";

  return (
    <div className="space-y-4 pb-24">
      <div className="text-sm text-gray-500 flex items-center gap-1">
        <span className="cursor-pointer hover:text-[var(--primary)]" onClick={() => navigate("/")}>
          {t("home")}
        </span>
        <span>/</span>
        <span className="cursor-pointer hover:text-[var(--primary)]" onClick={() => navigate("/settings/system")}>
          إعدادات
        </span>
        <span>/</span>
        <span className="text-gray-900">{t("items_settings") || "إعدادات الأصناف"}</span>
      </div>

      <Card>
        <CardHeader className="max-md:flex max-md:flex-col">
          <CardTitle>{t("items_settings") || "إعدادات الأصناف"}</CardTitle>
          <CardDescription>{t("required_fields_note") || "يرجى تحديث المعلومات الواردة أدناه. تسميات الحقول التي تحمل علامة * هي حقول اجبارية"}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
            <Field>
              <FieldLabel className="gap-x-0">{t("show_warehouse_items_setting")} <span className="text-red-500">*</span></FieldLabel>
              <Select value={systemSettings.items.showWarehouseItems} onValueChange={(val) => handleUpdate("showWarehouseItems", val)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="إظهار جميع الأصناف حتى لو رصيدها صفر">{t("show_all_items_even_if_balance_is_zero")}</SelectItem>
                  <SelectItem value="عدم إظهار جميع الأصناف حتى لو رصيدها صفر">{t("dont_show_all_items_even_if_balance_is_zero")}</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel className="gap-x-0">{t("show_product_balance_at_sale")} <span className="text-red-500">*</span></FieldLabel>
              <Select value={systemSettings.items.showProductBalanceAtSale ? enableStr : disableStr} onValueChange={(val) => handleUpdate("showProductBalanceAtSale", val === enableStr)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={enableStr}>{enableStr}</SelectItem>
                  <SelectItem value={disableStr}>{disableStr}</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="flex flex-col-reverse lg:flex-row justify-between py-4 border px-3 gap-3 rounded border-gray-100 mt-8">
            <Button size="lg" variant="destructive" type="button" className="w-full lg:w-auto px-8 h-12" onClick={() => navigate(-1)}>
              إلغاء
            </Button>
            <div className="flex flex-col-reverse lg:flex-row items-center gap-3 w-full lg:w-auto">
              <Button size="lg" type="button" onClick={onSave} className="w-full lg:w-auto px-8 h-12 text-base">
                {t("save_settings") || "حفظ الإعدادات"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
