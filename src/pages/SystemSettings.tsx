import React from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useSettings, type SystemSettings } from "@/context/SettingsContext";
import { Settings, Star, Percent, FileText, Printer, Save, Truck, Coins, Users, DollarSign, Grid3x3, ArrowLeft, Tag, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";
import { FileUpload, FileUploadDropzone, FileUploadTrigger, FileUploadList, FileUploadItem, FileUploadItemPreview, FileUploadItemMetadata, FileUploadItemDelete } from "@/components/ui/file-upload";

import DeliveryCompanies from "./DeliveryCompanies";
import Currencies from "./Currencies";
import CategoryDiscount from "./CategoryDiscount";
import TablesList from "./Tables";
import TaxesList from "./TaxesList";
import { useUpdateTobaccoFees } from "@/features/settings/hooks/useUpdateTobaccoFees";
import { useUpdateGeneralSettings, useUpdateItemsSettings, useUpdateTaxSettings } from "@/features/settings/hooks/useUpdateSettings";
import { useSettingsStore, selectItems } from "@/features/settings/store/settingsStore";
import { useGetAllSettings } from "@/features/settings/hooks/useGetAllSettings";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field, FieldLabel } from "@/components/ui/field";

interface SettingSectionProps {
  id: string;
  title: string;
  children: React.ReactNode;
  onSave?: () => void;
  hideSave?: boolean;
}

const SettingSection: React.FC<SettingSectionProps> = ({ id, title, children, onSave, hideSave }) => {
  const { t } = useLanguage();
  return (
    <section id={id} className="bg-[var(--bg-card)] rounded-xl shadow-sm border border-[var(--border)] overflow-hidden mb-8 scroll-mt-24">
      <div className="p-4 border-b border-[var(--border)] bg-[var(--bg-main)]/50 flex items-center justify-between">
        <h2 className="text-lg font-bold text-[var(--text-main)] flex items-center gap-2">
          <div className="w-1 h-6 bg-[var(--primary)] rounded-full"></div>
          {title}
        </h2>
      </div>
      <div className="p-6">
        {children}
        {!hideSave && (
          <div className="mt-8 pt-6 border-t border-[var(--border)] flex justify-start">
            <Button onClick={onSave} className="flex items-center gap-2 font-bold px-6">
              <Save size={18} />
              {t("save_settings")}
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

export default function SystemSettings() {
  const { t, direction } = useLanguage();
  const navigate = useNavigate();
  const { systemSettings, updateSystemSettings, saveSettings } = useSettings();
  const { mutate: updateTobaccoFees } = useUpdateTobaccoFees();
  const { mutate: updateGeneral } = useUpdateGeneralSettings();
  const { mutate: updateItems } = useUpdateItemsSettings();
  const { mutate: updateTax } = useUpdateTaxSettings();
  const itemsStore = useSettingsStore(selectItems);
  const setItemsStore = useSettingsStore((s) => s.setItems);
  const pointsStore = useSettingsStore((s) => s.settings.points);
  const setPointsStore = useSettingsStore((s) => s.setPoints);
  const tobaccoStore = useSettingsStore((s) => s.settings.tobaccoFees);
  const setTobaccoStore = useSettingsStore((s) => s.setTobaccoFees);
  const generalStore = useSettingsStore((s) => s.settings.general);
  const setGeneralStore = useSettingsStore((s) => s.setGeneral);

  const [activeSection, setActiveSection] = React.useState("points");
  const [headerImageFiles, setHeaderImageFiles] = React.useState<File[]>([]);

  const handleUpdate = (section: keyof SystemSettings, field: string, value: any) => {
    updateSystemSettings({
      [section]: {
        ...(systemSettings[section] as any),
        [field]: value,
      },
    });
  };

  const sections = [
    { id: "points", title: t("loyalty_points", "نقاط الولاء"), icon: Star },
    { id: "tobacco", title: t("tobacco_fees", "رسوم التبغ"), icon: Percent },
    { id: "reports", title: t("report_settings", "إعدادات التقارير"), icon: FileText },
    { id: "print", title: t("print_settings", "إعدادات طباعة"), icon: Printer },
    { id: "delivery", title: t("delivery_companies", "شركات التوصيل"), icon: Truck },
    { id: "currencies", title: t("currencies", "العملات"), icon: Coins },
    { id: "category_discounts", title: t("category_discounts", "خصومات التصنيفات"), icon: Tag },
    { id: "taxes", title: t("tax_list", "قائمة الضرايب"), icon: Percent },

    { id: "tables", title: t("tables", "الطاولات"), icon: Grid3x3 },
    { id: "tax_system", title: t("tax_system", "نظام الضرائب"), icon: Percent },
  ];

  const handleSave = () => {
    saveSettings();
  };

  const section = sections?.find((section) => section?.id == activeSection);
  const SectionIcon = section?.icon;

  return (
    <Card dir={direction}>
      <CardHeader>
        <CardTitle>{t("system_settings", "الاعدادات العامة")}</CardTitle>
        <CardAction>
          <Button size="xl" variant="outline" onClick={() => navigate(-1)}>
            {t("cancel_and_return", "إلغاء والعودة")}
            <ArrowLeft size={16} />
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent>
        <div className="flex flex-col md:flex-row gap-8 relative items-start">
          {/* Sticky Sidebar Navigation */}
          <div className="w-full md:w-64">
            <div className="sticky top-24 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm">
              <div className="p-4 bg-[var(--bg-main)]/50 text-[var(--text-main)] font-bold flex items-center gap-2 border-b border-[var(--border)]">
                <Settings size={20} className="text-[var(--primary)]" />
                {t("system_settings", "الاعدادات العامة")}
              </div>
              <nav className="p-2 space-y-1">
                {sections.map((section) => (
                  <button key={section.id} onClick={() => setActiveSection(section.id)} className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm", direction === "rtl" ? "text-right" : "text-left", activeSection === section.id ? "bg-[var(--primary)] text-[var(--primary-foreground)] font-bold" : "text-[var(--text-main)] hover:bg-[var(--primary)]/10 hover:text-[var(--primary)] font-medium")}>
                    <section.icon size={18} />
                    <span>{section.title}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 w-full min-w-0">
            {activeSection === "points" && (
              <SettingSection id="points" title={t("loyalty_points", "نقاط الولاء")} onSave={handleSave}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="font-bold text-[var(--text-main)]">جائزة العملاء نقاط</h3>
                    <div className="flex flex-col xl:flex-row items-center gap-4">
                      <div className="flex-1 w-full">
                        <label className="block text-xs text-[var(--text-muted)] mb-1">كل مصروف يساوي</label>
                        <Input type="number" value={pointsStore?.customerPointsPerSpend} onChange={(e) => setPointsStore({ customerPointsPerSpend: parseFloat(e.target.value) })} className="w-full p-2 border border-[var(--border)] rounded-lg bg-[var(--input-bg)] text-[var(--text-main)]" />
                      </div>
                      <div className="hidden xl:block pt-6">
                        <Save size={20} className="text-[var(--primary)]" />
                      </div>
                      <div className="flex-1 w-full">
                        <label className="block text-xs text-[var(--text-muted)] mb-1">اجمالي النقاط المكتسبة</label>
                        <Input type="number" value={pointsStore?.totalCustomerPoints} onChange={(e) => setPointsStore({ totalCustomerPoints: parseFloat(e.target.value) })} className="w-full p-2 border border-[var(--border)] rounded-lg bg-[var(--input-bg)] text-[var(--text-main)]" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-bold text-[var(--text-main)]">جائزة الموظفين نقاط</h3>
                    <div className="flex flex-col xl:flex-row items-center gap-4">
                      <div className="flex-1 w-full">
                        <label className="block text-xs text-[var(--text-muted)] mb-1">كل بيع يعادل</label>
                        <Input type="number" value={pointsStore?.staffPointsPerSale} onChange={(e) => setPointsStore({ staffPointsPerSale: parseFloat(e.target.value) })} className="w-full p-2 border border-[var(--border)] rounded-lg bg-[var(--input-bg)] text-[var(--text-main)]" />
                      </div>
                      <div className="hidden xl:block pt-6">
                        <Save size={20} className="text-[var(--primary)]" />
                      </div>
                      <div className="flex-1 w-full">
                        <label className="block text-xs text-[var(--text-muted)] mb-1">اجمالي النقاط المكتسبة</label>
                        <Input type="number" value={pointsStore?.totalStaffPoints} onChange={(e) => setPointsStore({ totalStaffPoints: parseFloat(e.target.value) })} className="w-full p-2 border border-[var(--border)] rounded-lg bg-[var(--input-bg)] text-[var(--text-main)]" />
                      </div>
                    </div>
                  </div>
                </div>
              </SettingSection>
            )}

            {activeSection === "tobacco" && (
              <SettingSection
                id="tobacco"
                title={t("tobacco_fees", "رسوم التبغ")}
                onSave={() => {
                  updateTobaccoFees({ tobaccoFees: tobaccoStore.tobaccoFees || 0 });
                }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="font-bold text-[var(--text-main)]">{t("tobacco_tax", "ضريبه التبغ")}</h3>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <label className="block text-xs text-[var(--text-muted)] mb-1">{t("tobacco_tax_value", "قيمة ضريبة التبغ")}</label>
                        <Input type="number" value={tobaccoStore.tobaccoFees || 0} onChange={(e) => setTobaccoStore({ tobaccoFees: parseFloat(e.target.value) })} className="w-full p-2 border border-[var(--border)] rounded-lg bg-[var(--input-bg)] text-[var(--text-main)]" />
                      </div>
                    </div>
                  </div>
                </div>
              </SettingSection>
            )}

            {activeSection === "reports" && (
              <SettingSection
                id="reports"
                title={t("report_settings", "إعدادات التقارير")}
                onSave={() => {
                  updateGeneral({ topDataStatus: generalStore.topDataStatus, image: generalStore.image });
                }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Field>
                    <FieldLabel className="text-sm font-medium text-[var(--text-main)] mb-1">حالة الترويسة العلوية</FieldLabel>
                    <Select value={generalStore.topDataStatus ? "إظهار" : "إخفاء"} onValueChange={(val) => setGeneralStore({ topDataStatus: val === "إظهار" })}>
                      <SelectTrigger className="w-full h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="إظهار">إظهار</SelectItem>
                        <SelectItem value="إخفاء">إخفاء</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-main)] mb-1">صورة الترويسة العلوية Max( 2500px w * 600px h)</label>
                    <div className="mt-2">
                      <FileUpload
                        value={headerImageFiles}
                        onValueChange={(newFiles) => {
                          setHeaderImageFiles(newFiles);
                          if (newFiles.length > 0) {
                            setGeneralStore({ image: newFiles[0].name });
                          } else {
                            setGeneralStore({ image: "" });
                          }
                        }}
                        accept="image/*"
                        maxFiles={1}
                      >
                        <FileUploadDropzone className="py-4 px-2">
                          <div className="flex flex-col items-center gap-0">
                            <div className="flex items-center justify-center rounded-full border p-1.5 mb-1">
                              <Upload className="size-4 text-muted-foreground" />
                            </div>
                            <p className="font-medium text-xs">اسحب وافلت الصورة هنا</p>
                            <p className="text-muted-foreground" style={{ fontSize: "10px" }}>
                              أو اضغط للتصفح
                            </p>
                          </div>
                          <FileUploadTrigger asChild>
                            <Button variant="outline" size="sm" className="mt-1 h-7 text-xs w-fit font-bold">
                              تصفح الملفات
                            </Button>
                          </FileUploadTrigger>
                        </FileUploadDropzone>

                        <FileUploadList>
                          {headerImageFiles.map((file) => (
                            <FileUploadItem key={file.name} value={file}>
                              <FileUploadItemPreview />
                              <FileUploadItemMetadata />
                              <FileUploadItemDelete asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-7"
                                  onClick={() => {
                                    setHeaderImageFiles([]);
                                    handleUpdate("reports", "headerImage", "");
                                  }}
                                >
                                  <X />
                                </Button>
                              </FileUploadItemDelete>
                            </FileUploadItem>
                          ))}
                        </FileUploadList>
                      </FileUpload>
                    </div>
                  </div>
                </div>
              </SettingSection>
            )}

            {activeSection === "print" && (
              <SettingSection id="print" title={t("print_settings", "إعدادات طباعة")} hideSave>
                <div className="min-h-[300px] flex items-center justify-center">
                  <div className="text-center p-8 rounded-2xl bg-[var(--bg-main)]/50 border border-dashed border-[var(--border)] max-w-sm mx-auto">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Printer size={32} className="text-gray-400" />
                    </div>
                    <h3 className="text-lg font-bold text-[var(--text-main)] mb-2">{t("print_settings", "إعدادات طباعة")}</h3>
                    <p className="text-[var(--text-muted)] font-medium">{t("not_determined_yet", "لم يتم التحديد بعد")}</p>
                  </div>
                </div>
              </SettingSection>
            )}

            {activeSection === "delivery" && <DeliveryCompanies />}

            {activeSection === "currencies" && (
              <div className="bg-[var(--bg-card)] rounded-xl shadow-sm border border-[var(--border)] overflow-hidden">
                <Currencies />
              </div>
            )}

            {activeSection === "category_discounts" && (
              <div className="bg-[var(--bg-card)] rounded-xl shadow-sm border border-[var(--border)] p-6 overflow-hidden">
                <CategoryDiscount />
              </div>
            )}

            {activeSection === "taxes" && <TaxesList />}

            {activeSection === "tables" && <TablesList />}
            {activeSection === "tax_system" && (
              <SettingSection
                id="tax_system"
                title={t("tax_system", "نظام الضرائب")}
                onSave={() => {
                  updateItems({
                    itemTax: itemsStore.itemTax,
                    itemExpiry: itemsStore.itemExpiry,
                    showWarehouseItems: itemsStore.showWarehouseItems,
                    enableSecondLanguageItemName: itemsStore.enableSecondLanguageItemName,
                    showProductBalanceAtSale: itemsStore.showProductBalanceAtSale,
                    allowPriceChangeOnSale: itemsStore.allowPriceChangeOnSale,
                  });
                  updateTax({ taxSetting: itemsStore.taxPhase, itemTax: itemsStore.itemTax });
                }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <Field>
                    <FieldLabel className="gap-x-0">
                      {t("settings_item_tax")} <span className="text-red-500">*</span>
                    </FieldLabel>
                    <Select value={itemsStore.itemTax ? t("enable_option") || "تمكين" : t("disable_option") || "تعطيل"} onValueChange={(val) => setItemsStore({ itemTax: val === (t("enable_option") || "تمكين") })}>
                      <SelectTrigger className="w-full h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={t("enable_option") || "تمكين"}>{t("enable_option") || "تمكين"}</SelectItem>
                        <SelectItem value={t("disable_option") || "تعطيل"}>{t("disable_option") || "تعطيل"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field>
                    <FieldLabel className="gap-x-0">{t("tax_phase", "نوع المرحلة")}</FieldLabel>
                    <Select value={itemsStore.taxPhase} onValueChange={(val) => setItemsStore({ taxPhase: val })}>
                      <SelectTrigger className="w-full h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FirstStage">{t("first_stage", "المرحلة الاولى")}</SelectItem>
                        <SelectItem value="SecondStage">{t("second_stage", "المرحلة الثانية")}</SelectItem>
                        <SelectItem value="Exempt">{t("exempt", "معفي")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              </SettingSection>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
