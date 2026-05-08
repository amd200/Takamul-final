import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Home, LogOut, Pause, Bug, Maximize, Plus, Keyboard as KeyboardIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useGetAllCustomers } from "@/features/customers/hooks/useGetAllCustomers";
import { useGetAllTreasurys } from "@/features/treasurys/hooks/useGetAllTreasurys";
import { Treasury } from "@/features/treasurys/types/treasurys.types";
import ComboboxField from "@/components/ui/ComboboxField";
import { usePos } from "@/context/PosContext";
import { useLanguage } from "@/context/LanguageContext";
import { Link, useNavigate } from "react-router-dom";
import AddParnterModal from "@/components/modals/AddParnterModal";
import { KeyboardReact as Keyboard } from "react-simple-keyboard";
import "react-simple-keyboard/build/css/index.css";
import { useGetAllWareHouses } from "@/features/wareHouse/hooks/useGetAllWareHouses";
import { Warehouse } from "@/features/Warehouses/types/Warehouses.types";
import { WareHouse } from "@/features/wareHouse/types/wareHouse.types";
import { useGetAllEmployees } from "@/features/employees/hooks/useGetAllEmployees";
import { usePosStore } from "@/features/pos/store/usePosStore";
import ShiftReportModal from "../modals/ShiftReportModal";
import { useSettingsStore } from "@/features/settings/store/settingsStore";
import { useGetAllShifts, useCloseShift } from "@/features/shifts/hooks/useShifts";
import { useMemo } from "react";
import { useAuthStore } from "@/store/authStore";
import useToast from "@/hooks/useToast";
import { useGetAllSales } from "@/features/sales/hooks/useGetAllSales";
import { getNextOrderNumber } from "@/utils/getNextOrderNumber";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function Topbar2() {
  const navigate = useNavigate();
  const { notifySuccess } = useToast();
  const getCurrentDateTime = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offset).toISOString().slice(0, 16);
  };

  const [deliveryDate, setDeliveryDate] = useState(getCurrentDateTime());
  const [employee, setEmployee] = useState("");
  const { data: customers } = useGetAllCustomers({ page: 1, limit: 10000 });
  const { selectedCustomer, setSelectedCustomer, setOrderNote, orderNote } = usePosStore();
  const [openDialog, setOpenDialog] = useState(false);
  const [balanceSelectedCustomer, setBalanceSelectedCustomer] = useState<number | null>(null);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const { data: wareHouses } = useGetAllWareHouses();
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>(String(wareHouses?.[0]?.id ?? ""));
  const { data: employees } = useGetAllEmployees({ page: 1, limit: 10000 });
  const [input, setInput] = useState("");
  const { t } = useLanguage();
  const [shiftReportOpen, setShiftReportOpen] = useState(false);
  const showActualBalance = useSettingsStore((s) => s.settings.location.showActualBalance);

  const { userName, shiftId: authShiftId, clearAuth } = useAuthStore();
  const { data: salesInvoices } = useGetAllSales({ limit: 10000, page: 1, OrderType: "POS" });

  const { data: shifts } = useGetAllShifts();
  const { mutate: closeShift } = useCloseShift();
  const currentOpenShift = useMemo(() => {
    const shiftsArray = Array.isArray(shifts) ? shifts : (shifts as any)?.items || (shifts as any)?.data || [];
    if (!shiftsArray || !Array.isArray(shiftsArray)) return null;

    if (authShiftId && authShiftId !== "0") {
      const tokenShift = shiftsArray.find((s: any) => String(s.id) === String(authShiftId));
      if (tokenShift) return tokenShift;
    }

    const normalizedUserName = userName?.toLowerCase().trim();

    const openShiftForUser = shiftsArray.find((s: any) => s.status === "Open" && s.employeeName?.toLowerCase().trim() === normalizedUserName);
    if (openShiftForUser) return openShiftForUser;

    const anyOpenShift = shiftsArray.find((s: any) => s.status === "Open");
    if (anyOpenShift) return anyOpenShift;

    const latestUserShift = shiftsArray.find((s: any) => s.employeeName?.toLowerCase().trim() === normalizedUserName);
    return latestUserShift || null;
  }, [shifts, userName, authShiftId]);

  useEffect(() => {
    if (customers) {
      setSelectedCustomer(customers?.items[0]);
      setBalanceSelectedCustomer(customers?.items[0].balance);
    }
  }, [customers]);

  useEffect(() => {
    if (wareHouses && wareHouses?.length > 0) {
      setSelectedWarehouse(String(wareHouses[0]?.id));
    }
  }, [wareHouses]);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  };
  const now = new Date();
  const dateTime = format(now, "EEEE، d MMMM yyyy، hh:mm a", { locale: ar });

  return (
    <>
      <div className="w-full border border-border rounded-sm text-sm">
        <div className="px-4 pt-3 pb-3 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1">
                {/* <Button asChild variant="outline" size="icon" className="w-7 h-7 border-[#000052] text-[#000052] hover:bg-[#000052] hover:text-white dark:border-border dark:text-foreground dark:hover:bg-muted dark:hover:text-foreground transition-colors duration-200" title="الصفحة الرئيسية">
                  <Link to={"/dashboard"}>
                    <Home size={13} />
                  </Link>
                </Button> */}
                <Button onClick={toggleFullScreen} variant="outline" size="icon" className="w-7 h-7 border-[#000052] text-[#000052] hover:bg-[#000052] hover:text-white dark:border-border dark:text-foreground dark:hover:bg-muted dark:hover:text-foreground transition-colors duration-200" title="ملء الشاشة">
                  <Maximize size={13} />
                </Button>
              </div>

              <div className="w-px h-5 bg-border" />

              <div className="flex items-center gap-1.5 flex-wrap">
                <Button variant="outline" size="sm" className="rounded-full h-7 text-[11px] border-[#000052] text-[#000052] hover:bg-[#000052] hover:text-white dark:border-border dark:text-foreground dark:hover:bg-muted dark:hover:text-foreground transition-colors duration-200">
                  شاشة المبيعات
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-6 shrink-0">
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-[10px] text-blue-400">رقم الفاتورة</span>
                <span className="text-[11px] font-semibold text-[#000052] dark:text-foreground">{getNextOrderNumber(salesInvoices?.items)}</span>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-[10px] text-blue-400">كود الوردية</span>
                <span className="text-[11px] font-semibold text-[#000052] dark:text-foreground">{authShiftId && authShiftId !== "0" ? authShiftId : currentOpenShift?.id || "---"}</span>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-[10px] text-blue-400">تاريخ الفاتورة</span>
                <span className="text-[11px] font-semibold text-[#000052] dark:text-foreground">اليوم، {dateTime}</span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button onClick={() => setShiftReportOpen(true)} disabled={!currentOpenShift && (!authShiftId || authShiftId === "0")} size="sm" className="rounded-full h-7 text-[11px] bg-[#000052] hover:bg-blue-900 dark:bg-muted dark:text-foreground dark:hover:bg-muted/70 hover:shadow-[0_0_0_3px_rgba(30,58,138,0.2)] transition-all duration-200">
                <Pause className="w-3 h-3" />
                {currentOpenShift || (authShiftId && authShiftId !== "0") ? "غلق الوردية" : "لا توجد وردية"}
              </Button>
              <Button asChild size="sm" className="rounded-full h-7 text-[11px] bg-[#000052] hover:bg-blue-900 dark:bg-muted dark:text-foreground dark:hover:bg-muted/70 hover:shadow-[0_0_0_3px_rgba(30,58,138,0.2)] transition-all duration-200">
                <Link to={"/"}>
                  تسجيل الخروج
                  <LogOut className="w-3 h-3" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="h-px bg-border" />

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-[minmax(0,1fr)_150px_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] gap-3 items-end">
            <div className="flex items-end gap-2">
              <Button size="icon-lg" variant="outline" className="border-[#000052] text-[#000052]! bg-white! dark:border-border dark:text-foreground dark:hover:bg-muted" onClick={() => setOpenDialog(true)}>
                <Plus size={14} />
              </Button>
              <div className="flex flex-col gap-1 flex-1">
                <Label className="text-[10px] text-[#000052] dark:text-muted-foreground">اختر العميل</Label>
                <ComboboxField
                  className="border-[#000052] text-[#000052] dark:border-border dark:text-foreground text-[11px]"
                  value={selectedCustomer ? String(selectedCustomer.id) : ""}
                  onChange={(val) => {
                    const c = customers?.items?.find((c) => String(c.id) === String(val));
                    if (c) setSelectedCustomer(c);
                    setBalanceSelectedCustomer(c?.balance);
                  }}
                  items={customers?.items}
                  valueKey="id"
                  labelKey="customerName"
                  placeholder={t("choose_customer")}
                />
              </div>
            </div>

            {showActualBalance && (
              <div className="flex flex-col gap-1">
                <Label className="text-[10px] text-[#000052] dark:text-muted-foreground">رصيد العميل</Label>
                <Input value={balanceSelectedCustomer} readOnly={true} className="text-center cursor-not-allowed text-[11px] bg-white border-[#000052] text-[#000052] dark:bg-background dark:border-border dark:text-foreground" />
              </div>
            )}

            <div className="flex flex-col gap-1">
              <Label className="text-[10px] text-[#000052] dark:text-muted-foreground">وقت وتاريخ الاستلام</Label>
              <Input type="datetime-local" value={deliveryDate} readOnly className="text-[11px] bg-white border-[#000052] text-[#000052] dark:bg-background dark:border-border dark:text-foreground  cursor-not-allowed" />{" "}
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-[10px] text-[#000052] dark:text-muted-foreground">المخزن</Label>
              <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
                <SelectTrigger className="w-full text-[11px] bg-white border-[#000052] text-blue-900 dark:bg-background dark:border-border dark:text-foreground rounded-sm">
                  <SelectValue placeholder="اختر..." />
                </SelectTrigger>
                <SelectContent>
                  {wareHouses?.map((ww: WareHouse) => (
                    <SelectItem key={ww.id} value={String(ww.id)}>
                      {ww.warehouseName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-[10px] text-[#000052] dark:text-muted-foreground">موظف الخدمة</Label>
              <Select value={employee} onValueChange={setEmployee}>
                <SelectTrigger className="w-full text-[11px] bg-white border-[#000052] text-blue-900 dark:bg-background dark:border-border dark:text-foreground rounded-sm">
                  <SelectValue placeholder="اختر..." />
                </SelectTrigger>
                <SelectContent>
                  {employees?.items?.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.firstName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-[10px] text-[#000052] dark:text-muted-foreground">ملاحظات</Label>
              <Textarea value={orderNote} onChange={(e) => setOrderNote(e.target.value)} className="min-h-10 text-[11px] bg-white border-[#000052] text-[#000052] dark:bg-background dark:border-border dark:text-foreground rounded-sm resize-none py-1" rows={1} placeholder="أضف ملاحظة..." />
            </div>
          </div>
        </div>
      </div>
      <AddParnterModal isOpen={openDialog} onClose={() => setOpenDialog(false)} />
      {showKeyboard && (
        <div className="fixed bottom-0 left-0 right-0 z-50 ">
          <Keyboard
            onChange={(val) => setInput(val)}
            onKeyPress={(btn) => {
              if (btn === "{enter}") setShowKeyboard(false);
            }}
          />
        </div>
      )}
      <ShiftReportModal
        isOpen={shiftReportOpen}
        onClose={() => setShiftReportOpen(false)}
        shiftId={authShiftId && authShiftId !== "0" ? Number(authShiftId) : currentOpenShift?.id || 0}
        onConfirmCloseShift={() => {
          const targetShiftId = authShiftId && authShiftId !== "0" ? Number(authShiftId) : currentOpenShift?.id;
          if (!targetShiftId) return;
          const fullTime = new Date().toLocaleTimeString("en-GB", { hour12: false });
          closeShift(
            { shiftId: targetShiftId, endTime: fullTime },
            {
              onSuccess: () => {
                setShiftReportOpen(false);
                notifySuccess("تم غلق الوردية بنجاح");
                setTimeout(() => {
                  clearAuth();
                  navigate("/login");
                }, 1500);
              },
            },
          );
        }}
      />
    </>
  );
}
