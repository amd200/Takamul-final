import React from "react";
import { useForm, Controller } from "react-hook-form";
import { useLanguage } from "@/context/LanguageContext";
import { useSettings, type SystemSettings } from "@/context/SettingsContext";
import { Settings, Star, Percent, FileText, Printer, Save, Truck, Coins, DollarSign, Grid3x3, ArrowLeft, Tag, Package, MessageCircle, Upload, X, Check, EyeOff, Eye, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FileUpload, FileUploadDropzone, FileUploadTrigger, FileUploadList, FileUploadItem, FileUploadItemPreview, FileUploadItemMetadata, FileUploadItemDelete } from "@/components/ui/file-upload";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field, FieldLabel } from "@/components/ui/field";

import DeliveryCompanies from "./DeliveryCompanies";
import Currencies from "./Currencies";
import CategoryDiscount from "./CategoryDiscount";
import TablesList from "./Tables";
import TaxesList from "./TaxesList";
import { useUpdateTobaccoFees } from "@/features/settings/hooks/useUpdateTobaccoFees";
import { useUpdateGeneralSettings, useUpdateItemsSettings, useUpdateTaxSettings, useUpdateWhatsAppSettings } from "@/features/settings/hooks/useUpdateSettings";
import { useSettingsStore, selectItems } from "@/features/settings/store/settingsStore";
import { wareHousesKeys } from "@/features/wareHouse/keys/wareHouse.keys";


type PointsFormValues = {
  customerSpend: number;
  customerPoints: number;
  employeeSales: number;
  employeePoints: number;
};

type TobaccoFormValues = {
  tobaccoFees: number;
};

type ReportsFormValues = {
  topDataStatus: "إظهار" | "إخفاء";
  headerImage: File[];
};

type TaxSystemFormValues = {
  itemTax: string; // "تمكين" | "تعطيل"
  taxPhase: string; // "FirstStage" | "SecondStage" | "Exempt"
};

type WhatsAppFormValues = {
  whatsAppBusinessAccountId: string;
  whatsAppPhoneNumberId: string;
  whatsAppAccessToken: string;
  whatsAppAppId: string;
  whatsAppAppSecret: string;
};


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
          <div className="w-1 h-6 bg-[var(--primary)] rounded-full" />
          {title}
        </h2>
      </div>
      <div className="p-6">
        {children}
        {!hideSave && (
          <div className="mt-8 pt-6 border-t border-[var(--border)] flex justify-start">
            <Button type="submit" onClick={onSave} className="flex items-center gap-2 font-bold px-6">
              <Save size={18} />
              {t("save_settings")}
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};



const PointsForm: React.FC = () => {
  const { register, handleSubmit } = useForm<PointsFormValues>({
    defaultValues: {
      customerSpend: 0,
      customerPoints: 0,
      employeeSales: 0,
      employeePoints: 0,
    },
  });

  const onSubmit = (data: PointsFormValues) => {
    // TODO: wire up mutation
    console.log("Points data:", data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <SettingSection id="points" title="نقاط الولاء">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Customer Points */}
          <div className="space-y-4">
            <h3 className="font-bold text-[var(--text-main)]">جائزة العملاء نقاط</h3>
            <div className="flex flex-col xl:flex-row items-center gap-4">
              <div className="flex-1 w-full">
                <label className="block text-xs text-[var(--text-muted)] mb-1">كل مصروف يساوي</label>
                <Input type="number" {...register("customerSpend", { valueAsNumber: true })} className="w-full p-2 border border-[var(--border)] rounded-lg bg-[var(--input-bg)] text-[var(--text-main)]" />
              </div>
              <div className="hidden xl:block pt-6">
                <Save size={20} className="text-[var(--primary)]" />
              </div>
              <div className="flex-1 w-full">
                <label className="block text-xs text-[var(--text-muted)] mb-1">اجمالي النقاط المكتسبة</label>
                <Input type="number" {...register("customerPoints", { valueAsNumber: true })} className="w-full p-2 border border-[var(--border)] rounded-lg bg-[var(--input-bg)] text-[var(--text-main)]" />
              </div>
            </div>
          </div>

          {/* Employee Points */}
          <div className="space-y-4">
            <h3 className="font-bold text-[var(--text-main)]">جائزة الموظفين نقاط</h3>
            <div className="flex flex-col xl:flex-row items-center gap-4">
              <div className="flex-1 w-full">
                <label className="block text-xs text-[var(--text-muted)] mb-1">كل بيع يعادل</label>
                <Input type="number" {...register("employeeSales", { valueAsNumber: true })} className="w-full p-2 border border-[var(--border)] rounded-lg bg-[var(--input-bg)] text-[var(--text-main)]" />
              </div>
              <div className="hidden xl:block pt-6">
                <Save size={20} className="text-[var(--primary)]" />
              </div>
              <div className="flex-1 w-full">
                <label className="block text-xs text-[var(--text-muted)] mb-1">اجمالي النقاط المكتسبة</label>
                <Input type="number" {...register("employeePoints", { valueAsNumber: true })} className="w-full p-2 border border-[var(--border)] rounded-lg bg-[var(--input-bg)] text-[var(--text-main)]" />
              </div>
            </div>
          </div>
        </div>
      </SettingSection>
    </form>
  );
};


const TobaccoForm: React.FC = () => {
  const { t } = useLanguage();
  const { mutate: updateTobaccoFees } = useUpdateTobaccoFees();
  const tobaccoStore = useSettingsStore((s) => s.settings.tobaccoFees);
  const setTobaccoStore = useSettingsStore((s) => s.setTobaccoFees);

  const { register, handleSubmit } = useForm<TobaccoFormValues>({
    defaultValues: { tobaccoFees: tobaccoStore.tobaccoFees ?? 0 },
  });

  const onSubmit = (data: TobaccoFormValues) => {
    setTobaccoStore({ tobaccoFees: data.tobaccoFees });
    updateTobaccoFees({ tobaccoFees: data.tobaccoFees });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <SettingSection id="tobacco" title={t("tobacco_fees", "رسوم التبغ")}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="font-bold text-[var(--text-main)]">{t("tobacco_tax", "ضريبه التبغ")}</h3>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-xs text-[var(--text-muted)] mb-1">{t("tobacco_tax_value", "قيمة ضريبة التبغ")}</label>
                <Input type="number" {...register("tobaccoFees", { valueAsNumber: true })} className="w-full p-2 border border-[var(--border)] rounded-lg bg-[var(--input-bg)] text-[var(--text-main)]" />
              </div>
            </div>
          </div>
        </div>
      </SettingSection>
    </form>
  );
};


const ReportsForm: React.FC = () => {
  const { t } = useLanguage();
  const { mutate: updateGeneral } = useUpdateGeneralSettings();
  const generalStore = useSettingsStore((s) => s.settings.general);
  const setGeneralStore = useSettingsStore((s) => s.setGeneral);

  const { control, handleSubmit } = useForm<ReportsFormValues>({
    defaultValues: {
      topDataStatus: generalStore.topDataStatus ? "إظهار" : "إخفاء",
      headerImage: [],
    },
  });

  const onSubmit = (data: ReportsFormValues) => {
    const image = data.headerImage?.[0]?.name ?? generalStore.image ?? "";
    setGeneralStore({ topDataStatus: data.topDataStatus === "إظهار", image });
    updateGeneral({ topDataStatus: data.topDataStatus === "إظهار", image });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <SettingSection id="reports" title={t("report_settings", "إعدادات التقارير")}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top header status */}
          <Field>
            <FieldLabel className="text-sm font-medium text-[var(--text-main)] mb-1">حالة الترويسة العلوية</FieldLabel>
            <Controller
              control={control}
              name="topDataStatus"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="إظهار">إظهار</SelectItem>
                    <SelectItem value="إخفاء">إخفاء</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          {/* Header image upload */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-main)] mb-1">صورة الترويسة العلوية Max( 2500px w * 600px h)</label>
            <div className="mt-2">
              <Controller
                control={control}
                name="headerImage"
                render={({ field }) => (
                  <FileUpload value={field.value} onValueChange={field.onChange} accept="image/*" maxFiles={1}>
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
                      {field.value?.map((file) => (
                        <FileUploadItem key={file.name} value={file}>
                          <FileUploadItemPreview />
                          <FileUploadItemMetadata />
                          <FileUploadItemDelete asChild>
                            <Button variant="ghost" size="icon" className="size-7" onClick={() => field.onChange([])}>
                              <X />
                            </Button>
                          </FileUploadItemDelete>
                        </FileUploadItem>
                      ))}
                    </FileUploadList>
                  </FileUpload>
                )}
              />
            </div>
          </div>
        </div>
      </SettingSection>
    </form>
  );
};


const TaxSystemForm: React.FC = () => {
  const { t } = useLanguage();
  const { mutate: updateItems } = useUpdateItemsSettings();
  const { mutate: updateTax } = useUpdateTaxSettings();
  const itemsStore = useSettingsStore(selectItems);
  const setItemsStore = useSettingsStore((s) => s.setItems);

  const enableOption = t("enable_option") || "تمكين";
  const disableOption = t("disable_option") || "تعطيل";

  const { control, handleSubmit } = useForm<TaxSystemFormValues>({
    defaultValues: {
      itemTax: itemsStore.itemTax ? enableOption : disableOption,
      taxPhase: itemsStore.taxPhase,
    },
  });

  const onSubmit = (data: TaxSystemFormValues) => {
    const itemTaxBool = data.itemTax === enableOption;
    setItemsStore({ itemTax: itemTaxBool, taxPhase: data.taxPhase });
    updateItems({
      itemTax: itemTaxBool,
      itemExpiry: itemsStore.itemExpiry,
      showWarehouseItems: itemsStore.showWarehouseItems,
      enableSecondLanguageItemName: itemsStore.enableSecondLanguageItemName,
      showProductBalanceAtSale: itemsStore.showProductBalanceAtSale,
      allowPriceChangeOnSale: itemsStore.allowPriceChangeOnSale,
    });
    updateTax({ taxSetting: data.taxPhase, itemTax: itemTaxBool });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <SettingSection id="tax_system" title={t("tax_system", "نظام الضرائب")}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Item Tax toggle */}
          <Field>
            <FieldLabel className="gap-x-0">
              {t("settings_item_tax")} <span className="text-red-500">*</span>
            </FieldLabel>
            <Controller
              control={control}
              name="itemTax"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={enableOption}>{enableOption}</SelectItem>
                    <SelectItem value={disableOption}>{disableOption}</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          {/* Tax phase */}
          <Field>
            <FieldLabel className="gap-x-0">{t("tax_phase", "نوع المرحلة")}</FieldLabel>
            <Controller
              control={control}
              name="taxPhase"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FirstStage">{t("first_stage", "المرحلة الاولى")}</SelectItem>
                    <SelectItem value="SecondStage">{t("second_stage", "المرحلة الثانية")}</SelectItem>
                    <SelectItem value="Exempt">{t("exempt", "معفي")}</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
        </div>
      </SettingSection>
    </form>
  );
};

interface SecretInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hasError?: boolean;
}

const SecretInput: React.FC<SecretInputProps> = ({ value, onChange, placeholder }) => {
  const [visible, setVisible] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative flex items-center">
      <Input type={visible ? "text" : "password"} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="font-mono text-sm" />
      <div className="absolute left-2 flex items-center gap-1">
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-[var(--text-muted)] hover:text-[var(--text-main)]" onClick={handleCopy} title="نسخ">
          {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
        </Button>
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-[var(--text-muted)] hover:text-[var(--text-main)]" onClick={() => setVisible((v) => !v)} title={visible ? "إخفاء" : "إظهار"}>
          {visible ? <EyeOff size={14} /> : <Eye size={14} />}
        </Button>
      </div>
    </div>
  );
};

const WhatsAppSettingsForm: React.FC = () => {
  const { t } = useLanguage();
  const { mutate: updateWhatsApp, isPending } = useUpdateWhatsAppSettings();
  const whatsAppStore = useSettingsStore((s) => s.settings.whatsApp);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<WhatsAppFormValues>({
    defaultValues: {
      whatsAppBusinessAccountId: "",
      whatsAppPhoneNumberId: "",
      whatsAppAccessToken: "",
      whatsAppAppId: "",
      whatsAppAppSecret: "",
    },
  });

  React.useEffect(() => {
    if (!whatsAppStore) return;
    reset({
      whatsAppBusinessAccountId: whatsAppStore.whatsAppBusinessAccountId ?? "",
      whatsAppPhoneNumberId: whatsAppStore.whatsAppPhoneNumberId ?? "",
      whatsAppAccessToken: whatsAppStore.whatsAppAccessToken ?? "",
      whatsAppAppId: whatsAppStore.whatsAppAppId ?? "",
      whatsAppAppSecret: whatsAppStore.whatsAppAppSecret ?? "",
    });
  }, [whatsAppStore, reset]);

  const onSubmit = (data: WhatsAppFormValues) => {
    updateWhatsApp(data);
  };

  const FIELDS: {
    name: keyof WhatsAppFormValues;
    label: string;
    placeholder: string;
    secret?: boolean;
    hint: string;
  }[] = [
    {
      name: "whatsAppBusinessAccountId",
      label: "WhatsApp Business Account ID",
      placeholder: "مثال: 123456789012345",
      hint: "WABA ID الخاص بحسابك على Meta Business",
    },
    {
      name: "whatsAppPhoneNumberId",
      label: "Phone Number ID",
      placeholder: "مثال: 109876543210123",
      hint: "ID الرقم المرتبط بـ WhatsApp Business API",
    },
    {
      name: "whatsAppAccessToken",
      label: "Access Token",
      placeholder: "EAAxxxxxxxxxxxxxxx...",
      secret: true,
      hint: "توكن الوصول الدائم من Meta for Developers",
    },
    {
      name: "whatsAppAppId",
      label: "App ID",
      placeholder: "مثال: 987654321098765",
      hint: "معرّف التطبيق من لوحة تحكم Meta",
    },
    {
      name: "whatsAppAppSecret",
      label: "App Secret",
      placeholder: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      secret: true,
      hint: "المفتاح السري للتطبيق — لا تشاركه مع أحد",
    },
  ];

  return (
    <section className="bg-[var(--bg-card)] rounded-xl shadow-sm border border-[var(--border)] overflow-hidden mb-8">
      <div className="p-4 border-b border-[var(--border)] bg-[var(--bg-main)]/50 flex items-center gap-3">
        <div className="w-1 h-6 bg-[var(--primary)] rounded-full" />
        <MessageCircle size={20} className="text-green-500" />
        <h2 className="text-lg font-bold text-[var(--text-main)]">إعدادات واتساب</h2>
      </div>

      {/* ── Info banner ── */}
      <div className="mx-6 mt-6 p-4 rounded-lg bg-green-500/10 border border-green-500/20 flex items-start gap-3">
        <MessageCircle size={18} className="text-green-500 mt-0.5 shrink-0" />
        <p className="text-sm text-[var(--text-main)] leading-relaxed">
          أدخل بيانات تطبيق الـ WhatsApp Cloud API الخاص بك من{" "}
          <a href="https://developers.facebook.com" target="_blank" rel="noreferrer" className="text-green-600 underline underline-offset-2 font-medium">
            Meta for Developers
          </a>
          . هذه البيانات مشفّرة ومحمية.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {FIELDS.map(({ name, label, placeholder, secret, hint }) => (
            <Field key={name}>
              <FieldLabel className="text-sm font-semibold text-[var(--text-main)]">
                {label}
                <span className="text-red-500 mr-1">*</span>
              </FieldLabel>

              <Controller control={control} name={name} rules={{ required: `${label} مطلوب` }} render={({ field }) => (secret ? <SecretInput value={field.value} onChange={field.onChange} placeholder={placeholder} hasError={!!errors[name]} /> : <Input {...field} placeholder={placeholder} dir="ltr" className={errors[name] ? "border-red-500 focus-visible:ring-red-500" : ""} />)} />

              {errors[name] && <p className="text-xs text-red-500 mt-1">{errors[name]?.message}</p>}
              {!errors[name] && <p className="text-xs text-[var(--text-muted)] mt-1">{hint}</p>}
            </Field>
          ))}
        </div>

        {/* ── Footer ── */}
        <div className="px-6 pb-6 pt-4 border-t border-[var(--border)] flex items-center justify-between">
          <p className="text-xs text-[var(--text-muted)]">{isDirty ? "⚠ يوجد تغييرات غير محفوظة" : "✓ جميع الإعدادات محفوظة"}</p>
          <Button size="2xl" type="submit" disabled={isPending || !isDirty} className=" disabled:opacity-50">
            {isPending ? "جاري الحفظ..." : "حفظ إعدادات واتساب"}
          </Button>
        </div>
      </form>
    </section>
  );
};


export default function SystemSettings() {
  const { t, direction } = useLanguage();
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = React.useState("points");

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
    { id: "whatsApp", title: "إعدادات واتساب", icon: MessageCircle },
  ] as const;

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
          {/* ── Sticky Sidebar Navigation ── */}
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

          {/* ── Main Content ── */}
          <div className="flex-1 w-full min-w-0">
            {activeSection === "points" && <PointsForm />}

            {activeSection === "tobacco" && <TobaccoForm />}

            {activeSection === "reports" && <ReportsForm />}

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

            {activeSection === "tax_system" && <TaxSystemForm />}

            {activeSection === "whatsApp" && <WhatsAppSettingsForm />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
