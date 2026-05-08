import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Plus, PlusCircle, Tag, Trash2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { z } from "zod";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { useGetAllCustomers } from "@/features/customers/hooks/useGetAllCustomers";
import { Button } from "@/components/ui/button";
import { useGetAllProducts } from "@/features/products/hooks/useGetAllProducts";
import { Textarea } from "@/components/ui/textarea";
import { useCreateSalesOrders } from "@/features/sales/hooks/useCreateSalesOrders";
import { useGetAllWareHouses } from "@/features/wareHouse/hooks/useGetAllWareHouses";
import { useGetAllUnits } from "@/features/units/hooks/useGetAllUnits";
import type { CreateSalesOrder } from "@/features/sales/types/sales.types";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ComboboxField from "@/components/ui/ComboboxField";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useGetSalesOrderById } from "@/features/sales/hooks/useGetSalesOrderById";
import AddParnterModal from "@/components/modals/AddParnterModal";
import formatDate from "@/lib/formatDate";
import { CreateSalesReturns } from "@/features/salesReturns/types/salesReturns.types";
import { useCreateSalesReturns } from "@/features/salesReturns/hooks/useCreateSalesReturns";
import { useGetAllTreasurys } from "@/features/treasurys/hooks/useGetAllTreasurys";
import { calcVat } from "@/utils/calcVat";
import { useGetSalesReturnsById } from "@/features/salesReturns/hooks/useGetSalesReturnsById";
import { useSettingsStore } from "@/features/settings/store/settingsStore";
import { cn } from "@/lib/utils";

const ReturnInvoiceSchema = (t: (key: string) => string) =>
  z.object({
    orderDate: z.string().min(1, t("date_required")),
    customerId: z.number().min(1, t("customer_required")),
    warehouseId: z.number().min(1, t("warehouse_required")),
    notes: z.string().optional(),
    items: z
      .array(
        z.object({
          productId: z.number().min(1, t("choose_product")),

          unitName: z.string().optional(),
          quantity: z.number().min(1, t("quantity_must_be_greater_than_zero")),
          price: z.number().min(0, t("price_must_be_gte_zero")),
          discountType: z.enum(["percentage", "fixed"]).default("fixed"),
          discountValue: z.number().min(0).default(0),
        }),
      )
      .min(1, t("must_add_at_least_one_item")),

    invoiceDiscountType: z.enum(["percentage", "fixed"]).default("fixed"),
    invoiceDiscountValue: z.number().min(0).optional(),
  });

type SalesInvoiceType = z.input<ReturnType<typeof ReturnInvoiceSchema>>;

const CreateReturnSalesInvoice: React.FC = () => {
  const { t, direction } = useLanguage();
  const navigate = useNavigate();
  const { id } = useParams();
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  const [discountOpen, setDiscountOpen] = useState<Record<number, boolean>>({});
  const location = useLocation();
  const isViewMode = !!id && location?.pathname?.includes("view");
  const { data: detailsSalesOrder } = useGetSalesOrderById(Number(id) ?? undefined, {
    enabled: !!id && !isViewMode,
  });
  const { data: products } = useGetAllProducts({ page: 1, limit: 10000000 });
  const { data: wareHouses } = useGetAllWareHouses();
  const { data: units } = useGetAllUnits({});
  const { mutateAsync: CreateSalesReturns } = useCreateSalesReturns();
  const { data: salesReturnOrderDetails } = useGetSalesReturnsById(Number(id), {
    enabled: isViewMode && !!id,
  });
  const filterProducts = useMemo(() => products?.items.filter((pro) => pro?.productType == "Direct" || pro?.productType == "Prepared"), [products]);

  const schema = useMemo(() => ReturnInvoiceSchema(t), [t]);
  const taxSetting = useSettingsStore((state) => state.settings.taxSetting?.taxSetting);
  const isExempt = taxSetting === "Exempt";

  const toggleDiscount = (index: number) => {
    setDiscountOpen((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const form = useForm<SalesInvoiceType>({
    resolver: zodResolver(schema),
    defaultValues: {
      orderDate: new Date().toISOString().split("T")[0],
      customerId: 0,
      warehouseId: 0,
      notes: "",
      items: [
        {
          productId: 0,
          quantity: 1,
          price: undefined,
          discountType: "fixed",
          discountValue: 0,
        },
      ],

      invoiceDiscountType: "fixed",
      invoiceDiscountValue: 0,
    },
  });

  const { data: customersResponse } = useGetAllCustomers({
    page: 1,
    limit: 100,
  });

  const customers = customersResponse?.items ?? [];

  const {
    fields: itemFields,
    append: appendItem,
    remove: removeItem,
  } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const invoiceDiscountType = useWatch({
    control: form.control,
    name: "invoiceDiscountType",
  });
  const invoiceDiscountValue = useWatch({
    control: form.control,
    name: "invoiceDiscountValue",
  });

  const items = useWatch({
    control: form.control,
    name: "items",
  });
  const enableDiscountAmount = useMemo(() => {
    return items?.some((item) => {
      const originalItem = detailsSalesOrder?.items.find((i) => i.productId === item.productId);
      const originalQty = originalItem?.quantity ?? item.quantity;
      return item.quantity < originalQty;
    });
  }, [items, detailsSalesOrder?.items]);
  const { beforeTaxTotal, totalVat } = useMemo(() => {
    let beforeTaxTotal = 0;
    let totalVat = 0;

    items?.forEach((item) => {
      const product = products?.items?.find((p) => p.id === Number(item.productId));
      const qty = item.quantity || 0;
      const price = item.price || 0;
      const discType = item.discountType || "fixed";
      const discValue = item.discountValue || 0;
      const originalPrice = product?.sellingPrice || 1;
      const originalTax = product?.taxAmount || 0;
      const taxPercentage = originalTax / originalPrice;
      const taxCalc = product?.taxCalculation ?? 1;
      const gross = qty * price;
      const discount = discType === "fixed" ? discValue * qty : gross * (discValue / 100);
      const afterDisc = Math.max(0, gross - discount);
      const vatAmount = taxCalc === 1 ? 0 : afterDisc * taxPercentage;
      const beforeTax = afterDisc - vatAmount;
      beforeTaxTotal += beforeTax;
      totalVat += vatAmount;
    });

    return { beforeTaxTotal, totalVat };
  }, [items, products]);

  const { finalTotal, adjustedVat, adjustedBeforeTax } = useMemo(() => {
    let total = beforeTaxTotal;

    if (invoiceDiscountType === "fixed") {
      total -= invoiceDiscountValue || 0;
    } else {
      total -= total * ((invoiceDiscountValue || 0) / 100);
    }
    const ratio = beforeTaxTotal > 0 ? total / beforeTaxTotal : 0;
    const adjustedVat = totalVat * ratio;

    const finalTotal = total + adjustedVat;

    return {
      finalTotal: Math.max(0, finalTotal),
      adjustedVat,
      adjustedBeforeTax: total,
    };
  }, [beforeTaxTotal, totalVat, invoiceDiscountType, invoiceDiscountValue]);

  const handleSubmit = async (data: SalesInvoiceType) => {
    const payload: CreateSalesReturns = {
      salesOrderId: detailsSalesOrder?.id,
      returnDate: data.orderDate,
      warehouseId: data.warehouseId,
      reason: data.notes || "",
      refundMethod: "CashFromTreasury",
      discountAmount: data?.invoiceDiscountValue,
      items: data.items.map((formItem) => {
        const originalItem = detailsSalesOrder?.items.find((item) => item.productId === formItem.productId);
        return {
          originalItemId: originalItem?.id,
          productId: formItem.productId,
          unitId: originalItem?.unitId,
          quantity: formItem.quantity,
        };
      }),
    };

    await CreateSalesReturns(payload);
    form.reset();
    navigate("/sales/return");
  };

  useEffect(() => {
    const items = salesReturnOrderDetails?.items ?? detailsSalesOrder?.items ?? [];
    form.reset({
      warehouseId: wareHouses?.find((wareHouse) => wareHouse?.warehouseName == detailsSalesOrder?.warehouseName)?.id ?? wareHouses?.find((wareHouse) => wareHouse?.warehouseName == salesReturnOrderDetails?.warehouseName)?.id,
      customerId: customers.find((customer) => customer?.customerName === salesReturnOrderDetails?.customerName)?.id ?? detailsSalesOrder?.customerId,
      notes: salesReturnOrderDetails?.reason ?? detailsSalesOrder?.notes,
      orderDate: salesReturnOrderDetails?.returnDate ? salesReturnOrderDetails?.returnDate?.split("T")[0] : detailsSalesOrder?.orderDate?.split("T")[0],
      invoiceDiscountValue: salesReturnOrderDetails?.discountAmount || detailsSalesOrder?.discountAmount,
      items: items.map((item) => {
        return {
          productId: item?.productId,
          price: item?.priceAfterTax,
          unitName: units?.items?.find((unit) => unit?.id == item?.unitId)?.name,
          // discountType: item?.discountValue ? "fixed" : "percentage",
          // discountValue: item?.discountValue ? item?.discountValue : item?.discountPercentage,
          quantity: item?.quantity,
        };
      }),
      invoiceDiscountType: "fixed",
      // payments: detailsSalesOrder?.payments.map((payment) => ({
      //   amount: payment?.amount,
      //   paymentMethod: payment?.paymentMethod,
      // })),
    });
  }, [salesReturnOrderDetails, form, detailsSalesOrder, units?.items]);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>فاتورة مرتجعات</CardTitle>
          <CardAction>
            <Button size="xl" variant="outline" asChild>
              <Link to="/sales/a4-invoices">
                العودة لفواتير المبيعات
                <ArrowLeft size={16} />
              </Link>
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(handleSubmit, (errors) => console.log(errors))} className="space-y-6">
            <div className="bg-white dark:bg-transparent p-6 rounded-sm border border-gray-100 dark:border-gray-800">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-6">{t("basic_data")}</h2>
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <Controller
                  name="orderDate"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>{t("date")} *</FieldLabel>
                      <Input disabled={true} type="date" {...field} />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />

                <Controller
                  name="warehouseId"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>{t("warehouse")} *</FieldLabel>
                      <ComboboxField disabled={true} field={field} items={wareHouses} valueKey="id" labelKey="warehouseName" placeholder={t("choose_warehouse")} />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />

                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <Controller
                      name="customerId"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel>{t("customer")} *</FieldLabel>
                          <ComboboxField disabled={true} field={field} items={customers} valueKey="id" labelKey="customerName" placeholder={t("choose_customer")} />
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                      )}
                    />
                  </div>
                  <div className="mt-6">
                    <Button type="button" onClick={() => setIsAddCustomerModalOpen(true)} variant="outline" size="icon" className="h-10">
                      <Plus />
                    </Button>
                  </div>
                </div>

                <Controller
                  name="invoiceDiscountValue"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>{t("discount_amount_value")} </FieldLabel>
                      <Input type="number" value={field.value ?? ""} disabled={!enableDiscountAmount} onChange={(e) => field.onChange(Number(e.target.value))} className={`text-center ${!enableDiscountAmount && "cursor-not-allowed"}`} />
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

            <div className="bg-white dark:bg-transparent p-6 rounded-sm border border-gray-100 dark:border-gray-800">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-6">{t("invoice_details")}</h2>
              <h3 className="text-sm font-semibold text-zinc-500 mb-4">{t("items_list")}</h3>

              <div className="w-full overflow-x-auto pb-4">
                <div className={cn("hidden md:grid gap-4 px-2 pb-3 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-widest items-center", isExempt ? "md:grid-cols-[1.5fr_0.9fr_0.8fr_1fr_0.7fr_0.9fr_60px]" : "md:grid-cols-[1.5fr_0.9fr_0.8fr_1fr_0.7fr_1fr_0.9fr_0.9fr_60px]")}>
                  <div>{t("product_name")}</div>
                  <div>{t("unit")}</div>
                  <div>{t("balance")}</div>
                  <div>{t("unit_price")}</div>
                  <div>{t("quantity")}</div>
                  {!isExempt && <div>{t("subtotal_before_tax")}</div>}
                  {!isExempt && <div>{t("vat")}</div>}
                  <div>{t("grand_total")}</div>
                  <div></div>
                </div>

                <div className="space-y-3 mt-3">
                  {itemFields.map((item, index) => {
                    const qty = Number(form.watch(`items.${index}.quantity`) || 0);
                    const price = Number(form.watch(`items.${index}.price`) || 0);
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
                    const isExempt = taxSetting === "Exempt";
                    const vatAmount = taxCalc === 1 || isExempt ? 0 : afterDiscount * taxPercentage;
                    const beforeTax = afterDiscount - vatAmount;
                    const grandTotal = afterDiscount;
                    const nameTaxValc = taxCalc == 3 ? "غير شامل الضريبة" : taxCalc == 2 ? "شامل الضريبة" : taxCalc == 1 ? "لا يوجد ضريبة" : "-";
                    const isDiscOpen = !!discountOpen[index];

                    return (
                      <div key={item.id}>
                        <div className={cn("grid grid-cols-1 gap-3 p-4 md:p-2 bg-muted/40 md:bg-transparent rounded-xl md:rounded-none border md:border-none border-border items-center group", isExempt ? "md:grid-cols-[1.5fr_0.9fr_0.8fr_1fr_0.7fr_0.9fr_60px]" : "md:grid-cols-[1.5fr_0.9fr_0.8fr_1fr_0.7fr_1fr_0.9fr_0.9fr_60px]")}>
                          {" "}
                          <Controller
                            control={form.control}
                            name={`items.${index}.productId`}
                            render={({ field, fieldState }) => (
                              <Field>
                                <ComboboxField
                                  disabled={true}
                                  field={field}
                                  items={filterProducts}
                                  valueKey="id"
                                  labelKey="productNameAr"
                                  placeholder={t("choose_product")}
                                  onValueChange={(val) => {
                                    const selectedProduct = filterProducts.find((p) => p.id === Number(val));
                                    if (selectedProduct) {
                                      form.setValue(`items.${index}.price`, selectedProduct.sellingPrice);
                                      const unitProduct = units?.items?.find((unit) => unit?.id == selectedProduct?.baseUnitId);
                                      form.setValue(`items.${index}.unitName`, unitProduct?.name);
                                    }
                                  }}
                                />
                                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                              </Field>
                            )}
                          />
                          <Controller
                            control={form.control}
                            name={`items.${index}.unitName`}
                            render={({ field }) => (
                              <Field>
                                <FieldLabel className="md:hidden text-xs mb-1.5 text-muted-foreground">{t("unit")}</FieldLabel>
                                <span className="block text-center py-2.5 px-3 bg-muted rounded-md text-foreground">{field.value || "-"}</span>
                              </Field>
                            )}
                          />
                          <div className="text-center bg-muted py-2.5 px-3 rounded-md">
                            <span className={`font-medium  ${(product?.balance ?? 0) <= 0 ? "text-red-500" : "text-emerald-500"}`}>{product?.balance?.toLocaleString("en-EG", { minimumFractionDigits: 2 }) ?? "—"}</span>
                          </div>
                          <Controller
                            control={form.control}
                            name={`items.${index}.price`}
                            render={({ field, fieldState }) => (
                              <Field>
                                <Input disabled={true} type="number" value={field.value ?? 0} onChange={(e) => field.onChange(Number(e.target.value))} className="text-center" />
                                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                              </Field>
                            )}
                          />
                          <Controller
                            control={form.control}
                            name={`items.${index}.quantity`}
                            render={({ field, fieldState }) => (
                              <Field>
                                <Input type="number" min={1} value={field.value ?? 1} onChange={(e) => field.onChange(Number(e.target.value))} className="text-center" />
                                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                              </Field>
                            )}
                          />
                          {!isExempt && <div className="text-center font-medium text-foreground">{beforeTax.toLocaleString("en-EG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>}
                          {!isExempt && <div className="text-center text-orange-500 font-medium">{vatAmount.toLocaleString("en-EG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>}
                          <div className="text-center text-green-500 font-bold">{grandTotal.toLocaleString("en-EG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                          <div className="flex items-center justify-center gap-2">
                            <button type="button" onClick={() => removeItem(index)} disabled={itemFields.length === 1} className="p-2 text-muted-foreground hover:text-red-500 disabled:opacity-30">
                              <Trash2 size={16} />
                            </button>
                            {/* <button type="button" onClick={() => toggleDiscount(index)} className={`p-2 ${isDiscOpen ? "text-emerald-500" : "text-muted-foreground"}`}>
                              <Tag size={14} />
                            </button> */}
                          </div>
                        </div>

                        {isDiscOpen && (
                          <div className="grid grid-cols-2 gap-3 px-2 py-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-lg">
                            <Controller
                              control={form.control}
                              name={`items.${index}.discountType`}
                              render={({ field }) => (
                                <ComboboxField
                                  field={field}
                                  items={[
                                    { value: "fixed", label: t("fixed_value") },
                                    { value: "percentage", label: t("percentage") + " %" },
                                  ]}
                                  valueKey="value"
                                  labelKey="label"
                                  className="w-full"
                                />
                              )}
                            />
                            <Controller control={form.control} name={`items.${index}.discountValue`} render={({ field }) => <Input type="number" value={field.value ? field.value : undefined} onChange={(e) => field.onChange(Number(e.target.value))} />} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-transparent p-6 rounded-xl border border-gray-100 dark:border-gray-800">
              <div className="flex justify-end">
                <div className="w-full max-w-sm bg-muted/30 border border-border rounded-2xl p-5 space-y-3">
                  <h3 className="text-sm font-bold text-foreground mb-4">{t("invoice_summary")}</h3>

                  {!isExempt && (
                    <>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">{t("subtotal_before_tax")}</span>
                        <span className="font-semibold text-foreground tabular-nums">{adjustedBeforeTax.toLocaleString("en-EG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>

                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">{t("vat")}</span>
                        <span className="font-semibold text-amber-600 tabular-nums">{adjustedVat.toLocaleString("en-EG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    </>
                  )}

                  <hr className="border-border" />

                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-foreground">{t("grand_total")}</span>
                    <span className="text-2xl font-black text-primary tabular-nums">{finalTotal.toLocaleString("en-EG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            </div>

            {!isViewMode && (
              <div className="bg-white dark:bg-transparent p-5 sm:p-6 rounded-sm border border-gray-100 dark:border-gray-800 flex flex-col-reverse sm:flex-row justify-between items-center gap-4">
                <Button type="button" variant="destructive" className="h-12 px-6" onClick={() => navigate("/sales/a4-invoices")}>
                  {t("cancel_and_return")}
                </Button>
                <Button type="submit" className="h-12 px-6">
                  {t("save_and_issue_invoice")}
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      <AddParnterModal isOpen={isAddCustomerModalOpen} onClose={() => setIsAddCustomerModalOpen(false)} />
      <AddParnterModal
        isOpen={isAddCustomerModalOpen}
        onClose={() => {
          setIsAddCustomerModalOpen(false);
        }}
      />
    </>
  );
};

export default CreateReturnSalesInvoice;
