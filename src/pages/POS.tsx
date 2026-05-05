// src/pages/POS.tsx
import { useState, useMemo, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useSettings } from '../context/SettingsContext';
import { useWarehouses } from '../context/WarehousesContext';
import { cn } from '../lib/utils';
import { useProducts, type Product } from '../context/ProductsContext';
import ComboboxField from '@/components/ui/ComboboxField';
import { Input } from "@/components/ui/input";

import {
  Plus,
  Eye,
  Pencil,
  Trash2,
  X,
  Printer,
  Search,
  Clock,
  Calendar,
  Building,
  User,
  ShoppingCart,
  Layers,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
  CreditCard,
  Save,
  Lock,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import ShiftReportModal from '@/components/pos/modals/ShiftReportModal';
import { useCloseShift } from '@/features/shifts/hooks/useShifts';

interface CartItem extends Product {
  cartQuantity: number;
}

type ProductId = Product['id'];

export default function POS() {
  const { direction, t } = useLanguage();
  const { products, loading: productsLoading } = useProducts();
  const { posSettings, systemSettings } = useSettings();
  const { warehouses } = useWarehouses();

  const searchRef = useRef<HTMLDivElement>(null);
  const searchRefBlue = useRef<HTMLDivElement>(null);

  const selectedBranchId = warehouses[0]?.id ?? '';
  const selectedBranch = warehouses.find((w) => w.id === selectedBranchId);

  const isBlueScreen =
    Boolean(selectedBranch?.showScreen2) && !selectedBranch?.showTouchScreen;

  const [isCartCollapsed, setIsCartCollapsed] = useState(false);

  const [currentTime, setCurrentTime] = useState(new Date());
  const { shiftId } = useAuthStore();
  const [isShiftReportOpen, setIsShiftReportOpen] = useState(false);
  const { mutate: closeShiftMutate } = useCloseShift();

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const [showCustomerDetailsModal, setShowCustomerDetailsModal] = useState(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [showEditCustomerModal, setShowEditCustomerModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showSubProductsModal, setShowSubProductsModal] = useState(false);
  const [currentParentProduct, setCurrentParentProduct] = useState<Product | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [invoiceDiscount, setInvoiceDiscount] = useState(0);
  const isCustomerSelectDisabled = true;

  const [customer, setCustomer] = useState({
    company: 'شخص عام',
    name: 'عميل نقدي',
    group: t("general"),
    phone: '0000000000',
    address: '',
    taxId: '',
    email: '',
    commercialRecord: '',
    openingBalance: '0',
    creditLimit: '0',
    stopSelling: false,
    taxStatus: 'unregistered',
    pricingGroup: t("general"),
  });

  const [editCustomerData, setEditCustomerData] = useState({ ...customer });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node | null;

      if (searchRef.current && target && !searchRef.current.contains(target)) {
        setShowSearchDropdown(false);
      }

      if (searchRefBlue.current && target && !searchRefBlue.current.contains(target)) {
        setShowSearchDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const directProducts = useMemo<Product[]>(
    () =>
      products?.filter((p: Product) => p.productNature === 'basic' || !p.productNature) ?? [],
    [products]
  );

  const subProducts = useMemo<Product[]>(
    () => products?.filter((p: Product) => p.productNature === 'sub') ?? [],
    [products]
  );

  const visibleProducts = useMemo<Product[]>(() => {
    if (!selectedCategory) return directProducts;
    return directProducts.filter((p) => p.category === selectedCategory);
  }, [directProducts, selectedCategory]);

  const categories = useMemo<string[]>(() => {
    const cats = directProducts
      .map((p) => p.category)
      .filter((cat): cat is string => typeof cat === 'string' && cat.trim().length > 0);

    return Array.from(new Set(cats));
  }, [directProducts]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);

    if (query.trim() === '') {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    setShowSearchDropdown(true);

    const { codeStart, codeLength, flagCharacters } = systemSettings.barcode || {};
    const startIndex = Number(codeStart ?? 0);
    const idLength = Number(codeLength ?? 0);
    const prefix = String(flagCharacters ?? '');

    if (
      query.length >= startIndex + idLength &&
      idLength > 0 &&
      query.startsWith(prefix)
    ) {
      const productCode = query.substring(startIndex, startIndex + idLength);
      const product = products?.find((p) => String(p.code ?? '') === productCode);

      if (product) {
        handleAddProduct(product);
        setSearchQuery('');
        setSearchResults([]);
        setShowSearchDropdown(false);
        return;
      }
    }

    const lowerQuery = query.toLowerCase();
    const results = directProducts.filter((p) => {
      const name = String(p.name ?? '').toLowerCase();
      const code = String(p.code ?? '').toLowerCase();
      return name.includes(lowerQuery) || code.includes(lowerQuery);
    });

    setSearchResults(results);
  };

  const handleAddProduct = (product: Product) => {
    if (!posSettings.config?.allowNegativeStock) {
      const currentQty = parseFloat(String(product.quantity ?? 0)) || 0;
      const inCart = cart.find((item) => item.id === product.id)?.cartQuantity || 0;

      if (currentQty > 0 && currentQty <= inCart) {
        window.alert('نفذت الكمية');
        return;
      }
    }

    const linkedSubs = subProducts.filter(
      (sub) => sub.parentProductId === product.id || sub.parentProductName === product.name
    );

    if (linkedSubs.length > 0) {
      setCurrentParentProduct(product);
      setShowSubProductsModal(true);
      return;
    }

    addToCart(product);
  };

  const addToCart = (product: Product, qty = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);

      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, cartQuantity: item.cartQuantity + qty }
            : item
        );
      }

      return [...prev, { ...product, cartQuantity: qty }];
    });

    setSearchQuery('');
    setSearchResults([]);
    setShowSearchDropdown(false);
  };

  const handleSelectSubProduct = (subProduct: Product) => {
    addToCart(subProduct);
    setShowSubProductsModal(false);
    setCurrentParentProduct(null);
  };

  const handleAddParentOnly = () => {
    if (currentParentProduct) {
      addToCart(currentParentProduct);
    }
    setShowSubProductsModal(false);
    setCurrentParentProduct(null);
  };

  const removeFromCart = (id: ProductId) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: ProductId, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newQty = Math.max(1, item.cartQuantity + delta);
          return { ...item, cartQuantity: newQty };
        }
        return item;
      })
    );
  };

  const totalInvoice = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => {
      const price = parseFloat(String(item.price ?? 0).replace(/[^0-9.]/g, '')) || 0;
      return sum + price * item.cartQuantity;
    }, 0);

    let total = subtotal;

    if (posSettings.config?.enableTax) {
      total = subtotal * 1.15;
    }

    if (posSettings.config?.enableDiscount) {
      total -= invoiceDiscount;
    }

    return Math.max(0, total);
  }, [cart, posSettings.config, invoiceDiscount]);

  const handleEditCustomerSave = () => {
    setCustomer(editCustomerData);
    setShowEditCustomerModal(false);
  };

  const renderTouchScreen = () => (
    <main className="flex-1 flex overflow-hidden relative">
      <section className="flex-1 flex flex-col min-w-0 bg-white transition-all duration-300">
        <div className="flex-none bg-white px-4 pt-3 pb-0 flex gap-2 overflow-x-auto border-b border-gray-200 z-20">
          <button
            onClick={() => setSelectedCategory(null)}
            className={cn(
              'flex flex-col items-center justify-center py-2.5 px-4 min-w-[100px] rounded-t-xl transition-all border-b-4',
              !selectedCategory
                ? 'bg-[#0c4a3b] text-white border-[#083d2f]'
                : 'bg-[#106b56] text-white/90 border-transparent hover:bg-[#0c4a3b]'
            )}
          >
            <span className="font-bold text-sm">الكل</span>
          </button>

          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                'flex flex-col items-center justify-center py-2.5 px-4 min-w-[100px] rounded-t-xl transition-all border-b-4',
                selectedCategory === cat
                  ? 'bg-[#0c4a3b] text-white border-[#083d2f]'
                  : 'bg-[#106b56] text-white/90 border-transparent hover:bg-[#0c4a3b]'
              )}
            >
              <span className="font-bold text-sm truncate max-w-full">{cat}</span>
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-[#f8f9fa]">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 h-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-800 flex items-center gap-2">
                <ShoppingCart size={20} className="text-[#0c4a3b]" />
                الأصناف المتاحة
                <span className="text-sm text-gray-500 font-normal">
                  ({visibleProducts.length} صنف)
                </span>
              </h2>

              <button
                onClick={() => setIsCartCollapsed(!isCartCollapsed)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all',
                  isCartCollapsed
                    ? 'bg-[#0c4a3b] text-white hover:bg-[#0a3d32]'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
              >
                {isCartCollapsed ? (
                  <>
                    <PanelLeftOpen size={16} /> فتح السلة
                  </>
                ) : (
                  <>
                    <PanelLeftClose size={16} /> طي السلة
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-3">
              {visibleProducts.map((product) => {
                const price =
                  parseFloat(String(product.price ?? 0).replace(/[^0-9.]/g, '')) || 0;

                const hasSubs = subProducts.some(
                  (sub) => sub.parentProductId === product.id || sub.parentProductName === product.name
                );

                return (
                  <button
                    key={String(product.id)}
                    onClick={() => handleAddProduct(product)}
                    className={cn(
                      'relative bg-white border-2 border-gray-200 rounded-xl p-3 flex flex-col items-center gap-2 h-40 hover:border-[#0c4a3b] hover:shadow-lg transition-all cursor-pointer',
                      hasSubs && 'border-orange-300 hover:border-orange-500 ring-2 ring-orange-100'
                    )}
                  >
                    {hasSubs && (
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md z-10 whitespace-nowrap">
                        <ChevronDown size={10} /> له خيارات
                      </div>
                    )}

                    <div className="absolute top-2 right-2 bg-[#b20000] text-white font-bold text-xs px-2 py-1 rounded-lg shadow-sm z-10">
                      {price.toFixed(2)}
                    </div>

                    <div className="w-16 h-16 flex items-center justify-center mt-2">
                      <img
                        src={
                          product.image ||
                          `https://api.dicebear.com/7.x/icons/svg?seed=${String(product.id)}`
                        }
                        alt={String(product.name ?? '')}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            'https://placehold.co/100x100/e2e8f0/64748b?text=No+Image';
                        }}
                      />
                    </div>

                    <div className="text-center w-full mt-auto">
                      <div className="text-[12px] font-bold text-gray-800 leading-tight truncate">
                        {product.name}
                      </div>
                    </div>
                  </button>
                );
              })}

              {visibleProducts.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-400">
                  <ShoppingCart size={48} className="mb-4 opacity-50" />
                  <p className="font-bold text-lg">لا توجد أصناف في هذا التصنيف</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <aside
        className={cn(
          'bg-white border-r border-gray-200 shadow-[-5px_0_15px_rgba(0,0,0,0.05)] flex flex-col z-30 transition-all duration-300 flex-shrink-0',
          isCartCollapsed ? 'w-0' : 'w-[420px]'
        )}
      >
        <div
          className={cn(
            'flex flex-col h-full transition-opacity duration-300',
            isCartCollapsed ? 'opacity-0 hidden' : 'opacity-100'
          )}
        >
          <div className="flex-none p-4 bg-white border-b border-gray-200 flex flex-col gap-3">
            <div className="flex gap-2">
              <ComboboxField
                items={["عميل نقدي"]}
                value={customer.name}
                onValueChange={() => {}}
                disabled={isCustomerSelectDisabled}
              />

              <div className="flex items-center gap-1 border border-gray-300 rounded-lg px-1 bg-white">
                <button
                  onClick={() => setShowAddCustomerModal(true)}
                  className="text-[#0c4a3b] hover:bg-green-50 p-2 rounded-md"
                >
                  <Plus size={16} />
                </button>
                <button
                  onClick={() => setShowCustomerDetailsModal(true)}
                  className="text-[#0c4a3b] hover:bg-green-50 p-2 rounded-md"
                >
                  <Eye size={16} />
                </button>
              </div>
            </div>

            <div className="relative flex items-center" ref={searchRef}>
              <div className="absolute right-3 text-gray-400 z-10 pointer-events-none flex items-center justify-center">
                <Search size={18} />
              </div>

              <Input
                type="text"
                placeholder={t('search') || 'ابحث بالاسم أو الباركود...'}
                className="w-full border-2 border-gray-300 rounded-lg py-2.5 text-sm font-bold outline-none focus:border-[#0c4a3b] bg-white"
                style={{ paddingRight: '40px', paddingLeft: '16px' }}
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => searchQuery.trim() && setShowSearchDropdown(true)}
              />

              {showSearchDropdown && searchResults.length > 0 && (
                <div className="absolute z-[100] top-full mt-2 right-0 left-0 bg-white border-2 border-gray-200 rounded-xl shadow-2xl max-h-72 overflow-y-auto">
                  {searchResults.map((product) => (
                    <button
                      key={String(product.id)}
                      onClick={() => {
                        handleAddProduct(product);
                        setShowSearchDropdown(false);
                      }}
                      className="w-full text-right px-4 py-3 hover:bg-green-50 border-b border-gray-100 last:border-0 flex justify-between items-center transition-colors"
                    >
                      <span className="font-bold text-gray-800">{product.name}</span>
                      <span className="text-[#0c4a3b] font-black bg-green-50 px-2 py-1 rounded-md">
                        {product.price} ر.س
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 text-gray-600 sticky top-0 z-10 border-b-2 border-gray-200 text-xs">
                <tr>
                  <th className="p-3 font-bold text-right w-[45%]">الصنف</th>
                  <th className="p-3 font-bold text-center w-[15%]">السعر</th>
                  <th className="p-3 font-bold text-center w-[15%]">العدد</th>
                  <th className="p-3 font-bold text-center w-[15%]">الإجمالي</th>
                  <th className="p-3 font-bold text-center w-[10%]">حذف</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 text-xs">
                {cart.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-gray-400">
                      <div className="flex flex-col items-center gap-3">
                        <ShoppingCart size={40} className="opacity-30" />
                        <span className="font-bold text-base">السلة فارغة</span>
                        <span className="text-sm">أضف أصنافاً من الشبكة للبدء</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  cart.map((item) => {
                    const price =
                      parseFloat(String(item.price ?? 0).replace(/[^0-9.]/g, '')) || 0;

                    return (
                      <tr
                        key={String(item.id)}
                        className="hover:bg-green-50/50 transition-colors"
                      >
                        <td className="p-3 font-bold text-gray-800">
                          <div className="flex items-center gap-2">
                            {item.productNature === 'sub' && (
                              <Layers size={14} className="text-orange-500 shrink-0" />
                            )}
                            <span className="truncate">{item.name}</span>
                          </div>
                        </td>

                        <td className="p-3 text-center text-gray-600 font-bold">
                          {price.toFixed(2)}
                        </td>

                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1 bg-gray-100 rounded-lg px-1 py-1 mx-auto w-fit">
                            <button
                              onClick={() => updateQuantity(item.id, -1)}
                              className="w-6 h-6 flex items-center justify-center bg-white rounded-md shadow hover:bg-gray-50 font-bold text-gray-600"
                            >
                              -
                            </button>
                            <span className="font-black text-gray-800 w-8 text-center">
                              {item.cartQuantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, 1)}
                              className="w-6 h-6 flex items-center justify-center bg-white rounded-md shadow hover:bg-gray-50 font-bold text-gray-600"
                            >
                              +
                            </button>
                          </div>
                        </td>

                        <td className="p-3 text-center font-black text-[#0c4a3b] text-base">
                          {(price * item.cartQuantity).toFixed(2)}
                        </td>

                        <td className="p-3 text-center">
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="w-7 h-7 flex items-center justify-center bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all font-bold"
                            title="حذف العنصر"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex-none bg-gray-50 border-t-2 border-gray-200 p-4 z-30">
            <div className="space-y-2 mb-3 text-sm">
              <div className="flex justify-between font-bold text-gray-600">
                <span>قبل الضريبة:</span>
                <span>{(totalInvoice / 1.15).toFixed(2)} ر.س</span>
              </div>

              <div className="flex justify-between font-bold text-gray-600">
                <span>ضريبة 15%:</span>
                <span className="text-red-500">
                  {(totalInvoice - totalInvoice / 1.15).toFixed(2)} ر.س
                </span>
              </div>

              <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-gray-800 items-center">
                <span>الخصم:</span>
                <Input
                  type="number"
                  value={invoiceDiscount}
                  onChange={(e) => setInvoiceDiscount(parseFloat(e.target.value) || 0)}
                  className="w-24 border border-gray-300 rounded px-2 py-1 text-center font-bold outline-none focus:border-[#0c4a3b]"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="bg-[#0c4a3b] text-white p-4 rounded-xl flex items-center justify-between shadow-lg mb-3">
              <span className="text-base font-bold">المطلوب سداده</span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black">{totalInvoice.toFixed(2)}</span>
                <span className="text-sm font-bold opacity-80">ر.س</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowReceiptModal(true)}
                disabled={cart.length === 0}
                className="flex-1 bg-[#00a651] text-white py-3 rounded-xl font-black text-base hover:bg-[#008f45] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                دفع وإتمام (F9)
              </button>

              <button
                onClick={() => {
                  setCart([]);
                  setInvoiceDiscount(0);
                }}
                className="bg-red-500 text-white px-4 py-3 rounded-xl font-bold hover:bg-red-600 transition-all shadow-md"
                title="إلغاء الفاتورة"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </main>
  );

  const renderTraditionalScreen = () => (
    <main className="flex-1 flex flex-col overflow-hidden p-4 space-y-4">
      <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-4 grid grid-cols-1 md:grid-cols-3 gap-4 flex-none">
        <div className="space-y-2 relative" ref={searchRefBlue}>
          <label className="text-sm font-bold text-blue-800 block">
            البحث عن صنف (اسم / باركود)
          </label>

          <div className="relative">
            <div className="absolute right-3 text-blue-400 z-10 pointer-events-none flex items-center justify-center h-full top-0">
              <Search size={18} />
            </div>

            <Input
              type="text"
              placeholder="ابحث هنا لإضافة صنف..."
              className="w-full border-2 border-blue-200 rounded-xl py-2.5 text-sm font-bold outline-none focus:border-blue-500 bg-blue-50/30"
              style={{ paddingRight: '40px', paddingLeft: '16px' }}
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => searchQuery.trim() && setShowSearchDropdown(true)}
            />

            {showSearchDropdown && searchResults.length > 0 && (
              <div className="absolute z-[100] top-full mt-2 right-0 left-0 bg-white border-2 border-blue-200 rounded-xl shadow-2xl max-h-72 overflow-y-auto">
                {searchResults.map((product) => (
                  <button
                    key={String(product.id)}
                    onClick={() => {
                      handleAddProduct(product);
                      setShowSearchDropdown(false);
                    }}
                    className="w-full text-right px-4 py-3 hover:bg-blue-50 border-b border-blue-100 last:border-0 flex justify-between items-center transition-colors"
                  >
                    <span className="font-bold text-blue-900">{product.name}</span>
                    <span className="text-blue-700 font-black bg-blue-100 px-2 py-1 rounded-md">
                      {product.price} ر.س
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2 relative">
          <label className="text-sm font-bold text-blue-800 block">بيانات العميل</label>
          <div className="flex relative">
            <div className="absolute right-3 text-blue-400 z-10 pointer-events-none flex items-center justify-center h-full top-0">
              <User size={18} />
            </div>

            <Input
              type="text"
              className="w-full border-2 border-blue-200 rounded-r-xl py-2.5 text-sm font-bold outline-none bg-gray-50 text-gray-700"
              style={{ paddingRight: '40px', paddingLeft: '16px' }}
              value={customer.name}
              readOnly
            />

            <button
              onClick={() => setShowAddCustomerModal(true)}
              className="bg-blue-600 text-white px-4 hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              <Plus size={18} />
            </button>

            <button
              onClick={() => setShowCustomerDetailsModal(true)}
              className="bg-blue-500 text-white px-4 rounded-l-xl hover:bg-blue-600 transition-colors flex items-center justify-center border-l border-blue-600"
            >
              <Eye size={18} />
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-blue-800 block">الرصيد الحالي</label>
          <div className="flex">
            <Input
              type="text"
              readOnly
              value="0"
              className="w-full border-2 border-blue-200 border-l-0 rounded-r-xl px-4 py-2.5 text-center bg-gray-50 font-bold text-gray-700 outline-none"
            />
            <span className="bg-blue-100 text-blue-800 border-2 border-blue-200 px-4 py-2.5 rounded-l-xl flex items-center justify-center font-bold">
              مدين
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-blue-100 flex-1 flex flex-col min-h-[300px] overflow-hidden">
        <div className="overflow-y-auto flex-1">
          <table className="w-full text-sm text-right">
            <thead className="bg-blue-600 text-white sticky top-0 z-10">
              <tr>
                <th className="p-3 border-l border-blue-500 w-16 text-center">حذف</th>
                <th className="p-3 border-l border-blue-500 text-center w-24">الوحدة</th>
                <th className="p-3 border-l border-blue-500 text-center w-32">السعر</th>
                <th className="p-3 border-l border-blue-500 text-center w-32">الكمية</th>
                <th className="p-3 border-l border-blue-500 text-center w-32">الضريبة</th>
                <th className="p-3 border-l border-blue-500 text-center w-32">الإجمالي</th>
                <th className="p-3 font-bold text-right">الصنف</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-blue-50">
              {cart.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-16 text-center text-blue-300">
                    <div className="flex flex-col items-center gap-3">
                      <ShoppingCart size={48} className="opacity-50" />
                      <span className="font-bold text-lg">لم يتم إضافة أي أصناف للفاتورة</span>
                      <span className="text-sm">استخدم شريط البحث بالأعلى لإضافة الأصناف</span>
                    </div>
                  </td>
                </tr>
              ) : (
                cart.map((item, index) => {
                  const price =
                    parseFloat(String(item.price ?? 0).replace(/[^0-9.]/g, '')) || 0;
                  const isEven = index % 2 === 0;

                  return (
                    <tr
                      key={String(item.id)}
                      className={cn(
                        'hover:bg-blue-100/50 transition-colors',
                        isEven ? 'bg-white' : 'bg-blue-50/30'
                      )}
                    >
                      <td className="p-3 text-center border-l border-blue-50">
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-500 hover:bg-red-100 p-1.5 rounded-lg transition-colors inline-flex"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>

                      <td className="p-3 text-center border-l border-blue-50 text-blue-800 font-medium">
                        قطعة
                      </td>

                      <td className="p-3 text-center border-l border-blue-50 font-bold text-gray-700">
                        {price.toFixed(2)}
                      </td>

                      <td className="p-3 text-center border-l border-blue-50">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="w-7 h-7 flex items-center justify-center bg-blue-100 text-blue-800 rounded hover:bg-blue-200 font-bold"
                          >
                            -
                          </button>

                          <Input
                            type="number"
                            value={item.cartQuantity}
                            onChange={(e) => {
                              const newQty = parseInt(e.target.value, 10);
                              if (newQty > 0) {
                                setCart((prev) =>
                                  prev.map((cItem) =>
                                    cItem.id === item.id
                                      ? { ...cItem, cartQuantity: newQty }
                                      : cItem
                                  )
                                );
                              }
                            }}
                            className="w-12 border border-blue-200 rounded py-1 text-center outline-none focus:border-blue-500 font-bold text-blue-900 bg-white"
                          />

                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="w-7 h-7 flex items-center justify-center bg-blue-100 text-blue-800 rounded hover:bg-blue-200 font-bold"
                          >
                            +
                          </button>
                        </div>
                      </td>

                      <td className="p-3 text-center border-l border-blue-50 text-blue-600">
                        {(price * item.cartQuantity * 0.15).toFixed(2)}
                      </td>

                      <td className="p-3 text-center border-l border-blue-50 font-black text-blue-900 text-base">
                        {(price * item.cartQuantity).toFixed(2)}
                      </td>

                      <td className="p-3 text-right font-bold text-gray-800">
                        <div className="flex items-center gap-2 justify-end">
                          {item.name}
                          {item.productNature === 'sub' && (
                            <Layers size={14} className="text-orange-500" />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-4 flex-none">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex flex-col items-center justify-center gap-1">
            <span className="text-sm text-blue-600 font-bold">إجمالي قبل الضريبة</span>
            <span className="text-xl font-black text-blue-900">
              {(totalInvoice / 1.15).toFixed(2)}
            </span>
          </div>

          <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex flex-col items-center justify-center gap-1">
            <span className="text-sm text-blue-600 font-bold">قيمة الضريبة (15%)</span>
            <span className="text-xl font-black text-red-600">
              {(totalInvoice - totalInvoice / 1.15).toFixed(2)}
            </span>
          </div>

          <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex flex-col items-center justify-center gap-1">
            <span className="text-sm text-blue-600 font-bold mb-1">الخصم</span>
            <Input
              type="number"
              value={invoiceDiscount}
              onChange={(e) => setInvoiceDiscount(parseFloat(e.target.value) || 0)}
              className="w-24 border border-blue-200 rounded-lg px-2 py-1 text-center font-bold outline-none focus:border-blue-500 bg-white text-blue-900 shadow-inner"
            />
          </div>

          <div className="bg-blue-600 p-4 rounded-xl shadow-lg flex flex-col items-center justify-center gap-1 text-white">
            <span className="text-sm font-bold opacity-90">المطلوب سداده</span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black">{totalInvoice.toFixed(2)}</span>
              <span className="text-sm font-bold opacity-80">ر.س</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-blue-100">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowReceiptModal(true)}
              disabled={cart.length === 0}
              className="bg-blue-600 text-white px-10 py-3.5 rounded-xl font-black hover:bg-blue-700 shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 text-lg"
            >
              <Save size={22} />
              حفظ الفاتورة (F9)
            </button>

            <button
              onClick={() => {
                setCart([]);
                setInvoiceDiscount(0);
              }}
              className="bg-red-50 text-red-600 px-6 py-3.5 rounded-xl font-bold hover:bg-red-100 hover:text-red-700 transition-all flex items-center gap-2 border border-red-100"
            >
              <Trash2 size={20} />
              إلغاء (F7)
            </button>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer text-blue-800 font-bold select-none">
              <Input
                type="checkbox"
                className="w-5 h-5 accent-blue-600 rounded border-gray-300"
                defaultChecked
              />
              <span>طباعة تلقائية</span>
            </label>

            <div className="h-8 w-px bg-blue-200"></div>

            <button
              className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 hover:bg-blue-100 border border-blue-100 transition-all"
              title="طباعة"
            >
              <Printer size={24} />
            </button>
          </div>
        </div>
      </div>
    </main>
  );

  if (productsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50" dir={direction}>
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#0c4a3b] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div
      className="w-full h-full relative flex flex-col bg-[#eef1f5] overflow-hidden"
      dir={direction || 'rtl'}
    >
      <header
        className={cn(
          'flex-none border-b px-4 py-2 flex items-center justify-between shadow-sm z-30 transition-colors duration-300',
          isBlueScreen ? 'bg-blue-700 border-blue-800' : 'bg-white border-gray-200'
        )}
      >
        <div className="flex items-center gap-4">
          <div
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg border',
              isBlueScreen
                ? 'bg-blue-600/50 text-white border-blue-500/50'
                : 'bg-[#0c4a3b]/10 text-[#0c4a3b] border-[#0c4a3b]/20'
            )}
          >
            <Building size={16} />
            <span className="text-sm font-bold">
              {selectedBranch?.name || t("main_branch")}
            </span>
          </div>

          {isBlueScreen && (
            <div className="bg-white/20 text-white px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 border border-white/10">
              <CreditCard size={16} />
              خزينة: الكاشير الرئيسي
            </div>
          )}
        </div>

        {isBlueScreen && (
          <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 font-black text-white text-lg tracking-wider">
            نظام المبيعات السريع
          </div>
        )}

        <div className="flex items-center gap-6">
          <div
            className={cn(
              'flex items-center gap-2 font-bold text-sm px-3 py-1.5 rounded-lg border',
              isBlueScreen
                ? 'bg-blue-800/50 text-white border-blue-600'
                : 'text-gray-600 bg-gray-50 border-gray-200'
            )}
          >
            <Clock
              size={16}
              className={isBlueScreen ? 'text-blue-200' : 'text-[#0c4a3b]'}
            />
            <span>{currentTime.toLocaleTimeString('en-GB')}</span>
            <span className="mx-1 opacity-50">|</span>
            <Calendar
              size={16}
              className={isBlueScreen ? 'text-blue-200' : 'text-[#0c4a3b]'}
            />
            <span>{currentTime.toLocaleDateString('ar-EG')}</span>
          </div>

          <div
            className={cn(
              'flex items-center gap-2 px-3 py-1 rounded-lg border',
              isBlueScreen ? 'bg-white border-blue-100' : 'bg-gray-50 border-gray-200'
            )}
          >
            <div
              className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center text-white',
                isBlueScreen ? 'bg-blue-600' : 'bg-[#0c4a3b]'
              )}
            >
              <User size={14} />
            </div>

            <div className="text-right">
              <div className="text-xs font-bold text-gray-800">الكاشير</div>
              <div
                className={cn(
                  'text-[9px] font-bold',
                  isBlueScreen ? 'text-blue-600' : 'text-[#00a651]'
                )}
              >
                متصل
              </div>
            </div>
          </div>

          {shiftId && (
            <button
              onClick={() => setIsShiftReportOpen(true)}
              className={cn(
                "flex items-center gap-2 px-4 py-1.5 rounded-lg border transition-all active:scale-95",
                isBlueScreen
                  ? "bg-red-500/20 text-white border-red-500/30 hover:bg-red-500/30"
                  : "bg-red-50 text-red-600 border-red-100 hover:bg-red-100"
              )}
            >
              <Lock size={16} />
              <span className="text-sm font-bold">غلق الوردية</span>
            </button>
          )}
        </div>
      </header>

      {selectedBranch?.showScreen2 && !selectedBranch?.showTouchScreen
        ? renderTraditionalScreen()
        : selectedBranch?.showTouchScreen && !selectedBranch?.showScreen2
          ? renderTouchScreen()
          : selectedBranch?.showTouchScreen
            ? renderTouchScreen()
            : renderTraditionalScreen()}

      {showSubProductsModal && currentParentProduct && (
        <div
          className="fixed inset-0 bg-black/70 z-[90] flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => {
            setShowSubProductsModal(false);
            setCurrentParentProduct(null);
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 bg-gradient-to-l from-orange-500 to-orange-600 text-white">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Layers size={24} />
                </div>
                <div>
                  <h2 className="font-black text-lg">اختر النوع المطلوب</h2>
                  <p className="text-white/80 text-sm">{currentParentProduct.name}</p>
                </div>
              </div>
            </div>

            <div className="p-4 space-y-2 max-h-80 overflow-y-auto bg-gray-50">
              {subProducts
                .filter(
                  (sub) =>
                    sub.parentProductId === currentParentProduct.id ||
                    sub.parentProductName === currentParentProduct.name
                )
                .map((sub) => {
                  const price =
                    parseFloat(String(sub.price ?? 0).replace(/[^0-9.]/g, '')) || 0;

                  return (
                    <button
                      key={String(sub.id)}
                      onClick={() => handleSelectSubProduct(sub)}
                      className="w-full border-2 border-orange-100 bg-white rounded-xl p-4 flex items-center justify-between hover:border-orange-400 hover:bg-orange-50 transition-all active:scale-[0.98] text-right group shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600 group-hover:bg-orange-200 transition-colors">
                          <Layers size={24} />
                        </div>
                        <div>
                          <span className="font-bold text-gray-800 text-base block">
                            {sub.name}
                          </span>
                          {sub.category && (
                            <span className="text-xs text-gray-500">{sub.category}</span>
                          )}
                        </div>
                      </div>

                      <span className="font-black text-orange-600 text-xl">
                        {price.toFixed(2)}
                      </span>
                    </button>
                  );
                })}
            </div>

            <div className="p-4 border-t border-gray-100 bg-white flex justify-between items-center gap-3">
              <button
                onClick={() => {
                  setShowSubProductsModal(false);
                  setCurrentParentProduct(null);
                }}
                className="px-4 py-2.5 text-gray-600 font-bold hover:bg-gray-100 rounded-lg transition-colors"
              >
                إلغاء
              </button>

              <button
                onClick={handleAddParentOnly}
                className="flex-1 bg-gray-100 text-gray-700 px-5 py-2.5 rounded-xl font-bold hover:bg-gray-200 transition-colors border border-gray-200"
              >
                إضافة الأساسي فقط
              </button>
            </div>
          </div>
        </div>
      )}

      {showCustomerDetailsModal && (
        <div
          className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setShowCustomerDetailsModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={cn(
                'p-4 flex justify-between items-center text-white',
                isBlueScreen ? 'bg-blue-600' : 'bg-[#0c4a3b]'
              )}
            >
              <h2 className="font-bold text-lg flex items-center gap-2">
                <User size={20} /> بيانات العميل
              </h2>
              <button
                onClick={() => setShowCustomerDetailsModal(false)}
                className="text-white/80 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-3 bg-white">
              <div className="flex justify-between py-3 border-b border-gray-100">
                <span className="font-bold text-gray-500">الاسم:</span>
                <span className="font-bold text-gray-800">{customer.name}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-gray-100">
                <span className="font-bold text-gray-500">الهاتف:</span>
                <span className="font-bold text-gray-800">{customer.phone}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-gray-100">
                <span className="font-bold text-gray-500">المجموعة:</span>
                <span className="font-bold text-gray-800">{customer.group}</span>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 flex gap-2 justify-end bg-gray-50">
              <button
                onClick={() => setShowCustomerDetailsModal(false)}
                className="px-6 py-2 bg-gray-200 rounded-lg font-bold text-gray-700 hover:bg-gray-300 transition-colors"
              >
                إغلاق
              </button>

              <button
                onClick={() => {
                  setShowCustomerDetailsModal(false);
                  setShowEditCustomerModal(true);
                }}
                className={cn(
                  'px-6 py-2 text-white rounded-lg font-bold transition-colors',
                  isBlueScreen
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-[#0c4a3b] hover:bg-[#0a3d32]'
                )}
              >
                تعديل
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditCustomerModal && (
        <div
          className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setShowEditCustomerModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={cn(
                'p-4 flex justify-between items-center text-white',
                isBlueScreen ? 'bg-blue-600' : 'bg-[#0c4a3b]'
              )}
            >
              <h2 className="font-bold text-lg flex items-center gap-2">
                <Pencil size={20} /> تعديل العميل
              </h2>
              <button
                onClick={() => setShowEditCustomerModal(false)}
                className="text-white/80 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5 bg-white">
              <div>
                <label
                  className={cn(
                    'block text-sm font-bold mb-2',
                    isBlueScreen ? 'text-blue-800' : 'text-[#0c4a3b]'
                  )}
                >
                  الاسم *
                </label>
                <Input
                  type="text"
                  value={editCustomerData.name}
                  onChange={(e) =>
                    setEditCustomerData({ ...editCustomerData, name: e.target.value })
                  }
                  className={cn(
                    'w-full border-2 rounded-lg px-4 py-2.5 outline-none font-bold',
                    isBlueScreen
                      ? 'border-blue-100 focus:border-blue-500 bg-blue-50/30'
                      : 'border-gray-200 focus:border-[#0c4a3b] bg-gray-50'
                  )}
                />
              </div>

              <div>
                <label
                  className={cn(
                    'block text-sm font-bold mb-2',
                    isBlueScreen ? 'text-blue-800' : 'text-[#0c4a3b]'
                  )}
                >
                  الهاتف
                </label>
                <Input
                  type="text"
                  value={editCustomerData.phone}
                  onChange={(e) =>
                    setEditCustomerData({ ...editCustomerData, phone: e.target.value })
                  }
                  className={cn(
                    'w-full border-2 rounded-lg px-4 py-2.5 outline-none font-bold',
                    isBlueScreen
                      ? 'border-blue-100 focus:border-blue-500 bg-blue-50/30'
                      : 'border-gray-200 focus:border-[#0c4a3b] bg-gray-50'
                  )}
                />
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
              <button
                onClick={() => setShowEditCustomerModal(false)}
                className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-300 transition-colors"
              >
                إلغاء
              </button>

              <button
                onClick={handleEditCustomerSave}
                className={cn(
                  'px-8 py-2.5 text-white rounded-lg font-bold transition-colors',
                  isBlueScreen
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-[#0c4a3b] hover:bg-[#0a3d32]'
                )}
              >
                حفظ التعديلات
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddCustomerModal && (
        <div
          className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setShowAddCustomerModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={cn(
                'p-4 flex justify-between items-center text-white',
                isBlueScreen ? 'bg-blue-600' : 'bg-[#0c4a3b]'
              )}
            >
              <h2 className="font-bold text-lg flex items-center gap-2">
                <Plus size={20} /> إضافة عميل جديد
              </h2>
              <button
                onClick={() => setShowAddCustomerModal(false)}
                className="text-white/80 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5 bg-white">
              <div>
                <label
                  className={cn(
                    'block text-sm font-bold mb-2',
                    isBlueScreen ? 'text-blue-800' : 'text-[#0c4a3b]'
                  )}
                >
                  الاسم *
                </label>
                <Input
                  type="text"
                  className={cn(
                    'w-full border-2 rounded-lg px-4 py-2.5 outline-none font-bold',
                    isBlueScreen
                      ? 'border-blue-100 focus:border-blue-500 bg-blue-50/30'
                      : 'border-gray-200 focus:border-[#0c4a3b] bg-gray-50'
                  )}
                  placeholder="أدخل اسم العميل"
                />
              </div>

              <div>
                <label
                  className={cn(
                    'block text-sm font-bold mb-2',
                    isBlueScreen ? 'text-blue-800' : 'text-[#0c4a3b]'
                  )}
                >
                  الهاتف
                </label>
                <Input
                  type="text"
                  className={cn(
                    'w-full border-2 rounded-lg px-4 py-2.5 outline-none font-bold',
                    isBlueScreen
                      ? 'border-blue-100 focus:border-blue-500 bg-blue-50/30'
                      : 'border-gray-200 focus:border-[#0c4a3b] bg-gray-50'
                  )}
                  placeholder="رقم الجوال"
                />
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
              <button
                onClick={() => setShowAddCustomerModal(false)}
                className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-300 transition-colors"
              >
                إلغاء
              </button>

              <button
                onClick={() => setShowAddCustomerModal(false)}
                className={cn(
                  'px-8 py-2.5 text-white rounded-lg font-bold transition-colors',
                  isBlueScreen
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-[#0c4a3b] hover:bg-[#0a3d32]'
                )}
              >
                إضافة العميل
              </button>
            </div>
          </div>
        </div>
      )}

      {showReceiptModal && (
        <div
          className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setShowReceiptModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-100 text-gray-700">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <Printer size={20} /> الإيصال
              </h2>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-8 overflow-y-auto flex-1 font-mono text-sm bg-white">
              <div className="text-center mb-6 font-bold text-lg">
                {posSettings?.receipt?.header || 'اسم المتجر'}
              </div>

              <div className="border-t-2 border-dashed border-gray-300 my-4" />

              <table className="w-full text-right mb-4">
                <thead>
                  <tr className="border-b-2 border-gray-800 text-gray-800">
                    <th className="pb-2 font-bold">الصنف</th>
                    <th className="pb-2 text-center font-bold">عدد</th>
                    <th className="pb-2 text-left font-bold">إجمالي</th>
                  </tr>
                </thead>

                <tbody className="text-gray-600">
                  {cart.map((item) => {
                    const price =
                      parseFloat(String(item.price ?? 0).replace(/[^0-9.]/g, '')) || 0;

                    return (
                      <tr key={String(item.id)}>
                        <td className="py-2 font-semibold">{item.name}</td>
                        <td className="py-2 text-center">{item.cartQuantity}</td>
                        <td className="py-2 text-left font-semibold">
                          {(price * item.cartQuantity).toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="border-t-2 border-dashed border-gray-300 my-4" />

              <div className="space-y-2 text-gray-600">
                <div className="flex justify-between">
                  <span>قبل الضريبة:</span>
                  <span>{(totalInvoice / 1.15).toFixed(2)} ر.س</span>
                </div>
                <div className="flex justify-between">
                  <span>الضريبة (15%):</span>
                  <span>{(totalInvoice - totalInvoice / 1.15).toFixed(2)} ر.س</span>
                </div>

                {invoiceDiscount > 0 && (
                  <div className="flex justify-between text-red-500">
                    <span>الخصم:</span>
                    <span>{invoiceDiscount.toFixed(2)}- ر.س</span>
                  </div>
                )}
              </div>

              <div className="border-t-2 border-solid border-gray-800 my-4" />

              <div className="flex justify-between font-black text-2xl text-gray-900">
                <span>المجموع</span>
                <span>{totalInvoice.toFixed(2)} ر.س</span>
              </div>

              <div className="border-t-2 border-dashed border-gray-300 my-4" />
              <div className="text-center mt-6 text-gray-500 font-bold">
                {posSettings?.receipt?.footer || 'شكراً لزيارتكم!'}
              </div>
            </div>

            <div className="p-4 bg-gray-100 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => {
                  setCart([]);
                  setShowReceiptModal(false);
                  setInvoiceDiscount(0);
                }}
                className={cn(
                  'flex-1 text-white py-3 rounded-xl font-bold transition-all shadow-md text-base',
                  isBlueScreen ? 'bg-blue-600 hover:bg-blue-700' : 'bg-[#0c4a3b] hover:bg-[#0a3d32]'
                )}
              >
                بيع جديد
              </button>

              <button
                onClick={() => window.print()}
                className="bg-white text-gray-800 px-6 py-3 rounded-xl font-bold hover:bg-gray-50 flex items-center gap-2 border border-gray-300 shadow-sm transition-all"
              >
                <Printer size={20} /> طباعة
              </button>
            </div>
          </div>
        </div>
      )}
      {isShiftReportOpen && shiftId && (
        <ShiftReportModal
          isOpen={isShiftReportOpen}
          onClose={() => setIsShiftReportOpen(false)}
          shiftId={parseInt(shiftId)}
          onConfirmCloseShift={() => {
            const fullTime = new Date().toLocaleTimeString("en-GB", { hour12: false });
            closeShiftMutate(
              {
                shiftId: parseInt(shiftId),
                endTime: fullTime,
              },
              {
                onSuccess: () => {
                  setIsShiftReportOpen(false);
                },
              },
            );
          }}
        />
      )}
    </div>
  );
}