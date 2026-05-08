import React, { useState } from "react";
import { AlertTriangle, RotateCcw, Search, Printer, FileText, FileSpreadsheet } from "lucide-react";
import { DataTable, type DataTablePageEvent } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "@/components/ui/button";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/context/LanguageContext";
import { useGetAllBranches } from "@/features/Branches/hooks/Usegetallbranches";
import { useGetStockAlertsReport } from "@/features/reports/hooks/useGetStockAlertsReport";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/authStore";
import { Permissions } from "@/lib/permissions";
import { FinancialStatCard } from "@/components/FinancialStatCard";
import { generateReportHTML, printCustomHTML, exportCustomPDF, exportToExcel } from "@/utils/customExportUtils";

export default function LowStockReport() {
  const { t, direction } = useLanguage();
  const hasAnyPermission = useAuthStore((state) => state.hasAnyPermission);
  const [pdfLoading, setPdfLoading] = useState(false);

  const [entriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [filters, setFilters] = useState({
    branchId: " ",
  });

  const [submittedFilters, setSubmittedFilters] = useState({
    branchId: " ",
  });
  const [isSearched, setIsSearched] = useState(false);

  const {
    data: rawRows,
    isLoading,
    isFetching,
  } = useGetStockAlertsReport({
    branchId: submittedFilters.branchId.trim() || "",
    enabled: isSearched,
  });

  const rows = isSearched ? (rawRows ?? []) : [];

  const { data: branches = [] } = useGetAllBranches();

  const handleSearch = () => {
    setIsSearched(true);
    setSubmittedFilters(filters);
    setCurrentPage(1);
  };

  const handleClear = () => {
    const resetState = {
      branchId: " ",
    };
    setIsSearched(false);
    setFilters(resetState);
    setSubmittedFilters(resetState);
    setCurrentPage(1);
  };

  const formatNumber = (value?: number) => {
    return Number(value ?? 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const title = t("low_stock_alerts", "تنبيهات المخزون");

  const getFiltersInfo = () => {
    const b = branches.find((x) => String(x.id) === submittedFilters.branchId.trim());
    return `${t("branch", "الفرع")}: ${b ? b.name : t("all", "الكل")}`;
  };

  const exportColumns = [
    { header: t("serial", "م"), field: "serial" },
    { header: t("barcode", "باركود"), field: "barcode" },
    { header: t("item_name", "اسم الصنف"), field: "productName" },
    { header: t("current_quantity", "الكمية الحالية"), field: "currentQty", body: (r: any) => formatNumber(r.currentQty) },
    { header: t("min_stock_level", "حد الطلب"), field: "minStockLevel", body: (r: any) => formatNumber(r.minStockLevel) },
  ];

  const handleExportPDF = async () => {
    if (!rows.length) return;
    setPdfLoading(true);
    try {
      const html = generateReportHTML(title, getFiltersInfo(), [], exportColumns, rows, t, direction);
      await exportCustomPDF(title, html);
    } finally {
      setPdfLoading(false);
    }
  };

  const handlePrint = () => {
    if (!rows.length) return;
    const html = generateReportHTML(title, getFiltersInfo(), [], exportColumns, rows, t, direction);
    printCustomHTML(title, html);
  };

  const handleExportExcel = () => {
    if (!rows.length) return;
    exportToExcel(rows, exportColumns, title);
  };

  return (
    <div dir={direction} className="space-y-4">
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle size={20} className="text-[var(--primary)]" />
              {title}
            </CardTitle>
          </div>

          <div className="flex items-center gap-4 text-sm font-medium">
            <button onClick={handlePrint} className="flex items-center gap-1.5 hover:text-[var(--primary)] transition-colors text-slate-600 dark:text-slate-400">
              <Printer size={16} />
              <span className="hidden sm:inline">{t("print", "طباعة")}</span>
            </button>
            <button onClick={handleExportPDF} disabled={pdfLoading} className="flex items-center gap-1.5 hover:text-[var(--primary)] transition-colors text-slate-600 dark:text-slate-400 disabled:opacity-50">
              <FileText size={16} />
              <span className="hidden sm:inline">PDF</span>
            </button>
            <button onClick={handleExportExcel} className="flex items-center gap-1.5 hover:text-[var(--primary)] transition-colors text-slate-600 dark:text-slate-400">
              <FileSpreadsheet size={16} />
              <span className="hidden sm:inline">Excel</span>
            </button>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-1 gap-4 mb-2">
            <FinancialStatCard
              title={t("items_count", "عدد الأصناف")}
              value={String(rows.length)}
              icon={AlertTriangle}
              color="orange"
            />
          </div>

          {/* Filters Card */}
          <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-transparent p-4 md:p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-4 items-end">
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
            <DataTable value={rows} loading={isLoading || isFetching} paginator rows={entriesPerPage} dataKey="productId" className="custom-green-table custom-compact-table low-stock-table" emptyMessage={!isSearched ? t("click_search_to_view", "اضغط على زر البحث لعرض البيانات") : t("no_data", "لا توجد بيانات")} responsiveLayout="stack">
              <Column header={t("serial", "م")} body={(_, opt) => <span className="text-sm font-semibold">{opt.rowIndex + 1}</span>} className="w-16" />
              <Column field="barcode" header={t("barcode", "باركود")} sortable body={(rowData) => <span className="text-sm font-medium">{rowData.barcode}</span>} />

              <Column field="productName" header={t("item_name", "اسم الصنف")} sortable body={(rowData) => <span className="text-sm font-bold text-[var(--text-main)]">{rowData.productName}</span>} />

              <Column field="currentQty" header={t("current_quantity", "الكمية الحالية")} sortable body={(rowData) => <span className="text-sm border border-red-200 bg-red-50 text-red-700 px-2 py-0.5 rounded-full font-bold inline-block">{formatNumber(rowData.currentQty)}</span>} />

              <Column field="minStockLevel" header={t("min_stock_level", "حد الطلب")} sortable body={(rowData) => <span className="text-sm font-semibold whitespace-nowrap">{formatNumber(rowData.minStockLevel)}</span>} />
            </DataTable>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
