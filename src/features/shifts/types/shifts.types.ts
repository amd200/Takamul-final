export interface Shift {
  id: number;
  shiftDate: string;
  startTime: string;
  endTime: string | null;
  openingBalance: number;
  totalSales: number;
  totalPurchases: number;
  totalExpenses: number;
  totalRevenues: number;
  netTotal: number;
  status: "Open" | "Closed";
  employeeName: string;
  branchName: string;
  deviceId?: string | number;
  deviceName?: string;
}

export interface OpenShiftRequest {
  shiftDate: string;
  startTime: string;
  openingBalance: number;
  branchId: number;
  employeeId: number;
  deviceId: number;
}

export interface ShiftReport {
  shiftId: number;
  employeeName: string;
  shiftDate: string;
  startTime: string;
  endTime: string;
  soldItems: {
    productName: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }[];
  salesSubTotal: number;
  salesTaxAmount: number;
  salesGrandTotal: number;
  treasuries: {
    treasuryName: string;
    totalSales: number;
    totalExpenses: number;
    totalRevenues: number;
    netTotal: number;
  }[];
  totalPurchases: number;
  totalExpenses: number;
}
