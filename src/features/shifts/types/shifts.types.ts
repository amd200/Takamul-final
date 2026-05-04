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
}

export interface OpenShiftRequest {
  shiftDate: string;
  startTime: string;
  openingBalance: number;
  branchId: number;
  employeeId: number;
  deviceId: number;
}
