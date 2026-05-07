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

// ─── Helper: حساب عكسي من الإجمالي النهائي ────────────────────────────────
/**
 * يأخذ الإجمالي النهائي (شامل الضريبة) ويرجع سعر الوحدة وقيمة ضريبة الوحدة.
 *
 * المعادلة:
 *   الإجمالي = الكمية × سعر_الوحدة × (1 + نسبة_الضريبة / 100)
 *   سعر_الوحدة = الإجمالي ÷ (الكمية × (1 + نسبة_الضريبة / 100))
 */
function calcFromTotal(rowTotal: number, qty: number, taxRate: number): { price: number; taxamount: number } {
  if (qty <= 0) return { price: 0, taxamount: 0 };
  const divisor = qty * (1 + taxRate / 100);
  const price = divisor === 0 ? 0 : rowTotal / divisor;
  const taxamount = price * (taxRate / 100);
  return { price, taxamount };
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

  // ─── وضع الإدخال العكسي ──────────────────────────────────────────────────
  // false = الوضع العادي (سعر الوحدة → الإجمالي)
  // true  = الوضع العكسي (الإجمالي → سعر الوحدة)
  const [reverseModeEnabled, setReverseModeEnabled] = useState(false);

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

  // ─── مساعد: جلب نسبة الضريبة لصنف معيّن ────────────────────────────────
  const getTaxRate = (item: CartItem): number => {
    if (!item.taxId) return 0;
    return taxes?.find((t) => t.id === item.taxId)?.amount ?? 0;
  };

  // ─── معالج تغيير الإجمالي في الوضع العكسي ───────────────────────────────
  const handleRowTotalChange = (idx: number, newTotal: number) => {
    setCart((prev) =>
      prev.map((item, i) => {
        if (i !== idx) return item;
        const taxRate = getTaxRate(item);
        const { price, taxamount } = calcFromTotal(newTotal, item.qty, taxRate);
        return { ...item, price, taxamount };
      }),
    );
  };

  return (
    <>
      <div className="flex-1 border border-gray-300 overflow-x-auto">
        <table className="min-w-[1400px] w-full border-collapse whitespace-nowrap">
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
              <th className="whitespace-nowrap text-center">
                <div className="flex items-center justify-center gap-1.5">
                  <span>الإجمالي النهائي</span>
                  <button onClick={() => setReverseModeEnabled((prev) => !prev)} title={reverseModeEnabled ? "إيقاف الإدخال العكسي" : "تفعيل الإدخال العكسي"} className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold transition-colors ${reverseModeEnabled ? "bg-yellow-300 text-yellow-900 ring-1 ring-yellow-400" : "bg-white/20 text-white hover:bg-white/30"}`}>
                    ✎
                  </button>
                </div>
              </th>
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
              const taxRate = getTaxRate(item);

              return (
                <tr key={idx} className={`border-b ${idx % 2 === 0 ? "" : "bg-[#f6f9fc]"}`}>
                  <td className="whitespace-nowrap text-center">{idx + 1}</td>

                  <td className="whitespace-nowrap text-center">{item.productId ?? "--"}</td>

                  <td className="text-center px-2 w-[300px] whitespace-nowrap overflow-hidden text-ellipsis">{item.name}</td>

                  <td className="px-1 text-center whitespace-nowrap text-[11px]">{units?.items?.find((u) => u.id === (item.unitId || units?.items?.[0]?.id))?.name || "--"}</td>

                  <td className="px-1 text-center">
                    {reverseModeEnabled ? (
                      <span className=" whitespace-nowrap text-[11px]">{format(item.price)}</span>
                    ) : (
                      <Input
                        type="number"
                        className="h-7 text-[11px] w-20 text-center mx-auto"
                        value={item.price}
                        onChange={(e) => {
                          const val = Number(e.target.value);

                          setCart((prev) =>
                            prev.map((it, i) => {
                              if (i !== idx) return it;

                              const taxAmt = (val * (taxes?.find((t) => t.id === it.taxId)?.amount ?? 0)) / 100;

                              return {
                                ...it,
                                price: val,
                                taxamount: taxAmt,
                              };
                            }),
                          );
                        }}
                      />
                    )}
                  </td>

                  <td className="px-1 text-center">
                    <Input
                      type="number"
                      className="h-7 text-[11px] w-16 text-center mx-auto"
                      value={item.qty}
                      onChange={(e) => {
                        const val = Math.max(1, Number(e.target.value));
                        if (reverseModeEnabled) {
                          // في الوضع العكسي: تغيير الكمية يُعيد حساب السعر من الإجمالي المخزَّن
                          const storedTotal = rowTotal; // الإجمالي الحالي قبل تغيير الكمية
                          const { price, taxamount } = calcFromTotal(storedTotal, val, taxRate);
                          setCart((prev) => prev.map((it, i) => (i === idx ? { ...it, qty: val, price, taxamount } : it)));
                        } else {
                          setCart((prev) => prev.map((it, i) => (i === idx ? { ...it, qty: val } : it)));
                        }
                      }}
                    />
                  </td>

                  {/* الإجمالي قبل الضريبة */}
                  <td className="whitespace-nowrap font-semibold text-center">{(item.price * item.qty).toFixed(2)}</td>

                  {!isExempt && (
                    <td className="px-1 text-center">
                      <div className="flex justify-center flex-col items-center">
                        <Select
                          value={String(item.taxId || "")}
                          onValueChange={(v) => {
                            const selectedTax = taxes?.find((t) => t.id === Number(v));
                            const taxRate = selectedTax?.amount || 0;
                            setCart((prev) =>
                              prev.map((it, i) => {
                                if (i !== idx) return it;
                                // في الوضع العكسي: نعيد حساب السعر من الإجمالي الحالي بالضريبة الجديدة
                                if (reverseModeEnabled) {
                                  const currentTotal = it.price * it.qty + (it.taxamount || 0) * it.qty;
                                  const { price, taxamount } = calcFromTotal(currentTotal, it.qty, taxRate);
                                  return { ...it, taxId: Number(v), price, taxamount };
                                }
                                return {
                                  ...it,
                                  taxId: Number(v),
                                  taxamount: (it.price * taxRate) / 100,
                                };
                              }),
                            );
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

                  {!isExempt && <td className="whitespace-nowrap text-orange-600 text-center">{((item.taxamount || 0) * item.qty).toFixed(2)}</td>}

                  {/* ─── عمود الإجمالي النهائي ────────────────────────────── */}
                  <td className="whitespace-nowrap font-bold text-green-600 text-center px-1">
                    {reverseModeEnabled ? (
                      // الوضع العكسي: حقل إدخال قابل للتعديل
                      <Input type="number" step="0.01" className="h-7 text-[11px] w-24 text-center mx-auto font-bold text-green-700 border-yellow-400 bg-yellow-50" defaultValue={rowTotal} onBlur={(e) => handleRowTotalChange(idx, Number(e.target.value))} />
                    ) : (
                      // الوضع العادي: عرض فقط
                      <span>{(item.price * item.qty + (item.taxamount || 0) * item.qty).toFixed(2)}</span>
                    )}
                  </td>

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

      {/* ─── مؤشر الوضع العكسي ─────────────────────────────────────────────── */}
      {/* {reverseModeEnabled && (
        <div className="flex items-center gap-2 px-3 py-1 bg-yellow-50 border-b border-yellow-200 text-[10px] text-yellow-800">
          <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
          وضع الإدخال العكسي مفعَّل — اكتب الإجمالي النهائي وسيُحسب سعر الوحدة تلقائياً
          <button onClick={() => setReverseModeEnabled(false)} className="mr-auto text-yellow-600 hover:text-red-500 font-bold">
            ✕ إيقاف
          </button>
        </div>
      )} */}

      <div style={{ fontSize: 11 }} className="w-full border border-gray-300">
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
                    notifyError("قم بإضافة أصناف للفاتورة");
                    return;
                  }
                  const hasMissingTax = cart.some((item) => !item.taxId);
                  if (hasMissingTax) {
                    setShowTaxErrors(true);
                    notifyError("يرجى اختيار الضريبة لكل الأصناف أولاً");
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
            <button className="bg-cyan-600 text-white text-[10px] rounded-md py-1.5">تعليق</button>
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
      <UnifiedPurchasePaymentDialog open={paymentOpen} onOpenChange={setPaymentOpen} total={total} warehouseId={selectedWarehouseId} id={id} />
    </>
  );
}
