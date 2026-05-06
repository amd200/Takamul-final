import React, { useCallback, useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Monitor, MapPin, KeySquare, ShieldCheck, ShieldPlus, CheckCircle2, ChevronLeft, ChevronRight, Copy, ExternalLink, Loader2, AlertCircle, RefreshCw, Eye, EyeOff, Barcode } from "lucide-react";

import { useLanguage } from "@/context/LanguageContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreateDevicePOS, DeviceType, POSDevice } from "@/features/pos/types/pos.types";
import { useGetAllBranches } from "@/features/Branches/hooks/Usegetallbranches";
import { useCreateDevicePOS } from "@/features/pos/hooks/useCreateDevicePOS";
import { useGenerateCSR } from "@/features/ZatcaRegistration/hooks/useGenerateCSR";
import { useRegisterCCSID } from "@/features/ZatcaRegistration/hooks/useRegisterCCSID";
import formatDate from "@/lib/formatDate";
import { useUpgradeToPcsid } from "@/features/ZatcaRegistration/hooks/useUpgradeToPcsid";
import { useSettings } from "@/context/SettingsContext";
import { useSettingsStore } from "@/features/settings/store/settingsStore";
import { useUpdatePOSDevice } from "@/features/posDevice/hooks/useUpdatePOSDevice";
import { useGetAllDeviceTypes } from "@/features/posDevice/hooks/useGetAllDeviceTypes";
import { useGenereateSerial } from "@/features/posDevice/hooks/useGenereateSerial";

// ─── Types ────────────────────────────────────────────────────────────────────

type DeviceStatus = "NotRegistered" | "PendingOTP" | "CCSIDRegistered" | "PCSIDRegistered";

interface CSRResult {
  token: string;
  secret: string;
  status?: string;
  isExpired?: boolean;
  issuedAt?: string;
  expiresAt?: string;
}
interface CCSIDResult {
  token: string;
  secret: string;
  status?: string;
  isExpired?: boolean;
  issuedAt?: string;
  expiresAt?: string;
}

interface PCSIDResult {
  token: string;
  secret?: string;
  status?: string;
  isExpired?: boolean;
  issuedAt?: string;
  expiresAt?: string;
}

// ─── Status → Step mapping ────────────────────────────────────────────────────
const statusToStep: Record<DeviceStatus, number> = {
  NotRegistered: 1,
  PendingOTP: 2,
  CCSIDRegistered: 4,
  PCSIDRegistered: 5,
};

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  deviceName: z.string().min(2, "اسم الجهاز مطلوب"),
  serialNumber: z.string().min(3, "الرقم التسلسلي مطلوب"),
  InvoiceSequence: z.string().min(1, "تسلسل الفواتير مطلوب"),
  branchId: z.number().min(1, "الفرع مطلوب"),
  location: z.string().optional(),
  isActive: z.boolean().optional(),
});

type FormValues = z.infer<typeof schema>;

const STEP_FIELDS: Record<number, (keyof FormValues)[]> = {
  1: ["deviceName", "serialNumber", "InvoiceSequence", "branchId"],
};

const STEPS = [
  { id: 1, label: "معلومات الجهاز", icon: Monitor },
  { id: 2, label: "توليد CSR", icon: KeySquare },
  { id: 3, label: "تسجيل CCSID", icon: ShieldCheck },
  { id: 4, label: "تسجيل PCSID", icon: ShieldPlus },
  { id: 5, label: "اكتمل", icon: CheckCircle2 },
];

function isStepComplete(step: number, clickedGeneratedCSR: boolean, ccsid: CCSIDResult | undefined, pcsid: PCSIDResult | undefined, deviceStatus?: DeviceStatus): boolean {
  switch (step) {
    case 1:
      return true;
    case 2:
      return clickedGeneratedCSR;
    case 3:
      return !!ccsid;
    case 4:
      return !!pcsid;
    case 5:
      return true;
    default:
      return false;
  }
}

// ─── Stepper Header ───────────────────────────────────────────────────────────

function StepperHeader({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-between px-0 pb-6 pt-1 overflow-x-auto no-scrollbar">
      {STEPS.map((step, idx) => {
        const Icon = step.icon;
        const isDone = current > step.id;
        const isActive = current === step.id;
        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center gap-1.5 min-w-[48px]">
              <div
                className={`
                  w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 flex-shrink-0
                  ${isDone ? "bg-[#2ecc71] text-white shadow-sm shadow-green-200" : ""}
                  ${isActive ? "bg-white border-2 border-[#2ecc71] text-[#2ecc71] shadow-md shadow-green-100 scale-110" : ""}
                  ${!isDone && !isActive ? "bg-gray-100 text-gray-400 border border-gray-200" : ""}
                `}
              >
                {isDone ? <CheckCircle2 size={15} /> : <Icon size={14} />}
              </div>
              <span
                className={`text-[10px] font-medium text-center leading-tight transition-colors whitespace-nowrap
                  ${isActive ? "text-[#2ecc71] font-bold" : isDone ? "text-gray-500" : "text-gray-400"}`}
              >
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className="flex-1 h-[2px] mx-1 rounded-full overflow-hidden bg-gray-100 mb-5 min-w-[8px]">
                <div className="h-full bg-[#2ecc71] transition-all duration-500 ease-out" style={{ width: current > step.id ? "100%" : "0%" }} />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── UI Helpers ───────────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest py-2 border-b border-gray-100 mb-0.5">{children}</p>;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button type="button" onClick={copy} className="flex items-center gap-1 text-xs text-gray-400 hover:text-[#2ecc71] transition-colors">
      {copied ? <CheckCircle2 size={13} className="text-[#2ecc71]" /> : <Copy size={13} />}
      {copied ? "تم النسخ" : "نسخ"}
    </button>
  );
}

function SecretBlock({ label, value }: { label: string; value?: string }) {
  const [show, setShow] = useState(false);
  if (!value) return null;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setShow(!show)} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors">
            {show ? <EyeOff size={12} /> : <Eye size={12} />}
            {show ? "إخفاء" : "إظهار"}
          </button>
          <CopyButton text={value} />
        </div>
      </div>
      <div className="bg-gray-900 rounded-xl px-4 py-3 font-mono text-xs text-green-400 leading-relaxed break-all max-h-[90px] overflow-y-auto select-all">{show ? value : "•".repeat(Math.min(value.length, 48))}</div>
    </div>
  );
}

function CodeBlock({ label, value, secret }: { label: string; value?: string; secret?: boolean }) {
  const [show, setShow] = useState(false);
  if (!value) return null;
  const display = secret && !show ? "•".repeat(Math.min(value.length, 40)) : value;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
        <div className="flex items-center gap-2">
          {secret && (
            <button type="button" onClick={() => setShow(!show)} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
              {show ? <EyeOff size={12} /> : <Eye size={12} />}
              {show ? "إخفاء" : "إظهار"}
            </button>
          )}
          <CopyButton text={value} />
        </div>
      </div>
      <div className="bg-gray-900 rounded-xl px-4 py-3 font-mono text-xs text-green-400 leading-relaxed break-all max-h-[100px] overflow-y-auto">{display}</div>
    </div>
  );
}

function StatusBadge({ status, expired }: { status?: string; expired?: boolean }) {
  if (expired) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-200">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
        منتهي
      </span>
    );
  }
  if (!status) return null;
  const isActive = status.toLowerCase().includes("active") || status === "فعال";
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${isActive ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-600 border-gray-200"}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-[#2ecc71]" : "bg-gray-400"}`} />
      {status}
    </span>
  );
}

function ReviewRow({ label, value }: { label: string; value?: string | number | boolean }) {
  const display = value === true ? "نعم" : value === false ? "لا" : (value ?? "—");
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-semibold text-gray-800">{String(display)}</span>
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

interface Props {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  device?: POSDevice;
  editMode: boolean;
}

export default function AddPOSDeviceModal({ isOpen, onOpenChange, device, editMode }: Props) {
  const { direction } = useLanguage();
  const [step, setStep] = useState(1);
  const isEdit = editMode;
  const isCertificateMode = !!device && !editMode;

  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus | undefined>();

  const [clickedGeneratedCSR, setClickedGeneratedCSR] = useState<boolean>(false);
  const [createdDeviceId, setCreatedDeviceId] = useState<number | undefined>();
  const [csr, setCsr] = useState<CSRResult | undefined>();
  const [privateKey, setPrivateKey] = useState<string | undefined>();
  const [ccsid, setCcsid] = useState<CCSIDResult | undefined>();
  const [pcsid, setPcsid] = useState<PCSIDResult | undefined>();
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");

  const { mutateAsync: createDevice, isPending: isCreating } = useCreateDevicePOS();
  const { mutateAsync: updateDevice, isPending: isUpdating } = useUpdatePOSDevice();
  const { mutateAsync: generateCSR, isPending: isGeneratingCSR } = useGenerateCSR();
  const { mutateAsync: registerCCSID, isPending: isRegisteringCCSID } = useRegisterCCSID();
  const { mutateAsync: registerPCSID, isPending: isRegisteringPCSID } = useUpgradeToPcsid();
  const { data: branches } = useGetAllBranches();
  const { data: deviceTypes } = useGetAllDeviceTypes();
  const { refetch } = useGenereateSerial();

  const taxSetting = useSettingsStore((state) => state.settings?.taxSetting?.taxSetting);
  console.log(taxSetting);
  const isExempt = taxSetting === "Exempt";
  const isFirstStage = taxSetting === "FirstStage";

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      deviceName: "",
      serialNumber: "",
      InvoiceSequence: "",
      branchId: 0,
    },
  });

  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setCsr(undefined);
      setPrivateKey(undefined);
      setCcsid(undefined);
      setPcsid(undefined);
      setOtp("");
      setOtpError("");
      setCreatedDeviceId(undefined);
      setDeviceStatus(undefined);
      return;
    }

    if (device) {
      form.reset({
        deviceName: device.deviceName,
        serialNumber: device.serialNumber,
        InvoiceSequence: device.InvoiceSequence,
        branchId: device.branchId,
        location: device.location,
        isActive: device.isActive,
      });
      setCreatedDeviceId(device.id);
      setDeviceStatus(device.status as DeviceStatus);

      const resumeStep = statusToStep[device.status as DeviceStatus] ?? 1;
      if (isEdit) {
        setStep(1);
      } else {
        setStep(resumeStep);
      }
    } else {
      form.reset();
      setStep(1);
    }
  }, [isOpen, device]);

  const handleUpdate = async () => {
    const fields = STEP_FIELDS[1];
    const valid = await form.trigger(fields);
    if (!valid) return;

    try {
      const data = form.getValues();
      await updateDevice({
        id: device?.id!,
        data: {
          deviceName: data.deviceName,
          InvoiceSequence: data.InvoiceSequence,
          branchId: data.branchId,
          isActive: true,
          allowOnlineInvoicing: true,
        },
      });
      onOpenChange(false);
    } catch {}
  };
  const handleNext = async () => {
    const fields = STEP_FIELDS[step];
    if (fields) {
      const valid = await form.trigger(fields);
      if (!valid) return;
    }

    if (isFirstStage && step === 1) {
      if (!createdDeviceId) {
        try {
          const data = form.getValues();
          const payload: CreateDevicePOS = {
            deviceName: data.deviceName,
            serialNumber: data.serialNumber,
            InvoiceSequence: data.InvoiceSequence,
            branchId: data.branchId,
          };
          await createDevice(payload);
        } catch {
          return;
        }
      }
      onOpenChange(false);
      return;
    }

    const isCCSIDResumed = step === 4 && deviceStatus === "CCSIDRegistered" && !pcsid;
    if (!isCCSIDResumed && !isStepComplete(step, clickedGeneratedCSR, ccsid, pcsid, deviceStatus)) {
      return;
    }

    if (step === 1 && !createdDeviceId) {
      try {
        const data = form.getValues();
        const payload: CreateDevicePOS = {
          deviceName: data.deviceName,
          serialNumber: data.serialNumber,
          InvoiceSequence: data.InvoiceSequence,
          branchId: data.branchId,
        };
        const res = await createDevice(payload);
        setCreatedDeviceId(res?.data?.id);
      } catch {
        return;
      }
    }

    setStep((s) => Math.min(s + 1, 5));
  };

  const handleBack = () => {
    if (deviceStatus === "CCSIDRegistered" && step <= 4) return;
    setStep((s) => Math.max(s - 1, 1));
  };

  const handleGenerateCSR = async () => {
    if (!createdDeviceId) return;
    try {
      const res = await generateCSR({ deviceId: createdDeviceId });
      setClickedGeneratedCSR(true);
      setCsr({
        secret: res?.data?.secretKey,
        token: res?.data?.token,
        status: res?.data?.newStatus,
        isExpired: res?.data?.expiresAt ? new Date(res.data.expiresAt) <= new Date() : false,
        expiresAt: res?.data?.expiresAt,
      });
    } catch {}
  };

  const handleRegisterCCSID = useCallback(async () => {
    if (!otp.trim()) {
      setOtpError("يرجى إدخال رمز OTP");
      return;
    }
    if (!createdDeviceId) return;
    setOtpError("");
    try {
      const res = await registerCCSID({ deviceId: createdDeviceId, otp });
      const expiresAt = res?.data?.expiresAt;
      const isExpired = !expiresAt || new Date(expiresAt) <= new Date();
      setCcsid({
        token: res?.data?.token,
        secret: res?.data?.secretKey,
        status: res?.data?.newStatus,
        isExpired,
        expiresAt: res?.data?.expiresAt,
      });
    } catch {
      setOtpError("رمز OTP غير صحيح أو منتهي الصلاحية، حاول مجدداً");
    }
  }, [otp, createdDeviceId]);

  const handleRegisterPCSID = async () => {
    if (!createdDeviceId) return;
    try {
      const res = await registerPCSID({ deviceId: createdDeviceId });
      const expiresAt = res?.data?.expiresAt;
      const isExpired = !expiresAt || new Date(expiresAt) <= new Date();
      setPcsid({
        token: res?.data?.token,
        secret: res?.data?.secretKey,
        status: res?.data?.newStatus,
        isExpired,
        expiresAt: res?.data?.expiresAt,
      });
    } catch {}
  };

  const anyLoading = isCreating || isUpdating || isGeneratingCSR || isRegisteringCCSID || isRegisteringPCSID;

  const isCCSIDResumedStep = step === 4 && deviceStatus === "CCSIDRegistered" && !pcsid;
  const nextDisabled = anyLoading || (!isCCSIDResumedStep && !isStepComplete(step, clickedGeneratedCSR, ccsid, pcsid, deviceStatus));

  const backHidden = deviceStatus === "CCSIDRegistered" && step === 4;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent dir={direction} className="sm:max-w-[600px] p-0 overflow-hidden rounded-2xl gap-0">
        <div className="px-6 pt-5 pb-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">{isCertificateMode ? "استكمال تسجيل نقطة البيع" : isEdit ? "تعديل بيانات جهاز" : "إضافة نقطة بيع جديدة"}</DialogTitle>
          </DialogHeader>
          {!isEdit && !isFirstStage && <StepperHeader current={step} />}{" "}
          <div className="max-h-[52vh] overflow-y-auto no-scrollbar pr-1">
            {step === 1 && (
              <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <Controller
                  name="deviceName"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid} className="col-span-2">
                      <FieldLabel>
                        اسم الجهاز <span className="text-red-500">*</span>
                      </FieldLabel>
                      <Input {...field} placeholder="مثال: POS-01 — الكاشير الرئيسي" />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />

                <div className="col-span-2">
                  <Controller
                    name="branchId"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>
                          الفرع <span className="text-red-500">*</span>
                        </FieldLabel>
                        <Select value={field.value ? String(field.value) : ""} onValueChange={(v) => field.onChange(Number(v))}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="اختر الفرع" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              {branches?.map((b: any) => (
                                <SelectItem key={b.id} value={String(b.id)}>
                                  {b.name}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                </div>

                <Controller
                  name="serialNumber"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>
                        الرقم التسلسلي <span className="text-red-500">*</span>
                      </FieldLabel>
                      <div className="flex flex-row items-center gap-2">
                        <Input {...field} placeholder="POS-RUH-2024-001" className={`${isEdit && "cursor-not-allowed"}`} readOnly={isEdit} />
                        {!isEdit && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon-xl"
                            className="shrink-0 px-3"
                            onClick={async () => {
                              try {
                                const { data } = await refetch();
                                field.onChange(data?.data ?? "");
                              } catch (e) {
                                console.error(e);
                              }
                            }}
                          >
                            <Barcode size={16} />
                          </Button>
                        )}
                      </div>
                      {!isEdit && <span className="text-[10px] text-gray-500">لا يمكن تعديله بعد إنشاء CSR</span>}
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
                <Controller
                  name="InvoiceSequence"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>
                        تسلسل رقم الفاتورة<span className="text-red-500">*</span>
                      </FieldLabel>
                      <Input {...field} placeholder="ادخل تسلسل رقم الفاتورة" />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 flex gap-3">
                  <KeySquare size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-700 leading-relaxed">سيتم توليد مفتاح خاص وCSR تلقائياً — يُخزَّن المفتاح مشفّراً ولن يُعرض مجدداً</p>
                </div>

                {!csr ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                      <KeySquare size={28} className="text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500">لم يتم توليد CSR بعد</p>
                    <Button type="button" onClick={handleGenerateCSR} disabled={isGeneratingCSR} className="flex items-center gap-2 bg-[#2ecc71] hover:bg-[#27ae60] text-white px-6">
                      {isGeneratingCSR ? <Loader2 size={16} className="animate-spin" /> : <KeySquare size={16} />}
                      {isGeneratingCSR ? "جاري التوليد..." : "توليد CSR"}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-[#2ecc71] font-semibold">
                        <CheckCircle2 size={16} />
                        تم توليد CSR بنجاح
                      </div>
                      <Button type="button" variant="outline" size="sm" onClick={handleGenerateCSR} disabled={isGeneratingCSR} className="flex items-center gap-1.5 text-xs h-7">
                        <RefreshCw size={11} />
                        إعادة التوليد
                      </Button>
                    </div>
                    <CodeBlock label="ملف CSR" value={csr?.token} />
                    <CodeBlock label="المفتاح الخاص (Private Key)" secret={true} value={csr?.secret} />
                    <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
                      <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
                      شيله في مكان كويس عشان مش هتشوفه تاني
                    </div>
                  </div>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                {!ccsid ? (
                  <>
                    <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 space-y-2.5">
                      <p className="text-sm font-semibold text-amber-800 flex items-center gap-2">
                        <ShieldCheck size={16} />
                        كيفية الحصول على رمز OTP
                      </p>
                      <ol className="space-y-2">
                        {[].map((s, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="w-4 h-4 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                            <span className="text-xs text-amber-700">{s}</span>
                          </li>
                        ))}
                      </ol>
                    </div>

                    <Field data-invalid={!!otpError}>
                      <FieldLabel>
                        رمز OTP <span className="text-red-500">*</span>
                      </FieldLabel>
                      <Input
                        value={otp}
                        onChange={(e) => {
                          setOtp(e.target.value.replace(/\D/g, ""));
                          setOtpError("");
                        }}
                        placeholder="• • • • • •"
                        maxLength={6}
                        className="font-mono text-center text-2xl tracking-[0.6em] h-14"
                        autoComplete="one-time-code"
                        inputMode="numeric"
                      />
                      {otpError && (
                        <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                          <AlertCircle size={11} />
                          {otpError}
                        </p>
                      )}
                    </Field>

                    <Button type="button" onClick={handleRegisterCCSID} disabled={isRegisteringCCSID || otp.length < 4} className="w-full flex items-center justify-center gap-2 bg-[#2ecc71] hover:bg-[#27ae60] text-white h-11">
                      {isRegisteringCCSID && <Loader2 size={16} className="animate-spin" />}
                      {isRegisteringCCSID ? "جاري التحقق والتسجيل..." : "تأكيد OTP وتسجيل CCSID"}
                    </Button>
                  </>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-[#2ecc71] font-semibold">
                      <CheckCircle2 size={16} />
                      تم تسجيل CCSID بنجاح
                    </div>
                    <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-1">
                      <SectionTitle>حالة CCSID</SectionTitle>
                      <div className="flex justify-between items-center py-2.5 border-b border-gray-50">
                        <span className="text-sm text-gray-500">الحالة</span>
                        <StatusBadge status={ccsid.status} expired={ccsid.isExpired} />
                      </div>
                      <ReviewRow label="تاريخ الانتهاء" value={formatDate(ccsid.expiresAt)} />
                    </div>
                    <SecretBlock label="CCSID Token" value={ccsid.token} />
                    <SecretBlock label="CCSID Secret" value={ccsid.secret} />
                    <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
                      <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
                      احفظ الـ Token والـ Secret - عشان مش هتشوفهم تاني
                    </div>
                  </div>
                )}
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                {/* الـ card دي بتتشال لو مفيش ccsid في الـ state (حالة الاستكمال من CCSIDRegistered) */}
                {ccsid && (
                  <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-1">
                    <SectionTitle>CCSID Token (مطلوب لتسجيل PCSID)</SectionTitle>
                    <div className="flex justify-between items-center py-2.5 border-b border-gray-50">
                      <span className="text-sm text-gray-500">الحالة</span>
                      <StatusBadge status={ccsid?.status} expired={ccsid?.isExpired} />
                    </div>
                    <ReviewRow label="ينتهي في" value={formatDate(ccsid?.expiresAt)} />
                    <div className="py-2 flex items-center justify-between">
                      <span className="text-xs font-mono text-gray-500 truncate max-w-[300px]">{ccsid?.token?.slice(0, 38)}…</span>
                      {ccsid?.token && <CopyButton text={ccsid.token} />}
                    </div>
                  </div>
                )}

                {!pcsid ? (
                  <Button type="button" onClick={handleRegisterPCSID} disabled={isRegisteringPCSID || (!!ccsid && ccsid.isExpired)} className="w-full flex items-center justify-center gap-2 bg-[#2ecc71] hover:bg-[#27ae60] text-white h-11">
                    {isRegisteringPCSID && <Loader2 size={16} className="animate-spin" />}
                    {isRegisteringPCSID ? "جاري تسجيل PCSID..." : "تسجيل PCSID"}
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-[#2ecc71] font-semibold">
                      <CheckCircle2 size={16} />
                      تم تسجيل PCSID بنجاح
                    </div>
                    <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-1">
                      <SectionTitle>حالة PCSID</SectionTitle>
                      <div className="flex justify-between items-center py-2.5 border-b border-gray-50">
                        <span className="text-sm text-gray-500">الحالة</span>
                        <StatusBadge status={pcsid.status} expired={pcsid.isExpired} />
                      </div>
                      <ReviewRow label="تاريخ الإصدار" value={formatDate(pcsid.issuedAt)} />
                      <ReviewRow label="تاريخ الانتهاء" value={formatDate(pcsid.expiresAt)} />
                    </div>
                    <SecretBlock label="PCSID Token" value={pcsid.token} />
                    {pcsid.secret && <SecretBlock label="PCSID Secret" value={pcsid.secret} />}
                    <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
                      <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
                      احفظ الـ Token والـ Secret الآن - عشان مش هتشوفهم تاني
                    </div>
                  </div>
                )}
              </div>
            )}

            {step === 5 && (
              <div className="flex flex-col items-center text-center py-6 gap-5 animate-in fade-in zoom-in-95 duration-400">
                <div className="w-20 h-20 rounded-full bg-green-50 border-4 border-[#2ecc71] flex items-center justify-center">
                  <CheckCircle2 size={40} className="text-[#2ecc71]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">تم تسجيل الجهاز بنجاح!</h3>
                  <p className="text-sm text-gray-500 mt-1">الجهاز جاهز للفوترة الإلكترونية المتوافقة مع زاتكا</p>
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-between items-center mt-5 pt-4 border-t border-gray-100">
            {isEdit ? (
              <>
                <Button size="2xl" type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={anyLoading} className="flex items-center gap-1.5">
                  إلغاء
                </Button>
                <Button size="2xl" type="button" onClick={handleUpdate} disabled={anyLoading} className="flex items-center gap-1.5 bg-[#2ecc71] hover:bg-[#27ae60] text-white">
                  {isUpdating ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      جاري التحديث...
                    </>
                  ) : (
                    "تحديث البيانات"
                  )}
                </Button>
              </>
            ) : isFirstStage ? (
              <>
                <Button size="2xl" type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={anyLoading}>
                  إلغاء
                </Button>
                <Button size="2xl" type="button" onClick={handleNext} disabled={anyLoading} className="flex items-center gap-1.5 bg-[#2ecc71] hover:bg-[#27ae60] text-white">
                  {isCreating ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      جاري الحفظ...
                    </>
                  ) : (
                    "إضافة الجهاز"
                  )}
                </Button>
              </>
            ) : (
              <>
                <Button size="2xl" type="button" variant="outline" onClick={() => (step === 1 || step === 5 ? onOpenChange(false) : handleBack())} disabled={anyLoading || backHidden} className={`flex items-center gap-1.5 ${backHidden ? "invisible" : ""}`}>
                  {step === 5 ? (
                    "إغلاق"
                  ) : (
                    <>
                      <ChevronRight size={16} />
                      {step === 1 ? "إلغاء" : "السابق"}
                    </>
                  )}
                </Button>

                {step < 5 && (
                  <Button size="2xl" type="button" onClick={handleNext} disabled={nextDisabled} className="flex items-center gap-1.5 bg-[#2ecc71] hover:bg-[#27ae60] text-white">
                    {isCreating || isUpdating ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        جاري الحفظ...
                      </>
                    ) : (
                      <>
                        التالي
                        <ChevronLeft size={16} />
                      </>
                    )}
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
