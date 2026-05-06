import { useQuery } from "@tanstack/react-query";
import { certificatesKeys } from "../keys/certificates.keys";
import { GetAllSummaryResponse } from "../types/pos.types";
import { getAllSummary } from "../services/certificates";

export const useGetAllSummary = () =>
  useQuery<GetAllSummaryResponse>({
    queryKey: certificatesKeys.summary(),
    queryFn: () => getAllSummary(),
  });
