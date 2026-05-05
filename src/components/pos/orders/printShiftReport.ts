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
  deliveryCompanies: DeliveryCompany[];
}

export async function printShiftReport(data: ShiftReportData): Promise<void> {
  const fmt = (n: number | undefined | null) =>
    typeof n === "number" && !isNaN(n) ? n.toFixed(2) : "00.00";

  const itemRows = data.items
    .map(
      (item) => `
      <tr>
        <td class="td-num">.${item.index}</td>
        <td class="td-name">${item.productName ?? ""}</td>
        <td>${fmt(item.price)}</td>
        <td>${fmt(item.quantity)}</td>
        <td>${fmt(item.total)}</td>
      </tr>`
    )
    .join("");

  const deliveryRows = data.deliveryCompanies
    .map(
      (c) => `
      <tr>
        <td class="dlv-name">${c.name}</td>
        <td class="dlv-num">${fmt(c.amount)}</td>
      </tr>`
    )
    .join("");

  const treasuryHeaders = data.treasuries
    .map((t) => `<th>${t.name}</th>`)
    .join("");

  const treasuryCells = data.treasuries
    .map((t) => `<td style="font-weight:700; font-size:9pt">${fmt(t.sales)}</td>`)
    .join("");

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8"/>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet">
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
  font-size: 7.5pt;
  color: #000;
  direction: rtl;
  background: #fff;
}

.page {
  width: 100%;
  display: flex;
  flex-direction: column;
  padding: 5px;
}

/* TOP BOX */
.top-box {
  border: 2px solid #000;
  margin-bottom: 8px;
}

.top-row {
  display: flex;
  justify-content: space-between;
  padding: 5px 8px;
  border-bottom: 2px solid #000;
}

.top-row.last {
  border-bottom: none;
}

.top-col { display: flex; flex-direction: column; width: 50%; }
.top-col.r { align-items: flex-start; text-align: right; }
.top-col.l { align-items: flex-end; text-align: left; }

.lbl { font-size: 7pt; font-weight: 500; color: #777; }
.val { font-size: 9.5pt; font-weight: 500; line-height: 1.2; }

.date-row {
  text-align: center;
  padding: 6px 8px;
  border-bottom: 2px solid #000;
  background: #fcfcfc;
}
.date-row .val { font-size: 11pt; }

/* SECTION */
.section { margin-bottom: 8px; }

.sec-header {
  text-align: center;
  width: 100%;
  margin-bottom: -1px;
  position: relative;
  z-index: 10;
}

.sec-header span {
  display: inline-block;
  border: 2px solid #000;
  padding: 3px 20px;
  font-size: 8pt;
  font-weight: 700;
  background: #fff;
}

.sec-body {
  border: 2px solid #000;
  margin-top: -1px;
}

/* TABLES */
.tbl {
  width: 100%;
  border-collapse: collapse;
  font-size: 7pt;
  font-weight: 500;
  table-layout: fixed;
}

.tbl th {
  border-bottom: 1px solid #000;
  border-left: 1px solid #000;
  padding: 3px 2px;
  text-align: center;
  font-size: 7pt;
  font-weight: 700;
}
.tbl th:last-child { border-left: none; }

.tbl td {
  border-bottom: 1px solid #ccc;
  border-left: 1px solid #000;
  padding: 3px 2px;
  text-align: center;
  font-size: 7pt;
  font-weight: 500;
  word-break: break-word;
}
.tbl td:last-child { border-left: none; }
.tbl tr:last-child td { border-bottom: none; }

.td-num { width: 10%; }
.td-name { text-align: center !important; width: 35%; }

/* TOTALS BOX */
.totals-box {
  border: 2px solid #000;
  margin-bottom: 8px;
  padding: 6px 10px;
}

.t-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 3px 0;
  font-size: 7.5pt;
  font-weight: 500;
}
.t-num { font-weight: 700; font-size: 8.5pt; }

.t-row.grand {
  border-top: 2px solid #000;
  margin-top: 3px;
  padding-top: 4px;
  font-size: 8.5pt;
  font-weight: 700;
}

@media print {
  html, body { margin: 0; }
}
</style>
</head>
<body>
<div class="page">

  <!-- TOP BOX -->
  <div class="top-box">
    <div class="top-row">
      <div class="top-col r">
        <span class="lbl">اسم المستخدم</span>
        <span class="val">${data.userName}</span>
      </div>
      <div class="top-col l">
        <span class="lbl">رقم الوردية</span>
        <span class="val">${data.shiftNumber}</span>
      </div>
    </div>
    <div class="date-row">
      <div class="lbl">تاريخ الوردية</div>
      <div class="val">${data.shiftDate}</div>
    </div>
    <div class="top-row last">
      <div class="top-col r">
        <span class="lbl">من الساعه</span>
        <span class="val">${data.fromTime}</span>
      </div>
      <div class="top-col l">
        <span class="lbl">إلى الساعه</span>
        <span class="val">${data.toTime}</span>
      </div>
    </div>
  </div>

  <!-- بيان الوردية -->
  <div class="section">
    <div class="sec-header"><span>بيان الوردية</span></div>
    <div class="sec-body">
      <table class="tbl">
        <thead>
          <tr>
            <th style="width:10%">م</th>
            <th style="width:35%">الصنف</th>
            <th>السعر</th>
            <th>الكمية</th>
            <th>الاجمالي</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>
    </div>
  </div>

  <!-- TOTALS -->
  <div class="totals-box">
    <div class="t-row">
      <span class="t-num">${fmt(data.totalBeforeTax)}</span>
      <span>الاجمالي بدون الضريبة</span>
    </div>
    <div class="t-row">
      <span class="t-num">${fmt(data.totalTax)}</span>
      <span>إجمالي الضريبة</span>
    </div>
    <div class="t-row grand">
      <span class="t-num">${fmt(data.grandTotal)}</span>
      <span>الاجمالي النهائي</span>
    </div>
  </div>

  <!-- يومية الخزائن -->
  <div class="section">
    <div class="sec-header"><span>يومية الخزائن</span></div>
    <div class="sec-body">
      <table class="tbl">
        <thead>
          <tr>
            ${treasuryHeaders}
          </tr>
        </thead>
        <tbody>
          <tr>
            ${treasuryCells}
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <div style="height:10px;"></div>

  <!-- المشتريات و المصروفات -->
  <div class="section">
    <div class="sec-header"><span>المشتريات و المصروفات</span></div>
    <div class="sec-body">
      <table class="tbl">
        <thead>
          <tr>
            <th style="border-left:1px solid #000">إجمالي المشتريات</th>
            <th>اجمالي المصروفات</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border-left:1px solid #000; font-weight:700; font-size:9pt; color:#FF0000">${fmt(data.totalPurchases)}</td>
            <td style="font-weight:700; font-size:9pt; color:#FF0000">${fmt(data.totalExpenses)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <div style="height:10px;"></div>

  <!-- شركات التوصيل -->
  ${data.deliveryCompanies.length > 0 ? `
  <div class="section">
    <div class="sec-header"><span>شركات التوصيل</span></div>
    <div class="sec-body">
      <table class="tbl">
        <tbody>
          ${data.deliveryCompanies.map(c => `
            <tr>
              <td class="border-l">${c.name}</td>
              <td>${fmt(c.amount)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  </div>
  ` : ''}

</div>
</body>
</html>`;

  try {
    await printInvoicePrinter(html);
  } catch (err: any) {
    const win = window.open("", "_blank", "width=440,height=900");
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
