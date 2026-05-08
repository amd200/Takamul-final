import React from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useSettings } from "@/context/SettingsContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { Field, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function EmailSettings() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { systemSettings, updateSystemSettings, saveSettings } = useSettings();

  const handleUpdate = (field: string, value: any) => {
    updateSystemSettings({
      email: {
        ...(systemSettings.email as any),
        [field]: value,
      },
    });
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500 flex items-center gap-1">
        <span className="cursor-pointer hover:text-[var(--primary)]" onClick={() => navigate("/")}>
          {t("home")}
        </span>
        <span>/</span>
        <span className="cursor-pointer hover:text-[var(--primary)]" onClick={() => navigate("/settings/system")}>
          إعدادات
        </span>
        <span>/</span>
        <span className="text-gray-900">{t("email_settings") || "البريد الإلكتروني"}</span>
      </div>

      <Card>
        <CardHeader className="max-md:flex max-md:flex-col">
          <CardTitle>{t("email_settings") || "البريد الإلكتروني"}</CardTitle>
          <CardDescription>{t("required_fields_note") || "يرجى تحديث المعلومات الواردة أدناه. تسميات الحقول التي تحمل علامة * هي حقول اجبارية"}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
            <Field>
              <FieldLabel className="gap-x-0">{t("email_protocol")} <span className="text-red-500">*</span></FieldLabel>
              <Select value={systemSettings.email.protocol} onValueChange={(val) => handleUpdate("protocol", val)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SMTP">SMTP</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel className="gap-x-0">{t("smtp_host")}</FieldLabel>
              <Input type="text" value={systemSettings.email.smtpHost} onChange={(e) => handleUpdate("smtpHost", e.target.value)} className="w-full" />
            </Field>

            <Field>
              <FieldLabel className="gap-x-0">{t("smtp_user")}</FieldLabel>
              <Input type="text" value={systemSettings.email.smtpUser} onChange={(e) => handleUpdate("smtpUser", e.target.value)} className="w-full" />
            </Field>

            <Field>
              <FieldLabel className="gap-x-0">{t("smtp_password")}</FieldLabel>
              <Input type="password" value={systemSettings.email.smtpPassword} onChange={(e) => handleUpdate("smtpPassword", e.target.value)} className="w-full" />
            </Field>

            <Field>
              <FieldLabel className="gap-x-0">{t("smtp_port")}</FieldLabel>
              <Input type="number" value={systemSettings.email.smtpPort} onChange={(e) => handleUpdate("smtpPort", parseInt(e.target.value))} className="w-full" />
            </Field>

            <Field>
              <FieldLabel className="gap-x-0">{t("smtp_encryption")}</FieldLabel>
              <Select value={systemSettings.email.smtpEncryption} onValueChange={(val) => handleUpdate("smtpEncryption", val)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SSL">SSL</SelectItem>
                  <SelectItem value="TLS">TLS</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="flex flex-col-reverse lg:flex-row justify-between py-4 border px-3 gap-3 rounded border-gray-100 mt-8">
            <Button size="lg" variant="destructive" type="button" className="w-full lg:w-auto px-8 h-12" onClick={() => navigate(-1)}>
              إلغاء
            </Button>
            <div className="flex flex-col-reverse lg:flex-row items-center gap-3 w-full lg:w-auto">
              <Button size="lg" type="button" onClick={() => { saveSettings(); navigate("/settings/system"); }} className="w-full lg:w-auto px-8 h-12 text-base">
                {t("save_settings") || "حفظ الإعدادات"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
