import React, { useState, useMemo } from "react";
import { PackageSearch, RotateCcw, Search, Printer, FileText, FileSpreadsheet, TrendingUp, Receipt, DollarSign, LineChart } from "lucide-react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/context/LanguageContext";
import { useGetAllBranches } from "@/features/Branches/hooks/Usegetallbranches";
import { useGetInventoryStock } from "@/features/reports/hooks/Usegetinventorystock";
import { FinancialStatCard } from "@/components/FinancialStatCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuthStore } from "@/store/authStore";
import { Permissions } from "@/lib/permissions";
import { format } from "date-fns";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Calendar as CalendarIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  generateReportHTML,
  printCustomHTML,
  exportCustomPDF,
  exportToExcel
} from "@/utils/customExportUtils";

type FilterState = { branchId: string; from: string; to: string };

export default function StockBalanceReport() {
  const { t, direction } = useLanguage();
  const [pdfLoading, setPdfLoading] = useState(false);

  const [filters, setFilters] = useState<FilterState>(() => {
    const now = new Date();
    return {
      branchId: " ",
      from: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30).toLocaleDateString('en-CA'),
      to: now.toLocaleDateString('en-CA'),
    };
  });

  const [isSearched, setIsSearched] = useState(false);
  const [searchParams, setSearchParams] = useState<FilterState>(filters);

  const {
    data: rawReportData,
    isLoading,
    isFetching,
  } = useGetInventoryStock({
    branchid: searchParams.branchId.trim() || undefined,
    from: searchParams.from,
    to: searchParams.to,
    enabled: isSearched,
  });

  const reportData = isSearched ? (rawReportData ?? []) : [];

  const { data: branches = [] } = useGetAllBranches();

  const handleSearch = () => {
    setIsSearched(true);
    setSearchParams(filters);
  };

  const handleClear = () => {
    setIsSearched(false);
    const now = new Date();
    const reset: FilterState = {
      branchId: " ",
      from: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30).toLocaleDateString('en-CA'),
      to: now.toLocaleDateString('en-CA'),
    };
    setFilters(reset);
    setSearchParams(reset);
  };

  const formatNumber = (value?: number) => Number(value ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const totalCostValue = useMemo(() => reportData?.reduce((s, r) => s + (r.totalCostValue || 0), 0) ?? 0, [reportData]);
  const totalSaleValue = useMemo(() => reportData?.reduce((s, r) => s + (r.totalSaleValue || 0), 0) ?? 0, [reportData]);

  const title = t("inventory_report", "تقرير جرد الأصناف");

  const getFiltersInfo = () => {
    const b = branches.find(x => String(x.id) === searchParams.branchId.trim());
    return [
      `${t("branch", "الفرع")}: ${b ? b.name : t("all", "الكل")}`,
      `${t("from", "من")}: ${searchParams.from}`,
      `${t("to", "إلى")}: ${searchParams.to}`
    ].join(" | ");
  };

  const exportColumns = [
    { header: t("serial", "م"), field: "serial" },
    { header: t("item_name", "اسم الصنف"), field: "productName" },
    { header: t("unit", "وحدة"), field: "unitName" },
    { header: t("cost", "تكلفة"), field: "costPrice", body: (r: any) => formatNumber(r.costPrice) },
    { header: t("price", "السعر"), field: "salePrice", body: (r: any) => formatNumber(r.salePrice) },
    { header: t("quantity", "كمية"), field: "currentQty", body: (r: any) => formatNumber(r.currentQty) },
    { header: t("total_cost", "إجمالي التكلفة"), field: "totalCostValue", body: (r: any) => formatNumber(r.totalCostValue) },
    { header: t("total_selling_price", "إجمالي سعر البيع"), field: "totalSaleValue", body: (r: any) => formatNumber(r.totalSaleValue) },
  ];

  const handleExportPDF = async () => {
    if (!reportData.length) return;
    setPdfLoading(true);
    try {
      const html = generateReportHTML(
        title,
        getFiltersInfo(),
        [
          { title: t("total_cost"), value: `${formatNumber(totalCostValue)} ${t('sar', 'ر.س')}`, color: "orange" },
          { title: t("total_selling_price"), value: `${formatNumber(totalSaleValue)} ${t('sar', 'ر.س')}`, color: "blue" },
        ],
        exportColumns,
        reportData,
        t,
        direction
      );
      await exportCustomPDF(title, html);
    } finally {
      setPdfLoading(false);
    }
  };

  const handlePrint = () => {
    if (!reportData.length) return;
    const html = generateReportHTML(
      title,
      getFiltersInfo(),
      [
        { title: t("total_cost"), value: `${formatNumber(totalCostValue)} ${t('sar', 'ر.س')}`, color: "orange" },
        { title: t("total_selling_price"), value: `${formatNumber(totalSaleValue)} ${t('sar', 'ر.س')}`, color: "blue" },
      ],
      exportColumns,
      reportData,
      t,
      direction
    );
    printCustomHTML(title, html);
  };

  const handleExportExcel = () => {
    if (!reportData.length) return;
    exportToExcel(reportData, exportColumns, title);
  };

  const hasAnyPermission = useAuthStore((state) => state.hasAnyPermission);

  return (
    <div dir={direction} className="space-y-4">
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <PackageSearch size={20} className="text-[var(--primary)]" />
              {title}
            </CardTitle>
          </div>
          <div className="flex items-center gap-4 text-sm font-medium">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 hover:text-[var(--primary)] transition-colors text-slate-600 dark:text-slate-400"
            >
              <Printer size={16} />
              <span className="hidden sm:inline">{t("print", "طباعة")}</span>
            </button>
            <button
              onClick={handleExportPDF}
              disabled={pdfLoading}
              className="flex items-center gap-1.5 hover:text-[var(--primary)] transition-colors text-slate-600 dark:text-slate-400 disabled:opacity-50"
            >
              <FileText size={16} />
              <span className="hidden sm:inline">PDF</span>
            </button>
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 hover:text-[var(--primary)] transition-colors text-slate-600 dark:text-slate-400"
            >
              <FileSpreadsheet size={16} />
              <span className="hidden sm:inline">Excel</span>
            </button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <FinancialStatCard
              title={t("total_cost", "إجمالي التكلفة")}
              value={formatNumber(totalCostValue)}
              suffix="SAR"
              icon={LineChart}
              color="orange"
            />
            <FinancialStatCard
              title={t("total_selling_price", "إجمالي سعر البيع")}
              value={formatNumber(totalSaleValue)}
              suffix="SAR"
              icon={DollarSign}
              color="blue"
            />
          </div>
          {/* Filters Card */}
          <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-transparent p-4 md:p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4 items-end">
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
              <div className="space-y-2">
                <Label className="text-xs font-medium text-text-main">{t("from_date", "تاريخ البداية")}</Label>
                <div className="relative flex items-center border border-input rounded-md bg-background">
                  <DatePicker
                    selected={filters.from ? new Date(filters.from.replace(/-/g, '/')) : null}
                    onChange={(date) => setFilters((p) => ({ ...p, from: date ? date.toLocaleDateString('en-CA') : "" }))}
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
                    onChange={(date) => setFilters((p) => ({ ...p, to: date ? date.toLocaleDateString('en-CA') : "" }))}
                    dateFormat="dd/MM/yyyy"
                    placeholderText={t("select_date", "يوم/شهر/سنة")}
                    popperPlacement="bottom-start"
                    portalId="root-portal"
                    customInput={
                      <div className="flex items-center gap-2 cursor-pointer px-3 h-10 w-full">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-sm">
                          {filters.to ? format(new Date(filters.to.replace(/-/g, '/')), "dd/MM/yyyy") : t("select_date", "يوم/شهر/سنة")}
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
              value={reportData || []}
              loading={isLoading || isFetching}
              paginator rows={10}
              dataKey="productId"
              className="custom-green-table custom-compact-table"
              emptyMessage={!isSearched ? t("click_search_to_view", "اضغط على زر البحث لعرض البيانات") : t("no_data", "لا توجد بيانات")}
              responsiveLayout="stack"
            >
              <Column
                header={t("serial", "م")}
                body={(_, opt) => <span className="text-sm font-semibold">{opt.rowIndex + 1}</span>}
                className="w-16"
              />
              <Column field="productName" header={t("item_name", "اسم الصنف")} sortable body={(r) => <span className="text-sm font-bold text-[var(--text-main)]">{r.productName}</span>} />
              <Column field="unitName" header={t("unit", "وحدة")} sortable body={(r) => <span className="text-sm">{r.unitName}</span>} />
              <Column field="costPrice" header={t("cost", "تكلفة")} sortable body={(r) => <span className="text-sm whitespace-nowrap">{formatNumber(r.costPrice)}</span>} />
              <Column field="salePrice" header={t("price", "السعر")} sortable body={(r) => <span className="text-sm whitespace-nowrap">{formatNumber(r.salePrice)}</span>} />
              <Column field="currentQty" header={t("quantity", "كمية")} sortable body={(r) => <span className="text-sm whitespace-nowrap font-medium">{formatNumber(r.currentQty)}</span>} />
              <Column field="totalCostValue" header={t("total_cost", "إجمالي التكلفة")} sortable body={(r) => <span className="text-sm font-bold text-[var(--primary)] whitespace-nowrap">{formatNumber(r.totalCostValue)}</span>} />
              <Column field="totalSaleValue" header={t("total_selling_price", "إجمالي سعر البيع")} sortable body={(r) => <span className="text-sm font-bold text-[var(--primary)] whitespace-nowrap">{formatNumber(r.totalSaleValue)}</span>} />
            </DataTable>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
