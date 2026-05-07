import { useMutation, useQueryClient } from "@tanstack/react-query";
import { productsKeys } from "../keys/products.keys";
import { deleteProduct } from "../services/products";
import useToast from "@/hooks/useToast";
import { handleApiError } from "@/lib/handleApiError";

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  const { notifyError, notifySuccess } = useToast();
  return useMutation({
    mutationFn: (id: number) => deleteProduct(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({
        queryKey: productsKeys.all,
      });
      notifySuccess(response?.message);
    },
    onError: (error) => handleApiError(error, notifyError),
  });
}
