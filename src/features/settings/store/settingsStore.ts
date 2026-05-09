import { create } from "zustand";
import { Settings } from "../types/settings.types";

// ─── Types ────────────────────────────────────────────────────────────────────

type TobaccoFeesSettings = Settings["tobaccoFees"];

type GeneralSettings = Settings["general"];

type LocationSettings = Settings["location"];

type ItemsSettings = Settings["items"];

type SalesSettings = Settings["sales"];

type BarcodeScaleSettings = Settings["barcodeScale"];

type TaxSetting = NonNullable<Settings["taxSetting"]>;

type MoneySettings = Settings["money"];
type WhatsAppSettings = Settings["whatsApp"];

interface PointsSettings {
  customerPointsPerSpend: number;
  totalCustomerPoints: number;
  staffPointsPerSale: number;
  totalStaffPoints: number;
}

// ─── Default Values ───────────────────────────────────────────────────────────

const defaultSettings: Settings = {
  tobaccoFees: {
    tobaccoFees: 0,
  },
  general: {
    topDataStatus: true,
    image: "",
  },
  location: {
    rowsPerPage: 10,
    defaultPaymentCompany: 1,
    showActualBalance: true,
    showCostGreaterThanSalePriceMessage: true,
    showItemCodeInSalesPrint: false,
    showItemCodeInQuotations: false,
    showItemCodeInPurchases: false,
    postype: 1,
    posPurcherstype: 1,
  },
  items: {
    itemTax: true,
    itemExpiry: false,
    showWarehouseItems: true,
    enableSecondLanguageItemName: false,
    showProductBalanceAtSale: true,
    allowPriceChangeOnSale: false,
    taxPhase: "FirstStage",
  },
  sales: {
    allowSaleWithZeroStock: false,
    defaultSalesVault: 1,
    defaultPurchasesVault: 1,
    showOrderDeviceNumber: false,
    isTekawuy: false,
    isTables: false,
    isDelivary: false,
    enableCursorOnAddProduct: false,
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
  taxSetting: {
    taxSetting: "FirstStage",
    itemTax: false,
  },
  money: {
    decimals: 2,
    quantityDecimals: 2,
    southAsiaFormat: false,
    decimalSeparator: ".",
    thousandSeparator: ",",
    showCurrencySymbol: true,
    currencySymbol: "SAR",
    a4InvoiceDecimals: 2,
  },
  whatsApp: {
    whatsAppAccessToken: null,
    whatsAppAppId: null,
    whatsAppAppSecret: null,
    whatsAppBusinessAccountId: null,
    whatsAppPhoneNumberId: null,
  },
};

// ─── Store ────────────────────────────────────────────────────────────────────

interface SettingsStore {
  settings: Settings;

  setSettings: (settings: Settings) => void;
  setTobaccoFees: (data: Partial<TobaccoFeesSettings>) => void;
  setGeneral: (data: Partial<GeneralSettings>) => void;
  setLocation: (data: Partial<LocationSettings>) => void;
  setItems: (data: Partial<ItemsSettings>) => void;
  setSales: (data: Partial<SalesSettings>) => void;
  setBarcodeScale: (data: Partial<BarcodeScaleSettings>) => void;
  setTaxSetting: (data: Partial<TaxSetting>) => void;
  setMoney: (data: Partial<MoneySettings>) => void;

  setWhatsApp: (data: Partial<WhatsAppSettings>) => void;

  setRowsPerPage: (value: number) => void;
  setDefaultPaymentCompany: (value: number) => void;
  setDefaultSalesVault: (value: number) => void;
  setDefaultPurchasesVault: (value: number) => void;

  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: defaultSettings,

  setSettings: (settings) =>
    set((state) => ({
      settings: {
        ...state.settings,
        ...settings,
      },
    })),

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

  setTaxSetting: (
    data, // ✅
  ) =>
    set((state) => ({
      settings: {
        ...state.settings,
        taxSetting: { ...state.settings.taxSetting, ...data } as TaxSetting,
      },
    })),

  setMoney: (data) =>
    set((state) => ({
      settings: {
        ...state.settings,
        money: { ...state.settings.money, ...data },
      },
    })),

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
  setWhatsApp: (data) =>
    set((state) => ({
      settings: {
        ...state.settings,
        WhatsAppSettings: {
          ...state.settings.whatsApp,
          ...data,
        },
      },
    })),

  resetSettings: () => set({ settings: defaultSettings }),
}));

// ─── Selectors ────────────────────────────────────────────────────────────────
export const selectTobaccoFees = (s: SettingsStore) => s.settings.tobaccoFees;
export const selectGeneral = (s: SettingsStore) => s.settings.general;
export const selectLocation = (s: SettingsStore) => s.settings.location;
export const selectItems = (s: SettingsStore) => s.settings.items;
export const selectSales = (s: SettingsStore) => s.settings.sales;
export const selectBarcodeScale = (s: SettingsStore) => s.settings.barcodeScale;
export const selectTaxSetting = (s: SettingsStore) => s.settings.taxSetting; // ✅
export const selectMoney = (s: SettingsStore) => s.settings.money; // ✅

export const selectRowsPerPage = (s: SettingsStore) => s.settings.location.rowsPerPage;
export const selectAllowSaleWithZeroStock = (s: SettingsStore) => s.settings.sales.allowSaleWithZeroStock;
export const selectItemTax = (s: SettingsStore) => s.settings.items.itemTax;
export const selectTopDataStatus = (s: SettingsStore) => s.settings.general.topDataStatus;
