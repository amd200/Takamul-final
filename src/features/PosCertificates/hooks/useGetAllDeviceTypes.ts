import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { posKeys } from "../keys/pos.keys";
import { getAllDevicesTypes, getAllPOSDevices, getAllTables, getOrderByTableId } from "../services/pos";
import { GetAllDeviceTypesResponse } from "../types/pos.types";

export const useGetAllDeviceTypes = () =>
  useQuery<GetAllDeviceTypesResponse>({
    queryKey: posKeys.types(),
    queryFn: () => getAllDevicesTypes(),
  });
