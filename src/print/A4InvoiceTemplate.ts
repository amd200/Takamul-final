import { tafqeet } from "../utils/tafqeet";
import type { Customer } from "@/features/customers/types/customers.types";
import { itemBasePrice, calcItemTax, calcTotals, type CartItem } from "@/constants/data";
import { BranchInfo } from "@/features/EmployeeBranches/hooks/useBranch";
import { GenereateQRRequest, GenereateQRResponse } from "@/features/zatcaInvoice/types/zarchaInvoices.types";
import QRCode from "qrcode/lib/browser.js";
import { useSettingsStore } from "@/features/settings/store/settingsStore";

export const getA4InvoiceHTML = async (order: any, t: any, generateQR: (data: GenereateQRRequest) => Promise<GenereateQRResponse>, passedApiBase?: string): Promise<string> => {
  const branch: Partial<BranchInfo> = order.branchInfo || {};
  const customer: Partial<Customer> = order.customer || {};
  const items: any[] = order.items || order.orderItems || [];
  const res = await generateQR({ invoiceId: order.id });
  const qrImageSrc = res?.qrCode ? await QRCode.toDataURL(res.qrCode) : null;
  const taxSetting = useSettingsStore.getState().settings.taxSetting?.taxSetting;
  const isExempt = taxSetting === "Exempt";
  const apiBase = passedApiBase || "";

  // ── Date formatting ──────────────────────────────────────────────────────────
  let dateVal = order.createdAt || order.date || order.orderDate || order.invoiceDate;
  let formattedDate = "-";
  let formattedTime = "-";
  if (dateVal) {
    const d = new Date(dateVal);
    if (!isNaN(d.getTime())) {
      formattedDate = d.toLocaleDateString("en-GB");
      formattedTime = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    }
  }

  // ── Customer fields ──────────────────────────────────────────────────────────
  const custName = customer.customerName || order.customerName || order.supplierName || order.supplier || "-";
  const custPhone = customer.phone || customer.phone || order.customerPhone || order.supplierPhone || "-";
  const custTaxNo = customer.taxNumber || order.customerTaxNo || order.supplierTaxNo || "-";
  const custCommercial = customer.commercialRegister || order.customerCommercialNo || order.supplierCommercialNo || "-";
  const city = customer.cityName || customer.city || "";
  const state = customer.stateName || customer.state || "";
  const district = customer.district || "";
  const street = customer.street || customer.address || order.customerAddress || order.supplierAddress || "";
  const custAddress = [city, state, district, street].filter(Boolean).join(" / ") || "-";
  const custPostal = customer.postalCode || order.customerZipCode || "-";
  const custSubNo = customer.additionalNumber || order.customerSubNo || "-";
  const custBuilding = customer.buildingNumber || order.customerBuildingNo || "-";
  const invoiceNo = order.purchaseOrderNumber || order.orderNumber || order.invoiceNo || "-";

  // ── Helper to fix Image URLs ────────────────────────────────────────────────
  const getFullImageUrl = (url: string | null | undefined): string => {
    if (!url || typeof url !== "string") return "";
    if (url.startsWith("http")) return url;
    if (!apiBase) return url;
    return `${apiBase}/${url.replace(/^\/+/, "")}`;
  };

  const branchLogo = getFullImageUrl(branch.imageUrl);

  // ── Compute items using standard logic (Fallback) ──────────────────────────
  const cart: CartItem[] = items.map((item: any) => {
    const pct = Number(item?.discountPercentage ?? 0);
    const flat = Number(item?.discountValue ?? 0);
    const itemDiscount: CartItem["itemDiscount"] = pct > 0 ? { type: "pct", value: pct } : flat > 0 ? { type: "flat", value: flat } : null;

    const price = item.taxCalculation === 2 || item.taxCalculation === "Excludestax" ? item.unitPrice || item.price : (item.priceBeforeTax ?? item.unitPrice ?? item.price ?? 0);

    const taxCalc = item.taxCalculation === "Includestax" || item.taxCalculation === 3 ? 3 : 2;
    return {
      productId: item.productId ?? 0,
      name: item.productName || item.name || "-",
      price: Number(price),
      qty: Number(item.quantity ?? 1),
      taxamount: Number(item.taxPercentage ?? item.taxamount ?? 15),
      taxCalculation: taxCalc,
      itemDiscount,
      note: "",
      op: null,
    };
  });

  const discVal = Number(order.discountAmount || order.discountValue || order.discount || 0);
  const discountObj = { type: "flat" as const, value: discVal };

  const totals = calcTotals(cart, discountObj);

  // ── Final values prioritized by API data ────────────────────────────────────
  const computedItems = items.map((item: any, index: number) => {
    // If API provides these fields, use them. Otherwise fallback to calc logic.
    const qty = Number(item.quantity ?? 1);
    // Updated logic per user request: "Price" column shows Price  Tax
    const price = item.unitPrice !== undefined ? Number(item.unitPrice) : item.lineTotal !== undefined && qty > 0 ? Number(item.lineTotal) / qty : Number(item.unitPrice || 0) * 1.15;

    // "Sub Total" column shows lineSubTotal (Before Tax) - support multiple API variants
    // The "14" came from a fallback where lineSubTotal was missing and it used a unit price of 7
    const subTotal = item.lineSubTotal !== undefined ? Number(item.lineSubTotal) : item.lineSubtotal !== undefined ? Number(item.lineSubtotal) : item.subTotal !== undefined ? Number(item.subTotal) : item.priceBeforeTax !== undefined ? Number(item.priceBeforeTax) * qty : item.unitPrice !== undefined ? Number(item.unitPrice) * qty : item.lineTotal !== undefined ? Number(item.lineTotal) - (item.taxAmount || 0) : totals.sub / items.length;

    const taxAmt = item.taxAmount !== undefined ? Number(item.taxAmount) : calcItemTax(cart[index]);
    const netTotal = item.lineTotal !== undefined ? Number(item.lineTotal) : subTotal + taxAmt;

    return {
      item,
      price,
      qty,
      subTotal,
      taxAmt,
      netTotal,
    };
  });

  const totBeforeVAT = order.subTotal !== undefined ? Number(order.subTotal) : totals.sub;
  const totalVAT = order.taxAmount !== undefined ? Number(order.taxAmount) : totals.tax;
  const discount = order.discountAmount !== undefined ? Number(order.discountAmount) : totals.discountAmount;
  const finalTotal = order.grandTotal !== undefined ? Number(order.grandTotal) : totals.total;
  const total = order?.payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = finalTotal > 0 ? finalTotal - total : 0;

  const itemRows = computedItems
    .map(
      ({ item, price, qty, subTotal, taxAmt, netTotal }) => `
    <tr>
      <td style="text-align:center;">${item.productName || item.name || "-"}</td>
      <td>${item.unitName || "قطعة"}</td>
      <td>${qty}</td>
      <td>${price.toFixed(2)}</td>
      ${
        !isExempt
          ? ` <td>${subTotal.toFixed(2)}</td>
       <td>${taxAmt.toFixed(2)}</td>`
          : ""
      }
    <td>${netTotal.toFixed(2)}</td>
 
    </tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8"/>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600&display=swap" rel="stylesheet"/>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      font-family: 'Cairo', sans-serif;
      font-weight: 500;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      background: #fff;
      width: 100%;
      min-height: 277mm; /* Slightly less than 297mm to account for padding/margins */
      display: flex;
      flex-direction: column;
      color: #1a1a1a;
      font-size: 10px;
      line-height: 1.4;
      padding: 10mm 15mm;
    }
    .main-content {
      flex: 1;
    }

    /* ══ HEADER ══ */
    .header-grid {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 8px;
    }
    .header-col {
      flex: 1 0 0;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 4px;
      align-self: stretch;
    }
    .company-title {
      flex: 1;
      font-size: 11px;
      font-weight: 700;
      text-align: center;
      padding: 4px;
      color: #000;
      background: #f2f2f2;
      border-radius: 3px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .meta-row {
      flex: 1;
      display: flex;
      width: 100%;
      background: transparent;
      overflow: visible;
      align-items: stretch;
      gap: 4px;
    }
    .meta-label-ar {
      flex: 1.2;
      font-size: 9.5px;
      padding: 6px 4px;
      background: #f2f2f2;
      border-radius: 3px;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      color: #000;
      font-weight: 600;
      white-space: nowrap;
    }
    .meta-value {
      flex: 2;
      font-size: 11px;
      padding: 6px 4px;
      background: #f2f2f2;
      border-radius: 3px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #000;
      white-space: nowrap;
      font-weight: 700;
    }
    .meta-label-en {
      flex: 1;
      font-size: 7.5px;
      padding: 6px 4px;
      color: #000;
      background: #f2f2f2;
      border-radius: 3px;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      font-weight: 600;
      white-space: nowrap;
    }
    .logo-container {
      flex: 0.8 0 0;
      border: none;
      border-radius: 3px;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 90px;
      background: #f2f2f2;
      align-self: stretch;
    }

    /* ══ DOC TYPE SECTION ══ */
    .doc-type-container {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 10px;
    }
    .doc-type-item {
      background: #f2f2f2;
      border: none;
      border-radius: 3px;
      padding: 8px;
      font-size: 11px;
      color: #000;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
    }
    .doc-type-item:nth-child(1), .doc-type-item:nth-child(3) {
      flex: 1 0 0;
    }
    .doc-type-item:nth-child(2) {
      flex: 0.8 0 0;
    }

    /* ══ CUSTOMER BOX ══ */
    .section-header {
      background: #f0f0f0;
      padding: 3px 12px;
      font-size: 11px;
      font-weight: 600;
      border: 1.5px solid #000;
      border-bottom: none;
      display: inline-block;
      border-radius: 3px 3px 0 0;
      color: #000;
    }
    .customer-box {
      border: none;
      margin-bottom: 10px;
      border-radius: 0 3px 3px 3px;
      overflow: hidden;
    }
    .cust-tbl {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }
    .cust-tbl td {
      border: 1px solid #000;
      vertical-align: middle;
    }
    .cust-lbl {
      width: 20%;
      background: #f8f8f8;
      padding: 10px 8px;
      font-size: 10px;
      color: #444;
      text-align: right;
      border-left: 1.5px solid #000;
      white-space: nowrap;
    }
    .cust-val {
      width: 30%;
      padding: 10px 10px;
      font-size: 10px;
      color: #000;
      text-align: right;
    }
    .addr-row td {
      padding: 10px 12px;
      font-size: 9.5px;
      color: #1a1a1a;
      text-align: right;
      line-height: 1.5;
    }

    /* ══ ITEMS TABLE ══ */
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 10px;
    }
    .items-table th {
      background: #f0f0f0;
      border: 1px solid #000;
      padding: 6px 4px;
      font-size: 10px;
      font-weight: 600;
      text-align: center;
      color: #1a1a1a;
    }
    .items-table th .en-sub {
      display: block;
      font-size: 7.5px;
      color: #555;
      margin-top: 1px;
    }
    .items-table td {
      border: 1px solid #000;
      padding: 7px 4px;
      text-align: center;
      font-size: 10px;
      color: #000;
    }

    /* ══ FOOTER SECTION ══ */
    .footer-section {
      display: flex;
      gap: 10px;
      margin-top: 15px;
      align-items: stretch;
    }

    .totals-table {
      flex: 1;
      border-collapse: collapse;
      border: 1.5px solid #000;
    }
    .totals-table td {
      border: 1px solid #000;
      padding: 5px;
      text-align: center;
      font-size: 10px;
      color: #000;
      vertical-align: middle;
    }
    .totals-table .lbl-en {
      width: 100px;
      background: #fff;
      font-weight: 600;
    }
    .totals-table .val-cell {
      width: 90px;
      font-weight: 700;
      font-size: 11px;
    }
    .totals-table .lbl-ar {
      background: #fafafa;
      text-align: center;
      font-weight: 600;
    }
    .totals-table .net-total-row td {
      background: #f2f2f2;
      font-weight: 700;
      font-size: 12px;
    }

    .qr-barcode-container {
      width: 140px;
      border: 1.5px solid #000;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 8px;
      gap: 8px;
      background: #fff;
    }
    .qr-code-final {
      width: 80px;
      height: 80px;
    }
    .barcode-final {
      width: 110px;
      height: 35px;
      object-fit: contain;
    }
    .inv-no-small {
      font-size: 8px;
      font-weight: 700;
      margin-top: -4px;
    }

    .full-width-bar {
      border: 1.5px solid #000;
      background: #f2f2f2;
      padding: 8px;
      margin-top: 10px;
      text-align: center;
      font-weight: 600;
      font-size: 11px;
      color: #000;
    }
    .notes-box {
      background: #fafafa;
      padding: 8px 12px;
      border: 1.5px solid #000;
      margin-top: 10px;
      font-size: 11px;
      color: #000;
      display: flex;
      justify-content: center;
      gap: 8px;
    }


    /* ══ PRINT ══ */
    @media print {
      body { margin: 0; padding: 15mm; }
      * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    }
  </style>
</head>
<body>
  <div class="main-content">
  <!-- ══ HEADER ══ -->
  <div class="header-grid">
    <div class="header-col">
      <div class="company-title">${branch.name || "-"}</div>
      <div class="meta-row">
        <div class="meta-label-ar">${t("vat_number", "الرقم الضريبي")}</div>
        <div class="meta-value">${branch.taxNumber || "-"}</div>
        <div class="meta-label-en">VAT No.</div>
      </div>
      <div class="meta-row">
        <div class="meta-label-ar">${t("invoice_no", "فاتورة رقم")}</div>
        <div class="meta-value">${invoiceNo}</div>
        <div class="meta-label-en">INV No.</div>
      </div>
    </div>
    <div class="logo-container" id="logo-box">
      ${
        branchLogo
          ? `
        <img src="${branchLogo}" alt="Logo" 
             style="max-height: 85px; max-width: 100%; object-fit: contain;"
             onerror="this.style.display='none'; document.getElementById('logo-fallback').style.display='flex';"
        />
        <div id="logo-fallback" style="display: none; font-size: 14px; font-weight: 700; flex-direction: column; align-items: center; width: 100%;">
          <div>Logo / اللوجو</div>
        </div>
      `
          : `
        <div style="font-size: 14px; font-weight: 700; display: flex; flex-direction: column; align-items: center; width: 100%;">
          <div>Logo / اللوجو</div>
        </div>
      `
      }
    </div>
    <div class="header-col">
      <div class="company-title">${branch.nameEn || "-"}</div>
      <div class="meta-row">
        <div class="meta-label-ar">${t("commercial_register", "سجل التجاري")}</div>
        <div class="meta-value">${branch.commercialRegister || "-"}</div>
        <div class="meta-label-en">Commercial No.</div>
      </div>
      <div class="meta-row">
        <div class="meta-label-ar">${t("issue", "إصدار")}</div>
        <div class="meta-value" style="font-size:8px; white-space:nowrap;">${formattedDate} | ${formattedTime}</div>
        <div class="meta-label-en">Release D/T</div>
      </div>
    </div>
  </div>

  <!-- ══ DOC TYPE SECTION ══ -->
  <div class="doc-type-container">
    <div class="doc-type-item">${order.purchaseOrderNumber ? t("purchase_invoice", "فاتورة مشتريات") : t("cash_sales_invoice", "فاتورة مبيعات نقدية")}</div>
    <div class="doc-type-item">${t("tax_invoice", "فاتورة ضريبية")} ${custTaxNo ? "" : "مبسطة"}</div>
    <div class="doc-type-item">${t("seller_name", "اسم البائع")} : ${order.createdBy || order.sellerName || order.cashier || order.employeeName || "-"}</div>
  </div>

  <!-- ══ CUSTOMER/SUPPLIER INFO ══ -->
  <div style="margin-bottom:10px;">
    <div style="display:flex; justify-content:flex-start;">
      <div class="section-header">${order.purchaseOrderNumber ? t("supplier_data", "بيانات المورد") : t("customer_data", "بيانات العميل")}</div>
    </div>
    <div class="customer-box">
      <table class="cust-tbl">
        <tr>
          <td class="cust-lbl">${t("name", "الاسم")} :</td>
          <td class="cust-val">${custName}</td>
          <td class="cust-lbl">${t("phone", "رقم الجوال")} :</td>
          <td class="cust-val">${custPhone}</td>
        </tr>
        <tr>
          <td class="cust-lbl">${t("vat_number", "الرقم الضريبي")} :</td>
          <td class="cust-val">${custTaxNo}</td>
          <td class="cust-lbl">${t("commercial_register", "السجل التجاري")} :</td>
          <td class="cust-val">${custCommercial}</td>
        </tr>
        <tr class="addr-row">
          <td colspan="2" style="border-left: 1px solid #000;">
            ${t("national_address", "العنوان الوطني")} : ${custAddress}
          </td>
          <td colspan="2">
            ${t("zip_code", "الرمز البريدي")}: ${custPostal} ،
            ${t("sub_no", "الرقم الفرعي")}: ${custSubNo} ،
            ${t("building_no", "رقم المبنى")}: ${custBuilding}
          </td>
        </tr>
      </table>
    </div>
  </div>

  <!-- ══ ITEMS TABLE ══ -->
  <table class="items-table">
    <thead>
<tr>
  <th style="width: 35%;">${t("item_description", "بيان الصنف")}<span class="en-sub">Item Des</span></th>
  <th style="width: 10%;">${t("unit", "الوحدة")}<span class="en-sub">Unit</span></th>
  <th style="width: 10%;">${t("quantity", "الكمية")}<span class="en-sub">QTY</span></th>
  <th style="width: 10%;">${t("price", "السعر")}<span class="en-sub">price</span></th>
  ${
    !isExempt
      ? `
  <th style="width: 12%;">${t("sub_total", "اجمالي فرعي")}<span class="en-sub">Sub Total</span></th>
  <th style="width: 10%;">${t("tax", "الضريبة")}<span class="en-sub">Tax %15</span></th>
  `
      : ""
  }
  <th style="width: ${isExempt ? "55%" : "13%"};">${t("net_total", "الاجمالي النهائي")}<span class="en-sub">Net Total</span></th>
</tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>
  </div> <!-- end of main-content -->

  <!-- ══ FOOTER SECTION ══ -->
  <div class="footer-section">
    ${
      !isExempt
        ? `
      <div class="qr-barcode-container">
    ${qrImageSrc ? `<img src="${qrImageSrc || ""}" onerror="this.style.display='none'" class="qr-code-final" alt="QR"/>` : `<div style="font-size: 8px; color: #555; text-align: center;">QR Code Unavailable</div>`}
      <div class="inv-no-small">${invoiceNo}</div>
    </div>
      `
        : ""
    }

   <table class="totals-table">
  <tr>
    <td class="lbl-ar">${t("items_count", "عدد المنتجات")}</td>
    <td class="val-cell">${cart.reduce((s, i) => s + i.qty, 0)}</td>
    <td class="lbl-en">Items</td>
  </tr>
  <tr>
    <td class="lbl-ar">${t("total_discount", "اجمالي الخصم")}</td>
    <td class="val-cell">${discount.toFixed(2)}</td>
    <td class="lbl-en">Discount</td>
  </tr>
  ${
    !isExempt
      ? [
          `<tr>
      <td class="lbl-ar">${t("tot_before_vat", "اجمالي السعر قبل الضريبة")}</td>
      <td class="val-cell">${totBeforeVAT.toFixed(2)}</td>
      <td class="lbl-en">Tot Before VAT</td>
    </tr>`,
          `<tr>
      <td class="lbl-ar">${t("total_vat", "ضريبة القيمة المضافة")}</td>
      <td class="val-cell">${totalVAT.toFixed(2)}</td>
      <td class="lbl-en">Total VAT %15</td>
    </tr>`,
        ].join("")
      : ""
  }
  <tr class="net-total-row">
    <td class="lbl-ar">${t("final_total", "الاجمالي النهائي")}</td>
    <td class="val-cell">${finalTotal.toFixed(2)}</td>
    <td class="lbl-en">NET TOTAL</td>
  </tr>
  <tr class="net-total-row">
    <td class="lbl-ar">${t("credit", "المدفوع")}</td>
    <td class="val-cell">${total.toFixed(2)}</td>
    <td class="lbl-en">PAID AMOUNT</td>
  </tr>
  <tr class="net-total-row">
    <td class="lbl-ar">${t("remaining", "المتبقي")}</td>
    <td class="val-cell">${remaining.toFixed(2)}</td>
    <td class="lbl-en">REMAINING</td>
  </tr>
</table>
  </div>

  <!-- ══ NOTES ══ -->
  <div class="notes-box">
    <div>${order.notes || order.orderNotes || order.note || "-"}</div>
  </div>

  <!-- ══ ADDRESS BAR ══ -->
  <div class="full-width-bar" style="display: flex; justify-content: center; gap: 20px;">
    <span>${t("address", "العنوان")} : ${[branch.cityName, branch.stateName, branch.district, branch.street].filter(Boolean).join(" / ") || branch.address || "-"}</span>
    <span>${t("phone", "رقم الجوال")} : ${branch.phone || "-"}</span>
  </div>

</body>
</html>`;
};
