import React, { useState, useMemo } from 'react';
import {
  FileText,
  FileSpreadsheet,
  Search,
  DollarSign,
  TrendingUp,
  BarChart2,
  Printer,
  RotateCcw,
  Calendar as CalendarIcon,
  Receipt
} from 'lucide-react';
import { DataTable, type DataTablePageEvent } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useLanguage } from '@/context/LanguageContext';
import { useGetAllSales } from '@/features/sales/hooks/useGetAllSales';
import { useGetAllBranches } from "@/features/Branches/hooks/Usegetallbranches";
import { useAuthStore } from "@/store/authStore";
import { Permissions } from "@/lib/permissions";
import type { SalesOrder } from '@/features/sales/types/sales.types';
import { FinancialStatCard } from "@/components/FinancialStatCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  generateReportHTML,
  printCustomHTML,
  exportCustomPDF,
  exportToExcel
} from "@/utils/customExportUtils";
import { useSettingsStore } from '@/features/settings/store/settingsStore';

const StatusBadge = ({ status }: { status: string }) => {
  const { t } = useLanguage();
  return (
    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-slate-100 text-slate-700">
      {status === 'Confirmed' ? t('confirmed', 'مؤكد') : t('not_confirmed', 'غير مؤكد')}
    </span>
  );
};

export default function SalesReport() {
  const { t, direction, language } = useLanguage();
  const taxSetting = useSettingsStore((state) => state.settings?.taxSetting?.taxSetting);
  const isExempt = taxSetting === "Exempt";
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [pdfLoading, setPdfLoading] = useState(false);

  const [filters, setFilters] = useState(() => {
    const now = new Date();
    return {
      branchId: " ",
      from: new Date(now.getFullYear(), now.getMonth(), 1).toLocaleDateString('en-CA'),
      to: now.toLocaleDateString('en-CA'),
    };
  });

  const [isSearched, setIsSearched] = useState(false);
  const [searchParams, setSearchParams] = useState(filters);

  // Data Fetching
  const { data: salesOrders, isLoading } = useGetAllSales({
    page: currentPage,
    limit: entriesPerPage,
    branchId: searchParams.branchId.trim() || undefined,
    from: searchParams.from,
    to: searchParams.to,
    enabled: isSearched,
  });

  const orders = isSearched ? (salesOrders?.items ?? []) : [];
  const totalCount = isSearched ? (salesOrders?.totalCount ?? 0) : 0;

  const { data: branches = [] } = useGetAllBranches();
  const hasAnyPermission = useAuthStore((state) => state.hasAnyPermission);

  const summary = useMemo(() => {
    if (!isSearched) return { totalSales: 0, totalNoTax: 0, totalTax: 0, count: 0 };
    
    const totalSales = orders.reduce((sum, s) => sum + (s.grandTotal || 0), 0);
    const totalTax = orders.reduce((sum, s) => sum + (s.taxAmount || 0), 0);
    const totalNoTax = totalSales - totalTax;

    return {
      totalSales,
      totalNoTax,
      totalTax,
      count: totalCount
    };
  }, [orders, totalCount, isSearched]);

  const fmt = (n: number) => (n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleSearch = () => {
    setIsSearched(true);
    setCurrentPage(1);
    setSearchParams(filters);
  };

  const handleClear = () => {
    const now = new Date();
    const reset = {
      branchId: " ",
      from: new Date(now.getFullYear(), now.getMonth(), 1).toLocaleDateString('en-CA'),
      to: now.toLocaleDateString('en-CA'),
    };
    setFilters(reset);
    setIsSearched(false);
    setSearchParams(reset);
    setCurrentPage(1);
  };

  const reportTitle = t('sales_report', 'تقرير المبيعات');

  const getFiltersInfo = () => {
    const branchName = branches.find(b => String(b.id) === searchParams.branchId.trim())?.name || t('all', 'الكل');
    return `${t('branch', 'الفرع')}: ${branchName} | ${t('from', 'من')}: ${searchParams.from} | ${t('to', 'إلى')}: ${searchParams.to}`;
  };

  const handlePrint = () => {
    const columns = [
      { header: t("serial", "م"), field: "serial" },
      { header: t('invoice_number', 'رقم الفاتورة'), field: 'orderNumber' },
      { header: t('date', 'التاريخ'), field: 'orderDate' },
      { header: t('customer_name', 'اسم العميل'), field: 'customerName' },
      { header: t('total_amount', 'الإجمالي'), field: 'grandTotal' },
      { header: t('status', 'الحالة'), field: 'orderStatus' }
    ];

    const data = orders.map(o => ({
      ...o,
      orderDate: new Date(o.orderDate).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-GB'),
      grandTotal: fmt(o.grandTotal),
      orderStatus: o.orderStatus === 'Confirmed' ? t('confirmed') : t('not_confirmed')
    }));

    const summaryCards = [
      { title: t('total_sales', 'إجمالي المبيعات'), value: `${fmt(summary.totalSales)} ${t('sar', 'ر.س')}`, icon: 'DollarSign' },
      ...(!isExempt ? [
        { title: t('total_no_tax', 'الإجمالي بدون ضريبة'), value: `${fmt(summary.totalNoTax)} ${t('sar', 'ر.س')}`, icon: 'Receipt' },
        { title: t('total_tax', 'إجمالي الضريبة'), value: `${fmt(summary.totalTax)} ${t('sar', 'ر.س')}`, icon: 'BarChart2' }
      ] : [])
    ];

    const html = generateReportHTML(reportTitle, getFiltersInfo(), summaryCards, columns, data, t, direction);
    printCustomHTML(reportTitle, html);
  };

  const handleExportPDF = async () => {
    setPdfLoading(true);
    try {
      const columns = [
        { header: t("serial", "م"), field: "serial" },
        { header: t('invoice_number', 'رقم الفاتورة'), field: 'orderNumber' },
        { header: t('date', 'التاريخ'), field: 'orderDate' },
        { header: t('customer_name', 'اسم العميل'), field: 'customerName' },
        { header: t('total_amount', 'الإجمالي'), field: 'grandTotal' }
      ];

      const data = orders.map(o => ({
        ...o,
        orderDate: new Date(o.orderDate).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-GB'),
        grandTotal: fmt(o.grandTotal)
      }));

      const summaryCards = [
        { title: t('total_sales', 'إجمالي المبيعات'), value: `${fmt(summary.totalSales)} ${t('sar', 'ر.س')}`, icon: 'DollarSign' },
        ...(!isExempt ? [
          { title: t('total_tax', 'إجمالي الضريبة'), value: `${fmt(summary.totalTax)} ${t('sar', 'ر.س')}`, icon: 'BarChart2' }
        ] : [])
      ];

      const html = generateReportHTML(reportTitle, getFiltersInfo(), summaryCards, columns, data, t, direction);
      await exportCustomPDF(reportTitle, html);
    } finally {
      setPdfLoading(false);
    }
  };

  const handleExportExcel = () => {
    const columns = [
      { header: t("serial", "م"), field: "serial" },
      { header: t('invoice_number'), field: 'orderNumber' },
      { header: t('date'), field: 'orderDate', body: (o: any) => new Date(o.orderDate).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-GB') },
      { header: t('customer_name'), field: 'customerName' },
      { header: t('total_amount'), field: 'grandTotal' },
      { header: t('status'), field: 'orderStatus' }
    ];
    exportToExcel(orders, columns, reportTitle);
  };

  return (
    <div className="space-y-6 pb-12" dir={direction}>
      <Card className="border-none shadow-sm overflow-hidden bg-white dark:bg-slate-950">
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
          <div>
            <CardTitle className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-[var(--primary)]" />
              {reportTitle}
            </CardTitle>
            <CardDescription className="mt-1">
              {t('customize_report_below', 'تخصيص التقرير أدناه')}
            </CardDescription>
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
              <span className="hidden sm:inline">{pdfLoading ? t('loading', 'جاري التحميل...') : 'PDF'}</span>
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

        <CardContent className="pt-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <FinancialStatCard
              title={t('total_sales', 'إجمالي المبيعات')}
              value={fmt(summary.totalSales)}
              suffix="SAR"
              icon={DollarSign}
              color="blue"
            />
            {!isExempt && (
              <>
                <FinancialStatCard
                  title={t('total_no_tax', 'الإجمالي بدون ضريبة')}
                  value={fmt(summary.totalNoTax)}
                  suffix="SAR"
                  icon={Receipt}
                  color="teal"
                />
                <FinancialStatCard
                  title={t('total_tax', 'إجمالي الضريبة')}
                  value={fmt(summary.totalTax)}
                  suffix="SAR"
                  icon={BarChart2}
                  color="orange"
                />
              </>
            )}
            <FinancialStatCard
              title={t('invoices_count', 'عدد الفواتير')}
              value={String(summary.count)}
              icon={TrendingUp}
              color="purple"
            />
          </div>
          
          {/* Filters */}
          <div className="mb-8 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 items-end">
              {hasAnyPermission([Permissions?.branches?.all, Permissions?.branches?.view]) && (
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("branch", "الفرع")}</Label>
                  <Select value={filters.branchId} onValueChange={(val) => setFilters(p => ({ ...p, branchId: val }))}>
                    <SelectTrigger className="h-11 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
                      <SelectValue placeholder={t("select_branch", "اختر الفرع")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=" ">{t("all", "الكل")}</SelectItem>
                      {branches.map((b) => (
                        <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("from_date", "من تاريخ")}</Label>
                <div className="relative">
                  <DatePicker
                    selected={filters.from ? new Date(filters.from.replace(/-/g, '/')) : null}
                    onChange={(date) => setFilters(p => ({ ...p, from: date ? date.toLocaleDateString('en-CA') : "" }))}
                    dateFormat="dd/MM/yyyy"
                    customInput={
                      <div className="flex items-center gap-2 cursor-pointer px-3 h-11 w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm text-sm">
                        <CalendarIcon className="h-4 w-4 text-slate-400 shrink-0" />
                        <span>{filters.from ? format(new Date(filters.from.replace(/-/g, '/')), "dd/MM/yyyy") : t("select_date")}</span>
                      </div>
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("to_date", "إلى تاريخ")}</Label>
                <div className="relative">
                  <DatePicker
                    selected={filters.to ? new Date(filters.to.replace(/-/g, '/')) : null}
                    onChange={(date) => setFilters(p => ({ ...p, to: date ? date.toLocaleDateString('en-CA') : "" }))}
                    dateFormat="dd/MM/yyyy"
                    customInput={
                      <div className="flex items-center gap-2 cursor-pointer px-3 h-11 w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm text-sm">
                        <CalendarIcon className="h-4 w-4 text-slate-400 shrink-0" />
                        <span>{filters.to ? format(new Date(filters.to.replace(/-/g, '/')), "dd/MM/yyyy") : t("select_date")}</span>
                      </div>
                    }
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleSearch}
                  className="h-11 px-6 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white gap-2 flex-1 rounded-xl shadow-md shadow-emerald-200 dark:shadow-none font-bold transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center"
                >
                  <Search size={18} />
                  {t("search", "بحث")}
                </button>
                <button
                  onClick={handleClear}
                  className="h-11 px-4 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all rounded-xl shadow-sm"
                >
                  <RotateCcw size={18} className="text-slate-500" />
                </button>
              </div>
            </div>
          </div>

          <DataTable
            value={orders} totalRecords={totalCount} loading={isLoading}
            lazy paginator
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
            rows={entriesPerPage}
            first={(currentPage - 1) * entriesPerPage}
            onPage={(e: DataTablePageEvent) => {
              if (e.page === undefined) return;
              setCurrentPage(e.page + 1);
              setEntriesPerPage(e.rows ?? entriesPerPage);
            }}
            className="custom-standard-table" dataKey="id"
            emptyMessage={!isSearched ? t("click_search_to_view", "اضغط على زر البحث لعرض البيانات") : t("no_data", "لا توجد بيانات")}
            scrollable scrollHeight="600px"
          >
            <Column
              header={t("serial", "م")}
              body={(_, opt) => <span className="text-sm font-semibold">{opt.rowIndex + 1}</span>}
              className="w-16"
            />
            <Column header={t('invoice_number', 'رقم الفاتورة')} field="orderNumber" sortable body={(r: SalesOrder) => <span className="font-bold text-[var(--primary)]">{r.orderNumber}</span>} />
            <Column header={t('date', 'التاريخ')} field="orderDate" sortable body={(r: SalesOrder) => new Date(r.orderDate).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-GB')} />
            <Column header={t('customer_name', 'اسم العميل')} field="customerName" sortable />
            <Column header={t('cashier', 'الكاشير')} field="createdBy" sortable />
            <Column header={t('status', 'الحالة')} body={(r: SalesOrder) => <StatusBadge status={r.orderStatus} />} />
            <Column header={t('total_amount', 'الإجمالي')} field="grandTotal" sortable body={(r: SalesOrder) => <span className="font-bold">{fmt(r.grandTotal)}</span>} />
          </DataTable>
        </CardContent>
      </Card>
    </div>
  );
}
