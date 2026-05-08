import React, { useState, useMemo } from "react";
import {
  SaudiRiyal,
  Printer,
  FileText,
  FileSpreadsheet,
  Search,
  RotateCcw,
  Calendar as CalendarIcon,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useGetProfitReport } from "@/features/reports/hooks/Usegetprofitreport";
import { useGetAllBranches } from "@/features/Branches/hooks/Usegetallbranches";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";
import { useAuthStore } from "@/store/authStore";
import { Permissions } from "@/lib/permissions";
import { format } from "date-fns";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Label } from "@/components/ui/label";
import {
  printCustomHTML,
  exportCustomPDF,
  exportToExcel,
} from "@/utils/customExportUtils";

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

type ProfitRow = {
  id: string;
  label: string;
  value: number;
  isGray?: boolean;
  isNet?: boolean;
};

// ✅ Custom profit report HTML — cards layout like screenshot
function generateProfitHTML(
  title: string,
  filtersInfo: string,
  rows: ProfitRow[],
  netProfit: number,
  formatNumber: (v: number) => string,
  direction: string,
  t: (k: string, fb?: string) => string
): string {
  const now = new Date().toLocaleString(direction === "rtl" ? "ar-EG" : "en-GB");

  // كل بند له لون شريط مختلف
  const barColors = ["#3b82f6", "#f97316", "#22c55e", "#ef4444"];

  const cardsHTML = rows
    .map(
      (row, i) => `
      <div style="
        display:flex;
        align-items:center;
        justify-content:space-between;
        border:1px solid #e2e8f0;
        border-radius:10px;
        padding:0;
        margin-bottom:14px;
        overflow:hidden;
        background:#fff;
        box-shadow:0 1px 3px rgba(0,0,0,0.05);
        direction:${direction};
      ">
        <!-- Label side -->
        <div style="
          display:flex;
          align-items:center;
          gap:0;
          flex:1;
        ">
          <div style="
            width:6px;
            align-self:stretch;
            background:${barColors[i] || "#94a3b8"};
            border-radius:0;
            flex-shrink:0;
          "></div>
          <div style="padding:18px 20px;font-size:15px;font-weight:800;color:#0f172a;">
            ${row.label}
          </div>
        </div>
        <!-- Value side -->
        <div style="
          display:flex;
          align-items:center;
          gap:10px;
          padding:18px 20px;
          border-${direction === "rtl" ? "right" : "left"}:1px solid #e2e8f0;
          min-width:160px;
          justify-content:flex-end;
        ">
          <span style="font-size:19px;font-weight:900;color:#0f172a;">${formatNumber(row.value)}</span>
          <div style="
            width:5px;
            height:40px;
            background:${barColors[i] || "#94a3b8"};
            border-radius:3px;
            flex-shrink:0;
          "></div>
        </div>
      </div>`
    )
    .join("");

  // Net profit card
  const netCard = `
    <div style="
      display:flex;
      align-items:center;
      justify-content:space-between;
      border:2px solid #22c55e;
      border-radius:10px;
      margin-bottom:14px;
      overflow:hidden;
      background:rgba(34,197,94,0.04);
      box-shadow:0 1px 4px rgba(34,197,94,0.15);
      direction:${direction};
    ">
      <div style="display:flex;align-items:center;flex:1;">
        <div style="width:6px;align-self:stretch;background:#22c55e;flex-shrink:0;"></div>
        <div style="padding:20px 20px;font-size:15px;font-weight:800;color:#15803d;">
          ${t("net_profit", "الربح الصافي")}
        </div>
      </div>
      <div style="
        display:flex;
        align-items:center;
        gap:10px;
        padding:20px 20px;
        border-${direction === "rtl" ? "right" : "left"}:2px solid #22c55e;
        min-width:160px;
        justify-content:flex-end;
      ">
        <span style="font-size:20px;font-weight:800;color:#16a34a;">${formatNumber(netProfit)}</span>
        <div style="width:5px;height:40px;background:#22c55e;border-radius:3px;flex-shrink:0;"></div>
      </div>
    </div>`;

  const filtersArray = filtersInfo.split(" | ");
  const filtersHTML = filtersArray
    .map((f) => {
      const [label, ...rest] = f.split(": ");
      return `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:5px 12px;display:inline-flex;align-items:center;gap:5px;white-space:nowrap;">
        <span style="font-size:11px;color:#64748b;font-weight:700;">${label}:</span>
        <span style="font-size:11px;color:#0f172a;font-weight:700;">${rest.join(": ") || "-"}</span>
      </div>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html dir="${direction}" lang="${direction === "rtl" ? "ar" : "en"}">
<head>
  <meta charset="UTF-8"/>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet"/>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Cairo', Arial, sans-serif;
      background: #fff;
      color: #0f172a;
      padding: 28px 32px;
      width: 794px;
      direction: ${direction};
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    @media print {
      body { padding: 10px 14px; width: 100%; }
      @page { margin: 10mm 8mm; }
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;padding-bottom:14px;border-bottom:2px solid #e2e8f0;">
    <div style="font-size:15px;font-weight:800;color:#1e40af;">${t("takamul_data", "تكامل البيانات")}</div>
    <h1 style="font-size:20px;font-weight:800;color:#0f172a;">${title}</h1>
    <div style="font-size:11px;color:#64748b;">${now}</div>
  </div>

  <!-- Filters -->
  <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:24px;direction:${direction};">
    ${filtersHTML}
  </div>

  <!-- Cards -->
  <div style="direction:${direction};">
    ${cardsHTML}
    ${netCard}
  </div>

  <!-- Footer -->
  <div style="margin-top:28px;padding-top:10px;border-top:1px solid #e2e8f0;font-size:10px;color:#94a3b8;text-align:center;">
    ${t("printed_via_takamul", "تمت الطباعة عبر نظام تكامل لإدارة البيانات")}
  </div>
</body>
</html>`;
}

export default function ProfitReport() {
  const { t, direction } = useLanguage();
  const [pdfLoading, setPdfLoading] = useState(false);

  const [filters, setFilters] = useState<FilterState>(() => {
    const now = new Date();
    return {
      branchId: " ",
      fiscalYear: now.getFullYear().toString(),
      fiscalQuarter: "",
      from: new Date(now.getFullYear(), now.getMonth(), 1).toLocaleDateString('en-CA'),
      to: now.toLocaleDateString('en-CA'),
    };
  });

  const [isSearched, setIsSearched] = useState(false);
  const [searchParams, setSearchParams] = useState<FilterState>(filters);

  const { data: profitData, isLoading, isFetching } = useGetProfitReport({
    branchid: searchParams.branchId.trim() || undefined,
    from: searchParams.from,
    to: searchParams.to,
    enabled: isSearched,
  });

  const { data: branches = [] } = useGetAllBranches();

  const handleSearch = () => {
    setIsSearched(true);
    setSearchParams(filters);
  };
  const handleClear = () => {
    setIsSearched(false);
    const now = new Date();
    const reset = {
      branchId: " ",
      fiscalYear: now.getFullYear().toString(),
      fiscalQuarter: "",
      from: new Date(now.getFullYear(), now.getMonth(), 1).toLocaleDateString('en-CA'),
      to: now.toLocaleDateString('en-CA'),
    };
    setFilters(reset);
    setSearchParams(reset);
  };

  const formatNumber = (value?: number) =>
    Number(value ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const profitRows: ProfitRow[] = [
    { id: "1", label: t("total_sales", "إجمالي المبيعات"), value: profitData?.totalSales ?? 0 },
    { id: "2", label: t("cost_of_total_sales", "تكلفة المبيعات"), value: profitData?.totalCostOfSales ?? 0 },
    { id: "3", label: t("gross_profit", "مجمل الربح"), value: profitData?.grossProfit ?? 0, isGray: true },
    { id: "4", label: t("total_expenses", "إجمالي المصروفات"), value: profitData?.totalExpenses ?? 0 },
  ];

  const title = t("profit_report", "تقرير الأرباح");

  const getFiltersInfo = () => {
    const b = branches.find((x) => String(x.id) === searchParams.branchId.trim());
    const qLabel = FISCAL_QUARTERS.find((q) => q.value === searchParams.fiscalQuarter)?.label || t("none", "لا يوجد");
    return [
      `${t("branch", "الفرع")}: ${b ? b.name : t("all", "الكل")}`,
      `${t("fiscal_year", "السنة المالية")}: ${searchParams.fiscalYear}`,
      `${t("fiscal_quarter", "الربع المالي")}: ${qLabel}`,
      `${t("from", "من")}: ${searchParams.from}`,
      `${t("to", "إلى")}: ${searchParams.to}`,
    ].join(" | ");
  };

  const handlePrint = () => {
    if (!profitData) return;
    const html = generateProfitHTML(title, getFiltersInfo(), profitRows, profitData?.netProfit ?? 0, formatNumber, direction, t);
    printCustomHTML(title, html);
  };

  const handleExportPDF = async () => {
    if (!profitData) return;
    setPdfLoading(true);
    try {
      const html = generateProfitHTML(title, getFiltersInfo(), profitRows, profitData?.netProfit ?? 0, formatNumber, direction, t);
      await exportCustomPDF(title, html);
    } finally {
      setPdfLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (!profitData) return;
    const exportData = [
      ...profitRows,
      { id: "net", label: t("net_profit", "صافي الربح"), value: profitData?.netProfit ?? 0 },
    ];
    const exportColumns = [
      { header: t("serial", "م"), field: "serial" },
      { header: t("item", "البند"), field: "label" },
      { header: t("amount", "المبلغ"), field: "value", body: (r: any) => formatNumber(r.value) },
    ];
    exportToExcel(exportData, exportColumns, title);
  };

  const hasAnyPermission = useAuthStore((state) => state.hasAnyPermission);

  return (
    <div dir={direction} className="space-y-4">
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <SaudiRiyal size={20} className="text-[var(--primary)]" />
              {title}
            </CardTitle>
          </div>
          <div className="flex items-center gap-4 text-sm font-medium">
            <button onClick={handlePrint} className="flex items-center gap-1.5 hover:text-[var(--primary)] transition-colors text-slate-600 dark:text-slate-400">
              <Printer size={16} /> <span className="hidden sm:inline">{t("print", "طباعة")}</span>
            </button>
            <button onClick={handleExportPDF} disabled={pdfLoading} className="flex items-center gap-1.5 hover:text-[var(--primary)] transition-colors text-slate-600 dark:text-slate-400 disabled:opacity-50">
              <FileText size={16} /> <span className="hidden sm:inline">PDF</span>
            </button>
            <button onClick={handleExportExcel} className="flex items-center gap-1.5 hover:text-[var(--primary)] transition-colors text-slate-600 dark:text-slate-400">
              <FileSpreadsheet size={16} /> <span className="hidden sm:inline">Excel</span>
            </button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Filters Card */}
          <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-transparent p-4 md:p-5">
            <div className="flex flex-wrap gap-3 items-end">
              {hasAnyPermission([Permissions?.branches?.all, Permissions?.branches?.view]) && (
                <div className="space-y-2 min-w-[130px] flex-1">
                  <Label className="text-xs font-medium text-text-main">{t("branch", "الفرع")}</Label>
                  <Select value={filters.branchId} onValueChange={(val) => setFilters((p) => ({ ...p, branchId: val }))}>
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

              <div className="space-y-2 min-w-[120px] flex-1">
                <Label className="text-xs font-medium text-text-main">{t("fiscal_year", "السنة المالية")}</Label>
                <Select value={filters.fiscalYear} onValueChange={(val) => setFilters((prev) => ({ ...prev, fiscalYear: val, fiscalQuarter: "" }))}>
                  <SelectTrigger className="w-full h-10 border-slate-200 dark:border-slate-800 text-sm">
                    <SelectValue placeholder={t("select_year", "اختر السنة")} />
                  </SelectTrigger>
                  <SelectContent>
                    {FISCAL_YEARS.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 min-w-[160px] flex-1">
                <Label className="text-xs font-medium text-text-main">{t("fiscal_quarter", "الربع المالي")}</Label>
                <Select
                  value={filters.fiscalQuarter}
                  onValueChange={(val) => {
                    const q = FISCAL_QUARTERS.find((item) => item.value === val);
                    if (q) {
                      setFilters((prev) => ({ ...prev, fiscalQuarter: val, from: prev.fiscalYear + q.from, to: prev.fiscalYear + q.to }));
                    } else {
                      setFilters((prev) => ({ ...prev, fiscalQuarter: val }));
                    }
                  }}
                >
                  <SelectTrigger className="w-full h-10 border-slate-200 dark:border-slate-800 text-sm">
                    <SelectValue placeholder={t("select_quarter", "اختر الربع")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=" ">{t("none", "لا يوجد")}</SelectItem>
                    {FISCAL_QUARTERS.map((q) => <SelectItem key={q.value} value={q.value}>{q.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 min-w-[140px] flex-1">
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

              <div className="space-y-2 min-w-[140px] flex-1">
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
                        <span className="text-sm">{filters.to ? format(new Date(filters.to.replace(/-/g, '/')), "dd/MM/yyyy") : t("select_date", "يوم/شهر/سنة")}</span>
                      </div>
                    }
                  />
                </div>
              </div>

              <div className="flex flex-row items-end gap-2">
                <Button onClick={handleSearch} disabled={isLoading || isFetching} className="h-10 px-5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white gap-2 rounded-lg shadow-sm font-bold whitespace-nowrap">
                  <Search size={16} /> {t("search", "بحث")}
                </Button>
                <Button onClick={handleClear} variant="outline" className="h-10 px-3 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                  <RotateCcw size={15} className="text-[var(--primary)]" />
                </Button>
              </div>
            </div>
          </div>

          {isSearched ? (
            <>
              {/* Table */}
              <div className="rounded-xl border border-gray-100 dark:border-slate-800 overflow-hidden shadow-sm mt-8">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50/50 dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800">
                    <tr>
                      <th className="px-6 py-3 text-start font-bold text-slate-900 dark:text-white w-16">{t("serial", "م")}</th>
                      <th className="px-6 py-3 text-start font-bold text-slate-900 dark:text-white">{t("item", "البند")}</th>
                      <th className="px-6 py-3 text-end font-bold text-slate-900 dark:text-white">{t("amount", "المبلغ")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profitRows.map((row, i) => (
                      <tr key={row.id} className={`border-b border-gray-100 dark:border-slate-800 ${row.isGray ? "bg-gray-50/50 dark:bg-slate-900/40" : ""}`}>
                        <td className="px-6 py-4 font-semibold text-slate-500">{i + 1}</td>
                        <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">{row.label}</td>
                        <td className="px-6 py-4 text-end">
                          <span className="text-sm font-bold text-slate-900 dark:text-white">{formatNumber(row.value)}</span>
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-[rgba(49,201,110,0.05)] border-t-2 border-[var(--primary)]">
                      <td className="px-6 py-5 font-bold text-[var(--text-main)]">{profitRows.length + 1}</td>
                      <td className="px-6 py-5 text-base font-bold text-[var(--text-main)]">{t("net_profit", "صافي الربح")}</td>
                      <td className="px-6 py-5 text-end">
                        <span className="text-base font-bold text-[var(--primary)]">{formatNumber(profitData?.netProfit)}</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 dark:bg-slate-900/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 mt-8">
              <div className="p-4 bg-white dark:bg-slate-900 rounded-full shadow-sm mb-4">
                <Search className="w-8 h-8 text-[var(--primary)] opacity-20" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-medium">
                {t("click_search_to_view", "اضغط على زر البحث لعرض البيانات")}
              </p>
            </div>
          )}
            
          
       
        </CardContent>
      </Card>
    </div>
  );
}