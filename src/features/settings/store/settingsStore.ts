import { create } from "zustand";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TobaccoFeesSettings {
  tobaccoFees: number;
}

interface GeneralSettings {
  topDataStatus: boolean;
  image: string;
  language: string;
}

interface LocationSettings {
  rowsPerPage: number;
  defaultPaymentCompany: number;
  showActualBalance: boolean;
  showCostGreaterThanSalePriceMessage: boolean;
  showItemCodeInSalesPrint: boolean;
  showItemCodeInQuotations: boolean;
  showItemCodeInPurchases: boolean;
  postype: number | string;
}

interface ItemsSettings {
  itemTax: boolean;
  itemExpiry: boolean;
  showWarehouseItems: boolean;
  enableSecondLanguageItemName: boolean;
  showProductBalanceAtSale: boolean;
  allowPriceChangeOnSale: boolean;
  taxPhase: string;
}

interface SalesSettings {
  allowSaleWithZeroStock: boolean;
  defaultSalesVault: number;
  defaultPurchasesVault: number;
  showOrderDeviceNumber: boolean;
  isTekawuy: boolean;
  isTables: boolean;
  isDelivary: boolean;
  enableCursorOnAddProduct: boolean;
  enableGlasses: boolean;
}

interface BarcodeScaleSettings {
  barcodeType: number;
  barcodeTotalCharacters: number;
  barcodeFlagCharacters: number;
  barcodeStartPosition: number;
  barcodeCodeCharactersCount: number;
  barcodeWeightStartPosition: number;
  barcodeWeightCharactersCount: number;
  barcodeDivideWeightBy: number;
}

interface MoneySettings {
  decimals: number;
  quantityDecimals: number;
  southAsiaFormat: boolean;
  decimalSeparator: string;
  thousandSeparator: string;
  showCurrencySymbol: boolean;
  currencySymbol: string;
  a4InvoiceDecimals: number;
}

export interface Settings {
  tobaccoFees: TobaccoFeesSettings;
  general: GeneralSettings;
  location: LocationSettings;
  items: ItemsSettings;
  sales: SalesSettings;
  barcodeScale: BarcodeScaleSettings;
  money: MoneySettings;
}

// ─── Default Values ───────────────────────────────────────────────────────────

const defaultSettings: Settings = {
  tobaccoFees: {
    tobaccoFees: 0,
  },
  general: {
    topDataStatus: true,
    image: "",
    language: "ar",
  },
  location: {
    rowsPerPage: 10,
    defaultPaymentCompany: 1,
    showActualBalance: true,
    showCostGreaterThanSalePriceMessage: true,
    showItemCodeInSalesPrint: true,
    showItemCodeInQuotations: true,
    showItemCodeInPurchases: true,
    postype: 1,
  },
  items: {
    itemTax: true,
    itemExpiry: false,
    showWarehouseItems: true,
    enableSecondLanguageItemName: false,
    showProductBalanceAtSale: true,
    allowPriceChangeOnSale: false,
    taxPhase: "مرحلة اولى",
  },
  sales: {
    allowSaleWithZeroStock: false,
    defaultSalesVault: 1,
    defaultPurchasesVault: 1,
    showOrderDeviceNumber: false,
    isTekawuy: false,
    isTables: false,
    isDelivary: false,
    enableCursorOnAddProduct: true,
    enableGlasses: false,
  },
  barcodeScale: {
    barcodeType: 1,
    barcodeTotalCharacters: 13,
    barcodeFlagCharacters: 0,
    barcodeStartPosition: 1,
    barcodeCodeCharactersCount: 5,
    barcodeWeightStartPosition: 7,
    barcodeWeightCharactersCount: 5,
    barcodeDivideWeightBy: 1000,
  },
  money: {
    decimals: 2,
    quantityDecimals: 2,
    southAsiaFormat: false,
    decimalSeparator: ".",
    thousandSeparator: ",",
    showCurrencySymbol: true,
    currencySymbol: "ر.س",
    a4InvoiceDecimals: 4,
  },
};

// ─── Store ────────────────────────────────────────────────────────────────────

interface SettingsStore {
  settings: Settings;

  // Setters per section
  setSettings: (settings: Settings) => void;
  setTobaccoFees: (data: Partial<TobaccoFeesSettings>) => void;
  setGeneral: (data: Partial<GeneralSettings>) => void;
  setLocation: (data: Partial<LocationSettings>) => void;
  setItems: (data: Partial<ItemsSettings>) => void;
  setSales: (data: Partial<SalesSettings>) => void;
  setBarcodeScale: (data: Partial<BarcodeScaleSettings>) => void;

  // Granular field setters — useful for single-field optimistic updates
  setRowsPerPage: (value: number) => void;
  setDefaultPaymentCompany: (value: number) => void;
  setDefaultSalesVault: (value: number) => void;
  setDefaultPurchasesVault: (value: number) => void;

  // Reset
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({settings: defaultSettings,

  // ── Replace the whole settings object (e.g. after fetching from API) ────────
  setSettings: (settings) =>
    set((state) => ({
      settings: {
        ...state.settings,
        ...settings,
        // Ensure money is preserved if not in API response
        money: settings.money || state.settings.money,
      },
    })),

  // ── Section-level setters ────────────────────────────────────────────────────
  setTobaccoFees: (data) =>
    set((state) => ({
      settings: {
        ...state.settings,
        tobaccoFees: { ...state.settings.tobaccoFees, ...data },
      },
    })),

  setGeneral: (data) =>
    set((state) => ({
      settings: {
        ...state.settings,
        general: { ...state.settings.general, ...data },
      },
    })),

  setLocation: (data) =>
    set((state) => ({
      settings: {
        ...state.settings,
        location: { ...state.settings.location, ...data },
      },
    })),

  setItems: (data) =>
    set((state) => ({
      settings: {
        ...state.settings,
        items: { ...state.settings.items, ...data },
      },
    })),

  setSales: (data) =>
    set((state) => ({
      settings: {
        ...state.settings,
        sales: { ...state.settings.sales, ...data },
      },
    })),

  setBarcodeScale: (data) =>
    set((state) => ({
      settings: {
        ...state.settings,
        barcodeScale: { ...state.settings.barcodeScale, ...data },
      },
    })),

  // ── Granular setters ─────────────────────────────────────────────────────────
  setRowsPerPage: (value) =>
    set((state) => ({
      settings: {
        ...state.settings,
        location: { ...state.settings.location, rowsPerPage: value },
      },
    })),

  setDefaultPaymentCompany: (value) =>
    set((state) => ({
      settings: {
        ...state.settings,
        location: { ...state.settings.location, defaultPaymentCompany: value },
      },
    })),

  setDefaultSalesVault: (value) =>
    set((state) => ({
      settings: {
        ...state.settings,
        sales: { ...state.settings.sales, defaultSalesVault: value },
      },
    })),

  setDefaultPurchasesVault: (value) =>
    set((state) => ({
      settings: {
        ...state.settings,
        sales: { ...state.settings.sales, defaultPurchasesVault: value },
      },
    })),

  // ── Reset to defaults ────────────────────────────────────────────────────────
  resetSettings: () => set({ settings: defaultSettings }),
}));

// ─── Selectors ────────────────────────────────────────────────────────────────
export const selectTobaccoFees = (s: SettingsStore) => s.settings.tobaccoFees;
export const selectGeneral = (s: SettingsStore) => s.settings.general;
export const selectLocation = (s: SettingsStore) => s.settings.location;
export const selectItems = (s: SettingsStore) => s.settings.items;
export const selectSales = (s: SettingsStore) => s.settings.sales;
export const selectBarcodeScale = (s: SettingsStore) => s.settings.barcodeScale;

export const selectRowsPerPage = (s: SettingsStore) => s.settings.location.rowsPerPage;
export const selectAllowSaleWithZeroStock = (s: SettingsStore) => s.settings.sales.allowSaleWithZeroStock;
export const selectItemTax = (s: SettingsStore) => s.settings.items.itemTax;
export const selectTopDataStatus = (s: SettingsStore) => s.settings.general.topDataStatus;