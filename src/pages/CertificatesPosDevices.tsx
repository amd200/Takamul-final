import React, { useMemo, useState } from "react";
import { Search, Plus, Edit2, Trash2, KeyRound, ArrowUpCircle, FilePlus2, ShieldPlus, Monitor } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { DataTable, DataTablePageEvent } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { POSDevice } from "@/features/pos/types/pos.types";
import AddPOSDeviceModal from "@/components/modals/AddPOSDeviceModal";
import { useDeleteDevicePOS } from "@/features/pos/hooks/useDeleteDevicePOS";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import formatDate from "@/lib/formatDate";
import { useGetAllPOSDevices } from "@/features/posDevice/hooks/useGetAllPOSDevices";

function DeleteDeviceButton({ device, onDelete, setHiddenIds }: { device: POSDevice; onDelete: (id: number) => Promise<unknown>; setHiddenIds: React.Dispatch<React.SetStateAction<Set<number>>> }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button className="btn-minimal-action" title="حذف">
          <Trash2 size={16} />
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent size="default" className="shadow-none">
        <AlertDialogTitle className="text-base font-bold text-red-500 text-right">حذف الجهاز {device.deviceName}</AlertDialogTitle>
        <AlertDialogDescription className="text-sm text-right mt-1 mb-6">هل أنت متأكد من هذا؟</AlertDialogDescription>
        <div className="flex items-center gap-2 justify-end">
          <AlertDialogCancel className="bg-transparent hover:bg-[var(--table-row-hover)] px-5 py-5 text-sm font-medium transition-colors">إلغاء</AlertDialogCancel>
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

function CertificateBadge({ status, isCertificateExpired, type }: { status: "NotRegistered" | "PendingOTP" | "CCSIDRegistered" | "PCSIDRegistered"; isCertificateExpired: boolean; type: "CCSID" | "PCSID" }) {
  const isRegistered = type === "PCSID" ? status === "PCSIDRegistered" : status === "CCSIDRegistered" || status === "PCSIDRegistered";

  if (!isRegistered) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-50 text-gray-500 border border-gray-200">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
        غير مسجل
      </span>
    );
  }

  if (isCertificateExpired) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-200">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
        منتهي
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
      مسجل
    </span>
  );
}

export default function CertificatesPosDevices() {
  const { t, direction } = useLanguage();

  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<POSDevice | null>(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState<number | null>(null);
  const [hiddenIds, setHiddenIds] = useState<Set<number>>(new Set());

  const { data: devices } = useGetAllPOSDevices();
  const { mutateAsync: deleteDevice } = useDeleteDevicePOS();

  const visibleDevices = useMemo(() => (devices?.data ?? []).filter((d) => !hiddenIds.has(d.id)), [devices?.data, hiddenIds]);

  const selectedDeviceDetails = useMemo(() => visibleDevices.find((d) => d.id === selectedDeviceId) ?? null, [visibleDevices, selectedDeviceId]);

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
    <>
      <Card>
        <CardHeader>
          <CardTitle>ملخص حالة الشهادات — جميع الأجهزة</CardTitle>
          <CardDescription>إدارة شهادات أجهزة نقاط البيع المسجلة</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <Select value={selectedDeviceId?.toString() ?? ""} onValueChange={(val) => setSelectedDeviceId(val ? Number(val) : null)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="اختر جهاز لعرض تفاصيله" />
            </SelectTrigger>
            <SelectContent>
              {visibleDevices.map((d) => (
                <SelectItem key={d.id} value={d.id.toString()}>
                  {d.deviceName} — {d.serialNumber}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedDeviceDetails && (
            <div className="border border-gray-100 rounded-xl p-4 bg-gray-50 grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-6 text-sm">
              <div>
                <p className="text-gray-400 text-xs mb-0.5">اسم الجهاز</p>
                <p className="font-semibold text-gray-800">{selectedDeviceDetails.deviceName}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-0.5">الرقم التسلسلي</p>
                <p className="font-mono text-gray-700">{selectedDeviceDetails.serialNumber}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-0.5">الحالة</p>
                <p className="font-medium text-gray-800">{selectedDeviceDetails.status}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-0.5">الفرع</p>
                <p className="font-medium text-gray-800">{selectedDeviceDetails.branchName ?? "—"}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-0.5">رقم التسجيل</p>
                <p className="font-mono text-gray-700">{selectedDeviceDetails.registrationNumber || "—"}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-0.5">تاريخ الإصدار</p>
                <p className="font-mono text-gray-700">{formatDate(selectedDeviceDetails.certificateIssuedAt) ?? "—"}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-0.5">تاريخ الانتهاء</p>
                <p className={`font-mono ${selectedDeviceDetails.isCertificateExpired ? "text-red-500" : "text-gray-700"}`}>{formatDate(selectedDeviceDetails.certificateExpiresAt) ?? "—"}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-0.5">الأيام المتبقية</p>
                <p className={`font-semibold ${selectedDeviceDetails.daysUntilExpiry <= 30 ? "text-red-500" : "text-green-600"}`}>{selectedDeviceDetails.daysUntilExpiry} يوم</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-0.5">الموقع</p>
                <p className="text-gray-700">{selectedDeviceDetails.location || "—"}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-0.5">الاسم الشائع</p>
                <p className="text-gray-700">{selectedDeviceDetails.commonName || "—"}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-0.5">آخر PIH</p>
                <p className="font-mono text-gray-700 truncate">{selectedDeviceDetails.lastPIH || "—"}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-0.5">ICV الحالي</p>
                <p className="font-mono text-gray-700">{selectedDeviceDetails.currentICV}</p>
              </div>
            </div>
          )}

          {/* DataTable */}
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
            <Column field="certificateType" header="CCSID" style={{ width: "15%" }} body={(row: POSDevice) => <CertificateBadge status={row.status} isCertificateExpired={row.isCertificateExpired} type="CCSID" />} />
            <Column field="certificateType2" header="PCSID" style={{ width: "15%" }} body={(row: POSDevice) => <CertificateBadge status={row.status} isCertificateExpired={row.isCertificateExpired} type="PCSID" />} />
            <Column field="certificateExpiresAt" header="تاريخ الانتهاء" style={{ width: "10%" }} body={(row: POSDevice) => <span className="text-sm font-mono text-gray-700">{formatDate(row.certificateExpiresAt) ?? "—"}</span>} />
            <Column
              header="العمليات"
              style={{ width: "10%" }}
              body={(row: POSDevice) => {
                const isCCSID = row.status === "CCSIDRegistered";
                const isPCSID = row.status === "PCSIDRegistered";
                const isNotRegistered = row.status === "NotRegistered" || row.status === "PendingOTP";

                return (
                  <div className="flex items-center gap-2 justify-center">
                    {isNotRegistered && (
                      <button
                        onClick={() => {
                          setSelectedDevice(row);
                          setIsAddModalOpen(true);
                        }}
                        className="btn-minimal-action text-blue-600 hover:text-blue-700"
                        title="استكمال التسجيل"
                      >
                        <Monitor size={16} />
                      </button>
                    )}

                    {isCCSID && (
                      <button
                        onClick={() => {
                          setSelectedDevice(row);
                          setIsAddModalOpen(true);
                        }}
                        className="btn-minimal-action text-green-600 hover:text-green-700"
                        title="ترقية"
                      >
                        <ArrowUpCircle size={16} />
                      </button>
                    )}

                    {<DeleteDeviceButton device={row} onDelete={deleteDevice} setHiddenIds={setHiddenIds} />}

                    {/* <button
                      onClick={() => {
                        setSelectedDevice(row);
                      }}
                      className="btn-minimal-action text-yellow-600 hover:text-yellow-700"
                      title="إدخال OTP"
                    >
                      <KeyRound size={16} />
                    </button> */}
                  </div>
                );
              }}
            />
          </DataTable>
        </CardContent>
      </Card>
    </>
  );
}
