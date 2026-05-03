import { httpClient } from "@/api/httpClient";
import { SettingsResponse } from "../types/settings.types";

// ===================
// GET
// ===================

export const getAllSettings = () => httpClient<SettingsResponse>(`/Settings`);

// ===================
// MUTATIONS
// ===================

export const updateTobaccoFees = (data: { tobaccoFees: number }) =>
  httpClient("/Settings/tobacco", {
    method: "PUT",
    data,
  });

export const updateGeneralSettings = (data: { topDataStatus: boolean; image: string }) =>
  httpClient("/Settings/general", {
    method: "PUT",
    data,
  });

export const updateSiteSettings = (data: {
  rowsPerPage: number;
  defaultPaymentCompany: number;
  showActualBalance: boolean;
  showCostGreaterThanSalePriceMessage: boolean;
  showItemCodeInSalesPrint: boolean;
  showItemCodeInQuotations: boolean;
  showItemCodeInPurchases: boolean;
  postype: string;
}) =>
  httpClient("/Settings/Site", {
    method: "PUT",
    data,
  });

export const updateItemsSettings = (data: {
  itemTax: boolean;
  itemExpiry: boolean;
  showWarehouseItems: boolean;
  enableSecondLanguageItemName: boolean;
  showProductBalanceAtSale: boolean;
  allowPriceChangeOnSale: boolean;
  taxPhase: string;
}) =>
  httpClient("/Settings/items", {
    method: "PUT",
    data,
  });

export const updateSalesSettings = (data: {
  allowSaleWithZeroStock: boolean;
  defaultSalesVault: number;
  defaultPurchasesVault: number;
  showOrderDeviceNumber: boolean;
  isTekawuy: boolean;
  isTables: boolean;
  isDelivary: boolean;
}) =>
  httpClient("/Settings/sales", {
    method: "PUT",
    data,
  });

export const updateBarcodeSettings = (data: {
  barcodeType: number;
  barcodeTotalCharacters: number;
  barcodeFlagCharacters: number;
  barcodeStartPosition: number;
  barcodeCodeCharactersCount: number;
  barcodeWeightStartPosition: number;
  barcodeWeightCharactersCount: number;
  barcodeDivideWeightBy: number;
}) =>
  httpClient("/Settings/barcode", {
    method: "PUT",
    data,
  });
