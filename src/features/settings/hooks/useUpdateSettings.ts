import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateGeneralSettings, updateSiteSettings, updateItemsSettings, updateSalesSettings, updateBarcodeSettings, updateTaxSettings } from "../services/settings";
import { settingsKeys } from "../keys/settings.keys";
import useToast from "@/hooks/useToast";
import { useLanguage } from "@/context/LanguageContext";

export const useUpdateGeneralSettings = () => {
  const queryClient = useQueryClient();
  const { notifySuccess } = useToast();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: updateGeneralSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.all });
      notifySuccess(t("settings_saved_successfully") || "تم حفظ الإعداد");
    },
  });
};

export const useUpdateSiteSettings = () => {
  const queryClient = useQueryClient();
  const { notifySuccess } = useToast();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: updateSiteSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.all });
      notifySuccess(t("settings_saved_successfully") || "تم حفظ الإعداد");
    },
  });
};

export const useUpdateItemsSettings = () => {
  const queryClient = useQueryClient();
  const { notifySuccess } = useToast();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: updateItemsSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.all });
      notifySuccess(t("settings_saved_successfully") || "تم حفظ الإعداد");
    },
  });
};

export const useUpdateSalesSettings = () => {
  const queryClient = useQueryClient();
  const { notifySuccess } = useToast();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: updateSalesSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.all });
      notifySuccess(t("settings_saved_successfully") || "تم حفظ الإعداد");
    },
  });
};

export const useUpdateBarcodeSettings = () => {
  const queryClient = useQueryClient();
  const { notifySuccess } = useToast();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: updateBarcodeSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.all });
      notifySuccess(t("settings_saved_successfully") || "تم حفظ الإعداد");
    },
  });
};

export const useUpdateTaxSettings = () => {
  const queryClient = useQueryClient();
  const { notifySuccess } = useToast();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: updateTaxSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.all });
      notifySuccess(t("settings_saved_successfully") || "تم حفظ الإعداد");
    },
  });
};
