import React, { useContext, ReactNode, useCallback, createContext } from "react";
import { printVoucher, getClaimReceiptHTML, exportCustomPDF, exportToExcel, exportToCSV, generatePDFBlob } from "@/utils/customExportUtils";
import { useLanguage } from "./LanguageContext";
import { getStockReceiptHTML } from "@/print/stockReceiptHTML";
import { getAllSuppliers, getSupplierById } from "@/features/suppliers/services/suppliers";
import { getAllProducts } from "@/features/products/services/products";
import { getCustomerById } from "@/features/customers/services/customers";
import { getA4InvoiceHTML } from "@/print/A4InvoiceTemplate";
import { getA4PrintHTML } from "@/print/GenericA4Template";
import { InvoiceData, printInvoice as thermalPrint } from "@/components/pos/orders/printInvoice";
import { calcItemTax, calcTotals, CartItem } from "@/constants/data";
import { BranchInfo, useBranch } from "@/features/EmployeeBranches/hooks/useBranch";
import { SalesOrder } from "@/features/sales/types/sales.types";
import { Purchase } from "@/features/purchases/types/purchase.types";
import { Customer } from "@/features/customers/types/customers.types";
import { Supplier } from "@/features/suppliers/types/suppliers.types";
import { Quotation } from "@/features/quotation/types/quotations.types";
import { useGenerateQR } from "@/features/zatcaInvoice/hooks/useGenerateQR";
import { useUploadFile } from "@/features/sales/hooks/useUploadFile";

const toNum = (v: any, fallback = 0): number => Number(v ?? fallback);

const joinAddress = (...parts: (string | undefined | null)[]): string => parts.filter(Boolean).join(" / ");

const buildInvoiceDateStr = (data: any): string => {
  const raw = data.createdAt || data.orderDate || data.date;
  return raw ? new Date(raw).toLocaleString("en-GB") : new Date().toLocaleString("en-GB");
};

const getBase64FromUrl = async (url: string): Promise<string | null> => {
  if (!url) return null;
  if (url.startsWith("data:")) return url;
  try {
    const response = await fetch(url, { mode: "cors" });
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.warn("Failed to convert image to base64:", url, e);
    return null;
  }
};

type PrintableData = SalesOrder | Purchase | InvoiceData | Quotation;
export type PrintType = "invoice" | "stock" | "claim" | "roll" | "quotation" | "purchase";

type RawItem = {
  productId?: number;
  productName?: string;
  name?: string;
  price?: number;
  unitPrice?: number;
  priceBeforeTax?: number;
  quantity?: number;
  taxamount?: number;
  taxPercentage?: number;
  taxCalculation?: number;
  taxAmount?: number;
  discountPercentage?: number;
  discountValue?: number;
  subTotal?: number;
  lineTotal?: number;
};

export type ExtendedData = Partial<SalesOrder & Purchase & Quotation> & {
  branchInfo: BranchInfo;
  customer?: Customer;
  supplier?: Supplier;
  note?: string;
  description?: string;
};

export interface PrintContextType {
  printInvoice: (data: PrintableData, type?: PrintType) => Promise<void>;
  printRoll: (data: PrintableData) => Promise<void>;
  exportPDF: (data: PrintableData) => Promise<void>;
  exportRollPDF: (data: PrintableData) => Promise<void>;
  exportExcel: (data: PrintableData) => Promise<void>;
  exportCSV: (data: PrintableData) => Promise<void>;
  generateInvoiceFile: (data: PrintableData) => Promise<File>;
}
const PrintContext = createContext<PrintContextType | null>(null);
export const PrintProvider = ({ children }: { children: ReactNode }) => {
  const { t } = useLanguage();
  const { data: branchInfo } = useBranch();
  const { mutateAsync: uploadFile } = useUploadFile();
  const { mutateAsync: generateQR } = useGenerateQR();
  const prepareExtendedData = useCallback(
    async (data: PrintableData): Promise<ExtendedData> => {
      const ext: ExtendedData = { ...(data as any), branchInfo: branchInfo! };

      // Convert branch logo to base64 for better PDF rendering
      if (ext.branchInfo?.imageUrl) {
        const base64 = await getBase64FromUrl(ext.branchInfo.imageUrl);
        if (base64) {
          ext.branchInfo = { ...ext.branchInfo, imageUrl: base64 };
        }
      }

      if (ext.customer || ext.supplier) return ext;
      const cId = "customerId" in data || "customerid" in data ? ((data as any).customerId ?? (data as any).customerid) : undefined;
      const sId = "supplierId" in data ? data.supplierId : undefined;

      if (cId) {
        try {
          const customer = await getCustomerById(Number(cId));
          if (customer) {
            ext.customer = customer;
            return ext;
          }
        } catch {}
      }

      if (sId) {
        try {
          const supplier = await getSupplierById(Number(sId));
          if (supplier) {
            ext.supplier = supplier;
            return ext;
          }
        } catch {}
      }

      return ext;
    },
    [branchInfo],
  );

  const buildThermalData = useCallback(async (ext: ExtendedData, branch: BranchInfo): Promise<InvoiceData> => {
    const rawItems: RawItem[] = ext.items ?? [];
    const cart: CartItem[] = rawItems.map((item) => {
      const pct = Number(item.discountPercentage);
      const flat = Number(item.discountValue);
      return {
        productId: item.productId ?? 0,
        name: item.productName || item.name || "-",
        price: item.taxCalculation === 2 ? item.unitPrice || item.price || 0 : (item.priceBeforeTax ?? item.unitPrice ?? item.price ?? 0),
        qty: Number(item.quantity) || 1,
        taxamount: item.taxamount ?? 0,
        taxPercentage: item.taxPercentage ?? 0,
        taxCalculation: item.taxCalculation ?? 2,
        itemDiscount: pct > 0 ? { type: "pct", value: pct } : flat > 0 ? { type: "flat", value: flat } : null,
        note: "",
      };
    });

    const discVal = Number(ext.discountAmount);
    const discount = discVal > 0 ? { type: "flat" as const, value: discVal } : { type: "pct" as const, value: 0 };
    const totals = calcTotals(cart, discount);
    const total = ext?.payments?.reduce((sum, p) => sum + p.amount, 0) ?? 0;
    let qrCode: string | undefined;
    try {
      const res = await generateQR({ invoiceId: ext?.id });
      qrCode = res?.qrCode;
    } catch {}
    return {
      paidAmount: total,
      branch: branch,
      invoiceNumber: String(ext.orderNumber || ext?.quotationNumber),
      invoiceDate: buildInvoiceDateStr(ext),
      customer: ext.customer!,
      supplier: ext.supplier!,
      items: rawItems.map((item, i) => {
        const itemTax = item.taxAmount !== undefined ? Number(item.taxAmount) : calcItemTax(cart[i]);
        const lineTotal = item.lineTotal !== undefined ? Number(item.lineTotal) : Number(item.subTotal) + itemTax;
        return {
          productName: item.productName || item.name || "-",
          quantity: Number(item.quantity) || 0,
          unitPrice: Number((lineTotal - itemTax).toFixed(2)),
          taxAmount: Number(itemTax.toFixed(2)),
          total: Number(lineTotal.toFixed(2)),
        };
      }),
      subTotal: Number((ext.subTotal ?? totals.sub).toFixed(2)),
      discountAmount: Number((ext.discountAmount ?? totals.discountAmount).toFixed(2)),
      taxAmount: Number((ext.taxAmount ?? totals.tax).toFixed(2)),
      grandTotal: Number((ext.grandTotal ?? totals.total).toFixed(2)),
      notes: ext.notes || ext.note || ext.description || "",
      qrCode: qrCode,
    };
  }, []);

  const printRoll = useCallback(
    async (data: PrintableData) => {
      const ext = await prepareExtendedData(data);
      const branch = ext.branchInfo;
      const res = await buildThermalData(ext, branch);
      await thermalPrint(res);
    },
    [prepareExtendedData, buildThermalData],
  );

  const printInvoice = useCallback(
    async (data: PrintableData, type: PrintType = "invoice") => {
      if (!data?.id) return;
      if (type === "roll") return printRoll(data);
      const ext = await prepareExtendedData(data);
      const apiBase = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");

      const htmlGetters: Record<string, () => Promise<string>> = {
        invoice: () => getA4InvoiceHTML(ext, t, generateQR, apiBase),
        stock: async () => getStockReceiptHTML(ext, t),
        claim: async () => getClaimReceiptHTML(ext, t),
        quotation: async () => getA4PrintHTML(ext, "quotation", t, apiBase),
        purchase: async () => getA4PrintHTML(ext, "purchase", t, apiBase),
      };

      const html = await (htmlGetters[type] ?? htmlGetters["invoice"])();
      printVoucher(html);
    },
    [prepareExtendedData, printRoll, t],
  );

  const exportPDF = useCallback(
    async (data: PrintableData) => {
      const ext = await prepareExtendedData(data);
      const apiBase = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");
      const title = `Invoice_${(ext as any).invoiceNo || (ext as any).orderNumber || (ext as any).id}`;
      const blob = await exportCustomPDF(title, await getA4InvoiceHTML(ext, t, generateQR, apiBase));
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${title}_${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    },
    [prepareExtendedData, t, generateQR],
  );

  const exportRollPDF = useCallback(
    async (data: PrintableData) => {
      const ext = await prepareExtendedData(data);
      const branch = ext.branchInfo;
      const thermalData = await buildThermalData(ext, branch);
      const { useSettingsStore } = await import("@/features/settings/store/settingsStore");
      const taxSetting = useSettingsStore.getState().settings.taxSetting?.taxSetting;
      const isExempt = taxSetting === "Exempt";

      const { getThermalInvoiceHTML } = await import("@/components/pos/orders/printInvoice");
      const html = await getThermalInvoiceHTML(thermalData, isExempt);

      const title = `Receipt_${thermalData.invoiceNumber || (ext as any).id}`;
      const blob = await generatePDFBlob(html, "portrait", 302);

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${title}_${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    },
    [prepareExtendedData, buildThermalData],
  );

  const exportExcel = useCallback(
    async (data: PrintableData) => {
      const ext = await prepareExtendedData(data);
      const items = ((ext as any).items || (ext as any).orderItems || []) as any[];
      exportToExcel(
        items.map((item: any) => ({
          name: item.productName || item.name,
          unit: item.unitName || "قطعة",
          quantity: item.quantity,
          price: item.price || item.unitPrice,
          tax: (toNum(item.price || item.unitPrice) * toNum(item.quantity, 1) * 0.15).toFixed(2),
          total: (toNum(item.price || item.unitPrice) * toNum(item.quantity, 1) * 1.15).toFixed(2),
        })),
        [
          { header: "بيان الصنف", field: "name" },
          { header: "الوحدة", field: "unit" },
          { header: "الكمية", field: "quantity" },
          { header: "السعر", field: "price" },
          { header: "الضريبة", field: "tax" },
          { header: "الاجمالي", field: "total" },
        ],
        `Invoice_${(ext as any).invoiceNo || (ext as any).orderNumber || (ext as any).id}`,
      );
    },
    [prepareExtendedData],
  );

  const exportCSV = useCallback(
    async (data: PrintableData) => {
      const ext = await prepareExtendedData(data);
      const items = ((ext as any).items || (ext as any).orderItems || []) as any[];
      exportToCSV(
        items.map((item: any) => ({
          "Item Description": item.productName || item.name,
          Unit: item.unitName || "قطعة",
          Quantity: item.quantity,
          Price: item.price || item.unitPrice,
          Total: (toNum(item.price || item.unitPrice) * toNum(item.quantity, 1) * 1.15).toFixed(2),
        })),
        `Invoice_${(ext as any).invoiceNo || (ext as any).orderNumber || (ext as any).id}`,
      );
    },
    [prepareExtendedData],
  );

  const generateInvoiceFile = useCallback(
    async (data: PrintableData): Promise<File> => {
      const ext = await prepareExtendedData(data);
      const apiBase = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");
      const html = await getA4InvoiceHTML(ext, t, generateQR, apiBase);
      const fileName = `Invoice_${(ext as any).invoiceNo || (ext as any).orderNumber || (ext as any).id}`;

      const blob = await exportCustomPDF(fileName, html);
      return new File([blob], `${fileName}.pdf`, { type: "application/pdf" });
    },
    [prepareExtendedData, t, generateQR],
  );

  return <PrintContext.Provider value={{ printInvoice, printRoll, exportPDF, exportRollPDF, exportExcel, exportCSV, generateInvoiceFile }}>{children}</PrintContext.Provider>;
};

export const usePrint = () => useContext(PrintContext);
