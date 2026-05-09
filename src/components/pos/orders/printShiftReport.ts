import { useSettingsStore } from "@/features/settings/store/settingsStore";
import { printInvoicePrinter } from "@/lib/qzService";

export interface ShiftItem {
  index: number;
  productName: string;
  price: number;
  quantity: number;
  total: number;
}

export interface ShiftTreasurySales {
  name: string;
  sales: number;
}

export interface ShiftDeliveryCompany {
  name: string;
  amount: number;
}

export interface ShiftReportData {
  shiftNumber: string | number;
  userName: string;
  shiftDate: string;
  fromTime: string;
  toTime: string;
  items: ShiftItem[];
  totalBeforeTax: number;
  totalTax: number;
  grandTotal: number;
  treasuries: ShiftTreasurySales[];
  totalPurchases: number;
  totalExpenses: number;
  deliveryCompanies: ShiftDeliveryCompany[];
}

export async function printShiftReport(data: ShiftReportData): Promise<void> {
  const taxSetting = useSettingsStore.getState().settings?.taxSetting?.taxSetting;
  const isExempt = taxSetting === "Exempt";

  const fmt = (n: number | undefined | null) => (typeof n === "number" && !isNaN(n) ? n.toFixed(2) : "00.00");

  const itemRows = data.items
    .map(
      (item) => `
      <tr>
        <td class="td-num">${item.index}</td>
        <td class="td-name">${item.productName ?? ""}</td>
        <td class="td-price">${fmt(item.price)}</td>
        <td class="td-qty">${fmt(item.quantity)}</td>
        <td class="td-total text-bold">${fmt(item.total)}</td>
      </tr>`,
    )
    .join("");

  const deliveryRows = data.deliveryCompanies
    .map(
      (c) => `
      <div class="card-item bg-gray border-gray">
        <span class="card-label text-black">${c.name}</span>
        <span class="card-value text-black">${fmt(c.amount)}</span>
      </div>`,
    )
    .join("");

  const treasuryCards = data.treasuries
    .map(
      (t) => `
      <div class="card-item bg-gray border-gray">
        <span class="card-label text-black">${t.name}</span>
        <span class="card-value text-black">${fmt(t.sales)}</span>
      </div>`,
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8"/>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
<title>تقرير الوردية</title>
<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
  font-family: 'Cairo', Tahoma, Arial, sans-serif;
}

html, body {
  width: 100%;
  color: #000;
  direction: rtl;
  background: #fff;
  font-size: 11px;
  font-weight: 700;
}

.page {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  padding: 10px;
  display: flex;
  flex-direction: column;
}

/* Header Area */
.header-area {
  border-bottom: 2px dashed #9ca3af;
  padding-bottom: 15px;
  margin-bottom: 15px;
}

.flex-between {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.lbl {
  display: block;
  font-size: 10px;
  font-weight: 800;
  color: #000;
  margin-bottom: 2px;
}

.val {
  display: block;
  font-size: 14px;
  font-weight: 900;
  color: #000;
}

.info-box {
  background-color: #e5e7eb; /* رصاصي واضح */
  border: 2px solid #9ca3af;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  margin-top: 12px;
}

.info-col {
  text-align: center;
  flex: 1;
}

.info-col .lbl { font-size: 10px; font-weight: 800; color: #000; margin-bottom: 2px; }
.info-col .val { font-size: 12px; font-weight: 900; color: #000; }

.divider {
  width: 2px;
  height: 20px;
  background-color: #9ca3af;
}

/* Sections */
.section-title {
  font-size: 13px;
  font-weight: 900;
  color: #000;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.section-title::before {
  content: "";
  display: inline-block;
  width: 5px;
  height: 14px;
  background-color: #000;
  border-radius: 2px;
}

.box-container {
  border: 2px solid #9ca3af;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 15px;
}

/* Tables */
.tbl {
  width: 100%;
  border-collapse: collapse;
  text-align: center;
}

.tbl th {
  background-color: #e5e7eb; /* رصاصي واضح */
  color: #000;
  font-size: 11px;
  font-weight: 900;
  padding: 8px 4px;
  border-bottom: 2px solid #9ca3af;
}

.tbl td {
  padding: 8px 4px;
  font-size: 12px;
  font-weight: 800;
  color: #000;
  border-bottom: 2px dashed #9ca3af;
}

.tbl tr:last-child td { border-bottom: none; }

.td-num { width: 10%; color: #000 !important; }
.td-name { width: 35%; text-align: right !important; }
.td-price { width: 15%; }
.td-qty { width: 15%; }
.td-total { width: 25%; text-align: right !important; }
.text-bold { font-weight: 900 !important; color: #000 !important; }

/* Totals Box */
.totals-box {
  background-color: #e5e7eb; /* رصاصي واضح */
  border: 2px solid #9ca3af;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 15px;
}

.t-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 8px;
  margin-bottom: 8px;
  border-bottom: 2px dashed #9ca3af;
  font-size: 12px;
  font-weight: 800;
  color: #000;
}

.t-row.no-border {
  border-bottom: none;
  padding-bottom: 0;
  margin-bottom: 0;
}

.grand-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
}

.grand-lbl {
  font-size: 14px;
  font-weight: 900;
  color: #000;
}

.grand-val {
  font-size: 18px;
  font-weight: 900;
  color: #000;
}

/* Cards Layout */
.cards-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 15px;
}

.card-item {
  flex: 1;
  min-width: 45%;
  border-radius: 8px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.card-label { font-size: 11px; font-weight: 800; margin-bottom: 4px; }
.card-value { font-size: 14px; font-weight: 900; }

.bg-gray { background-color: #e5e7eb; /* رصاصي واضح */ }
.border-gray { border: 2px solid #9ca3af; }
.text-black { color: #000; }

@media print {
  html, body { margin: 0; padding: 0; font-weight: 700; }
  .page { padding: 0; max-width: 100%; }
}
</style>
</head>
<body>
<div class="page">

  <!-- Header Area -->
  <div class="header-area">
    <div class="flex-between">
      <div>
        <span class="lbl">اسم المستخدم</span>
        <span class="val">${data.userName}</span>
      </div>
      <div style="text-align: left;">
        <span class="lbl">رقم الوردية</span>
        <span class="val highlight">#${data.shiftNumber}</span>
      </div>
    </div>
    
    <div class="info-box">
      <div class="info-col">
        <span class="lbl">تاريخ الوردية</span>
        <span class="val">${data.shiftDate}</span>
      </div>
      <div class="divider"></div>
      <div class="info-col">
        <span class="lbl">من الساعة</span>
        <span class="val">${data.fromTime}</span>
      </div>
      <div class="divider"></div>
      <div class="info-col">
        <span class="lbl">إلى الساعة</span>
        <span class="val">${data.toTime || "---"}</span>
      </div>
    </div>
  </div>

  <!-- بيان الوردية -->
  <div class="section-title">بيان الوردية</div>
  <div class="box-container">
    <table class="tbl">
      <thead>
        <tr>
          <th class="td-num">م</th>
          <th class="td-name">الصنف</th>
          <th class="td-price">السعر</th>
          <th class="td-qty">الكمية</th>
          <th class="td-total">الإجمالي</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>
  </div>

  <!-- TOTALS -->
  <div class="totals-box">
    ${
      !isExempt
        ? `
    <div class="t-row">
      <span>الإجمالي بدون ضريبة</span>
      <span class="text-bold">${fmt(data.totalBeforeTax)}</span>
    </div>
    <div class="t-row">
      <span>إجمالي الضريبة</span>
      <span class="text-bold">${fmt(data.totalTax)}</span>
    </div>
    `
        : ""
    }
    <div class="grand-row">
      <span class="grand-lbl">الإجمالي النهائي</span>
      <span class="grand-val">${fmt(data.grandTotal)}</span>
    </div>
  </div>

  <!-- يومية الخزائن -->
  <div class="section-title">يومية الخزائن</div>
  <div class="cards-grid">
    ${treasuryCards}
  </div>

  <!-- المشتريات والمصروفات -->
  ${
    data.totalPurchases > 0 || data.totalExpenses > 0
      ? `
  <div class="section-title">المشتريات والمصروفات</div>
  <div class="cards-grid">
    <div class="card-item bg-gray border-gray">
      <span class="card-label text-black">إجمالي المشتريات</span>
      <span class="card-value text-black">${fmt(data.totalPurchases)}</span>
    </div>
    <div class="card-item bg-gray border-gray">
      <span class="card-label text-black">إجمالي المصروفات</span>
      <span class="card-value text-black">${fmt(data.totalExpenses)}</span>
    </div>
  </div>
  `
      : ""
  }

  <!-- شركات التوصيل -->
  ${
    data.deliveryCompanies.length > 0
      ? `
  <div class="section-title">شركات التوصيل</div>
  <div class="cards-grid">
    ${deliveryRows}
  </div>
  `
      : ""
  }

</div>
</body>
</html>`;

  try {
    // await printInvoicePrinter(html);
    const win = window.open("", "_blank", "width=400,height=900");
    if (!win) {
      alert("يرجى السماح بالنوافذ المنبثقة لطباعة التقرير");
      return;
    }
    win.document.write(html);
    win.document.close();
    win.onload = () => {
      win.focus();
      win.print();
    };
  } catch (err: any) {
    const win = window.open("", "_blank", "width=400,height=900");
    if (!win) {
      alert("يرجى السماح بالنوافذ المنبثقة لطباعة التقرير");
      return;
    }
    win.document.write(html);
    win.document.close();
    win.onload = () => {
      win.focus();
      win.print();
    };
  }
}