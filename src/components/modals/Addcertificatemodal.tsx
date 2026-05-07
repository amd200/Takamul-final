import React, { useCallback, useEffect, useState } from "react";
import { KeySquare, ShieldCheck, ShieldPlus, CheckCircle2, ChevronLeft, ChevronRight, Copy, Loader2, AlertCircle, RefreshCw, Eye, EyeOff, Monitor } from "lucide-react";

import { useLanguage } from "@/context/LanguageContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGenerateCSR } from "@/features/ZatcaRegistration/hooks/useGenerateCSR";
import { useRegisterCCSID } from "@/features/ZatcaRegistration/hooks/useRegisterCCSID";
import { useUpgradeToPcsid } from "@/features/ZatcaRegistration/hooks/useUpgradeToPcsid";
import formatDate from "@/lib/formatDate";
import { Certificate } from "@/features/PosCertificates/types/pos.types";
import { useGetAllPOSDevices } from "@/features/posDevice/hooks/useGetAllPOSDevices";

// ─── Types ────────────────────────────────────────────────────────────────────

interface POSDeviceOption {
  id: number;
  deviceName: string;
  serialNumber: string;
  certificateId?: number;
  status?: string;
}

interface CSRResult {
  token: string;
  secret: string;
  status?: string;
  isExpired?: boolean;
  expiresAt?: string;
}

interface CCSIDResult {
  token: string;
  secret: string;
  status?: string;
  isExpired?: boolean;
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

// ─── Steps config ─────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: "اختيار الجهاز", icon: Monitor },
  { id: 2, label: "توليد CSR", icon: KeySquare },
  { id: 3, label: "تسجيل CCSID", icon: ShieldCheck },
  { id: 4, label: "تسجيل PCSID", icon: ShieldPlus },
  { id: 5, label: "اكتمل", icon: CheckCircle2 },
];

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

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pass list of all available devices to pick from */
  /** Optionally pre-select a device (e.g. when opening from a specific device row) */
  preselectedDeviceId?: number;
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export default function AddCertificateModal({ isOpen, onOpenChange, preselectedDeviceId }: Props) {
  const { direction } = useLanguage();

  const [step, setStep] = useState(1);
  const [selectedDeviceId, setSelectedDeviceId] = useState<number | undefined>(undefined);
  const [deviceSelectError, setDeviceSelectError] = useState("");

  const [clickedGeneratedCSR, setClickedGeneratedCSR] = useState(false);
  const [csr, setCsr] = useState<CSRResult | undefined>();
  const [ccsid, setCcsid] = useState<CCSIDResult | undefined>();
  const [pcsid, setPcsid] = useState<PCSIDResult | undefined>();
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");

  const { mutateAsync: generateCSR, isPending: isGeneratingCSR } = useGenerateCSR();
  const { mutateAsync: registerCCSID, isPending: isRegisteringCCSID } = useRegisterCCSID();
  const { mutateAsync: registerPCSID, isPending: isRegisteringPCSID } = useUpgradeToPcsid();
  const { data: devices } = useGetAllPOSDevices();

  const selectedDevice = devices?.data?.find((d) => d.id === selectedDeviceId);

  useEffect(() => {
    if (!open) {
      setStep(1);
      setClickedGeneratedCSR(false);
      setCsr(undefined);
      setCcsid(undefined);
      setPcsid(undefined);
      setOtp("");
      setOtpError("");
      setDeviceSelectError("");
      setSelectedDeviceId(undefined);
    }
  }, [isOpen]);

  // ─── Step helpers ─────────────────────────────────────────────────────────────
  const isStepComplete = (s: number) => {
    switch (s) {
      case 1:
        return !!selectedDeviceId;
      case 2:
        return clickedGeneratedCSR;
      case 3:
        return !!ccsid;
      case 4:
        return !!pcsid;
      default:
        return true;
    }
  };

  // ─── Handlers ────────────────────────────────────────────────────────────────
  const handleNext = () => {
    if (step === 1 && !selectedDeviceId) {
      setDeviceSelectError("يرجى اختيار الجهاز أولاً");
      return;
    }
    if (!isStepComplete(step)) return;
    setStep((s) => Math.min(s + 1, 5));
  };

  const handleBack = () => setStep((s) => Math.max(s - 1, 1));

  const handleGenerateCSR = async () => {
    if (!selectedDevice?.id) return;
    try {
      const res = await generateCSR({ deviceId: selectedDevice.id });
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
    setOtpError("");
    try {
      const res = await registerCCSID({ certificateId: selectedDevice?.certificateId ?? 8, otp });
      const expiresAt = res?.data?.expiresAt;
      setCcsid({
        token: res?.data?.token,
        secret: res?.data?.secretKey,
        status: res?.data?.newStatus,
        isExpired: !expiresAt || new Date(expiresAt) <= new Date(),
        expiresAt,
      });
    } catch {
      setOtpError("رمز OTP غير صحيح أو منتهي الصلاحية، حاول مجدداً");
    }
  }, [otp, selectedDevice]);

  const handleRegisterPCSID = async () => {
    try {
      const res = await registerPCSID({ certificateId: selectedDevice?.certificateId ?? 8 });
      const expiresAt = res?.data?.expiresAt;
      setPcsid({
        token: res?.data?.token,
        secret: res?.data?.secretKey,
        status: res?.data?.newStatus,
        isExpired: !expiresAt || new Date(expiresAt) <= new Date(),
        issuedAt: "res?.data?.issuedAt",
        expiresAt,
      });
    } catch {}
  };

  const anyLoading = isGeneratingCSR || isRegisteringCCSID || isRegisteringPCSID;
  const nextDisabled = anyLoading || !isStepComplete(step);

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent dir={direction} className="sm:max-w-[600px] p-0 overflow-hidden rounded-2xl gap-0">
        <div className="px-6 pt-5 pb-6">
          {/* Header */}
          <DialogHeader className="mb-4">
            <DialogTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <ShieldPlus size={20} className="text-[#2ecc71]" />
              تسجيل شهادة
            </DialogTitle>
          </DialogHeader>

          <StepperHeader current={step} />

          {/* Step content */}
          <div className="max-h-[52vh] overflow-y-auto no-scrollbar pr-1">
            {/* ── Step 1: اختيار الجهاز ── */}
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 flex gap-3">
                  <Monitor size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-700 leading-relaxed">اختر الجهاز الذي تريد إصدار شهادة له</p>
                </div>

                <Field>
                  <FieldLabel>
                    الجهاز <span className="text-red-500">*</span>
                  </FieldLabel>
                  <Select
                    value={selectedDeviceId ? String(selectedDeviceId) : ""}
                    onValueChange={(v) => {
                      setSelectedDeviceId(Number(v));
                      setDeviceSelectError("");
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="اختر الجهاز" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {devices?.data?.map((d) => (
                          <SelectItem key={d.id} value={String(d.id)}>
                            <div className="flex items-center gap-2">
                              <Monitor size={14} className="text-gray-400" />
                              <span>{d.deviceName}</span>
                              <span className="text-xs text-gray-400">({d.serialNumber})</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {deviceSelectError && (
                    <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                      <AlertCircle size={11} />
                      {deviceSelectError}
                    </p>
                  )}
                </Field>

                {selectedDevice && (
                  <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-1">
                    <SectionTitle>بيانات الجهاز المختار</SectionTitle>
                    <ReviewRow label="اسم الجهاز" value={selectedDevice.deviceName} />
                    <ReviewRow label="الرقم التسلسلي" value={selectedDevice.serialNumber} />
                  </div>
                )}
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
                    <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
                      <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
                      شيله في مكان كويس عشان مش هتشوفه تاني
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Step 3: تسجيل CCSID ── */}
            {step === 3 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                {!ccsid ? (
                  <>
                    <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 space-y-2.5">
                      <p className="text-sm font-semibold text-amber-800 flex items-center gap-2">
                        <ShieldCheck size={16} />
                        كيفية الحصول على رمز OTP
                      </p>
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
                    <CodeBlock secret label="CCSID Token" value={ccsid.token} />
                    <CodeBlock secret label="CCSID Secret" value={ccsid.secret} />
                    <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
                      <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
                      احفظ الـ Token والـ Secret - عشان مش هتشوفهم تاني
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Step 4: تسجيل PCSID ── */}
            {step === 4 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                {ccsid && (
                  <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-1">
                    <SectionTitle>CCSID Token (مطلوب لتسجيل PCSID)</SectionTitle>
                    <div className="flex justify-between items-center py-2.5 border-b border-gray-50">
                      <span className="text-sm text-gray-500">الحالة</span>
                      <StatusBadge status={ccsid.status} expired={ccsid.isExpired} />
                    </div>
                    <ReviewRow label="ينتهي في" value={formatDate(ccsid.expiresAt)} />
                    <div className="py-2 flex items-center justify-between">
                      <span className="text-xs font-mono text-gray-500 truncate max-w-[300px]">{ccsid.token?.slice(0, 38)}…</span>
                      {ccsid.token && <CopyButton text={ccsid.token} />}
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
                    <CodeBlock secret label="PCSID Token" value={pcsid.token} />
                    {pcsid.secret && <CodeBlock secret label="PCSID Secret" value={pcsid.secret} />}
                    <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
                      <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
                      احفظ الـ Token والـ Secret الآن - عشان مش هتشوفهم تاني
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Step 5: اكتمل ── */}
            {step === 5 && (
              <div className="flex flex-col items-center text-center py-6 gap-5 animate-in fade-in zoom-in-95 duration-400">
                <div className="w-20 h-20 rounded-full bg-green-50 border-4 border-[#2ecc71] flex items-center justify-center">
                  <CheckCircle2 size={40} className="text-[#2ecc71]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">تم تسجيل الشهادة بنجاح!</h3>
                  <p className="text-sm text-gray-500 mt-1">الجهاز جاهز للفوترة الإلكترونية المتوافقة مع زاتكا</p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center mt-5 pt-4 border-t border-gray-100">
            <Button size="2xl" type="button" variant="outline" onClick={() => (step === 1 || step === 5 ? onOpenChange(false) : handleBack())} disabled={anyLoading} className="flex items-center gap-1.5">
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
                التالي
                <ChevronLeft size={16} />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
