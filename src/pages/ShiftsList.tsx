import React, { useState, useMemo } from "react";
import { Search, Plus, History, Monitor, User, Calendar, Clock } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardAction } from "@/components/ui/card";
import { ResponsiveModal } from "@/components/modals/ResponsiveModal";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import ShiftReportModal from "@/components/pos/modals/ShiftReportModal";
import { ShiftReportData } from "@/components/pos/orders/printShiftReport";
import { Eye } from "lucide-react";
import { useGetAllBranches } from "@/features/Branches/hooks/Usegetallbranches";
import { useGetAllUsers } from "@/features/users/hooks/useGetAllUsers";
import { useGetAllPOSDevices } from "@/features/pos/hooks/useGetAllPOSDevices";

interface Shift {
  id: string;
  shift_number: string;
  date: string;
  time: string;
  branch_name: string;
  invoice_device: string;
  user_name: string;
  opening_balance: number;
}

export default function ShiftsList() {
  const { direction, t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [filters, setFilters] = useState({ branch: "", userId: "", deviceId: "" });

  // Current date and time for default values
  const now = new Date();
  const currentDate = now.toISOString().split('T')[0];
  const currentTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

  const { data: branchesData, isLoading: isBranchesLoading } = useGetAllBranches();
  const { data: usersData, isLoading: isUsersLoading } = useGetAllUsers({ page: 1, limit: 100 });
  const { data: devicesData, isLoading: isDevicesLoading } = useGetAllPOSDevices();

  const branches = useMemo(() => {
    return branchesData || [];
  }, [branchesData]);

  const users = useMemo(() => {
    return usersData?.items || [];
  }, [usersData]);

  const devices = useMemo(() => {
    return devicesData?.data || [];
  }, [devicesData]);

  // Dummy data with separated date and time
  const [shifts] = useState<Shift[]>([
    {
      id: "1",
      shift_number: "SH-001",
      date: "2024-04-06",
      time: "10:00 AM",
      branch_name: direction === "rtl" ? "الفرع الرئيسي" : "Main Branch",
      invoice_device: "POS-01",
      user_name: direction === "rtl" ? "أحمد محمد" : "Ahmed Mohamed",
      opening_balance: 500
    },
    {
      id: "2",
      shift_number: "SH-002",
      date: "2024-04-06",
      time: "11:30 AM",
      branch_name: direction === "rtl" ? "فرع فرعي" : "Sub Branch",
      invoice_device: "POS-02",
      user_name: direction === "rtl" ? "سارة علي" : "Sara Ali",
      opening_balance: 300
    },
  ]);

  const filteredData = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return shifts.filter(
      (item) =>
        item.shift_number.toLowerCase().includes(term) ||
        item.user_name.toLowerCase().includes(term) ||
        item.branch_name.toLowerCase().includes(term)
    );
  }, [shifts, searchTerm, direction]);

  const header = (
    <div className="relative w-full md:w-80">
      <Search className={cn("absolute top-2.5 text-gray-400", direction === "rtl" ? "right-3" : "left-3")} size={18} />
      <Input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder={t("search_placeholder") || "ابحث..."}
        className={cn(
          "w-full border border-gray-200 rounded-lg py-2 outline-none focus:border-[var(--primary)] text-sm",
          direction === "rtl" ? "pr-10 pl-4" : "pl-10 pr-4"
        )}
      />
    </div>
  );

  const balanceTemplate = (rowData: Shift) => {
    return (
      <div className="flex items-center justify-center gap-1 font-bold">
        <span>SAR</span>
        <span>{rowData.opening_balance}</span>
      </div>
    );
  };

  const actionsTemplate = (rowData: Shift) => {
    return (
      <div className="flex justify-center">
        <Button
          variant="ghost"
          size="sm"
          className="text-[var(--primary)] hover:bg-[var(--primary)]/10 gap-2 font-bold"
          onClick={() => {
            setSelectedShift(rowData);
            setIsReportModalOpen(true);
          }}
        >
          <Eye size={16} />
          {t("view_report") || "عرض التقرير"}
        </Button>
      </div>
    );
  };

  // Mock data for report
  const reportData: ShiftReportData = useMemo(() => {
    return {
      shiftNumber: selectedShift?.shift_number || "",
      userName: selectedShift?.user_name || "",
      shiftDate: selectedShift?.date || "",
      fromTime: selectedShift?.time || "",
      toTime: "06:00 PM",
      items: [
        { index: 1, productName: "كابتشينو", price: 15, quantity: 10, total: 150 },
        { index: 2, productName: "لاتيه", price: 18, quantity: 5, total: 90 },
      ],
      totalBeforeTax: 208.7,
      totalTax: 31.3,
      grandTotal: 240,
      payment: {
        cash: 100,
        network: 140,
        delivery: 0
      },
      totalPurchases: 50,
      totalExpenses: 20,
      deliveryCompanies: [
        { name: "هنقرستيشن", amount: 0 },
        { name: "جاهز", amount: 0 }
      ]
    };
  }, [selectedShift]);

  return (
    <div dir={direction} className="p-4 lg:p-8">
      <Card className="rounded-xl overflow-hidden border-none shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-[var(--text-main)] text-xl font-bold">
            <History size={24} className="text-[var(--primary)]" />
            {t("shifts") || "الورديات"}
          </CardTitle>

          <CardDescription className="text-gray-500">
            {t("shifts_list_desc") || "إضافة وعرض وإدارة ورديات الكاشير في مختلف الفروع"}
          </CardDescription>

          <CardAction>
            <Button
              onClick={() => {
                setIsAddModalOpen(true);
              }}
              className="bg-[var(--primary)] hover:opacity-90 text-white gap-2 rounded-xl h-11 px-6 font-bold transition-all"
            >
              <Plus size={18} />
              {t("add_shift") || "إضافة وردية"}
            </Button>
          </CardAction>
        </CardHeader>

        <CardContent>
          <DataTable
            value={filteredData}
            paginator
            rows={10}
            header={header}
            className="custom-green-table no-wrap-header"
            responsiveLayout="stack"
            dir={direction}
            rowHover
            stripedRows
          >
            <Column field="shift_number" header={t("shift_number") || "رقم الوردية"} sortable className="text-center font-bold" />
            <Column field="date" header={t("date") || "التاريخ"} sortable />
            <Column field="time" header={t("time") || "الوقت"} sortable />
            <Column field="branch_name" header={t("branch_name") || "الفرع"} sortable />
            <Column field="invoice_device" header={t("invoice_device") || "جهاز الفواتير"} sortable />
            <Column field="user_name" header={t("user_name") || "المستخدم"} sortable />
            <Column
              field="opening_balance"
              header={t("opening_balance") || "الرصيد الافتتاحي"}
              sortable
              body={balanceTemplate}
              className="text-center"
            />
            <Column 
              header={t("actions") || "العمليات"} 
              body={actionsTemplate}
              className="text-center"
            />
          </DataTable>
        </CardContent>
      </Card>

      {/* Add Shift Modal */}
      <ResponsiveModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={t("add_shift") || "إضافة وردية"}
        headerActions={<History size={20} className="text-[var(--primary)]" />}
        maxWidth="max-w-xl"
        footer={(
          <>
            <Button onClick={() => setIsAddModalOpen(false)} variant="outline" className="w-fit px-6 border-gray-200 h-10 text-sm font-bold rounded-xl transition-all hover:bg-gray-100">
              {t("cancel") || "إلغاء"}
            </Button>
            <Button onClick={() => setIsAddModalOpen(false)} className="bg-[var(--primary)] hover:opacity-90 text-white w-fit px-8 h-10 text-sm font-bold rounded-xl transition-all shadow-sm">
              {t("save") || "حفظ"}
            </Button>
          </>
        )}
      >
        <div className="px-2 py-1 space-y-3" dir={direction}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
            <Field>
              <FieldLabel className="mb-1 text-xs font-semibold">{t("date") || "التاريخ"}</FieldLabel>
              <Input value={currentDate} readOnly className="bg-gray-50 border-gray-200 h-9 text-xs rounded-lg" />
            </Field>

            <Field>
              <FieldLabel className="mb-1 text-xs font-semibold">{t("time") || "الوقت"}</FieldLabel>
              <Input value={currentTime} readOnly className="bg-gray-50 border-gray-200 h-9 text-xs rounded-lg" />
            </Field>
          </div>

          <Field>
            <FieldLabel className="mb-1 text-xs font-semibold">{t("branch") || "الفرع"}</FieldLabel>
            <Select
              value={filters.branch}
              onValueChange={(val) => setFilters({ ...filters, branch: val })}
            >
              <SelectTrigger className="w-full h-10">
                <SelectValue placeholder={t("select_branch") || "اختر الفرع"} />
              </SelectTrigger>
              <SelectContent className="z-[200]">
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id.toString()}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel className="mb-1 text-xs font-semibold">{t("user_name") || "اسم المستخدم"}</FieldLabel>
            <Select
              value={filters.userId}
              onValueChange={(val) => setFilters({ ...filters, userId: val })}
            >
              <SelectTrigger className="w-full h-10">
                <SelectValue placeholder={t("select_user") || "اختر المستخدم"} />
              </SelectTrigger>
              <SelectContent className="z-[200]">
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id.toString()}>
                    {user.userName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel className="mb-1 text-xs font-semibold">{t("invoice_device") || "جهاز إصدار الفواتير"}</FieldLabel>
            <Select
              value={filters.deviceId}
              onValueChange={(val) => setFilters({ ...filters, deviceId: val })}
            >
              <SelectTrigger className="w-full h-10">
                <SelectValue placeholder={t("select_device") || "اختر الجهاز"} />
              </SelectTrigger>
              <SelectContent className="z-[200]">
                {devices.map((device) => (
                  <SelectItem key={device.id} value={device.id.toString()}>
                    {device.deviceName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel className="mb-1 text-xs font-semibold">{t("opening_balance") || "الرصيد الافتتاحي"}</FieldLabel>
            <Input type="number" placeholder="0.00" className="border-gray-200 h-9 text-xs rounded-lg transition-colors" />
          </Field>
        </div>
      </ResponsiveModal>

      {/* Shift Report Modal */}
      {isReportModalOpen && (
        <ShiftReportModal 
          isOpen={isReportModalOpen} 
          onClose={() => setIsReportModalOpen(false)} 
          data={reportData}
          onConfirmCloseShift={() => {
            setIsReportModalOpen(false);
            // Handle close shift logic here
          }}
        />
      )}
    </div>
  );
}
