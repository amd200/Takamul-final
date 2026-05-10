import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FileText, Search, Edit2, Trash2, ArrowRight, ArrowLeft, Download, Printer, Menu, LayoutGrid, ShoppingCart, ArrowUp, ArrowDown, PlusCircle, DollarSign, FileSpreadsheet, Mail, Filter, MoreHorizontal, RotateCcw, Warehouse, FileCheck, FileDown, MessageCircle, UserCog, RefreshCw, Send } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { ResponsiveModal } from "@/components/modals/ResponsiveModal";
import DeleteConfirmationModal from "@/components/modals/DeleteConfirmationModal";
import { useGetAllSales } from "../features/sales/hooks/useGetAllSales";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type DataTableFilterMeta, type DataTablePageEvent } from "primereact/datatable";
import { Column } from "primereact/column";
import { Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { FilterMatchMode } from "primereact/api";
import type { SalesOrder } from "@/features/sales/types/sales.types";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { usePrint } from "@/context/PrintContext";
import { useAuthStore } from "@/store/authStore";
import { Permissions } from "@/lib/permissions";
import { format } from "@/constants/data";
import formatDate from "@/lib/formatDate";
import { useSendInvoiceSell } from "@/features/zatcaInvoice/hooks/useSendInvoiceSell";
import { useSettingsStore } from "@/features/settings/store/settingsStore";
import { useSendWhatsAppTemplate } from "@/features/whatsapp/hooks/useSendTemplateMessage";
import { Controller, useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { useUploadFile } from "@/features/sales/hooks/useUploadFile";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SendWhatsAppDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultPhone?: string;
  phoneNumberId: string;
  onSend: (phone: string, invoiceType: "a4" | "roll") => Promise<void>; // ← عدّل
}

interface FormValues {
  phone: string;
  invoiceType: "a4" | "roll"; // ← أضف
}

// ─── Component ────────────────────────────────────────────────────────────────

export const SendWhatsAppDialog: React.FC<SendWhatsAppDialogProps> = ({ open, onOpenChange, defaultPhone = "", phoneNumberId, onSend }) => {
  const { t } = useLanguage();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: { phone: defaultPhone, invoiceType: "a4" },
  });

  React.useEffect(() => {
    if (open) reset({ phone: defaultPhone });
  }, [open, defaultPhone, reset]);

  const onSubmit = async (values: FormValues) => {
    await onSend(values.phone, values.invoiceType);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle size={20} className="text-green-500" />
            إرسال رسالة واتساب
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="pb-1">
            <Field>
              <FieldLabel>
                رقم الجوال
                <span className="text-red-500 mr-1">*</span>
              </FieldLabel>
              <Input
                {...register("phone", {
                  required: "رقم الجوال مطلوب",
                  pattern: {
                    value: /^[0-9+]{7,15}$/,
                    message: "رقم الجوال غير صحيح",
                  },
                })}
                placeholder="مثال : 966xxxxx"
                className={errors.phone ? "border-red-500" : ""}
              />
              {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}
              <p className="text-xs text-[var(--text-muted)] mt-1">أدخل الرقم مع كود الدولة بدون + مثال: 966xxxxxx</p>
            </Field>
            <Field>
              <FieldLabel>نوع الفاتورة</FieldLabel>
              <Controller
                control={control}
                name="invoiceType"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر نوع الفاتورة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="a4">A4</SelectItem>
                      <SelectItem value="roll">رول</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
          </div>

          <DialogFooter className="gap-2">
            <Button size="2xl" type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button size="2xl" type="submit" disabled={isSubmitting} className="-700 text-white flex items-center gap-2">
              <Send size={15} />
              {isSubmitting ? "جاري الإرسال..." : "إرسال"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
export default function A4Sales() {
  type Payment = SalesOrder["payments"][number];
  const { t, direction, language } = useLanguage();
  const { printInvoice, exportPDF, exportExcel, exportCSV, generateInvoiceFile, generateRollFile } = usePrint();
  const navigate = useNavigate();
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const { data: salesOrders } = useGetAllSales({ page: currentPage, limit: entriesPerPage, OrderType: "A4" });
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const { mutateAsync: sendWhatsAppTemplate } = useSendWhatsAppTemplate();
  const { mutateAsync: uploadFile } = useUploadFile();

  const [selectedRow, setSelectedRow] = useState<SalesOrder | null>(null);

  const { mutateAsync: sendInvoiceSell } = useSendInvoiceSell();
  const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setGlobalFilterValue(value);
    setCurrentPage(1);
  };
  const taxSetting = useSettingsStore((state) => state.settings?.taxSetting?.taxSetting);
  const renderHeader = () => {
    return (
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <Input type="text" value={globalFilterValue} onChange={onGlobalFilterChange} placeholder={t("search_placeholder")} className="placeholder:font-normal w-full border border-gray-200 hover:border-gray-200 focus:border-[var(--primary)] focus:bg-white text-gray-700 text-sm rounded-lg py-2 pr-11 pl-4 transition-all outline-none" />
        </div>
      </div>
    );
  };
  const zatcaStatusBodyTemplate = useCallback(
    (rowData: SalesOrder) => {
      const statusMap: Record<SalesOrder["zatcaStatus"], { label: string; className: string }> = {
        Sent: {
          label: "تم الإرسال بنجاح",
          className: "text-[#09ad95] bg-[#00e6821a]",
        },
        NotSendYet: {
          label: "لم يتم الارسال ",
          className: "text-[#b40b09] bg-[#f50b0b1a]",
        },
        Rejected: {
          label: "مرفوض",
          className: "text-[#b40b09] bg-[#f50b0b1a]",
        },
      };
      const status = rowData?.zatcaStatus ?? "Rejected";
      const { label, className } = statusMap[status] ?? statusMap.Rejected;

      return <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${className}`}>{label}</span>;
    },
    [language, t],
  );
  const phoneNumberId = useSettingsStore((state) => state.settings.whatsApp.whatsAppPhoneNumberId);
  const header = useMemo(() => renderHeader(), [globalFilterValue, t]);
  const statusBodyTemplate = useCallback(
    (rowData: SalesOrder) => {
      const isActive = rowData?.orderStatus == "Confirmed";
      return <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${isActive ? "text-[#09ad95] bg-[#00e6821a]" : "text-[#b40b09] bg-[#f50b0b1a]"}`}>{isActive ? t("confirmed") : t("not_confirmed")}</span>;
    },
    [language, t],
  );
  const [whatsAppOpen, setWhatsAppOpen] = React.useState(false);

  const hasPermission = useAuthStore((state) => state.hasPermission);
  const handleSendWhatsApp = async (phone: string, invoiceType: "a4" | "roll") => {
    const file = invoiceType === "a4" ? await generateInvoiceFile(selectedRow!) : await generateRollFile(selectedRow!);
    const formData = new FormData();
    formData.append("File", file);
    const response = await uploadFile(formData);

    // await sendWhatsAppTemplate({
    //   data: {
    //     messaging_product: "whatsapp",
    //     to: phone,
    //     type: "template",
    //     template: {
    //       name: "invoice_receipt_1",
    //       language: { code: "ar" },
    //       components: [
    //         {
    //           type: "header",
    //           parameters: [
    //             {
    //               type: "document",
    //               document: {
    //                 link: response?.data?.url,
    //                 filename: "invoice.pdf",
    //               },
    //             },
    //           ],
    //         },
    //       ],
    //     },
    //   },
    //   phoneNumberId,
    // });
  };
  return (
    <div className="space-y-4 pb-12" dir={direction}>
      <Card>
        <CardHeader className="">
          <CardTitle>{t("a4_sales_heading")}</CardTitle>
          <CardAction>
            {/* <Button size="2xl" variant={"default"} asChild>
              <Link to={"/sales/create"}>{t("add_sales_invoice")}</Link>
            </Button> */}
          </CardAction>
        </CardHeader>
        <CardContent>
          <DataTable
            key={language}
            value={salesOrders?.items || []}
            lazy
            paginator
            rows={entriesPerPage}
            first={(currentPage - 1) * entriesPerPage}
            totalRecords={salesOrders?.totalCount || 0}
            onPage={(e: DataTablePageEvent) => {
              if (e.page === undefined) return;
              setCurrentPage(e.page + 1);
              setEntriesPerPage(e.rows);
            }}
            loading={!salesOrders?.items}
            header={header}
            responsiveLayout="stack"
            className="custom-green-table custom-compact-table"
            dataKey="id"
            stripedRows={false}
          >
            <Column header={t("invoice_number")} sortable field="orderNumber" />
            <Column header={t("date")} sortable field="orderDate" body={(row) => formatDate(row.orderDate)} />
            <Column header={t("customer_name")} sortable field="customerName" />
            <Column header={t("cashier")} sortable field="createdBy" />
            {taxSetting == "SecondStage" && <Column header={"حالة إرسال المرحلة التانية"} sortable body={(rawData) => zatcaStatusBodyTemplate(rawData)} field="zatcaStatus" />}
            <Column header={t("invoice_status")} sortable body={(rawData) => statusBodyTemplate(rawData)} field="orderStatus" />
            <Column header={t("total_amount")} sortable field="grandTotal" body={(row: SalesOrder) => format(row.grandTotal)} />
            <Column header={t("paid_amount")} sortable field="payments" body={(rowData) => rowData.payments?.reduce((sum: number, p: Payment) => sum + p.amount, 0) ?? 0} />
            {/* <Column header={t("remaining_amount")} sortable field="" /> */}
            <Column
              header={t("actions")}
              body={(row: SalesOrder) => (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="btn-minimal-action btn-compact-action">
                      <MoreHorizontal size={18} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52 p-1">
                    <DropdownMenuItem onClick={() => printInvoice(row, "invoice")} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 rounded-md cursor-pointer">
                      <FileText size={14} />
                      طباعة الفاتورة (A4)
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => printInvoice(row, "roll")} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 rounded-md cursor-pointer">
                      <Printer size={14} />
                      طباعة الفاتورة (رول)
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    {hasPermission(Permissions?.salesReturns?.add) && (
                      <DropdownMenuItem asChild>
                        <Link to={`/sales/return/${row?.id}`} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 rounded-md">
                          <RotateCcw size={14} />
                          إرجاع مبيع
                        </Link>
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuItem onClick={() => printInvoice(row, "stock")} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 rounded-md cursor-pointer">
                      <Warehouse size={14} />
                      سند مخزني
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => printInvoice(row, "claim")} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 rounded-md cursor-pointer">
                      <FileCheck size={14} />
                      سند مطالبة
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem onClick={() => exportPDF(row)} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 rounded-md cursor-pointer">
                      <FileDown size={14} />
                      {t("download_pdf")}
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => exportExcel(row)} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 rounded-md cursor-pointer">
                      <FileSpreadsheet size={14} />
                      {t("download_excel")}
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 rounded-md">
                      <Mail size={14} />
                      {t("send_email")}
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedRow(row);
                        setWhatsAppOpen(true);
                      }}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 rounded-md"
                    >
                      <MessageCircle size={14} />
                      {t("send_whatsapp")}
                    </DropdownMenuItem>

                    {taxSetting == "SecondStage" && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={async () => {
                            await sendInvoiceSell({ invoiceId: row.id });
                          }}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 rounded-md"
                        >
                          <RefreshCw size={14} />
                          إعادة الإرسال للهيئة
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            />
          </DataTable>
        </CardContent>
        {/* <CardFooter>
          <p>Card Footer</p>
        </CardFooter> */}
      </Card>
      <SendWhatsAppDialog open={whatsAppOpen} onOpenChange={setWhatsAppOpen} defaultPhone={""} phoneNumberId={phoneNumberId} onSend={handleSendWhatsApp} />
      {/* <SendWhatsAppDialog
        open={whatsAppOpen}
        onOpenChange={setWhatsAppOpen}
        defaultPhone={""}
        phoneNumberId={phoneNumberId}
        onSend={async (phone) => {
          await sendWhatsAppTemplate({
            data: {
              messaging_product: "whatsapp",
              to: phone,
              type: "template",
              template: { name: "hello_world", language: { code: "en_US" } },
            },
            phoneNumberId,
          });
        }}
      /> */}
    </div>
  );
}
