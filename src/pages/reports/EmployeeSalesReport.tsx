import React, { useState, useMemo } from "react";
import { Search, RotateCcw, Calendar as CalendarIcon, Printer, FileText, FileSpreadsheet, User, BarChart2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DataTable, type DataTablePageEvent } from "primereact/datatable";
import { Column } from "primereact/column";
import formatDate from "@/lib/formatDate";
import { useGetEmployeeSalesReport } from "@/features/reports/hooks/Usegetemployeesalesreport";
import { useGetAllEmployees } from "@/features/employees/hooks/useGetAllEmployees";
import { useGetAllBranches } from "@/features/Branches/hooks/Usegetallbranches";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { Permissions } from "@/lib/permissions";
import { format } from "date-fns";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  generateReportHTML,
  printCustomHTML,
  exportCustomPDF,
  exportToExcel
} from "@/utils/customExportUtils";
import { useSettingsStore } from "@/features/settings/store/settingsStore";

export default function EmployeeSalesReport() {
  const { t, direction, language } = useLanguage();
  const taxSetting = useSettingsStore((state) => state.settings?.taxSetting?.taxSetting);
  const isExempt = taxSetting === "Exempt";
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [pdfLoading, setPdfLoading] = useState(false);

  const [filters, setFilters] = useState({
    employeeId: "all",
    branchId: " ",
    from: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split("T")[0],
    to: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split("T")[0],
  });

  const [searchParams, setSearchParams] = useState(filters);

  const { data: reportData, isLoading, isFetching } = useGetEmployeeSalesReport({
    Page: currentPage,
    PageSize: entriesPerPage,
    EmployeeId: searchParams.employeeId === "all" ? undefined : searchParams.employeeId,
    BranchId: searchParams.branchId.trim() === "" ? undefined : searchParams.branchId,
    From: searchParams.from,
    To: searchParams.to,
  });

  const { data: employeesData } = useGetAllEmployees({ page: 1, limit: 1000 });
  const employees = employeesData?.items || [];

  const { data: branches = [] } = useGetAllBranches();
  const hasAnyPermission = useAuthStore((state) => state.hasAnyPermission);

  const orders = reportData?.items || [];
  const totalCount = reportData?.totalCount || 0;

  const fmt = (n: number) => (n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleSearch = () => {
    setCurrentPage(1);
    setSearchParams(filters);
  };

  const handleClear = () => {
    const reset = {
      employeeId: "all",
      branchId: "all",
      from: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split("T")[0],
      to: new Date().toISOString().split("T")[0],
    };
    setFilters(reset);
    setSearchParams(reset);
    setCurrentPage(1);
  };

  const reportTitle = t("employee_sales_report", "تقرير مبيعات الموظف");

  const getFiltersInfo = () => {
    const employeeName = employees.find(e => String(e.id) === searchParams.employeeId)?.firstName || t("all", "الكل");
    const branchName = branches.find((b) => String(b.id) === searchParams.branchId.trim())?.name || t("all", "الكل");
    return `${t("employee", "الموظف")}: ${employeeName} | ${t("branch", "الفرع")}: ${branchName} | ${t("from", "من")}: ${searchParams.from} | ${t("to", "إلى")}: ${searchParams.to}`;
  };

  const handlePrint = () => {
    const columns = [
      { header: t("serial", "م"), field: "serial" },
      { header: t("employee_name", "اسم الموظف"), field: "employeeName" },
      { header: t("order_number", "رقم الطلب"), field: "orderNumber" },
      { header: t("date", "التاريخ"), field: "orderDate" },
      { header: t("customer_name", "اسم العميل"), field: "customerName" },
      { header: t("total_amount", "الإجمالي"), field: "grandTotal" },
      { header: t("order_status", "حالة الطلب"), field: "orderStatus" },
      { header: t("payment_status", "حالة الدفع"), field: "paymentStatus" },
    ];

    const data = orders.map((o, idx) => ({
      ...o,
      serial: idx + 1,
      orderDate: new Date(o.orderDate).toLocaleDateString(language === "ar" ? "ar-EG" : "en-GB"),
      grandTotal: fmt(o.grandTotal),
    }));

    const html = generateReportHTML(reportTitle, getFiltersInfo(), [], columns, data, t, direction);
    printCustomHTML(reportTitle, html);
  };

  const handleExportPDF = async () => {
    setPdfLoading(true);
    try {
      const columns = [
        { header: t("serial", "م"), field: "serial" },
        { header: t("employee_name", "اسم الموظف"), field: "employeeName" },
        { header: t("order_number", "رقم الطلب"), field: "orderNumber" },
        { header: t("date", "التاريخ"), field: "orderDate" },
        { header: t("total_amount", "الإجمالي"), field: "grandTotal" },
      ];

      const data = orders.map((o, idx) => ({
        ...o,
        serial: idx + 1,
        orderDate: new Date(o.orderDate).toLocaleDateString(language === "ar" ? "ar-EG" : "en-GB"),
        grandTotal: fmt(o.grandTotal),
      }));

      const html = generateReportHTML(reportTitle, getFiltersInfo(), [], columns, data, t, direction);
      await exportCustomPDF(reportTitle, html);
    } finally {
      setPdfLoading(false);
    }
  };

  const handleExportExcel = () => {
    const columns = [
      { header: t("serial", "م"), field: "serial" },
      { header: t("employee_name", "اسم الموظف"), field: "employeeName" },
      { header: t("order_number", "رقم الطلب"), field: "orderNumber" },
      { header: t("date", "التاريخ"), field: "orderDate", body: (o: any) => new Date(o.orderDate).toLocaleDateString(language === "ar" ? "ar-EG" : "en-GB") },
      { header: t("customer_name", "اسم العميل"), field: "customerName" },
      { header: t("total_amount", "الإجمالي"), field: "grandTotal" },
      { header: t("order_status", "حالة الطلب"), field: "orderStatus" },
      { header: t("payment_status", "حالة الدفع"), field: "paymentStatus" },
    ];
    exportToExcel(orders, columns, reportTitle);
  };

  return (
    <div className="space-y-6 pb-12" dir={direction}>
      <Card className="border-none shadow-sm overflow-hidden bg-white dark:bg-slate-950">
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
          <div>
            <CardTitle className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <User className="w-5 h-5 text-[#22c55e]" />
              {reportTitle}
            </CardTitle>
            <CardDescription className="mt-1">
              {t("customize_report_below", "تخصيص التقرير أدناه")}
            </CardDescription>
          </div>

          <div className="flex items-center gap-4 text-sm font-medium">
            <button onClick={handlePrint} className="flex items-center gap-1.5 hover:text-[#22c55e] transition-colors text-slate-600 dark:text-slate-400">
              <Printer size={16} />
              <span className="hidden sm:inline">{t("print", "طباعة")}</span>
            </button>
            <button onClick={handleExportPDF} disabled={pdfLoading} className="flex items-center gap-1.5 hover:text-[#22c55e] transition-colors text-slate-600 dark:text-slate-400 disabled:opacity-50">
              <FileText size={16} />
              <span className="hidden sm:inline">{pdfLoading ? t("loading", "جاري التحميل...") : "PDF"}</span>
            </button>
            <button onClick={handleExportExcel} className="flex items-center gap-1.5 hover:text-[#22c55e] transition-colors text-slate-600 dark:text-slate-400">
              <FileSpreadsheet size={16} />
              <span className="hidden sm:inline">Excel</span>
            </button>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-transparent p-4 md:p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
           
              {hasAnyPermission([Permissions?.branches?.all, Permissions?.branches?.view]) && (
                <div className="space-y-2 lg:col-span-1">
                  <Label className="text-xs font-medium text-text-main">{t("branch", "الفرع")}</Label>
                  <Select value={filters.branchId} onValueChange={(val) => setFilters((p) => ({ ...p, branchId: val }))}>
                    <SelectTrigger className="w-full h-10 border-slate-200 dark:border-slate-800 text-sm">
                      <SelectValue placeholder={t("select_branch", "اختر الفرع")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=" ">{t("all", "الكل")}</SelectItem>
                      {branches.map((b) => (
                        <SelectItem key={b.id} value={String(b.id)}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
                 <div className="space-y-2 lg:col-span-1">
                <Label className="text-xs font-medium text-text-main">{t("employee", "الموظف")}</Label>
                <Select value={filters.employeeId} onValueChange={(val) => setFilters((p) => ({ ...p, employeeId: val }))}>
                  <SelectTrigger className="w-full h-10 border-slate-200 dark:border-slate-800 text-sm">
                    <SelectValue placeholder={t("select_employee", "اختر الموظف")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("all", "الكل")}</SelectItem>
                    {employees.map((e) => (
                      <SelectItem key={e.id} value={String(e.id)}>
                        {`${e.firstName} ${e.lastName || ""}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>


              <div className="space-y-2">
                <Label className="text-xs font-medium text-text-main">{t("from_date", "تاريخ البداية")}</Label>
                <div className="relative flex items-center border border-input rounded-md bg-background">
                  <DatePicker
                    selected={filters.from ? new Date(filters.from) : null}
                    onChange={(date) => setFilters((p) => ({ ...p, from: date ? format(date, "yyyy-MM-dd") : "" }))}
                    dateFormat="dd/MM/yyyy"
                    placeholderText={t("select_date", "يوم/شهر/سنة")}
                    popperPlacement="bottom-start"
                    portalId="root-portal"
                    customInput={
                      <div className="flex items-center gap-2 cursor-pointer px-3 h-10 w-full">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-sm">{filters.from ? format(new Date(filters.from), "dd/MM/yyyy") : t("select_date", "يوم/شهر/سنة")}</span>
                      </div>
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium text-text-main">{t("to_date", "تاريخ النهاية")}</Label>
                <div className="relative flex items-center border border-input rounded-md bg-background">
                  <DatePicker
                    selected={filters.to ? new Date(filters.to) : null}
                    onChange={(date) => setFilters((p) => ({ ...p, to: date ? format(date, "yyyy-MM-dd") : "" }))}
                    dateFormat="dd/MM/yyyy"
                    placeholderText={t("select_date", "يوم/شهر/سنة")}
                    popperPlacement="bottom-start"
                    portalId="root-portal"
                    customInput={
                      <div className="flex items-center gap-2 cursor-pointer px-3 h-10 w-full">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-sm">
                          {filters.to ? format(new Date(filters.to), "dd/MM/yyyy") : t("select_date", "يوم/شهر/سنة")}
                        </span>
                      </div>
                    }
                  />
                </div>
              </div>

              <div className="flex flex-row items-end gap-2 mb-2 lg:col-span-1">
                <Button onClick={handleSearch} disabled={isLoading || isFetching} className="flex-1 h-9 px-4 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white gap-2 rounded-lg shadow-sm font-bold">
                  <Search size={16} />
                  {t("search", "بحث")}
                </Button>
                <Button onClick={handleClear} variant="outline" className="h-9 px-3 gap-1 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                  <RotateCcw size={15} className="text-[var(--primary)]" />
                </Button>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-100 dark:border-slate-800 overflow-hidden">
            <DataTable
              value={orders}
              lazy
              paginator
              paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
              rows={entriesPerPage}
              first={(currentPage - 1) * entriesPerPage}
              totalRecords={totalCount}
              onPage={(e: DataTablePageEvent) => {
                if (e.page === undefined) return;
                setCurrentPage(e.page + 1);
                setEntriesPerPage(e.rows ?? entriesPerPage);
              }}
              loading={isLoading || isFetching}
              responsiveLayout="scroll"
              className="custom-green-table text-[10px] sm:text-[11px]"
              dataKey="orderNumber"
              emptyMessage={t("no_data", "لا توجد بيانات")}
              stripedRows={false}
            >
              <Column header={t("serial", "م")} body={(_, opt) => opt.rowIndex + 1} className="w-10 px-1 text-center" headerClassName="px-1 text-center" />
              <Column header={t("employee_name", "اسم الموظف")} field="employeeName" body={(row) => <span className="whitespace-nowrap">{row.employeeName}</span>} headerClassName="whitespace-nowrap px-2" className="px-2" />
              <Column header={t("order_number", "رقم الفاتورة")} field="orderNumber" body={(row) => <span className="font-bold text-[#22c55e] whitespace-nowrap">{row.orderNumber}</span>} headerClassName="whitespace-nowrap px-2" className="px-2" />
              <Column header={t("date", "التاريخ")} field="orderDate" body={(row) => <span className="whitespace-nowrap">{formatDate(row.orderDate, "dateOnly")}</span>} headerClassName="whitespace-nowrap px-2" className="px-2" />
              <Column header={t("customer_name", "اسم العميل")} field="customerName" body={(row) => <span className="whitespace-nowrap">{row.customerName}</span>} headerClassName="whitespace-nowrap px-2" className="px-2" />
              {!isExempt && <Column header={t("sub_total", "الإجمالي قبل الضريبة")} field="subTotal" body={(row) => <span className="whitespace-nowrap">{fmt(row.subTotal)}</span>} headerClassName="whitespace-nowrap px-2" className="px-2" />}
              {!isExempt && <Column header={t("tax_amount", "قيمة الضرائب")} field="taxAmount" body={(row) => <span className="whitespace-nowrap">{fmt(row.taxAmount)}</span>} headerClassName="whitespace-nowrap px-2" className="px-2" />}
              <Column header={t("grand_total", "الإجمالي")} field="grandTotal" body={(row) => <span className="font-bold whitespace-nowrap">{fmt(row.grandTotal)}</span>} headerClassName="whitespace-nowrap px-2" className="px-2" />
              <Column header={t("order_status", "حالة الطلب")} field="orderStatus" body={(row) => <span className="whitespace-nowrap">{row.orderStatus}</span>} headerClassName="whitespace-nowrap px-2" className="px-2" />
            </DataTable>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
