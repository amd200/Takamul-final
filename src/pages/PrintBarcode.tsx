import { useState, useRef, useEffect } from "react";
import { Printer, Trash2, Plus, Minus, Palette, Type, Calendar, DollarSign, Barcode } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useProducts } from "../context/ProductsContext";

// 1. استيراد مدير الطباعة المركزي
import { usePrint } from "@/context/PrintContext";

import { Input } from "@/components/ui/input";

const FormatBox = ({ title, icon: Icon, colorClass, borderColorClass, direction }: any) => {
  const [fontSize, setFontSize] = useState(11);
  const [spacing, setSpacing] = useState(0);

  const handleFontSizeChange = (val: string) => {
    if (val === "") {
      setFontSize(0);
      return;
    }
    const num = parseInt(val);
    if (!isNaN(num)) setFontSize(num);
  };

  const handleSpacingChange = (val: string) => {
    if (val === "") {
      setSpacing(0);
      return;
    }
    const num = parseInt(val);
    if (!isNaN(num)) setSpacing(num);
  };

  return (
    <div className={`border ${borderColorClass} rounded-xl p-5 bg-white shadow-sm relative`} dir={direction}>
      <div className={`flex items-center gap-2 mb-6 ${colorClass} font-bold justify-end`} dir="rtl">
        <span>{title}</span>
        <Icon size={20} />
      </div>

      <div className="flex flex-row-reverse items-center justify-between gap-2 overflow-x-auto pb-2" dir="ltr">
        <div className="flex flex-col items-center gap-2">
          <label className="text-xs text-gray-500 font-bold whitespace-nowrap">حجم الخط</label>
          <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden h-[40px] bg-white">
            <button onClick={() => setFontSize((prev) => prev + 1)} className="w-8 h-full flex items-center justify-center hover:bg-gray-100 border-r border-gray-300 text-gray-600 transition-colors cursor-pointer">
              <Plus size={14} />
            </button>
            <Input type="text" value={fontSize} onChange={(e) => handleFontSizeChange(e.target.value)} className="w-10 h-full text-center text-sm font-bold outline-none !border-none !rounded-none !p-0 !m-0 !bg-transparent" style={{ minHeight: "unset", height: "100%" }} />
            <button onClick={() => setFontSize((prev) => Math.max(1, prev - 1))} className="w-8 h-full flex items-center justify-center hover:bg-gray-100 border-l border-gray-300 text-gray-600 transition-colors cursor-pointer">
              <Minus size={14} />
            </button>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <label className="text-xs text-gray-500 font-bold whitespace-nowrap">التباعد</label>
          <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden h-[40px] bg-white">
            <button onClick={() => setSpacing((prev) => prev + 1)} className="w-8 h-full flex items-center justify-center hover:bg-gray-100 border-r border-gray-300 text-gray-600 transition-colors cursor-pointer">
              <Plus size={14} />
            </button>
            <Input type="text" value={spacing} onChange={(e) => handleSpacingChange(e.target.value)} className="w-10 h-full text-center text-sm font-bold outline-none !border-none !rounded-none !p-0 !m-0 !bg-transparent" style={{ minHeight: "unset", height: "100%" }} />
            <button onClick={() => setSpacing((prev) => Math.max(0, prev - 1))} className="w-8 h-full flex items-center justify-center hover:bg-gray-100 border-l border-gray-300 text-gray-600 transition-colors cursor-pointer">
              <Minus size={14} />
            </button>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <label className="text-xs text-gray-500 font-bold whitespace-nowrap">لون الخط</label>
          <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 h-[40px] bg-white min-w-[100px] justify-center">
            <div className="w-4 h-4 bg-black border border-gray-200 rounded-sm"></div>
            <span className="text-xs font-mono text-gray-700">#000000</span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <label className="text-xs text-gray-500 font-bold whitespace-nowrap">لون الخلفية</label>
          <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 h-[40px] bg-white min-w-[100px] justify-center">
            <div className="w-4 h-4 bg-white border border-gray-300 rounded-sm"></div>
            <span className="text-[11px] font-mono text-gray-400">#ffffff</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const BarcodeRow = ({ item, onRemove, onUpdateQty }: any) => {
  const handleQtyChange = (val: string) => {
    if (val === "") {
      onUpdateQty(0);
      return;
    }
    const num = parseInt(val);
    if (!isNaN(num)) onUpdateQty(num);
  };
  return (
    <tr className="border-b border-gray-200 bg-gray-50/30 hover:bg-gray-100/50 transition-colors">
      <td className="p-3 border border-gray-200 text-center">
        <button onClick={onRemove} className="text-red-500 hover:text-red-700">
          <Trash2 size={16} className="mx-auto" />
        </button>
      </td>
      <td className="p-3 border border-gray-200 text-center">{item.supplier || "مؤسسة تكامل"}</td>
      <td className="p-3 border border-gray-200 text-center">-</td>
      <td className="p-3 border border-gray-200 text-center">-</td>
      <td className="p-3 border border-gray-200">
        <div className="flex items-center justify-center border border-gray-300 rounded-lg overflow-hidden h-[40px] w-32 mx-auto bg-white">
          <button onClick={() => onUpdateQty(Math.max(0, item.qty - 1))} className="w-10 h-full flex items-center justify-center hover:bg-gray-100 text-gray-600 border-l border-gray-300">
            <Minus size={14} />
          </button>
          <Input type="text" value={item.qty} onChange={(e) => handleQtyChange(e.target.value)} className="flex-1 h-full text-center text-sm font-bold outline-none !border-none !rounded-none !p-0 !m-0 !bg-transparent" style={{ minHeight: "unset" }} />
          <button onClick={() => onUpdateQty(item.qty + 1)} className="w-10 h-full flex items-center justify-center hover:bg-gray-100 text-gray-600 border-r border-gray-300">
            <Plus size={14} />
          </button>
        </div>
      </td>
      <td className="p-3 border border-gray-200 font-bold">
        {item.code} - {item.name}
      </td>
    </tr>
  );
};

export default function PrintBarcode() {
  const { t, direction } = useLanguage();
  const { products } = useProducts();

  // 2. استدعاء دالة الطباعة السحرية
  const { printInvoice } = usePrint();

  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  // الداتا المبدئية في الجدول
  const [selectedItems, setSelectedItems] = useState<any[]>([{ id: "1", name: "عبايه كريب مع اكمام مموجه", code: "60990980", qty: 1, price: 250 }]);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredProducts = products.filter((p) => p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || p.code?.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleSelectProduct = (product: any) => {
    const existingItem = selectedItems.find((item) => item.id === product.id);
    if (existingItem) {
      setSelectedItems(selectedItems.map((item) => (item.id === product.id ? { ...item, qty: item.qty + 1 } : item)));
    } else {
      setSelectedItems([...selectedItems, { ...product, qty: 1 }]);
    }
    setSearchTerm("");
    setShowDropdown(false);
  };

  const handleRemoveItem = (id: string) => setSelectedItems(selectedItems.filter((item) => item.id !== id));
  const handleUpdateQty = (id: string, qty: number) => setSelectedItems(selectedItems.map((item) => (item.id === id ? { ...item, qty } : item)));

  const handleReset = () => {
    setSelectedItems([]);
    setSearchTerm("");
  };

  // ==========================================
  // 3. الدالة التي تجهز البيانات وتطبع الفاتورة الديناميكية
  // ==========================================
  const handlePrintDynamicReceipt = () => {
    if (selectedItems.length === 0) {
      alert("الرجاء إضافة أصناف أولاً للطباعة");
      return;
    }

    // حساب الإجمالي بناءً على الأصناف المختارة
    const totalAmount = selectedItems.reduce((acc, item) => acc + parseFloat(item.price || 0) * item.qty, 0);

    // تجهيز شكل البيانات اللي الفاتورة الحرارية بتفهمه
    const dynamicInvoiceData = {
      companyName: "مؤسسة تكامل",
      invoiceNo: "PRT-" + Math.floor(Math.random() * 100000),
      date: new Date().toLocaleString("en-GB"),
      customer: "طباعة أصناف",
      grandTotal: totalAmount,
      paid: totalAmount,
      remaining: 0,
      paymentType: "cash",
      items: selectedItems.map((item) => ({
        name: item.name,
        qty: item.qty,
        price: item.price || 0,
        total: parseFloat(item.price || 0) * item.qty,
      })),
    };

    // إرسال البيانات للمدير المركزي عشان يخفي الموقع ويطبع الفاتورة بس
    printInvoice(dynamicInvoiceData);
  };

  return (
    <div className="space-y-4" dir={direction}>
      <div className="takamol-page-header">
        <div className={direction === "rtl" ? "text-right" : "text-left"}>
          <h1 className="takamol-page-title">{t("print_barcode_labels_title") || "طباعة باركود - الملصقات"}</h1>
          <p className="takamol-page-subtitle">{t("print_barcode_desc") || "يمكنك زيارة التصنيفات الأساسية، التصنيفات الفرعية، مشتريات وتحويل المخزون لإضافة الأصناف لقائمة الطباعة"}</p>
        </div>
        {/* تم ربط هذا الزر بدالة الطباعة الديناميكية */}
        <button onClick={handlePrintDynamicReceipt} className="btn-secondary hidden md:flex">
          <Printer size={20} />
          <span>{t("print") || "طباعة"}</span>
        </button>
      </div>

      <div className="bg-white rounded-b-xl shadow-sm border border-gray-200 p-4 md:p-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
          <div className="mb-4 relative" ref={searchRef}>
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 gap-2">
              <Barcode size={24} className="text-gray-400" />
            </div>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <button type="button" className="p-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)]">
                <Plus size={18} />
              </button>
            </div>
            <Input
              type="text"
              placeholder={t("please_add_items") || "الرجاء إضافة الأصناف"}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
            />
            {showDropdown && searchTerm && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <div key={product.id} onClick={() => handleSelectProduct(product)} className="px-4 py-3 hover:bg-gray-50 cursor-pointer text-right border-b border-gray-100 last:border-0">
                      <div className="font-bold text-gray-800">{product.name}</div>
                      <div className="text-xs text-gray-500">{product.code}</div>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-3 text-sm text-gray-500 text-center">لا توجد نتائج</div>
                )}
              </div>
            )}
          </div>

          {/* عرض الموبايل (كروت) */}
          <div className="md:hidden space-y-3">{selectedItems.length === 0 && <div className="text-center p-6 text-gray-500 font-bold bg-gray-50 rounded-xl border border-dashed border-gray-300">لم يتم اختيار أي أصناف</div>}</div>

          {/* عرض الكمبيوتر (الجدول الموحد) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="takamol-table">
              <thead>
                <tr>
                  <th className="w-10">
                    <Trash2 size={16} className="mx-auto" />
                  </th>
                  <th>{t("activity_name") || "اسم النشاط"}</th>
                  <th>{t("expiry") || "انتهاء"}</th>
                  <th>{t("production") || "انتاج"}</th>
                  <th>{t("quantity") || "كمية"}</th>
                  <th>{t("product_name_code") || "اسم الصنف (كود الصنف)"}</th>
                </tr>
              </thead>
              <tbody>
                {selectedItems.map((item) => (
                  <BarcodeRow key={item.id} item={item} onRemove={() => handleRemoveItem(item.id)} onUpdateQty={(qty: any) => handleUpdateQty(item.id, qty)} />
                ))}
                {selectedItems.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      لم يتم اختيار أي أصناف
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-gray-50/50 p-5 rounded-xl border border-gray-200 mb-8">
          <div className="mb-5">
            <label className="block text-sm font-bold text-gray-700 mb-2">طريقة الطباعة **</label>
            <select>
              <option>طباعة مستمرة (طابعة باركود)</option>
              <option>ورق A4</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">العرض</label>
              <Input type="text" defaultValue="50" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">الارتفاع</label>
              <div className="flex">
                <Input type="text" defaultValue="25" />
                <span className="bg-gray-100 border border-gray-300 border-r-0 px-4 py-2.5 rounded-l-lg text-sm text-gray-600 font-bold whitespace-nowrap">مللي</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 whitespace-nowrap">ارتفاع أعمدة الباركود</label>
              <div className="flex">
                <Input type="text" defaultValue="28" />
                <span className="bg-gray-100 border border-gray-300 border-r-0 px-4 py-2.5 rounded-l-lg text-sm text-gray-600 font-bold whitespace-nowrap">مللي</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 whitespace-nowrap">اتجاه أعمدة الباركود</label>
              <div className="flex">
                <select>
                  <option>عمودي</option>
                  <option>أفقي</option>
                </select>
                <span className="bg-gray-100 border border-gray-300 border-r-0 px-4 py-2.5 rounded-l-lg text-sm text-gray-600 font-bold whitespace-nowrap">px</span>
              </div>
            </div>
            <div className="flex items-center justify-start md:justify-center pt-2 md:pt-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <Input type="checkbox" className="w-5 h-5 rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]" />
                <span className="text-sm font-bold text-gray-700">فحص سعر الترويج</span>
              </label>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-4 pt-4 border-t border-gray-200">
            <span className="font-bold text-gray-800 text-sm">طباعة:</span>
            {[
              { id: "printCompany", label: "اسم الشركة", defaultChecked: true },
              { id: "printProduct", label: "اسم الصنف *", defaultChecked: true },
              { id: "printPrice", label: "سعر البيع", defaultChecked: true },
              { id: "printCurrency", label: "العملات", defaultChecked: true },
              { id: "printTax", label: "شامل ضريبة", defaultChecked: true },
              { id: "printProdDate", label: "انتاج", defaultChecked: true },
              { id: "printExpDate", label: "انتهاء", defaultChecked: true },
            ].map((cb) => (
              <label key={cb.id} className="flex items-center gap-2 cursor-pointer">
                <Input type="checkbox" defaultChecked={cb.defaultChecked} className="w-4 h-4 rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]" />
                <span className="text-sm font-bold text-gray-700">{cb.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-[var(--primary)] rounded-full inline-block"></span>
            تنسيق الخطوط
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FormatBox title={t("format_product_name") || "تنسيق اسم الصنف"} icon={Palette} colorClass="text-green-600" borderColorClass="border-green-500" />
            <FormatBox title={t("format_activity_name") || "تنسيق اسم النشاط"} icon={Type} colorClass="text-blue-600" borderColorClass="border-blue-500" />
            <FormatBox title={t("format_dates") || "تنسيق تاريخ الانتاج والانتهاء"} icon={Calendar} colorClass="text-purple-600" borderColorClass="border-purple-500" />
            <FormatBox title={t("format_price") || "تنسيق السعر"} icon={DollarSign} colorClass="text-emerald-600" borderColorClass="border-emerald-500" />
          </div>

          <div className="flex justify-start gap-3 pt-6 flex-row-reverse border-t border-gray-100 mt-6">
            {/* تم ربط هذا الزر بدالة الطباعة الديناميكية أيضاً */}
            <button onClick={handlePrintDynamicReceipt} className="bg-[#8b0000] text-white px-10 py-2.5 rounded-lg font-bold hover:bg-red-900 transition-all shadow-sm">
              تحديث (وطباعة)
            </button>
            <button onClick={handleReset} className="bg-[var(--primary)] text-white px-10 py-2.5 rounded-lg font-bold hover:bg-[var(--primary-hover)] transition-all shadow-sm">
              reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
