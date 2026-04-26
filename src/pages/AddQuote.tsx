import React, { useState, useRef, useEffect } from "react";
import {
  PlusCircle,
  X,
  Barcode,
  Upload,
  Trash2,
  RefreshCcw,
  Eye,
  Edit2,
  Plus,
  UserPlus,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useProducts, type Product } from "@/context/ProductsContext";
import { useQuotes } from "@/context/QuotesContext";
import { useSettings } from "@/context/SettingsContext";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import { Input } from "@/components/ui/input";

export default function AddQuote() {
  const { t, direction } = useLanguage();
  const { products: allProducts } = useProducts();
  const { addQuote } = useQuotes();
  const { systemSettings } = useSettings();
  const navigate = useNavigate();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const [date, setDate] = useState("14:17:00 23/02/2026");
  const [refNo, setRefNo] = useState(
    `${systemSettings?.prefixes?.quotes || "QUO-"}${Math.floor(
      Math.random() * 1000000
    ).toString()}`
  );
  const [cashier, setCashier] = useState(t("test_company") || "شركة اختبار");
  const [discount, setDiscount] = useState("");
  const [shipping, setShipping] = useState("");
  const [status, setStatus] = useState("pending");
  const [branch, setBranch] = useState(t("takamul_company") || "شركة تكامل");
  const [customer, setCustomer] = useState("");
  const [note, setNote] = useState("");
  const [isCustomerDisabled, setIsCustomerDisabled] = useState(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [fileName, setFileName] = useState("");

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
      : allProducts.filter(
        (p) =>
          String(p.name || "")
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          String(p.code || "")
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
      );

  const handleSelectProduct = (product: Product) => {
    const existingProductIndex = products.findIndex((p) => p.id === product.id);

    if (existingProductIndex !== -1) {
      const updatedProducts = [...products];
      updatedProducts[existingProductIndex].quantity += 1;
      updatedProducts[existingProductIndex].total = (
        updatedProducts[existingProductIndex].quantity *
        Number(updatedProducts[existingProductIndex].priceWithVat)
      ).toFixed(2);
      setProducts(updatedProducts);
    } else {
      const price = parseFloat(String(product.price || 0)) || 0;
      const priceNoVat = (price / 1.15).toFixed(2);

      const newItem = {
        id: product.id,
        name: product.name,
        code: product.code,
        priceNoVat,
        priceWithVat: price.toFixed(2),
        quantity: 1,
        total: price.toFixed(2),
      };

      setProducts([...products, newItem]);
    }

    setSearchQuery("");
    setShowResults(false);
  };

  const handleDeleteProduct = (index: number) => {
    setProducts(products.filter((_, i) => i !== index));
  };

  const handleUpdateQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return;

    const updatedProducts = [...products];
    updatedProducts[index].quantity = newQuantity;
    updatedProducts[index].total = (
      newQuantity * Number(updatedProducts[index].priceWithVat)
    ).toFixed(2);
    setProducts(updatedProducts);
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleReset = () => {
    navigate("/quotes");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const total = products.reduce(
      (sum, p) => sum + parseFloat(String(p.total || 0)),
      0
    );

    const newQuote = {
      date,
      refNo,
      cashier,
      customer: customer || t("general_person"),
      total,
      status: status as "pending" | "completed",
      products,
      note,
      discount,
      shipping,
      branch,
    };

    addQuote(newQuote);
    navigate("/quotes");
  };

  return (
    <div className="space-y-4" dir={direction}>
      <div className="text-sm text-gray-500 flex items-center gap-1 px-2">
        <span>{t("home")}</span>
        <span>/</span>
        <span>{t("quotes")}</span>
        <span>/</span>
        <span className="text-gray-800 font-medium">{t("add_quote")}</span>
      </div>

      <div className="bg-white p-4 rounded-t-xl border-b border-gray-200 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <PlusCircle size={20} className="text-primary" />
          <h1 className="text-lg font-bold text-primary">{t("add_quote")}</h1>
        </div>
        <button
          onClick={() => navigate("/quotes")}
          className="text-gray-400 hover:text-gray-600"
        >
          <X size={24} />
        </button>
      </div>

      <div className="bg-white rounded-b-xl shadow-sm border border-gray-200 p-8">
        <p className="text-sm text-primary mb-8 text-right font-medium">
          {t("add_product_desc")}
        </p>

        <form className="space-y-8" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2 text-right">
              <label className="text-sm font-bold text-primary">{t("date")} *</label>
              <Input
                type="text"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-primary text-right"
              />
            </div>

            <div className="space-y-2 text-right">
              <label className="text-sm font-bold text-primary">{t("ref_no")}</label>
              <Input
                type="text"
                value={refNo}
                onChange={(e) => setRefNo(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-primary text-right"
              />
            </div>

            <div className="space-y-2 text-right">
              <label className="text-sm font-bold text-primary">
                {t("cashier")} *
              </label>
              <select
                value={cashier}
                onChange={(e) => setCashier(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-green-600 bg-white text-right"
              >
                <option value={t("test_company") || "شركة اختبار"}>
                  {t("test_company") || "شركة اختبار"}
                </option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2 text-right">
              <label className="text-sm font-bold text-primary">{t("discount")}</label>
              <Input
                type="text"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-primary text-right"
              />
            </div>

            <div className="space-y-2 text-right">
              <label className="text-sm font-bold text-primary">{t("shipping")}</label>
              <Input
                type="text"
                value={shipping}
                onChange={(e) => setShipping(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-primary text-right"
              />
            </div>

            <div className="space-y-2 text-right">
              <label className="text-sm font-bold text-primary">{t("status")}</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-primary bg-white text-right"
              >
                <option value="pending">{t("pending")}</option>
                <option value="completed">{t("completed")}</option>
              </select>
            </div>
          </div>

          <div className="space-y-2 text-right">
            <label className="text-sm font-bold text-primary">
              {t("attach_documents")}
            </label>
            <div className="flex gap-2">
              <Input
                type="text"
                value={fileName}
                className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-primary text-right"
                readOnly
              />
              <Input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={(e) => setFileName(e.target.files?.[0]?.name || "")}
              />
              <button
                type="button"
                onClick={handleBrowseClick}
                className="bg-primary text-white px-6 py-2 rounded text-sm hover:bg-primary-hover flex items-center gap-2"
              >
                <Upload size={16} />
                {t("browse")}
              </button>
            </div>
          </div>

          <div className="bg-[#fff9e6] p-6 rounded-lg border border-[#ffeeba] space-y-4">
            <p className="text-sm text-[#856404] font-medium text-right">
              {t("update_options_before_adding")}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2 text-right">
                <label className="text-sm font-bold text-primary">{t("branch")} *</label>
                <select
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-primary bg-white text-right"
                >
                  <option value={t("takamul_company") || "شركة تكامل"}>
                    {t("takamul_company") || "شركة تكامل"}
                  </option>
                </select>
              </div>

              <div className="space-y-2 text-right">
                <label className="text-sm font-bold text-primary">
                  {t("customer")} *
                </label>
                <div className="flex gap-1">
                  <select
                    value={customer}
                    onChange={(e) => setCustomer(e.target.value)}
                    disabled={isCustomerDisabled}
                    className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-primary bg-white text-right disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">{t("select_customer")}</option>
                    <option value="1">{t("general_person")}</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => setShowAddCustomerModal(true)}
                    className="p-2 text-[var(--primary)] hover:bg-[var(--primary)]/10 rounded border border-gray-200"
                  >
                    <Plus size={18} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsCustomerDisabled(true)}
                    className="p-2 text-[var(--primary)] hover:bg-[var(--primary)]/10 rounded border border-gray-200"
                  >
                    <Eye size={18} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsCustomerDisabled(false)}
                    className="p-2 text-[var(--primary)] hover:bg-[var(--primary)]/10 rounded border border-gray-200"
                  >
                    <Edit2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>

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
              className="w-full border-2 border-blue-400 rounded-lg px-12 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-100 text-right"
            />

            <AnimatePresence>
              {showResults && filteredProducts.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto"
                >
                  {filteredProducts.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => handleSelectProduct(product)}
                      className="w-full text-right px-4 py-3 hover:bg-gray-50 flex items-center justify-between border-b border-gray-100 last:border-0 transition-colors"
                    >
                      <span className="text-primary font-bold">
                        {product.price} {t("sar") || "ر.س"}
                      </span>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-800">
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

          <div className="space-y-2">
            <label className="text-sm font-bold text-primary text-right block">
              {t("products")} *
            </label>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm text-right border-collapse">
                <thead>
                  <tr className="bg-[var(--table-header)] text-white">
                    <th className="p-3 border border-primary-hover w-10 text-center">
                      <Trash2 size={16} className="mx-auto" />
                    </th>
                    <th className="p-3 border border-primary-hover">
                      {t("product_name_code")}
                    </th>
                    <th className="p-3 border border-primary-hover">
                      {t("unit_price_no_vat")}
                    </th>
                    <th className="p-3 border border-primary-hover">
                      {t("unit_price_with_vat")}
                    </th>
                    <th className="p-3 border border-primary-hover">
                      {t("quantity")}
                    </th>
                    <th className="p-3 border border-primary-hover">
                      {t("product_total")} (SR)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {products.length > 0 ? (
                    products.map((product, index) => (
                      <tr
                        key={index}
                        className="bg-[var(--primary)]/5 hover:bg-[var(--primary)]/10 transition-colors"
                      >
                        <td className="p-3 border border-gray-200 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(index)}
                            className="text-[var(--primary)] hover:text-[var(--primary-hover)]"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                        <td className="p-3 border border-gray-200">
                          {product.name} ({product.code})
                        </td>
                        <td className="p-3 border border-gray-200">
                          {product.priceNoVat}
                        </td>
                        <td className="p-3 border border-gray-200">
                          {product.priceWithVat}
                        </td>
                        <td className="p-3 border border-gray-200">
                          <Input
                            type="number"
                            min="1"
                            value={product.quantity}
                            onChange={(e) =>
                              handleUpdateQuantity(index, parseInt(e.target.value) || 1)
                            }
                            className="w-16 border border-gray-300 rounded px-2 py-1 text-center outline-none focus:border-primary"
                          />
                        </td>
                        <td className="p-3 border border-gray-200">{product.total}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={6}
                        className="p-8 text-center text-gray-400 italic bg-gray-50 border border-gray-200"
                      >
                        {t("no_products_added")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="md:hidden space-y-4">
              {products.map((product, index) => (
                <MobileDataCard
                  key={index}
                  title={product.name}
                  subtitle={product.code}
                  fields={[
                    { label: t("unit_price_with_vat"), value: product.priceWithVat },
                    {
                      label: t("quantity"),
                      value: (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(index, product.quantity + 1)}
                            className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-lg border border-gray-200 text-primary font-bold"
                          >
                            +
                          </button>
                          <Input
                            type="number"
                            min="1"
                            value={product.quantity}
                            onChange={(e) =>
                              handleUpdateQuantity(index, parseInt(e.target.value) || 1)
                            }
                            className="w-12 text-center border-b border-gray-300 outline-none focus:border-primary font-bold"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateQuantity(index, Math.max(1, product.quantity - 1))
                            }
                            className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-lg border border-gray-200 text-primary font-bold"
                          >
                            -
                          </button>
                        </div>
                      ),
                    },
                    { label: t("product_total"), value: product.total, isBold: true },
                  ]}
                  actions={
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleDeleteProduct(index)}
                        className="p-2 text-[var(--primary)] hover:bg-[var(--primary)]/10 rounded-lg border border-[var(--primary)]/20 transition-colors flex items-center gap-1 text-xs font-bold"
                      >
                        <Trash2 size={16} />
                        {t("delete")}
                      </button>
                    </div>
                  }
                />
              ))}

              {products.length === 0 && (
                <div className="p-8 text-center text-gray-400 italic bg-gray-50 rounded-xl border border-dashed border-gray-300">
                  {t("no_products_added")}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2 text-right">
            <label className="text-sm font-bold text-primary">{t("note")}</label>
            <div className="border border-gray-300 rounded-lg overflow-hidden">
              <div className="bg-gray-50 p-2 border-b border-gray-200 flex items-center gap-2 flex-wrap">
                <button type="button" className="p-1 hover:bg-gray-200 rounded text-xs font-bold">
                  B
                </button>
                <button type="button" className="p-1 hover:bg-gray-200 rounded text-xs italic">
                  I
                </button>
                <button type="button" className="p-1 hover:bg-gray-200 rounded text-xs underline">
                  U
                </button>
                <div className="w-px h-4 bg-gray-300 mx-1" />
                <button type="button" className="p-1 hover:bg-gray-200 rounded text-xs">
                  List
                </button>
              </div>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full p-4 h-32 outline-none text-right text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-8">
            <button
              type="button"
              onClick={handleReset}
              className="bg-[var(--primary)] text-white px-8 py-2 rounded-lg font-bold hover:bg-[var(--primary-hover)] transition-colors flex items-center gap-2"
            >
              <RefreshCcw size={18} />
              {t("reset")}
            </button>

            <button
              type="submit"
              className="bg-[var(--primary)] brightness-75 text-white px-8 py-2 rounded-lg font-bold hover:brightness-50 transition-colors"
            >
              {t("complete_process")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}