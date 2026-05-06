import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { posKeys } from "../keys/posDevice.keys";
import { GetAllDeviceTypesResponse } from "../types/posDevice.types";
import { getAllDevicesTypes } from "../services/posDevice";

export const useGetAllDeviceTypes = () =>
  useQuery<GetAllDeviceTypesResponse>({
    queryKey: posKeys.types(),
    queryFn: () => getAllDevicesTypes(),
  });
