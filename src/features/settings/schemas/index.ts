import { SiteSettingsFormValues } from "./siteSettings.schema";

export const baseDefaultValues: SiteSettingsFormValues = {
  defaultPaymentCompany: "",
  rowsPerPage: 10,
  showActualBalance: true,
  showItemCodeInSales: false,
  showItemCodeInPurchases: false,
  showItemCodeInQuotes: false,
  showCostGreaterThanPriceWarning: true,
};
