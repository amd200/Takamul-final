// ─── UnifiedPaymentDialog.tsx ─────────────────────────────────────────────────
import { calcTotals } from "@/constants/data";
import { useLanguage } from "@/context/LanguageContext";
import { useGetAllTreasurys } from "@/features/treasurys/hooks/useGetAllTreasurys";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { FileText, Mail, MessageCircle, Printer, Save, Vault, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Numpad } from "../cashier/CashierPanel";
import { Button } from "@/components/ui/button";
import { Treasury } from "@/features/treasurys/types/treasurys.types";
import { CreateSalesOrder } from "@/features/sales/types/sales.types";
import { useCreateTakwayOrder } from "@/features/pos/hooks/useCreateTakeawayOrder";
import { useCreateDeliveryOrder } from "@/features/pos/hooks/useCreateDeliveryOrder";
import { useCheckoutDineInOrder } from "@/features/pos/hooks/useCreateDineInOrder";
import { useReleaseHolding } from "@/features/pos/hooks/useReleaseHolding";
import { useGetAllCustomers } from "@/features/customers/hooks/useGetAllCustomers";
import { usePosStore } from "@/features/pos/store/usePosStore";
import { useGenerateCSR } from "@/features/ZatcaRegistration/hooks/useGenerateCSR";
import { useGenerateQR } from "@/features/zatcaInvoice/hooks/useGenerateQR";

type PaymentMode = "cashier" | "payment";
type SaveAction = "pdf" | "whatsapp" | "email" | "save_only";

interface UnifiedPaymentDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mode?: PaymentMode;
  total?: number;
  onCancel?: () => void;
  onSave?: (opts: { vault: Treasury; method: string; action: SaveAction }) => void;
}

interface Split {
  id: string;
  vaultId: number;
  raw: string;
}

function VaultChips({ value, onChange, treasurys }: { value: number; onChange: (id: number) => void; treasurys: Treasury[] }) {
  return (
    <div className="flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: "none" } as React.CSSProperties} onClick={(e) => e.stopPropagation()}>
      {treasurys.map((v) => {
        const active = value === v.id;
        return (
          <button
            key={v.id}
            onClick={() => onChange(v.id)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border-2 transition-all flex-shrink-0
              ${active ? "border-primary bg-primary/10" : "border-border bg-card hover:border-border/80"}`}
          >
            <Vault size={10} className={active ? "text-primary" : "text-muted-foreground"} />
            <span className={`text-xs font-bold whitespace-nowrap ${active ? "text-primary" : "text-muted-foreground"}`}>{v.name}</span>
          </button>
        );
      })}
    </div>
  );
}

export function UnifiedPaymentDialog({ open, onOpenChange, mode = "cashier", total: externalTotal, onCancel, onSave }: UnifiedPaymentDialogProps) {
  const { t } = useLanguage();
  const { data: treasurys } = useGetAllTreasurys();
  const { data: customers } = useGetAllCustomers();
  const { selectedCustomer, cart, discount, setPaidAmount, setSelectedVaultId, handleConfirmPayment } = usePosStore();
  const { mutateAsync: generateQR } = useGenerateQR();

  // ── deps ──────────────────────────────────────────────────────────────────
  const { mutateAsync: createTakwayOrder } = useCreateTakwayOrder();
  const { mutateAsync: createDeliveryOrder } = useCreateDeliveryOrder();
  const { mutateAsync: checkoutDineInOrder } = useCheckoutDineInOrder();
  const { mutateAsync: releaseHolding } = useReleaseHolding();

  const { total: cartTotal } = mode === "cashier" ? calcTotals(cart, discount) : { total: 0 };
  const total = mode === "cashier" ? cartTotal : (externalTotal ?? 0);

  const [vaultId, setVaultId] = useState<number | null>(null);
  const activeVault = vaultId ?? treasurys?.[0]?.id ?? null;

  const [isSplit, setIsSplit] = useState(false);
  const [singleRaw, setSingleRaw] = useState("0");
  const [splits, setSplits] = useState<Split[]>([]);
  const [activeId, _setActiveId] = useState("s0");
  const [justActivated, setJustActivated] = useState(false);

  useEffect(() => {
    if (!isSplit) setSingleRaw(String(Math.round(total * 100)));
  }, [total, isSplit]);

  useEffect(() => {
    if (treasurys && treasurys?.length > 0) {
      setVaultId(treasurys[0].id);
      setSelectedVaultId(treasurys[0].id);
    }
  }, [treasurys]);

  const setActiveId = (id: string) => {
    _setActiveId(id);
    setJustActivated(true);
  };
  const rawToFloat = (r: string) => parseInt(r || "0") / 100;
  const fmtFloat = (n: number) => n.toFixed(2);

  const transform = (prev: string, k: string): string => {
    if (k === "del") return prev.length > 1 ? prev.slice(0, -1) : "0";
    if (k === "00") return prev === "0" ? "0" : prev + "00";
    if (k === ".") return prev.includes(".") ? prev : prev + ".";
    return prev === "0" ? k : prev + k;
  };

  const pushKey = (k: string) => {
    if (k === "cancel") {
      onCancel?.();
      return;
    }
    if (!isSplit) {
      setSingleRaw((p) => transform(p, k));
      return;
    }
    setSplits((prev) => {
      const shouldClear = justActivated && k !== "del" && k !== ".";
      const updated = prev.map((s) => {
        if (s.id !== activeId) return s;
        const base = shouldClear ? "0" : s.raw;
        return { ...s, raw: transform(base, k) };
      });
      const others = updated.filter((s) => s.id !== activeId);
      if (others.length === 1) {
        const activePaid = rawToFloat(updated.find((s) => s.id === activeId)!.raw);
        const remaining = total - activePaid;
        const remainRaw = remaining > 0 ? String(Math.round(remaining * 100)) : "0";
        return updated.map((s) => (s.id === others[0].id ? { ...s, raw: remainRaw } : s));
      }
      return updated;
    });
    if (justActivated) setJustActivated(false);
  };

  const toggleSplit = () => {
    setIsSplit((v) => {
      if (!v) {
        const splitList = (treasurys ?? []).slice(0, 3).map((t, i) => ({ id: `s${i}`, vaultId: t.id, raw: "0" }));
        setSplits(splitList);
        setActiveId(splitList[0].id);
      } else {
        setSingleRaw(String(Math.round(total * 100)));
      }
      return !v;
    });
  };

  const singlePaid = rawToFloat(singleRaw);
  const splitPaid = splits.reduce((sum, s) => sum + rawToFloat(s.raw), 0);
  const paid = isSplit ? splitPaid : singlePaid;
  const change = parseFloat((paid - total).toFixed(2));

  useEffect(() => {
    setPaidAmount(paid);
  }, [paid]);

  const payments: CreateSalesOrder["payments"] = isSplit ? splits.map((s) => ({ amount: rawToFloat(s.raw), paymentMethod: "Cash" as const, treasuryId: s.vaultId, notes: "" })) : [{ amount: singlePaid, paymentMethod: "Cash" as const, treasuryId: activeVault!, notes: "" }];

  const handleAction = (action: SaveAction) => {
    if (action === "save_only") {
      handleConfirmPayment({
        isHolding: false,
        shouldPrintInvoice: false,
        shouldPrintKitchenBon: mode === "cashier",
        payments,
        createTakwayOrder,
        createDeliveryOrder,
        checkoutDineInOrder,
        releaseHolding,
        customers,
        generateQR,
      });
      onOpenChange(false);
      return;
    }

    const selectedVault = treasurys?.find((v) => v.id === vaultId);
    if (selectedVault) onSave?.({ vault: selectedVault, method: "Cash", action });
    onOpenChange(false);
  };

  const DiffCard = ({ change, large }: { change: number; large?: boolean }) => (
    <div className={cn("rounded-xl border px-4 py-3 flex flex-col gap-0.5", change >= 0 ? "border-green-100 bg-green-50" : "border-red-100 bg-red-50")}>
      <span className={cn("text-[10px] font-semibold", change >= 0 ? "text-green-500" : "text-red-400")}>{change >= 0 ? t("change") : t("remaining")}</span>
      <span className={cn("font-black", large ? "text-xl" : "text-lg", change >= 0 ? "text-green-600" : "text-red-500")}>{fmtFloat(Math.abs(change))}</span>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="max-w-md p-0 gap-0 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 text-white" style={{ background: "#000052" }}>
          <div className="flex flex-col">
            <DialogTitle className="text-[14px] font-medium text-white">{t("payment_completion")}</DialogTitle>
            {mode === "cashier" && selectedCustomer && <span className="text-[11px] text-white/60 mt-0.5">{selectedCustomer.customerName}</span>}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-white/50">{t("payable_amount")}</span>
              <span className="text-[18px] font-black text-green-400">{total.toFixed(2)}</span>
            </div>
            <button onClick={() => onOpenChange(false)} className="w-7 h-7 rounded flex items-center justify-center bg-white/15 hover:bg-white/25 transition-colors">
              <X size={14} />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4 p-4 overflow-y-auto max-h-[80vh]">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-muted-foreground">{isSplit ? t("split_between_vaults") : t("destination_vault")}</label>
              <button onClick={toggleSplit} className={cn("text-[11px] px-3 py-1 rounded-full font-semibold border transition-colors", isSplit ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground hover:border-primary/50 hover:text-primary")}>
                {isSplit ? t("split_on") : t("split_payment")}
              </button>
            </div>
            {!isSplit && (
              <VaultChips
                value={activeVault ?? 0}
                onChange={(id) => {
                  setVaultId(id);
                  setSelectedVaultId(id);
                }}
                treasurys={treasurys ?? []}
              />
            )}
          </div>
          {isSplit && (
            <div className="flex flex-col gap-3">
              <div className={cn("grid gap-2", splits.length === 1 && "grid-cols-1", splits.length === 2 && "grid-cols-2", splits.length >= 3 && "grid-cols-3")}>
                {splits.map((sp, idx) => {
                  const isActive = activeId === sp.id;
                  const vault = treasurys?.find((t) => t.id === sp.vaultId);
                  return (
                    <div key={sp.id} onClick={() => setActiveId(sp.id)} className={cn("rounded-xl border-2 p-3 cursor-pointer transition-all flex flex-col gap-2", isActive ? "border-primary bg-primary/5" : "border-border bg-card hover:border-border/80")}>
                      <div className="flex items-center justify-between gap-1">
                        <span className={cn("text-[10px] font-semibold truncate", isActive ? "text-primary" : "text-muted-foreground")}>{vault?.name ?? `${t("vault")} ${idx + 1}`}</span>
                        <span className={cn("w-2 h-2 rounded-full flex-shrink-0", isActive ? "bg-primary" : "bg-muted")} />
                      </div>
                      <div className={cn("rounded-lg px-2 py-2 text-center font-black text-base tracking-tight", isActive ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground")}>{rawToFloat(sp.raw).toFixed(2)}</div>
                    </div>
                  );
                })}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-muted/50 border border-border px-4 py-3 flex flex-col gap-0.5">
                  <span className="text-[10px] text-muted-foreground font-semibold">{t("total_entered")}</span>
                  <span className="text-lg font-black text-foreground">{fmtFloat(splitPaid)}</span>
                </div>
                <DiffCard change={change} />
              </div>
            </div>
          )}

          <Numpad onKey={pushKey} />

          {!isSplit && (
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-border bg-muted/50 px-4 py-3 flex flex-col gap-0.5">
                <span className="text-[10px] text-muted-foreground font-semibold">{t("tendered")}</span>
                <span className="text-xl font-black text-foreground">{fmtFloat(singlePaid)}</span>
              </div>
              <DiffCard change={change} large />
            </div>
          )}

          <hr className="border-border" />

          <div className="grid grid-cols-2 gap-2">
            {[
              { action: "pdf", label: t("print_pdf"), Icon: FileText },
              { action: "whatsapp", label: t("send_whatsapp"), Icon: MessageCircle },
              { action: "email", label: t("send_email"), Icon: Mail },
              { action: "save_only", label: t("save_only"), Icon: Save },
            ].map(({ action, label, Icon }) => (
              <Button key={action} variant="outline" size="sm" onClick={() => handleAction(action as SaveAction)} className="h-10 text-[12px] gap-1.5">
                <Icon size={13} /> {label}
              </Button>
            ))}

            <Button
              onClick={() => {
                const payments: CreateSalesOrder["payments"] = isSplit ? splits.map((s) => ({ amount: rawToFloat(s.raw), paymentMethod: "Cash" as const, treasuryId: s.vaultId, notes: "" })) : [{ amount: singlePaid, paymentMethod: "Cash" as const, treasuryId: activeVault!, notes: "" }];

                handleConfirmPayment({
                  isHolding: false,
                  shouldPrintKitchenBon: mode === "cashier",
                  payments,
                  createTakwayOrder,
                  createDeliveryOrder,
                  checkoutDineInOrder,
                  releaseHolding,
                  customers,
                  generateQR,
                });
                onOpenChange(false);
              }}
              size="sm"
              className="col-span-2 h-10 text-[12px] gap-1.5 bg-[#000052] hover:bg-blue-900 text-white"
            >
              <Printer size={13} /> {t("save_and_print_invoice")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
