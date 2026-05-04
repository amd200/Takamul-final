export type SettingsResponse = {
  tobaccoFees: {
    tobaccoFees: number;
  };

  general: {
    topDataStatus: boolean;
    image: string;
  };

  location: {
    rowsPerPage: number;
    defaultPaymentCompany: number;
    showActualBalance: boolean;
    showCostGreaterThanSalePriceMessage: boolean;
    showItemCodeInSalesPrint: boolean;
    showItemCodeInQuotations: boolean;
    showItemCodeInPurchases: boolean;
    postype: number | string;
  };

  items: {
    itemTax: boolean;
    itemExpiry: boolean;
    showWarehouseItems: boolean;
    enableSecondLanguageItemName: boolean;
    showProductBalanceAtSale: boolean;
    allowPriceChangeOnSale: boolean;
    taxPhase?: string;
  };

  sales: {
    allowSaleWithZeroStock: boolean;
    defaultSalesVault: number;
    defaultPurchasesVault: number;
    showOrderDeviceNumber: boolean;
    isTekawuy: boolean;
    isTables: boolean;
    isDelivary: boolean;
  };

  barcodeScale: {
    barcodeType: number;
    barcodeTotalCharacters: number;
    barcodeFlagCharacters: number;
    barcodeStartPosition: number;
    barcodeCodeCharactersCount: number;
    barcodeWeightStartPosition: number;
    barcodeWeightCharactersCount: number;
    barcodeDivideWeightBy: number;
  };

  taxSetting?: {
    taxSetting: string;
  };
};
