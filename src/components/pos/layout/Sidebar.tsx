// ─── OrdersDialog.tsx & Sidebar.tsx ──────────────────────────────────────────
import { Clock, CreditCard, Eye, FileText, Play, Plus, Printer, SaudiRiyal, Search, Tag, User, X } from "lucide-react";
import { calcItemTax, itemBasePrice, NAV_ITEMS } from "@/constants/data";
import { AddToCartProduct, INSTITUTION_ADDRESS, INSTITUTION_NAME, INSTITUTION_NOTES, INSTITUTION_PHONE, INSTITUTION_TAX_NO, LOGO_URL } from "@/features/pos/store/usePosStore";
import type { CartItem, Screen } from "@/constants/data";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useLanguage } from "@/context/LanguageContext";
import { SalesOrder } from "@/features/sales/types/sales.types";
import { useEffect, useMemo, useState } from "react";
import formatDate from "@/lib/formatDate";
import { useGetAllSales } from "@/features/sales/hooks/useGetAllSales";
import { InvoiceData, printInvoice } from "../orders/printInvoice";
import { useNavigate } from "react-router-dom";
import { UnifiedPaymentDialog } from "../modals/UnifiedPaymentDialog";
import { usePosStore } from "@/features/pos/store/usePosStore";
import { useGetAllCustomers } from "@/features/customers/hooks/useGetAllCustomers";
import { useGetAllSuppliers } from "@/features/suppliers/hooks/useGetAllSuppliers";
import { useGetCustomerById } from "@/features/customers/hooks/useGetCustomerById";
import { useGetSupplierById } from "@/features/suppliers/hooks/useGetSupplierById";
import { useBranchStore } from "@/store/employeeStore";
import { useSettingsStore } from "@/features/settings/store/settingsStore";
import { generateQR } from "@/features/zatcaInvoice/services/zatchaInvoice";

interface OrdersDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSelect?: (order: SalesOrder) => void;
}

const fallbackBadge = { label: "", cls: "bg-sky-100 text-sky-600" };

type OrderStatusType = "الكل" | "مكتملة" | "معلقة" | "قيد التجهيز";

const STATUS_MAP: Record<OrderStatusType, string | null> = {
  الكل: null,
  مكتملة: "Confirmed",
  معلقة: "UnConfirmed",
  "قيد التجهيز": "InProgress",
};

export function OrdersDialog({ open, onOpenChange }: OrdersDialogProps) {
  const { selectedCustomer, addToCart, setCart, setHoldingOrderId, setDineInMode, setOrderType, setSelectedOrderId, setSelectedTable, setScreen, setOriginalItems, setDiscount, resetCart } = usePosStore();
  const [selectedCustomerId, setSelectCustomerId] = useState<number | null>(null);
  const { data: customers } = useGetAllCustomers();
  const { data: customer } = useGetCustomerById(selectedCustomerId);

  const [activeStatus, setActiveStatus] = useState<OrderStatusType>("الكل");
  const { t } = useLanguage();
  const [cashierOpen, setCashierOpen] = useState(false);

  const STATUS_TABS: { key: OrderStatusType; label: string }[] = useMemo(
    () => [
      { key: "الكل", label: t("all") },
      { key: "مكتملة", label: t("invoices") },
      { key: "معلقة", label: t("pending_invoices") },
    ],
    [t],
  );

  const [search, setSearch] = useState("");
  const { data: orders } = useGetAllSales({ page: 1, limit: 10, OrderType: "POS" });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (orders?.items ?? []).filter((o) => {
      const matchStatus = STATUS_MAP[activeStatus] === null || o.orderStatus === STATUS_MAP[activeStatus];
      const matchSearch = !q || o.orderNumber?.toLowerCase().includes(q) || o.customerName?.toLowerCase().includes(q) || o.orderStatus?.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [orders, search, activeStatus]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent showCloseButton={false} className="p-0 overflow-hidden gap-0 flex flex-col" style={{ maxWidth: 580, width: "95vw", maxHeight: "88vh" }}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 shrink-0 bg-sidebar border-b border-sidebar-foreground/10">
            <div className="flex items-center gap-2">
              <DialogTitle className="text-[14px] font-semibold text-sidebar-foreground">{t("orders")}</DialogTitle>
            </div>
            <button onClick={() => onOpenChange(false)} className="w-7 h-7 rounded-lg flex items-center justify-center bg-sidebar-foreground/10 hover:bg-sidebar-foreground/20 transition-colors text-sidebar-foreground">
              <X size={14} />
            </button>
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 px-4 py-3 flex-wrap shrink-0 border-b border-border bg-card">
            {STATUS_TABS.map((tab) => (
              <button key={tab.key} onClick={() => setActiveStatus(tab.key)} className={`text-[11px] font-medium px-3 py-1.5 rounded-full border transition-all ${activeStatus === tab.key ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:bg-muted"}`}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="flex items-center gap-2 px-4 py-2.5 shrink-0 border-b border-border bg-card">
            <div className="flex-1 relative">
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("search_orders_placeholder")} className="w-full h-8 text-[11px] border border-border rounded-lg pr-3 pl-3 outline-none focus:border-primary bg-input text-foreground placeholder:text-muted-foreground" />
            </div>
            <button className="h-8 w-8 flex items-center justify-center bg-primary hover:bg-primary/80 rounded-lg text-primary-foreground transition-colors">
              <Search size={13} />
            </button>
          </div>

          {/* Count */}
          <div className="px-4 py-1.5 bg-card border-b border-border shrink-0">
            <span className="text-[11px] text-muted-foreground">
              {filtered.length} {t("order")}
            </span>
          </div>

          {/* List */}
          <div className="flex-1 overflow-auto bg-background">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
                <FileText size={32} className="opacity-30" />
                <p className="text-sm">{t("no_orders_found")}</p>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-border">
                {filtered.map((order: SalesOrder) => {
                  const badgeCls = order.orderStatus?.toLowerCase() === "confirmed" ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400" : order.orderStatus?.toLowerCase() === "unconfirmed" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400" : order.orderStatus?.toLowerCase() === "cancelled" ? "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400" : fallbackBadge.cls;

                  const translatedStatus = order.orderStatus?.toLowerCase() === "confirmed" ? t("status_completed") : order.orderStatus?.toLowerCase() === "unconfirmed" ? t("status_pending") : order.orderStatus?.toLowerCase() === "cancelled" ? t("status_cancelled") : order.orderStatus?.toLowerCase() === "inprogress" ? t("قيد التجهيز") : order.orderStatus;

                  return (
                    <div key={order.id} className="flex items-center gap-3 px-4 py-3 bg-card hover:bg-muted transition-colors text-right w-full">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${badgeCls || "bg-sky-100 text-sky-600"}`}>
                        <FileText size={14} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-primary text-[12px] truncate">{order.orderNumber}</span>
                          {translatedStatus && <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${badgeCls}`}>{translatedStatus}</span>}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <User size={10} />
                            {order.customerName ?? "—"}
                          </span>
                          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Tag size={10} />
                            {translatedStatus}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end shrink-0 gap-0.5">
                        <span className="flex items-center gap-1 text-[12px] font-bold text-foreground">
                          {order.grandTotal.toFixed(2)}
                          <SaudiRiyal size={11} />
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Clock size={9} />
                          {formatDate(order.orderDate)}
                        </span>
                      </div>

                      {/* Actions */}
                      {order?.orderStatus === "Confirmed" ? (
                        <button
                          onClick={async () => {
                            const branch = useBranchStore.getState().branch;
                            setSelectCustomerId(order?.customerId);
                            const total = order?.payments.reduce((sum, p) => sum + p.amount, 0);
                            const res = await generateQR({ invoiceId: order?.id });
                            const invoiceData: InvoiceData = {
                              qrCode: res?.qrCode,
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
                            onOpenChange(false);
                          }}
                          className="w-7 h-7 flex items-center justify-center rounded-lg border border-border hover:border-primary hover:text-primary text-muted-foreground transition-colors shrink-0"
                        >
                          <Printer size={13} />
                        </button>
                      ) : order?.orderStatus === "Cancelled" ? (
                        <button
                          title="إضافة للسلة"
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
                            setOriginalItems(mappedItems);
                            if (order?.discountAmount) {
                              setDiscount({ type: "flat", value: order.discountAmount });
                            }
                            mappedItems.forEach((item) => addToCart(item));
                            setOrderType(order?.orderType);
                            onOpenChange(false);
                          }}
                          className="w-7 h-7 flex items-center justify-center rounded-lg border border-border hover:border-primary hover:text-primary text-muted-foreground transition-colors shrink-0"
                        >
                          <Eye size={13} />
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
                              if (order.orderType === "InDine") {
                                setDineInMode("add-items");
                                setSelectedOrderId(order?.id);
                              } else {
                                setHoldingOrderId(order?.id);
                              }
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
                            setCashierOpen(true);
                          }}
                          className="w-7 h-7 flex items-center justify-center rounded-lg border border-border hover:border-primary hover:text-primary text-muted-foreground transition-colors shrink-0"
                        >
                          <Play size={13} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-border bg-card shrink-0 flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">
              {filtered.length} {t("order")}
            </span>
            <button onClick={() => onOpenChange(false)} className="text-[11px] text-muted-foreground hover:text-foreground px-3 py-1.5 rounded border border-border hover:bg-muted transition-colors">
              {t("close")}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <UnifiedPaymentDialog open={cashierOpen} onOpenChange={setCashierOpen} mode="cashier" onCancel={() => setCashierOpen(false)} />
    </>
  );
}

export default function Sidebar() {
  const { screen, setScreen } = usePosStore();
  const [open, setOpen] = useState(false);
  const { t } = useLanguage();
  const navigate = useNavigate();
  const salesSettings = useSettingsStore((s) => s.settings.sales);

  useEffect(() => {
    if (!salesSettings.isTables && screen === "tables") {
      setScreen("home");
    }
  }, [salesSettings.isTables, screen, setScreen]);

  const filteredNavItems = NAV_ITEMS.filter((item) => {
    if (item.id === "tables") {
      return salesSettings.isTables;
    }
    return true;
  });

  return (
    <>
      <div className="w-16 bg-sidebar flex flex-col items-center py-3 gap-0.5 shrink-0 [.light_&]:bg-[#000052] [.dark_&]:bg-[#000052]">
        <div className="flex-1" />
        {filteredNavItems.map(({ id, icon: Icon, label, isNav }) => (
          <button
            key={id}
            onClick={() => {
              if (id === "orders") {
                setOpen(true);
                return;
              }
              if (isNav) {
                navigate("/");
                return;
              }
              setScreen(id as Screen);
            }}
            className={`cursor-pointer py-2.5 rounded-xl flex flex-col items-center gap-1 transition-all duration-200 ease-in-out
              ${screen === id ? "bg-primary/10 border border-primary/20" : "bg-transparent hover:bg-primary/5 border border-transparent"}`}
            style={{ width: 52 }}
          >
            <Icon size={18} strokeWidth={screen === id ? 2.5 : 1.8} className={`transition-colors duration-200 ${screen === id ? "text-primary" : "text-white"}`} />
            <span className={`transition-colors duration-200 ${screen === id ? "text-primary font-bold" : "text-white"}`} style={{ fontSize: 9 }}>
              {t(label.toLowerCase())}
            </span>
          </button>
        ))}
        <div className="flex-1" />
      </div>
      <OrdersDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
