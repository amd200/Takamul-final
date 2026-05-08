import { ExtendedData } from "@/context/PrintContext";
import { tafqeet } from "../utils/tafqeet";
import { itemBasePrice, calcItemTax, calcTotals, type CartItem } from "@/constants/data";
import { Supplier } from "@/features/suppliers/types/suppliers.types";
import { Customer } from "@/features/customers/types/customers.types";
import { BranchInfo } from "@/features/EmployeeBranches/hooks/useBranch";

type PrintType = "sale" | "quotation" | "purchase";

export const getA4PrintHTML = (data: ExtendedData, type: PrintType, t: any, passedApiBase?: string): string => {
  const branch = data?.branchInfo as BranchInfo;
  const partner =  data?.customer as Customer;
  const items = data?.items || [];
  const apiBase = passedApiBase || "";

  // ── Date formatting ──────────────────────────────────────────────────────────
  let dateVal = data.orderDate || data.quotationDate;
  let formattedDate = "-";
  let formattedTime = "-";
  if (dateVal) {
    const d = new Date(dateVal);
    if (!isNaN(d.getTime())) {
      formattedDate = d.toLocaleDateString("en-GB");
      formattedTime = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    }
  }

  // ── Header Titles ────────────────────────────────────────────────────────────
  let docTitleAr = "";
  let docTitleEn = "";
  if (type === "sale") {
    docTitleAr = t("cash_sales_invoice", "فاتورة مبيعات نقدية");
    docTitleEn = "Sales Invoice";
  } else if (type === "quotation") {
    docTitleAr = t("quotation", "عرض سعر");
    docTitleEn = "Quotation";
  } else if (type === "purchase") {
    docTitleAr = t("purchase_invoice", "فاتورة مشتريات");
    docTitleEn = "Purchase Invoice";
  }

  // ── Party Labels (Customer/Supplier) ─────────────────────────────────────────
  const partyLabelAr = type === "purchase" ? t("supplier_data", "بيانات المورد") : t("customer_data", "بيانات العميل");
  const partyNameLabel = t("name", "الاسم");

  // ── Party Fields ─────────────────────────────────────────────────────────────
  const partyName = partner?.customerName || "-";
  const partyPhone = partner?.phone || "-";
  const partyTaxNo = partner?.taxNumber || "-";
  const partyCommercial = partner?.commercialRegister || "-";

  // const country = partner?.countryName || "";
  const city = partner?.cityName || "";
  const state = partner?.stateName || "";
  const district = partner?.district || "";
  const street = partner?.street || partner?.address || "";
  const partyAddress = [city, state, district, street].filter(Boolean).join(" / ") || "-";

  const partyPostal = partner?.postalCode || "-";
  const partySubNo = partner?.additionalNumber || "-";
  const partyBuilding = partner?.buildingNumber || "-";
  const docNo = data.orderNumber || data.quotationNumber || data.purchaseOrderNumber || "-";

  // ── Logo URL ────────────────────────────────────────────────────────────────
  const getFullImageUrl = (url: string | null | undefined): string => {
    if (!url || typeof url !== "string") return "";
    if (url.startsWith("http")) return url;
    if (!apiBase) return url;
    return `${apiBase}/${url.replace(/^\/+/, "")}`;
  };
  const branchLogo = getFullImageUrl(branch?.imageUrl);

  // ── Cart Logic ───────────────────────────────────────────────────────────────
  const cart: CartItem[] = items.map((item: any) => {
    const pct = Number(item?.discountPercentage ?? 0);
    const flat = Number(item?.discountValue ?? item?.discountAmount ?? 0);
    const itemDiscount: CartItem["itemDiscount"] = pct > 0 ? { type: "pct", value: pct } : flat > 0 ? { type: "flat", value: flat } : null;

    const price = type === "purchase" || item.taxCalculation === 3 ? item.unitPrice || item.price : (item.priceBeforeTax ?? item.unitPrice ?? item.price ?? 0);

    const taxCalc = item.taxCalculation === "Includestax" || item.taxCalculation === 3 ? 3 : 2;

    return {
      productId: item.productId ?? 0,
      name: item.productName || item.name || "-",
      price: Number(price),
      qty: Number(item.quantity ?? 1),
      taxamount: Number(item.taxPercentage ?? item.taxAmount ?? 15),
      taxCalculation: taxCalc,
      itemDiscount,
      note: "",
      op: null,
    };
  });

  const discVal = Number(data.discountAmount || 0);
  const totals = calcTotals(cart, { type: "flat", value: discVal });

  const totBeforeVAT = data.subTotal !== undefined ? Number(data.subTotal) : totals.sub;
  const totalVAT = data.taxAmount !== undefined ? Number(data.taxAmount) : totals.tax;
  const discount = data.discountAmount !== undefined ? Number(data.discountAmount) : totals.discountAmount;
  const finalTotal = data.grandTotal !== undefined ? Number(data.grandTotal) : totals.total;

  const itemRows = items
    .map((item: any, index: number) => {
      const qty = Number(item.quantity ?? 1);
      const price = item.unitPrice !== undefined ? Number(item.unitPrice) : item.lineTotal !== undefined && qty > 0 ? Number(item.lineTotal) / qty : Number(item.unitPrice || 0) * 1.15;
      const subTotal = item.lineSubTotal !== undefined ? Number(item.lineSubTotal) : item.lineSubtotal !== undefined ? Number(item.lineSubtotal) : item.subTotal !== undefined ? Number(item.subTotal) : Number(item.priceBeforeTax || item.unitPrice || 0) * qty;
      const taxAmt = item.taxAmount !== undefined ? Number(item.taxAmount) : calcItemTax(cart[index]);
      const netTotal = item.lineTotal !== undefined ? Number(item.lineTotal) : subTotal + taxAmt;

      return `
      <tr>
        <td style="text-align:center;">${item.productName || item.name || "-"}</td>
        <td>${item.unitName || item.baseUnitName || "قطعة"}</td>
        <td>${qty}</td>
        <td>${price.toFixed(2)}</td>
        <td>${subTotal.toFixed(2)}</td>
        <td>${taxAmt.toFixed(2)}</td>
        <td>${netTotal.toFixed(2)}</td>
      </tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8"/>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&display=swap" rel="stylesheet"/>
  <style>
    @page { size: A4 portrait; margin: 10mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Cairo', sans-serif; font-weight: 500; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body { background: #fff; width: 100%; min-height: 277mm; display: flex; flex-direction: column; color: #1a1a1a; font-size: 10px; line-height: 1.4; padding: 10mm 15mm; }
    .main-content { flex: 1; }
    .header-grid { display: grid; grid-template-columns: 1fr 0.8fr 1fr; gap: 8px; margin-bottom: 8px; }
    .header-col { display: flex; flex-direction: column; justify-content: space-between; gap: 4px; align-self: stretch; }
    .company-title { flex: 1; font-size: 11px; font-weight: 700; text-align: center; padding: 4px; color: #000; background: #f2f2f2; border-radius: 3px; display: flex; align-items: center; justify-content: center; }
    .meta-row { flex: 1; display: flex; width: 100%; gap: 4px; }
    .meta-label-ar { flex: 1.2; font-size: 9.5px; padding: 6px 4px; background: #f2f2f2; border-radius: 3px; display: flex; align-items: center; justify-content: center; text-align: center; color: #000; font-weight: 600; white-space: nowrap; }
    .meta-value { flex: 2; font-size: 11px; padding: 6px 4px; background: #f2f2f2; border-radius: 3px; display: flex; align-items: center; justify-content: center; color: #000; white-space: nowrap; font-weight: 700; }
    .meta-label-en { flex: 1; font-size: 7.5px; padding: 6px 4px; color: #000; background: #f2f2f2; border-radius: 3px; display: flex; align-items: center; justify-content: center; text-align: center; font-weight: 600; white-space: nowrap; }
    .logo-container { border: none; border-radius: 3px; display: flex; align-items: center; justify-content: center; min-height: 90px; background: #f2f2f2; align-self: stretch; }
    
    .doc-type-container { display: grid; grid-template-columns: 1.8fr 1fr; gap: 8px; margin-bottom: 10px; }
    .doc-type-item { background: #f2f2f2; border-radius: 3px; padding: 8px; font-size: 11px; color: #000; display: flex; align-items: center; justify-content: center; font-weight: 700; }

    .section-header { background: #f0f0f0; padding: 3px 12px; font-size: 11px; font-weight: 600; border: 1.5px solid #000; border-bottom: none; display: inline-block; border-radius: 3px 3px 0 0; color: #000; }
    .customer-box { border: none; margin-bottom: 10px; border-radius: 0 3px 3px 3px; overflow: hidden; }
    .cust-tbl { width: 100%; border-collapse: collapse; table-layout: fixed; }
    .cust-tbl td { border: 1px solid #000; vertical-align: middle; }
    .cust-lbl { width: 20%; background: #f8f8f8; padding: 10px 8px; font-size: 10px; color: #444; text-align: right; border-left: 1.5px solid #000; white-space: nowrap; }
    .cust-val { width: 30%; padding: 10px 10px; font-size: 10px; color: #000; text-align: right; }
    
    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
    .items-table th { background: #f0f0f0; border: 1px solid #000; padding: 6px 4px; font-size: 10px; font-weight: 600; text-align: center; color: #1a1a1a; }
    .items-table th .en-sub { display: block; font-size: 7.5px; color: #555; margin-top: 1px; }
    .items-table td { border: 1px solid #000; padding: 7px 4px; text-align: center; font-size: 10px; color: #000; }

    .footer-section { display: flex; gap: 10px; margin-top: 15px; align-items: stretch; width: 100%; }
    .totals-table { width: 100%; border-collapse: collapse; border: 1.5px solid #000; }
    .totals-table td { border: 1px solid #000; padding: 5px; text-align: center; font-size: 10px; color: #000; vertical-align: middle; }
    .totals-table .lbl-en { background: #fff; font-weight: 600; width: 33.33%; }
    .totals-table .val-cell { font-weight: 700; font-size: 11px; width: 33.33%; }
    .totals-table .lbl-ar { background: #fafafa; font-weight: 600; width: 33.33%; }
    .totals-table .net-total-row td { background: #f2f2f2; font-weight: 700; font-size: 12px; }

    .full-width-bar { border: 1.5px solid #000; background: #f2f2f2; padding: 8px; margin-top: 10px; text-align: center; font-weight: 600; font-size: 11px; color: #000; }
    .notes-box { background: #fafafa; padding: 8px 12px; border: 1.5px solid #000; margin-top: 10px; font-size: 11px; color: #000; display: flex; justify-content: center; gap: 8px; }
  </style>
</head>
<body>
  <div class="main-content">
  <div class="header-grid">
    <div class="header-col">
      <div class="company-title">${branch?.name || "-"}</div>
      <div class="meta-row">
        <div class="meta-label-ar">${t("vat_number", "الرقم الضريبي")}</div>
        <div class="meta-value">${branch?.taxNumber || "-"}</div>
        <div class="meta-label-en">VAT No.</div>
      </div>
      <div class="meta-row">
        <div class="meta-label-ar">${t("document_no", "رقم المستند")}</div>
        <div class="meta-value">${docNo}</div>
        <div class="meta-label-en">Doc No.</div>
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
      <div class="company-title">${branch?.nameEn || "-"}</div>
      <div class="meta-row">
        <div class="meta-label-ar">${t("commercial_register", "سجل التجاري")}</div>
        <div class="meta-value">${branch?.commercialRegister || "-"}</div>
        <div class="meta-label-en">Comm. No.</div>
      </div>
      <div class="meta-row">
        <div class="meta-label-ar">${t("issue", "إصدار")}</div>
        <div class="meta-value" style="font-size:8px;">${formattedDate} | ${formattedTime}</div>
        <div class="meta-label-en">Release D/T</div>
      </div>
    </div>
  </div>

  <div class="doc-type-container">
    <div class="doc-type-item">${docTitleAr}</div>
    <div class="doc-type-item">${t("seller_name", "اسم البائع")} : ${data.createdBy || "-"}</div>
  </div>

  <div style="margin-bottom:10px;">
    <div class="section-header">${partyLabelAr}</div>
    <div class="customer-box">
      <table class="cust-tbl">
        <tr>
          <td class="cust-lbl">${partyNameLabel} :</td>
          <td class="cust-val">${partyName}</td>
          <td class="cust-lbl">${t("phone", "رقم الجوال")} :</td>
          <td class="cust-val">${partyPhone}</td>
        </tr>
        <tr>
          <td class="cust-lbl">${t("vat_number", "الرقم الضريبي")} :</td>
          <td class="cust-val">${partyTaxNo}</td>
          <td class="cust-lbl">${t("commercial_register", "السجل التجاري")} :</td>
          <td class="cust-val">${partyCommercial}</td>
        </tr>
        <tr>
          <td colspan="2" style="padding:10px; border-left:1px solid #000; text-align:right;">
            ${t("national_address", "العنوان الوطني")} : ${partyAddress}
          </td>
          <td colspan="2" style="padding:10px; text-align:right;">
            ${t("zip_code", "الرمز البريدي")}: ${partyPostal} ، ${t("building_no", "رقم المبنى")}: ${partyBuilding}
          </td>
        </tr>
      </table>
    </div>
  </div>

  <table class="items-table">
    <thead>
      <tr>
        <th style="width: 35%;">${t("item_description", "بيان الصنف")}<span class="en-sub">Item Des</span></th>
        <th style="width: 10%;">${t("unit", "الوحدة")}<span class="en-sub">Unit</span></th>
        <th style="width: 10%;">${t("quantity", "الكمية")}<span class="en-sub">QTY</span></th>
        <th style="width: 10%;">${t("price", "السعر")}<span class="en-sub">price</span></th>
        <th style="width: 12%;">${t("sub_total", "اجمالي فرعي")}<span class="en-sub">Sub Total</span></th>
        <th style="width: 10%;">${t("tax", "الضريبة")}<span class="en-sub">Tax %15</span></th>
        <th style="width: 13%;">${t("net_total", "الاجمالي النهائي")}<span class="en-sub">Net Total</span></th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>
  </div>

  <div class="footer-section">
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
      <tr>
        <td class="lbl-ar">${t("tot_before_vat", "اجمالي السعر قبل الضريبة")}</td>
        <td class="val-cell">${totBeforeVAT.toFixed(2)}</td>
        <td class="lbl-en">Before VAT</td>
      </tr>
    
      <tr>
        <td class="lbl-ar">${t("total_vat", "ضريبة القيمة المضافة")}</td>
        <td class="val-cell">${totalVAT.toFixed(2)}</td>
        <td class="lbl-en">VAT %15</td>
      </tr>
      <tr class="net-total-row">
        <td class="lbl-ar">${t("final_total", "الاجمالي النهائي")}</td>
        <td class="val-cell">${finalTotal.toFixed(2)}</td>
        <td class="lbl-en">NET TOTAL</td>
      </tr>
    </table>
  </div>

  <div class="notes-box">
    <div>${data.notes || "-"}</div>
  </div>

  <div class="full-width-bar" style="display: flex; justify-content: center; gap: 20px;">
    <span>${t("address", "العنوان")} : ${[branch?.cityName, branch?.stateName, branch?.district, branch?.street].filter(Boolean).join(" / ") || branch?.address || "-"}</span>
    <span>${t("phone", "رقم الجوال")} : ${branch?.phone || "-"}</span>
  </div>
</body>
</html>`;
};
