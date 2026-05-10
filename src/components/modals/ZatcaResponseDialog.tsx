import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ShieldCheck, ShieldX, AlertTriangle, CheckCircle2, XCircle, Info, FileCheck } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type StatusType = "PASS" | "WARNING" | "ERROR";

interface ZatcaMessage {
  type: string;       // "INFO" | "WARNING" | "ERROR"
  code: string;       // e.g. "XSD_ZATCA_VALID"
  category: string;   // e.g. "XSD validation"
  message: string;
  status: StatusType;
}

interface ValidationResults {
  infoMessages: ZatcaMessage[];
  warningMessages: ZatcaMessage[];
  errorMessages: ZatcaMessage[];
  status: StatusType;
}

/** Raw ZATCA response — may arrive as a JSON string or a parsed object */
type RawZatcaResponse =
  | {
      validationResults: ValidationResults;
      reportingStatus: string; // e.g. "REPORTED" | "NOT_REPORTED"
    }
  | string
  | null
  | undefined;

interface ZatcaResponseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceNumber?: string | number;
  zatcaResponse?: RawZatcaResponse;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseZatcaResponse(raw: RawZatcaResponse) {
  if (!raw) return null;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as { validationResults: ValidationResults; reportingStatus: string };
    } catch {
      return null;
    }
  }
  return raw;
}

const statusConfig: Record<StatusType, {
  label: string;
  labelAr: string;
  icon: React.ElementType;
  containerClass: string;
  iconClass: string;
  textClass: string;
  badgeClass: string;
}> = {
  PASS: {
    label: "PASS",
    labelAr: "ناجح",
    icon: ShieldCheck,
    containerClass: "bg-[#00e6821a] border border-[#09ad9533]",
    iconClass: "text-[#09ad95]",
    textClass: "text-[#09ad95]",
    badgeClass: "bg-[#09ad9520] text-[#09ad95]",
  },
  WARNING: {
    label: "WARNING",
    labelAr: "تحذير",
    icon: AlertTriangle,
    containerClass: "bg-[#fff3cd1a] border border-[#ffc10733]",
    iconClass: "text-[#e6a817]",
    textClass: "text-[#e6a817]",
    badgeClass: "bg-[#ffc10720] text-[#e6a817]",
  },
  ERROR: {
    label: "ERROR",
    labelAr: "مرفوض",
    icon: ShieldX,
    containerClass: "bg-[#f50b0b1a] border border-[#f50b0b33]",
    iconClass: "text-[#b40b09]",
    textClass: "text-[#b40b09]",
    badgeClass: "bg-[#f50b0b20] text-[#b40b09]",
  },
};

const reportingStatusConfig: Record<string, { labelAr: string; class: string }> = {
  REPORTED:      { labelAr: "تم الإبلاغ",        class: "bg-[#09ad9520] text-[#09ad95]" },
  NOT_REPORTED:  { labelAr: "لم يتم الإبلاغ",    class: "bg-[#f50b0b20] text-[#b40b09]" },
  CLEARED:       { labelAr: "تمت المقاصة",        class: "bg-[#09ad9520] text-[#09ad95]" },
  NOT_CLEARED:   { labelAr: "لم تتم المقاصة",    class: "bg-[#f50b0b20] text-[#b40b09]" },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const MessageList: React.FC<{
  icon: React.ReactNode;
  label: string;
  messages: ZatcaMessage[];
  emptyText?: string;
  badgeClass?: string;
}> = ({ icon, label, messages, emptyText = "—", badgeClass }) => (
  <div className="flex flex-col gap-1.5">
    <div className="flex items-center gap-2 text-sm font-medium text-[var(--foreground)]">
      {icon}
      {label}
    </div>
    <div className="pr-6">
      {messages.length > 0 ? (
        <ul className="space-y-2">
          {messages.map((msg, i) => (
            <li key={i} className="flex flex-col gap-0.5">
              {badgeClass ? (
                <div className={`inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-md font-medium ${badgeClass}`}>
                  <CheckCircle2 size={12} />
                  {msg.message}
                </div>
              ) : (
                <div className="text-sm text-[var(--muted-foreground)] flex items-start gap-2">
                  <span className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-current opacity-50" />
                  <span>{msg.message}</span>
                </div>
              )}
              {msg.code && (
                <span className="text-[10px] text-[var(--muted-foreground)] opacity-60 pr-4">
                  [{msg.code}] — {msg.category}
                </span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <span className="text-sm text-[var(--muted-foreground)]">{emptyText}</span>
      )}
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export const ZatcaResponseDialog: React.FC<ZatcaResponseDialogProps> = ({
  open,
  onOpenChange,
  invoiceNumber,
  zatcaResponse,
}) => {
  const parsed = parseZatcaResponse(zatcaResponse);
  const validation = parsed?.validationResults;
  const status: StatusType = validation?.status ?? "PASS";
  const config = statusConfig[status] ?? statusConfig.PASS;
  const StatusIcon = config.icon;

  const reportingStatus = parsed?.reportingStatus ?? "";
  const reportingLabel = reportingStatusConfig[reportingStatus];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" dir="rtl">
        <DialogHeader className="border-b pb-3">
          <DialogTitle className="text-base font-semibold text-right">
            متابعة رد هيئة الزكاة والدخل لفاتورة رقم{" "}
            <span className="font-bold">{invoiceNumber ?? "—"}</span>
          </DialogTitle>
        </DialogHeader>

        {/* Logos row */}
        <div className="flex items-center justify-between py-2">
          <div className="text-right">
            <p className="text-xs font-semibold text-[var(--foreground)] leading-tight">
              هيئة الزكاة والضريبة والجمارك
            </p>
            <p className="text-[10px] text-[var(--muted-foreground)]">
              Zakat, Tax and Customs Authority
            </p>
          </div>

       
        </div>

        {/* Status card */}
        <div className={`rounded-xl p-4 ${config.containerClass}`}>
          {/* Status header */}
          <div className="flex items-center justify-between mb-4">
            <div className={`flex items-center gap-2 text-sm font-semibold ${config.textClass}`}>
              <StatusIcon size={18} />
              {config.labelAr} ({config.label})
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${config.badgeClass}`}>
              حالة الرد
            </span>
          </div>

          <div className="space-y-4">
            {/* Error messages — shown only when present */}
            {(validation?.errorMessages?.length ?? 0) > 0 && (
              <MessageList
                icon={<XCircle size={14} className="text-[#b40b09]" />}
                label="رسائل الخطأ"
                messages={validation!.errorMessages}
              />
            )}

            {/* Warning messages — shown only when present */}
            {(validation?.warningMessages?.length ?? 0) > 0 && (
              <MessageList
                icon={<AlertTriangle size={14} className="text-[#e6a817]" />}
                label="رسائل التحذير"
                messages={validation!.warningMessages}
              />
            )}

            {/* Info / ZATCA messages — shown only when present */}
            {(validation?.infoMessages?.length ?? 0) > 0 && (
              <MessageList
                icon={<Info size={14} className="text-[var(--muted-foreground)]" />}
                label="رد زاتكا"
                messages={validation!.infoMessages}
                badgeClass={config.badgeClass}
              />
            )}

            {/* Fallback if all lists are empty */}
            {(validation?.errorMessages?.length ?? 0) === 0 &&
              (validation?.warningMessages?.length ?? 0) === 0 &&
              (validation?.infoMessages?.length ?? 0) === 0 && (
                <p className="text-sm text-[var(--muted-foreground)] text-center py-2">
                  لا توجد رسائل
                </p>
              )}
          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
};