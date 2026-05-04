import { httpClient } from "@/api/httpClient";
import { Shift, OpenShiftRequest } from "../types/shifts.types";

export const getAllShifts = () => httpClient<Shift[]>("/Shifts");

export const openShift = (data: OpenShiftRequest) =>
  httpClient("/Shifts/open", {
    method: "POST",
    data,
  });

export const closeShift = (data: { shiftId: number; endTime: string }) =>
  httpClient("/Shifts/close", {
    method: "POST",
    data,
  });

export const getEmployeesByBranch = (branchId: number) =>
  httpClient<{ success: boolean; data: { id: number; firstName: string }[] }>(`/Shifts/EmployeeBybranch/${branchId}`);
