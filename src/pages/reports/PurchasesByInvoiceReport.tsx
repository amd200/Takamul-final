import React, { useState, useMemo } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, RotateCcw, FileText, Printer, FileSpreadsheet, DollarSign, Receipt, TrendingUp } from "lucide-react";
import { FinancialStatCard } from "@/components/FinancialStatCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useGetPurchaseInvoicesReport } from "@/features/reports/hooks/Usegetpurchaseinvoicesreport";
import { useGetAllBranches } from "@/features/Branches/hooks/Usegetallbranches";
import { useAuthStore } from "@/store/authStore";
import { Permissions } from "@/lib/permissions";
import { format } from "date-fns";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Calendar as CalendarIcon } from "lucide-react";
import {
  generateReportHTML,
  printCustomHTML,
  exportCustomPDF,
  exportToExcel
} from "@/utils/customExportUtils";
import { useSettingsStore } from "@/features/settings/store/settingsStore";

interface FilterState {
  branchId: string;
  fiscalYear: string;
  fiscalQuarter: string;
  from: string;
  to: string;
}

const FISCAL_YEARS = ["2022", "2023", "2024", "2025", "2026"];
const FISCAL_QUARTERS = [
  { value: "Q1", label: "🟢 الربع الأول Q1 (يناير - مارس)", from: "-01-01", to: "-03-31" },
  { value: "Q2", label: "🔵 الربع الثاني Q2 (أبريل - يونيو)", from: "-04-01", to: "-06-30" },
  { value: "Q3", label: "🟡 الربع الثالث Q3 (يوليو - سبتمبر)", from: "-07-01", to: "-09-30" },
  { value: "Q4", label: "🔴 الربع الرابع Q4 (أكتوبر - ديسمبر)", from: "-10-01", to: "-12-31" },
];

export default function PurchasesByInvoiceReport() {
  const { t, direction } = useLanguage();
  const taxSetting = useSettingsStore((state) => state.settings?.taxSetting?.taxSetting);
  const isExempt = taxSetting === "Exempt";
  const [pdfLoading, setPdfLoading] = useState(false);

  const [filters, setFilters] = useState<FilterState>({
    branchId: " ",
    fiscalYear: new Date().getFullYear().toString(),
    fiscalQuarter: "",
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toLocaleDateString('en-CA'),
    to: new Date().toLocaleDateString('en-CA'),
  });

  const [isSearched, setIsSearched] = useState(false);
  const [searchParams, setSearchParams] = useState<FilterState>(filters);

  // Data Fetching
  const { data: rawPurchasesData, isLoading: purchasesLoading, isFetching: purchasesFetching } = useGetPurchaseInvoicesReport({
    branchid: searchParams.branchId.trim() || undefined,
    From: searchParams.from,
    To: searchParams.to,
    enabled: isSearched,
  });

  const purchasesData = isSearched ? (rawPurchasesData ?? []) : [];

  const { data: branches = [] } = useGetAllBranches();

  const handleQuarterChange = (quarter: string) => {
    const q = FISCAL_QUARTERS.find((q) => q.value === quarter);
    const year = filters.fiscalYear || new Date().getFullYear().toString();
    setFilters((prev) => ({
      ...prev,
      fiscalQuarter: quarter,
      from: q ? `${year}${q.from}` : prev.from,
      to: q ? `${year}${q.to}` : prev.to,
    }));
  };

  const handleYearChange = (year: string) => {
    const q = FISCAL_QUARTERS.find((q) => q.value === filters.fiscalQuarter);
    setFilters((prev) => ({
      ...prev,
      fiscalYear: year,
      from: q && year ? `${year}${q.from}` : prev.from,
      to: q && year ? `${year}${q.to}` : prev.to,
    }));
  };

  const handleSearch = () => {
    setIsSearched(true);
    setSearchParams(filters);
  };
  const handleClear = () => {
    setIsSearched(false);
    const reset = {
      branchId: " ",
      fiscalYear: new Date().getFullYear().toString(),
      fiscalQuarter: "",
      from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toLocaleDateString('en-CA'),
      to: new Date().toLocaleDateString('en-CA')
    };
    setFilters(reset);
    setSearchParams(reset);
  };

  const formatNumber = (value?: number) =>
    Number(value ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const totalPurchases = useMemo(() => purchasesData.reduce((s, r) => s + (r.subTotal || 0), 0), [purchasesData]);
  const totalTax = useMemo(() => purchasesData.reduce((s, r) => s + ((r.grandTotal || 0) - (r.subTotal || 0)), 0), [purchasesData]);
  const totalFinal = useMemo(() => purchasesData.reduce((s, r) => s + (r.grandTotal || 0), 0), [purchasesData]);

  const title = t("purchases_by_invoice", "تحليل مشتريات على مستوى أرقام الفواتير");

  const getFiltersInfo = () => {
    const b = branches.find(x => String(x.id) === searchParams.branchId.trim());
    const qLabel = FISCAL_QUARTERS.find(q => q.value === searchParams.fiscalQuarter)?.label || t("none", "لا يوجد");

    return [
      `${t("branch", "الفرع")}: ${b ? b.name : t("all", "الكل")}`,
      `${t("fiscal_year", "السنة المالية")}: ${searchParams.fiscalYear}`,
      `${t("fiscal_quarter", "الربع المالي")}: ${qLabel}`,
      `${t("from", "من")}: ${searchParams.from}`,
      `${t("to", "إلى")}: ${searchParams.to}`
    ].join(" | ");
  };

  const exportColumns = [
    { header: t("serial", "م"), field: "serial" },
    { header: t("date", "التاريخ"), field: "date", body: (r: any) => new Date(r.date).toLocaleDateString("en-GB") },
    { header: t("invoice_number", "رقم الفاتورة"), field: "orderNumber" },
    ...(!isExempt ? [{ header: t("total_purchases_excl_tax", "إجمالي المشتريات بدون ضريبة"), field: "subTotal", body: (r: any) => formatNumber(r.subTotal) }] : []),
    ...(!isExempt ? [{ header: t("tax", "الضريبة"), field: "tax", body: (r: any) => formatNumber(r.grandTotal - r.subTotal) }] : []),
    { header: t("grand_total_with_tax", "الإجمالي النهائي"), field: "grandTotal", body: (r: any) => formatNumber(r.grandTotal) },
  ];

  const handleExportPDF = async () => {
    if (!purchasesData.length) return;
    setPdfLoading(true);
    try {
      const html = generateReportHTML(
        title,
        getFiltersInfo(),
        [
          ...(!isExempt ? [{ title: t("total_purchases_excl_tax"), value: `${formatNumber(totalPurchases)} ${t('sar', 'ر.س')}`, color: "orange" }] : []),
          ...(!isExempt ? [{ title: t("total_tax"), value: `${formatNumber(totalTax)} ${t('sar', 'ر.س')}`, color: "blue" }] : []),
          { title: t("grand_total_with_tax"), value: `${formatNumber(totalFinal)} ${t('sar', 'ر.س')}`, color: "teal" },
        ],
        exportColumns,
        purchasesData,
        t,
        direction
      );
      await exportCustomPDF(title, html);
    } finally {
      setPdfLoading(false);
    }
  };

  const handlePrint = () => {
    if (!purchasesData.length) return;
    const html = generateReportHTML(
      title,
      getFiltersInfo(),
      [
        ...(!isExempt ? [{ title: t("total_purchases_excl_tax"), value: `${formatNumber(totalPurchases)} ${t('sar', 'ر.س')}`, color: "orange" }] : []),
        ...(!isExempt ? [{ title: t("total_tax"), value: `${formatNumber(totalTax)} ${t('sar', 'ر.س')}`, color: "blue" }] : []),
        { title: t("grand_total_with_tax"), value: `${formatNumber(totalFinal)} ${t('sar', 'ر.س')}`, color: "teal" },
      ],
      exportColumns,
      purchasesData,
      t,
      direction
    );
    printCustomHTML(title, html);
  };

  const handleExportExcel = () => {
    if (!purchasesData.length) return;
    exportToExcel(purchasesData, exportColumns, title);
  };

  const hasAnyPermission = useAuthStore((state) => state.hasAnyPermission);

  return (
    <div dir={direction} className="space-y-4">
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText size={20} className="text-[var(--primary)]" />
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {!isExempt && (
              <FinancialStatCard
                title={t("total_purchases_excl_tax", "إجمالي المشتريات بدون ضريبة")}
                value={formatNumber(totalPurchases)}
                suffix="SAR"
                icon={TrendingUp}
                color="orange"
              />
            )}
            {!isExempt && (
              <FinancialStatCard
                title={t("total_tax", "إجمالي الضريبة")}
                value={formatNumber(totalTax)}
                suffix="SAR"
                icon={Receipt}
                color="blue"
              />
            )}
            <FinancialStatCard
              title={t("grand_total_with_tax", "الإجمالي النهائي")}
              value={formatNumber(totalFinal)}
              suffix="SAR"
              icon={DollarSign}
              color="teal"
            />
          </div>
          <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-transparent p-4 md:p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 xl:grid-cols-6 gap-4 items-end">
              {hasAnyPermission([Permissions?.branches?.all, Permissions?.branches?.view]) && (
                <div className="space-y-2 lg:col-span-1 ">
                  <label className="text-xs font-medium text-[var(--text-main)]">{t("branch", "الفرع")}</label>
                  <Select
                    value={filters.branchId}
                    onValueChange={val => setFilters(p => ({ ...p, branchId: val }))}
                  >
                    <SelectTrigger className="w-full h-10 border-slate-200 dark:border-slate-800 text-sm">
                      <SelectValue placeholder={t("select_branch", "اختر الفرع")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=" ">{t("all", "الكل")}</SelectItem>
                      {branches.map(b => (
                        <SelectItem key={b.id} value={String(b.id)}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2 lg:col-span-1">
                <label className="text-xs font-medium text-[var(--text-main)]">
                  {t("fiscal_year", "السنة المالية")}
                </label>
                <Select value={filters.fiscalYear} onValueChange={handleYearChange}>
                  <SelectTrigger className="w-full h-10">
                    <SelectValue placeholder={t("select_year", "اختر السنة")} />
                  </SelectTrigger>
                  <SelectContent>
                    {FISCAL_YEARS.map((y) => (
                      <SelectItem key={y} value={y}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 lg:col-span-1">
                <label className="text-xs font-medium text-[var(--text-main)]">
                  {t("fiscal_quarter", "الربع المالي")}
                </label>
                <Select value={filters.fiscalQuarter} onValueChange={handleQuarterChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("select_quarter", "اختر الربع")} />
                  </SelectTrigger>
                  <SelectContent>
                    {FISCAL_QUARTERS.map((q) => (
                      <SelectItem key={q.value} value={q.value}>{q.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-[var(--text-main)]">
                  {t("from_date", "تاريخ البداية")}
                </label>
                <div className="relative flex items-center border border-input rounded-md bg-background">
                  <DatePicker
                    selected={filters.from ? new Date(filters.from.replace(/-/g, '/')) : null}
                    onChange={(date) =>
                      setFilters((p) => ({ ...p, from: date ? format(date, "yyyy-MM-dd") : "" }))
                    }
                    dateFormat="dd/MM/yyyy"
                    placeholderText={t("select_date", "يوم/شهر/سنة")}
                    popperPlacement="bottom-start"
                    portalId="root-portal"
                    customInput={
                      <div className="flex items-center gap-2 cursor-pointer px-3 h-10 w-full">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-sm">
                          {filters.from
                            ? format(new Date(filters.from.replace(/-/g, '/')), "dd/MM/yyyy")
                            : t("select_date", "يوم/شهر/سنة")}
                        </span>
                      </div>
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-[var(--text-main)]">
                  {t("to_date", "تاريخ النهاية")}
                </label>
                <div className="relative flex items-center border border-input rounded-md bg-background">
                  <DatePicker
                    selected={filters.to ? new Date(filters.to.replace(/-/g, '/')) : null}
                    onChange={(date) =>
                      setFilters((p) => ({ ...p, to: date ? format(date, "yyyy-MM-dd") : "" }))
                    }
                    dateFormat="dd/MM/yyyy"
                    placeholderText={t("select_date", "يوم/شهر/سنة")}
                    popperPlacement="bottom-start"
                    portalId="root-portal"
                    customInput={
                      <div className="flex items-center gap-2 cursor-pointer px-3 h-10 w-full">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-sm">
                          {filters.to
                            ? format(new Date(filters.to.replace(/-/g, '/')), "dd/MM/yyyy")
                            : t("select_date", "يوم/شهر/سنة")}
                        </span>
                      </div>
                    }
                  />
                </div>
              </div>
              <div className="flex flex-row items-end gap-2 mb-2 lg:col-span-1">
                <Button onClick={handleSearch} disabled={purchasesLoading || purchasesFetching} className="flex-1 h-9 px-4 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white gap-2 rounded-lg shadow-sm font-bold">
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
              value={purchasesData}
              paginator rows={10}
              loading={purchasesLoading || purchasesFetching}
              className="custom-green-table custom-compact-table"
              emptyMessage={!isSearched ? t("click_search_to_view", "اضغط على زر البحث لعرض البيانات") : t("no_data", "لا توجد بيانات")}
              responsiveLayout="stack"
            >
              <Column
                header={t("serial", "م")}
                body={(_, opt) => <span className="text-sm font-semibold">{opt.rowIndex + 1}</span>}
                className="w-16"
              />
              <Column field="date" header={t("date", "التاريخ")} sortable body={(r) => <span className="text-sm">{new Date(r.date).toLocaleDateString("en-GB")}</span>} />
              <Column field="orderNumber" header={t("invoice_number", "رقم الفاتورة")} sortable body={(r) => <span className="text-sm font-bold text-[var(--text-main)]">{r.orderNumber}</span>} />
              {!isExempt && <Column field="subTotal" header={t("total_purchases_excl_tax", "إجمالي المشتريات بدون ضريبة")} sortable body={(r) => <span className="text-sm font-medium">{formatNumber(r.subTotal)}</span>} />}
              {!isExempt && <Column header={t("tax", "الضريبة")} sortable body={(r) => <span className="text-sm">{formatNumber(r.grandTotal - r.subTotal)}</span>} />}
              <Column field="grandTotal" header={t("grand_total_with_tax", "الإجمالي النهائي")} sortable body={(r) => <span className="text-sm font-bold text-[var(--primary)]">{formatNumber(r.grandTotal)}</span>} />
            </DataTable>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
