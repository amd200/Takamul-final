import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FileText, Search, Edit2, Trash2, ArrowRight, ArrowLeft, Download, Printer, Menu, LayoutGrid, ShoppingCart, ArrowUp, ArrowDown, PlusCircle, DollarSign, FileSpreadsheet, Mail, Filter, MoreHorizontal, RotateCcw, Warehouse, FileCheck, FileDown, MessageCircle, UserCog, Eye } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useGetAllSales } from "../features/sales/hooks/useGetAllSales";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type DataTableFilterMeta, type DataTablePageEvent } from "primereact/datatable";
import { Column } from "primereact/column";
import type { SalesOrder } from "@/features/sales/types/sales.types";
import formatDate from "@/lib/formatDate";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useGetAllSalesReturns } from "@/features/salesReturns/hooks/useGetAllSalesReturns";
import { format } from "@/constants/data";
export default function SalesReturn() {
  type Payment = SalesOrder["payments"][number];
  const { t, direction } = useLanguage();
  const navigate = useNavigate();
  const [entriesPerPage, setEntriesPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const { data: salesReturnOrders } = useGetAllSalesReturns({ page: currentPage, limit: entriesPerPage, searchTerm: globalFilterValue });

  const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setGlobalFilterValue(value);
    console.log(value);
    setCurrentPage(1);
  };
  const renderHeader = () => {
    return (
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <Input type="text" value={globalFilterValue} onChange={onGlobalFilterChange} placeholder={t("search_placeholder")} className=" pr-11 " />
        </div>
      </div>
    );
  };
  const header = useMemo(() => renderHeader(), [globalFilterValue, t]);
  const statusBodyTemplate = (rowData) => {
    const isActive = rowData?.returnStatus == "Approved";

    return <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${isActive ? `text-[#09ad95] bg-[#00e6821a]` : `text-[#b40b09] bg-[#f50b0b1a]`}`}>{isActive ? "مؤكدة" : "غير مؤكدة"}</span>;
  };
  return (
    <div className="space-y-4 pb-12" dir={direction}>
      <Card>
        <CardHeader className="">
          <CardTitle>مرتجعات المبيعات</CardTitle>
          {/* <CardAction>
            <Button size="xl" variant={"default"} asChild>
              <Link to={"/sales/create"}>{t("add_sales_invoice")}</Link>
            </Button>
          </CardAction> */}
        </CardHeader>
        <CardContent>
          {/* <DataTable
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
          > */}
          <DataTable
            value={salesReturnOrders?.items || []}
            lazy
            paginator
            rows={entriesPerPage}
            first={(currentPage - 1) * entriesPerPage}
            totalRecords={salesReturnOrders?.totalCount || 0}
            onPage={(e: DataTablePageEvent) => {
              if (e.page === undefined) return;
              setCurrentPage(e.page + 1);
              setEntriesPerPage(e.rows);
            }}
            loading={!salesReturnOrders?.items}
            header={header}
            responsiveLayout="stack"
            className="custom-green-table custom-compact-table"
            dataKey="id"
            stripedRows={false}
          >
            <Column header={"رقم الفاتورة"} sortable field="salesOrderNumber" />
            <Column header={"رقم المرتجع"} sortable field="returnNumber" />
            <Column header={t("date")} sortable field="returnDate" body={(row) => formatDate(row.returnDate)} />
            <Column header={t("customer_name")} sortable field="customerName" />
            <Column header={t("invoice_status")} sortable body={(rawData) => statusBodyTemplate(rawData)} field="returnStatus" />
            <Column header={t("total_amount")} sortable field="grandTotal" body={(row) => format(row.grandTotal)} />
            <Column header={"المبلغ المرتجع"} sortable field="refundedAmount" body={(row) => format(row.refundedAmount)} />
            {/* <Column header={t("remaining_amount")} sortable field="" /> */}
            <Column
              header={t("actions")}
              body={(row) => (
                <div className="flex gap-2">
                  <Link to={`/sales/return/view/${row?.id}`} className="btn-minimal-action btn-compact-action">
                    <Eye size={16} />
                  </Link>
                </div>
              )}
            />
          </DataTable>
        </CardContent>
      </Card>
    </div>
  );
}
