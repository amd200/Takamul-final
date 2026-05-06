import { useLanguage } from "@/context/LanguageContext";
import { useGetAllTreasurys } from "@/features/treasurys/hooks/useGetAllTreasurys";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { FileText, Mail, MessageCircle, Printer, Save, Vault, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Numpad } from "../cashier/CashierPanel";
import { Button } from "@/components/ui/button";
import { Treasury } from "@/features/treasurys/types/treasurys.types";
import { usePurchaseStore } from "@/features/pos/store/usePurchaseStore";
import { useCreatePurchaseOrder } from "@/features/purchases/hooks/useCreatePurchaseOrder";
import { calcTotals } from "@/constants/data";

type SaveAction = "pdf" | "whatsapp" | "email" | "save_only";

interface UnifiedPurchasePaymentDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  total?: number;
  onCancel?: () => void;
  warehouseId?: number;
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

export function UnifiedPurchasePaymentDialog({ open, onOpenChange, total: externalTotal, onCancel, warehouseId = 1 }: UnifiedPurchasePaymentDialogProps) {
  const { t } = useLanguage();
  const { data: treasurys } = useGetAllTreasurys();
  const { selectedSupplier, cart, discount, setPaidAmount, setSelectedVaultId, handleConfirmPurchase } = usePurchaseStore();
  const { mutateAsync: createPurchaseOrder } = useCreatePurchaseOrder();

  const { total: cartTotal } = calcTotals(cart, discount);
  const total = externalTotal ?? cartTotal;

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

  const singlePaid = rawToFloat(singleRaw);
  const splitPaid = splits.reduce((sum, s) => sum + rawToFloat(s.raw), 0);
  const paid = isSplit ? splitPaid : singlePaid;

  useEffect(() => {
    setPaidAmount(paid);
  }, [paid]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="max-w-md p-0 gap-0 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 text-white" style={{ background: "#000052" }}>
          <div className="flex flex-col">
            <DialogTitle className="text-[14px] font-medium text-white">إكمال المشتريات</DialogTitle>
            {selectedSupplier && <span className="text-[11px] text-white/60 mt-0.5">{selectedSupplier.supplierName}</span>}
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

          <Numpad onKey={pushKey} />

          <div className="grid grid-cols-1 gap-2">
            <div className="rounded-xl border border-border bg-muted/50 px-4 py-3 flex flex-col gap-0.5 text-center">
              <span className="text-[10px] text-muted-foreground font-semibold">المبلغ المدفوع</span>
              <span className="text-xl font-black text-foreground">{fmtFloat(paid)}</span>
            </div>
          </div>

          <hr className="border-border" />

          <div className="grid grid-cols-1 gap-2">
            <Button
              onClick={async () => {
                const payments = isSplit 
                  ? splits.map((s) => ({ amount: rawToFloat(s.raw), treasuryId: s.vaultId, notes: "" })) 
                  : [{ amount: singlePaid, treasuryId: activeVault!, notes: "" }];

                try {
                  await handleConfirmPurchase({
                    payments,
                    createPurchaseOrder,
                    warehouseId,
                  });
                  onOpenChange(false);
                } catch (err) {
                  console.error(err);
                }
              }}
              size="lg"
              className="h-12 text-base gap-1.5 bg-[#000052] hover:bg-blue-900 text-white"
            >
              <Save size={16} /> حفظ المشتريات
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
