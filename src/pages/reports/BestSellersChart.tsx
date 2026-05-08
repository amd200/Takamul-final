import React, { useState, useMemo } from "react";
import {
  BarChart2,
  RotateCcw,
  Search,
  Printer,
  FileText,
  FileSpreadsheet,
  TrendingUp,
  Package,
  DollarSign,
  ShoppingBag,
  Calendar as CalendarIcon
} from "lucide-react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useLanguage } from "@/context/LanguageContext";
import { useGetAllBranches } from "@/features/Branches/hooks/Usegetallbranches";
import { useGetTopSellingProducts } from "@/features/reports/hooks/useGetTopSellingProducts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/authStore";
import { Permissions } from "@/lib/permissions";
import { 
  generateReportHTML, 
  printCustomHTML, 
  exportCustomPDF, 
  exportToExcel 
} from "@/utils/customExportUtils";
import { format } from "date-fns";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#14b8a6"];

export default function BestSellersChart() {
  const { t, direction } = useLanguage();
  const hasAnyPermission = useAuthStore((state) => state.hasAnyPermission);
  const [pdfLoading, setPdfLoading] = useState(false);

  const [filters, setFilters] = useState({
    branchId: " ",
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toLocaleDateString('en-CA'),
    to: new Date().toLocaleDateString('en-CA'),
  });

  const [isSearched, setIsSearched] = useState(false);
  const [submittedFilters, setSubmittedFilters] = useState(filters);

  const { data: rawReportData, isLoading, isFetching } = useGetTopSellingProducts({
    branchid: submittedFilters.branchId.trim() || undefined,
    from: submittedFilters.from,
    to: submittedFilters.to,
    enabled: isSearched,
  });

  const reportData = isSearched ? (rawReportData ?? []) : [];

  const { data: branches = [] } = useGetAllBranches();

  const handleSearch = () => {
    setIsSearched(true);
    setSubmittedFilters(filters);
  };

  const handleClear = () => {
    const resetState = {
      branchId: " ",
      from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toLocaleDateString('en-CA'),
      to: new Date().toLocaleDateString('en-CA'),
    };
    setIsSearched(false);
    setFilters(resetState);
    setSubmittedFilters(resetState);
  };

  const formatNumber = (value?: number) => {
    return Number(value ?? 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const summary = useMemo(() => {
    const totalSales = reportData.reduce((acc, curr) => acc + (curr.totalSales || 0), 0);
    const totalQty = reportData.reduce((acc, curr) => acc + (curr.totalQuantitySold || 0), 0);
    const productCount = reportData.length;
    return { totalSales, totalQty, productCount };
  }, [reportData]);

  const reportTitle = t("best_sellers_report", "تقرير الأكثر مبيعاً");

  const getFiltersInfo = () => {
    const b = branches.find(x => String(x.id) === submittedFilters.branchId.trim());
    return `${t("branch", "الفرع")}: ${b ? b.name : t("all", "الكل")} | ${t("from", "من")}: ${submittedFilters.from} | ${t("to", "إلى")}: ${submittedFilters.to}`;
  };

  const columns = [
    { header: t("serial", "م"), field: "serial" },
    { header: t("product_name", "اسم المنتج"), field: "productName" },
    { header: t("barcode", "باركود"), field: "barcode" },
    { header: t("selling_price", "سعر البيع"), field: "sellingPrice", body: (r: any) => formatNumber(r.sellingPrice) },
    { header: t("sales_count", "عدد مرات البيع"), field: "totalQuantitySold" },
    { header: t("total_sales", "إجمالي المبيعات"), field: "totalSales", body: (r: any) => formatNumber(r.totalSales) },
  ];

  const handleExportPDF = async () => {
    if (!reportData.length) return;
    setPdfLoading(true);
    try {
      // const summaryCards = [
      //   { title: t("total_sales", "إجمالي المبيعات"), value: `${formatNumber(summary.totalSales)} SAR`, color: 'blue' },
      //   { title: t("total_qty", "إجمالي الكمية المباعة"), value: String(summary.totalQty), color: 'teal' },
      //   { title: t("products_count", "عدد المنتجات"), value: String(summary.productCount), color: 'orange' }
      // ];
      const html = generateReportHTML(reportTitle, getFiltersInfo(), [], columns, reportData, t, direction);
      await exportCustomPDF(reportTitle, html);
    } finally {
      setPdfLoading(false);
    }
  };

  const handlePrint = () => {
    if (!reportData.length) return;
    // const summaryCards = [
    //   { title: t("total_sales", "إجمالي المبيعات"), value: `${formatNumber(summary.totalSales)} SAR`, color: 'blue' },
    //   { title: t("total_qty", "إجمالي الكمية المباعة"), value: String(summary.totalQty), color: 'teal' },
    //   { title: t("products_count", "عدد المنتجات"), value: String(summary.productCount), color: 'orange' }
    // ];
    const html = generateReportHTML(reportTitle, getFiltersInfo(), [], columns, reportData, t, direction);
    printCustomHTML(reportTitle, html);
  };

  const handleExportExcel = () => {
    if (!reportData.length) return;
    exportToExcel(reportData, columns, reportTitle);
  };

  return (
    <div dir={direction} className="space-y-4">
      <Card className="border-none shadow-sm overflow-hidden bg-white dark:bg-slate-950">
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
          <div>
            <CardTitle className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-[var(--primary)]" />
              {reportTitle}
            </CardTitle>
          </div>
          <div className="flex items-center gap-4 text-sm font-medium">
            <button onClick={handlePrint} className="flex items-center gap-1.5 hover:text-[var(--primary)] transition-colors text-slate-600 dark:text-slate-400">
              <Printer size={16} /> <span className="hidden sm:inline">{t("print", "طباعة")}</span>
            </button>
            <button onClick={handleExportPDF} disabled={pdfLoading} className="flex items-center gap-1.5 hover:text-[var(--primary)] transition-colors text-slate-600 dark:text-slate-400 disabled:opacity-50">
              <FileText size={16} /> <span className="hidden sm:inline">{pdfLoading ? t('loading') : 'PDF'}</span>
            </button>
            <button onClick={handleExportExcel} className="flex items-center gap-1.5 hover:text-[var(--primary)] transition-colors text-slate-600 dark:text-slate-400">
              <FileSpreadsheet size={16} /> <span className="hidden sm:inline">Excel</span>
            </button>
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {/* Filters Card */}
          <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-transparent p-4 md:p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
              {hasAnyPermission([Permissions?.branches?.all, Permissions?.branches?.view]) && (
                <div className="space-y-2 lg:col-span-1">
                  <Label className="text-xs font-medium text-text-main">{t("branch", "الفرع")}</Label>
                  <Select value={filters.branchId} onValueChange={(val) => setFilters(p => ({ ...p, branchId: val }))}>
                    <SelectTrigger className="w-full h-10 border-slate-200 dark:border-slate-800 text-sm">
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
                <Label className="text-xs font-medium text-text-main">{t("from_date", "تاريخ البداية")}</Label>
                <div className="relative flex items-center border border-input rounded-md bg-background">
                  <DatePicker
                    selected={filters.from ? new Date(filters.from.replace(/-/g, '/')) : null}
                    onChange={(date) => setFilters(p => ({ ...p, from: date ? format(date, "yyyy-MM-dd") : "" }))}
                    dateFormat="dd/MM/yyyy"
                    placeholderText={t("select_date", "يوم/شهر/سنة")}
                    popperPlacement="bottom-start"
                    portalId="root-portal"
                    customInput={
                      <div className="flex items-center gap-2 cursor-pointer px-3 h-10 w-full">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-sm">{filters.from ? format(new Date(filters.from.replace(/-/g, '/')), "dd/MM/yyyy") : t("select_date")}</span>
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
                    onChange={(date) => setFilters(p => ({ ...p, to: date ? format(date, "yyyy-MM-dd") : "" }))}
                    dateFormat="dd/MM/yyyy"
                    placeholderText={t("select_date", "يوم/شهر/سنة")}
                    popperPlacement="bottom-start"
                    portalId="root-portal"
                    customInput={
                      <div className="flex items-center gap-2 cursor-pointer px-3 h-10 w-full">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-sm">{filters.to ? format(new Date(filters.to.replace(/-/g, '/')), "dd/MM/yyyy") : t("select_date")}</span>
                      </div>
                    }
                  />
                </div>
              </div>

              <div className="flex flex-row items-end gap-2 mb-2 lg:col-span-2">
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

          {/* Chart Section
          {!isLoading && reportData.length > 0 && (
            <div className="h-[400px] w-full p-4 rounded-xl border border-gray-100 dark:border-slate-800">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={reportData.slice(0, 10)}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="productName"
                    type="category"
                    width={100}
                    tick={{ fontSize: 12, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "#f8fafc" }}
                    contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }}
                  />
                  <Bar dataKey="totalSales" radius={[0, 4, 4, 0]} barSize={20}>
                    {reportData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )} */}

          <div className="rounded-xl border border-gray-100 dark:border-slate-800 overflow-hidden">
            <DataTable
              value={reportData}
              loading={isLoading || isFetching}
              className="custom-green-table custom-compact-table"
              emptyMessage={!isSearched ? t("click_search_to_view", "اضغط على زر البحث لعرض البيانات") : t("no_data", "لا توجد بيانات")}
              paginator
              rows={10}
              responsiveLayout="stack"
            >
              <Column header={t("serial", "م")} body={(_, options) => options.rowIndex + 1} className="w-16" />
              <Column field="barcode" header={t("barcode", "باركود")} sortable body={(r) => <span className="font-mono text-xs">{r.barcode}</span>} />
              <Column field="productName" header={t("product_name", "اسم المنتج")} sortable body={(r) => <span className="font-bold">{r.productName}</span>} />
              <Column field="sellingPrice" header={t("selling_price", "سعر البيع")} body={(r) => formatNumber(r.sellingPrice)} sortable />
              <Column field="totalQuantitySold" header={t("sales_count", "عدد مرات البيع")} sortable />
              <Column field="totalSales" header={t("total_sales", "إجمالي المبيعات")} body={(r) => <span className="font-bold text-[var(--primary)]">{formatNumber(r.totalSales)}</span>} sortable />
            </DataTable>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
