import React, { useState, useMemo } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, RotateCcw, FileText, Printer, FileSpreadsheet, Barcode, DollarSign, ShoppingCart } from "lucide-react";
import ComboboxField from "@/components/ui/ComboboxField";
import { FinancialStatCard } from "@/components/FinancialStatCard";

import { useGetProductPurchases } from "@/features/reports/hooks/Usegetproductpurchases";
import { useGetAllProducts } from "@/features/products/hooks/useGetAllProducts";
import { useGetAllBranches } from "@/features/Branches/hooks/Usegetallbranches";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

interface FilterState {
  branchId: string;
  productId: string;
  from: string;
  to: string;
}

export default function ItemPurchasesReport() {
  const { t, direction } = useLanguage();
  const [pdfLoading, setPdfLoading] = useState(false);

  const initialFilters: FilterState = {
    branchId: "all",
    productId: "",
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toLocaleDateString('en-CA'),
    to: new Date().toLocaleDateString('en-CA'),
  };

  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [isSearched, setIsSearched] = useState(false);
  const [searchParams, setSearchParams] = useState<FilterState>(initialFilters);

  const { data: productsData, isLoading: productsLoading } = useGetAllProducts({ page: 1, limit: 1000 });
  const { data: branches = [] } = useGetAllBranches();

  const {
    data: rawReportData,
    isLoading: purchasesLoading,
    isFetching: purchasesFetching,
  } = useGetProductPurchases({
    branchid: searchParams.branchId === "all" ? undefined : searchParams.branchId,
    productID: searchParams.productId,
    from: searchParams.from,
    to: searchParams.to,
    enabled: isSearched && !!searchParams.productId,
  });

  const purchasesResponse = isSearched ? rawReportData : undefined;

  const handleSearch = () => {
    setIsSearched(true);
    setSearchParams(filters);
  };
  const handleClear = () => {
    setIsSearched(false);
    setFilters(initialFilters);
    setSearchParams(initialFilters);
  };

  const formatNumber = (value?: number) =>
    Number(value ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const rows = useMemo(() => purchasesResponse?.details ?? [], [purchasesResponse]);
  const totalAmount = purchasesResponse?.summary?.totalPurchases ?? 0;
  const totalOperations = purchasesResponse?.summary?.totalOperations ?? 0;

  const title = t("item_purchases_report", "تقرير مشتريات صنف");

  const getFiltersInfo = () => {
    const b = branches.find(x => String(x.id) === searchParams.branchId);
    const p = (productsData?.items ?? []).find(x => String(x.id) === searchParams.productId);
    return [
      `${t("branch", "الفرع")}: ${searchParams.branchId === "all" ? t("all") : (b ? b.name : "")}`,
      `${t("product_name", "اسم الصنف")}: ${p ? p.productNameAr : t("not_selected")}`,
      `${t("from", "من")}: ${searchParams.from}`,
      `${t("to", "إلى")}: ${searchParams.to}`
    ].join(" | ");
  };

  const exportColumns = [
    { header: t("serial", "م"), field: "serial" },
    { header: t("date", "التاريخ"), field: "date", body: (r: any) => r.date ? new Date(r.date).toLocaleDateString("en-GB") : "-" },
    { header: t("invoice_number", "رقم الفاتورة"), field: "orderNumber" },
    { header: t("purchased_quantity", "الكمية المشتراة"), field: "quantityPurchased" },
    { header: "إجمالي الشراء", field: "totalPurchases", body: (r: any) => formatNumber(r.totalPurchases) },
  ];

  const handleExportPDF = async () => {
    if (!rows.length) return;
    setPdfLoading(true);
    try {
      const html = generateReportHTML(
        title,
        getFiltersInfo(),
        [
          { title: t("total_item_purchases"), value: `${formatNumber(totalAmount)} ${t('sar', 'ر.س')}`, color: "orange" },
          { title: t("total_purchases_operations"), value: totalOperations.toLocaleString(), color: "blue" },
        ],
        exportColumns,
        rows,
        t,
        direction
      );
      await exportCustomPDF(title, html);
    } finally {
      setPdfLoading(false);
    }
  };

  const handlePrint = () => {
    if (!rows.length) return;
    const html = generateReportHTML(
      title,
      getFiltersInfo(),
      [
        { title: t("total_item_purchases"), value: `${formatNumber(totalAmount)} ${t('sar', 'ر.س')}`, color: "orange" },
        { title: t("total_purchases_operations"), value: totalOperations.toLocaleString(), color: "blue" },
      ],
      exportColumns,
      rows,
      t,
      direction
    );
    printCustomHTML(title, html);
  };

  const handleExportExcel = () => {
    if (!rows.length) return;
    exportToExcel(rows, exportColumns, title);
  };

  const hasAnyPermission = useAuthStore((state) => state.hasAnyPermission);

  return (
    <div dir={direction} className="space-y-4">
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Barcode size={20} className="text-[var(--primary)]" />
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
              title={t("total_amount", "إجمالي القيمة")}
              value={formatNumber(totalAmount)}
              suffix="SAR"
              icon={DollarSign}
              color="orange"
            />
            <FinancialStatCard
              title={t("total_purchases_operations", "عدد عمليات المشتريات")}
              value={totalOperations.toLocaleString()}
              icon={ShoppingCart}
              color="blue"
            />
          </div>
          {/* Filters Card */}
          <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-transparent p-4 md:p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 xl:grid-cols-5 gap-4 items-end">
              {hasAnyPermission([Permissions?.branches?.all, Permissions?.branches?.view]) && (
                <div className="space-y-2 lg:col-span-1 mb-2">
                  <label className="text-xs font-medium text-[var(--text-main)]">{t("branch", "الفرع")}</label>
                  <Select
                    value={filters.branchId}
                    onValueChange={val => setFilters(p => ({ ...p, branchId: val }))}
                  >
                    <SelectTrigger className="w-full h-10 border-slate-200 dark:border-slate-800 text-sm">
                      <SelectValue placeholder={t("select_branch", "اختر الفرع")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("all", "الكل")}</SelectItem>
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
                <label className="text-xs font-medium text-[var(--text-main)]">{t("product_name", "اسم الصنف")}</label>
                <ComboboxField
                  value={filters.productId}
                  onChange={(val) => setFilters((p) => ({ ...p, productId: String(val) }))}
                  items={(productsData?.items ?? []).map((p: any) => ({
                    id: String(p.id),
                    name: p.nameAr || p.productNameAr || p.name
                  }))}
                  valueKey="id"
                  labelKey="name"
                  placeholder={productsLoading ? t("loading", "جارِ التحميل...") : t("select_product", "اختر الصنف")}
                />
              </div>
              <div className="space-y-2 mb-2">
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

              <div className="space-y-2 mb-2">
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
                <Button onClick={handleSearch} disabled={purchasesLoading || purchasesFetching || !filters.productId} className="flex-1 h-9 px-4 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white gap-2 rounded-lg shadow-sm font-bold">
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
              value={rows} paginator 
              paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
              rows={10}
              loading={purchasesLoading || purchasesFetching}
              className="custom-green-table custom-compact-table"
              emptyMessage={!isSearched ? t("click_search_to_view", "اضغط على زر البحث لعرض البيانات") : !searchParams.productId ? t("select_product_first", "اختر صنفاً أولاً لعرض التقرير") : t("no_data", "لا توجد بيانات")}
              responsiveLayout="stack"
            >
              <Column header={t("serial", "م")} body={(_, opt) => <span className="text-sm font-semibold">{opt.rowIndex + 1}</span>} />
              <Column field="date" header={t("date", "التاريخ")} sortable body={(r) => <span className="text-sm">{r.date ? new Date(r.date).toLocaleDateString("en-GB") : "-"}</span>} />
              <Column field="orderNumber" header={t("invoice_number", "رقم الفاتورة")} sortable body={(r) => <span className="text-sm font-bold text-[var(--text-main)]">{r.orderNumber}</span>} />
              <Column field="quantityPurchased" header={t("purchased_quantity", "الكمية المشتراة")} sortable body={(r) => <span className="text-sm font-medium">{r.quantityPurchased}</span>} />
              <Column field="totalPurchases" header="إجمالي الشراء" sortable body={(r) => <span className="text-sm font-bold text-[var(--primary)]">{formatNumber(r.totalPurchases)}</span>} />
            </DataTable>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}