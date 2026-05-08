import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateTobaccoFees } from "../services/settings";
import { settingsKeys } from "../keys/settings.keys";
import useToast from "@/hooks/useToast";
import { useLanguage } from "@/context/LanguageContext";

export const useUpdateTobaccoFees = () => {
  const queryClient = useQueryClient();
  const { notifySuccess } = useToast();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: (data: { tobaccoFees: number }) => updateTobaccoFees(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.all });
      notifySuccess(t("settings_saved_successfully") || "تم حفظ الإعداد");
    },
  });
};
