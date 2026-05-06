import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { posKeys } from "../keys/posDevice.keys";
import { GetAllPOSDevicesResponse } from "../types/posDevice.types";
import { getAllPOSDevices } from "../services/posDevice";

export const useGetAllPOSDevices = () =>
  useQuery<GetAllPOSDevicesResponse>({
    queryKey: posKeys.list(),
    queryFn: () => getAllPOSDevices(),
  });
