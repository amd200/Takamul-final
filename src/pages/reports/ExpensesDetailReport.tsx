import React, { useState, useMemo } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, RotateCcw, FileText, Printer, FileSpreadsheet, Wallet } from "lucide-react";
import { useGetExpensesReport } from "@/features/reports/hooks/Usegetexpensesreport";
import { FinancialStatCard } from "@/components/FinancialStatCard";
import { useGetAllTreasurys } from "@/features/treasurys/hooks/useGetAllTreasurys";
import { useGetAllBranches } from "@/features/Branches/hooks/Usegetallbranches";
import { useGetItems } from "@/features/items/hooks/useGetItems";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuthStore } from "@/store/authStore";
import { Permissions } from "@/lib/permissions";
import { format } from "date-fns";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Calendar as CalendarIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { exportCustomPDF, printCustomHTML, generateReportHTML, exportToExcel } from "@/utils/customExportUtils";

interface FilterState {
  branchId: string;
  itemId: string;
  treasuryId: string;
  from: string;
  to: string;
}

export default function ExpensesDetailReport() {
  const { t, direction } = useLanguage();
  const [pdfLoading, setPdfLoading] = useState(false);

  const initialFilters: FilterState = {
    branchId: " ",
    itemId: "",
    treasuryId: "",
    from: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() - 30).toLocaleDateString('en-CA'),
    to: new Date().toLocaleDateString('en-CA'),
  };

  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [isSearched, setIsSearched] = useState(false);
  const [searchParams, setSearchParams] = useState<FilterState>(initialFilters);

  const { data: branches = [] } = useGetAllBranches();
  const { data: treasuries = [] } = useGetAllTreasurys();
  const { data: itemsRes } = useGetItems();

  const itemsList = useMemo(() => {
    const data = Array.isArray(itemsRes) ? itemsRes : itemsRes?.items || [];
    return data.map((item: any) => ({
      label: direction === "rtl" ? item.nameAr || item.name : item.nameEn || item.name,
      value: String(item.id),
    }));
  }, [itemsRes, direction]);

  const {
    data: expensesResponse,
    isLoading: expensesLoading,
    isFetching: expensesFetching,
  } = useGetExpensesReport({
    branchid: searchParams.branchId.trim() || undefined,
    TreasuryId: searchParams.treasuryId.trim() || undefined,
    ItemId: searchParams.itemId.trim() || undefined,
    FromDate: searchParams.from,
    ToDate: searchParams.to,
    enabled: isSearched,
  });

  const handleSearch = () => {
    setIsSearched(true);
    setSearchParams(filters);
  };

  const handleClear = () => {
    setIsSearched(false);
    setFilters(initialFilters);
    setSearchParams(initialFilters);
  };

  const formatNumber = (value?: number) => Number(value ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-GB");
  };

  const hasAnyPermission = useAuthStore((state) => state.hasAnyPermission);
  const title = t("expenses_report", "تقرير المصروفات");

  const getExportData = () => {
    const branchName = branches.find((b) => String(b.id) === searchParams.branchId.trim())?.name || t("all", "الكل");
    const treasuryName = treasuries.find((b) => String(b.id) === searchParams.treasuryId.trim())?.name || t("all", "الكل");
    const itemLabel = itemsList.find((i) => i.value === searchParams.itemId.trim())?.label || t("all", "الكل");
    
    const filtersInfo = [
      `${t("branch", "الفرع")}: ${branchName}`,
      `${t("item", "البند")}: ${itemLabel}`,
      `${t("treasury", "الخزينة")}: ${treasuryName}`,
      `${t("from", "من")}: ${searchParams.from}`,
      `${t("to", "إلى")}: ${searchParams.to}`
    ].join(" | ");

    const summaryCards = [
      { title: t("total_expenses", "إجمالي المصروفات"), value: formatNumber(expensesResponse?.totalAmount), color: "orange" },
      { title: t("operation_count", "عدد العمليات"), value: String(expensesResponse?.totalCount ?? 0), color: "blue" },
    ];

    const columns = [
      { header: "م", field: "serial" },
      { header: t("operation_date", "تاريخ العملية"), field: "date", body: (r: any) => formatDate(r.date) },
      { header: t("treasury", "الخزينة"), field: "treasuryName" },
      { header: t("amount", "المبلغ"), field: "amount", body: (r: any) => formatNumber(r.amount) },
      { header: t("item", "البند"), field: "itemName" },
      { header: t("statement", "البيان"), field: "notes" },
    ];

    return { filtersInfo, summaryCards, columns };
  };

  const handlePrint = () => {
    const { filtersInfo, summaryCards, columns } = getExportData();
    const html = generateReportHTML(title, filtersInfo, summaryCards, columns, expensesResponse?.data || [], t, direction);
    printCustomHTML(title, html);
  };

  const handlePDF = async () => {
    setPdfLoading(true);
    try {
      const { filtersInfo, summaryCards, columns } = getExportData();
      const html = generateReportHTML(title, filtersInfo, summaryCards, columns, expensesResponse?.data || [], t, direction);
      await exportCustomPDF(title, html);
    } finally {
      setPdfLoading(false);
    }
  };

  const handleExcel = () => {
    const { columns } = getExportData();
    exportToExcel(expensesResponse?.data || [], columns, title);
  };

  return (
    <div dir={direction} className="space-y-4">
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wallet size={20} className="text-[var(--primary)]" />
              {title}
            </CardTitle>
          </div>
          <div className="flex items-center gap-4 text-sm font-medium">
            <button onClick={handlePrint} className="flex items-center gap-1.5 hover:text-[var(--primary)] transition-colors text-slate-600 dark:text-slate-400">
              <Printer size={16} /> <span className="hidden sm:inline">{t("print", "طباعة")}</span>
            </button>
            <button onClick={handlePDF} disabled={pdfLoading} className="flex items-center gap-1.5 hover:text-[var(--primary)] transition-colors text-slate-600 dark:text-slate-400 disabled:opacity-50">
              <FileText size={16} /> <span className="hidden sm:inline">PDF</span>
            </button>
            <button onClick={handleExcel} className="flex items-center gap-1.5 hover:text-[var(--primary)] transition-colors text-slate-600 dark:text-slate-400">
              <FileSpreadsheet size={16} /> <span className="hidden sm:inline">Excel</span>
            </button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <FinancialStatCard
              title={t("total_expenses", "إجمالي المصروفات")}
              value={formatNumber(expensesResponse?.totalAmount)}
              suffix="SAR"
              icon={Wallet}
              color="orange"
            />
            <FinancialStatCard
              title={t("operation_count", "عدد العمليات")}
              value={expensesResponse?.totalCount ?? 0}
              icon={FileText}
              color="blue"
            />
          </div>
          {/* Filters Card */}
          <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-transparent p-4 md:p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
              {hasAnyPermission([Permissions?.branches?.all, Permissions?.branches?.view]) && (
                <div className="space-y-2 lg:col-span-1 ">
                  <Label className=" text-xs font-medium text-text-main">{t("branch", "الفرع")}</Label>
                  <Select value={filters.branchId} onValueChange={(val) => setFilters((p) => ({ ...p, branchId: val }))}>
                    <SelectTrigger className="w-full h-10 border-slate-200 dark:border-slate-800 text-sm">
                      <SelectValue placeholder={t("select_branch", "الكل")} />
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

              <div className="lg:col-span-1">
                <Label className="mb-2 text-xs font-medium text-text-main">{t("item", "البند")}</Label>
                <Select value={filters.itemId} onValueChange={(val) => setFilters((p) => ({ ...p, itemId: val }))}>
                  <SelectTrigger className="w-full h-10 border-slate-200 dark:border-slate-800 text-sm">
                    <SelectValue placeholder={t("select_item", "اختر البند")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=" ">{t("all", "الكل")}</SelectItem>
                    {itemsList.map((b) => (
                      <SelectItem key={String(b.value)} value={String(b.value)}>
                        {b.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className=" lg:col-span-1">
                <Label className="mb-2 text-xs font-medium text-text-main">{t("treasury", "الخزينة")}</Label>
                <Select value={filters.treasuryId} onValueChange={(val) => setFilters((p) => ({ ...p, treasuryId: val }))}>
                  <SelectTrigger className="w-full h-10 border-slate-200 dark:border-slate-800 text-sm">
                    <SelectValue placeholder={t("select_treasury", "اختر الخزينة")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=" ">{t("all", "الكل")}</SelectItem>
                    {treasuries.map((b) => (
                      <SelectItem key={String(b.id)} value={String(b.id)}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium text-text-main">{t("from_date", "تاريخ البداية")}</Label>
                <div className="relative flex items-center border border-input rounded-md bg-background">
                  <DatePicker
                    selected={filters.from ? new Date(filters.from.replace(/-/g, '/')) : null}
                    onChange={(date) => setFilters((p) => ({ ...p, from: date ? format(date, "yyyy-MM-dd") : "" }))}
                    dateFormat="dd/MM/yyyy"
                    placeholderText={t("select_date", "يوم/شهر/سنة")}
                    popperPlacement="bottom-start"
                    portalId="root-portal"
                    customInput={
                      <div className="flex items-center gap-2 cursor-pointer px-3 h-10 w-full">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-sm">{filters.from ? format(new Date(filters.from.replace(/-/g, '/')), "dd/MM/yyyy") : t("select_date", "يوم/شهر/سنة")}</span>
                      </div>
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium text-text-main">{t("to_date", "تاريخ النهاية")}</Label>
                <div className="relative flex items-center border border-input rounded-md bg-background">
                  <DatePicker
                    selected={filters.to ? new Date(filters.to.replace(/-/g, '/')) : null}
                    onChange={(date) => setFilters((p) => ({ ...p, to: date ? format(date, "yyyy-MM-dd") : "" }))}
                    dateFormat="dd/MM/yyyy"
                    placeholderText={t("select_date", "يوم/شهر/سنة")}
                    popperPlacement="bottom-start"
                    portalId="root-portal"
                    customInput={
                      <div className="flex items-center gap-2 cursor-pointer px-3 h-10 w-full">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-sm">{filters.to ? format(new Date(filters.to.replace(/-/g, '/')), "dd/MM/yyyy") : t("select_date", "يوم/شهر/سنة")}</span>
                      </div>
                    }
                  />
                </div>
              </div>
              <div className="flex flex-row items-end gap-2 mb-2 lg:col-span-1">
                <Button onClick={handleSearch} disabled={expensesLoading || expensesFetching} className="flex-1 h-9 px-4 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white gap-2 rounded-lg shadow-sm font-bold">
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
            <DataTable value={expensesResponse?.data ?? []} paginator rows={10} loading={expensesLoading || expensesFetching} className="custom-green-table custom-compact-table" emptyMessage={!isSearched ? t("click_search_to_view", "اضغط على زر البحث لعرض البيانات") : t("no_data", "لا توجد بيانات")} responsiveLayout="stack">
              <Column header="م" body={(_, opt) => opt.rowIndex + 1} />
              <Column header={t("operation_date", "تاريخ العملية")} body={(r) => <span className="text-sm">{formatDate(r.date)}</span>} sortable />
              <Column field="treasuryName" header={t("treasury", "الخزينة")} sortable />
              <Column field="amount" header={t("amount", "المبلغ")} sortable body={(r) => <span className="text-sm font-bold text-red-500">{formatNumber(r.amount)}</span>} />
              <Column field="itemName" header={t("item", "البند")} sortable body={(r) => <span className="text-[var(--primary)] font-medium">{r.itemName || "-"}</span>} />
              <Column field="notes" header={t("statement", "البيان")} />
            </DataTable>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
