import React, { useState, useMemo } from "react";
import { Search, FileText, FileSpreadsheet, Printer, RotateCcw, RefreshCw, Clock, User, CreditCard, DollarSign, Wallet, ShoppingBag, Eye, Calendar as CalendarIcon, TrendingUp, BarChart2 } from "lucide-react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useLanguage } from "@/context/LanguageContext";
import { FinancialStatCard } from "@/components/FinancialStatCard";
import { Input } from "@/components/ui/input";
import { generateReportHTML, printCustomHTML, exportCustomPDF, exportToExcel } from "@/utils/customExportUtils";
import { useGetAllShifts } from "@/features/shifts/hooks/useShifts";
import { Skeleton } from "@/components/ui/skeleton";
import { Shift } from "@/features/shifts/types/shifts.types";
import ShiftReportModal from "@/components/pos/modals/ShiftReportModal";
import { Button } from "@/components/ui/button";
import { useGetAllBranches } from "@/features/Branches/hooks/Usegetallbranches";
import { useAuthStore } from "@/store/authStore";
import { Permissions } from "@/lib/permissions";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function ShiftsReport() {
  const { t, direction, language } = useLanguage();
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [selectedShiftId, setSelectedShiftId] = useState<number | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const [filters, setFilters] = useState({
    branchId: " ",
    from: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split("T")[0],
    to: new Date().toISOString().split("T")[0],
  });

  const [searchParams, setSearchParams] = useState(filters);

  const { data: shiftsData, isLoading } = useGetAllShifts();
  const { data: branches = [] } = useGetAllBranches();
  const hasAnyPermission = useAuthStore((state) => state.hasAnyPermission);

  const allShifts = useMemo(() => {
    return Array.isArray(shiftsData) ? shiftsData : (shiftsData as any)?.items || (shiftsData as any)?.data || [];
  }, [shiftsData]);

  // Client-side filtering
  const filteredShifts = useMemo(() => {
    return allShifts.filter((shift: Shift) => {
      const shiftDate = new Date(shift.shiftDate).getTime();
      const fromDate = new Date(searchParams.from).getTime();
      const toDate = new Date(searchParams.to).getTime();

      const branchMatch = searchParams.branchId.trim() === "" || String(shift.branchName).includes(searchParams.branchId.trim()) || searchParams.branchId === " ";
      // Note: branchId filtering might need real branchId if available in Shift type, for now using name matching or ignoring

      return shiftDate >= fromDate && shiftDate <= toDate;
    });
  }, [allShifts, searchParams]);

  const summary = useMemo(() => {
    return filteredShifts.reduce(
      (acc: any, shift: Shift) => {
        acc.totalSales += shift.totalSales || 0;
        acc.totalExpenses += shift.totalExpenses || 0;
        acc.totalPurchases += shift.totalPurchases || 0;
        if (shift.status === "Open") acc.activeShifts++;
        return acc;
      },
      { totalSales: 0, totalExpenses: 0, totalPurchases: 0, activeShifts: 0 },
    );
  }, [filteredShifts]);

  const fmt = (n: number) => (n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleSearch = () => {
    setSearchParams(filters);
  };

  const handleClear = () => {
    const reset = {
      branchId: " ",
      from: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split("T")[0],
      to: new Date().toISOString().split("T")[0],
    };
    setFilters(reset);
    setSearchParams(reset);
  };
  const reportTitle = t("shifts_report", "تقرير الورديات");

  const handlePrint = () => {
    const columns = [
      { header: t("serial", "م"), field: "serial" },
      { header: t("shift_id", "رقم الوردية"), field: "id" },
      { header: t("open_time", "وقت الافتتاح"), field: "startTime" },
      { header: t("user", "المستخدم"), field: "employeeName" },
      { header: t("sales", "المبيعات"), field: "totalSales" },
      { header: t("expenses", "المصاريف"), field: "totalExpenses" },
      { header: t("total", "صافي الوردية"), field: "netTotal" },
    ];

    const data = filteredShifts.map((s) => ({
      ...s,
      totalSales: fmt(s.totalSales),
      totalExpenses: fmt(s.totalExpenses),
      netTotal: fmt(s.netTotal),
    }));

    const summaryCards: any[] = [];

    const html = generateReportHTML(reportTitle, t("all_shifts", "جميع الورديات"), summaryCards, columns, data, t, direction);
    printCustomHTML(reportTitle, html);
  };

  const handleExportPDF = async () => {
    setPdfLoading(true);
    try {
      const columns = [
        { header: t("serial", "م"), field: "serial" },
        { header: t("shift_id", "رقم الوردية"), field: "id" },
        { header: t("user", "المستخدم"), field: "employeeName" },
        { header: t("total", "صافي الوردية"), field: "netTotal" },
      ];

      const data = filteredShifts.map((s) => ({
        id: s.id,
        employeeName: s.employeeName,
        netTotal: fmt(s.netTotal),
      }));

      const summaryCards: any[] = [];

      const html = generateReportHTML(reportTitle, t("all_shifts", "جميع الورديات"), summaryCards, columns, data, t, direction);
      await exportCustomPDF(reportTitle, html);
    } finally {
      setPdfLoading(false);
    }
  };

  const handleExportExcel = () => {
    const columns = [
      { header: t("serial", "م"), field: "serial" },
      { header: t("shift_id", "رقم الوردية"), field: "id" },
      { header: t("open_time", "وقت الافتتاح"), field: "startTime" },
      { header: t("user", "المستخدم"), field: "employeeName" },
      { header: t("sales", "المبيعات"), field: "totalSales" },
      { header: t("expenses", "المصاريف"), field: "totalExpenses" },
      { header: t("total", "صافي الوردية"), field: "netTotal" },
    ];
    exportToExcel(filteredShifts, columns, reportTitle);
  };

  const actionsTemplate = (rowData: Shift) => {
    return (
      <div className="flex items-center justify-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="text-blue-500 hover:bg-blue-50 h-8 w-8 rounded-full"
          onClick={() => {
            setSelectedShiftId(rowData.id);
            setIsReportModalOpen(true);
          }}
          title={t("view_details") || "عرض التفاصيل"}
        >
          <Eye size={16} />
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-12" dir={direction}>
      <Card className="border-none shadow-sm overflow-hidden bg-white dark:bg-slate-950">
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
          <div>
            <CardTitle className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-[var(--primary)]" />
              {reportTitle}
            </CardTitle>
            <CardDescription className="mt-1">{t("customize_report_below", "تخصيص التقرير أدناه")}</CardDescription>
          </div>

          <div className="flex items-center gap-4 text-sm font-medium">
            <button onClick={handlePrint} className="flex items-center gap-1.5 hover:text-[var(--primary)] transition-colors text-slate-600 dark:text-slate-400">
              <Printer size={16} /> <span className="hidden sm:inline">{t("print", "طباعة")}</span>
            </button>
            <button onClick={handleExportPDF} disabled={pdfLoading} className="flex items-center gap-1.5 hover:text-[var(--primary)] transition-colors text-slate-600 dark:text-slate-400">
              <FileText size={16} /> <span className="hidden sm:inline">{pdfLoading ? t("loading") : "PDF"}</span>
            </button>
            <button onClick={handleExportExcel} className="flex items-center gap-1.5 hover:text-[var(--primary)] transition-colors text-slate-600 dark:text-slate-400">
              <FileSpreadsheet size={16} /> <span className="hidden sm:inline">Excel</span>
            </button>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <div className="mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input type="text" value={globalFilterValue} onChange={(e) => setGlobalFilterValue(e.target.value)} placeholder={t("search_placeholder", "بحث...")} className="pl-10 h-11 bg-slate-50 border-none rounded-xl" />
            </div>
            {globalFilterValue && (
              <button onClick={() => setGlobalFilterValue("")} className="text-slate-400 hover:text-slate-600 transition-colors bg-slate-100 p-2 rounded-lg">
                <RotateCcw size={16} />
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : (
            <DataTable value={allShifts} paginator paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink" rows={10} className="custom-green-table no-wrap-header text-xs" dataKey="id" emptyMessage={t("no_data", "لا توجد بيانات")} globalFilter={globalFilterValue} scrollable scrollHeight="600px">
              <Column header={t("serial", "م")} body={(_, opt) => <span className="text-sm font-semibold">{opt.rowIndex + 1}</span>} className="w-16" />
              <Column header={t("shift_id", "رقم الوردية")} field="id" sortable body={(r) => <span className="font-bold">{r.id}</span>} />
              <Column
                header={t("open_time", "وقت الافتتاح")}
                field="startTime"
                body={(row) => {
                  if (!row.startTime) return "---";
                  try {
                    // Handle "HH:mm:ss" format
                    const [hours, minutes] = row.startTime.split(":");
                    const date = new Date();
                    date.setHours(parseInt(hours), parseInt(minutes));
                    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
                  } catch (e) {
                    return row.startTime;
                  }
                }}
                sortable
              />
              <Column header={t("close_time", "وقت الاغلاق")} field="endTime" sortable body={(r) => <span className={!r.endTime ? "text-blue-500 font-medium" : ""}>{r.endTime}</span>} />
              <Column header={t("user", "المستخدم")} field="employeeName" sortable className="max-w-[200px] overflow-hidden truncate" />
              <Column header={t("status", "الحالة")} field="isActive" sortable body={(r) => <span className={!r.isActive ? "text-blue-500 font-medium" : ""}>{r.isActive || t("closed", "مغلقة")}</span>} />
              <Column header={t("total", "الإجمالي")} body={(r) => <span className="font-bold text-[var(--primary)]">{fmt(r.netTotal)}</span>} />
              <Column header={t("actions", "العمليات")} body={actionsTemplate} className="text-center w-24" />
            </DataTable>
          )}
        </CardContent>
      </Card>

      {isReportModalOpen && selectedShiftId && <ShiftReportModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} shiftId={selectedShiftId} showCloseButton={false} />}
    </div>
  );
}
