import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { posKeys } from "../keys/pos.keys";
import { getPOSDeviceById } from "../services/pos";
import { GetPOSDevicesResponse } from "../types/pos.types";

export const useGetPOSDeviceById = (id: number) =>
  useQuery<GetPOSDevicesResponse>({
    queryKey: posKeys.detail(id),
    queryFn: () => getPOSDeviceById(id),
    enabled: !!id,
  });
