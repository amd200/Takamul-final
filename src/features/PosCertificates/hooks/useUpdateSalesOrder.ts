import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateCategory } from "@/features/categories/services/categories";
import type { CreateCategory } from "@/features/categories/types/categories.types";
import { categoriesKeys } from "@/features/categories/keys/categories.keys";

type UpdateCategoryPayload = {
  id: number;
  data: CreateCategory;
};

export function useUpdateSalesOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: UpdateCategoryPayload) => updateCategory(id, data as any),
    onSuccess: (response) => {
      console.log(response);
      queryClient.invalidateQueries({
        queryKey: categoriesKeys.all,
      });
    },
    onError: (error) => {
      console.error("API ERROR ", error);
    },
  });
}
