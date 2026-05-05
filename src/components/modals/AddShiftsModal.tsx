import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod/v3";
import { History } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGetAllBranches } from "@/features/Branches/hooks/Usegetallbranches";
import { useGetEmployeesByBranch, useOpenShift } from "@/features/shifts/hooks/useShifts";
import { useGetAllPOSDevices } from "@/features/pos/hooks/useGetAllPOSDevices";
import { OpenShiftRequest } from "@/features/shifts/types/shifts.types";

const shiftSchema = z.object({
  branchId: z.number().min(1, "الفرع مطلوب"),
  employeeId: z.number().min(1, "الموظف مطلوب"),
  deviceId: z.number().min(1, "الجهاز مطلوب"),
  openingBalance: z.number({ invalid_type_error: "الرصيد مطلوب" }).min(0, "الرصيد لا يمكن أن يكون سالباً"),
});

type ShiftFormData = z.infer<typeof shiftSchema>;

interface AddShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin: boolean;
  defaultBranchId?: number;
  defaultEmployeeId?: number;
}

export default function AddShiftModal({ isOpen, onClose, isAdmin, defaultBranchId, defaultEmployeeId }: AddShiftModalProps) {
  const { direction } = useLanguage();
  const { data: branches } = useGetAllBranches();
  const { mutateAsync: openShift, isPending } = useOpenShift();

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ShiftFormData>({
    resolver: zodResolver(shiftSchema),
    defaultValues: {
      branchId: defaultBranchId ?? 0,
      employeeId: defaultEmployeeId ?? 0,
      deviceId: 0,
      openingBalance: 0,
    },
  });

  const selectedBranchId = watch("branchId");

  const { data: branchEmployees } = useGetEmployeesByBranch(selectedBranchId);
  const { data: devices, isLoading: isDevicesLoading } = useGetAllPOSDevices();

  const now = new Date();
  const currentDate = now.toLocaleDateString("en-EG");
  const currentTime = now.toLocaleTimeString("en-EG", { hour: "2-digit", minute: "2-digit" });

  useEffect(() => {
    if (isOpen) {
      reset({
        branchId: defaultBranchId ?? 0,
        employeeId: defaultEmployeeId ?? 0,
        deviceId: 0,
        openingBalance: 0,
      });
    }
  }, [isOpen, reset, defaultBranchId, defaultEmployeeId]);

  const onSubmit = async (data: ShiftFormData) => {
    try {
      const payload: OpenShiftRequest = {
        shiftDate: new Date().toISOString().split("T")[0],
        startTime: new Date().toISOString(),
        branchId: data.branchId,
        employeeId: data.employeeId,
        deviceId: data.deviceId,
        openingBalance: data.openingBalance,
      };
      await openShift(payload);
      reset();
      onClose();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]" dir={direction}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <History size={20} />
            إضافة وردية
          </DialogTitle>
        </DialogHeader>

        <form id="shiftForm" onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-3">
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel>التاريخ</FieldLabel>
              <Input value={currentDate} readOnly className="bg-gray-100 border-gray-200 h-9 text-xs rounded-lg" />
            </Field>
            <Field>
              <FieldLabel>الوقت</FieldLabel>
              <Input value={currentTime} readOnly className="bg-gray-100 border-gray-200 h-9 text-xs rounded-lg" />
            </Field>
          </div>

          <Controller
            name="branchId"
            control={control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>
                  الفرع <span className="text-red-500">*</span>
                </FieldLabel>
                <Select value={field.value ? String(field.value) : ""} onValueChange={(val) => field.onChange(Number(val))} disabled={!isAdmin}>
                  <SelectTrigger className="w-full h-9 text-xs">
                    <SelectValue placeholder="اختر الفرع" />
                  </SelectTrigger>
                  <SelectContent className="z-[250]">
                    <SelectGroup>
                      {branches?.map((branch) => (
                        <SelectItem key={branch.id} value={String(branch.id)}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="employeeId"
            control={control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>
                  الموظف <span className="text-red-500">*</span>
                </FieldLabel>
                <Select key={field.value} value={field.value ? String(field.value) : ""} onValueChange={(val) => field.onChange(Number(val))} disabled={!isAdmin}>
                  <SelectTrigger className="w-full h-9 text-xs">
                    <SelectValue placeholder="اختر الموظف" />
                  </SelectTrigger>
                  <SelectContent className="z-[250]">
                    <SelectGroup>
                      {branchEmployees?.data?.map((emp) => (
                        <SelectItem key={emp.id} value={String(emp.id)}>
                          {emp.firstName || "\u00A0"}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="deviceId"
            control={control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>
                  جهاز إصدار الفواتير <span className="text-red-500">*</span>
                </FieldLabel>
                <Select value={field.value ? String(field.value) : ""} onValueChange={(val) => field.onChange(Number(val))}>
                  <SelectTrigger className="w-full h-9 text-xs">
                    <SelectValue placeholder="اختر الجهاز" />
                  </SelectTrigger>
                  <SelectContent className="z-[250]">
                    <SelectGroup>
                      {devices?.data?.map((device) => (
                        <SelectItem key={device.id} value={String(device.id)}>
                          {device.deviceName}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="openingBalance"
            control={control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>
                  الرصيد الافتتاحي <span className="text-red-500">*</span>
                </FieldLabel>
                <Input type="number" placeholder="0.00" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} className="border-gray-200 h-9 text-xs rounded-lg focus:border-[var(--primary)]" />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </form>

        <DialogFooter>
          <Button size="2xl" variant="outline" onClick={onClose} className="w-fit ">
            إلغاء
          </Button>
          <Button size="2xl" loading={isPending} form="shiftForm" className="w-fit ">
            حفظ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
