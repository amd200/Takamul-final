import React, { useState, useMemo } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, RotateCcw, FileText, Printer, FileSpreadsheet, UserPlus } from "lucide-react";
import ComboboxField from "@/components/ui/ComboboxField";
import { FinancialStatCard } from "@/components/FinancialStatCard";
import { useGetAllSuppliers } from "@/features/suppliers/hooks/useGetAllSuppliers";
import { useGetSupplierStatement } from "@/features/reports/hooks/Usegetsupplierstatement";
import { useGetAllBranches } from "@/features/Branches/hooks/Usegetallbranches";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Calendar as CalendarIcon, TrendingUp, Receipt, Wallet } from "lucide-react";
import { format } from "date-fns";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { exportCustomPDF, printCustomHTML, generateReportHTML, exportToExcel } from "@/utils/customExportUtils";

const operationTypes = [
  { id: "Purchases", name: "مشتريات" },
  { id: "Payments", name: "مدفوعات" },
];

type FilterState = {
  supplierId: string;
  from: string;
  to: string;
  type: string;
  branchId: string;
};

export default function SupplierStatementReport() {
  const { t, direction } = useLanguage();
  const [pdfLoading, setPdfLoading] = useState(false);

  const [filters, setFilters] = useState<FilterState>(() => {
    const now = new Date();
    return {
      supplierId: "",
      from: new Date(now.getFullYear(), now.getMonth(), 1).toLocaleDateString('en-CA'),
      to: now.toLocaleDateString('en-CA'),
      type: "",
      branchId: "",
    };
  });

  const [isSearched, setIsSearched] = useState(false);
  const [searchParams, setSearchParams] = useState<FilterState>(filters);

  const { data: suppliersResponse, isLoading: suppliersLoading } = useGetAllSuppliers();
  const suppliersList = useMemo(() => suppliersResponse?.items ?? [], [suppliersResponse]);
  const { data: branches = [] } = useGetAllBranches();

  const statementParams = useMemo(
    () => ({
      supplierId: searchParams.supplierId ? Number(searchParams.supplierId) : "",
      from: searchParams.from,
      to: searchParams.to,
      type: searchParams.type || undefined,
    }),
    [searchParams],
  );

  const {
    data: rawReportData,
    isLoading,
    isFetching,
  } = useGetSupplierStatement({
    supplierId: searchParams.supplierId,
    from: searchParams.from,
    to: searchParams.to,
    enabled: isSearched && !!searchParams.supplierId,
  });

  const statementData = isSearched ? rawReportData : undefined;

  const handleSearch = () => {
    setIsSearched(true);
    setSearchParams(filters);
  };

  const handleClear = () => {
    const now = new Date();
    const reset: FilterState = {
      supplierId: "",
      from: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30).toLocaleDateString('en-CA'),
      to: now.toLocaleDateString('en-CA'),
      type: "",
      branchId: "",
    };
    setFilters(reset);
    setIsSearched(false);
    setSearchParams(reset);
  };

  const formatNumber = (value?: number) =>
    Number(value ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("en-GB", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
  };

  const totalDebit = useMemo(() => statementData?.reduce((s, r) => s + (r.debit ?? 0), 0) ?? 0, [statementData]);
  const totalCredit = useMemo(() => statementData?.reduce((s, r) => s + (r.credit ?? 0), 0) ?? 0, [statementData]);
  const totalBalance = useMemo(() => totalDebit - totalCredit, [totalDebit, totalCredit]);

  const selectedSupplierName = suppliersList.find((c) => String(c.id) === searchParams.supplierId)?.supplierName || "";
  const title = t("supplier_account_statement", "كشف حساب مورد");

  const getExportData = () => {
    const fromFmt = searchParams.from ? searchParams.from.split("-").reverse().join("/") : "-";
    const toFmt = searchParams.to ? searchParams.to.split("-").reverse().join("/") : "-";
    const branchName = branches.find((b) => String(b.id) === searchParams.branchId.trim())?.name || t("all", "الكل");

    const filtersInfo = [
      `${t("supplier_name", "اسم المورد")}: ${selectedSupplierName || t("all", "الكل")}`,
      `${t("from_date", "من")}: ${fromFmt}`,
      `${t("to_date", "إلى")}: ${toFmt}`,
      `${t("operation_type", "نوع العملية")}: ${searchParams.type || t("all", "الكل")}`,
    ].join(" | ");

    const summaryCards = [
      { title: t("total_purchases", "إجمالي المشتريات"), value: `${formatNumber(totalDebit)} ${t('sar', 'ر.س')}`, color: "orange" },
      { title: t("total_payments", "إجمالي المدفوعات"), value: `${formatNumber(totalCredit)} ${t('sar', 'ر.س')}`, color: "teal" },
      { title: t("total_debit", "إجمالي المديونية"), value: `${formatNumber(totalBalance)} ${t('sar', 'ر.س')}`, color: "blue" },
    ];

    const columns = [
      { header: t("serial", "م"), field: "serial" },
      { header: t("date", "التاريخ"), field: "date", body: (r: any) => r.date ? new Date(r.date).toLocaleString("en-GB") : "-" },
      { header: t("type", "النوع"), field: "type" },
      { header: t("reference", "المرجع"), field: "reference" },
      { header: direction === "ltr" ? "Due to Supplier" : "المستحق للمورد", field: "debit", body: (r: any) => formatNumber(r.debit) },
      { header: direction === "ltr" ? "Paid to Supplier" : "المسدد للمورد", field: "credit", body: (r: any) => formatNumber(r.credit) },
      { header: t("balance", "الرصيد"), field: "balance", body: (r: any) => formatNumber(r.balance) },
    ];

    return { filtersInfo, summaryCards, columns };
  };

  const handlePrint = () => {
    if (!statementData?.length) return;
    const { filtersInfo, summaryCards, columns } = getExportData();
    const html = generateReportHTML(title, filtersInfo, summaryCards, columns, statementData, t, direction);
    printCustomHTML(title, html);
  };

  const handleExportPDF = async () => {
    if (!statementData?.length) return;
    setPdfLoading(true);
    try {
      const { filtersInfo, summaryCards, columns } = getExportData();
      const html = generateReportHTML(title, filtersInfo, summaryCards, columns, statementData, t, direction);
      await exportCustomPDF(title, html);
    } finally {
      setPdfLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (!statementData?.length) return;
    const { columns } = getExportData();
    exportToExcel(statementData, columns, title);
  };

  return (
    <div dir={direction} className="space-y-4">
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <UserPlus size={20} className="text-[var(--primary)]" />
              {title}
            </CardTitle>
          </div>
          <div className="flex items-center gap-4 text-sm font-medium">
            <button onClick={handlePrint} className="flex items-center gap-1.5 hover:text-[var(--primary)] transition-colors text-slate-600 dark:text-slate-400">
              <Printer size={16} /> <span className="hidden sm:inline">{t("print", "طباعة")}</span>
            </button>
            <button onClick={handleExportPDF} disabled={pdfLoading} className="flex items-center gap-1.5 hover:text-[var(--primary)] transition-colors text-slate-600 dark:text-slate-400 disabled:opacity-50">
              <FileText size={16} /> <span className="hidden sm:inline">{pdfLoading ? t("loading") : "PDF"}</span>
            </button>
            <button onClick={handleExportExcel} className="flex items-center gap-1.5 hover:text-[var(--primary)] transition-colors text-slate-600 dark:text-slate-400">
              <FileSpreadsheet size={16} /> <span className="hidden sm:inline">Excel</span>
            </button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
        
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <FinancialStatCard title={t("total_purchases", "إجمالي المشتريات")} value={formatNumber(isSearched ? totalDebit : 0)} suffix="SAR" icon={TrendingUp} color="orange" />
              <FinancialStatCard title={t("total_payments", "إجمالي المدفوعات")} value={formatNumber(isSearched ? totalCredit : 0)} suffix="SAR" icon={Receipt} color="teal" />
              <FinancialStatCard title={t("total_debit", "إجمالي المديونية")} value={formatNumber(isSearched ? totalBalance : 0)} suffix="SAR" icon={Wallet} color="blue" />
          </div>

          <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-transparent p-4 md:p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 xl:grid-cols-5 gap-4 items-end">
              <div className="lg:col-span-1">
                <Label className="mb-2 text-xs font-medium text-[var(--text-main)]">{t("supplier_name", "اسم المورد")}</Label>
                <ComboboxField value={filters.supplierId} onChange={(val) => setFilters((p) => ({ ...p, supplierId: String(val) }))} items={suppliersList} valueKey="id" labelKey="supplierName" placeholder={suppliersLoading ? t("loading", "جاري التحميل...") : t("select_supplier", "اختر المورد")} disabled={suppliersLoading} />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium text-[var(--text-main)]">{t("from_date", "تاريخ البداية")}</Label>
                <div className="relative flex items-center border border-input rounded-md bg-background">
                  <DatePicker selected={filters.from ? new Date(filters.from.replace(/-/g, '/')) : null} onChange={(date) => setFilters((p) => ({ ...p, from: date ? date.toLocaleDateString('en-CA') : "" }))} dateFormat="dd/MM/yyyy" placeholderText={t("select_date", "يوم/شهر/سنة")} popperPlacement="bottom-start" portalId="root-portal"
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
                <Label className="text-xs font-medium text-[var(--text-main)]">{t("to_date", "تاريخ النهاية")}</Label>
                <div className="relative flex items-center border border-input rounded-md bg-background">
                  <DatePicker selected={filters.to ? new Date(filters.to.replace(/-/g, '/')) : null} onChange={(date) => setFilters((p) => ({ ...p, to: date ? date.toLocaleDateString('en-CA') : "" }))} dateFormat="dd/MM/yyyy" placeholderText={t("select_date", "يوم/شهر/سنة")} popperPlacement="bottom-start" portalId="root-portal"
                    customInput={
                      <div className="flex items-center gap-2 cursor-pointer px-3 h-10 w-full">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-sm">{filters.to ? format(new Date(filters.to.replace(/-/g, '/')), "dd/MM/yyyy") : t("select_date", "يوم/شهر/سنة")}</span>
                      </div>
                    }
                  />
                </div>
              </div>

              <div className="space-y-2 lg:col-span-1">
                <Label className="text-xs font-medium text-[var(--text-main)]">{t("operation_type", "نوع العملية")}</Label>
                <Select value={filters.type} onValueChange={(val) => setFilters((p) => ({ ...p, type: val === "__all__" ? "" : val }))}>
                  <SelectTrigger className="w-full h-10 border-slate-200 dark:border-slate-800 text-sm">
                    <SelectValue placeholder={t("select_type", "اختر النوع")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">{t("all", "الكل")}</SelectItem>
                    {operationTypes.map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-row items-end gap-2 lg:col-span-1">
                <Button onClick={handleSearch} disabled={isLoading || isFetching || !filters.supplierId} className="flex-1 h-9 px-4 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white gap-2 rounded-lg shadow-sm font-bold">
                  <Search size={16} /> {t("search", "بحث")}
                </Button>
                <Button onClick={handleClear} variant="outline" className="h-9 px-3 gap-1 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                  <RotateCcw size={15} className="text-[var(--primary)]" />
                </Button>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-100 dark:border-slate-800 overflow-hidden">
            <DataTable value={statementData || []} loading={isLoading || isFetching} paginator rows={10} className="custom-green-table custom-compact-table" emptyMessage={!isSearched ? t("click_search_to_view", "اضغط على زر البحث لعرض البيانات") : !searchParams.supplierId ? t("select_supplier_first", "اختر مورداً أولاً لعرض الكشف") : t("no_data", "لا توجد بيانات")} responsiveLayout="scroll">
              <Column header={t("serial", "م")} body={(_, opt) => <span className="text-sm font-semibold">{opt.rowIndex + 1}</span>} style={{ width: "3rem" }} />
              <Column field="date" header={t("date", "التاريخ")} sortable style={{ width: "9rem" }} body={(r) => <span className="text-sm whitespace-nowrap">{formatDate(r.date)}</span>} />
              <Column field="type" header={t("type", "النوع")} sortable style={{ width: "6rem" }} body={(r) => <span className="text-sm font-medium text-[var(--text-main)]">{r.type}</span>} />
              <Column
                field="reference"
                header={t("reference", "المرجع")}
                sortable
                style={{ width: "14rem", maxWidth: "14rem" }}
                body={(r) => (
                  <span
                    className="text-sm font-medium text-[var(--text-main)] block truncate"
                    style={{ maxWidth: "14rem" }}
                    title={r.reference}
                  >
                    {r.reference}
                  </span>
                )}
              />
              <Column field="debit" header={t("supplier_due", "المستحق للمورد")} sortable style={{ width: "8rem" }} body={(r) => <span className="text-sm text-red-500">{r.debit > 0 ? formatNumber(r.debit) : "-"}</span>} />
              <Column field="credit" header={t("supplier_paid", "المسدد للمورد")} sortable style={{ width: "8rem" }} body={(r) => <span className="text-sm text-green-600">{r.credit > 0 ? formatNumber(r.credit) : "-"}</span>} />
              <Column field="balance" header={t("balance", "الرصيد")} sortable style={{ width: "8rem" }} body={(r) => <span className={`text-sm font-semibold ${r.balance >= 0 ? "text-blue-600" : "text-red-500"}`}>{formatNumber(r.balance)}</span>} />
            </DataTable>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}