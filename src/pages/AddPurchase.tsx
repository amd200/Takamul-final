import React, { useState, useRef, useEffect } from "react";
import {
  CheckCircle2,
  Upload,
  UserPlus,
  Plus,
  Barcode,
  Trash2,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List as ListIcon,
  Link as LinkIcon,
  ChevronDown,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useProducts, type Product } from "@/context/ProductsContext";
import { useSuppliers } from "@/context/SuppliersContext";
import { useSettings } from "@/context/SettingsContext";
import { usePurchases } from "@/context/PurchasesContext";
import { PurchaseStatus, PaymentStatus, type Purchase } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import MobileDataCard from "@/components/MobileDataCard";
import ComboboxField from "@/components/ui/ComboboxField";

import { Input } from "@/components/ui/input";
import AddSupplierModal from "@/components/modals/AddSupplierModal";

interface PurchaseItem {
  id: string;
  code: string;
  name: string;
  expiryDate: string;
  unitCost: number;
  quantity: number;
  free: number;
  totalNoVat: number;
  vatRate: number;
  vatAmount: number;
  totalSr: number;
  publicPrice: number;
}

export default function AddPurchase() {
  const { t, direction } = useLanguage();
  const { products: allProducts } = useProducts();
  const { suppliers } = useSuppliers();
  const { systemSettings } = useSettings();
  const { addPurchase } = usePurchases();
  const navigate = useNavigate();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const [fileName, setFileName] = useState("");
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 16),
    refNo: `${systemSettings?.prefixes?.purchases || "PUR-"}${Math.floor(
      Math.random() * 1000000
    )}`,
    purchaseType: "warehouse",
    status: "received",
    branch: "main",
    supplier: "",
    discountBeforeVat: 0,
    discountAfterVat: 0,
    amountPaid: 0,
    paymentType: "credit",
    paymentTerms: "",
    notes: "",
  });

  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredProducts =
    searchQuery.trim() === ""
      ? []
      : allProducts.filter((p) => {
        const name = String(p.name || "").toLowerCase();
        const code = String(p.code || "").toLowerCase();
        const query = searchQuery.toLowerCase();
        return name.includes(query) || code.includes(query);
      });

  const handleSelectProduct = (product: Product) => {
    const existingItemIndex = items.findIndex(
      (item) => item.id === String(product.id)
    );

    if (existingItemIndex !== -1) {
      const updatedItems = [...items];
      const item = updatedItems[existingItemIndex];

      item.quantity += 1;

      const cost = Number(item.unitCost) || 0;
      const qty = Number(item.quantity) || 0;

      item.totalNoVat = cost * qty;
      item.vatAmount = item.totalNoVat * (item.vatRate / 100);
      item.totalSr = item.totalNoVat + item.vatAmount;

      setItems(updatedItems);
    } else {
      const cost = Number(product.cost) || 0;
      const vatRate = 15;
      const totalNoVat = cost;
      const vatAmount = totalNoVat * (vatRate / 100);
      const totalSr = totalNoVat + vatAmount;

      const newItem: PurchaseItem = {
        id: String(product.id),
        code: String(product.code || ""),
        name: String(product.name || ""),
        expiryDate: "",
        unitCost: cost,
        quantity: 1,
        free: 0,
        totalNoVat,
        vatRate,
        vatAmount,
        totalSr,
        publicPrice: Number(product.price) || 0,
      };

      setItems([...items, newItem]);
    }

    setSearchQuery("");
    setShowResults(false);
  };

  const updateItem = (id: string, field: keyof PurchaseItem, value: any) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        const updatedItem = {
          ...item,
          [field]:
            field === "expiryDate" || field === "name" || field === "code"
              ? value
              : Number(value),
        };

        if (field === "unitCost" || field === "quantity" || field === "vatRate") {
          const cost =
            field === "unitCost"
              ? Number(value) || 0
              : Number(updatedItem.unitCost) || 0;
          const qty =
            field === "quantity"
              ? Number(value) || 0
              : Number(updatedItem.quantity) || 0;
          const vatRateValue =
            field === "vatRate"
              ? Number(value) || 0
              : Number(updatedItem.vatRate) || 0;

          updatedItem.totalNoVat = cost * qty;
          updatedItem.vatAmount = updatedItem.totalNoVat * (vatRateValue / 100);
          updatedItem.totalSr = updatedItem.totalNoVat + updatedItem.vatAmount;
        }

        return updatedItem;
      })
    );
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const totalBeforeDiscount = items.reduce((sum, item) => sum + item.totalSr, 0);
  const totalVat = items.reduce((sum, item) => sum + item.vatAmount, 0);
  const totalNoVat = items.reduce((sum, item) => sum + item.totalNoVat, 0);

  const discountBeforeVatValue = Number(formData.discountBeforeVat) || 0;
  const discountAfterVatValue = Number(formData.discountAfterVat) || 0;

  const finalTotal =
    totalBeforeDiscount - discountBeforeVatValue - discountAfterVatValue > 0
      ? totalBeforeDiscount - discountBeforeVatValue - discountAfterVatValue
      : 0;

  const expectedProfit = items.reduce((sum, item) => {
    const itemProfit =
      ((Number(item.publicPrice) || 0) - (Number(item.unitCost) || 0)) *
      (Number(item.quantity) || 0);
    return sum + itemProfit;
  }, 0);

  const handleComplete = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.refNo.trim()) {
      alert(t("ref_no") || "رقم المرجع مطلوب");
      return;
    }

    if (!formData.date) {
      alert(t("date") || "التاريخ مطلوب");
      return;
    }

    if (items.length === 0) {
      alert(t("no_products_added") || "يجب إضافة صنف واحد على الأقل");
      return;
    }

    const paid = Number(formData.amountPaid) || 0;
    const balance = finalTotal - paid;

    const selectedSupplier = suppliers.find(
      (s: any) => String(s.id) === String(formData.supplier)
    );

    const supplierName =
      selectedSupplier?.supplierName ||
      selectedSupplier?.name ||
      (t("general_supplier") || "مورد عام");

    const newPurchase: Omit<Purchase, "id"> = {
      date: formData.date.split("T")[0],
      reference: formData.refNo,
      supplier: supplierName,
      status: formData.status as PurchaseStatus,
      total: finalTotal,
      paid,
      balance,
      paymentStatus:
        paid >= finalTotal
          ? PaymentStatus.PAID
          : paid > 0
            ? PaymentStatus.PARTIAL
            : PaymentStatus.DUE,
      branch: formData.branch,
      notes: formData.notes,
    };

    addPurchase(newPurchase);
    alert(t("operation_completed_successfully"));
    navigate("/purchases");
  };

  const handleReset = () => {
    if (confirm(t("confirm_reset_form") || "Are you sure you want to reset the form?")) {
      setFormData({
        date: new Date().toISOString().slice(0, 16),
        refNo: `${systemSettings?.prefixes?.purchases || "PUR-"}${Math.floor(
          Math.random() * 1000000
        )}`,
        purchaseType: "warehouse",
        status: "received",
        branch: "main",
        supplier: "",
        discountBeforeVat: 0,
        discountAfterVat: 0,
        amountPaid: 0,
        paymentType: "credit",
        paymentTerms: "",
        notes: "",
      });
      setItems([]);
      setFileName("");
      setSearchQuery("");
      setShowResults(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 pb-20"
      dir={direction}
    >
      <div className="flex items-center justify-between bg-white dark:bg-transparent p-4 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800">
        <h1 className="text-lg font-bold text-primary flex items-center gap-2">
          <Plus size={20} />
          {t("add_purchase")}
        </h1>
      </div>

      <div className="bg-white dark:bg-transparent rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
        <div className="p-4 bg-gray-50 dark:bg-slate-900/50 border-b border-gray-100 dark:border-slate-800">
          <p className="text-sm text-gray-600 dark:text-slate-400">{t("add_product_desc")}</p>
        </div>

        <form onSubmit={handleComplete} className="p-6 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                {t("date")} *
              </label>
              <Input
                type="datetime-local"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}

                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                {t("ref_no")} *
              </label>
              <Input
                type="text"
                value={formData.refNo}
                onChange={(e) => setFormData({ ...formData, refNo: e.target.value })}

                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                {t("purchase_invoice_type")} *
              </label>
              <ComboboxField
                value={formData.purchaseType}
                onValueChange={(val) =>
                  setFormData({ ...formData, purchaseType: val })
                }
                placeholder={t("purchase_invoice_type")}
                items={[
                  { value: "warehouse", label: t("warehouse_purchase_invoice") },
                  { value: "service", label: t("service_purchase_invoice") },
                ]}
                valueKey="value"
                labelKey="label"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                {t("status")} *
              </label>
              <ComboboxField
                value={formData.status}
                onValueChange={(val) =>
                  setFormData({ ...formData, status: val })
                }
                placeholder={t("status")}
                items={[
                  { value: "received", label: t("received") },
                  { value: "pending", label: t("pending") },
                  { value: "ordered", label: t("ordered") },
                ]}
                valueKey="value"
                labelKey="label"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                {t("branch")} *
              </label>
              <ComboboxField
                value={formData.branch}
                onValueChange={(val) =>
                  setFormData({ ...formData, branch: val })
                }
                placeholder={t("branch")}
                items={[
                  { value: "main", label: t("experimental") },
                  { value: "branch1", label: t("branch_1") },
                ]}
                valueKey="value"
                labelKey="label"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                {t("attachments")}
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-primary text-white px-4 py-2 rounded-xl text-sm hover:bg-primary-hover transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  <Upload size={16} />
                  {t("browse")}
                </button>
                <Input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={(e) => setFileName(e.target.files?.[0]?.name || "")}
                />
                <Input
                  type="text"
                  value={fileName}

                  readOnly
                  placeholder={t("no_file_chosen") || "لم يتم اختيار ملف"}
                />
              </div>
            </div>
          </div>

          <div className="bg-orange-50/30 dark:bg-orange-950/20 p-4 rounded-xl border border-orange-100 dark:border-orange-900/50 space-y-4">
            <p className="text-sm text-orange-800 dark:text-orange-400 font-medium">
              {t("update_options_before_adding")}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  {t("supplier")}
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <ComboboxField
                      value={formData.supplier}
                      onValueChange={(val) =>
                        setFormData({ ...formData, supplier: val })
                      }
                      items={suppliers}
                      valueKey="id"
                      labelKey="supplierName"
                      placeholder={t("select_supplier")}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowAddSupplierModal(true)}
                    className="p-2 bg-primary text-white rounded-md hover:bg-primary-hover transition-colors"
                  >
                    <UserPlus size={18} />
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  {t("expected_profit") || "الربح المتوقع"}
                </label>
                <div >
                  {expectedProfit.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="relative" ref={searchRef}>
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 gap-2">
                <Barcode size={24} className="text-gray-400" />
              </div>

              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <button
                  type="button"
                  onClick={() => navigate("/products/create")}
                  className="p-1 bg-primary text-white rounded-full hover:bg-primary-hover"
                >
                  <Plus size={20} />
                </button>
              </div>

              <Input
                type="text"
                placeholder={t("please_add_items")}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowResults(true);
                }}
                onFocus={() => setShowResults(true)}
                className="w-full border-2 border-blue-400 dark:border-blue-900 rounded-xl px-12 py-3 text-sm outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/20 text-right bg-white dark:bg-slate-900 transition-all shadow-sm"
              />

              <AnimatePresence>
                {showResults && filteredProducts.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute z-50 w-full mt-1 bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-slate-800 rounded-xl shadow-xl max-h-60 overflow-y-auto"
                  >
                    {filteredProducts.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => handleSelectProduct(product)}
                        className="w-full text-right px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-800 flex items-center justify-between border-b border-gray-100 dark:border-slate-800 last:border-0 transition-colors"
                      >
                        <span className="text-primary font-bold">
                          {product.price} {t("sar")}
                        </span>
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-800 dark:text-white">
                            {product.name}
                          </p>
                          <p className="text-xs text-gray-500">{product.code}</p>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-bold text-gray-700">
              {t("items") || "الأصناف"}
            </h3>

            <div className="hidden md:block overflow-x-auto border border-gray-200 rounded-lg">
              <table className="w-full text-sm text-right border-collapse">
                <thead>
                  <tr className="bg-[var(--table-header)] text-white">
                    <th className="p-3 border border-primary-hover w-10 text-center">
                      {t("m")}
                    </th>
                    <th className="p-3 border border-primary-hover min-w-[200px]">
                      {t("product_code_name")}
                    </th>
                    <th className="p-3 border border-primary-hover">
                      {t("expiry_date") || "تاريخ انتهاء الصلاحية"}
                    </th>
                    <th className="p-3 border border-primary-hover">
                      {t("unit_cost") || "تكلفة الوحدة"}
                    </th>
                    <th className="p-3 border border-primary-hover">
                      {t("quantity")}
                    </th>
                    <th className="p-3 border border-primary-hover">
                      {t("free") || "المجاني"}
                    </th>
                    <th className="p-3 border border-primary-hover">
                      {t("total_no_tax")}
                    </th>
                    <th className="p-3 border border-primary-hover">
                      {t("vat_rate") || "نسبة الضريبة"}
                    </th>
                    <th className="p-3 border border-primary-hover">
                      {t("item_vat") || "ضريبة الصنف"}
                    </th>
                    <th className="p-3 border border-primary-hover">
                      {t("total_product_sr")}
                    </th>
                    <th className="p-3 border border-primary-hover">
                      {t("public_price") || "سعر الجمهور"}
                    </th>
                    <th className="p-3 border border-primary-hover w-10 text-center">
                      <Trash2 size={16} className="mx-auto" />
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="p-8 text-center text-gray-400 italic">
                        {t("no_products_added")}
                      </td>
                    </tr>
                  ) : (
                    items.map((item, index) => (
                      <tr
                        key={item.id}
                        className="bg-[var(--primary)]/5 hover:bg-[var(--primary)]/10 transition-colors"
                      >
                        <td className="p-3 border-l border-gray-100 text-center">
                          {index + 1}
                        </td>
                        <td className="p-3 border-l border-gray-100 font-medium">
                          {item.code} - {item.name}
                        </td>
                        <td className="p-3 border-l border-gray-100">
                          <Input
                            type="date"
                            className="w-full border-none bg-transparent outline-none text-right"
                            value={item.expiryDate}
                            onChange={(e) =>
                              updateItem(item.id, "expiryDate", e.target.value)
                            }
                          />
                        </td>
                        <td className="p-3 border-l border-gray-100">
                          <Input
                            type="number"
                            className="w-20 border-none bg-transparent outline-none text-center"
                            value={item.unitCost}
                            onChange={(e) =>
                              updateItem(item.id, "unitCost", e.target.value)
                            }
                          />
                        </td>
                        <td className="p-3 border-l border-gray-100">
                          <Input
                            type="number"
                            className="w-16 border-none bg-transparent outline-none text-center"
                            value={item.quantity}
                            onChange={(e) =>
                              updateItem(item.id, "quantity", e.target.value)
                            }
                          />
                        </td>
                        <td className="p-3 border-l border-gray-100">
                          <Input
                            type="number"
                            className="w-16 border-none bg-transparent outline-none text-center"
                            value={item.free}
                            onChange={(e) =>
                              updateItem(item.id, "free", e.target.value)
                            }
                          />
                        </td>
                        <td className="p-3 border-l border-gray-100 text-center">
                          {item.totalNoVat.toFixed(2)}
                        </td>
                        <td className="p-3 border-l border-gray-100 text-center">
                          {item.vatRate}%
                        </td>
                        <td className="p-3 border-l border-gray-100 text-center">
                          {item.vatAmount.toFixed(2)}
                        </td>
                        <td className="p-3 border-l border-gray-100 text-center font-bold">
                          {item.totalSr.toFixed(2)}
                        </td>
                        <td className="p-3 border-l border-gray-100">
                          <Input
                            type="number"
                            className="w-24 border-none bg-transparent outline-none text-center"
                            value={item.publicPrice}
                            onChange={(e) =>
                              updateItem(item.id, "publicPrice", e.target.value)
                            }
                          />
                        </td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="md:hidden space-y-4">
              {items.map((item) => (
                <MobileDataCard
                  key={item.id}
                  title={`${item.code} - ${item.name}`}
                  subtitle={
                    item.expiryDate
                      ? `${t("expiry_date")}: ${item.expiryDate}`
                      : t("no_expiry_date")
                  }
                  fields={[
                    {
                      label: t("unit_cost"),
                      value: (
                        <Input
                          type="number"
                          className="w-20 border-b border-gray-300 outline-none focus:border-primary text-center font-bold"
                          value={item.unitCost}
                          onChange={(e) =>
                            updateItem(item.id, "unitCost", e.target.value)
                          }
                        />
                      ),
                    },
                    {
                      label: t("quantity"),
                      value: (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              updateItem(item.id, "quantity", item.quantity + 1)
                            }
                            className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-lg border border-gray-200 text-primary font-bold"
                          >
                            +
                          </button>
                          <Input
                            type="number"
                            className="w-12 text-center border-b border-gray-300 outline-none focus:border-primary font-bold"
                            value={item.quantity}
                            onChange={(e) =>
                              updateItem(item.id, "quantity", e.target.value)
                            }
                          />
                          <button
                            type="button"
                            onClick={() =>
                              updateItem(
                                item.id,
                                "quantity",
                                Math.max(1, item.quantity - 1)
                              )
                            }
                            className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-lg border border-gray-200 text-primary font-bold"
                          >
                            -
                          </button>
                        </div>
                      ),
                    },
                    {
                      label: t("total_product_sr"),
                      value: item.totalSr.toFixed(2),
                      isBold: true,
                    },
                    {
                      label: t("public_price"),
                      value: (
                        <Input
                          type="number"
                          className="w-24 border-b border-gray-300 outline-none focus:border-primary text-center"
                          value={item.publicPrice}
                          onChange={(e) =>
                            updateItem(item.id, "publicPrice", e.target.value)
                          }
                        />
                      ),
                    },
                  ]}
                  actions={
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="p-2 text-[var(--primary)] hover:bg-[var(--primary)]/10 rounded-lg border border-[var(--primary)]/20 transition-colors flex items-center gap-1 text-xs font-bold"
                      >
                        <Trash2 size={16} />
                        {t("delete")}
                      </button>
                    </div>
                  }
                />
              ))}

              {items.length === 0 && (
                <div className="p-8 text-center text-gray-400 italic bg-gray-50 rounded-xl border border-dashed border-gray-300">
                  {t("no_products_added")}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-gray-100">
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  {t("discount_before_vat") || "خصم بالنسبة أو بالرقم (قبل الضريبة)"}
                </label>
                <Input
                  type="number"
                  value={formData.discountBeforeVat}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      discountBeforeVat: Number(e.target.value),
                    })
                  }

                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  {t("discount_after_vat") || "خصم بالنسبة أو بالرقم (بعد الضريبة)"}
                </label>
                <Input
                  type="number"
                  value={formData.discountAfterVat}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      discountAfterVat: Number(e.target.value),
                    })
                  }

                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  {t("paid_amount")}
                </label>
                <Input
                  type="number"
                  value={formData.amountPaid}
                  onChange={(e) =>
                    setFormData({ ...formData, amountPaid: Number(e.target.value) })
                  }

                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  {t("payment_type")}
                </label>
                <ComboboxField
                  value={formData.paymentType}
                  onValueChange={(val) =>
                    setFormData({ ...formData, paymentType: val })
                  }
                  placeholder={t("payment_type")}
                  items={[
                    { value: "credit", label: t("credit") },
                    { value: "cash", label: t("cash") },
                    { value: "bank", label: t("bank_transfer") },
                  ]}
                  valueKey="value"
                  labelKey="label"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  {t("payment_terms") || "شروط الدفع"}
                </label>
                <Input
                  type="text"
                  value={formData.paymentTerms}
                  onChange={(e) =>
                    setFormData({ ...formData, paymentTerms: e.target.value })
                  }

                />
              </div>

              <div className="rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50 p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="dark:text-slate-300">{t("total_no_tax") || "الإجمالي بدون ضريبة"}</span>
                  <span className="font-bold dark:text-white">{totalNoVat.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="dark:text-slate-300">{t("item_vat") || "إجمالي الضريبة"}</span>
                  <span className="font-bold dark:text-white">{totalVat.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="dark:text-slate-300">{t("discount_before_vat") || "خصم قبل الضريبة"}</span>
                  <span className="font-bold dark:text-white">{discountBeforeVatValue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="dark:text-slate-300">{t("discount_after_vat") || "خصم بعد الضريبة"}</span>
                  <span className="font-bold dark:text-white">{discountAfterVatValue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base border-t dark:border-gray-800 pt-2">
                  <span className="font-bold dark:text-white">
                    {t("total_product_sr") || "الإجمالي النهائي"}
                  </span>
                  <span className="font-extrabold text-[var(--primary)] dark:text-white">
                    {finalTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  {t("notes")}
                </label>
                <div className="border border-gray-300 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-transparent">
                  <div className="bg-gray-50 dark:bg-slate-900/80 border-b border-gray-300 dark:border-slate-800 p-2 flex flex-wrap gap-2">
                    <button type="button" className="p-1 hover:bg-gray-200 rounded">
                      <Bold size={14} />
                    </button>
                    <button type="button" className="p-1 hover:bg-gray-200 rounded">
                      <Italic size={14} />
                    </button>
                    <button type="button" className="p-1 hover:bg-gray-200 rounded">
                      <Underline size={14} />
                    </button>
                    <div className="w-px bg-gray-300 h-4 my-auto"></div>
                    <button type="button" className="p-1 hover:bg-gray-200 rounded">
                      <AlignLeft size={14} />
                    </button>
                    <button type="button" className="p-1 hover:bg-gray-200 rounded">
                      <AlignCenter size={14} />
                    </button>
                    <button type="button" className="p-1 hover:bg-gray-200 rounded">
                      <AlignRight size={14} />
                    </button>
                    <div className="w-px bg-gray-300 h-4 my-auto"></div>
                    <button type="button" className="p-1 hover:bg-gray-200 rounded">
                      <ListIcon size={14} />
                    </button>
                    <button type="button" className="p-1 hover:bg-gray-200 rounded">
                      <LinkIcon size={14} />
                    </button>
                    <button type="button" className="p-1 hover:bg-gray-200 rounded text-xs font-bold">
                      {"</>"}
                    </button>
                  </div>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full p-3 h-40 outline-none resize-none text-sm bg-transparent dark:text-slate-200"
                    placeholder={t("add_notes_here") || "أضف ملاحظاتك هنا..."}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6">
            <button
              type="submit"
              className="bg-primary text-white px-8 py-2.5 rounded-xl font-bold hover:bg-primary-hover transition-all shadow-md flex items-center gap-2"
            >
              <CheckCircle2 size={18} />
              {t("complete_operation")}
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="bg-[var(--primary)] text-white px-8 py-2.5 rounded-xl font-bold hover:bg-[var(--primary-hover)] transition-all shadow-md"
            >
              {t("reset_form")}
            </button>
          </div>
        </form>
      </div>

      <AddSupplierModal
        isOpen={showAddSupplierModal}
        onClose={() => setShowAddSupplierModal(false)}
      />
    </motion.div>
  );
}