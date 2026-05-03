import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Plus, PlusCircle, Tag, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
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
import { Link, useNavigate, useParams } from "react-router-dom";
import AddParnterModal from "@/components/modals/AddParnterModal";
import { useGetAllTreasurys } from "@/features/treasurys/hooks/useGetAllTreasurys";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { calcVat } from "@/utils/calcVat";
import { useGetAllEmployees } from "@/features/employees/hooks/useGetAllEmployees";
import z from "zod";
import { useSettingsStore } from "@/features/settings/store/settingsStore";

const SalesInvoiceSchema = (t: (key: string) => string) =>
  z.object({
    orderDate: z.string().min(1, t("date_required")),
    customerId: z.number().min(1, t("customer_required")),
    warehouseId: z.number().min(1, t("warehouse_required")),
    employeeId: z.number().optional(),
    notes: z.string().optional(),
    items: z
      .array(
        z.object({
          productId: z.number().min(1, t("choose_product")),
          unitName: z.string().optional(),
          quantity: z.number().min(1, t("quantity_must_be_greater_than_zero")),
          price: z.number().min(0, t("price_must_be_gte_zero")),
          discountType: z.enum(["percentage", "fixed"]).default("fixed"),
          discountValue: z.number().min(0).optional(),
        }),
      )
      .min(1, t("must_add_at_least_one_item")),
    payments: z
      .array(
        z.object({
          amount: z.number().min(0),
          treasuryId: z.number().min(1, t("choose_payment_method")),
        }),
      )
      .min(1, t("must_add_at_least_one_payment")),
    invoiceDiscountType: z.enum(["percentage", "fixed"]).default("fixed"),
    invoiceDiscountValue: z.number().min(0).optional(),
  });

type SalesInvoiceType = z.input<ReturnType<typeof SalesInvoiceSchema>>;

const CreateSalesInvoice: React.FC = () => {
  const { t, direction } = useLanguage();
  const navigate = useNavigate();
  const showActualBalance = useSettingsStore((s) => s.settings.location.showActualBalance);
  const defaultSalesVault = useSettingsStore((s) => s.settings.sales.defaultSalesVault);
  const showItemCode = useSettingsStore((s) => s.settings.location.showItemCodeInSalesPrint);
  const { id } = useParams();
  // const isEditMode = Boolean(id);
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  const [discountOpen, setDiscountOpen] = useState<Record<number, boolean>>({});

  const schema = useMemo(() => SalesInvoiceSchema(t), [t]);

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
          unitName: "",
          quantity: 1,
          price: 0,
          discountType: "fixed",
          discountValue: undefined,
        },
      ],
      payments: [
        {
          amount: 0,
          treasuryId: undefined,
        },
      ],
      invoiceDiscountType: "fixed",
      invoiceDiscountValue: undefined,
    },
  });

  const { data: customersResponse } = useGetAllCustomers({
    page: 1,
    limit: 100,
  });
  const { data: products } = useGetAllProducts({ page: 1, limit: 10000000 });
  const { data: wareHouses } = useGetAllWareHouses();
  const { data: units } = useGetAllUnits({});
  const { data: treasurys } = useGetAllTreasurys();
  const filterProducts = useMemo(() => {
    const base = products?.items.filter((pro) => pro?.productType == "Direct" || pro?.productType == "Prepared") || [];
    return base.map((p) => ({
      ...p,
      displayName: showItemCode ? `[${p.productCode || p.id}] ${p.productNameAr}` : p.productNameAr,
    }));
  }, [products?.items, showItemCode]);
  const { mutateAsync: createSalesOrders } = useCreateSalesOrders();
  const { data: employees } = useGetAllEmployees({ page: 1, limit: 10000 });

  const customers = customersResponse?.items ?? [];
  useEffect(() => {
    if (wareHouses && wareHouses.length > 0 && wareHouses[0]?.id) {
      form.setValue("warehouseId", wareHouses[0].id, { shouldValidate: true, shouldDirty: true });
    }
  }, [wareHouses, form]);
  useEffect(() => {
    if (customers[0]?.id && !form.getValues("customerId")) {
      form.setValue("customerId", customers[0].id);
    }
  }, [customers]);

  const {
    fields: itemFields,
    append: appendItem,
    remove: removeItem,
  } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const {
    fields: paymentFields,
    append: appendPayment,
    remove: removePayment,
  } = useFieldArray({
    control: form.control,
    name: "payments",
  });
  const customerId = useWatch({ name: "customerId", control: form.control });

  const invoiceDiscountType = useWatch({
    control: form.control,
    name: "invoiceDiscountType",
  });
  const invoiceDiscountValue = useWatch({
    control: form.control,
    name: "invoiceDiscountValue",
  });
  const payments = useWatch({
    control: form.control,
    name: "payments",
  });
  const items = useWatch({
    control: form.control,
    name: "items",
  });
  const selectedCustomer = customers?.find((customer) => customer?.id == customerId);

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
    let discountedBeforeTax = beforeTaxTotal; // السعر الاجمالي قبل الضريبة قبل الخصم
    if (invoiceDiscountType === "fixed") {
      discountedBeforeTax = Math.max(0, beforeTaxTotal - (invoiceDiscountValue || 0));
    } else {
      discountedBeforeTax = beforeTaxTotal * (1 - (invoiceDiscountValue || 0) / 100);
    }

    const ratio = beforeTaxTotal > 0 ? discountedBeforeTax / beforeTaxTotal : 0;

    const adjustedVat = totalVat * ratio;

    const finalTotal = discountedBeforeTax + adjustedVat;

    return {
      finalTotal: Math.max(0, finalTotal),
      adjustedVat,
      adjustedBeforeTax: discountedBeforeTax,
    };
  }, [beforeTaxTotal, totalVat, invoiceDiscountType, invoiceDiscountValue]);

  const totalPaid = useMemo(() => {
    return payments?.reduce((total, p) => total + (p.amount || 0), 0) || 0;
  }, [payments]);

  const remaining = finalTotal - totalPaid;

  useEffect(() => {
    const count = paymentFields.length;
    const split = Number((finalTotal / count).toFixed(2));
    paymentFields.forEach((_, i) => {
      form.setValue(`payments.${i}.amount`, split);
    });
  }, [finalTotal, paymentFields.length]);
  useEffect(() => {
    if (treasurys && treasurys.length > 0) {
      const defaultId = Number(defaultSalesVault) || Number(treasurys[0]?.id);
      form.setValue(`payments.0.treasuryId`, defaultId);
    }
  }, [treasurys, defaultSalesVault]);

  const handleAddItem = () => {
    appendItem({
      productId: 0,
      unitName: "",
      quantity: 1,
      price: 0,
      discountType: "fixed",
      discountValue: 0,
    });
  };

  const handleAddPayment = () => {
    appendPayment({
      amount: 0,
      treasuryId: undefined,
    });
  };

  const handleSubmit = async (data: SalesInvoiceType) => {
    const payload: CreateSalesOrder = {
      customerId: data.customerId,
      orderDate: data.orderDate,
      warehouseId: data.warehouseId,
      notes: data.notes || "",
      description: "",
      globalDiscountPercentage: data.invoiceDiscountType === "percentage" ? (data.invoiceDiscountValue ?? 0) : 0,
      globalDiscountValue: data.invoiceDiscountType === "fixed" ? (data.invoiceDiscountValue ?? 0) : 0,
      items: data.items.map((item) => {
        const product = products?.items?.find((p) => p.id === Number(item.productId));
        const price = item?.price || 0;
        const taxCalc = product?.taxCalculation ?? 0;
        const taxPercentage = product?.taxPercentage || 0;
        const beforeTax = taxCalc === 1 ? price : price / (1 + taxPercentage / 100);
        return {
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: beforeTax,
          discountPercentage: item.discountType === "percentage" ? (item.discountValue ?? 0) : 0,
          discountValue: item.discountType === "fixed" ? (item.discountValue ?? 0) : 0,
        };
      }),
      payments: data.payments.map((p) => ({
        amount: p.amount,
        treasuryId: p.treasuryId,
        paymentMethod: "Cash",
        notes: "",
      })),
    };

    await createSalesOrders(payload);
    form.reset();
    navigate("/sales/all");
  };

  const allowPriceChangeOnSale = useSettingsStore((s) => s.settings?.items?.allowPriceChangeOnSale);

  return (
    <>
      <Card dir={direction}>
        <CardHeader>
          <CardTitle>{t("add_sales_invoice")}</CardTitle>

          <CardAction>
            <Button size="xl" variant="outline" asChild>
              <Link to="/sales/all">
                {t("back_to_sales_list")}
                <ArrowLeft size={16} />
              </Link>
            </Button>
          </CardAction>
        </CardHeader>

        <CardContent>
          <form onSubmit={form.handleSubmit(handleSubmit, (errors) => console.log(errors))} className="space-y-6">
            <div className="bg-background p-6 rounded-sm border border-border">
              <h2 className="text-lg font-bold text-foreground mb-6">{t("basic_data")}</h2>
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <Controller
                  name="orderDate"
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
                  name="warehouseId"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>
                        {t("warehouse")} <span className="text-red-500">*</span>
                      </FieldLabel>
                      <ComboboxField field={field} items={wareHouses} valueKey="id" labelKey="warehouseName" placeholder={t("choose_warehouse")} />
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
                          <FieldLabel>
                            {t("customer")} <span className="text-red-500">*</span>
                          </FieldLabel>
                          <ComboboxField field={field} items={customers} valueKey="id" labelKey="customerName" placeholder={t("choose_customer")} />
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

                {showActualBalance && (
                  <Field>
                    <FieldLabel>رصيد العميل</FieldLabel>
                    <div className="relative">
                      <Input readOnly value={selectedCustomer?.balance?.toLocaleString("en-EG", { minimumFractionDigits: 2 }) ?? ""} placeholder="—" className={`cursor-default bg-muted/50 font-semibold pr-20 ${(selectedCustomer?.balance ?? 0) < 0 ? "text-red-500" : "text-emerald-500"}`} />
                      <div className="absolute inset-y-0 right-0 flex items-center px-3 border-l border-border bg-muted/50 rounded-r-md">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{(selectedCustomer?.balance ?? 0) <= 0 ? "دائن" : t("debtor")}</span>
                      </div>
                    </div>
                  </Field>
                )}
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

                <div className="lg:col-span-5  col-span-1">
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

            {/* Invoice Details */}
            <div className="bg-background p-6 rounded-sm border border-border">
              <div className="col-span-3 border-b border-border pb-8 min-w-0">
                <h2 className="text-lg font-bold text-foreground mb-6">{t("invoice_details")}</h2>

                <section className="mb-4">
                  <h2 className="text-sm font-semibold text-muted-foreground mb-4">{t("items_list")}</h2>

                  <div className="w-full overflow-x-auto pb-4">
                    <div>
                      <div className={cn("hidden md:grid gap-4 px-2 pb-3 border-b border-zinc-200 text-xs font-medium text-zinc-400 uppercase tracking-widest items-center", 
                        showItemCode ? "md:grid-cols-[1fr_1.3fr_0.6fr_0.6fr_0.7fr_0.6fr_0.8fr_0.7fr_0.7fr_0.8fr_50px]" : "md:grid-cols-[1.5fr_0.9fr_0.8fr_1fr_0.7fr_0.7fr_1fr_1fr_0.9fr_60px]")}>
                        {showItemCode && <div>{t("product_code")}</div>}
                        <div>{t("product_name")}</div>
                        <div>{t("unit")}</div>
                        <div>{t("balance")}</div>
                        <div>{t("unit_price")}</div>
                        <div>{t("quantity")}</div>
                        <div>نوع الضريبة</div>
                        <div>{t("subtotal_before_tax")}</div>
                        <div>{t("vat")}</div>
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
                          const productCode = product?.barcode || "";
                          const originalPrice = product?.sellingPrice || 1;
                          const originalTax = product?.taxAmount || 0;
                          const taxPercentage = originalTax / originalPrice;
                          const taxCalc = product?.taxCalculation ?? 0;
                          const gross = qty * price;
                          const discount = discType === "fixed" ? discValue * qty : gross * (discValue / 100);
                          const afterDiscount = Math.max(0, gross - discount);
                          const vatAmount = taxCalc === 1 ? 0 : afterDiscount * taxPercentage;
                          const beforeTax = afterDiscount - vatAmount;
                          const grandTotal = afterDiscount;
                          const nameTaxValc = taxCalc == 3 ? "غير شامل الضريبة" : taxCalc == 2 ? "شامل الضريبة" : taxCalc == 1 ? "لا يوجد ضريبة" : "-";
                          const isDiscOpen = !!discountOpen[index];

                          return (
                            <div key={item.id}>
                              <div className={cn("grid grid-cols-1 gap-3 p-4 md:p-2 bg-muted/40 md:bg-transparent rounded-xl md:rounded-none border md:border-none border-border items-center group", 
                                showItemCode ? "md:grid-cols-[1fr_1.3fr_0.6fr_0.6fr_0.7fr_0.6fr_0.8fr_0.7fr_0.7fr_0.8fr_50px]" : "md:grid-cols-[1.5fr_0.9fr_0.8fr_1fr_0.7fr_0.7fr_1fr_1fr_0.9fr_60px]")}>
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
                                    <Field>
                                      <ComboboxField
                                        field={field}
                                        items={filterProducts}
                                        valueKey="id"
                                        labelKey="displayName"
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
                                      <Input type="number" readOnly={!allowPriceChangeOnSale} value={field.value ?? 0} onChange={(e) => field.onChange(Number(e.target.value))} className={`text-center ${!allowPriceChangeOnSale ? "cursor-not-allowed opacity-70" : ""}`} />
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

                                <div className="text-center font-medium text-foreground">{nameTaxValc}</div>
                                <div className="text-center font-medium text-foreground">{beforeTax.toLocaleString("en-EG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>

                                <div className="text-center text-orange-500 font-medium">{vatAmount.toLocaleString("en-EG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>

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

                  <button type="button" onClick={handleAddItem} className="mt-4 flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                    <Plus size={16} strokeWidth={2} />
                    {t("add_new_item")}
                  </button>
                </section>
              </div>
            </div>

            {/* Payments */}
            <div className="bg-background p-6 rounded-xl border border-border col-span-3">
              <h2 className="text-xl font-bold text-foreground mb-6">{t("payments")}</h2>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 space-y-4">
                  {paymentFields.map((payment, index) => (
                    <div key={payment.id} className="flex flex-col sm:flex-row gap-3 items-center bg-muted/30 p-3 rounded-lg border border-border">
                      <div className="w-full flex-1">
                        <label className="text-xs text-muted-foreground mb-1 block">{t("amount")}</label>
                        <Controller
                          control={form.control}
                          name={`payments.${index}.amount`}
                          render={({ field, fieldState }) => (
                            <Field className="relative" data-invalid={fieldState.invalid}>
                              <Input step="any" type="number" placeholder="0.00" value={field.value ?? 0} onChange={(e) => field.onChange(Number(e.target.value))} />
                              {fieldState.invalid && (
                                <div className="absolute top-full mt-1 right-0 z-10 w-full">
                                  <FieldError errors={[fieldState.error]} />
                                </div>
                              )}
                            </Field>
                          )}
                        />
                      </div>

                      <div className="w-full flex-1">
                        <label className="text-xs text-muted-foreground mb-1 block">{t("payment_method")}</label>
                        <Controller
                          control={form.control}
                          name={`payments.${index}.treasuryId`}
                          render={({ field, fieldState }) => (
                            <Field>
                              <Select key={field.value} value={field.value?.toString()} onValueChange={(val) => field.onChange(Number(val))}>
                                <SelectTrigger>
                                  <SelectValue placeholder={t("choose")} />
                                </SelectTrigger>
                                <SelectContent>
                                  {treasurys?.map((item) => (
                                    <SelectItem key={item.id} value={item.id.toString()}>
                                      {item.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {fieldState?.error && <FieldError errors={[fieldState.error]} />}
                            </Field>
                          )}
                        />
                      </div>

                      <div className="pt-5 shrink-0">
                        <button type="button" onClick={() => removePayment(index)} disabled={paymentFields.length === 1} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-md disabled:opacity-30 transition-colors border border-transparent hover:border-red-100 dark:hover:border-red-900" title={t("delete_payment")}>
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}

                  <Button type="button" size="lg" variant="secondary" onClick={handleAddPayment} className="text-sm font-medium px-4 rounded-lg transition-colors w-max">
                    <Plus size={16} strokeWidth={2} />
                    {t("add_another_payment")}
                  </Button>
                </div>

                {/* Invoice Summary */}
                <div className="bg-muted/30 p-6 rounded-2xl border border-border">
                  <h3 className="text-base font-semibold text-foreground mb-5">{t("invoice_summary")}</h3>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-muted-foreground">
                      <span className="text-sm font-medium">{t("subtotal_before_tax")}</span>
                      <span className="font-semibold text-foreground">{adjustedBeforeTax.toLocaleString("en-EG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>

                    <div className="flex justify-between items-center text-muted-foreground">
                      <span className="text-sm font-medium">{t("vat")}</span>
                      <span className="font-semibold text-orange-500">{adjustedVat.toLocaleString("en-EG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>

                    <div className="flex justify-between items-center text-muted-foreground gap-3">
                      <span className="text-sm font-medium whitespace-nowrap">{t("discount")}</span>
                      <div className="flex gap-2 w-full max-w-[220px]">
                        <Controller control={form.control} name="invoiceDiscountValue" render={({ field }) => <Input type="number" step={"any"} min={0} value={field.value ? field.value : undefined} onChange={(e) => field.onChange(Number(e.target.value))} className="text-center flex-1 min-w-[90px]" placeholder={t("value")} />} />
                        <Controller
                          control={form.control}
                          name="invoiceDiscountType"
                          render={({ field }) => (
                            <Select key={field.value} value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger className="w-[120px]">
                                <SelectValue placeholder={t("choose_discount_type")} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="fixed">{t("value")}</SelectItem>
                                <SelectItem value="percentage">{t("percentage")}</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                    </div>

                    <hr className="border-border" />

                    <div className="flex justify-between items-center">
                      <span className="font-bold text-foreground">{t("grand_total")}</span>
                      <span className="text-xl font-black text-foreground">{finalTotal.toLocaleString("en-EG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>

                    <div className="flex justify-between items-center text-muted-foreground pt-2">
                      <span className="text-sm">{t("total_paid")}</span>
                      <span className="font-semibold text-emerald-500">{totalPaid.toLocaleString("en-EG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>

                    <div className="flex justify-between items-center bg-background p-3 rounded-lg border border-border mt-2">
                      <span className="text-sm font-bold text-foreground">{t("remaining_to_pay")}</span>
                      <span className={`font-black text-lg ${remaining > 0 ? "text-red-500" : "text-muted-foreground"}`}>{remaining.toLocaleString("en-EG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-background p-5 sm:p-6 rounded-sm border border-border flex flex-col-reverse sm:flex-row justify-between items-center gap-4">
              <Button type="button" variant="destructive" className="h-12 px-4" onClick={() => navigate("/sales/all")}>
                {t("cancel_and_return")}
              </Button>
              <Button type="submit" className="h-12 px-4">
                {t("save_and_issue_invoice")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <AddParnterModal
        isOpen={isAddCustomerModalOpen}
        onClose={() => {
          setIsAddCustomerModalOpen(false);
        }}
      />
    </>
  );
};

export default CreateSalesInvoice;
