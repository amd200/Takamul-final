import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { posKeys } from "../keys/posDevice.keys";
import { GetAllPOSDevicesResponse, UpdateDevicePOS } from "../types/posDevice.types";
import useToast from "@/hooks/useToast";
import { handleApiSuccess } from "@/lib/handleApiSuccess";
import { handleApiError } from "@/lib/handleApiError";
import { updatePOSDevice } from "../services/posDevice";

export const useUpdatePOSDevice = () => {
  const queryClient = useQueryClient();
  const { notifyError, notifySuccess } = useToast();
  return useMutation({
    mutationKey: posKeys.list(),
    mutationFn: ({ id, data }: { id: number; data: UpdateDevicePOS }) => updatePOSDevice({ id, data }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({
        queryKey: posKeys.all,
      });
      handleApiSuccess(response, notifySuccess);
    },
    onError: (error) => handleApiError(error, notifyError),
  });
};
