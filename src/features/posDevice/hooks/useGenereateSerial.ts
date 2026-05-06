import { useQuery } from "@tanstack/react-query";
import { posKeys } from "../keys/posDevice.keys";
import { GenereateSerialResponse } from "../types/posDevice.types";
import { genereateSerial } from "../services/posDevice";

export const useGenereateSerial = () =>
  useQuery<GenereateSerialResponse>({
    queryKey: posKeys.seiral(),
    queryFn: () => genereateSerial(),
  });
