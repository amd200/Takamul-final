import { Customer } from "@/features/customers/types/customers.types";
import { BranchInfo } from "@/features/EmployeeBranches/hooks/useBranch";
import { Supplier } from "@/features/suppliers/types/suppliers.types";
import QRCode from "qrcode/lib/browser.js";
import { printInvoicePrinter } from "@/lib/qzService";
import { useSettingsStore } from "@/features/settings/store/settingsStore";

export interface InvoiceItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  taxAmount: number;
  total: number;
}

export interface InvoiceData {
  id?: number | string;
  branch: BranchInfo;
  invoiceNumber: string | number;
  customer: Customer;
  supplier?: Supplier;
  invoiceDate: string;
  items: InvoiceItem[];
  subTotal: number;
  discountAmount: number;
  taxAmount: number;
  grandTotal: number;
  notes?: string;
  qrCode: string;
  paidAmount: number;
}

export async function printInvoice(data: InvoiceData): Promise<void> {
  const totalQty = data.items.reduce((s, i) => s + i.quantity, 0);
  const fmt = (n: number | undefined | null) => (typeof n === "number" && !isNaN(n) ? n.toFixed(2) : "0.00");
  const riyal = `ر.س`;
  const qrImageSrc = data?.qrCode ? await QRCode.toDataURL(data?.qrCode) : null;
  const taxSetting = useSettingsStore.getState().settings.taxSetting?.taxSetting;
  const isExempt = taxSetting === "Exempt";
  const custAddress = [data?.branch?.cityName, data?.branch?.stateName, data?.branch?.district, data?.branch?.street].filter(Boolean).join(" / ") || "-";

  const itemRows = data.items
    .map(
      (item) => `
      <tr>
        <td class="td-name">${item.productName ?? ""}</td>
        <td>${item.quantity ?? 0}</td>
        <td>${fmt(item.unitPrice)}</td>
        ${!isExempt && `<td>${fmt(item.taxAmount)}</td> `}
        <td>${fmt(item.total)}</td>
      </tr>`,
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8"/>
<title>فاتورة ضريبية مبسطة</title>
<style>


* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
  font-family:  Tahoma, sans-serif;
}

html, body {
  width: 100%;
  font-size: 7pt;
  color: #000;
  direction: rtl;
  background: #fff;
}

.page {
  width: 100%;
  display: flex;
  flex-direction: column;
}

/* ── LOGO ── */
.logo {
  text-align: center;
  font-size: 24pt;
  font-weight: 900;
  padding: 10px 4px 14px;
  border: 2px solid #000;
}
.logo img {
  max-height: 50px;
  max-width: 100%;
  object-fit: contain;
}

/* ── HEADER INFO ROWS ── */
.header-wrap {
  border: 2px solid #000;
  border-top: none;
}

.hrow {
  display: flex;
  flex-direction: row;
  align-items: center;
  border-bottom: 1px solid #000;
  min-height: 20px;
  padding: 3px 6px;
  font-size: 7pt;
  font-weight: 700;
}
.hrow:last-child {
  border-bottom: none;
}

/* AR label - RIGHT (first in RTL) */
.hrow .h-ar {
  flex: 0 0 30%;
  text-align: right;
  font-size: 7pt;
  font-weight: 700;
}

/* value - center */
.hrow .h-val {
  flex: 1;
  text-align: center;
  font-size: 7pt;
  font-weight: 700;
}

/* EN label - LEFT (last in RTL) */
.hrow .h-en {
  flex: 0 0 30%;
  text-align: left;
  font-size: 7pt;
  font-weight: 900;
}

/* institution name row */
.hrow.inst-row .h-en { flex: 1; font-size: 8pt; font-weight: 900; text-align: left; }
.hrow.inst-row .h-ar { flex: 1; font-size: 8pt; font-weight: 900; text-align: right; }

/* ── ITEMS TABLE ── */
.items-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 6pt;
  border: 2px solid #000;
  border-top: none;
  table-layout: fixed;
}

.items-table thead tr th {
  font-weight: 700;
  text-align: center;
  padding: 3px 1px;
  border: 1px solid #000;
  line-height: 1.3;
  vertical-align: middle;
}

.items-table thead tr th .th-ar { 
  display: block; 
  font-size: 6pt; 
  font-weight: 900; 
  color: #000;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.items-table thead tr th .th-en { 
  display: block; 
  font-size: 5pt; 
  font-weight: 900; 
  color: #000;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

.items-table td {
  border: 1px solid #000;
  padding: 3px 1px;
  text-align: center;
  font-weight: 700;
  font-size: 7pt;
  vertical-align: middle;
  line-height: 1.3;
  word-break: break-word;
}

.td-name { text-align: center !important; font-size: 7pt; }

.items-table th:nth-child(1), .items-table td:nth-child(1) { width: 28%; }
.items-table th:nth-child(2), .items-table td:nth-child(2) { width: 14%; }
.items-table th:nth-child(3), .items-table td:nth-child(3) { width: 20%; }
.items-table th:nth-child(4), .items-table td:nth-child(4) { width: 16%; }
.items-table th:nth-child(5), .items-table td:nth-child(5) { width: 22%; }

/* ── TOTALS TABLE ── */
.totals-table {
  width: 100%;
  border-collapse: collapse;
  border: 2px solid #000;
  border-top: none;
  table-layout: fixed;
}

.totals-table td {
  border: 1px solid #000;
  padding: 4px 6px;
  font-size: 7pt;
  font-weight: 700;
  vertical-align: middle;
}

.totals-table td.t-ar {
  text-align: center;
  width: 38%;
}

.totals-table td.t-val {
  text-align: center;
  width: 30%;
}

.totals-table td.t-en {
  text-align: center;
  width: 32%;
  font-weight: 900;
}

// .totals-table tr:last-child td {
//   font-size: 8pt;
//   font-weight: 900;
// }

/* ── FOOTER ROWS ── */
.frow {
  border: 2px solid #000;
  border-top: none;
  display: flex;
  flex-direction: row;
  align-items: center;
  min-height: 20px;
  padding: 4px 6px;
  font-size: 7pt;
  font-weight: 700;
}

/* AR right (first in RTL) */
.frow .f-ar { flex: 0 0 30%; text-align: right; }
.frow .f-val { flex: 1; text-align: center; }
/* EN left (last in RTL) */
.frow .f-en { flex: 0 0 30%; text-align: left; font-weight: 900; }

/* address - centered single line */
.addr-row {
  border: 2px solid #000;
  border-top: none;
  text-align: center;
  font-size: 7pt;
  font-weight: 700;
  padding: 4px 6px;
  min-height: 20px;
}

/* notes header - bold centered */
.notes-header {
  border: 2px solid #000;
  border-top: none;
  text-align: center;
  font-size: 9pt;
  font-weight: 900;
  padding: 6px 4px;
}

/* ── QR ── */
.qr-wrap {
  text-align: center;
  padding: 8px 0 6px;
  border: 2px solid #000;
  border-top: none;
}
#qr, .qr-wrap img {
  width: 130px;
  height: 130px;
  display: inline-block;
}

.date-row .h-val {
  font-size: 6pt;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
@media print {
  html, body { margin: 0; }
}
</style>
</head>
<body>
<div class="page">

  <!-- LOGO -->
  <div class="logo">
    ${data?.branch?.imageUrl ? `<img src="${data?.branch?.imageUrl}" alt="logo"/>` : `<span>اللوجو</span>`}
  </div>

  <!-- HEADER INFO ROWS -->
  <div class="header-wrap">

    <!-- Institution: AR right | EN left -->
    <div class="hrow inst-row">
  <span class="h-ar" style="flex:1; text-align:center;">${data?.branch?.name}</span>
</div>
    <!-- VAT NO: AR | value | EN -->
 

    <!-- Simplified Tax Invoice -->
    <div class="hrow">
      <span class="h-ar">${data?.customer.taxNumber ? "فاتورة ضريبية" : "فاتورة ضريبية مبسطة"}</span>
      <span class="h-val"></span>
      <span class="h-en">${data?.customer?.taxNumber ? "Tax Invoice" : "Simplified Tax Invoice"}</span>
    </div>

    <!-- INV NO -->
    <div class="hrow">
      <span class="h-ar">رقم الفاتورة</span>
      <span class="h-val">${data.invoiceNumber}</span>
      <span class="h-en">INV NO</span>
    </div>

    <!-- Date / Time -->
 <div class="hrow date-row">
  <span class="h-ar">الوقت / التاريخ</span>
  <span class="h-val">${data.invoiceDate}</span>
  <span class="h-en">Date / Time</span>
</div>

    <!-- Customer Name -->
    <div class="hrow">
      <span class="h-ar">اسم العميل</span>
      <span class="h-val">${data.customer?.customerName ?? "—"}</span>
      <span class="h-en">Cust Name</span>
    </div>

    <!-- Phone No -->
    <div class="hrow">
      <span class="h-ar">رقم الجوال</span>
      <span class="h-val">${data.customer?.phone ?? "—"}</span>
      <span class="h-en">Phone No</span>
    </div>

   

  </div>

  <!-- ITEMS TABLE -->
  <table class="items-table">
    <thead>
      <tr>
        <th><span class="th-ar">بيان الصنف</span><span class="th-en">Item Des</span></th>
        <th><span class="th-ar">الكمية</span><span class="th-en">QTY</span></th>
        <th><span class="th-ar">الإجمالي الفرعي</span><span class="th-en">Sub Total</span></th>
        ${!isExempt && `<th><span class="th-ar">الضريبة</span><span class="th-en">VAT Amount</span></th>`}
        <th><span class="th-ar">الإجمالي النهائي</span><span class="th-en">Net Total</span></th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>

  <!-- TOTALS TABLE: AR right | value center | EN left -->
  <table class="totals-table">
    <tr>
      <td class="t-ar">عدد المنتجات</td>
      <td class="t-val">عدد ${totalQty}</td>
      <td class="t-en">QTY</td>
    </tr>
    <tr>
      <td class="t-ar">اجمالي الخصم</td>
      <td class="t-val">${fmt(data.discountAmount)} ${riyal}</td>
      <td class="t-en">Total Discount</td>
    </tr>
   ${
     !isExempt
       ? `
     <tr>
      <td class="t-ar">اجمالي السعر قبل الضريبة</td>
      <td class="t-val">${fmt(data.subTotal)} ${riyal}</td>
      <td class="t-en">Total Before Tax</td>
    </tr>
    <tr>
      <td class="t-ar">اجمالي ضريبة القيمة المضافة</td>
      <td class="t-val">${fmt(data.taxAmount)} ${riyal}</td>
      <td class="t-en">Total VAT</td>
    </tr>`
       : ""
   }
    <tr>
      <td class="t-ar">الاجمالي النهائي</td>
      <td class="t-val">${fmt(data.grandTotal)} ${riyal}</td>
      <td class="t-en">Net Total</td>
    </tr>
    <tr>
      <td class="t-ar">المدفوع</td>
      <td class="t-val">${fmt(data?.paidAmount)} ${riyal}</td>
      <td class="t-en">Paid Amount</td>
    </tr>
    <tr>
      <td class="t-ar">المتبقي</td>
      <td class="t-val">${fmt(data.grandTotal - data?.paidAmount)} ${riyal}</td>
      <td class="t-en">Remaining</td>
    </tr>
  </table>

  <!-- FOOTER: Phone -->
  <div class="frow">
    <span class="f-ar">رقم الجوال</span>
    <span class="f-val">${data.branch?.phone || "—"}</span>
    <span class="f-en">Phone NO</span>
  </div>

  <!-- FOOTER: Address -->
  <div class="addr-row">${custAddress || "—"}</div>

  <!-- FOOTER: Notes -->
  
  <div class="notes-content" style="border:2px solid #000; border-top:none; text-align:center; font-size:8pt; padding:8px 4px; font-weight:700;">
    ${data.notes || "—"}
  </div>

  <!-- QR -->
  ${
    !isExempt
      ? `
    <div class="qr-wrap">
      ${qrImageSrc && `<img src="${qrImageSrc}" alt="QR" />`}
  </div>`
      : ""
  }

</div>
</body>
</html>`;

  try {
    await printInvoicePrinter(html);
  } catch (err: any) {
    const win = window.open("", "_blank", "width=440,height=980");
    if (!win) {
      alert("يرجى السماح بالنوافذ المنبثقة لطباعة الفاتورة");
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
