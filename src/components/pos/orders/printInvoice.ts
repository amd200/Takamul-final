// printInvoice.ts — thermal 80mm — matches design exactly

import { printInvoicePrinter } from "@/lib/qzService";

export interface InvoiceItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  taxAmount: number;
  total: number;
}

export interface InvoiceData {
  logoUrl?: string;
  invoiceNumber: string;
  institutionName: string;
  institutionTaxNumber: string;
  invoiceDate: string;
  institutionAddress: string;
  institutionPhone: string;
  customerName?: string;
  customerPhone?: string;
  items: InvoiceItem[];
  subTotal: number;
  discountAmount: number;
  taxAmount: number;
  grandTotal: number;
  notes?: string;
  qrCodeUrl?: string;
}

function arabicToEntities(str: string): string {
  return str
    .split("")
    .map((c) => `&#${c.charCodeAt(0)};`)
    .join("");
}

export async function printInvoice(data: InvoiceData): Promise<void> {
  const totalQty = data.items.reduce((s, i) => s + i.quantity, 0);
  const fmt = (n: number | undefined | null) => (typeof n === "number" && !isNaN(n) ? n.toFixed(2) : "0.00");
  const riyal = `ر.س`;
  const itemRows = data.items
    .map(
      (item) => `
      <tr>
        <td class="td-name">${item.productName ?? ""}</td>
        <td>${item.quantity ?? 0}</td>
        <td>${fmt(item.unitPrice)}</td>
        <td>${fmt(item.taxAmount)}</td>
        <td>${fmt(item.total)}</td>
      </tr>`,
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl"  >
<head>
<meta charset="UTF-8"/>
<title>فاتورة ضريبية مبسطة</title>
<style>
* {
  margin:0;
  padding:0;
  box-sizing:border-box;
  -webkit-print-color-adjust:exact !important;
  print-color-adjust:exact !important;
}

html, body {
  width:100%;
  font-size: 7pt;
  color: #000;
  direction: rtl;
  background: #fff;
  font-family: Tahoma, Arial, sans-serif;
}

.page {
  width:100%;
  display:flex;
  flex-direction:column;
  gap:0;
}

/* ── LOGO ── */
.logo {
  text-align: center;
  font-size: 18pt;
  font-weight: 900;
  padding: 6px 4px 8px;
  border: 2px solid #000;
  background: #d9d9d9 !important;
}
.logo img {
  max-height:44px;
  max-width:100%;
  object-fit:contain;
}

/* ── INFO GRID ── */
.info-grid {
  width: 100%;
  border-collapse: collapse;
  border: 2px solid #000;
  border-top: none;
}

.info-grid td {
  padding: 3px 4px;
  font-size: 6pt;
  line-height: 1.5;
  vertical-align: middle;
  border: 1px solid #000;
  font-weight: 700;
  word-break: break-word;
}

.info-grid .full td {
  text-align: center;
  font-weight: 700;
  font-size: 7pt;
  background: #d9d9d9 !important;
  border: 1px solid #000;
}

.info-grid .title-row td {
  text-align: center;
  font-weight: 900;
  font-size: 8pt;
  background: #fff !important;
  border: 1px solid #000;
  padding: 4px;
}

.info-grid td.val {
  font-weight: 700;
}

.sep {
  border-left: 2px solid #000 !important;
}

/* ── ITEMS TABLE ── */
.items-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 6pt;
  border: 2px solid #000;
  border-top: none;
  table-layout: fixed;
}

.items-table th {
  background: #d9d9d9 !important;
  font-weight: 700;
  font-size: 5pt;
  text-align: center;
  padding: 2px 1px;
  border: 1px solid #000;
  line-height: 1.3;
  vertical-align: middle;
}

.items-table td {
  border: 2px solid #000;
  padding: 2px 1px;
  text-align: center;
  font-weight: bold;
  font-size: 6.5pt;
  vertical-align: middle;
  line-height: 1.3;
  word-break: break-word;
}

.td-name {
  text-align:right !important;
  padding-right:3px !important;
  font-size: 7pt;

}

/* عمود الصنف */
.items-table th:nth-child(1),
.items-table td:nth-child(1) { width: 32%; }

/* عمود الكمية */
.items-table th:nth-child(2),
.items-table td:nth-child(2) { width: 12%; }

/* الأعمدة الثلاثة الباقية متساوية */
.items-table th:nth-child(3),
.items-table td:nth-child(3) { width: 18.67%; }

.items-table th:nth-child(4),
.items-table td:nth-child(4) { width: 18.67%; }

.items-table th:nth-child(5),
.items-table td:nth-child(5) { width: 18.66%; }

/* ── TOTALS TABLE ── */
.totals-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 7pt;
  border: 2px solid #000;
  border-top: none;
}

.totals-table td {
  border: 1px solid #000;
  padding: 3px 5px;
  vertical-align: middle;
  font-weight: 700;
}

.totals-table td:first-child {
  text-align: right;
  border-left: 2px solid #000;
}

.totals-table td:last-child {
  font-weight: 700;
  text-align: center;
}

.totals-table tr:last-child td {
  font-weight: 900;
  font-size: 8pt;
  background: #d9d9d9 !important;
}

/* ── FOOTER ── */
.footer-row {
  border: 2px solid #000;
  border-top: none;
  text-align: center;
  font-weight: 700;
  font-size: 7pt;
  padding: 5px 4px;
  background: #d9d9d9 !important;
  word-break: break-word;
}

/* ── QR ── */
.qr-wrap {
  text-align: center;
  padding: 8px 0 6px;
  border: 2px solid #000;
  border-top: none;
}

#qr, .qr-wrap img {
  width:90px;
  height:90px;
  display:inline-block;
}

@media print {
  html, body {
    margin:0;
  }

  .logo,
  .info-grid .full td,
  .items-table th,
  .totals-table tr:last-child td,
  .footer-row {
    background: #fff !important;
  }
}
</style>
</head>
<body>
<div class="page">

  <!-- LOGO -->
<div class="logo">
  ${
    data.logoUrl
      ? `<img src="${data.logoUrl}" alt="logo"/>`
      : `<h3>اللوجو</h3>
`
  }
</div>

  <!-- INFO GRID -->
  <table class="info-grid">
    <!-- اسم المؤسسة -->
    <tr class="full">
      <td colspan="2">اسم المؤسسة: <strong>${data.institutionName}</strong></td>
    </tr>
    <!-- الرقم الضريبي -->
    <tr>
      <td class="lbl">الرقم الضريبي</td>
      <td class="val sep">${data.institutionTaxNumber}</td>
    </tr>
    <!-- فاتورة ضريبية مبسطة -->
    <tr class="title-row">
<td colspan="2">
فاتورة ضريبية مبسطة
</td>
    </tr>
    <!-- رقم الفاتورة -->
    <tr>
      <td class="lbl">رقم الفاتورة</td>
      <td class="val sep">${data.invoiceNumber}</td>
    </tr>
    <!-- الوقت / التاريخ -->
    <tr>
      <td class="lbl">الوقت / التاريخ</td>
      <td class="val sep">${data.invoiceDate}</td>
    </tr>
    <!-- اسم العميل -->
    <tr>
      <td class="lbl">اسم العميل</td>
      <td class="val sep">${data.customerName ?? "—"}</td>
    </tr>
    <!-- رقم الجوال -->
    <tr>
      <td class="lbl">رقم الجوال</td>
      <td class="val sep">${data.customerPhone ?? "—"}</td>
    </tr>
  </table>

  <!-- ITEMS TABLE -->
  <table class="items-table">
    <thead>
      <tr>
        <th class="td-name">الصنف</th>
        <th>الكمية</th>
        <th>السعر قبل الضريبة</th>
        <th>ضريبة القيمة المضافة</th>
        <th>الاجمالي النهائي</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>

  <!-- TOTALS TABLE -->
  <table class="totals-table">
    <tr>
      <td>عدد المنتجات</td>
      <td><span >عدد ${totalQty}</span></td>
    </tr>
    <tr>
      <td>اجمالي السعر قبل الضريبة</td>
      <td><span >${fmt(data.subTotal)} ${riyal}</span></td>
    </tr>
    <tr>
      <td>اجمالي الخصم</td>
      <td><span >${fmt(data.discountAmount)} ${riyal}</span></td>
    </tr>
    <tr>
      <td>اجمالي ضريبة القيمة المضافة</td>
      <td><span >${fmt(data.taxAmount)} ${riyal}</span></td>
    </tr>
    <tr>
      <td>الاجمالي النهائي</td>
      <td><span >${fmt(data.grandTotal)} ${riyal}</span></td>
    </tr>
  </table>

  <!-- FOOTER -->
  <div class="footer-row">عنوان المؤسسة: ${data.institutionAddress}</div>
  <div class="footer-row">رقم جوال المؤسسة: ${data.institutionPhone}</div>
  <div class="footer-row">ملاحظات علي الفاتورة: ${data.notes ?? ""}</div>

  <!-- QR -->
  <div class="qr-wrap">
    ${data.qrCodeUrl ? `<img src="${data.qrCodeUrl}" alt="QR"/>` : `<canvas id="qr" width="90" height="90"></canvas>`}
  </div>

</div>
<script>
(function(){
  var c=document.getElementById('qr'); if(!c)return;
  var ctx=c.getContext('2d'),S=90,MOD=14,cell=S/MOD;
  var pat=[
    [1,1,1,1,1,1,1,0,1,0,1,0,1,1],
    [1,0,0,0,0,0,1,0,0,1,0,1,0,1],
    [1,0,1,1,1,0,1,0,1,0,1,0,1,0],
    [1,0,1,1,1,0,1,0,0,1,0,1,0,1],
    [1,0,0,0,0,0,1,0,1,0,1,0,1,0],
    [1,1,1,1,1,1,1,0,0,1,0,1,0,1],
    [0,0,0,0,0,0,0,0,1,0,1,0,1,0],
    [1,1,0,1,0,1,1,1,0,1,0,1,0,1],
    [0,0,0,0,0,0,0,0,1,0,1,0,1,0],
    [1,1,1,1,1,1,1,0,0,1,0,1,0,1],
    [1,0,0,0,0,0,1,0,1,0,1,0,1,0],
    [1,0,1,1,1,0,1,0,0,1,0,1,0,1],
    [1,0,0,0,0,0,1,0,1,0,1,0,1,0],
    [1,1,1,1,1,1,1,0,0,1,0,1,0,1],
  ];
  ctx.fillStyle='#fff'; ctx.fillRect(0,0,S,S);
  ctx.fillStyle='#000';
  for(var r=0;r<MOD;r++) for(var cc=0;cc<MOD;cc++)
    if(pat[r][cc]) ctx.fillRect(Math.round(cc*cell),Math.round(r*cell),Math.round(cell)-1,Math.round(cell)-1);
})();

</script>
</body>
</html>`;

  try {
    await printInvoicePrinter(html);
    // const win = window.open("", "_blank", "width=440,height=980");
    // if (!win) {
    //   alert("يرجى السماح بالنوافذ المنبثقة لطباعة الفاتورة");
    //   return;
    // }
    // win.document.write(html);
  } catch (err: any) {
    const win = window.open("", "_blank", "width=440,height=980");
    if (!win) {
      alert("يرجى السماح بالنوافذ المنبثقة لطباعة الفاتورة");
      return;
    }
    win.document.write(html);
    win.document.close()
    win.onload = () => {
      win.focus();
      win.print();
    };
  }
}