import { httpClient } from "@/api/httpClient";
import { Shift, OpenShiftRequest } from "../types/shifts.types";

export const getAllShifts = () => httpClient<Shift[]>("/Shifts");

export const openShift = (data: OpenShiftRequest) =>
  httpClient("/Shifts/open", {
    method: "POST",
    data,
  });

export const closeShift = () =>
  httpClient("/Shifts/close", {
    method: "POST",
  });
