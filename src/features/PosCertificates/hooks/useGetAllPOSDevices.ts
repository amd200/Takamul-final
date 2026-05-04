import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { posKeys } from "../keys/pos.keys";
import { getAllPOSDevices, getAllTables, getOrderByTableId } from "../services/pos";
import { GetAllPOSDevicesResponse } from "../types/pos.types";

export const useGetAllPOSDevices = () =>
  useQuery<GetAllPOSDevicesResponse>({
    queryKey: posKeys.list(),
    queryFn: () => getAllPOSDevices(),
  });
