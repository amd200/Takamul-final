import React, { useMemo, useState } from "react";
import { Search, Plus, Settings, Edit2, Trash2, KeyRound } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { DataTable, DataTablePageEvent } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import AddPOSDeviceModal from "@/components/modals/AddPOSDeviceModal";
import { useDeleteDevicePOS } from "@/features/pos/hooks/useDeleteDevicePOS";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { set } from "zod";
import { useGetAllPOSDevices } from "@/features/posDevice/hooks/useGetAllPOSDevices";
import { POSDevice } from "@/features/posDevice/types/posDevice.types";
// import { useGetPOSDeviceById } from "@/features/pos/hooks/useGetPOSDeviceById";
// import AddPOSDeviceModal from "@/components/modals/AddPOSDeviceModal";

function DeleteDeviceButton({ device, onDelete, setHiddenIds }: { device: POSDevice; onDelete: (id: number) => Promise<unknown>; setHiddenIds: React.Dispatch<React.SetStateAction<Set<number>>> }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button className="btn-minimal-action" title="حذف">
          <Trash2 size={16} />
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent size="default" className="shadow-none">
        <AlertDialogTitle className=" text-base font-bold text-red-500 text-right">حذف الجهاز {device.deviceName}</AlertDialogTitle>
        <AlertDialogDescription className=" text-sm  text-right mt-1 mb-6">هل أنت متأكد من هذا؟</AlertDialogDescription>
        <div className="flex items-center gap-2 justify-end">
          <AlertDialogCancel className=" bg-transparent hover:bg-[var(--table-row-hover)]  px-5 py-5 text-sm font-medium transition-colors">إلغاء</AlertDialogCancel>
          <AlertDialogAction variant="destructive" className="px-5 py-5 text-sm font-medium transition-colors" onClick={() => handleDeleteWithUndo(device, onDelete, setHiddenIds)}>
            تأكيد الحذف
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function handleDeleteWithUndo(device: POSDevice, onDelete: (id: number) => Promise<unknown>, setHiddenIds: React.Dispatch<React.SetStateAction<Set<number>>>) {
  let undone = false;

  setHiddenIds((prev) => new Set(prev).add(device.id));

  toast.success(`تم حذف "${device.deviceName}"`, {
    duration: 5000,
    action: {
      label: "استرجاع",
      onClick: () => {
        undone = true;
        setHiddenIds((prev) => {
          const next = new Set(prev);
          next.delete(device.id);
          return next;
        });
      },
    },
    onDismiss: () => {
      if (!undone) onDelete(device.id);
    },
    onAutoClose: () => {
      if (!undone) onDelete(device.id);
    },
  });
}

function CertificateBadge({ certificateType, isCertificateExpired }: { certificateType: string; isCertificateExpired: boolean }) {
  if (isCertificateExpired) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-200">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
        منتهي
      </span>
    );
  }

  const isPCSID = certificateType?.toUpperCase().includes("PCSID");

  if (isPCSID) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
        PCSID فعال
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-200">
      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
      {certificateType} فقط
    </span>
  );
}



export default function POSDevicesList() {
  const { t, direction } = useLanguage();

  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<POSDevice | null>(null);
  const { data: devices } = useGetAllPOSDevices();
  const [hiddenIds, setHiddenIds] = useState<Set<number>>(new Set());
  const [editMode, setEditMode] = useState<boolean>(false);

  const visibleDevices = useMemo(() => (devices?.data ?? []).filter((d) => !hiddenIds.has(d.id)), [devices?.data, hiddenIds]);
  const { mutateAsync: deleteDevice } = useDeleteDevicePOS();

  const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGlobalFilterValue(e.target.value);
    setCurrentPage(1);
  };

  const renderHeader = () => (
    <div className="flex flex-col md:flex-row gap-4 items-center">
      <div className="relative flex-1 w-full">
        <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
          <Search size={18} className="text-gray-400" />
        </div>
        <Input type="text" value={globalFilterValue} onChange={onGlobalFilterChange} placeholder={t("search_placeholder")} className="pr-11" />
      </div>
    </div>
  );

  const header = useMemo(() => renderHeader(), [globalFilterValue, t]);

  return (
    <div className="p-4 space-y-4" dir={direction}>
      <Card>
        <CardHeader>
          <CardTitle>{t("pos_devices") ?? "نقاط البيع"}</CardTitle>
          <CardDescription>{"إدارة أجهزة نقاط البيع المسجلة"}</CardDescription>
          <CardAction>
            <Button
              size="xl"
              variant="default"
              onClick={() => {
                setSelectedDevice(null);
                setIsAddModalOpen(true);
              }}
            >
              <Plus size={20} />
              {"إضافة جهاز"}
            </Button>
          </CardAction>
        </CardHeader>

        <CardContent className="space-y-3">
          <DataTable
            value={visibleDevices || []}
            lazy
            paginator
            rows={entriesPerPage}
            first={(currentPage - 1) * entriesPerPage}
            totalRecords={devices?.data?.length || 0}
            onPage={(e: DataTablePageEvent) => {
              if (e.page === undefined) return;
              setCurrentPage(e.page + 1);
              setEntriesPerPage(e.rows);
            }}
            loading={!devices?.data}
            header={header}
            responsiveLayout="stack"
            className="custom-green-table custom-compact-table"
            dataKey="id"
            stripedRows={false}
          >
            <Column
              field="deviceName"
              header={t("device_name") ?? "اسم الجهاز"}
              sortable
              style={{ width: "22%" }}
              body={(row: POSDevice) => (
                <div>
                  <div className="font-bold text-gray-900">{row.deviceName}</div>
                  <div className="text-xs text-gray-400 mt-0.5 font-mono">SN: {row.serialNumber}</div>
                </div>
              )}
            />

            <Column field="branchName" header={t("branch") ?? "الفرع"} style={{ width: "18%" }} body={(row: POSDevice) => <span className="text-sm text-gray-700">{row.branchName ?? "-"}</span>} />

            <Column field="certificateType" header={"حالة الشهادة"} style={{ width: "15%" }} body={(row: POSDevice) => <CertificateBadge certificateType={row.certificateType} isCertificateExpired={row.isCertificateExpired} />} />

            <Column field="currentICV" header={"آخر ICV"} style={{ width: "10%" }} body={(row: POSDevice) => <span className="text-sm font-mono text-gray-700">{row.currentICV ?? 0}</span>} />

            {/* <Column field="lastPIH" header={t("last_sent") ?? "آخر إرسال"} style={{ width: "13%" }} body={(row: POSDevice) => <span className="text-sm text-gray-600">{formatLastSent(row.lastPIH)}</span>} /> */}

            <Column
              header="العمليات"
              style={{ width: "10%" }}
              body={(row: POSDevice) => (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setSelectedDevice(row);
                      setIsAddModalOpen(true);
                      if (row.status == "NotRegistered") {
                        setEditMode(false);
                      } else {
                        setEditMode(true);
                      }
                    }}
                    className="btn-minimal-action"
                    title={!row.certificateType?.toUpperCase().includes("PCSID") && row.certificateType?.toUpperCase().includes("CCSID") ? "استكمال التسجيل" : "تعديل"}
                  >
                    <Edit2 size={16} />
                  </button>

                  {<DeleteDeviceButton device={row} onDelete={deleteDevice} setHiddenIds={setHiddenIds} />}
                </div>
              )}
            />
          </DataTable>
        </CardContent>
      </Card>

      <AddPOSDeviceModal
        editMode={editMode}
        device={selectedDevice}
        isOpen={isAddModalOpen}
        onOpenChange={(open) => {
          setIsAddModalOpen(open);
          setEditMode(false);

          if (!open) {
            setSelectedDevice(null);
          }
        }}
      />
    </div>
  );
}
