import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Loader2, Upload, X } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { useLanguage } from "@/context/LanguageContext";
import useToast from "@/hooks/useToast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ComboboxField from "@/components/ui/ComboboxField";

import { useGetCountries } from "@/features/Location/hooks/Usegetcountries";
import { useGetCities } from "@/features/Location/hooks/Usegetcities";
import { useGetStates } from "@/features/Location/hooks/Usegetstates";
import { useCreateBranch } from "@/features/Branches/hooks/Usecreatebranch";
import { useUpdateBranch } from "@/features/Branches/hooks/Useupdatebranch";
import { useGetBranchById } from "@/features/Branches/hooks/Usegetbranchbyid";
import z from "zod";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

// ─── Types ────────────────────────────────────────────────────────────────────

export const branchSchema = z.object({
  // ── Basic Info ──────────────────────────────────────────────────────────────
  code: z.string().check(z.minLength(1, "كود الفرع مطلوب"), z.maxLength(20, "كود الفرع لا يتجاوز 20 حرف")),

  name: z.string().check(z.minLength(1, "اسم الفرع مطلوب"), z.maxLength(100, "اسم الفرع لا يتجاوز 100 حرف")),
  OrganizationName: z.string().check(z.maxLength(100, "اسم النشاط لا يتجاوز 100 حرف")).optional().default(""),
  OrganizationUnitName: z.string().min(2, "اسم الوحدة يجب أن يكون حرفين على الأقل").max(100, "اسم الوحدة لا يتجاوز 100 حرف").optional().default(""),
  LocationAddress: z.string().min(5, "العنوان يجب أن يكون 5 أحرف على الأقل").max(200, "العنوان لا يتجاوز 200 حرف").optional().default(""),
  IndustryBusinessCategory: z.string().min(2, "الفئة يجب أن تكون حرفين على الأقل").max(100, "الفئة لا تتجاوز 100 حرف").optional().default(""),

  nameEn: z
    .string()
    .check(z.maxLength(100, "الاسم الإنجليزي لا يتجاوز 100 حرف"), z.regex(/^[a-zA-Z0-9\s\-_.,'&()]*$/, "يجب أن يحتوي على أحرف إنجليزية فقط"))
    .optional()
    .default(""),

  phone: z
    .string()
    .check(z.regex(/^(05\d{8}|)$/, "رقم الجوال غير صحيح - يجب أن يبدأ بـ 05 ويتكون من 10 أرقام"))
    .optional()
    .default(""),

  taxNumber: z.string().check(
    z.minLength(1, "الرقم الضريبي مطلوب"),
    z.length(15, "الرقم الضريبي يجب أن يتكون من 15 رقماً"),
    z.regex(/^\d+$/, "الرقم الضريبي يجب أن يحتوي على أرقام فقط"),
    z.refine((val) => val.startsWith("3"), "يجب أن يبدأ الرقم الضريبي بـ 3"),
    z.refine((val) => val.endsWith("3"), "يجب أن ينتهي الرقم الضريبي بـ 3"),
  ),

  commercialRegister: z.string().check(z.maxLength(20, "السجل التجاري لا يتجاوز 20 حرف")).optional().default(""),

  footerNote: z.string().check(z.maxLength(500, "الملاحظات لا تتجاوز 500 حرف")).optional().default(""),

  imageUrl: z.string().optional().default(""),

  imagePreview: z.string().nullable().optional().default(null),

  imageFile: z
    .instanceof(File)
    .check(
      z.refine((f) => f.size <= 2 * 1024 * 1024, "حجم الصورة يجب أن لا يتجاوز 2MB"),
      z.refine((f) => ["image/jpeg", "image/png", "image/webp", "image/svg+xml"].includes(f.type), "صيغة الصورة غير مدعومة - يُسمح بـ JPG, PNG, WebP, SVG"),
    )
    .nullable()
    .optional()
    .default(null),

  countryId: z
    .number({ error: "البلد مطلوب" })
    .int()
    .positive("البلد مطلوب")
    .nullable()
    .check(z.refine((v) => v !== null, "البلد مطلوب")),

  cityId: z
    .number({ error: "المدينة مطلوبة" })
    .int()
    .positive("المدينة مطلوبة")
    .nullable()
    .check(z.refine((v) => v !== null, "المدينة مطلوبة")),

  stateId: z
    .number({ error: "المنطقة مطلوبة" })
    .int()
    .positive("المنطقة مطلوبة")
    .nullable()
    .check(z.refine((v) => v !== null, "المنطقة مطلوبة")),

  district: z.string().check(z.maxLength(100, "الحي لا يتجاوز 100 حرف")).optional().default(""),

  street: z.string().check(z.minLength(1, "اسم الشارع مطلوب"), z.maxLength(100, "اسم الشارع لا يتجاوز 100 حرف")),

  buildingNumber: z
    .string()
    .check(z.regex(/^(\d{1,4}|)$/, "رقم المبنى يجب أن يتكون من 1-4 أرقام"))
    .optional()
    .default(""),

  subNumber: z
    .string()
    .check(z.regex(/^(\d{1,4}|)$/, "الرقم الفرعي يجب أن يتكون من 1-4 أرقام"))
    .optional()
    .default(""),

  postalCode: z
    .string()
    .check(z.regex(/^(\d{5}|)$/, "الرمز البريدي يجب أن يتكون من 5 أرقام"))
    .optional()
    .default(""),
});

export type BranchFormValues = z.infer<typeof branchSchema>;
// ─── Component ────────────────────────────────────────────────────────────────

export default function AddBranch() {
  const { t, direction } = useLanguage();
  const navigate = useNavigate();
  const { id, mode } = useParams<{ id?: string; mode?: string }>();
  const { notifyError, notifySuccess } = useToast();

  const isEditMode = !!id && mode !== "view";
  const isViewMode = mode === "view";
  const branchId = id ? Number(id) : undefined;

  const { data: branchDetail, isLoading: isLoadingDetail } = useGetBranchById(branchId);
  const { mutateAsync: createBranch, isPending: isCreating } = useCreateBranch();
  const { mutateAsync: updateBranch, isPending: isUpdating } = useUpdateBranch();
  const isPending = isCreating || isUpdating;

  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<BranchFormValues>({
    defaultValues: {
      code: "",
      name: "",
      nameEn: "",
      phone: "",
      taxNumber: "",
      commercialRegister: "",
      footerNote: "",
      imageUrl: "",
      imagePreview: null,
      imageFile: null,
      countryId: null,
      cityId: null,
      stateId: null,
      district: "",
      street: "",
      buildingNumber: "",
      subNumber: "",
      postalCode: "",
    },
  });

  const countryId = watch("countryId");
  const cityId = watch("cityId");
  const imagePreview = watch("imagePreview");

  const { data: countries } = useGetCountries();
  const { data: cities } = useGetCities(countryId);
  const { data: states } = useGetStates(cityId);

  useEffect(() => {
    if (!branchDetail) return;
    const nameEnKey = Object.keys(branchDetail).find((k) => k.toLowerCase().replace(/_/g, "") === "nameen");
    reset({
      code: branchDetail.code ?? "",
      name: branchDetail.name ?? "",

      nameEn: nameEnKey ? ((branchDetail as any)[nameEnKey] ?? "") : "",
      phone: branchDetail.phone ?? "",
      taxNumber: branchDetail.taxNumber ?? "",
      commercialRegister: branchDetail.commercialRegister ?? "",
      footerNote: branchDetail.footerNote ?? "",
      imageUrl: branchDetail.imageUrl ?? "",
      imagePreview: branchDetail.imageUrl ?? null,
      imageFile: null,
      countryId: branchDetail.countryId ?? null,
      cityId: branchDetail.cityId ?? null,
      stateId: branchDetail.stateId ?? null,
      district: branchDetail.district ?? "",
      street: branchDetail.street ?? "",
      buildingNumber: branchDetail.buildingNumber ?? "",
      subNumber: branchDetail.subNumber ?? "",
      postalCode: branchDetail.postalCode ?? "",

      OrganizationName: branchDetail.organizationName ?? "",
      OrganizationUnitName: branchDetail.organizationUnitName ?? "",
      LocationAddress: branchDetail.locationAddress ?? "",
      IndustryBusinessCategory: branchDetail.industryBusinessCategory ?? "",
    });
  }, [branchDetail, reset]);

  const handleImageFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) {
        notifyError(t("invalid_image") || "يرجى اختيار ملف صورة");
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setValue("imagePreview", result);
        setValue("imageUrl", result);
        setValue("imageFile", file);
      };
      reader.readAsDataURL(file);
    },
    [notifyError, t, setValue],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleImageFile(file);
    },
    [handleImageFile],
  );

  const onSubmit = async (values: BranchFormValues) => {
    const formData = new FormData();
    const appendStr = (key: string, val?: string | null) => formData.append(key, val?.trim() ?? "");
    appendStr("Code", values.code);
    appendStr("Name", values.name);
    appendStr("NameEn", values.nameEn);
    appendStr("CommercialRegister", values.commercialRegister);
    appendStr("TaxNumber", values.taxNumber);
    appendStr("FooterNote", values.footerNote);
    appendStr("Phone", values.phone);
    appendStr("Street", values.street);
    appendStr("BuildingNumber", values.buildingNumber);
    appendStr("SubNumber", values.subNumber);
    appendStr("PostalCode", values.postalCode);
    appendStr("District", values.district);
    appendStr("OrganizationName", values.name);
    appendStr("OrganizationUnitName", values.OrganizationUnitName);
    appendStr("LocationAddress", values.LocationAddress);
    appendStr("IndustryBusinessCategory", values.IndustryBusinessCategory);

    (["Email", "AdditionalNumber"] as const).forEach((key) => formData.append(key, ""));

    formData.append("CountryId", String(values.countryId!));
    formData.append("CityId", String(values.cityId!));
    formData.append("StateId", String(values.stateId!));

    if (values.imageFile) formData.append("Image", values.imageFile);

    if (isEditMode && branchId) {
      formData.append("Id", String(branchId));
      formData.append("IsActive", String(branchDetail?.isActive ?? true));
    }

    try {
      if (isEditMode && branchId) {
        await updateBranch({ id: branchId, data: formData });
      } else {
        await createBranch(formData);
      }
      navigate("/branches");
    } catch {}
  };

  // ─── UI ─────────────────────────────────────────────────────────────────────

  const BackIcon = direction === "rtl" ? ArrowRight : ArrowLeft;

  // ─── OTP-Style Input Component ────────────────────────────────────────────────

  function OTPStyleInput({ value = "", onChange, disabled = false, maxLength = 8 }: { value?: string; onChange?: (val: string) => void; disabled?: boolean; maxLength?: number }) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [focused, setFocused] = useState(false);

    const activeIndex = focused ? Math.min(value.length, maxLength - 1) : -1;

    return (
      <>
        {/* Blink animation */}
        <style>{`
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        .cursor-blink { animation: blink 1s step-end infinite; }
      `}</style>

        <div className="relative flex gap-1.5 w-fit cursor-text" onClick={() => inputRef.current?.focus()}>
          {Array.from({ length: maxLength }).map((_, i) => {
            const isActive = i === activeIndex;
            const hasValue = !!value?.[i];

            return (
              <div
                key={i}
                className={`
                w-10 h-10 border rounded-md flex items-center justify-center
                text-sm font-mono font-medium transition-all select-none
                ${isActive ? "border-[var(--primary)] ring-1 ring-[var(--primary)]" : ""}
                ${hasValue && !isActive ? "border-gray-400 text-gray-800" : ""}
                ${!hasValue && !isActive ? "border-gray-200" : ""}
                ${disabled ? "bg-gray-50 opacity-70" : ""}
              `}
              >
                {hasValue ? value[i] : isActive ? <span className="cursor-blink w-px h-5 bg-gray-700 block" /> : null}
              </div>
            );
          })}

          <input ref={inputRef} value={value} disabled={disabled} maxLength={maxLength} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} onChange={(e) => onChange?.(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))} className="absolute inset-0 opacity-0 w-full h-full cursor-text" />
        </div>
      </>
    );
  }

  return (
    <div dir={direction} className="space-y-6">
      {isLoadingDetail && branchId ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="animate-spin text-[var(--primary)]" size={32} />
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              <h1 className="text-xl font-bold text-[var(--text-main)] flex items-center gap-2">{isViewMode ? t("view_branch") || "عرض الفرع" : isEditMode ? t("edit_branch") || "تعديل الفرع" : t("add_branch") || "إضافة فرع جديد"}</h1>
            </CardTitle>
            <CardDescription>{isViewMode ? t("branch_details") || "تفاصيل بيانات الفرع" : t("branch_form_desc") || "أدخل بيانات الفرع الخاصة بالمنشأة"}</CardDescription>
            <CardAction>
              <Button form="branchForm" size="xl" asChild>
                <Link to={"/branches"}>
                  الرجوع لقائمة الفروع
                  <ArrowLeft />
                </Link>
              </Button>
            </CardAction>
          </CardHeader>

          <CardContent>
            <form id="branchForm" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* ── Basic Info ─────────────────────────────────────────────── */}
              <Card>
                <CardHeader>
                  <CardTitle>{t("basic_info") || "المعلومات الأساسية"}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {/* Name */}
                    <Controller
                      name="name"
                      control={control}
                      rules={{ required: t("branch_name_required") || "اسم الفرع مطلوب" }}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel>
                            {t("business_name") || "اسم النشاط"}
                            <span className="text-red-500">*</span>
                          </FieldLabel>
                          <Input {...field} placeholder={t("business_name_placeholder") || "اسم الفرع / النشاط"} readOnly={isViewMode} />
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}{" "}
                        </Field>
                      )}
                    />

                    {/* Name EN */}
                    <Controller
                      name="nameEn"
                      control={control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel>{t("name_en") || "اسم الفرع باللغة الثانية"}</FieldLabel>
                          <Input {...field} placeholder={t("name_en_placeholder") || "Branch Name (En)"} readOnly={isViewMode} />
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                      )}
                    />

                    {/* Phone */}
                    <Controller
                      name="phone"
                      control={control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel>{t("phone") || "رقم الجوال"}</FieldLabel>
                          <Input {...field} placeholder="05xxxxxxxx" readOnly={isViewMode} />
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                      )}
                    />
                    <Controller
                      name="OrganizationUnitName"
                      control={control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel>
                            اسم الوحدة
                            <span className="text-red-500">*</span>
                          </FieldLabel>
                          <Input {...field} placeholder="أدخل اسم الوحدة" readOnly={isViewMode} />
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                      )}
                    />
                  </div>

                  <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {/* Code */}
                    <Controller
                      name="code"
                      control={control}
                      rules={{ required: t("branch_code_required") || "كود الفرع مطلوب" }}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel className="">
                            {t("branch_code") || "كود الفرع"}
                            <span className="text-red-500">*</span>
                          </FieldLabel>
                          <Input {...field} placeholder="BR-001" readOnly={isViewMode} />
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                      )}
                    />

                    {/* Tax Number */}
                    <Controller
                      name="taxNumber"
                      control={control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel>
                            {t("tax_number") || "الرقم الضريبي"} <span className="text-red-500">*</span>
                          </FieldLabel>
                          <Input {...field} placeholder="ادخل الرقم الضريبي" readOnly={isViewMode} />
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}{" "}
                        </Field>
                      )}
                    />

                    {/* Commercial Register */}
                    <Controller
                      name="commercialRegister"
                      control={control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel>{t("commercial_register") || "السجل التجاري"}</FieldLabel>
                          <Input {...field} placeholder="ادخل السجل التجاري" readOnly={isViewMode} />
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                      )}
                    />
                    <Controller
                      name="IndustryBusinessCategory"
                      control={control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel>
                            القطاع / النشاط التجاري
                            <span className="text-red-500">*</span>
                          </FieldLabel>
                          <Input {...field} placeholder="أدخل القطاع أو النشاط التجاري" readOnly={isViewMode} />
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                      )}
                    />
                  </div>

                  {/* Logo Upload */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">{t("company_logo") || "شعار الشركة"}</p>
                    <Controller
                      name="imagePreview"
                      control={control}
                      render={() => (
                        <div onDragOver={(e) => e.preventDefault()} onDrop={handleDrop} onClick={() => !isViewMode && fileInputRef.current?.click()} className={`relative rounded-xl border-2 border-dashed transition-all flex items-center justify-center min-h-[120px] ${isViewMode ? "cursor-default" : "cursor-pointer"} border-gray-200 dark:border-zinc-800 hover:border-[#2ecc71]/50 hover:bg-gray-50 dark:hover:bg-zinc-800/20`}>
                          {imagePreview ? (
                            <div className="relative p-3">
                              <img src={imagePreview} alt="logo" className="h-24 object-contain rounded-lg" />
                              {!isViewMode && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setValue("imagePreview", null);
                                    setValue("imageUrl", "");
                                    setValue("imageFile", null);
                                  }}
                                  className="absolute -top-1 -right-1 bg-white dark:bg-zinc-900 rounded-full border border-gray-200 dark:border-zinc-800 p-0.5 shadow"
                                >
                                  <X size={13} className="text-gray-500" />
                                </button>
                              )}
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-2 py-6 text-gray-400">
                              <div className="w-12 h-12 rounded-full border border-gray-200 dark:border-zinc-800 flex items-center justify-center bg-white dark:bg-zinc-900">
                                <Upload size={20} />
                              </div>
                              <p className="text-sm font-medium text-gray-600">{t("drag_drop_image") || "اسحب وأفلت الصورة هنا"}</p>
                              <p className="text-xs">{t("or_browse") || "أو اضغط للتصفح"}</p>
                              <button type="button" className="mt-1 text-xs border border-gray-300 dark:border-zinc-700 rounded-lg px-4 py-1.5 hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-600 dark:text-gray-400 transition-colors">
                                {t("browse_files") || "تصفح الملفات"}
                              </button>
                            </div>
                          )}
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) handleImageFile(f);
                            }}
                          />
                        </div>
                      )}
                    />
                  </div>

                  {/* Footer Note */}
                  <Controller
                    name="footerNote"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>{t("invoice_footer") || "ملاحظات على الفاتورة"}</FieldLabel>
                        <textarea {...field} placeholder={t("invoice_footer_placeholder") || "شكراً لزيارتكم..."} rows={3} readOnly={isViewMode} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#2ecc71] resize-none disabled:bg-gray-50" />
                      </Field>
                    )}
                  />
                </CardContent>
              </Card>

              {/* ── Address ────────────────────────────────────────────────── */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">{t("address_settings") || "إعدادات العنوان"}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {/* Country */}
                    <Controller
                      name="countryId"
                      control={control}
                      rules={{ required: t("country_required") || "البلد مطلوب" }}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel>
                            {t("country") || "البلد"}
                            <span className="text-red-500 ms-1">*</span>
                          </FieldLabel>
                          <ComboboxField
                            value={field.value ?? undefined}
                            onChange={(val) => {
                              field.onChange(val ? Number(val) : null);
                              setValue("cityId", null);
                              setValue("stateId", null);
                            }}
                            items={countries ?? []}
                            valueKey="id"
                            labelKey="countryName"
                            placeholder={t("select_country")}
                            disabled={isViewMode}
                          />
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                      )}
                    />

                    {/* City (labeled as Region) */}
                    <Controller
                      name="cityId"
                      control={control}
                      rules={{ required: t("region_required") || "المنطقة مطلوبة" }}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel>
                            {t("region") || "المنطقة"}
                            <span className="text-red-500 ms-1">*</span>
                          </FieldLabel>
                          <ComboboxField
                            value={field.value ?? undefined}
                            onChange={(val) => {
                              field.onChange(val ? Number(val) : null);
                              setValue("stateId", null);
                            }}
                            items={cities ?? []}
                            valueKey="id"
                            labelKey="cityName"
                            placeholder={!countryId ? t("select_country_first") : t("اختر المنطقة")}
                            disabled={!countryId || isViewMode}
                          />
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                      )}
                    />

                    {/* Region (labeled as City) */}
                    <Controller
                      name="stateId"
                      control={control}
                      rules={{ required: t("city_required") || "المدينة مطلوبة" }}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel>
                            {t("city") || "المدينة"}
                            <span className="text-red-500 ms-1">*</span>
                          </FieldLabel>
                          <ComboboxField value={field.value ?? undefined} onChange={(val) => field.onChange(val ? Number(val) : null)} items={states ?? []} valueKey="id" labelKey="statesName" placeholder={!cityId ? t("select_region_first") : t("اختر المدينة")} disabled={!cityId || isViewMode} />
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                      )}
                    />

                    {/* Neighborhood (New District Textbox) */}
                    <Controller
                      name="district"
                      control={control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel>{t("district") || "الحي"}</FieldLabel>
                          <Input {...field} placeholder={t("district_placeholder") || "الحي"} readOnly={isViewMode} />
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                      )}
                    />

                    {/* Street */}
                    <Controller
                      name="street"
                      control={control}
                      rules={{ required: t("street_required") || "اسم الشارع مطلوب" }}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel>
                            {t("street_name") || "اسم الشارع"}
                            <span className="text-red-500 ms-1">*</span>
                          </FieldLabel>
                          <Input {...field} placeholder={t("street_placeholder") || "الشارع"} readOnly={isViewMode} />
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Postal Code */}
                    <Controller
                      name="postalCode"
                      control={control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel>{t("postal_code") || "الرمز البريدي"} (ex:12345)</FieldLabel>
                          <Input {...field} placeholder="00000" readOnly={isViewMode} />
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                      )}
                    />

                    {/* Building Number */}
                    <Controller
                      name="buildingNumber"
                      control={control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel>{t("building_number") || "رقم المبنى"} (ex:1234)</FieldLabel>
                          <Input {...field} placeholder="0000" readOnly={isViewMode} />
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                      )}
                    />

                    {/* Sub Number */}
                    <Controller
                      name="subNumber"
                      control={control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel>{t("sub_number") || "الرقم الفرعي"} (ex:1234)</FieldLabel>
                          <Input {...field} placeholder="0000" readOnly={isViewMode} />
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                      )}
                    />
                    <Controller
                      name="LocationAddress"
                      control={control}
                      render={({ field }) => (
                        <Field>
                          <FieldLabel>{"العنوان المختصر"}</FieldLabel>
                          <OTPStyleInput value={field.value ?? ""} onChange={field.onChange} disabled={isViewMode} maxLength={8} />
                        </Field>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* ── Actions ────────────────────────────────────────────────── */}
              {!isViewMode && (
                <div className="flex items-center justify-end gap-3 pb-6">
                  <Button size="2xl" type="button" variant="outline" asChild>
                    <Link to="/branches">{t("cancel") || "إلغاء"}</Link>
                  </Button>
                  <Button size="2xl" type="submit" form="branchForm" loading={isPending}>
                    {isEditMode ? t("save_changes") || "حفظ التعديلات" : t("add_branch") || "إضافة الفرع"}
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
