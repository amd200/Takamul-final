import React, { useState, useMemo } from "react";
import { Search, Plus, History, Monitor, User, Calendar, Clock, Eye } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardAction } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import ShiftReportModal from "@/components/pos/modals/ShiftReportModal";
import { useGetAllBranches } from "@/features/Branches/hooks/Usegetallbranches";
import { useGetAllUsers } from "@/features/users/hooks/useGetAllUsers";
import { useGetAllShifts, useOpenShift, useCloseShift, useGetEmployeesByBranch } from "@/features/shifts/hooks/useShifts";
import { Shift } from "@/features/shifts/types/shifts.types";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/store/authStore";
import AddShiftModal from "@/components/modals/AddShiftsModal";
import { Permissions } from "@/lib/permissions";
import { useGetAllPOSDevices } from "@/features/posDevice/hooks/useGetAllPOSDevices";

export default function ShiftsList() {
  const { direction, t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);

  const [newShift, setNewShift] = useState({
    openingBalance: 0,
    branchId: 0,
    employeeId: 0,
    deviceId: 0,
  });

  // Current date and time for display
  const now = new Date();
  const currentDate = now.toISOString().split("T")[0];
  const currentTime = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });

  const { data: shifts, isLoading: isShiftsLoading } = useGetAllShifts();
  const { data: branchesData, isLoading: isBranchesLoading } = useGetAllBranches();
  const { data: usersData, isLoading: isUsersLoading } = useGetAllUsers({ page: 1, limit: 100 });
  const { data: devicesData, isLoading: isDevicesLoading } = useGetAllPOSDevices();
  const { data: branchEmployeesData } = useGetEmployeesByBranch(newShift.branchId);

  const { mutate: openShift, isPending: isOpening } = useOpenShift();
  const { mutate: closeShift, isPending: isClosing } = useCloseShift();

  const branches = useMemo(() => branchesData || [], [branchesData]);
  const branchEmployees = useMemo(() => branchEmployeesData?.data || [], [branchEmployeesData]);
  const devices = useMemo(() => devicesData?.data || [], [devicesData]);

  const { branchId: userBranchId, userId, userName: authUserName } = useAuthStore();
  const isAdmin = authUserName?.toLowerCase() === "admin" || authUserName?.toLowerCase() === "superadmin";
  const hasPermission = useAuthStore((state) => state.hasPermission);

  // Handle initial pre-fill and reset when modal opens
  React.useEffect(() => {
    if (isAddModalOpen) {
      if (!isAdmin) {
        // For normal users: pre-fill from token immediately
        const bId = userBranchId ? parseInt(userBranchId) : 0;
        const uId = userId ? parseInt(userId) : 0;
        setNewShift({
          openingBalance: 0,
          branchId: !isNaN(bId) ? bId : 0,
          employeeId: !isNaN(uId) ? uId : 0,
          deviceId: 0,
        });
      } else {
        // For admins: reset to zeros and let the data-driven effects fill it
        setNewShift({
          openingBalance: 0,
          branchId: 0,
          employeeId: 0,
          deviceId: 0,
        });
      }
    }
  }, [isAddModalOpen, isAdmin, userBranchId, userId]);

  // Fill branch for admins when branches load
  React.useEffect(() => {
    if (isAddModalOpen && isAdmin && branches.length > 0 && newShift.branchId === 0) {
      setNewShift((prev) => ({ ...prev, branchId: branches[0].id }));
    }
  }, [isAddModalOpen, isAdmin, branches, newShift.branchId]);

  // Fill employee for admins when employees load or branch changes
  React.useEffect(() => {
    if (isAddModalOpen && isAdmin && branchEmployees.length > 0 && (newShift.employeeId === 0 || !branchEmployees.some((e) => e.id === newShift.employeeId))) {
      setNewShift((prev) => ({ ...prev, employeeId: branchEmployees[0].id }));
    }
  }, [isAddModalOpen, isAdmin, branchEmployees, newShift.branchId, newShift.employeeId]);

  // Fill device for everyone when devices load
  React.useEffect(() => {
    if (isAddModalOpen && devices.length > 0 && newShift.deviceId === 0) {
      setNewShift((prev) => ({ ...prev, deviceId: devices[0].id }));
    }
  }, [isAddModalOpen, devices, newShift.deviceId]);

  const filteredData = useMemo(() => {
    const shiftsArray = Array.isArray(shifts) ? shifts : (shifts as any)?.items || (shifts as any)?.data || [];
    if (!shiftsArray) return [];

    const term = searchTerm.trim().toLowerCase();
    return shiftsArray.filter((item: any) => item.id.toString().includes(term) || item.employeeName?.toLowerCase().includes(term) || item.branchName?.toLowerCase().includes(term));
  }, [shifts, searchTerm]);

  const header = (
    <div className="relative w-full md:w-80">
      <Search className={cn("absolute top-2.5 text-gray-400", direction === "rtl" ? "right-3" : "left-3")} size={18} />
      <Input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder={t("search_placeholder") || "ابحث..."} className={cn("w-full border border-gray-200 rounded-lg py-2 outline-none focus:border-[var(--primary)] text-sm", direction === "rtl" ? "pr-10 pl-4" : "pl-10 pr-4")} />
    </div>
  );

  const balanceTemplate = (rowData: Shift) => {
    return (
      <div className="flex items-center justify-center gap-1 font-bold">
        <span>{rowData.openingBalance}</span>
      </div>
    );
  };

  const statusTemplate = (rowData: Shift) => {
    const isOpen = rowData.status === "Open";
    return <div className={cn("px-3 py-1 rounded-full text-xs font-bold inline-block", isOpen ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-600")}>{isOpen ? t("open") || "مفتوحة" : t("closed") || "مغلقة"}</div>;
  };

  const actionsTemplate = (rowData: Shift) => {
    return (
      <div className="flex justify-center">
        <Button
          variant="ghost"
          size="icon"
          className="text-[var(--primary)] hover:bg-[var(--primary)]/10 h-8 w-8 rounded-full transition-all"
          onClick={() => {
            setSelectedShift(rowData);
            setIsReportModalOpen(true);
          }}
          title={t("view_report") || "عرض التقرير"}
        >
          <Eye size={18} />
        </Button>
      </div>
    );
  };

  return (
    <div dir={direction} className="p-4 lg:p-8">
      <Card className="rounded-xl overflow-hidden border-none shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-[var(--text-main)] text-xl font-bold">
            <History size={24} className="text-[var(--primary)]" />
            {t("shifts") || "الورديات"}
          </CardTitle>

          <CardDescription className="text-gray-500">{t("shifts_list_desc") || "إضافة وعرض وإدارة ورديات الكاشير في مختلف الفروع"}</CardDescription>

         { hasPermission(Permissions?.shifts?.open) && (
           <CardAction>
            <Button onClick={() => setIsAddModalOpen(true)} className="bg-[var(--primary)] hover:opacity-90 text-white gap-2 rounded-xl h-11 px-6 font-bold transition-all">
              <Plus size={18} />
              {t("add_shift") || "إضافة وردية"}
            </Button>
          </CardAction> 
          )}
        </CardHeader>

        <CardContent>
          {isShiftsLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : (
            <DataTable
              value={filteredData}
              paginator
              rows={10}
              header={header}
              className="custom-green-table no-wrap-header text-xs"
              tableStyle={{ minWidth: "100%" }}
              responsiveLayout="scroll"
              dir={direction}
              rowHover
              stripedRows
              pt={{
                header: { className: "py-2 px-2" },
                bodyRow: { className: "text-xs" },
              }}
            >
              <Column field="id" header="رقم" sortable className="text-center whitespace-nowrap py-2 px-1 w-[50px] font-bold" />
              <Column field="shiftDate" header="التاريخ" sortable body={(row) => <span className="whitespace-nowrap text-[13px] font-semibold">{row.shiftDate?.split("T")[0]}</span>} className="whitespace-nowrap py-2 px-1 w-[110px]" />
              <Column
                field="startTime"
                header="الوقت"
                sortable
                className="whitespace-nowrap py-2 px-1 w-[90px]"
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
              />
              <Column field="branchName" header="الفرع" sortable className="whitespace-nowrap py-2 px-2" />
              <Column header="الجهاز" className="whitespace-nowrap py-2 px-1 w-[80px] text-center" body={(row) => row.deviceName || row.deviceId || "---"} />
              <Column field="employeeName" header="المستخدم" sortable className="whitespace-nowrap py-2 px-2" body={(row) => row.employeeName || "المسؤول"} />
              <Column field="status" header="الحالة" sortable body={statusTemplate} className="text-center whitespace-nowrap py-2 px-1 w-[80px]" />
              <Column field="openingBalance" header="الرصيد" sortable body={balanceTemplate} className="text-center whitespace-nowrap py-2 px-1 w-[80px]" />
              <Column header="العمليات" body={actionsTemplate} className="text-center whitespace-nowrap py-2 px-1 w-[70px]" />
            </DataTable>
          )}
        </CardContent>
      </Card>

      <AddShiftModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} isAdmin={isAdmin} defaultBranchId={isAdmin ? 0 : userBranchId ? parseInt(userBranchId) : 0} defaultEmployeeId={userId ? parseInt(userId) : 0} />

      {isReportModalOpen && selectedShift && (
        <ShiftReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          shiftId={selectedShift.id}
          onConfirmCloseShift={() => {
            if (!selectedShift) return;
            const fullTime = new Date().toLocaleTimeString("en-GB", { hour12: false });
            closeShift(
              {
                shiftId: selectedShift.id,
                endTime: fullTime,
              },
              {
                onSuccess: () => setIsReportModalOpen(false),
              },
            );
          }}
          showCloseButton={selectedShift.status === "Open"}
        />
      )}
    </div>
  );
}
