import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { calcItemTax, calcTotals, CartItem, format, itemBasePrice, itemBasePriceRaw, itemUnitPriceRaw } from "@/constants/data";
import { INSTITUTION_ADDRESS, INSTITUTION_NAME, INSTITUTION_NOTES, INSTITUTION_PHONE, INSTITUTION_TAX_NO, LOGO_URL, usePos } from "@/context/PosContext";
import { useLanguage } from "@/context/LanguageContext";
import { CheckCircle2, Clock, CreditCard, FileCheck, FileText, Hash, Mail, MessageCircle, MoreVertical, Play, Plus, Printer, SaudiRiyal, Save, Search, SlidersHorizontal, Tag, Trash2, User, Vault, X, XCircle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useGetAllProducts } from "@/features/products/hooks/useGetAllProducts";
import { Product } from "@/features/products/types/products.types";
import { useGetAllSuppliers } from "@/features/suppliers/hooks/useGetAllSuppliers";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Numpad } from "../cashier/CashierPanel";
import formatDate from "@/lib/formatDate";
import { useGetAllPurchases } from "@/features/purchases/hooks/useGetAllPurchases";
import { Purchase } from "@/features/purchases/types/purchase.types";
import { useGetAllQuotations } from "@/features/quotation/hooks/useGetAllQuotations";
import { Quotation } from "@/features/quotation/types/quotations.types";
import { useGetAllTreasurys } from "@/features/treasurys/hooks/useGetAllTreasurys";
import { Treasury } from "@/features/treasurys/types/treasurys.types";
import { UnifiedPurchasePaymentDialog } from "../modals/UnifiedPurchasePaymentDialog";
import { Switch } from "@/components/ui/switch";
import { InvoiceData, printInvoice } from "../orders/printInvoice";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from "@/components/ui/drawer";
import { Separator } from "@/components/ui/separator";
import { AddToCartProduct } from "@/features/pos/store/usePosStore";
import { useCreatePurchaseOrder } from "@/features/purchases/hooks/useCreatePurchaseOrder";
import { usePurchaseStore } from "@/features/pos/store/usePurchaseStore";
import useToast from "@/hooks/useToast";
import { Supplier } from "@/features/suppliers/types/suppliers.types";
import { useBranchStore } from "@/store/employeeStore";
import { useGetSupplierById } from "@/features/suppliers/hooks/useGetSupplierById";
import { useSettingsStore } from "@/features/settings/store/settingsStore";
import { useGetAllWareHouses } from "@/features/wareHouse/hooks/useGetAllWareHouses";
import { useGetAllTaxes } from "@/features/taxes/hooks/useGetAllTaxes";
import { useGetAllUnits } from "@/features/units/hooks/useGetAllUnits";

function ProductSearch({ onSelect }: { onSelect: (product: Product) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { data: products } = useGetAllProducts({ page: 1, limit: 10000 });
  const filteredProducts = products?.items?.filter((pro) => pro?.productType == "Direct" || pro?.productType == "Prepared");
  const filtered = useMemo(() => {
    if (!search.trim()) return filteredProducts ?? [];
    const q = search.trim().toLowerCase();
    return (filteredProducts ?? []).filter((p) => p.productNameAr?.toLowerCase().includes(q) || p.productNameEn?.toLowerCase().includes(q) || p.barcode?.toLowerCase().includes(q));
  }, [search, filteredProducts]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="w-full flex items-center gap-1 text-gray-300 hover:text-gray-500 transition-colors">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <span className="text-[11px]">اسم الصنف أو الباركود</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3" align="start" side="bottom">
        <div className="flex flex-col gap-2">
          <input autoFocus value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ابحث بالاسم أو الباركود..." className="w-full h-8 text-xs border border-gray-200 rounded px-2 outline-none focus:border-blue-400" />
          <div className="max-h-60 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-xs text-center py-3 text-gray-400">لا توجد نتائج</p>
            ) : (
              filtered.map((product) => (
                <button
                  key={product.id}
                  onClick={() => {
                    onSelect(product);
                    setOpen(false);
                    setSearch("");
                  }}
                  className="w-full flex items-center justify-between px-2 py-1.5 rounded hover:bg-gray-50 text-right transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-800 text-xs truncate">{product.productNameAr}</div>
                    {product.barcode && <div className="text-[10px] text-gray-400">{product.barcode}</div>}
                  </div>
                  <span className="text-xs font-bold text-[#000052] shrink-0 mr-2">{product.costPrice} ر.س</span>
                </button>
              ))
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export type SaveAction = "pdf" | "whatsapp" | "email" | "save_only" | "save_print";
interface PurchasesDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSelect?: (invoice: Purchase) => void;
  suppliers: { items: Supplier[] };
}

export type PurchaseType = "الكل" | "المشتريات" | "المشتريات المعلقة";

interface InvoicesDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSelect?: (invoice: SalesOrder) => void;
}

const TYPE_TABS: { key: PurchaseType; label: string }[] = [
  { key: "الكل", label: "الكل" },
  { key: "المشتريات", label: "المشتريات" },
  { key: "المشتريات المعلقة", label: "المشتريات المعلقة" },
];

const TYPE_MAP: Record<PurchaseType, Purchase["orderStatus"] | null> = {
  الكل: null,
  المشتريات: "Confirmed",
  "المشتريات المعلقة": "UnConfirmed",
};

export function PurchasesDialog({ open, onOpenChange, onSelect, suppliers }: PurchasesDialogProps) {
  const { addToCart, setCart, resetCart, setDiscount } = usePurchaseStore();
  const [activeType, setActiveType] = useState<PurchaseType>("الكل");
  const [selectedSupplierId, setSelectSupplierId] = useState<number | null>(null);
  const { data: supplier } = useGetSupplierById(selectedSupplierId);
  const [search, setSearch] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const { data: purchases } = useGetAllPurchases({
    page: 1,
    limit: 10,
  });
  const { t } = useLanguage();
  const fallbackBadge = { label: "", cls: "bg-sky-100 text-sky-600" };

  const filtered = useMemo(() => {
    return (purchases?.items || []).filter((pur) => {
      const matchType = TYPE_MAP[activeType] == null || pur.orderStatus === TYPE_MAP[activeType];
      const q = search.trim().toLowerCase();
      const matchSearch = !q || pur.purchaseOrderNumber?.toLowerCase().includes(q) || pur.supplierName?.toLowerCase().includes(q) || pur.orderStatus?.toLowerCase().includes(q);
      return matchType && matchSearch;
    });
  }, [purchases, search, activeType]);

  const selectedOrder = filtered.find((o) => o.id === Number(openMenuId));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="p-0 overflow-hidden gap-0 flex flex-col" style={{ maxWidth: 560, width: "95vw", maxHeight: "88vh", direction: "rtl" }}>
        {/* ===== Header ===== */}
        <div className="flex items-center justify-between px-4 py-3 text-white shrink-0" style={{ background: "#000052" }}>
          <div className="flex items-center gap-2">
            <FileText size={15} />
            <DialogTitle className="text-[14px] font-medium text-white">الفواتير</DialogTitle>
          </div>
          <button onClick={() => onOpenChange(false)} className="w-7 h-7 rounded flex items-center justify-center bg-white/15 hover:bg-white/25 transition-colors">
            <X size={14} />
          </button>
        </div>

        {/* ===== Tabs ===== */}
        <div className="flex items-center gap-1.5 px-4 py-3 flex-wrap shrink-0 border-b border-gray-100 bg-white">
          {TYPE_TABS.map((tab) => (
            <button key={tab.key} onClick={() => setActiveType(tab.key)} className={`text-[11px] font-medium px-3 py-1.5 rounded-full border transition-all ${activeType === tab.key ? "bg-[#000052] text-white border-[#000052]" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ===== Search ===== */}
        <div className="flex items-center gap-2 px-4 py-2.5 shrink-0 border-b border-gray-100 bg-white">
          <div className="flex-1 relative">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث برقم الفاتورة / المورد / الحالة" className="w-full h-8 text-[11px] border border-gray-200 rounded-lg pr-3 pl-3 outline-none focus:border-blue-400 bg-gray-50 placeholder:text-gray-300" />
          </div>
          <button className="h-8 w-8 flex items-center justify-center bg-[#000052] rounded-lg text-white hover:bg-blue-900 transition-colors">
            <Search size={13} />
          </button>
        </div>

        {/* ===== Count ===== */}
        <div className="px-4 py-1.5 bg-white border-b border-gray-100 shrink-0">
          <span className="text-[11px] text-gray-400">{filtered.length} إجمالي نتائج</span>
        </div>

        {/* ===== List ===== */}
        <div className="flex-1 overflow-auto bg-gray-50">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
              <FileText size={32} className="opacity-30" />
              <p className="text-sm">لا توجد مشتريات</p>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-gray-100">
              {filtered.map((order: Purchase) => {
                const badgeCls = order.orderStatus?.toLowerCase() === "confirmed" ? "bg-green-100 text-green-700" : order.orderStatus?.toLowerCase() === "unconfirmed" ? "bg-yellow-100 text-yellow-700" : order.orderStatus?.toLowerCase() === "cancelled" ? "bg-red-100 text-red-600" : fallbackBadge.cls;

                const translatedStatus = order.orderStatus?.toLowerCase() === "confirmed" ? t("status_completed") : order.orderStatus?.toLowerCase() === "unconfirmed" ? t("status_pending") : order.orderStatus?.toLowerCase() === "cancelled" ? t("status_cancelled") : order.orderStatus;

                return (
                  <div
                    key={order.id}
                    className="flex items-center gap-3 px-4 py-3 bg-card hover:bg-muted transition-colors border-b border-border cursor-pointer"
                    onClick={() => {
                      onSelect?.(order);
                      onOpenChange(false);
                    }}
                  >
                    {/* الأيقونة */}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${badgeCls || "bg-sky-100 text-sky-600"}`}>
                      <FileText size={14} />
                    </div>

                    {/* الوسط */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <User size={10} />
                          {order.supplierName ?? "—"}
                        </span>
                        {translatedStatus && <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${badgeCls}`}>{translatedStatus}</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-muted-foreground/60 font-mono">{order.purchaseOrderNumber ?? "—"}</span>
                        <span className="text-muted-foreground/30 text-[10px]">·</span>
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Clock size={9} />
                          {formatDate(order.orderDate)}
                        </span>
                      </div>
                    </div>

                    {/* اليسار */}
                    <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="flex items-center gap-1 text-[12px] font-bold text-foreground">
                          {order.grandTotal.toFixed(2)}
                          <SaudiRiyal size={11} />
                        </span>
                      </div>
                      {/* <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(String(order?.id));
                        }}
                        className="w-10 h-10 flex items-center justify-center rounded-xl border border-border hover:bg-muted text-muted-foreground transition-colors"
                      >
                        <MoreVertical size={16} />
                      </button> */}
                      {/* Actions */}
                      {order?.orderStatus === "Confirmed" ? (
                        <button
                          onClick={async () => {
                            const branch = useBranchStore.getState().branch;
                            setSelectCustomerId(order?.customerId);
                            const total = order?.payments.reduce((sum, p) => sum + p.amount, 0);
                            const invoiceData: InvoiceData = {
                              paidAmount: total,
                              customer: customer,
                              branch,
                              invoiceNumber: order?.orderNumber,
                              invoiceDate: formatDate(order?.orderDate),
                              items: order?.items.map((item) => {
                                const tt: CartItem = {
                                  name: item?.productName,
                                  price: item?.priceAfterTax,
                                  qty: item?.quantity,
                                  taxamount: item?.taxAmount,
                                  taxCalculation: item?.taxCalculation,
                                  productId: item?.id,
                                  taxPercentage: item?.taxPercentage,
                                };
                                const base = itemBasePrice(tt);
                                const tax = calcItemTax(tt);
                                return {
                                  productName: tt.name,
                                  quantity: tt.qty,
                                  unitPrice: Number(base.toFixed(2)),
                                  taxAmount: Number(tax.toFixed(2)),
                                  total: Number((base + tax).toFixed(2)),
                                };
                              }),
                              subTotal: Number(order?.subTotal.toFixed(2)),
                              discountAmount: Number(order?.discountAmount.toFixed(2)),
                              taxAmount: order?.taxAmount,
                              grandTotal: order?.grandTotal,
                              notes: INSTITUTION_NOTES,
                            };
                            await printInvoice(invoiceData);
                          }}
                          className="w-7 h-7 flex items-center justify-center rounded-lg border border-border hover:border-primary hover:text-primary text-muted-foreground transition-colors shrink-0"
                        >
                          <Printer size={13} />
                        </button>
                      ) : (
                        <div className="flex items-center gap-x-2">
                          <button
                            onClick={() => {
                              resetCart(customers);
                              setScreen("home");
                              const mappedItems = order.items.map((item) => ({
                                productId: item.productId,
                                name: item.productName,
                                productNameEn: item.productName,
                                productNameUr: item.productName,
                                price: item?.sellingPrice,
                                qty: item.quantity,
                                note: "",
                                op: null,
                                taxamount: item.taxAmountProduct,
                                taxCalculation: item.taxCalculation,
                                taxPercentage: item?.taxPercentage,
                                itemDiscount: item.discountValue > 0 ? { type: "flat" as const, value: item.discountValue } : null,
                                extras: [],
                                isNew: true,
                              }));
                              console.log(mappedItems);
                              setOriginalItems(mappedItems);
                              if (order && order?.discountAmount) {
                                setDiscount({ type: "flat", value: order?.discountAmount });
                              }
                              mappedItems.forEach((item) => addToCart(item));
                              setOrderType(order?.orderType);
                              setHoldingOrderId(order?.id);
                              onOpenChange(false);
                            }}
                            className="w-7 h-7 flex items-center justify-center rounded-lg border border-border hover:border-primary hover:text-primary text-muted-foreground transition-colors shrink-0"
                          >
                            <Plus size={13} />
                          </button>

                          <button
                            title="استكمال الدفع"
                            onClick={() => {
                              resetCart(customers);
                              onOpenChange(false);
                              setScreen("home");
                              const mappedItems = order.items.map((item) => ({
                                productId: item.productId,
                                name: item.productName,
                                productNameEn: item.productName,
                                productNameUr: item.productName,
                                price: item?.sellingPrice,
                                qty: item.quantity,
                                note: "",
                                op: null,
                                taxamount: item.taxAmountProduct,
                                taxCalculation: item.taxCalculation,
                                taxPercentage: item?.taxPercentage,
                                itemDiscount: item.discountValue > 0 ? { type: "flat" as const, value: item.discountValue } : null,
                                extras: [],
                                isNew: true,
                              }));
                              setOriginalItems(mappedItems);
                              if (order?.discountAmount) {
                                setDiscount({ type: "flat", value: order?.discountAmount });
                              }
                              mappedItems.forEach((item) => addToCart(item));
                              setOrderType(order?.orderType);
                              if (order.orderType == "InDine") {
                                if (order.orderStatus === "InProgress") {
                                  setDineInMode("checkout");
                                  setSelectedTable(order?.tableId);
                                  setSelectedOrderId(order?.id);
                                }
                              } else {
                                setHoldingOrderId(order?.id);
                              }
                            }}
                            className="w-7 h-7 flex items-center justify-center rounded-lg border border-border hover:border-primary hover:text-primary text-muted-foreground transition-colors shrink-0"
                          >
                            <CreditCard size={13} />
                          </button>
                        </div>
                      )}

                      {order.orderStatus === "UnConfirmed" && (
                        <button
                          title="استكمال الفاتورة"
                          onClick={() => {
                            resetCart(customers);
                            setHoldingOrderId(order?.id);
                            setOrderType(order?.orderType);
                            setScreen("home");
                            setCart(
                              order.items.map((item) => ({
                                productId: item.productId,
                                name: item.productName,
                                productNameEn: item.productName,
                                productNameUr: item.productName,
                                price: item?.sellingPrice,
                                qty: item.quantity,
                                note: "",
                                op: null,
                                taxamount: item.taxAmountProduct,
                                taxCalculation: item.taxCalculation,
                                taxPercentage: item?.taxPercentage,
                                itemDiscount: item.discountValue > 0 ? { type: "flat" as const, value: item.discountValue } : null,
                                extras: [],
                              })),
                            );
                            if (order?.discountAmount) {
                              setDiscount({ type: "flat", value: order?.discountAmount });
                            }
                            onOpenChange(false);
                          }}
                          className="w-7 h-7 flex items-center justify-center rounded-lg border border-border hover:border-primary hover:text-primary text-muted-foreground transition-colors shrink-0"
                        >
                          <Play size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ===== Footer ===== */}
        <div className="px-4 py-2.5 border-t border-gray-100 bg-white shrink-0 flex items-center justify-between">
          <span className="text-[11px] text-gray-400">{filtered.length} فاتورة</span>
          <button onClick={() => onOpenChange(false)} className="text-[11px] text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded border border-gray-200 hover:bg-gray-50 transition-colors">
            إغلاق
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
interface QuotationDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function QuotationDialog({ open, onOpenChange }: QuotationDialogProps) {
  const [search, setSearch] = useState("");
  const { data: quotations } = useGetAllQuotations();
  const { data: products } = useGetAllProducts({ page: 1, limit: 10000 });
  const { setCart } = usePurchaseStore();

  const found = search.trim() ? quotations?.find((q) => q.quotationNumber === search.trim()) : null;

  const handleLoad = () => {
    if (!found) return;
    setCart(
      found.items.map((item) => {
        const product = products?.items?.find((p) => p.id === item.productId);

        return {
          productId: item.productId,
          name: item.productName,
          price: product?.costPrice,
          qty: item.quantity,
          note: "",
          op: null,
          taxamount: 0,
          taxCalculation: product?.taxCalculation ?? 0,
          itemDiscount: item.discountPercentage > 0 ? { type: "pct" as const, value: item.discountPercentage } : item.discountAmount > 0 ? { type: "flat" as const, value: item.discountAmount } : null,
          taxId: undefined,
          unitId: product?.baseUnitId || product?.unitId,
        };
      }),
    );
    onOpenChange(false);
    setSearch("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="max-w-md p-0  gap-0" dir="rtl">
        <div className="flex items-center justify-between px-4 py-3 text-white" style={{ background: "#000052" }}>
          <DialogTitle className="text-[14px] font-medium text-white">تحميل عرض سعر</DialogTitle>
          <div className="flex items-center gap-2">
            {found && <span className="bg-white/15 rounded px-2.5 py-1 text-[13px]">الإجمالي: {found.grandTotal.toFixed(2)} ر.س</span>}
            <button onClick={() => onOpenChange(false)} className="w-7 h-7 rounded flex items-center justify-center bg-white/15 hover:bg-white/25 transition-colors">
              <X size={14} />
            </button>
          </div>
        </div>
        {/* <div className="flex items-center justify-between px-4 py-3 text-white shrink-0" style={{ background: "#000052" }}>
          <div className="flex items-center gap-2">
            <FileText size={15} />
            <DialogTitle className="text-[14px] font-medium text-white">الفواتير</DialogTitle>
          </div>
          <button onClick={() => onOpenChange(false)} className="w-7 h-7 rounded flex items-center justify-center bg-white/15 hover:bg-white/25 transition-colors">
            <X size={14} />
          </button>
        </div> */}
        <div className="flex flex-col gap-4 p-4">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-gray-500">رقم عرض السعر</label>
            <div className="relative">
              <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input className="pr-8 text-[12px] focus:border-[#000052]!" placeholder="اكتب رقم عرض السعر..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>

          {search.trim() && (
            <>
              {found ? (
                <>
                  <div className="flex justify-between items-center bg-gray-50 rounded-lg px-3 py-2.5 text-[12px]">
                    <div className="flex gap-1">
                      <span className="text-gray-500">المورد:</span>
                      <span className="font-semibold text-gray-800">{found.supplierName || found.customerName}</span>
                    </div>
                    <div className="flex gap-1">
                      <span className="text-gray-500">التاريخ:</span>
                      <span className="font-semibold text-gray-800">{formatDate(found.orderDate)}</span>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div
                      className="grid text-white text-[10px] font-bold text-center"
                      style={{
                        background: "#000052",
                        gridTemplateColumns: "1fr 60px 80px 80px",
                      }}
                    >
                      <div className="px-2 py-1.5 text-right">الصنف</div>
                      <div className="py-1.5">الكمية</div>
                      <div className="py-1.5">السعر</div>
                      <div className="py-1.5">الإجمالي</div>
                    </div>

                    <div className="max-h-44 overflow-y-auto divide-y divide-gray-100">
                      {found.items.map((item, i) => {
                        const product = products?.items.find((product) => product?.id == item?.productId);
                        return (
                          <div
                            key={i}
                            className={`grid text-[11px] text-center items-center ${i % 2 === 0 ? "bg-white" : "bg-[#f6f9fc]"}`}
                            style={{
                              gridTemplateColumns: "1fr 60px 80px 80px",
                            }}
                          >
                            <div className="px-2 py-1.5 text-right text-gray-800 font-medium truncate">{item.productName}</div>
                            <div className="py-1.5 text-gray-600">{item.quantity}</div>
                            <div className="py-1.5 text-gray-600">{item.unitPrice.toFixed(2)}</div>
                            <div className="py-1.5 font-semibold text-gray-800">{(product?.priceBeforeTax * item?.quantity).toFixed(2)}</div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="border-t border-gray-200 bg-gray-50 flex justify-between px-3 py-2 text-[11px]">
                      <div className="flex gap-3 text-gray-500">
                        {found.taxAmount > 0 && <span>ضريبة: {found.taxAmount.toFixed(2)}</span>}
                        {found.discountAmount > 0 && <span>خصم: {found.discountAmount.toFixed(2)}</span>}
                      </div>
                      <span className="font-bold text-gray-800">{found.grandTotal.toFixed(2)} ر.س</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center text-[12px] text-gray-400 py-6 border border-dashed border-gray-200 rounded-lg">لا يوجد عرض سعر بهذا الرقم</div>
              )}
            </>
          )}

          <hr className="border-gray-100" />

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="xl"
              onClick={() => {
                onOpenChange(false);
                setSearch("");
              }}
              className="flex-1   border-[#000052] hover:bg-[#000052]/10 text-[#000052]!  "
            >
              إلغاء
            </Button>
            <Button size="xl" disabled={!found} onClick={handleLoad} className="flex-1  text-[12px] bg-[#000052] hover:bg-blue-900 text-white">
              <CheckCircle2 size={13} />
              تحميل العناصر
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function CartPanel3() {
  const { t } = useLanguage();
  const toast = useToast();
  const { cart, setCart, discount, setDiscount, handleConfirmPurchase, addToCart, resetCart, selectedSupplier } = usePurchaseStore();
  const [quotationOpen, setQuotationOpen] = useState(false);
  const { mutateAsync: createPurchaseOrder } = useCreatePurchaseOrder();
  const { data: suppliers } = useGetAllSuppliers();
  const { data: wareHouses } = useGetAllWareHouses();
  const { data: taxes } = useGetAllTaxes();
  const [showTaxErrors, setShowTaxErrors] = useState(false);
  const { data: units } = useGetAllUnits({});
  const selectedWarehouseId = Number(wareHouses?.[0]?.id ?? 1);
  const { sub, subAfterDiscount, tax: taxAfterDiscount, total, originalTax } = useMemo(() => calcTotals(cart, discount), [cart, discount]);
  const subRaw = useMemo(() => cart.reduce((s, item) => s + itemBasePriceRaw(item), 0), [cart]);
  const [noteIndex, setNoteIndex] = useState<number | null>(null);
  const { data: products } = useGetAllProducts({ page: 1, limit: 10000 });
  const [discPct, setDiscPct] = useState("");
  const [discFlat, setDiscFlat] = useState("");
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [invoicesOpen, setInvoicesOpen] = useState(false);
  const { notifyError } = useToast();
  const { id } = useParams();
  const handleApplyDiscount = () => {
    if (discPct) setDiscount({ type: "pct", value: Number(discPct) });
    if (discFlat) setDiscount({ type: "flat", value: Number(discFlat) });
  };

  const removeItem = (idx: number) => setCart((p) => p.filter((_, i) => i !== idx));
  const changeQty = (idx: number, d: number) => setCart((p) => p.map((item, i) => (i === idx ? { ...item, qty: Math.max(1, item.qty + d) } : item)));

  const handleBarcodeScanned = useCallback(
    (barcode: string) => {
      const product = products?.items?.find((p) => p.barcode === barcode);
      if (!product) {
        console.warn("المنتج مش موجود:", barcode);
        return;
      }
      setCart((prev) => {
        const exists = prev.findIndex((i) => i.productId === product.id);
        if (exists !== -1) {
          return prev.map((i, idx) => (idx === exists ? { ...i, qty: i.qty + 1 } : i));
        }
        return [
          ...prev,
          {
            name: product.productNameAr,
            productNameEn: product.productNameEn,
            productNameUr: product.productNameUr,
            price: product.costPrice,
            qty: 1,
            note: "",
            op: null,
            taxamount: 0,
            productId: product.id,
            taxCalculation: product.taxCalculation,
            taxId: undefined,
            unitId: product.baseUnitId || product.unitId,
          },
        ];
      });
    },
    [products],
  );

  useEffect(() => {
    let buffer = "";
    let timer: ReturnType<typeof setTimeout>;
    let lastKeyTime = 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isTyping = activeEl instanceof HTMLInputElement || activeEl instanceof HTMLTextAreaElement || activeEl instanceof HTMLSelectElement;

      const now = Date.now();
      const timeDiff = now - lastKeyTime;
      lastKeyTime = now;

      if (e.key === "Enter") {
        if (buffer.length > 2 && !isTyping) handleBarcodeScanned(buffer);
        buffer = "";
        clearTimeout(timer);
        return;
      }

      const isPartOfScan = timeDiff < 50 || buffer.length > 0;
      if (!isPartOfScan) {
        buffer = e.key;
      } else {
        buffer += e.key;
      }

      clearTimeout(timer);
      timer = setTimeout(() => {
        if (buffer.length > 2 && !isTyping) handleBarcodeScanned(buffer);
        buffer = "";
      }, 300);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleBarcodeScanned]);

  const handlePayment = ({ vault, method, action }: { vault: Treasury; method: string; action: SaveAction }) => {
    switch (action) {
      case "pdf":
        break;
      case "whatsapp":
        break;
      case "email":
        break;
      case "save_only":
        break;
      case "save_print":
        break;
    }
  };

  const taxSetting = useSettingsStore((state) => state.settings.taxSetting?.taxSetting);
  const isExempt = taxSetting === "Exempt";
  return (
    <>
      <div className="flex-1  border border-gray-300 overflow-x-auto">
        <table className="min-w-[1400px] w-full border-collapse  whitespace-nowrap">
          {/* Header */}
          <thead className="sticky top-0 z-10">
            <tr className="text-white text-[10px] font-bold text-center" style={{ backgroundColor: "#871d46" }}>
              <th className="px-2 py-2 whitespace-nowrap text-center">#</th>
              <th className="whitespace-nowrap text-center">كود الصنف</th>
              <th className="w-[300px] whitespace-nowrap text-center">اسم المنتج</th>
              <th className="whitespace-nowrap text-center">الوحدة</th>
              <th className="whitespace-nowrap text-center">تكلفة الوحدة</th>
              <th className="whitespace-nowrap text-center">الكمية</th>
              <th className="whitespace-nowrap text-center">الإجمالي قبل الضريبة</th>
              {!isExempt && <th className="whitespace-nowrap text-center">نسبة الضريبة</th>}
              {!isExempt && <th className="whitespace-nowrap text-center">ضريبة القيمة المضافة</th>}
              <th className="whitespace-nowrap text-center">الإجمالي النهائي</th>
              <th className="whitespace-nowrap text-center">ملاحظات</th>
              <th className="text-center"></th>
            </tr>
          </thead>

          <tbody className="text-[11px] text-center">
            {/* Search Row */}
            <tr className="border-b border-gray-300 text-gray-400">
              <td className="px-2 py-2 whitespace-nowrap">{cart.length + 1}</td>
              <td className="whitespace-nowrap">--</td>
              <td className="w-[300px] whitespace-nowrap">
                    <ProductSearch
                      onSelect={(product) => {
                        const mapped: CartItem = {
                          price: product?.costPrice,
                          qty: 1,
                          taxamount: product?.taxAmount,
                          taxCalculation: product?.taxCalculation,
                          taxPercentage: product?.taxPercentage,
                          isNew: true,
                          productId: product?.id,
                          name: product?.productNameAr,
                          productNameEn: product?.productNameEn,
                          productNameUr: product?.productNameEn,
                          taxId: undefined,
                          taxamount: 0,
                          unitId: product?.baseUnitId || product?.unitId,
                        };
                        addToCart(mapped);
                      }}
                    />
              </td>
              <td className="whitespace-nowrap">--</td>
              <td className="whitespace-nowrap">--</td>
              <td className="whitespace-nowrap">--</td>
              <td className="whitespace-nowrap">--</td>
              <td className="whitespace-nowrap">--</td>
              {!isExempt && <td className="whitespace-nowrap">--</td>}
              {!isExempt && <td className="whitespace-nowrap">--</td>}
              <td className="whitespace-nowrap">--</td>
              <td className="whitespace-nowrap">-</td>
              <td></td>
            </tr>

            {/* Cart Rows */}
            {cart.map((item: CartItem, idx) => {
              const base = itemBasePrice(item);
              const tax = calcItemTax(item);
              const rowTotal = base + tax;

              return (
                <tr key={idx} className={`border-b ${idx % 2 === 0 ? "" : "bg-[#f6f9fc]"}`}>
              <td className="whitespace-nowrap text-center">{idx + 1}</td>

                  <td className="whitespace-nowrap text-center">{item.productId ?? "--"}</td>

                  <td className="text-center px-2 w-[300px] whitespace-nowrap overflow-hidden text-ellipsis">{item.name}</td>

                  <td className="px-1 text-center whitespace-nowrap text-[11px]">
                    {units?.items?.find((u) => u.id === (item.unitId || units?.items?.[0]?.id))?.name || "--"}
                  </td>

                  <td className="px-1 text-center">
                    <Input
                      type="number"
                      className="h-7 text-[11px] w-20 text-center mx-auto"
                      value={item.price}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setCart((prev) => prev.map((it, i) => (i === idx ? { ...it, price: val } : it)));
                      }}
                    />
                  </td>

                  <td className="px-1 text-center">
                    <Input
                      type="number"
                      className="h-7 text-[11px] w-16 text-center mx-auto"
                      value={item.qty}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setCart((prev) => prev.map((it, i) => (i === idx ? { ...it, qty: Math.max(1, val) } : it)));
                      }}
                    />
                  </td>

                  <td className="whitespace-nowrap font-semibold text-center">{(item.price * item.qty).toFixed(2)}</td>

                  {!isExempt && (
                    <td className="px-1 text-center">
                      <div className="flex justify-center flex-col items-center">
                        <Select
                          value={String(item.taxId || "")}
                          onValueChange={(v) => {
                            const tax = taxes?.find((t) => t.id === Number(v));
                            setCart((prev) => prev.map((it, i) => (i === idx ? { ...it, taxId: Number(v), taxamount: (it.price * (tax?.amount || 0)) / 100, taxPercentage: tax?.amount } : it)));
                          }}
                        >
                          <SelectTrigger className={`h-7 text-[11px] w-24 text-center ${showTaxErrors && !item.taxId ? "border-red-500" : ""}`}>
                            <SelectValue placeholder="الضريبة" />
                          </SelectTrigger>
                          <SelectContent>
                            {taxes?.map((t) => (
                              <SelectItem key={t.id} value={String(t.id)} className="text-center">
                                {t.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {showTaxErrors && !item.taxId && <p className="text-[9px] text-red-500 mt-0.5 leading-tight font-bold">يرجى اختيار الضريبة</p>}
                      </div>
                    </td>
                  )}

                  {!isExempt && <td className="whitespace-nowrap text-orange-600 text-center">{(item.taxamount * item.qty).toFixed(2)}</td>}

                  <td className="whitespace-nowrap font-bold text-green-600 text-center">{(item.price * item.qty + (item.taxamount || 0) * item.qty).toFixed(2)}</td>

                  <td>
                    {noteIndex === idx ? (
                      <Input
                        autoFocus
                        className="h-7 text-[11px]"
                        placeholder="اكتب ملاحظة..."
                        value={item.note ?? ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          setCart((prev) => prev.map((it, i) => (i === idx ? { ...it, note: value } : it)));
                        }}
                        onBlur={() => setNoteIndex(null)}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        {item.note ? (
                          <span onClick={() => setNoteIndex(idx)} className="text-[10px] text-gray-600 truncate max-w-[100px] cursor-pointer hover:text-[#000052]">
                            {item.note}
                          </span>
                        ) : (
                          <Button variant="outline" size="icon-xs" onClick={() => setNoteIndex(idx)} className="border border-gray-200 text-gray-400 hover:text-[#000052] hover:border-[#000052] hover:bg-[#000052]/5 transition">
                            <Plus size={12} />
                          </Button>
                        )}
                      </div>
                    )}
                  </td>

                  <td>
                    <button onClick={() => removeItem(idx)} className="size-8 rounded bg-gray-100 hover:bg-red-100 flex items-center justify-center mx-auto">
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{ fontSize: 11 }} className="w-full border border-gray-300 ">
        <div className="hidden lg:grid" style={{ gridTemplateColumns: " 1fr 260px" }}>
          <div className="border-l border-gray-200 flex flex-col">
            {!isExempt && (
              <div className="flex items-center justify-between px-3 py-2 border-b border-gray-300">
                <span className="text-gray-500 font-bold">الإجمالي قبل الضريبة</span>
                <span className="font-medium text-gray-800">{subAfterDiscount.toFixed(2)}</span>
              </div>
            )}
            {!isExempt && (
              <div className="flex items-center justify-between px-3 py-2 border-b border-gray-300">
                <span className="text-gray-500 font-bold">ضريبة القيمة المضافة</span>
                <div className="flex items-center gap-2">
                  {discount.value > 0 && <span className="text-gray-300 line-through text-[10px]">{originalTax.toFixed(2)}</span>}
                  <span className="font-medium text-gray-800">{taxAfterDiscount.toFixed(2)}</span>
                </div>
              </div>
            )}
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-gray-500 font-bold">الإجمالي النهائي</span>
              <div className="flex items-center gap-2">
                {discount.value > 0 && (
                  <>
                    <span className="text-gray-300 line-through text-[10px]">{(sub + originalTax).toFixed(2)}</span>
                    <button onClick={() => setDiscount({ type: "pct", value: 0 })} className="w-4 h-4 rounded-full bg-gray-200 text-gray-500 text-xs flex items-center justify-center hover:bg-red-100 hover:text-red-500 leading-none">
                      ×
                    </button>
                  </>
                )}
                <span className="font-medium text-blue-700">{total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div
            className="border-l border-gray-200"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gridTemplateRows: " 1fr",
            }}
          >
            <div className="flex items-center justify-center border-l border-gray-300 p-2">
              <button onClick={() => resetCart()} className="bg-[#871d46] hover:bg-red-700 text-white text-xs px-3 py-1 rounded-md h-full w-full">
                حذف
              </button>
            </div>
            <div className="border-l border-gray-200 flex flex-col items-stretch justify-center p-2 gap-2">
              <button
                onClick={() => {
                  if (cart.length === 0) {
                    toast.error("قم بإضافة أصناف للفاتورة");
                    return;
                  }
                  const hasMissingTax = cart.some((item) => !item.taxId);
                  if (hasMissingTax) {
                    setShowTaxErrors(true);
                    toast.error("يرجى اختيار الضريبة لكل الأصناف أولاً");
                    return;
                  }
                  setShowTaxErrors(false);
                  setPaymentOpen(true);
                }}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-md text-base font-semibold transition-colors"
              >
                الدفع
              </button>
            </div>
          </div>
        </div>

        <div className="flex lg:hidden flex-col">
          <div className="grid grid-cols-4 gap-1 p-2 border-b border-gray-300">
            <button className="bg-violet-700 text-white text-[10px] rounded-md py-1.5">عرض أسعار</button>
            <button
              onClick={() => {
                // handleConfirmPurchase({ isHolding: true });
              }}
              className="bg-cyan-600 text-white text-[10px] rounded-md py-1.5"
            >
              تعليق
            </button>
            <button onClick={() => setInvoicesOpen(true)} className="bg-teal-600 text-white text-[10px] rounded-md py-1.5">
              قائمة
            </button>
            <button className="bg-red-600 text-white text-[10px] rounded-md py-1.5">حذف</button>
          </div>

          <div className="grid grid-cols-2 divide-x divide-gray-300 border-b border-gray-300">
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-gray-500">الإجمالي</span>
              <span className="font-medium text-gray-800">{sub.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-gray-500">بعد الخصم</span>
              <span className="font-medium text-gray-800">{subAfterDiscount.toFixed(2)}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 divide-x divide-gray-300 border-b border-gray-300">
            {!isExempt && (
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-gray-500">الضريبة</span>
                <span className="font-medium text-gray-800">{taxAfterDiscount.toFixed(2)}</span>
              </div>
            )}
            <div className={`flex items-center justify-between px-3 py-2 ${isExempt ? "col-span-2" : ""}`}>
              <span className="text-gray-500">النهائي</span>
              <span className="font-medium text-blue-700">{isExempt ? subAfterDiscount.toFixed(2) : total.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 px-3 py-2">
            <span className="text-gray-500 shrink-0">خصم:</span>
            <input type="number" placeholder="نسبة%" value={discPct} onChange={(e) => setDiscPct(e.target.value)} className="w-16 h-7 text-[11px] text-center border border-gray-300 rounded px-1" />
            <input type="number" placeholder="قيمة" value={discFlat} onChange={(e) => setDiscFlat(e.target.value)} className="w-16 h-7 text-[11px] text-center border border-gray-300 rounded px-1" />
            <Button size="sm" className="h-7 rounded bg-[#000052] hover:bg-blue-900 text-white text-[11px] shrink-0 self-end mb-0.5" onClick={handleApplyDiscount}>
              تطبيق الخصم
            </Button>
          </div>

          <div className="p-2 border-t border-gray-100">
            <button onClick={() => setPaymentOpen(true)} className="w-full bg-green-600 hover:bg-green-700 text-white rounded-md py-2 text-sm font-semibold">
              الدفع
            </button>
          </div>
        </div>
      </div>
      <UnifiedPurchasePaymentDialog 
        open={paymentOpen} 
        onOpenChange={setPaymentOpen} 
        total={total} 
        warehouseId={selectedWarehouseId}
        id={id}
      />
      <PurchasesDialog
        suppliers={suppliers ?? { items: [] }}
        open={invoicesOpen}
        onOpenChange={setInvoicesOpen}
        onSelect={(purchase) => {
          console.log(purchase);
        }}
      />
      <QuotationDialog open={quotationOpen} onOpenChange={setQuotationOpen} />
    </>
  );
}
