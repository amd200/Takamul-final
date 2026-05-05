import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Lock, X } from "lucide-react";
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
  const { data: report, isLoading } = useGetShiftReport(shiftId);

  const fmt = (n: number | undefined | null) => (typeof n === "number" && !isNaN(n) ? n.toFixed(2) : "00.00");

  const handlePrint = () => {
    if (!report) return;
    
    // Map API report to ShiftReportData for printing
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
        total: item.lineTotal
      })),
      totalBeforeTax: report.salesSubTotal,
      totalTax: report.salesTaxAmount,
      grandTotal: report.salesGrandTotal,
      treasuries: report.treasuries.map(t => ({
        name: t.treasuryName,
        sales: t.totalSales
      })),
      totalPurchases: report.totalPurchases,
      totalExpenses: report.totalExpenses,
      deliveryCompanies: [] 
    };

    printShiftReport(printData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent showCloseButton={false} className="max-w-[500px] p-0 overflow-hidden bg-[#f8fafc] dark:bg-slate-900 border-none shadow-2xl rounded-3xl">
        {/* Top Header Area */}
        <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm relative z-20">
          <Button 
            onClick={handlePrint}
            disabled={isLoading || !report}
            className="bg-[#000052] hover:bg-[#000052]/90 text-white font-medium h-9 px-4 rounded-xl shadow-md flex items-center gap-2 transition-all active:scale-95 text-xs"
          >
            <Printer size={14} />
            طباعة
          </Button>

          <div className="flex items-center gap-3">
            {showCloseButton && onConfirmCloseShift && (
              <Button 
                onClick={onConfirmCloseShift}
                className="bg-[#22c55e] hover:bg-[#16a34a] text-white font-medium h-9 px-4 rounded-xl shadow-md flex items-center gap-2 transition-all active:scale-95 text-xs"
              >
                <Lock size={14} />
                غلق الوردية
              </Button>
            )}

            <button onClick={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-100 hover:bg-red-50 hover:text-red-500 transition-all text-slate-500">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Report Preview Area */}
        <div className="p-6 overflow-y-auto max-h-[80vh] flex flex-col items-center gap-4 bg-[#f1f5f9]">
          {isLoading ? (
            <div className="w-full max-w-[380px] space-y-4">
              <Skeleton className="h-40 w-full rounded-xl" />
              <Skeleton className="h-60 w-full rounded-xl" />
              <Skeleton className="h-20 w-full rounded-xl" />
            </div>
          ) : report ? (
            <div className="bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/60 p-6 w-full max-w-[380px] text-right rounded-xl" style={{ direction: 'rtl', fontFamily: 'Cairo, Tahoma, Arial, sans-serif' }}>
              {/* TOP BOX */}
              <div className="border-[2px] border-black mb-4 overflow-hidden rounded-sm">
                <div className="flex justify-between p-3 border-b-[2px] border-black">
                  <div className="flex flex-col items-start w-1/2">
                    <span className="text-[7.5pt] font-medium text-gray-400">اسم المستخدم</span>
                    <span className="text-[9.5pt] font-medium leading-tight">{report.employeeName}</span>
                  </div>
                  <div className="flex flex-col items-end w-1/2">
                    <span className="text-[7.5pt] font-medium text-gray-400">رقم الوردية</span>
                    <span className="text-[9.5pt] font-medium leading-tight">{report.shiftId}</span>
                  </div>
                </div>
                <div className="text-center p-2.5 border-b-[2px] border-black bg-slate-50/50">
                  <div className="text-[7.5pt] font-medium text-gray-400">تاريخ الوردية</div>
                  <div className="text-[11pt] font-medium">{report.shiftDate}</div>
                </div>
                <div className="flex justify-between p-3">
                  <div className="flex flex-col items-start w-1/2">
                    <span className="text-[7.5pt] font-medium text-gray-400">من الساعه</span>
                    <span className="text-[9.5pt] font-medium leading-tight">{report.startTime}</span>
                  </div>
                  <div className="flex flex-col items-end w-1/2">
                    <span className="text-[7.5pt] font-medium text-gray-400">إلى الساعه</span>
                    <span className="text-[9.5pt] font-medium leading-tight">{report.endTime || "---"}</span>
                  </div>
                </div>
              </div>

              {/* بيان الوردية */}
              <div className="mb-4 w-full text-center">
                <div className="relative z-10">
                  <span className="inline-block border-[2px] border-black px-6 py-1 text-[10pt] font-bold bg-white uppercase">بيان الوردية</span>
                </div>
                <div className="border-[1.5px] border-black">
                  <table className="w-full border-collapse text-[8pt] font-medium">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="border-b-[1.5px] border-l-[1.5px] border-black p-1.5 text-center font-bold w-[10%]">م</th>
                        <th className="border-b-[1.5px] border-l-[1.5px] border-black p-1.5 text-center font-bold w-[35%]">الصنف</th>
                        <th className="border-b-[1.5px] border-l-[1.5px] border-black p-1.5 text-center font-bold">السعر</th>
                        <th className="border-b-[1.5px] border-l-[1.5px] border-black p-1.5 text-center font-bold">الكمية</th>
                        <th className="border-b-[1.5px] border-black p-1.5 text-center font-bold">الاجمالي</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.soldItems.map((item, idx) => (
                        <tr key={idx}>
                          <td className="border-b border-l border-slate-300 p-1.5 text-center">.{idx + 1}</td>
                          <td className="border-b border-l border-slate-300 p-1.5 text-center">{item.productName}</td>
                          <td className="border-b border-l border-slate-300 p-1.5 text-center font-bold">{fmt(item.unitPrice)}</td>
                          <td className="border-b border-l border-slate-300 p-1.5 text-center font-bold">{fmt(item.quantity)}</td>
                          <td className="border-b border-slate-300 p-1.5 text-center font-bold">{fmt(item.lineTotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* TOTALS */}
              <div className="border-[1.5px] border-black mb-3 p-3 bg-slate-50/30">
                {!isExempt && (
                  <>
                    <div className="flex justify-between py-1.5 text-[8.5pt] font-medium">
                      <span className="font-bold text-[9.5pt]">{fmt(report.salesSubTotal)}</span>
                      <span className="text-gray-600">الاجمالي بدون الضريبة</span>
                    </div>
                    <div className="flex justify-between py-1.5 text-[8.5pt] font-medium">
                      <span className="font-bold text-[9.5pt]">{fmt(report.salesTaxAmount)}</span>
                      <span className="text-gray-600">إجمالي الضريبة</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between pt-2 mt-2 border-t-[1.5px] border-black text-[10pt] font-bold">
                  <span className="text-[11pt]">{fmt(report.salesGrandTotal)}</span>
                  <span>الاجمالي النهائي</span>
                </div>
              </div>

              {/* يومية الخزائن */}
              <div className="mb-3 w-full text-center">
                <div className="relative z-10">
                  <span className="inline-block border-[1.5px] border-black px-5 py-1 text-[9pt] font-bold bg-white uppercase">يومية الخزائن</span>
                </div>
                <div className="border-[1.5px] border-black overflow-hidden">
                  <table className="w-full border-collapse text-[8.5pt] font-medium">
                    <thead>
                      <tr className="bg-slate-50">
                        {report.treasuries.map((t, idx) => (
                          <th key={idx} className="border-b-[1.5px] border-l-[1.5px] border-black p-1.5 text-center font-bold">
                            {t.treasuryName}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        {report.treasuries.map((t, idx) => (
                          <td key={idx} className="border-b border-l border-slate-300 p-1.5 text-center font-bold text-blue-700">
                            {fmt(t.totalSales)}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* المشتريات و المصروفات */}
              <div className="mb-3 mt-5 w-full text-center">
                <div className="relative z-10">
                  <span className="inline-block border-[1.5px] border-black px-5 py-1 text-[9pt] font-bold bg-white uppercase">المشتريات و المصروفات</span>
                </div>
                <div className="border-[1.5px] border-black overflow-hidden">
                  <table className="w-full border-collapse text-[8.5pt] font-medium">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="border-b-[1.5px] border-l-[1.5px] border-black p-1.5 text-center font-bold">إجمالي المشتريات</th>
                        <th className="border-b-[1.5px] border-black p-1.5 text-center font-bold">اجمالي المصروفات</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border-l-[1.5px] border-black p-2 text-center font-bold text-red-600">{fmt(report.totalPurchases)}</td>
                        <td className="p-2 text-center font-bold text-red-600">{fmt(report.totalExpenses)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center p-10 bg-white rounded-xl shadow-sm border border-slate-200">
              <p className="text-slate-500 font-medium">لم يتم العثور على بيانات للوردية</p>
            </div>
          )}

          <p className="text-[10px] text-slate-400 font-medium italic mt-2">معاينة التقرير الحراري قبل الطباعة</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
