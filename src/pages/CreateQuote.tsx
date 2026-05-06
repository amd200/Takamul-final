import React, { useState, useRef, useEffect, useMemo } from "react";
import { Trash2, Plus, ArrowLeft, Tag, ReceiptText, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import z from "zod";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { useGetAllCustomers } from "@/features/customers/hooks/useGetAllCustomers";
import { Button } from "@/components/ui/button";
import { useGetAllProducts } from "@/features/products/hooks/useGetAllProducts";
import { Textarea } from "@/components/ui/textarea";
import { useGetAllWareHouses } from "@/features/wareHouse/hooks/useGetAllWareHouses";
import { useGetAllUnits } from "@/features/units/hooks/useGetAllUnits";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ComboboxField from "@/components/ui/ComboboxField";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { CreateQuotation } from "@/features/quotation/types/quotations.types";
import { useCreateQuotation } from "@/features/quotation/hooks/useCreateQuotation";
import { Customer } from "@/features/customers/types/customers.types";
import { useGetQuotationById } from "@/features/quotation/hooks/useGetQuotationById";
import { calcVat } from "@/utils/calcVat";
import { Product } from "@/features/products/types/products.types";
import { useUpdateQuotation } from "@/features/quotation/hooks/useUpdateQuotation";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGetAllEmployees } from "@/features/employees/hooks/useGetAllEmployees";
import { useSettingsStore } from "@/features/settings/store/settingsStore";

const QuoteSchema = (t: (key: string) => string) =>
  z.object({
    customerId: z.number().min(1, t("customer_required")),
    quotationDate: z.string().min(1, t("date_required")),
    notes: z.string().optional(),
    globalDiscountAmount: z.number().min(0).optional(),
    employeeId: z.number().optional(),
    items: z
      .array(
        z.object({
          productId: z.number().min(1, t("choose_product_validation")),
          quantity: z.number().min(1, t("quantity_must_be_greater_than_zero")),
          unitName: z.string().optional(),
          unitPrice: z.number(),
          discountType: z.enum(["percentage", "fixed"]).default("fixed"),
          discountValue: z.number().min(0).default(0),
        }),
      )
      .min(1, t("must_add_at_least_one_item")),
  });

type SalesInvoiceType = z.input<ReturnType<typeof QuoteSchema>>;

const fmt = (n: number) => new Intl.NumberFormat("en-EG", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

// ─── SRow ─────────────────────────────────────────────────────────────────────
const SRow: React.FC<{ label: string; value: string; bold?: boolean; color?: string }> = ({ label, value, bold, color }) => (
  <div className="flex justify-between items-center gap-2">
    <span className="text-xs text-zinc-400 shrink-0">{label}</span>
    <span className={`text-xs truncate ${bold ? "font-medium text-zinc-900" : color || "text-zinc-700"}`}>{value}</span>
  </div>
);

// ─── Summary Content ──────────────────────────────────────────────────────────
const QuoteSummaryContent: React.FC<{
  control: any;
  customers?: { id: number; customerName: string }[];
  products?: Product[];
  units?: { id: number; name: string }[];
  t: (key: string) => string;
}> = ({ control, customers = [], products = [], units = [], t }) => {
  const customerId = useWatch({ control, name: "customerId" });
  const quotationDate = useWatch({ control, name: "quotationDate" });
  const notes = useWatch({ control, name: "notes" });
  const discountAmount = Number(useWatch({ control, name: "discountAmount" })) || 0;
  const discType = useWatch({ control, name: "quotationDiscountType" }) || "fixed";
  const discValue = Number(useWatch({ control, name: "quotationDiscountValue" })) || 0;
  const items: any[] = useWatch({ control, name: "items" }) || [];
  const taxSetting = useSettingsStore((state) => state.settings.taxSetting?.taxSetting);
  const isExempt = taxSetting === "Exempt";

  const customerName = customers.find((c) => c.id === Number(customerId))?.customerName || t("dash");

  const formatDate = (d?: string) => {
    if (!d) return t("dash");
    try {
      return new Date(d).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });
    } catch {
      return d;
    }
  };

  const calcedItems = items.map((item) => {
    const product = products.find((p) => p.id === Number(item.productId));
    const unitName = units.find((u) => u.id === Number(item.unitId))?.name || "";
    const name = product?.productNameAr || "";
    const taxRate = product?.taxAmount || 0;
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unitPrice) || 0;
    const taxPercentage = taxRate / price;
    const dType = item.discountType || "fixed";
    const dVal = Number(item.discountValue) || 0;
    const gross = qty * price;
    const disc = dType === "fixed" ? dVal : gross * (dVal / 100);
    const afterTax = Math.max(0, gross - disc);
    const taxCalc = product?.taxCalculation ?? 1;
    const isExempt = taxSetting === "Exempt" || taxSetting === "FirstStage";
    const tax = taxCalc === 1 || isExempt ? 0 : afterTax * taxPercentage;
    const beforeTax = afterTax - tax;

    return { name, unitName, qty, price, disc, beforeTax, tax, total: beforeTax + tax };
  });

  const subtotal = calcedItems.reduce((s, i) => s + i.beforeTax, 0);
  const totalTax = calcedItems.reduce((s, i) => s + i.tax, 0);
  const globalDisc = discType === "fixed" ? discValue : subtotal * (discValue / 100);
  const activeItems = calcedItems.filter((i) => i.name);
  const globalDiscountAmount = Number(useWatch({ control, name: "globalDiscountAmount" })) || 0;

  const { finalTotal, adjustedVat, adjustedBeforeTax } = useMemo(() => {
    const discountedBeforeTax = Math.max(0, subtotal - globalDiscountAmount);

    const ratio = subtotal > 0 ? discountedBeforeTax / subtotal : 0;

    const adjustedVat = totalTax * ratio;

    const finalTotal = discountedBeforeTax + adjustedVat;

    return {
      finalTotal: Math.max(0, finalTotal),
      adjustedVat,
      adjustedBeforeTax: discountedBeforeTax,
    };
  }, [subtotal, totalTax, globalDiscountAmount]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-3">{t("quote_data")}</p>
        <div className="space-y-2">
          <SRow label={t("customer")} value={customerName} bold />
          <SRow label={t("issue_date")} value={formatDate(quotationDate)} />
        </div>
      </div>
      <div className="border-t border-zinc-100" />
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest">{t("items")}</p>
          <span className="text-[10px] bg-zinc-100 text-zinc-500 font-medium px-2 py-0.5 rounded-full">{activeItems.length}</span>
        </div>
        {activeItems.length === 0 ? (
          <p className="text-xs text-zinc-400 text-center py-4">{t("no_items_yet")}</p>
        ) : (
          <div className="space-y-3">
            {activeItems.map((item, i) => (
              <div key={i} className="flex justify-between items-start gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-800 truncate">{item.name}</p>
                  <div className="flex flex-wrap gap-x-2 mt-0.5">
                    <span className="text-xs text-zinc-400">
                      {item.qty} × {fmt(item.price)}
                    </span>
                    {item.unitName && <span className="text-xs text-zinc-400">{item.unitName}</span>}
                    {item.disc > 0 && (
                      <span className="text-xs text-emerald-600">
                        {t("discount")} {fmt(item.disc)}
                      </span>
                    )}
                    {item.tax > 0 && !isExempt && (
                      <span className="text-xs text-amber-500">
                        {t("tax")} {fmt(item.tax)}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-sm font-semibold text-zinc-900 shrink-0">{fmt(item.total)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="border-t border-zinc-100" />
      <div>
        <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-3">{t("amounts")}</p>
        <div className="space-y-1.5">
          <SRow label={t("total")} value={fmt(adjustedBeforeTax)} />
          {adjustedVat > 0 && <SRow label={t("tax")} value={`+ ${fmt(adjustedVat)}`} color="text-amber-500" />}
          {globalDisc + discountAmount > 0 && <SRow label={t("discount")} value={`- ${fmt(globalDisc + discountAmount)}`} color="text-emerald-600" />}
        </div>
        <div className="border-t border-dashed border-zinc-200 mt-3 pt-3 flex justify-between items-baseline">
          <span className="text-xs text-zinc-500">{t("final_total")}</span>
          <span className="text-xl font-bold text-zinc-900">{fmt(finalTotal)}</span>
        </div>
      </div>
      {notes && (
        <>
          <div className="border-t border-zinc-100" />
          <div>
            <p className="text-[10px] text-zinc-400 mb-1.5">{t("notes")}</p>
            <p className="text-sm text-zinc-700 leading-relaxed">{notes}</p>
          </div>
        </>
      )}
    </div>
  );
};

// ─── Floating Summary ─────────────────────────────────────────────────────────
const FloatingSummary: React.FC<{
  control: any;
  customers?: { id: number; customerName: string }[];
  products?: Product[];
  units?: { id: number; name: string }[];
  grandTotal: number;
  itemCount: number;
  t: (key: string) => string;
}> = ({ control, customers, products, units, grandTotal, itemCount, t }) => {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/20 backdrop-blur-[1px] z-40" aria-hidden />}

      {/* Floating pill button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`fixed bottom-6 left-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border transition-all duration-200 select-none
          ${open ? "bg-primary text-white border-green-500 shadow-zinc-900/30" : "bg-white text-zinc-800 border-zinc-200 hover:border-zinc-300 hover:shadow-2xl"}`}
      >
        <div className="relative">
          <ReceiptText size={18} strokeWidth={1.8} />
          {itemCount > 0 && (
            <span
              className={`absolute -top-2 -right-2 text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center
              ${open ? "bg-white text-zinc-900" : "bg-primary text-white"}`}
            >
              {itemCount}
            </span>
          )}
        </div>
        <div className="text-right leading-tight">
          <p className="text-[10px] font-medium opacity-60">{t("total")}</p>
          <p className="text-sm font-bold">{fmt(grandTotal)}</p>
        </div>
      </button>

      {/* Floating Panel */}
      <div
        ref={panelRef}
        className={`fixed bottom-24 left-6 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-zinc-100 overflow-hidden
          transition-all duration-300 ease-out origin-bottom-left
          ${open ? "opacity-100 scale-100 translate-y-0 pointer-events-auto" : "opacity-0 scale-95 translate-y-2 pointer-events-none"}`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 bg-zinc-50/80">
          <div className="flex items-center gap-2">
            <ReceiptText size={15} strokeWidth={1.8} className="text-zinc-500" />
            <span className="text-sm font-semibold text-zinc-800">{t("quote_summary")}</span>
          </div>
          <button type="button" onClick={() => setOpen(false)} className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors">
            <X size={15} />
          </button>
        </div>
        <div className="p-5 max-h-[60vh] overflow-y-auto">
          <QuoteSummaryContent control={control} customers={customers} products={products} units={units} t={t} />
        </div>
      </div>
    </>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const CreateQuote: React.FC = () => {
  const { t, direction } = useLanguage();
  const [discountOpen, setDiscountOpen] = useState<Record<number, boolean>>({});
  const toggleDiscount = (i: number) => setDiscountOpen((prev) => ({ ...prev, [i]: !prev[i] }));
  const showItemCode = useSettingsStore((s) => s.settings.location.showItemCodeInQuotations);

  const form = useForm<SalesInvoiceType>({
    resolver: zodResolver(QuoteSchema(t)),
    defaultValues: {
      quotationDate: new Date().toISOString().split("T")[0],
      customerId: 0,
      globalDiscountAmount: undefined,
      notes: "",
      items: [{ productId: 0, unitPrice: 0, quantity: 1, discountType: "fixed", discountValue: 0 }],
    },
  });

  const { control, setValue } = form;

  const { data: customersResponse } = useGetAllCustomers();
  const taxSetting = useSettingsStore((state) => state.settings.taxSetting?.taxSetting);
  const isExempt = taxSetting === "Exempt";
  let customers: Customer[] = [];

  if (Array.isArray(customersResponse?.items)) {
    customers = customersResponse.items;
  } else if (Array.isArray(customersResponse)) {
    customers = customersResponse;
  }
  const { data: products } = useGetAllProducts({ page: 1, limit: 10000000 });
  const filteredProducts = useMemo(() => {
    const base = products?.items.filter((item) => item.productType !== "Branched") || [];
    return base.map((p) => ({
      ...p,
      displayName: p.productNameAr,
    }));
  }, [products?.items]);
  const { data: wareHouses } = useGetAllWareHouses();
  const { data: units } = useGetAllUnits({});
  const { mutateAsync: createQuotations, isPending } = useCreateQuotation();
  const { mutateAsync: updateQuotation } = useUpdateQuotation();
  const { id } = useParams();
  const isEditMode = !!id;
  const { data: quotation } = useGetQuotationById(id);
  const { data: employees } = useGetAllEmployees({ page: 1, limit: 1000 });
  const { fields: itemFields, append: appendItem, remove: removeItem } = useFieldArray({ control: form.control, name: "items" });
  const items = useWatch({ control: form.control, name: "items" });
  const discAmt = Number(useWatch({ control, name: "globalDiscountAmount" })) || 0;
  const navigate = useNavigate();
  useEffect(() => {
    if (customers?.[0]?.id && !isEditMode) {
      form.setValue("customerId", customers[0].id);
    }
  }, [customers, isEditMode]);

  useEffect(() => {
    if (quotation) {
      form.reset({
        customerId: quotation?.customerid,
        globalDiscountAmount: quotation?.discountAmount,
        items: quotation?.items.map((quote) => ({
          productId: quote?.productId,
          quantity: quote?.quantity,
          unitPrice: quote.priceAfterTax,
          discountValue: quote?.discountAmount ? quote?.discountAmount : quote?.discountPercentage,
          unitName: units?.items?.find((unit) => unit?.id == quote?.baseUnitId)?.name,
        })),
      });
    }
  }, [form.reset, quotation]);
  const calcSummary = () => {
    let subtotal = 0,
      totalTax = 0,
      count = 0;

    (items || []).forEach((item) => {
      const product = products?.items?.find((p) => p.id === Number(item.productId));
      if (!product) return;

      count++;
      const qty = Number(item.quantity) || 0;
      const price = Number(item.unitPrice) || 0;
      const dType = item.discountType || "fixed";
      const dVal = Number(item.discountValue) || 0;
      const originalPrice = product?.sellingPrice || 1;
      const originalTax = product?.taxAmount || 0;
      const taxPercentage = originalTax / originalPrice;
      const taxCalc = product?.taxCalculation ?? 0;
      const gross = qty * price;
      const disc = dType === "fixed" ? dVal * qty : gross * (dVal / 100);
      const afterDisc = Math.max(0, gross - disc);
      const vatAmount = taxCalc === 1 || isExempt ? 0 : afterDisc * taxPercentage;
      const beforeTax = afterDisc - vatAmount;

      subtotal += beforeTax;
      totalTax += vatAmount;
    });

    return {
      grandTotal: Math.max(0, subtotal + totalTax - discAmt),
      count,
    };
  };
  const { grandTotal, count } = calcSummary();

  const handleAddItem = () => appendItem({ productId: 0, quantity: 1, unitName: "", unitPrice: 0, discountType: "fixed", discountValue: undefined });

  const handleSubmit = async (data: SalesInvoiceType) => {
    const payload: CreateQuotation = {
      customerId: data.customerId,
      quotationDate: data.quotationDate,
      notes: data.notes || "",
      globalDiscountAmount: data.globalDiscountAmount ?? 0,
      items: data.items.map((item) => {
        const product = products?.items?.find((p) => p.id === Number(item.productId));
        const price = item?.unitPrice || 0;
        const taxCalc = product?.taxCalculation ?? 0;
        const taxPercentage = product?.taxPercentage || 0;
        const beforeTax = taxCalc === 1 ? price : price / (1 + taxPercentage / 100);
        return {
          productId: item.productId,
          quantity: item.quantity,
          taxPercentage: taxPercentage,
          unitPrice: beforeTax,
          discountPercentage: item.discountType === "percentage" ? (item.discountValue ?? 0) : 0,
          discountValue: item.discountType === "fixed" ? (item.discountValue ?? 0) : 0,
        };
      }),
    };
    if (isEditMode) {
      await updateQuotation({ id: Number(id), data: payload });
    } else {
      await createQuotations(payload);
    }
    navigate("/quotes");
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t("add_quote")}</CardTitle>
          <CardAction>
            <Button size={"xl"} variant="outline" asChild>
              <Link to="/quotes">
                {t("back_to_quotes_list")}
                <ArrowLeft size={16} />
              </Link>
            </Button>
          </CardAction>
        </CardHeader>

        <CardContent>
          <form onSubmit={form.handleSubmit(handleSubmit, (errors) => console.log(errors))} className="space-y-6">
            <div className=" p-6 rounded-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-800 mb-6">{t("basic_data")}</h2>
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <Controller
                  name="quotationDate"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>
                        {t("date")} <span className="text-red-500">*</span>
                      </FieldLabel>
                      <Input type="date" {...field} />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />

                <Controller
                  name="customerId"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>
                        {t("customer")} <span className="text-red-500">*</span>
                      </FieldLabel>
                      <ComboboxField field={field} items={customers} valueKey="id" labelKey="customerName" placeholder={t("choose_customer")} />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />

                <Controller
                  name="globalDiscountAmount"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>{t("discount_amount_value")} </FieldLabel>
                      <Input type="number" value={field.value ?? ""} onChange={(e) => field.onChange(Number(e.target.value))} className="text-center" />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />

                <Controller
                  name="employeeId"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>
                        الموظف<span className="text-red-500">*</span>
                      </FieldLabel>
                      <Select key={field.value} value={field.value ? String(field.value) : ""} onValueChange={(value) => field.onChange(Number(value))}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="اختر الموظف" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {employees?.items?.map((c) => (
                              <SelectItem key={c.id} value={String(c.id)}>
                                {c.firstName}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
                <div className="lg:col-span-4">
                  <Controller
                    name="notes"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>{t("notes")}</FieldLabel>
                        <Textarea {...field} placeholder={t("enter_notes")} />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                </div>
              </div>
            </div>

            <div className=" p-6 rounded-sm border border-gray-100 dark:border-gray-800">
              <div className="border-b border-zinc-200 dark:border-zinc-800 pb-8 min-w-0">
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-6">{t("invoice_details")}</h2>
                <section className="mb-4">
                  <h2 className="text-sm font-semibold text-zinc-500 mb-4">{t("items_list")}</h2>
                  <div className="w-full overflow-x-auto pb-4">
                    <div className={cn("hidden md:grid gap-4 px-2 pb-3 border-b border-zinc-200 text-xs font-medium text-zinc-400 uppercase tracking-widest items-center", showItemCode ? (isExempt ? "md:grid-cols-[1.1fr_1.4fr_0.8fr_1fr_0.7fr_0.9fr_50px]" : "md:grid-cols-[1.1fr_1.4fr_0.8fr_1fr_0.7fr_1fr_0.9fr_0.9fr_50px]") : isExempt ? "md:grid-cols-[1.5fr_0.9fr_1fr_0.7fr_0.9fr_60px]" : "md:grid-cols-[1.5fr_0.9fr_1fr_0.7fr_1fr_0.9fr_0.9fr_60px]")}>
                      {showItemCode && <div>{t("product_code")}</div>}
                      <div>{t("product_name")}</div>
                      <div>{t("unit")}</div>
                      <div>{t("unit_price")}</div>
                      <div>{t("quantity")}</div>
                      {!isExempt && <div>{t("subtotal_before_tax")}</div>}
                      {!isExempt && <div>{t("vat")}</div>}
                      <div>{t("grand_total")}</div>
                      <div></div>
                    </div>

                    <div className="space-y-1 mt-3">
                      {itemFields.map((item, index) => {
                        const qty = Number(form.watch(`items.${index}.quantity`) || 0);
                        const price = Number(form.watch(`items.${index}.unitPrice`) || 0);
                        const discType = form.watch(`items.${index}.discountType`) || "fixed";
                        const discValue = Number(form.watch(`items.${index}.discountValue`) || 0);
                        const productId = form.watch(`items.${index}.productId`);
                        const product = products?.items?.find((p) => p.id === Number(productId));
                        const originalPrice = product?.sellingPrice || 1;
                        const originalTax = product?.taxAmount || 0;
                        const taxPercentage = originalTax / originalPrice;
                        const taxCalc = product?.taxCalculation ?? 0;
                        const gross = qty * price;
                        const discount = discType === "fixed" ? discValue * qty : gross * (discValue / 100);
                        const afterDiscount = Math.max(0, gross - discount);
                        const vatAmount = taxCalc === 1 || isExempt ? 0 : afterDiscount * taxPercentage;
                        const beforeTax = afterDiscount - vatAmount;
                        const grandTotal = afterDiscount;
                        const nameTaxValc = taxCalc == 3 ? "غير شامل الضريبة" : taxCalc == 2 ? "شامل الضريبة" : taxCalc == 1 ? "لا يوجد ضريبة" : "-";
                        const isDiscOpen = !!discountOpen[index];
                        const productCode = product?.barcode || "";

                        return (
                          <div key={item.id}>
                            <div className={cn("grid grid-cols-1 gap-3 p-4 md:p-2 md:bg-transparent rounded-xl md:rounded-none border md:border-none border-zinc-100 items-center group", showItemCode ? (isExempt ? "md:grid-cols-[1.1fr_1.4fr_0.8fr_1fr_0.7fr_0.9fr_50px]" : "md:grid-cols-[1.1fr_1.4fr_0.8fr_1fr_0.7fr_1fr_0.9fr_0.9fr_50px]") : isExempt ? "md:grid-cols-[1.5fr_0.9fr_1fr_0.7fr_0.9fr_60px]" : "md:grid-cols-[1.5fr_0.9fr_1fr_0.7fr_1fr_0.9fr_0.9fr_60px]")}>
                              {" "}
                              {showItemCode && (
                                <Field>
                                  <FieldLabel className="md:hidden text-xs mb-1.5 text-zinc-500">{t("product_code")}</FieldLabel>
                                  <Input value={productCode} readOnly className="bg-gray-50 text-center" />
                                </Field>
                              )}
                              <Controller
                                control={form.control}
                                name={`items.${index}.productId`}
                                render={({ field, fieldState }) => (
                                  <Field data-invalid={fieldState.invalid} className="relative">
                                    <FieldLabel className="md:hidden text-xs mb-1.5 text-zinc-500">{t("product_name_code")}</FieldLabel>
                                    <ComboboxField
                                      field={field}
                                      items={filteredProducts}
                                      valueKey="id"
                                      labelKey="displayName"
                                      placeholder={t("choose_product")}
                                      onValueChange={(val) => {
                                        const p = products?.items?.find((p) => p.id === Number(val));
                                        if (p) form.setValue(`items.${index}.unitPrice`, p.sellingPrice);
                                        const unitProduct = units?.items?.find((unit) => unit?.id == p?.baseUnitId);
                                        form.setValue(`items.${index}.unitName`, unitProduct?.name);
                                      }}
                                    />
                                    {fieldState.invalid && (
                                      <div className="absolute top-full mt-1 right-0 z-10 w-full">
                                        <FieldError errors={[fieldState.error]} />
                                      </div>
                                    )}
                                  </Field>
                                )}
                              />
                              <Controller
                                control={form.control}
                                name={`items.${index}.unitName`}
                                render={({ field }) => (
                                  <Field>
                                    <FieldLabel className="md:hidden text-xs mb-1.5 text-zinc-500">{t("unit")}</FieldLabel>
                                    <span className="block text-center py-2 px-3 bg-gray-100 rounded-md">{field.value || "-"}</span>{" "}
                                  </Field>
                                )}
                              />
                              <Controller
                                control={form.control}
                                name={`items.${index}.unitPrice`}
                                render={({ field, fieldState }) => (
                                  <Field className="relative" data-invalid={fieldState.invalid}>
                                    <FieldLabel className="md:hidden text-xs mb-1.5 text-zinc-500">{t("price_before_tax")}</FieldLabel>
                                    <Input type="number" value={field.value} onChange={(e) => field.onChange(Number(e.target.value))} className="text-center" />
                                    <div className="absolute top-full mt-1 right-0 z-10 w-full">
                                      <FieldError errors={[fieldState.error]} />
                                    </div>
                                  </Field>
                                )}
                              />
                              <Controller
                                control={form.control}
                                name={`items.${index}.quantity`}
                                render={({ field, fieldState }) => (
                                  <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel className="md:hidden text-xs mb-1.5 text-zinc-500">{t("quantity")}</FieldLabel>
                                    <Input type="number" min={1} value={field.value} onChange={(e) => field.onChange(Number(e.target.value))} className="text-center" />
                                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                                  </Field>
                                )}
                              />
                              {!isExempt && (
                                <div className="text-center font-medium">
                                  {beforeTax.toLocaleString("en-EG", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </div>
                              )}
                              {!isExempt && (
                                <div className="flex items-center md:justify-center font-medium text-amber-600 mt-2 md:mt-0 px-2 h-9">
                                  <FieldLabel className="md:hidden text-xs text-zinc-500 ml-auto">{t("vat")}:</FieldLabel>
                                  {vatAmount.toLocaleString("en-EG", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </div>
                              )}
                              <div className="flex items-center md:justify-center font-medium text-green-700 mt-2 md:mt-0 px-2 h-9">
                                <FieldLabel className="md:hidden text-xs text-zinc-500 ml-auto">{t("total_including_tax")}:</FieldLabel>
                                {grandTotal.toLocaleString("en-EG", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </div>
                              <div className="flex items-center justify-center gap-2">
                                <button type="button" onClick={() => removeItem(index)} className="p-2 text-zinc-400 hover:text-red-500">
                                  <Trash2 size={16} />
                                </button>

                                {/* <button type="button" onClick={() => toggleDiscount(index)} className={`p-2 ${isDiscOpen ? "text-emerald-600" : "text-zinc-400"}`}>
                                  <Tag size={14} />
                                </button> */}
                              </div>
                            </div>

                            {isDiscOpen && (
                              <div className="grid grid-cols-2 gap-3 px-2 py-3 bg-emerald-50/50 border border-dashed border-emerald-100 rounded-lg mb-1 animate-in fade-in slide-in-from-top-1 duration-150">
                                <Controller
                                  control={form.control}
                                  name={`items.${index}.discountType`}
                                  render={({ field }) => (
                                    <Field>
                                      <FieldLabel className="text-xs text-zinc-500">{t("discount_type")}</FieldLabel>
                                      <ComboboxField
                                        field={field}
                                        valueKey="value"
                                        labelKey="label"
                                        items={[
                                          { label: t("value"), value: "fixed" },
                                          { label: `${t("percentage")} %`, value: "percentage" },
                                        ]}
                                        placeholder={t("type")}
                                      />
                                    </Field>
                                  )}
                                />
                                <Controller
                                  control={form.control}
                                  name={`items.${index}.discountValue`}
                                  render={({ field }) => (
                                    <Field>
                                      <FieldLabel className="text-xs text-zinc-500">{t("discount_value")}</FieldLabel>
                                      <Input type="number" min={0} value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value == "" ? undefined : Number(e.target.value))} className="text-center bg-white" />
                                    </Field>
                                  )}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <button type="button" onClick={handleAddItem} className="mt-4 flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-500 transition-colors">
                    <Plus size={16} strokeWidth={2} /> {t("add_new_item")}
                  </button>
                </section>
              </div>
            </div>

            {/* Footer */}
            <div className="flex flex-col-reverse lg:flex-row justify-between gap-3   py-4 border-t border-gray-100  mt-8">
              <Button size="lg" variant="destructive" type="button" className="w-full lg:w-auto px-8 h-12">
                {t("cancel")}
              </Button>
              <div className="flex flex-col-reverse lg:flex-row items-center gap-3 w-full lg:w-auto">
                <Button size="lg" type="submit" disabled={isPending} className="w-full lg:w-auto px-8 h-12 text-base">
                  {isPending ? t("saving") : t("save_and_issue_quote")}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <FloatingSummary control={form.control} customers={customers} products={products?.items} units={units?.items} grandTotal={grandTotal} itemCount={count} t={t} />
    </>
  );
};

export default CreateQuote;
