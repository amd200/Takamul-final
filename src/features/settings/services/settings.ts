import { httpClient } from "@/api/httpClient";
import { Settings } from "../types/settings.types";

// ===================
// GET
// ===================

export const getAllSettings = async () => {
  const response = await httpClient<Settings>(`/Settings`);

  if (response.items) {
    // Map taxSetting (from separate object) to items.taxPhase (which the UI uses)
    const rawTaxSetting = response.taxSetting?.taxSetting;
    const rawItemsTaxPhase = (response.items as any).taxPhase;
    const phaseSource = rawTaxSetting || rawItemsTaxPhase;
    const phaseStr = String(phaseSource || "");

    let finalPhase = "FirstStage"; 
    if (phaseStr === "2" || phaseStr === "SecondStage") finalPhase = "SecondStage";
    else if (phaseStr === "3" || phaseStr === "Exempt") finalPhase = "Exempt";
    else if (phaseStr === "1" || phaseStr === "FirstStage") finalPhase = "FirstStage";
    else if (phaseStr && phaseStr !== "undefined") finalPhase = phaseStr;

    response.items.taxPhase = finalPhase;
    
    // Sync itemTax from taxSetting if it exists
    if (response.taxSetting && response.taxSetting.itemTax !== undefined) {
      response.items.itemTax = response.taxSetting.itemTax;
    }

    // Also ensure response.taxSetting is populated for the store
    if (!response.taxSetting) {
      response.taxSetting = { taxSetting: finalPhase, itemTax: response.items.itemTax || false };
    } else {
      response.taxSetting.taxSetting = finalPhase;
    }
  }
  return response;
};

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
  postype: number | string;
  posPurcherstype: number | string;
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
  enableCursorOnAddProduct: boolean;
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
export const updateTaxSettings = (data: { taxSetting: string; itemTax: boolean }) =>
  httpClient("/Settings/tax", {
    method: "PUT",
    data,
  });
