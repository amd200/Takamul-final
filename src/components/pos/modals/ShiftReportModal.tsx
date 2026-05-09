import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Lock, X, FileText, Wallet, ReceiptText } from "lucide-react";
import { printShiftReport, ShiftReportData } from "../orders/printShiftReport";
import { cn } from "@/lib/utils";

import { useGetShiftReport } from "@/features/shifts/hooks/useShifts";
import { Skeleton } from "@/components/ui/skeleton";
import { useSettingsStore } from "@/features/settings/store/settingsStore";

interface ShiftReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  shiftId: number;
  onConfirmCloseShift?: () => void;
  showCloseButton?: boolean;
}

export default function ShiftReportModal({ isOpen, onClose, shiftId, onConfirmCloseShift, showCloseButton = true }: ShiftReportModalProps) {
  const taxSetting = useSettingsStore((state) => state.settings?.taxSetting?.taxSetting);
  const isExempt = taxSetting === "Exempt";
  const { data: report, isLoading, refetch } = useGetShiftReport(shiftId);

  React.useEffect(() => {
    if (isOpen) {
      refetch();
    }
  }, [isOpen, refetch]);

  const fmt = (n: number | undefined | null) => (typeof n === "number" && !isNaN(n) ? n.toFixed(2) : "00.00");

  const handlePrint = () => {
    if (!report) return;

    const printData: ShiftReportData = {
      shiftNumber: report.shiftId,
      userName: report.employeeName,
      shiftDate: report.shiftDate,
      fromTime: report.startTime,
      toTime: report.endTime || "---",
      items: report.soldItems.map((item, idx) => ({
        index: idx + 1,
        productName: item.productName,
        price: item.unitPrice,
        quantity: item.quantity,
        total: item.lineTotal,
      })),
      totalBeforeTax: report.salesSubTotal,
      totalTax: report.salesTaxAmount,
      grandTotal: report.salesGrandTotal,
      treasuries: report.treasuries.map((t) => ({
        name: t.treasuryName,
        sales: t.totalSales,
      })),
      totalPurchases: report.totalPurchases,
      totalExpenses: report.totalExpenses,
      deliveryCompanies: [],
    };

    printShiftReport(printData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent showCloseButton={false} className="max-w-[500px] p-0 overflow-hidden bg-slate-50 dark:bg-slate-900 border-none shadow-2xl rounded-3xl">
        {/* Top Header Area */}
        <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm relative z-20">
          <Button onClick={handlePrint} disabled={isLoading || !report} className="bg-slate-800 hover:bg-slate-900 text-white font-medium h-9 px-4 rounded-xl shadow-md flex items-center gap-2 transition-all active:scale-95 text-xs">
            <Printer size={14} />
            طباعة
          </Button>

          <div className="flex items-center gap-3">
            {showCloseButton && onConfirmCloseShift && (
              <Button onClick={onConfirmCloseShift} className="bg-slate-800 hover:bg-slate-900 text-white font-medium h-9 px-4 rounded-xl shadow-md flex items-center gap-2 transition-all active:scale-95 text-xs">
                <Lock size={14} />
                غلق الوردية
              </Button>
            )}

            <button onClick={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-100 hover:bg-slate-200 hover:text-slate-800 transition-all text-slate-500">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Report Preview Area */}
        <div className="p-6 overflow-y-auto max-h-[80vh] flex flex-col items-center gap-4">
          {isLoading ? (
            <div className="w-full max-w-[400px] space-y-4">
              <Skeleton className="h-32 w-full rounded-2xl" />
              <Skeleton className="h-60 w-full rounded-2xl" />
              <Skeleton className="h-24 w-full rounded-2xl" />
            </div>
          ) : report ? (
            <div className="bg-white shadow-xl border border-slate-200 p-6 w-full max-w-[400px] text-right rounded-2xl relative" style={{ direction: "rtl", fontFamily: "Cairo, Tahoma, Arial, sans-serif" }}>
              {/* Header Box */}
              <div className="border-b border-dashed border-slate-300 pb-5 mb-5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="block text-[10px] font-semibold text-slate-500 mb-1">اسم المستخدم</span>
                    <span className="text-sm font-bold text-slate-900">{report.employeeName}</span>
                  </div>
                  <div className="text-left">
                    <span className="block text-[10px] font-semibold text-slate-500 mb-1">رقم الوردية</span>
                    <span className="text-sm font-bold text-slate-900">#{report.shiftId}</span>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-3 flex justify-between items-center border border-slate-200">
                  <div className="text-center w-1/3">
                    <span className="block text-[10px] text-slate-500 mb-1">تاريخ الوردية</span>
                    <span className="text-xs font-bold text-slate-800">{report.shiftDate}</span>
                  </div>
                  <div className="w-[1px] h-6 bg-slate-200"></div>
                  <div className="text-center w-1/3">
                    <span className="block text-[10px] text-slate-500 mb-1">من الساعة</span>
                    <span className="text-xs font-bold text-slate-800">{report.startTime}</span>
                  </div>
                  <div className="w-[1px] h-6 bg-slate-200"></div>
                  <div className="text-center w-1/3">
                    <span className="block text-[10px] text-slate-500 mb-1">إلى الساعة</span>
                    <span className="text-xs font-bold text-slate-800">{report.endTime || "---"}</span>
                  </div>
                </div>
              </div>

              {/* بيان الوردية */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3 text-slate-800">
                  <FileText size={16} className="text-slate-800" />
                  <h3 className="text-sm font-bold">بيان الوردية</h3>
                </div>

                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                  <table className="w-full text-xs text-right">
                    <thead className="bg-slate-50 text-black font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-2.5 w-[10%] text-center">م</th>
                        <th className="p-2.5 w-[40%]">الصنف</th>
                        <th className="p-2.5 w-[15%] text-center">السعر</th>
                        <th className="p-2.5 w-[15%] text-center">الكمية</th>
                        <th className="p-2.5 w-[20%] text-left">الإجمالي</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {report.soldItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-2.5 text-center text-slate-500">{idx + 1}</td>
                          <td className="p-2.5 font-medium text-slate-800 break-words">{item.productName}</td>
                          <td className="p-2.5 text-center text-slate-700">{fmt(item.unitPrice)}</td>
                          <td className="p-2.5 text-center text-slate-700">{fmt(item.quantity)}</td>
                          <td className="p-2.5 text-left font-bold text-slate-900">{fmt(item.lineTotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* TOTALS */}
              <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-200">
                {!isExempt && (
                  <div className="space-y-2 mb-3 border-b border-dashed border-slate-300 pb-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-600">الإجمالي بدون ضريبة</span>
                      <span className="font-semibold text-slate-800">{fmt(report.salesSubTotal)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-600">إجمالي الضريبة</span>
                      <span className="font-semibold text-slate-800">{fmt(report.salesTaxAmount)}</span>
                    </div>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-900">الإجمالي النهائي</span>
                  <span className="text-lg font-black text-slate-900">{fmt(report.salesGrandTotal)}</span>
                </div>
              </div>

              {/* يومية الخزائن */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3 text-slate-800">
                  <Wallet size={16} className="text-slate-800" />
                  <h3 className="text-sm font-bold">يومية الخزائن</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {report.treasuries.map((t, idx) => (
                    <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col items-center justify-center gap-1">
                      <span className="text-[10px] font-semibold text-slate-500">{t.treasuryName}</span>
                      <span className="text-sm font-bold text-slate-900">{fmt(t.totalSales)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* المشتريات والمصروفات */}
              {(report?.totalExpenses > 0 || report.totalPurchases > 0) && (
                <div>
                  <div className="flex items-center gap-2 mb-3 text-slate-800">
                    <ReceiptText size={16} className="text-slate-800" />
                    <h3 className="text-sm font-bold">المشتريات والمصروفات</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col items-center justify-center gap-1">
                      <span className="text-[10px] font-semibold text-slate-500">إجمالي المشتريات</span>
                      <span className="text-sm font-bold text-slate-900">{fmt(report.totalPurchases)}</span>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col items-center justify-center gap-1">
                      <span className="text-[10px] font-semibold text-slate-500">إجمالي المصروفات</span>
                      <span className="text-sm font-bold text-slate-900">{fmt(report.totalExpenses)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center p-10 bg-white rounded-2xl shadow-sm border border-slate-200">
              <p className="text-slate-500 font-medium">لم يتم العثور على بيانات للوردية</p>
            </div>
          )}

          <p className="text-[10px] text-slate-400 font-medium mt-2 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            معاينة الفاتورة قبل الطباعة الحرارية
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}