import React, { useState, useMemo } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, RotateCcw, FileText, Printer, FileSpreadsheet, Users } from "lucide-react";
import ComboboxField from "@/components/ui/ComboboxField";
import { FinancialStatCard } from "@/components/FinancialStatCard";
import { useGetAllCustomers } from "@/features/customers/hooks/useGetAllCustomers";
import { useGetCustomerStatement } from "@/features/reports/hooks/Usegetcustomerstatement";
import { useGetAllBranches } from "@/features/Branches/hooks/Usegetallbranches";
import formatDate from "@/lib/formatDate";
import { format } from "date-fns";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Calendar as CalendarIcon, TrendingUp, Receipt, Wallet } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { exportCustomPDF, printCustomHTML, generateReportHTML, exportToExcel } from "@/utils/customExportUtils";

const operationTypes = [
  { id: "Sales", name: "مبيعات" },
  { id: "Collections", name: "تحصيلات" },
];

type FilterState = {
  customerId: string;
  from: string;
  to: string;
  type: string;
  branchId?: string;
};

export default function CustomerStatementReport() {
  const { t, direction } = useLanguage();
  const [pdfLoading, setPdfLoading] = useState(false);

  const [filters, setFilters] = useState<FilterState>(() => {
    const now = new Date();
    return {
      customerId: "",
      from: new Date(now.getFullYear(), now.getMonth(), 1).toLocaleDateString('en-CA'),
      to: now.toLocaleDateString('en-CA'),
      type: "",
      branchId: "",
    };
  });

  const [isSearched, setIsSearched] = useState(false);
  const [searchParams, setSearchParams] = useState<FilterState>(filters);

  const { data: customersResponse, isLoading: customersLoading } = useGetAllCustomers({ limit: 500 });
  const customersList = useMemo(() => customersResponse?.items ?? [], [customersResponse]);
  const { data: branches = [] } = useGetAllBranches();

  const statementParams = useMemo(
    () => ({
      customerId: searchParams.customerId ? Number(searchParams.customerId) : "",
      from: searchParams.from,
      to: searchParams.to,
      type: searchParams.type || undefined,
      branchId: searchParams.branchId || undefined,
    }),
    [searchParams],
  );

  const {
    data: rawReportData,
    isLoading,
    isFetching,
  } = useGetCustomerStatement({
    customerId: searchParams.customerId,
    from: searchParams.from,
    to: searchParams.to,
    enabled: isSearched && !!searchParams.customerId,
  });

  const statementData = isSearched ? rawReportData : undefined;

  const handleSearch = () => {
    setIsSearched(true);
    setSearchParams(filters);
  };

  const handleClear = () => {
    const now = new Date();
    const reset: FilterState = {
      customerId: "",
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

  const totalDebit = useMemo(() => statementData?.reduce((s, r) => s + (r.debit ?? 0), 0) ?? 0, [statementData]);
  const totalCredit = useMemo(() => statementData?.reduce((s, r) => s + (r.credit ?? 0), 0) ?? 0, [statementData]);
  const totalBalance = useMemo(() => totalDebit - totalCredit, [totalDebit, totalCredit]);

  const selectedCustomerName = customersList.find((c) => String(c.id) === searchParams.customerId)?.customerName || "";
  const title = t("customer_account_statement", "كشف حساب عميل");

  const getExportData = () => {
    const fromFmt = searchParams.from ? searchParams.from.split("-").reverse().join("/") : "-";
    const toFmt = searchParams.to ? searchParams.to.split("-").reverse().join("/") : "-";
    const branchName = branches.find((b) => String(b.id) === searchParams.branchId?.trim())?.name || t("all", "الكل");

    const filtersInfo = [
      `${t("customer_name", "اسم العميل")}: ${selectedCustomerName || t("all", "الكل")}`,
      `${t("from_date", "من")}: ${fromFmt}`,
      `${t("to_date", "إلى")}: ${toFmt}`,
      `${t("operation_type", "نوع العملية")}: ${searchParams.type || t("all", "الكل")}`,
    ].join(" | ");

    const summaryCards = [
      { title: t("total_sales", "إجمالي المبيعات"), value: `${formatNumber(totalDebit)} ${t('sar', 'ر.س')}`, color: "orange" },
      { title: t("total_collections", "إجمالي التحصيلات"), value: `${formatNumber(totalCredit)} ${t('sar', 'ر.س')}`, color: "teal" },
      { title: t("total_debit", "إجمالي المديونية"), value: `${formatNumber(totalBalance)} ${t('sar', 'ر.س')}`, color: "blue" },
    ];

    const columns = [
      { header: t("serial", "م"), field: "serial" },
      { header: t("date", "التاريخ"), field: "date", body: (r: any) => r.date ? new Date(r.date).toLocaleString("en-GB") : "-" },
      { header: t("type", "النوع"), field: "type" },
      { header: t("reference", "المرجع"), field: "reference" },
      { header: direction === "ltr" ? "Due on Customer" : "المستحق على العميل", field: "debit", body: (r: any) => formatNumber(r.debit) },
      { header: direction === "ltr" ? "Paid by Customer" : "المسدد من العميل", field: "credit", body: (r: any) => formatNumber(r.credit) },
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
              <Users size={20} className="text-[var(--primary)]" />
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
          {/* Summary Cards */}
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <FinancialStatCard title={t("total_sales", "إجمالي المبيعات")} value={formatNumber(isSearched ? totalDebit : 0)} suffix="SAR" icon={TrendingUp} color="orange" />
            <FinancialStatCard title={t("total_collections", "إجمالي التحصيلات")} value={formatNumber(isSearched ? totalCredit : 0)} suffix="SAR" icon={Receipt} color="teal" />
            <FinancialStatCard title={t("total_debit", "إجمالي المديونية")} value={formatNumber(isSearched ? totalBalance : 0)} suffix="SAR" icon={Wallet} color="blue" />
          </div>

          <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-transparent p-4 md:p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 xl:grid-cols-5 gap-4 items-end">
              <div className="lg:col-span-1">
                <Label className="mb-2 text-xs font-medium text-text-main">{t("customer_name", "اسم العميل")}</Label>
                <ComboboxField value={filters.customerId} onChange={(val) => setFilters((p) => ({ ...p, customerId: String(val) }))} items={customersList} valueKey="id" labelKey="customerName" placeholder={customersLoading ? t("loading", "جاري التحميل...") : t("select_customer", "اختر العميل")} disabled={customersLoading} />
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

              <div className="flex flex-row items-end gap-2  lg:col-span-1">
                <Button onClick={handleSearch} disabled={isLoading || isFetching || !filters.customerId} className="flex-1 h-9 px-4 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white gap-2 rounded-lg shadow-sm font-bold">
                  <Search size={16} /> {t("search", "بحث")}
                </Button>
                <Button onClick={handleClear} variant="outline" className="h-9 px-3 gap-1 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                  <RotateCcw size={15} className="text-[var(--primary)]" />
                </Button>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-100 dark:border-slate-800 overflow-hidden">
            <DataTable value={statementData || []} loading={isLoading || isFetching} paginator rows={10} className="custom-green-table custom-compact-table" emptyMessage={!isSearched ? t("click_search_to_view", "اضغط على زر البحث لعرض البيانات") : !searchParams.customerId ? t("select_customer_first", "اختر عميلاً أولاً لعرض الكشف") : t("no_data", "لا توجد بيانات")} responsiveLayout="stack">
              <Column header={t("serial", "م")} body={(_, opt) => <span className="text-sm font-semibold">{opt.rowIndex + 1}</span>} className="w-16" />
              <Column field="date" header={t("date", "التاريخ")} sortable body={(r) => <span className="text-sm whitespace-nowrap">{formatDate(r.date)}</span>} />
              <Column field="type" header={t("type", "النوع")} sortable body={(r) => <span className="text-sm font-medium text-[var(--text-main)]">{r.type}</span>} />
              <Column field="reference" header={t("reference", "المرجع")} sortable body={(r) => <span className="text-sm font-medium text-[var(--text-main)]">{r.reference}</span>} />
              <Column field="debit" header={t("due_customer", "المستحق على العميل")} sortable body={(r) => <span className="text-sm text-red-500">{r.debit > 0 ? formatNumber(r.debit) : "-"}</span>} />
              <Column field="credit" header={t("paid_customer", "المسدد من العميل")} sortable body={(r) => <span className="text-sm text-green-600">{r.credit > 0 ? formatNumber(r.credit) : "-"}</span>} />
              <Column field="balance" header={t("balance", "الرصيد")} sortable body={(r) => <span className={`text-sm font-semibold ${r.balance >= 0 ? "text-blue-600" : "text-red-500"}`}>{formatNumber(r.balance)}</span>} />
            </DataTable>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}