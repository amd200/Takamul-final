import { useQuery } from "@tanstack/react-query";
import { genereateSerial, getOrderByTableId } from "../services/pos";
import { GenereateSerialResponse } from "../types/pos.types";
import { certificatesKeys } from "../keys/certificates.keys";

export const useGetSummaryWithPosId = (posId: number) =>
  useQuery<GenereateSerialResponse>({
    queryKey: certificatesKeys.summary(posId),
    queryFn: () => genereateSerial(),
  });
