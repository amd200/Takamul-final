import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { CircleArrowRight, Pause, Plus, X, ChevronsUpDown, Check, Trash2, Percent, Info, SaudiRiyal, Vault, FileText, MessageCircle, Mail, Save, Printer } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import AddParnterModal from "@/components/modals/AddParnterModal";
import { useGetAllCustomers } from "@/features/customers/hooks/useGetAllCustomers";
import { calcItemTax, calcTotals, CartItem, DELIVERY_COMPANIES, format, itemBasePrice, itemTotal, OrderType } from "@/constants/data";
import { useGetAllAdditions } from "@/features/Additions/hooks/useGetAllAdditions";
import type { Addition } from "@/features/Additions/types/additions.types";
import { useGetGiftCards } from "@/features/gift-cards/hooks/useGetGiftCards";
import { GiftCard } from "@/features/gift-cards/types/giftCard.types";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import useToast from "@/hooks/useToast";
import ComboboxField from "@/components/ui/ComboboxField";
import { useLanguage } from "@/context/LanguageContext";
import { Dialog, DialogContent, DialogHeader, DialogOverlay, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Numpad } from "../cashier/CashierPanel";
import { useNavigate } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UnifiedPaymentDialog } from "../modals/UnifiedPaymentDialog";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Globe, Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useGetAllTables } from "@/features/tables/hooks/useGetAllTables";
import { useCreateTakwayOrder } from "@/features/pos/hooks/useCreateTakeawayOrder";
import { useCreateDeliveryOrder } from "@/features/pos/hooks/useCreateDeliveryOrder";
import { useCreateDineInOrder, useCheckoutDineInOrder } from "@/features/pos/hooks/useCreateDineInOrder";
import { useUpdateDineInOrder } from "@/features/pos/hooks/useUpdateDineInOrder";
import { useReleaseHolding } from "@/features/pos/hooks/useReleaseHolding";
import { usePosStore } from "@/features/pos/store/usePosStore";
import { useGetAllDeliveryCompanies } from "@/features/delivery-companies/hooks/useGetAllDeliveryCompanies";
import ShiftReportModal from "../modals/ShiftReportModal";
import { useSettingsStore } from "@/features/settings/store/settingsStore";
import { useGetAllShifts, useCloseShift } from "@/features/shifts/hooks/useShifts";
import { useAuthStore } from "@/store/authStore";
import { useGenerateQR } from "@/features/zatcaInvoice/hooks/useGenerateQR";

const TABS = ["add", "discount", "coupon", "note"] as const;

interface CouponTabProps {
  code: string;
  setCode: (v: string) => void;
  status: "idle" | "valid" | "invalid" | "used";
  setStatus: (v: "idle" | "valid" | "invalid" | "used") => void;
  appliedCard: GiftCard | null;
  setAppliedCard: (v: GiftCard | null) => void;
}

function CouponTab({ code, setCode, status, setStatus, appliedCard, setAppliedCard }: CouponTabProps) {
  const { cart, discount, setDiscount, setSelectedGiftCardId } = usePosStore();
  const { sub, tax } = useMemo(() => calcTotals(cart, discount), [cart, discount]);
  const { t } = useLanguage();
  const { data: giftCards } = useGetGiftCards();

  const handleApply = () => {
    const card = giftCards?.items?.find((c) => c.code.toLowerCase() === code.trim().toLowerCase());
    if (!card) return setStatus("invalid");
    if (!card.isActive || card.isDeleted) return setStatus("used");

    const total = sub + tax;
    const deduct = Math.min(card.remainingAmount, total);
    setDiscount({ type: "flat", value: deduct });
    setAppliedCard(card);
    setSelectedGiftCardId(card.id);
    setStatus("valid");
  };

  const handleClear = () => {
    setCode("");
    setStatus("idle");
    setAppliedCard(null);
    setDiscount({ type: "pct", value: 0 });
    setSelectedGiftCardId(null);
  };

  return (
    <>
      <Input
        value={code}
        onChange={(e) => {
          setCode(e.target.value);
          setStatus("idle");
        }}
        placeholder={t("enter_coupon_code")}
        className={`w-full mb-2 ${status === "invalid" || status === "used" ? "border-red-300" : status === "valid" ? "border-green-400" : ""}`}
      />

      {status === "invalid" && <div className="text-xs text-red-500 font-semibold mb-2">{t("invalid_code")}</div>}
      {status === "used" && <div className="text-xs text-red-500 font-semibold mb-2">{t("inactive_or_deleted_card")}</div>}
      {status === "valid" && appliedCard && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-3 py-2.5 mb-2 flex items-center justify-between">
          <div>
            <div className="text-xs font-black text-green-700">{appliedCard.code}</div>
            <div className="text-[10px] text-green-600 mt-0.5">{appliedCard.customerName}</div>
            {appliedCard.expiryDate && (
              <div className="text-[10px] text-gray-400">
                {t("expires_on")} {new Date(appliedCard.expiryDate).toLocaleDateString()}
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-400">{t("remaining_balance")}</div>
            <div className="text-sm font-black text-green-700">${appliedCard.remainingAmount.toFixed(2)}</div>
            <button onClick={handleClear} className="text-[10px] text-red-400 hover:text-red-600 mt-1">
              {t("remove")}
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Button size="2xl" className="flex-1" variant="destructive" onClick={handleClear}>
          {t("clear")}
        </Button>
        <Button size="2xl" className="flex-1" onClick={handleApply} disabled={!code.trim()}>
          {t("apply")}
        </Button>
      </div>
    </>
  );
}

function ClearButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-6 h-6 rounded-full border border-border/60 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors flex items-center justify-center text-base leading-none">
      ×
    </button>
  );
}

interface ItemNumPadDialogProps {
  item: CartItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  additions: Addition[];
  onQtyChange: (qty: number) => void;
  onDiscountChange: (discount: { type: "pct" | "flat"; value: number } | null) => void;
  onSaveExtras: (selectedIds: number[]) => void;
}

type Tab = "qty" | "disc" | "extras";

export function ItemNumPadDialog({ item, open, onOpenChange, additions, onQtyChange, onDiscountChange, onSaveExtras }: ItemNumPadDialogProps) {
  const [activeTab, setActiveTab] = useState<Tab>("qty");
  const [inputBuffer, setInputBuffer] = useState("0");
  const [discType, setDiscType] = useState<"pct" | "flat">("pct");
  const [isFirstInput, setIsFirstInput] = useState(true);
  const [localExtras, setLocalExtras] = useState<number[]>([]);
  const [localQty, setLocalQty] = useState<number>(1);
  const [localDisc, setLocalDisc] = useState<{ type: "pct" | "flat"; value: number } | null>(null);

  const currentValue = parseFloat(inputBuffer) || 0;
  const selectedExtraIds = (item?.extras ?? []).map((e) => e.id!).filter(Boolean);
  const hasExtras = selectedExtraIds.length > 0;

  useEffect(() => {
    if (item && open) {
      setLocalExtras(item.extras?.map((e) => e.id!) ?? []);
      setLocalQty(item.qty);
      setLocalDisc(item.itemDiscount ?? null);
    }
  }, [item, open]);

  const handleToggleExtra = (id: number) => {
    setLocalExtras((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  useEffect(() => {
    if (item && open) {
      setActiveTab("qty");
      setInputBuffer(String(item.qty));
      setDiscType(item.itemDiscount?.type ?? "pct");
      setIsFirstInput(true);
    }
  }, [item?.name, open]);

  const handleKey = useCallback(
    (key: string) => {
      if (key === "cancel") {
        onOpenChange(false);
        return;
      }
      setInputBuffer((prev) => {
        if (isFirstInput && key !== "⌫" && key !== "del") {
          setIsFirstInput(false);
          if (key === "00") return "0";
          if (key === ".") return "0.";
          return key;
        }
        if (key === "⌫" || key === "del") return prev.length > 1 ? prev.slice(0, -1) : "0";
        if (key === "00") return prev === "0" ? "0" : prev + "00";
        if (key === ".") return prev.includes(".") ? prev : prev + ".";
        return prev === "0" ? key : prev + key;
      });
    },
    [onOpenChange, isFirstInput],
  );

  const switchTab = (tab: Tab) => {
    if (activeTab === "qty") {
      setLocalQty(Math.max(1, Math.floor(currentValue)));
    } else if (activeTab === "disc") {
      setLocalDisc(currentValue === 0 ? null : { type: discType, value: currentValue });
    }

    setActiveTab(tab);

    if (tab === "qty") setInputBuffer(String(localQty));
    else if (tab === "disc") setInputBuffer(String(localDisc?.value ?? 0));
    setIsFirstInput(true);
  };

  const clearInput = () => {
    setInputBuffer("0");
    setIsFirstInput(true);
  };

  const handleDone = () => {
    let finalQty = localQty;
    let finalDisc = localDisc;

    if (activeTab === "qty") {
      finalQty = Math.max(1, Math.floor(currentValue));
    } else if (activeTab === "disc") {
      finalDisc = currentValue === 0 ? null : { type: discType, value: currentValue };
    }

    onQtyChange(finalQty);
    onDiscountChange(finalDisc);
    onSaveExtras(localExtras);
    onOpenChange(false);
  };

  const applyShortcut = (val: number) => {
    setDiscType("pct");
    setInputBuffer(String(val));
    setIsFirstInput(false);
  };

  if (!item) return null;

  const tabs: { key: Tab; label: string; badge?: number }[] = [
    { key: "qty", label: "الكمية" },
    { key: "disc", label: "الخصم" },
    { key: "extras", label: "الإضافات", badge: hasExtras ? selectedExtraIds.length : undefined },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 overflow-hidden gap-0 max-w-sm w-full">
        <DialogHeader className="px-4 pt-4 pb-0">
          <DialogTitle className="text-right text-sm font-semibold text-foreground/80 truncate">{item.name}</DialogTitle>
        </DialogHeader>

        <div className="flex mt-3 border-b border-border">
          {tabs.map(({ key, label, badge }) => {
            const isActive = activeTab === key;
            return (
              <button key={key} onClick={() => switchTab(key)} className={cn("flex-1 py-3 text-[13px] font-semibold transition-all duration-150 border-b-2 -mb-px relative", isActive ? "border-primary text-foreground bg-muted/50" : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30")}>
                {label}
                {badge !== undefined && <span className="absolute -top-1 right-2 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[9px] font-bold leading-none">{badge}</span>}
              </button>
            );
          })}
        </div>

        <div className="bg-muted/50 px-4 py-3 border-b border-border">
          {activeTab === "qty" && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">الكمية</span>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-semibold tabular-nums tracking-tight text-foreground">{inputBuffer}</span>
                <span className="text-xs text-muted-foreground">قطعة</span>
                <ClearButton onClick={clearInput} />
              </div>
            </div>
          )}

          {activeTab === "disc" && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <button onClick={() => setDiscType((t) => (t === "pct" ? "flat" : "pct"))} className="flex items-center gap-2 bg-background border border-border rounded-full px-3 py-1.5 hover:bg-muted/50 transition-colors">
                  <span className={cn("text-xs font-medium transition-colors", discType === "flat" ? "text-foreground" : "text-muted-foreground")}>ر.س</span>
                  <div className="relative w-8 h-4 bg-muted rounded-full">
                    <div className={cn("absolute top-0.5 w-3 h-3 bg-primary rounded-full transition-all duration-200", discType === "pct" ? "right-0.5" : "left-0.5")} />
                  </div>
                  <span className={cn("text-xs font-medium transition-colors", discType === "pct" ? "text-foreground" : "text-muted-foreground")}>%</span>
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-semibold tabular-nums tracking-tight text-foreground">{inputBuffer}</span>
                  <span className="text-xs text-muted-foreground">{discType === "pct" ? "%" : "ر.س"}</span>
                  <ClearButton onClick={clearInput} />
                </div>
              </div>
            </div>
          )}

          {activeTab === "extras" && <ExtrasGrid additions={additions} selectedIds={localExtras} onToggle={handleToggleExtra} />}
        </div>

        {activeTab !== "extras" && (
          <div className="px-3 pt-3 pb-2 bg-background">
            <Numpad onKey={handleKey} />
          </div>
        )}
        <div className="grid grid-cols-2 gap-2 px-3 pb-4 pt-2">
          <Button size="2xl" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button size="2xl" className="flex-1" onClick={handleDone}>
            تم
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Extras Grid ───────────────────────────────────────────────────────────────

function ExtrasGrid({ additions, selectedIds, onToggle }: { additions: Addition[]; selectedIds: number[]; onToggle: (id: number, name: string) => void }) {
  if (!additions.length) {
    return <p className="text-xs text-muted-foreground text-center py-4">لا توجد إضافات متاحة</p>;
  }
  return (
    <div className="grid grid-cols-3 gap-2">
      {additions.map((addition) => {
        const isSelected = selectedIds.includes(addition.id!);
        return (
          <button key={addition.id} onClick={() => onToggle(addition.id!, addition.additionNameAr)} className={cn("py-3 px-2 rounded-xl border text-[12px] font-semibold transition-all duration-150 active:scale-95 leading-tight", isSelected ? "bg-primary/10 border-primary/40 text-primary" : "bg-background border-border text-foreground hover:bg-muted/60")}>
            {addition.additionNameAr}
          </button>
        );
      })}
    </div>
  );
}

// ── Main CartPanel ────────────────────────────────────────────────────────────
export default function CartPanel() {
  const { language, direction, setLanguage, t } = useLanguage();
  const { theme, setTheme } = useTheme();

  // ── Zustand store ──────────────────────────────────────────────────────────
  const { cart, setCart, setSelectedTable, selectedOrderId, selectedTable, selectedDelivery, setSelectedDelivery, setOrderType, discount, networkSpeed, setDiscount, handleConfirmPayment, setSelectedCustomer, selectedCustomer, orderType, handleCreateDineInOrder, dineInMode, handleAddItemsToExistingOrder, setOrderNote, orderNote } = usePosStore();
  const salesSettings = useSettingsStore((s) => s.settings.sales);

  // Auto-switch order type if current one becomes disabled
  useEffect(() => {
    if (!salesSettings) return;

    const isCurrentValid = (orderType === "TakeAway" && salesSettings.isTekawuy) || (orderType === "InDine" && salesSettings.isTables) || (orderType === "Delivery" && salesSettings.isDelivary);

    if (!isCurrentValid) {
      if (salesSettings.isTekawuy) setOrderType("TakeAway");
      else if (salesSettings.isTables) setOrderType("InDine");
      else if (salesSettings.isDelivary) setOrderType("Delivery");
    }
  }, [salesSettings, orderType, setOrderType]);

  // ── Async mutation hooks (passed into store actions) ───────────────────────
  const { mutateAsync: createTakwayOrder } = useCreateTakwayOrder();
  const { mutateAsync: createDeliveryOrder } = useCreateDeliveryOrder();
  const { mutateAsync: createDineInOrderyOrder } = useCreateDineInOrder();
  const { mutateAsync: releaseHolding } = useReleaseHolding();
  const { mutateAsync: checkoutDineInOrder } = useCheckoutDineInOrder();
  const { mutateAsync: addItemsToOrder } = useUpdateDineInOrder();
  const { data: deliveryCompanies } = useGetAllDeliveryCompanies();
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("add");
  const [discType, setDiscType] = useState<"pct" | "flat">("pct");
  const [discInput, setDiscInput] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCartItem, setSelectedCartItem] = useState<CartItem | null>(null);
  const [cashierOpen, setCashierOpen] = useState(false);
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "valid" | "invalid" | "used">("idle");
  const [appliedCard, setAppliedCard] = useState<GiftCard | null>(null);
  const { data: customers, isLoading: loadingCustomers } = useGetAllCustomers({ page: 1, limit: 100 });
  const { data: additions } = useGetAllAdditions();
  const { sub, subAfterDiscount, tax: taxAfterDiscount, total, originalTax, itemDiscountsTotal, discountAmount } = useMemo(() => calcTotals(cart, discount), [cart, discount]);
  const { notifyError, notifySuccess } = useToast();
  const { data: freeTables } = useGetAllTables();
  const { mutateAsync: generateQR } = useGenerateQR();

  const navigate = useNavigate();
  const [shiftReportOpen, setShiftReportOpen] = useState(false);
  const { userName, shiftId: authShiftId } = useAuthStore();
  const { data: shifts } = useGetAllShifts();
  const { mutate: closeShift } = useCloseShift();

  const currentOpenShift = useMemo(() => {
    const shiftsArray = Array.isArray(shifts) ? shifts : (shifts as any)?.items || (shifts as any)?.data || [];
    if (!shiftsArray || !Array.isArray(shiftsArray)) return null;

    // 0. Priority: Find the shift that matches shiftId from auth token
    if (authShiftId && authShiftId !== "0") {
      const tokenShift = shiftsArray.find((s: any) => String(s.id) === String(authShiftId));
      if (tokenShift) return tokenShift;
    }

    const normalizedUserName = userName?.toLowerCase().trim();


    // 1. Try to find an open shift for the current user
    const openShiftForUser = shiftsArray.find((s: any) => 
      s.status === "Open" && 
      s.employeeName?.toLowerCase().trim() === normalizedUserName
    );
    if (openShiftForUser) return openShiftForUser;

    // 2. Fallback: Find any open shift in the list
    const anyOpenShift = shiftsArray.find((s: any) => s.status === "Open");
    if (anyOpenShift) return anyOpenShift;

    // 3. Fallback: Find the latest shift for the current user even if not marked "Open"
    const latestUserShift = shiftsArray.find((s: any) => 
      s.employeeName?.toLowerCase().trim() === normalizedUserName
    );
    return latestUserShift || null;
  }, [shifts, userName]);

  function ThemeIcon({ theme }: { theme: string }) {
    if (theme === "dark") return <Moon className="h-3.5 w-3.5" />;
    if (theme === "light") return <Sun className="h-3.5 w-3.5" />;
    const colors: Record<string, string> = {
      red: "bg-red-500",
      blue: "bg-blue-500",
      yellow: "bg-yellow-500",
      "high-contrast": "bg-black border border-white",
    };
    return <div className={`h-3.5 w-3.5 rounded-full ${colors[theme] ?? "bg-gray-400"}`} />;
  }

  useEffect(() => {
    if (customers?.items?.[0] && !selectedCustomer) {
      setSelectedCustomer(customers.items[0]);
    }
  }, [customers?.items?.[0]?.id]);

  const removeItem = (idx: number) => setCart((p) => p.filter((_, i) => i !== idx));

  const changeQty = (idx: number, d: number) => setCart((p) => p.map((item, i) => (i === idx ? { ...item, qty: Math.max(1, d) } : item)));

  const setItemDisc = (idx: number, type: "pct" | "flat", raw: string) => {
    if (hasOrderDiscount) {
      notifyError(t("cannot_mix_discounts") || "لا يمكن الجمع بين خصم الأصناف وخصم الفاتورة");
      return;
    }
    const value = parseFloat(raw);
    const capped = type === "pct" ? Math.min(value, 100) : value;
    setCart((p) =>
      p.map((item, i) =>
        i === idx
          ? {
              ...item,
              itemDiscount: raw === "" || isNaN(value) ? null : { type, value: capped },
            }
          : item,
      ),
    );
  };

  const saveExtras = (idx: number, selectedIds: number[]) => {
    setCart((prev) =>
      prev.map((item, i) => {
        if (i !== idx) return item;
        const newExtras = (additions ?? []).filter((a) => selectedIds.includes(a.id!)).map((a) => ({ id: a.id!, name: a.additionNameAr, price: 0 }));
        return { ...item, extras: newExtras };
      }),
    );
  };

  const applyDiscount = () => {
    if (hasItemDiscount) {
      notifyError(t("cannot_mix_discounts") || "لا يمكن الجمع بين خصم الأصناف وخصم الفاتورة");
      return;
    }

    const val = parseFloat(discInput) || 0;
    setDiscount({ type: discType, value: val });
    setActiveTab("add");
  };

  const hasItemDiscount = useMemo(() => cart.some((item) => item.itemDiscount && item.itemDiscount.value > 0), [cart]);
  const hasOrderDiscount = discount.value > 0;

  const themeLabels = {
    light: t("light_mode"),
    dark: t("dark_mode"),
    red: t("red_theme"),
    blue: t("blue_theme"),
    yellow: t("yellow_theme"),
    "high-contrast": t("high_contrast"),
  };

  const taxSetting = useSettingsStore((state) => state.settings.taxSetting?.taxSetting);
  const isExempt = taxSetting === "Exempt";
  const GRID = isExempt ? "grid grid-cols-[20px_minmax(0,1fr)_85px_55px_50px_85px] gap-2 px-2" : "grid grid-cols-[20px_minmax(0,1fr)_85px_55px_45px_50px_85px] gap-2 px-2";
  return (
    <>
      <div className="flex flex-col border-r border-border" style={{ width: 550, flexShrink: 0 }}>
        <div className="px-3 border-b border-border flex items-center justify-between py-3 shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <span className={`text-xs font-bold ${networkSpeed === "slow" ? "text-red-500" : networkSpeed === "medium" ? "text-yellow-500" : "text-green-500"}`}>{networkSpeed === "slow" ? t("speed_slow") : networkSpeed === "medium" ? t("speed_medium") : t("speed_fast")}</span>
              <button className={networkSpeed === "slow" ? "text-red-500" : networkSpeed === "medium" ? "text-yellow-500" : "text-green-500"}>
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M5 12.55a11 11 0 0 1 14.08 0" strokeOpacity={networkSpeed === "slow" ? 0.3 : 1} />
                  <path d="M1.42 9a16 16 0 0 1 21.16 0" strokeOpacity={networkSpeed === "fast" ? 1 : 0.3} />
                  <path d="M8.53 16.11a6 6 0 0 1 6.95 0" strokeOpacity={networkSpeed !== "slow" ? 1 : 0.3} />
                  <circle cx="12" cy="20" r="1" fill="currentColor" />
                </svg>
              </button>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-xs gap-1.5">
                  <Globe className="h-3.5 w-3.5" />
                  {language.toUpperCase()}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => setLanguage("en")}>🇺🇸 English</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage("ar")}>🇸🇦 العربية</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage("ur")}>🇵🇰 اردو</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-xs gap-1.5">
                  <ThemeIcon theme={theme} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-40" align={direction === "rtl" ? "start" : "end"}>
                <DropdownMenuItem onClick={() => setTheme("light")}>
                  <Sun className="h-3.5 w-3.5 mr-2" />
                  {t("light_mode")}
                  {theme === "light" && <Check className="h-3.5 w-3.5 ml-auto" />}
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => setTheme("dark")}>
                  <Moon className="h-3.5 w-3.5 mr-2" />
                  {t("dark_mode")}
                  {theme === "dark" && <Check className="h-3.5 w-3.5 ml-auto" />}
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {[
                  { value: "red", color: "bg-red-500", label: t("red_theme") },
                  { value: "blue", color: "bg-blue-500", label: t("blue_theme") },
                  { value: "yellow", color: "bg-yellow-500", label: t("yellow_theme") },
                  { value: "high-contrast", color: "bg-black border border-white", label: t("high_contrast") },
                ].map((item) => (
                  <DropdownMenuItem key={item.value} onClick={() => setTheme(item.value as any)}>
                    <div className={`h-3.5 w-3.5 rounded-full mr-2 ${item.color}`} />
                    {item.label}
                    {theme === item.value && <Check className="h-3.5 w-3.5 ml-auto" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button onClick={() => setShiftReportOpen(true)} size="sm" className="rounded-full h-7 text-[11px] transition-all duration-200 shrink-0">
              <Pause className="w-3 h-3" />
              غلق الوردية
            </Button>

            <div className="flex items-center gap-2 shrink-0">
              <Select
                value={orderType}
                onValueChange={(val: OrderType) => {
                  setOrderType(val);
                  setSelectedTable(null);
                  setSelectedDelivery(null);
                }}
              >
                <SelectTrigger className="h-8 text-xs w-32 shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {salesSettings.isTekawuy && <SelectItem value="TakeAway">{t("order_takeaway")}</SelectItem>}
                  {salesSettings.isTables && <SelectItem value="InDine">{t("order_dine_in")}</SelectItem>}
                  {salesSettings.isDelivary && <SelectItem value="Delivery">{t("order_delivery")}</SelectItem>}
                </SelectContent>
              </Select>

              {orderType === "InDine" && (
                <div className="shrink-0">
                  <Select value={selectedTable ? String(selectedTable) : ""} onValueChange={(value) => setSelectedTable(Number(value))}>
                    <SelectTrigger className="h-8 text-xs w-full">
                      <SelectValue placeholder="اختر الطاولة" />
                    </SelectTrigger>
                    <SelectContent>
                      {freeTables?.map((t) => (
                        <SelectItem key={t.id} value={String(t.id)}>
                          {t.tableName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {orderType === "Delivery" && (
                <div className="shrink-0">
                  <Select value={selectedDelivery ?? ""} onValueChange={setSelectedDelivery}>
                    <SelectTrigger className="h-8 text-xs w-full">
                      <SelectValue placeholder={t("delivery_company")} />
                    </SelectTrigger>
                    <SelectContent>
                      {deliveryCompanies?.data?.items.map((d) => (
                        <SelectItem key={d.id} value={d.id.toString()}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="px-3 py-[14.75px] border-b border-border flex items-center gap-2">
          {!selectedCustomer ? (
            <div className="w-full">
              <ComboboxField
                value={selectedCustomer ? String((selectedCustomer as any).id) : ""}
                onChange={(val) => {
                  const customer = customers?.items?.find((c) => String(c.id) === String(val));
                  if (customer) setSelectedCustomer(customer);
                }}
                items={customers?.items}
                valueKey="id"
                labelKey="customerName"
                placeholder={t("choose_customer")}
              />
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-1 px-2.5 py-1.5 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shrink-0">{selectedCustomer.customerName.slice(0, 2).toUpperCase()}</div>
              <span className="text-xs font-bold text-primary flex-1 truncate">{selectedCustomer.customerName}</span>
              <button onClick={() => setSelectedCustomer(null)} className="text-primary/60 hover:text-primary text-base leading-none">
                ×
              </button>
            </div>
          )}
          <Button size="icon-sm" variant="outline" onClick={() => setOpenDialog(true)}>
            <Plus size={14} />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-1.5 space-y-1">
          {cart?.length === 0 ? (
            <div className="p-5 text-center text-gray-400 text-xs">{t("cart_is_empty")}</div>
          ) : (
            <>
              {/* Table header */}
              <div className={`${GRID} py-1.5 border-b border-border text-[10px] font-semibold text-gray-400 uppercase`}>
                <span>#</span>
                <span>{t("item")}</span>
                <span className="text-center">{t("quantity_label")}</span>
                <span className="px-2 border-r border-border text-right flex items-center justify-end gap-1">
                  {t("price")}
                  {!isExempt && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info size={10} className="text-gray-300 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        {t("price_before_tax")}
                      </TooltipContent>
                    </Tooltip>
                  )}
                </span>
                {!isExempt && <span className="text-right">{t("tax_column")}</span>}
                <span className="text-right">{t("total_amount")}</span>
                <span className="text-center">{t("actions")}</span>
              </div>

              {cart?.map((item, idx) => {
                const total = itemTotal(item);
                const hasDisc = !!item.itemDiscount && item.itemDiscount.value > 0;
                const itemWithoutDisc = { ...item, itemDiscount: null };
                const origBasePrice = itemBasePrice(itemWithoutDisc);
                return (
                  <div
                    onClick={() => {
                      setSelectedCartItem(item);
                    }}
                    key={idx}
                    className={`${GRID} py-2 items-center border-b border-border ${idx % 2 === 0 ? "bg-card" : "bg-muted/40"}`}
                  >
                    {/* # */}
                    <span className="text-xs text-gray-400 font-medium">{idx + 1}</span>

                    {/* الاسم */}
                    <div className="min-w-0 overflow-hidden">
                      <div className="text-xs font-bold text-foreground">{item?.name}</div>
                      {(item.extras ?? []).length > 0 && <div className="text-[10px] text-gray-400">+ {item.extras!.map((e) => e.name).join("، ")}</div>}
                      {hasDisc && <div className="text-[10px] text-primary font-semibold">{item.itemDiscount!.type === "pct" ? `${item.itemDiscount!.value}% ${t("off")}` : `-${item.itemDiscount!.value.toFixed(2)}`}</div>}
                    </div>

                    {/* الكمية */}
                    <span className="text-xs text-gray-400 font-medium text-center">{item?.qty}</span>

                    {/* السعر */}
                    <div className="text-right">
                      {hasDisc && <div className="text-[10px] text-gray-300 line-through">{origBasePrice.toFixed(2)}</div>}
                      <div className="text-xs font-semibold text-gray-700 flex items-center flex-row">{format(itemBasePrice(item))}</div>
                    </div>

                    {/* ض.ق.م */}
                    {!isExempt && (
                      <div className="text-right">
                        <div className="text-xs text-gray-500">{calcItemTax(item).toFixed(2)}</div>
                      </div>
                    )}

                    {/* الإجمالي */}
                    <div className="text-right">
                      <div className="text-xs font-bold text-foreground">{isExempt ? itemBasePrice(item).toFixed(2) : (itemBasePrice(item) + calcItemTax(item)).toFixed(2)}</div>
                    </div>

                    {/* عمليات */}
                    <div className="flex items-center justify-center gap-1">
                      <div
                        role="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeItem(idx);
                        }}
                        className="w-7 h-7 rounded-lg bg-muted hover:bg-destructive/10 flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <Trash2 size={13} className="text-gray-400 hover:text-red-500" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="border-t border-border flex-shrink-0">
          <div className="flex px-3 border-b border-border">
            {TABS.map((tab) => {
              const label = tab === "add" ? t("add_permission") || "Add" : tab === "discount" ? t("discount") || "Discount" : tab === "coupon" ? t("coupon_code") || "Coupon Code" : t("note") || "Note";

              const isDisabled = tab === "discount" && hasItemDiscount;

              return (
                <button
                  key={tab}
                  onClick={() => !isDisabled && setActiveTab(tab)}
                  disabled={isDisabled}
                  className={`text-xs py-2 px-1.5 border-b-2 whitespace-nowrap transition-colors duration-150
          ${activeTab === tab ? "border-primary text-primary font-bold" : "border-transparent text-gray-400 hover:text-gray-600"}
          ${isDisabled ? "opacity-40 cursor-not-allowed" : ""}`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* ── Tab: Add (summary + actions) ── */}
          {activeTab === "add" && (
            <div className="px-3 pt-2.5 pb-3">
              <div className="flex justify-between text-xs mb-1.5 items-center">
                <span className={discount.value > 0 || itemDiscountsTotal > 0 ? "text-primary font-semibold" : "text-gray-500"}>{t("discount_label")}</span>
                <div className="flex items-center gap-1">
                  <span className={`font-semibold ${discount.value > 0 || itemDiscountsTotal > 0 ? "text-foreground" : "text-gray-400"}`}>-{discount.value > 0 ? discountAmount.toFixed(2) : itemDiscountsTotal.toFixed(2)}</span>
                  {discount.value > 0 && (
                    <button onClick={() => setDiscount({ type: "pct", value: 0 })} className="w-4 h-4 rounded-full bg-gray-200 text-gray-500 text-xs flex items-center justify-center hover:bg-gray-300 leading-none">
                      ×
                    </button>
                  )}
                </div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                <span>{t("subtotal")}</span>
                <div className="flex items-center gap-1.5">
                  {discount.value > 0 && <span className="text-gray-300 line-through text-[10px]">{format(sub)}</span>}
                  <span className="font-semibold text-foreground">{format(subAfterDiscount)}</span>
                </div>
              </div>
              {!isExempt && (
                <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                  <span>{t("tax_label")}</span>
                  <div className="flex items-center gap-1.5">
                    {discount.value > 0 && <span className="text-gray-300 line-through text-[10px]">{format(originalTax)}</span>}
                    <span className="font-semibold text-foreground">{format(taxAfterDiscount)}</span>
                  </div>
                </div>
              )}

              <div className="flex justify-between text-sm font-black text-foreground mt-2 pt-1 border-t border-border mb-3">
                <span>{t("payable_amount")}</span>
                <div className="flex items-center gap-1.5">
                  {discount.value > 0 && <span className="text-gray-300 line-through text-xs font-normal">{format(sub + originalTax)}</span>}
                  <span>{format(total)}</span>
                </div>
              </div>

              <div className="flex gap-2">
                {/* Hold button */}
                {orderType !== "InDine" ? (
                  <Button
                    onClick={async () => {
                      if (cart.length === 0) {
                        notifyError(t("add_items_to_invoice"));
                        return;
                      }
                      await handleConfirmPayment({
                        isHolding: true,
                        createTakwayOrder,
                        createDeliveryOrder,
                        checkoutDineInOrder,
                        releaseHolding,
                        customers,
                        generateQR,
                      });
                    }}
                    size={"2xl"}
                    className="flex-1"
                    variant="outline"
                  >
                    {t("hold_cart")} <Pause />
                  </Button>
                ) : (
                  <Button
                    disabled={dineInMode == "checkout"}
                    onClick={async () => {
                      if (cart.length === 0) {
                        notifyError(t("add_items_to_invoice"));
                        return;
                      }

                      // console.log()
                      if (orderType === "InDine") {
                        if (dineInMode == "add-items") {
                          await handleAddItemsToExistingOrder({ addItemsToOrder, customers });
                        } else if (dineInMode == "new-order") {
                          await handleCreateDineInOrder({ createDineInOrderyOrder, customers });
                        }
                      }
                    }}
                    size={"2xl"}
                    className="flex-1"
                    variant="outline"
                  >
                    إرسال للتجهيز
                    <Plus />
                  </Button>
                )}

                {/* Pay button */}
                <Button
                  size={"2xl"}
                  onClick={async () => {
                    if (cart.length === 0) {
                      notifyError(t("add_items_to_invoice"));
                      return;
                    }

                    if (orderType === "InDine") {
                      if (dineInMode === "add-items") {
                        await handleAddItemsToExistingOrder({ addItemsToOrder });
                      } else if (dineInMode === "checkout") {
                        setCashierOpen(true);
                      } else {
                        await handleCreateDineInOrder({ createDineInOrderyOrder, customers });
                      }
                    } else {
                      setCashierOpen(true);
                    }
                  }}
                  className="flex-1"
                >
                  دفع <CircleArrowRight />
                </Button>
              </div>
            </div>
          )}

          {/* ── Tab: Discount ── */}
          {activeTab === "discount" && (
            <div className="p-3">
              <div className="text-sm font-bold text-foreground mb-3">{t("order_discount")}</div>
              <div className="flex gap-2 mb-3 items-center">
                <button onClick={() => setDiscType("flat")} className={`w-12 h-12 rounded-xl flex items-center justify-center text-base font-bold border-2 transition-all flex-shrink-0 ${discType === "flat" ? "border-primary bg-primary/10 text-primary" : "border-gray-200 bg-white text-gray-400"}`}>
                  <SaudiRiyal size={18} />
                </button>
                <button onClick={() => setDiscType("pct")} className={`w-12 h-12 rounded-xl flex items-center justify-center text-base font-bold border-2 transition-all flex-shrink-0 ${discType === "pct" ? "border-primary bg-primary/10 text-primary" : "border-gray-200 bg-white text-gray-400"}`}>
                  %
                </button>
                <Input value={discInput} onChange={(e) => setDiscInput(e.target.value)} className="flex-1 h-12 px-3 border border-gray-200 rounded-xl text-sm outline-none text-right font-semibold focus:border-primary/40 bg-white" placeholder="0" type="number" min="0" />
              </div>
              <div className="flex gap-2">
                <Button
                  size={"2xl"}
                  className="flex-1"
                  onClick={() => {
                    (setActiveTab("add"), setDiscount({ type: "pct", value: 0 }));
                  }}
                  variant="destructive"
                >
                  {t("cancel")}
                </Button>
                <Button size={"2xl"} className="flex-1" onClick={applyDiscount}>
                  {t("add_permission") || "Add"}
                </Button>
              </div>
            </div>
          )}

          {/* ── Tab: Coupon ── */}
          {activeTab === "coupon" && (
            <div className="p-3">
              <CouponTab code={code} setCode={setCode} status={status} setStatus={setStatus} appliedCard={appliedCard} setAppliedCard={setAppliedCard} />
            </div>
          )}

          {/* ── Tab: Note ── */}
          {activeTab === "note" && (
            <div className="p-3">
              <textarea value={orderNote} onChange={(e) => setOrderNote(e.target.value)} className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-xs outline-none mb-2 resize-none focus:border-primary/40" rows={2} placeholder={t("add_order_note")} />
              <div className="flex gap-2">
                <Button size={"2xl"} className="flex-1" variant="destructive" onClick={() => setOrderNote("")}>
                  {t("clear")}
                </Button>
                <Button size={"2xl"} className="flex-1" onClick={() => setActiveTab("add")}>
                  {t("save")}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <UnifiedPaymentDialog open={cashierOpen} onOpenChange={setCashierOpen} mode="cashier" onCancel={() => setCashierOpen(false)} />
      <AddParnterModal isOpen={openDialog} onClose={() => setOpenDialog(false)} />
      <ItemNumPadDialog
        item={selectedCartItem}
        open={!!selectedCartItem}
        onOpenChange={(open) => !open && setSelectedCartItem(null)}
        additions={additions}
        onQtyChange={(qty) => {
          const idx = cart.indexOf(selectedCartItem!);
          changeQty(idx, qty);
        }}
        onDiscountChange={(disc) => {
          const idx = cart.indexOf(selectedCartItem!);
          setItemDisc(idx, disc?.type ?? "pct", disc === null ? "" : String(disc.value));
        }}
        onSaveExtras={(selectedIds) => {
          const idx = cart.indexOf(selectedCartItem!);
          saveExtras(idx, selectedIds);
        }}
      />
      {shiftReportOpen && (
        <ShiftReportModal
          isOpen={shiftReportOpen}
          onClose={() => setShiftReportOpen(false)}
          shiftId={(authShiftId && authShiftId !== "0") ? Number(authShiftId) : currentOpenShift?.id || 0}
          onConfirmCloseShift={() => {
            const targetId = (authShiftId && authShiftId !== "0") ? Number(authShiftId) : currentOpenShift?.id;
            if (!targetId) return;
            const fullTime = new Date().toLocaleTimeString("en-GB", { hour12: false });
            closeShift(
              { shiftId: targetId, endTime: fullTime },
              {
                onSuccess: () => setShiftReportOpen(false),
              }
            );
          }}
        />
      )}
    </>
  );
}
