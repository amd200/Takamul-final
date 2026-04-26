import { createContext } from "react";

export interface InvoiceData {
  id: string | number;
  customerName?: string;
  customer?: string;
  customerPhone?: string;
  [key: string]: unknown;
}

export type PrintType = "invoice" | "stock" | "claim" | "roll";

export interface PrintContextType {
  printInvoice: (data: InvoiceData, type?: PrintType) => Promise<void>;
  printRoll: (data: InvoiceData) => Promise<void>;
  exportPDF: (data: InvoiceData) => Promise<void>;
  exportExcel: (data: InvoiceData) => Promise<void>;
  exportCSV: (data: InvoiceData) => Promise<void>;
}

export const PrintContext = createContext<PrintContextType>({} as PrintContextType);
