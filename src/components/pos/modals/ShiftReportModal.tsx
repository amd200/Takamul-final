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
      <DialogContent showCloseButton={false} className="max-w-[500px] p-0 overflow-hidden bg-gray-50 dark:bg-gray-900 border-none shadow-2xl rounded-3xl">
        {/* Top Header Area */}
        <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm relative z-20">
          <Button onClick={handlePrint} disabled={isLoading || !report} className="bg-gray-800 hover:bg-gray-900 text-white font-medium h-9 px-4 rounded-xl shadow-md flex items-center gap-2 transition-all active:scale-95 text-xs">
            <Printer size={14} />
            طباعة
          </Button>

          <div className="flex items-center gap-3">
            {showCloseButton && onConfirmCloseShift && (
              <Button onClick={onConfirmCloseShift} className="bg-gray-800 hover:bg-gray-900 text-white font-medium h-9 px-4 rounded-xl shadow-md flex items-center gap-2 transition-all active:scale-95 text-xs">
                <Lock size={14} />
                غلق الوردية
              </Button>
            )}

            <button onClick={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center bg-gray-100 hover:bg-gray-200 hover:text-black transition-all text-gray-500">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Report Preview Area */}
        <div className="p-6 overflow-y-auto max-h-[80vh] flex flex-col items-center gap-4">
          {isLoading ? (
            <div className="w-full max-w-[400px] space-y-4">
              <Skeleton className="h-32 w-full rounded-2xl bg-gray-200" />
              <Skeleton className="h-60 w-full rounded-2xl bg-gray-200" />
              <Skeleton className="h-24 w-full rounded-2xl bg-gray-200" />
            </div>
          ) : report ? (
            <div className="bg-white shadow-xl border border-gray-200 p-6 w-full max-w-[400px] text-right rounded-2xl relative text-black" style={{ direction: "rtl", fontFamily: "Cairo, Tahoma, Arial, sans-serif" }}>
              {/* Header Box */}
              <div className="border-b border-dashed border-gray-400 pb-5 mb-5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="block text-[10px] font-bold mb-1 text-black">اسم المستخدم</span>
                    <span className="text-sm font-bold text-black">{report.employeeName}</span>
                  </div>
                  <div className="text-left">
                    <span className="block text-[10px] font-bold mb-1 text-black">رقم الوردية</span>
                    <span className="text-sm font-bold text-black">#{report.shiftId}</span>
                  </div>
                </div>

                <div className="bg-gray-100 rounded-xl p-3 flex justify-between items-center border border-gray-300">
                  <div className="text-center w-1/3">
                    <span className="block text-[10px] font-bold mb-1 text-black">تاريخ الوردية</span>
                    <span className="text-xs font-bold text-black">{report.shiftDate}</span>
                  </div>
                  <div className="w-[1px] h-6 bg-gray-300"></div>
                  <div className="text-center w-1/3">
                    <span className="block text-[10px] font-bold mb-1 text-black">من الساعة</span>
                    <span className="text-xs font-bold text-black">{report.startTime}</span>
                  </div>
                  <div className="w-[1px] h-6 bg-gray-300"></div>
                  <div className="text-center w-1/3">
                    <span className="block text-[10px] font-bold mb-1 text-black">إلى الساعة</span>
                    <span className="text-xs font-bold text-black">{report.endTime || "---"}</span>
                  </div>
                </div>
              </div>

              {/* بيان الوردية */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3 text-black">
                  <FileText size={16} />
                  <h3 className="text-sm font-bold">بيان الوردية</h3>
                </div>

                <div className="overflow-hidden rounded-xl border border-gray-300 bg-white">
                  <table className="w-full text-xs text-right">
                    <thead className="bg-gray-100 font-bold border-b border-gray-300 text-black">
                      <tr>
                        <th className="p-2.5 w-[10%] text-center">م</th>
                        <th className="p-2.5 w-[40%]">الصنف</th>
                        <th className="p-2.5 w-[15%] text-center">السعر</th>
                        <th className="p-2.5 w-[15%] text-center">الكمية</th>
                        <th className="p-2.5 w-[20%] text-left">الإجمالي</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 font-medium text-black">
                      {report.soldItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                          <td className="p-2.5 text-center">{idx + 1}</td>
                          <td className="p-2.5 break-words">{item.productName}</td>
                          <td className="p-2.5 text-center">{fmt(item.unitPrice)}</td>
                          <td className="p-2.5 text-center">{fmt(item.quantity)}</td>
                          <td className="p-2.5 text-left font-bold">{fmt(item.lineTotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* TOTALS */}
              <div className="bg-gray-100 rounded-xl p-4 mb-6 border border-gray-300 text-black">
                {!isExempt && (
                  <div className="space-y-2 mb-3 border-b border-dashed border-gray-400 pb-3 font-semibold">
                    <div className="flex justify-between items-center text-xs">
                      <span>الإجمالي بدون ضريبة</span>
                      <span>{fmt(report.salesSubTotal)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span>إجمالي الضريبة</span>
                      <span>{fmt(report.salesTaxAmount)}</span>
                    </div>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold">الإجمالي النهائي</span>
                  <span className="text-lg font-black">{fmt(report.salesGrandTotal)}</span>
                </div>
              </div>

              {/* يومية الخزائن */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3 text-black">
                  <Wallet size={16} />
                  <h3 className="text-sm font-bold">يومية الخزائن</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {report.treasuries.map((t, idx) => (
                    <div key={idx} className="bg-gray-100 border border-gray-300 rounded-xl p-3 flex flex-col items-center justify-center gap-1 text-black">
                      <span className="text-[10px] font-bold">{t.treasuryName}</span>
                      <span className="text-sm font-black">{fmt(t.totalSales)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* المشتريات والمصروفات */}
              {(report?.totalExpenses > 0 || report.totalPurchases > 0) && (
                <div>
                  <div className="flex items-center gap-2 mb-3 text-black">
                    <ReceiptText size={16} />
                    <h3 className="text-sm font-bold">المشتريات والمصروفات</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-100 border border-gray-300 rounded-xl p-3 flex flex-col items-center justify-center gap-1 text-black">
                      <span className="text-[10px] font-bold">إجمالي المشتريات</span>
                      <span className="text-sm font-black">{fmt(report.totalPurchases)}</span>
                    </div>
                    <div className="bg-gray-100 border border-gray-300 rounded-xl p-3 flex flex-col items-center justify-center gap-1 text-black">
                      <span className="text-[10px] font-bold">إجمالي المصروفات</span>
                      <span className="text-sm font-black">{fmt(report.totalExpenses)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center p-10 bg-white rounded-2xl shadow-sm border border-gray-200 text-black">
              <p className="font-bold">لم يتم العثور على بيانات للوردية</p>
            </div>
          )}

          <p className="text-[10px] text-black font-bold mt-2 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-black"></span>
            معاينة الفاتورة قبل الطباعة الحرارية
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}