"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteCategory } from "@/features/categories/services/categories";
import { categoriesKeys } from "@/features/categories/keys/categories.keys";

export function useDeleteCategories() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteCategory(id),
    onSuccess: (response) => {
      console.log(response);
      queryClient.invalidateQueries({
        queryKey: categoriesKeys.all,
      });
    },
    onError: (error) => {
      console.error("API ERROR ❌", error);
    },
  });
}
