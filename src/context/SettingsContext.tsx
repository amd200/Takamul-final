import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useQuery } from "@tanstack/react-query";
import { getAllSettings } from "@/features/settings/services/settings";
import { settingsKeys } from "@/features/settings/keys/settings.keys";

export interface SystemSettings {
  site: {
    companyName: string;
    language: string;
    defaultCurrency: string;
    accountingMethod: string;
    defaultEmail: string;
    defaultCustomerGroup: string;
    generalPriceGroup: string;
    rtlSupport: boolean;
    invoiceEditDays: number;
    rowsPerPage: number;
    timezone: string;
    defaultBranch: string;
    defaultCashier: string;
    pdfLibrary: string;
    defaultPaymentCompany: string;
    expiryAlertDays: number;
    showActualBalance: boolean;
    showCostGreaterMsg: boolean;
    showItemCodeInSales: boolean;
    showItemCodeInQuotes: boolean;
    showItemCodeInPurchases: boolean;
    defaultSalesScreen: string;
  };
  items: {
    itemTax: boolean;
    shelves: boolean;
    itemVariants: boolean;
    itemExpiry: boolean;
    deleteExpiredItems: boolean;
    imageSize: { width: number; height: number };
    thumbnailSize: { width: number; height: number };
    watermark: boolean;
    showWarehouseItems: string;
    barcodeSeparator: string;
    barcodeStandard: string;
    inventoryTransfer: string;
    enableSecondLangName: boolean;
    enableThirdLangName: boolean;
    showProductBalanceAtSale: boolean;
    taxPhase: string;
  };
  sales: {
    sellIfZero: boolean;
    referenceFormat: string;
    itemSerial: boolean;
    addItemMethod: string;
    cursorPosition: string;
    defaultPaymentMethod: string;
    serialNameInInvoices: string;
    defaultPurchasePaymentMethod: string;
    enableQuickSearch: boolean;
    clearSearchFilters: boolean;
    enableMarketers: boolean;
    enableGlasses: boolean;
    enableCursorOnAddProduct: boolean;
    showServiceNumber: boolean;
    showOrderDeviceNumber: boolean;
    enableTakeaway: boolean;
    enableDineIn: boolean;
    enableDelivery: boolean;
  };
  prefixes: {
    product: string;
    sales: string;
    salesReturn: string;
    payment: string;
    purchasePayment: string;
    delivery: string;
    quotes: string;
    purchases: string;
    purchasesReturn: string;
    transfer: string;
    expenses: string;
    quantityAdjustment: string;
  };
  money: {
    decimals: number;
    quantityDecimals: number;
    southAsiaFormat: boolean;
    decimalSeparator: string;
    thousandSeparator: string;
    showCurrencySymbol: boolean;
    currencySymbol: string;
    a4InvoiceDecimals: number;
  };
  barcode: {
    type: string;
    totalCharacters: number;
    flagCharacters: string;
    codeStart: number;
    codeLength: number;
    weightStart: number;
    weightLength: number;
    weightDivider: number;
  };
  email: {
    protocol: string;
    smtpHost: string;
    smtpUser: string;
    smtpPassword?: string;
    smtpPort: number;
    smtpEncryption: string;
  };
  points: {
    customerPointsPerSpend: number;
    totalCustomerPoints: number;
    staffPointsPerSale: number;
    totalStaffPoints: number;
  };
  fees: {
    enableFees: boolean;
    feesValue: number;
    minFees: number;
  };
  reports: {
    headerStatus: boolean;
    headerImage: string;
  };
  tobacco: {
    tobaccoFees: number;
  };
  salesPrint: {
    printHeader: boolean;
    headerImage: string;
    showSellerAndRecipient: boolean;
    enableDotMatrix: boolean;
    purchaseOrderField: string;
    projectNameField: string;
  };
}

export interface POSSettings {
  config: {
    displayItems: number;
    defaultCategory: string;
    defaultCashier: string;
    defaultCustomer: string;
    displayTime: boolean;
    onScreenKeyboard: boolean;
    instructionsTool: boolean;
    rounding: boolean;
    itemOrder: string;
    afterSalePage: string;
    printCustomerDetails: boolean;
    displayTaxDetails: boolean;
    enableBillSuspension: boolean;
    cancelItemFromBill: boolean;
    enableBillCancellation: boolean;
    operationPassword?: string;
    enableOrderNumber: boolean;
    enableDisplayScreen: boolean;
    enableAlertSound: boolean;
    enableAdditions: boolean;
    enableTax: boolean;
    enableDiscount: boolean;
    enableReservations: boolean;
    allowNegativeStock: boolean;
    enableShortSalesReport: boolean;
    enableDailySalesReport: boolean;
  };
  printing: {
    printer: string;
  };
  customFields: {
    field1Value: string;
  };
  receipt: {
    header: string;
    footer: string;
    printAddress: boolean;
    printExtraId: boolean;
    printPhone: boolean;
    printTaxNumber: boolean;
    printReference: boolean;
    printCashier: boolean;
    printEmployee: boolean;
    printBarcode: boolean;
    printDiscount: boolean;
  };
  shortcuts: {
    focusSearch: string;
    cancelSale: string;
    suspendSale: string;
    lastInvoice: string;
    finishSale: string;
    todaySales: string;
    openSuspendedSales: string;
    closeShift: string;
  };
}

interface SettingsContextType {
  systemSettings: SystemSettings;
  posSettings: POSSettings;
  updateSystemSettings: (settings: Partial<SystemSettings>) => void;
  updatePOSSettings: (settings: Partial<POSSettings>) => void;
  saveSettings: () => void;
}

const defaultSystemSettings: SystemSettings = {
  site: {
    companyName: "تكامل",
    language: "Arabic",
    defaultCurrency: "Saudi Riyal",
    accountingMethod: "FIFO (First In First Out)",
    defaultEmail: "info@posit2030.com",
    defaultCustomerGroup: "عام",
    generalPriceGroup: "عام",
    rtlSupport: true,
    invoiceEditDays: 1000,
    rowsPerPage: 10,
    timezone: "Asia/Kuwait",
    defaultBranch: "تجريبي (WHI)",
    defaultCashier: "تجريبي",
    pdfLibrary: "mPDF",
    defaultPaymentCompany: "بدون",
    expiryAlertDays: 100,
    showActualBalance: true,
    showCostGreaterMsg: true,
    showItemCodeInSales: true,
    showItemCodeInQuotes: true,
    showItemCodeInPurchases: true,
    defaultSalesScreen: "POS1",
  },
  items: {
    itemTax: true,
    shelves: true,
    itemVariants: true,
    itemExpiry: true,
    deleteExpiredItems: false,
    imageSize: { width: 800, height: 800 },
    thumbnailSize: { width: 150, height: 150 },
    watermark: false,
    showWarehouseItems: "إظهار جميع الأصناف حتى لو رصيدها صفر",
    barcodeSeparator: "( _ ) Underscore",
    barcodeStandard: "صورة",
    inventoryTransfer: "تكلفة",
    enableSecondLangName: false,
    enableThirdLangName: false,
    showProductBalanceAtSale: true,
    taxPhase: "FirstStage",
  },
  sales: {
    sellIfZero: false,
    referenceFormat: "الشهر / السنة / تسلسل رقم (م / 08/001 / 4..)",
    itemSerial: true,
    addItemMethod: "زيادة كمية البند، إذا كان موجوداً بالفعل في ..",
    cursorPosition: "اضافة منتج جديد",
    defaultPaymentMethod: "",
    serialNameInInvoices: "",
    defaultPurchasePaymentMethod: "",
    enableQuickSearch: true,
    clearSearchFilters: true,
    enableMarketers: false,
    enableGlasses: false,
    enableCursorOnAddProduct: false,
    showServiceNumber: false,
    showOrderDeviceNumber: false,
    enableTakeaway: true,
    enableDineIn: true,
    enableDelivery: true,
  },
  prefixes: {
    product: "",
    sales: "SALE",
    salesReturn: "SR",
    payment: "IPAY",
    purchasePayment: "POP",
    delivery: "DO",
    quotes: "QUOTE",
    purchases: "PO",
    purchasesReturn: "PR",
    transfer: "TR",
    expenses: "Dep",
    quantityAdjustment: "Up",
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
  barcode: {
    type: "الوزن/الكمية",
    totalCharacters: 0,
    flagCharacters: "0",
    codeStart: 0,
    codeLength: 0,
    weightStart: 0,
    weightLength: 0,
    weightDivider: 0,
  },
  email: {
    protocol: "SMTP",
    smtpHost: "posit.sa",
    smtpUser: "info@posit.sa",
    smtpPassword: "",
    smtpPort: 465,
    smtpEncryption: "SSL",
  },
  points: {
    customerPointsPerSpend: 100.0,
    totalCustomerPoints: 0,
    staffPointsPerSale: 1.0,
    totalStaffPoints: 0,
  },
  fees: {
    enableFees: false,
    feesValue: 0,
    minFees: 0,
  },
  reports: {
    headerStatus: true,
    headerImage: "",
  },
  salesPrint: {
    printHeader: false,
    headerImage: "",
    showSellerAndRecipient: true,
    enableDotMatrix: false,
    purchaseOrderField: "رقم أمر الشراء",
    projectNameField: "اسم المشروع",
  },
};

const defaultPOSSettings: POSSettings = {
  config: {
    displayItems: 60,
    defaultCategory: "عام",
    defaultCashier: "تجريبي",
    defaultCustomer: "شخص عام(عميل افتراضي)",
    displayTime: true,
    onScreenKeyboard: false,
    instructionsTool: false,
    rounding: false,
    itemOrder: "Default",
    afterSalePage: "الإيصال",
    printCustomerDetails: false,
    displayTaxDetails: false,
    enableBillSuspension: true,
    cancelItemFromBill: true,
    enableBillCancellation: true,
    operationPassword: "",
    enableOrderNumber: false,
    enableDisplayScreen: false,
    enableAlertSound: true,
    enableAdditions: false,
    enableTax: false,
    enableDiscount: false,
    enableReservations: false,
    allowNegativeStock: false,
    enableShortSalesReport: false,
    enableDailySalesReport: false,
  },
  printing: {
    printer: "Web Browser",
  },
  customFields: {
    field1Value: "",
  },
  receipt: {
    header: "",
    footer: "",
    printAddress: true,
    printExtraId: true,
    printPhone: true,
    printTaxNumber: true,
    printReference: true,
    printCashier: true,
    printEmployee: true,
    printBarcode: true,
    printDiscount: false,
  },
  shortcuts: {
    focusSearch: "f3",
    cancelSale: "f11",
    suspendSale: "f7",
    lastInvoice: "f4",
    finishSale: "f9",
    todaySales: "Ctrl+f1",
    openSuspendedSales: "Ctrl+f2",
    closeShift: "Ctrl+f10",
  },
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(defaultSystemSettings);
  const [posSettings, setPOSSettings] = useState<POSSettings>(defaultPOSSettings);

  const { data: apiSettings } = useQuery({
    queryKey: settingsKeys.all,
    queryFn: getAllSettings,
  });

  useEffect(() => {
    if (apiSettings) {
      setSystemSettings((prev) => ({
        ...prev,
        site: {
          ...prev.site,
          rowsPerPage: apiSettings.location?.rowsPerPage ?? prev.site.rowsPerPage,
          showActualBalance: apiSettings.location?.showActualBalance ?? prev.site.showActualBalance,
          showCostGreaterMsg: apiSettings.location?.showCostGreaterThanSalePriceMessage ?? prev.site.showCostGreaterMsg,
          showItemCodeInSales: apiSettings.location?.showItemCodeInSalesPrint ?? prev.site.showItemCodeInSales,
          showItemCodeInQuotes: apiSettings.location?.showItemCodeInQuotations ?? prev.site.showItemCodeInQuotes,
          showItemCodeInPurchases: apiSettings.location?.showItemCodeInPurchases ?? prev.site.showItemCodeInPurchases,
          defaultPaymentCompany: String(apiSettings.location?.defaultPaymentCompany ?? prev.site.defaultPaymentCompany),
          defaultSalesScreen: (apiSettings.location?.postype === 1 || apiSettings.location?.postype === "Pos1") ? "POS1" : (apiSettings.location?.postype === 2 || apiSettings.location?.postype === "Pos2") ? "POS2" : prev.site.defaultSalesScreen,
        },
        items: {
          ...prev.items,
          itemTax: apiSettings.items?.itemTax ?? prev.items.itemTax,
          itemExpiry: apiSettings.items?.itemExpiry ?? prev.items.itemExpiry,
          showWarehouseItems: apiSettings.items?.showWarehouseItems ? "إظهار جميع الأصناف حتى لو رصيدها صفر" : "عدم إظهار جميع الأصناف حتى لو رصيدها صفر",
          enableSecondLangName: apiSettings.items?.enableSecondLanguageItemName ?? prev.items.enableSecondLangName,
          showProductBalanceAtSale: apiSettings.items?.showProductBalanceAtSale ?? prev.items.showProductBalanceAtSale,
          taxPhase: apiSettings.items?.taxPhase ?? prev.items.taxPhase,
        },
        sales: {
          ...prev.sales,
          sellIfZero: apiSettings.sales?.allowSaleWithZeroStock ?? prev.sales.sellIfZero,
          defaultPaymentMethod: String(apiSettings.sales?.defaultSalesVault ?? prev.sales.defaultPaymentMethod),
          defaultPurchasePaymentMethod: String(apiSettings.sales?.defaultPurchasesVault ?? prev.sales.defaultPurchasePaymentMethod),
          showOrderDeviceNumber: apiSettings.sales?.showOrderDeviceNumber ?? prev.sales.showOrderDeviceNumber,
          enableTakeaway: apiSettings.sales?.isTekawuy ?? prev.sales.enableTakeaway,
          enableDineIn: apiSettings.sales?.isTables ?? prev.sales.enableDineIn,
          enableDelivery: apiSettings.sales?.isDelivary ?? prev.sales.enableDelivery,
        },
        tobacco: {
          tobaccoFees: apiSettings.tobaccoFees?.tobaccoFees ?? prev.tobacco.tobaccoFees,
        },
        reports: {
          ...prev.reports,
          headerStatus: apiSettings.general?.topDataStatus ?? prev.reports.headerStatus,
          headerImage: apiSettings.general?.image ?? prev.reports.headerImage,
        },
        barcode: {
          ...prev.barcode,
          type: apiSettings.barcodeScale?.barcodeType === 1 ? "الوزن/الكمية" : prev.barcode.type,
          totalCharacters: apiSettings.barcodeScale?.barcodeTotalCharacters ?? prev.barcode.totalCharacters,
          flagCharacters: String(apiSettings.barcodeScale?.barcodeFlagCharacters ?? prev.barcode.flagCharacters),
          codeStart: apiSettings.barcodeScale?.barcodeStartPosition ?? prev.barcode.codeStart,
          codeLength: apiSettings.barcodeScale?.barcodeCodeCharactersCount ?? prev.barcode.codeLength,
          weightStart: apiSettings.barcodeScale?.barcodeWeightStartPosition ?? prev.barcode.weightStart,
          weightLength: apiSettings.barcodeScale?.barcodeWeightCharactersCount ?? prev.barcode.weightLength,
          weightDivider: apiSettings.barcodeScale?.barcodeDivideWeightBy ?? prev.barcode.weightDivider,
        }
      }));
    }
  }, [apiSettings]);

  useEffect(() => {
    // Only load POS settings from localStorage as they aren't in the API yet
    const savedPOS = localStorage.getItem("posSettings");
    if (savedPOS) setPOSSettings(JSON.parse(savedPOS));
  }, []);

  const updateSystemSettings = (settings: Partial<SystemSettings>) => {
    setSystemSettings((prev) => {
      const next = { ...prev, ...settings };
      // Optional: you can still save to localStorage if you want, 
      // but API data will overwrite it on next refresh for shared fields.
      localStorage.setItem("systemSettings", JSON.stringify(next));
      return next;
    });
  };

  const updatePOSSettings = (settings: Partial<POSSettings>) => {
    setPOSSettings((prev) => {
      const next = { ...prev, ...settings };
      localStorage.setItem("posSettings", JSON.stringify(next));
      return next;
    });
  };

  const saveSettings = () => {
    localStorage.setItem("systemSettings", JSON.stringify(systemSettings));
    localStorage.setItem("posSettings", JSON.stringify(posSettings));
    toast.success("تم حفظ الإعدادات بنجاح");
  };

  return (
    <SettingsContext.Provider
      value={{
        systemSettings,
        posSettings,
        updateSystemSettings,
        updatePOSSettings,
        saveSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};
