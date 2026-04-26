import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FileText, Search, Edit2, Trash2, ArrowRight, ArrowLeft, Download, Printer, Menu, LayoutGrid, ShoppingCart, ArrowUp, ArrowDown, PlusCircle, DollarSign, FileSpreadsheet, Mail, Filter, MoreHorizontal, RotateCcw, Warehouse, FileCheck, FileDown, MessageCircle, UserCog } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { usePrint } from "@/context/PrintContext";
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

export default function A4Sales() {
  type Payment = SalesOrder["payments"][number];
  const { t, direction, language } = useLanguage();
  const { printInvoice, exportPDF, exportExcel, exportCSV } = usePrint();
  const navigate = useNavigate();
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const { data: salesOrders } = useGetAllSales({ page: currentPage, limit: entriesPerPage, OrderType: "A4" });
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  console.log("current language:", language);
  console.log("confirmed translation:", t("confirmed"));
  const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setGlobalFilterValue(value);
    setCurrentPage(1);
  };
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
  const header = useMemo(() => renderHeader(), [globalFilterValue, t]);
  const statusBodyTemplate = useCallback(
    (rowData: SalesOrder) => {
      const isActive = rowData?.orderStatus == "Confirmed";
      return <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${isActive ? "text-[#09ad95] bg-[#00e6821a]" : "text-[#b40b09] bg-[#f50b0b1a]"}`}>{isActive ? t("confirmed") : t("not_confirmed")}</span>;
    },
    [language, t],
  );
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
            <Column header={t("date")} sortable field="orderDate" body={(row) => new Date(row.orderDate).toLocaleDateString("ar-EG")} />
            <Column header={t("customer_name")} sortable field="customerName" />
            <Column header={t("cashier")} sortable field="createdBy" />
            <Column header={t("invoice_status")} sortable body={(rawData) => statusBodyTemplate(rawData)} field="orderStatus" />
            <Column header={t("total_amount")} sortable field="grandTotal" />
            <Column header={t("paid_amount")} sortable field="payments" body={(rowData) => rowData.payments?.reduce((sum: number, p: Payment) => sum + p.amount, 0) ?? 0} />
            {/* <Column header={t("remaining_amount")} sortable field="" /> */}
            <Column
              header={t("actions")}
              body={(row) => (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="btn-minimal-action btn-compact-action">
                      <MoreHorizontal size={18} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52 p-1">
                    <DropdownMenuItem onClick={() => printInvoice(row, 'invoice')} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 rounded-md cursor-pointer">
                      <FileText size={14} />
                      طباعة الفاتورة (A4)
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => printInvoice(row, 'roll')} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 rounded-md cursor-pointer">
                      <Printer size={14} />
                      طباعة الفاتورة (رول)
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem asChild>
                      <Link to={`/sales/return/${row?.id}`} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 rounded-md">
                        <RotateCcw size={14} />
                        إرجاع مبيع
                      </Link>
                    </DropdownMenuItem>

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

                    <DropdownMenuItem onClick={() => exportCSV(row)} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 rounded-md cursor-pointer">
                      <FileSpreadsheet size={14} />
                      {t("download_csv")}
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem onClick={() => {}} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 rounded-md">
                      <Mail size={14} />
                      {t("send_email")}
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => {}} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 rounded-md">
                      <MessageCircle size={14} />
                      {t("send_whatsapp")}
                    </DropdownMenuItem>
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
    </div>
  );
}
