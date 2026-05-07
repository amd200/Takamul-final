import { useQuery } from "@tanstack/react-query";
import { certificatesKeys } from "../keys/certificates.keys";
import { getAllCertificates } from "../services/certificates";
import { GetAllCertificatesResponse } from "../types/pos.types";

export const useGetAllCertificates = () =>
  useQuery<GetAllCertificatesResponse>({
    queryKey: certificatesKeys.list(),
    queryFn: () => getAllCertificates(),
  });
