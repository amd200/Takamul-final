import { Button } from "@/components/ui/button";
import { Barcode, Check, ChevronLeft, CircleArrowRight, Delete, Pause, Plus, RotateCw, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Home, Users, LayoutGrid, DollarSign, ClipboardList, BarChart2, Settings, LogOut } from "lucide-react";
import { useGetAllCustomers } from "@/features/customers/hooks/useGetAllCustomers";
import type { Customer } from "@/features/customers/types/customers.types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import AddParnterModal from "@/components/modals/AddParnterModal";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ComboboxField from "@/components/ui/ComboboxField";

const NAV_ITEMS = [
  { id: "home", icon: Home, label: "Home" },
  { id: "customers", icon: Users, label: "Customers" },
  { id: "tables", icon: LayoutGrid, label: "Tables" },
  { id: "cashier", icon: DollarSign, label: "Cashier" },
  { id: "orders", icon: ClipboardList, label: "Orders" },
  { id: "reports", icon: BarChart2, label: "Reports" },
  { id: "settings", icon: Settings, label: "Settings" },
];

// ─── DATA ────────────────────────────────────────────────────────────────────
const MENU_DATA = [
  { name: "Schezwan Egg Noodles", price: 24, cat: "Lunch", e: "🍜" },
  { name: "Stir Egg Fry Udon Noodles", price: 24, cat: "Lunch", e: "🍝" },
  { name: "Thai Style Fried Noodles", price: 24, cat: "Lunch", e: "🍛" },
  { name: "Chinese Prawn Spaghetti", price: 24, cat: "Lunch", e: "🦐" },
  { name: "Japanese Soba Noodles", price: 24, cat: "Lunch", e: "🍱" },
  { name: "Chilli Garlic Thai Noodles", price: 24, cat: "Lunch", e: "🌶️" },
  { name: "Thai Style Fried Noodles", price: 24, cat: "Starters", e: "🍢" },
  { name: "Schezwan Egg Noodles", price: 24, cat: "Starters", e: "🥘" },
  { name: "Spring Rolls", price: 12, cat: "Starters", e: "🌯" },
  { name: "Stir Egg Fry Udon", price: 24, cat: "Breakfast", e: "🍳" },
  { name: "Chilli Garlic Thai", price: 24, cat: "Breakfast", e: "🥗" },
  { name: "Lemon Dessert", price: 18, cat: "Deserts", e: "🍋" },
  { name: "Ice Cream Sundae", price: 14, cat: "Deserts", e: "🍨" },
  { name: "Fresh Juice", price: 8, cat: "Beverages", e: "🥤" },
  { name: "Iced Coffee", price: 10, cat: "Beverages", e: "☕" },
  { name: "Grilled Chicken", price: 28, cat: "Supper", e: "🍗" },
  { name: "BBQ Ribs", price: 32, cat: "Supper", e: "🥩" },
];

const CATS = [
  { id: "Starters", label: "Starters", children: ["Cold Starters", "Hot Starters"] },
  { id: "Breakfast", label: "Breakfast", children: [] },
  { id: "Lunch", label: "Lunch", children: ["Fast Lunch", "Full Meal"] },
  { id: "Supper", label: "Supper", children: [] },
  { id: "Deserts", label: "Deserts", children: [] },
  { id: "Beverages", label: "Beverages", children: ["Hot", "Cold"] },
];
const CUSTOMERS = [
  { name: "Benjamin Cole", email: "ben.cole@gmail.com", date: "16/11/2024" },
  { name: "Monica Bill", email: "m.bill@gmail.com", date: "16/11/2024" },
  { name: "Tyler Cox", email: "tyler.cox@gmail.com", date: "16/11/2024" },
  { name: "Janary Foi", email: "jan.foi@gmail.com", date: "19/12/2024" },
];

const INITIAL_CART = [
  { name: "Schezwan Egg Noodles", price: 25, qty: 1, note: "", op: null },
  { name: "Spicy Shrimp Soup", price: 40, qty: 2, note: "Medium- Half Grilled", op: 50 },
  { name: "Thai Style Fried Noodles", price: 40, qty: 2, note: "Medium", op: 50 },
  { name: "Fried Basil", price: 75, qty: 3, note: "" },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function calcTotals(cart, discount) {
  const sub = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const tax = Math.round(sub * 0.225);
  const pay = Math.max(0, sub + tax - discount);
  return { sub, pay, tax };
}

// ─── CART PANEL ──────────────────────────────────────────────────────────────
function CartPanel({ cart, setCart, discount, setDiscount, onProceed, onHold, t }) {
  const [expandedIdx, setExpandedIdx] = useState(null);
  const [activeTab, setActiveTab] = useState("add");
  const [discType, setDiscType] = useState("pct");
  const [discInput, setDiscInput] = useState("");

  const { sub, tax, pay } = calcTotals(cart, discount);

  const toggleExpand = (idx) => setExpandedIdx(expandedIdx === idx ? null : idx);
  const removeItem = (idx) => {
    setCart((p) => p.filter((_, i) => i !== idx));
    if (expandedIdx === idx) setExpandedIdx(null);
  };
  const changeQty = (idx, d) => setCart((p) => p.map((item, i) => (i === idx ? { ...item, qty: Math.max(1, item.qty + d) } : item)));
  const applyDiscount = () => {
    const val = parseFloat(discInput) || 0;
    setDiscount(discType === "pct" ? Math.round((sub * val) / 100) : val);
    setActiveTab("add");
    setDiscInput("");
  };

  const TABS = ["add", "discount", "coupon", "note"];
  const TAB_LABELS = { add: "Add", discount: "Discount", coupon: "Coupon Code", note: "Note" };
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const { data: customers, isLoading } = useGetAllCustomers({ page: 1, limit: 100 });

  return (
    <>
      <div className="bg-white flex flex-col" style={{ width: 450 }}>
        {/* Head */}
        <div className="px-3 py-2.5 border-b border-gray-100 flex items-center gap-2">
          {!selectedCustomer ? (
            <ComboboxField
              items={customers?.items}
              valueKey="id"
              labelKey="customerName"
              placeholder="اختر العميل..."
              onValueChange={(val) => {
                const customer = customers?.items?.find((c) => String(c.id) === val);
                if (customer) setSelectedCustomer(customer);
              }}
              isLoading={isLoading}
            />
          ) : (
            <div className="flex items-center gap-2 flex-1 px-2.5 py-1.5 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shrink-0">{selectedCustomer.customerName.slice(0, 2).toUpperCase()}</div>
              <span className="text-xs font-bold text-primary flex-1 truncate">{selectedCustomer.customerName}</span>
              <button onClick={() => setSelectedCustomer(null)} className="text-primary/60 hover:text-primary text-base leading-none">
                ×
              </button>
            </div>
          )}

          <Button size="icon-sm" variant="outline" onClick={() => setOpenDialog(true)}>
            <Plus size={14} />
          </Button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-2 py-1.5 space-y-1">
          {cart.length === 0 ? (
            <div className="p-5 text-center text-gray-400 text-xs">{t("cart_empty") || "Cart is empty"}</div>
          ) : cart.map((item, idx) => {
            const isOpen = expandedIdx === idx;
            return (
              <div key={idx} className={`rounded-lg relative transition-all ${idx % 2 === 0 ? "bg-white" : "bg-[#f6f6f6]"}`}>
                {isOpen && <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500 rounded-l-md z-10" />}
                <div onClick={() => toggleExpand(idx)} className="flex items-start gap-1.5 cursor-pointer py-2 pr-2 pl-3.5">
                  <span className={`text-xs text-gray-400 pt-0.5 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}>›</span>
                  <span className="text-xs text-gray-500 min-w-3 font-medium">{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-gray-800 truncate mb-1">{item.name}</div>
                    {item.note && <div className="text-xs text-gray-400">{item.note}</div>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs font-bold text-gray-800">${(item.price * item.qty).toFixed(2)}</div>
                    {item.op && <div className="text-xs text-gray-300 line-through">${(item.op * item.qty).toFixed(2)}</div>}
                  </div>
                  <button onClick={e => { e.stopPropagation(); removeItem(idx); }} className="text-white bg-[#a1a1a1] rounded-full size-4 flex items-center justify-center hover:bg-red-400 text-[14px] pe-[0.5px] pb-[1.5px] shrink-0 transition-colors">×</button>
                </div>
                {isOpen && (
                  <div className={`pl-3.5 pr-3 pb-3 pt-1 flex gap-3 items-end ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                    <div className="flex-1">
                      <div className="text-xs text-gray-400 mb-1.5">{t("quantity") || "Quantity"}</div>
                      <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white">
                        <button onClick={() => changeQty(idx, -1)} className="px-2.5 py-1.5 bg-white text-gray-500 hover:bg-gray-50 text-sm font-bold">−</button>
                        <span className="flex-1 py-1.5 text-xs font-semibold text-center border-x border-gray-200">{item.qty}</span>
                        <button onClick={() => changeQty(idx, 1)} className="px-2.5 py-1.5 bg-white text-gray-500 hover:bg-gray-50 text-sm font-bold">+</button>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-gray-400 mb-1.5">{t("discount") || "Discount"}(%)</div>
                      <input className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs outline-none text-right font-semibold focus:border-primary/40" defaultValue="0" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>


        <button
          onClick={(e) => {
            e.stopPropagation();
            removeItem(idx);
          }}
          className="text-white bg-[#a1a1a1] rounded-full size-4 flex items-center justify-center hover:bg-red-400 text-[14px] pe-[0.5px] pb-[1.5px] shrink-0 transition-colors"
        >
          ×
        </button>
      </AccordionTrigger>

      <AccordionContent>
        <div className={`pl-3.5 pr-3 pb-3 pt-1 flex gap-3 items-end ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
          <div className="flex-1">
            <div className="text-xs text-gray-400 mb-1.5">Quantity</div>
            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white">
              <button onClick={() => changeQty(idx, -1)} className="px-2.5 py-1.5 bg-white text-gray-500 hover:bg-gray-50 text-sm font-bold">
                −
              </button>
              <span className="flex-1 py-1.5 text-xs font-semibold text-center border-x border-gray-200">{item.qty}</span>
              <button onClick={() => changeQty(idx, 1)} className="px-2.5 py-1.5 bg-white text-gray-500 hover:bg-gray-50 text-sm font-bold">
                +
              </button>
            </div>
          </div>
          <div className="flex-1">
            <div className="text-xs text-gray-400 mb-1.5">Discount(%)</div>
            <input className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs outline-none text-right font-semibold focus:border-primary/40" defaultValue="0" />
          </div>
        </div>
      </AccordionContent>
    </AccordionItem >
  ))
}
            </Accordion >
          )}
        </div >

  { activeTab === "add" && (
    <div className="px-3 pt-2.5 pb-3">
      <div className="flex justify-between text-xs text-gray-500 mb-1.5">
        <span>{t("subtotal") || "Subtotal"}</span><span className="font-semibold text-gray-800">${sub.toFixed(2)}</span>
      </div>
      <div className="flex justify-between text-xs text-gray-500 mb-1.5">
        <span>{t("tax_label") || "Tax"}</span><span className="font-semibold text-gray-800">${tax.toFixed(2)}</span>
      </div>
      <div className="flex justify-between text-xs mb-1.5 items-center">
        <span className={discount > 0 ? "text-primary font-semibold" : "text-gray-500"}>{t("discount") || "Discount"}</span>
        <div className="flex items-center gap-1">
          <span className={`font-semibold ${discount > 0 ? "text-gray-800" : "text-gray-400"}`}>-${discount.toFixed(2)}</span>
          {discount > 0 && (
            <button onClick={() => setDiscount(0)} className="w-4 h-4 rounded-full bg-gray-200 text-gray-500 text-xs flex items-center justify-center hover:bg-gray-300 leading-none">×</button>
          )}
        </div>
      </div>
      <div className="flex justify-between text-sm font-black text-gray-800 mt-2 pt-1 border-t border-gray-100 mb-3">
        <span>{t("payable_amount") || "Payable Amount"}</span><span>${pay.toFixed(2)}</span>
      </div>
      <div className="flex gap-2">
        <Button onClick={onHold} className="flex-1" variant="outline">{t("hold_cart") || "Hold Cart"}<Pause /></Button>
        <Button onClick={onProceed} className="flex-1">{t("proceed") || "Proceed"}<CircleArrowRight /></Button>
      </div>
    </div>

{
  activeTab === "discount" && (
    <div className="p-3">
      <div className="text-sm font-bold text-gray-800 mb-3">Add Discount</div>
      <div className="flex gap-2 mb-3 items-center">
        <button onClick={() => setDiscType("flat")} className={`w-12 h-12 rounded-xl flex items-center justify-center text-base font-bold border-2 transition-all flex-shrink-0 ${discType === "flat" ? "border-primary bg-primary/10 text-primary" : "border-gray-200 bg-white text-gray-400"}`}>
          $
        </button>
        <button onClick={() => setDiscType("pct")} className={`w-12 h-12 rounded-xl flex items-center justify-center text-base font-bold border-2 transition-all flex-shrink-0 ${discType === "pct" ? "border-primary bg-primary/10 text-primary" : "border-gray-200 bg-white text-gray-400"}`}>
          %
        </button>
        <input value={discInput} onChange={(e) => setDiscInput(e.target.value)} className="flex-1 h-12 px-3 border border-gray-200 rounded-xl text-sm outline-none text-right font-semibold focus:border-primary/40 bg-white" placeholder="0" type="number" min="0" />
      </div>
      <div className="flex gap-2">
        <Button size={"2xl"} className="flex-1" onClick={() => setActiveTab("add")} variant="outline">
          Cancel
        </Button>
        <Button size={"2xl"} className="flex-1" onClick={applyDiscount}>
          Add
        </Button>
      </div>
    </div>
  )
}

{
  activeTab === "coupon" && (
    <div className="p-3">
      <Input className="mb-2" placeholder="Enter coupon code..." />
      <div className="flex gap-2">
        <Button size={"2xl"} className="flex-1" onClick={() => setActiveTab("add")} variant="outline">
          Cancel
        </Button>
        <Button size={"2xl"} className="flex-1">
          Apply
        </Button>
      </div>
    </div>
  )
}

{
  activeTab === "note" && (
    <div className="p-3">
      <textarea className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-xs outline-none mb-2 resize-none focus:border-primary/40" rows={2} placeholder="Add order note..." />
      <div className="flex gap-2">
        <Button size={"2xl"} className="flex-1" variant="outline">
          Clear
        </Button>
        <Button size={"2xl"} className="flex-1">
          Save
        </Button>
      </div>
    </div>
  )
}
        </div >
      </div >
  <AddParnterModal
    isOpen={openDialog}
    onClose={() => {
      setOpenDialog(false);
    }}
  />
    </>
  );
}

// ─── HOLD MODAL ───────────────────────────────────────────────────────────────
function HoldModal({ onClose, onConfirm }) {
  const [note, setNote] = useState("");
  return (
    <div className="absolute inset-0 bg-black/35 flex items-center justify-center z-50 rounded-xl">
      <div className="bg-white rounded-2xl p-6 w-72 border-2 border-dashed border-primary/40">
        <div className="text-base font-black text-gray-800 mb-4">⏸ Hold Cart</div>
        <div className="text-xs text-gray-400 mb-1">Cart Note</div>
        <input autoFocus value={note} onChange={(e) => setNote(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary/50 mb-4" placeholder="Enter the note for holding cart" />
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-500 font-semibold hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={() => onConfirm(note || "No note")} className="flex-1 py-2.5 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors">
            Proceed
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── SCREENS ─────────────────────────────────────────────────────────────────
function HomeScreen({ cart, setCart, discount, setDiscount, onProceed, onHold }) {
  const [currentCat, setCurrentCat] = useState("Lunch");
  const [currentSubCat, setCurrentSubCat] = useState<string | null>(null);
  const [childrenModal, setChildrenModal] = useState<{ item: any } | null>(null);
  const activeCat = CATS.find((c) => c.id === currentCat);

  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.name === item.name);
      if (existing) return prev.map((i) => (i.name === item.name ? { ...i, qty: i.qty + 1 } : i));
      return [...prev, { name: item.name, price: item.price, qty: 1, note: "", op: null }];
    });
  };
  const handleMenuClick = (item) => {
    // ← وهنا
    if (item.children?.length) {
      setChildrenModal({ item });
    } else {
      addToCart(item);
    }
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex-1 p-3 overflow-y-auto bg-gray-50 min-w-0">
        {/* Category pills */}
        {/* Main Cats */}
        <div className="flex gap-1.5 mb-2 flex-wrap">
          {CATS.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setCurrentCat(c.id);
                setCurrentSubCat(null);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs border transition-colors
        ${c.id === currentCat ? "bg-primary text-white border-primary font-semibold" : "bg-white text-gray-500 border-gray-200 hover:border-primary/40"}`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Sub Cats */}
        {activeCat?.children?.length > 0 && (
          <div className="flex gap-1.5 mb-3 flex-wrap">
            {activeCat.children.map((sub) => (
              <button
                key={sub}
                onClick={() => setCurrentSubCat(currentSubCat === sub ? null : sub)}
                className={`px-3 py-1 rounded-full text-xs border transition-colors
          ${currentSubCat === sub ? "bg-primary/10 text-primary border-primary/30 font-semibold" : "bg-white text-gray-400 border-gray-200 hover:border-primary/30"}`}
              >
                {sub}
              </button>
            ))}
          </div>
        )}
        {/* Menu grid */}
        <div className="grid grid-cols-5 gap-2">
          {MENU_DATA.filter((i) => i.cat === currentCat).map((item, i) => (
            <div key={i} onClick={() => handleMenuClick(item)} className="bg-white rounded-xl p-2.5 text-center border border-gray-100 cursor-pointer hover:shadow-md hover:border-primary/40 transition-all">
              <div className="w-16 h-16 rounded-full bg-primary/5 mx-auto mb-2 flex items-center justify-center text-3xl">{item.e}</div>
              <div className="text-xs font-semibold text-gray-700 mb-0.5 leading-tight">{item.name}</div>
              <div className="text-xs font-bold text-primary">${item.price}.00</div>
            </div>
          ))}
        </div>
      </div>
      {childrenModal && (
        <div className="absolute inset-0 bg-black/35 flex items-center justify-center z-50 rounded-xl">
          <div className="bg-white rounded-2xl p-5 w-72">
            <div className="text-sm font-black text-gray-800 mb-4">{childrenModal.item.name}</div>
            <div className="space-y-2">
              {childrenModal.item.children.map((child, i) => (
                <button
                  key={i}
                  onClick={() => {
                    addToCart(child);
                    setChildrenModal(null);
                  }}
                  className="w-full flex justify-between items-center px-3 py-2.5 border border-gray-200 rounded-lg hover:border-primary/40 hover:bg-primary/5 transition-colors"
                >
                  <span className="text-sm font-semibold text-gray-700">{child.name}</span>
                  <span className="text-sm font-bold text-primary">${child.price}.00</span>
                </button>
              ))}
            </div>
            <button onClick={() => setChildrenModal(null)} className="w-full mt-3 py-2 text-xs text-gray-400 hover:text-gray-600">
              إلغاء
            </button>
          </div>
        </div>
      )}
      <CartPanel cart={cart} setCart={setCart} discount={discount} setDiscount={setDiscount} onProceed={onProceed} onHold={onHold} />
    </div >
  );
}

function CustomersScreen({ cart, setCart, discount, setDiscount, onProceed, onHold }) {
  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
        <div className="flex justify-between items-center mb-3">
          <span className="text-base font-black text-gray-800">Customers</span>
          <button className="px-3.5 py-2 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary/90 transition-colors">+ Add New Customer</button>
        </div>
        <div className="relative mb-3">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">🔍</span>
          <input className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-xs outline-none bg-white focus:border-primary/40" placeholder="Search Customers..." />
        </div>
        <div className="bg-white rounded-xl p-3.5 border border-gray-100 mb-3 flex items-start gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-2xl flex-shrink-0">👨</div>
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-black text-gray-800">Vincent Lobo</span>
              <span className="text-xs text-gray-400">#542845</span>
            </div>
            <div className="text-xs text-gray-400">vincent.lobo@gmail.com</div>
            <div className="text-xs text-gray-400 mb-2">+1 xxxxxxxxxx</div>
            <div className="flex gap-1.5">
              <button className="px-2.5 py-1 border border-gray-200 rounded text-xs text-gray-500 hover:bg-gray-50">✏ Edit</button>
              <button className="px-2.5 py-1 border border-gray-200 rounded text-xs text-red-400 hover:bg-red-50">🗑 Delete</button>
            </div>
          </div>
          <button className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold flex-shrink-0 hover:bg-primary/90 transition-colors">Remove</button>
        </div>
        <div className="text-sm font-bold text-gray-700 mb-2">Recent Customers</div>
        {CUSTOMERS.map((c, i) => (
          <div key={i} className="bg-white rounded-lg px-3 py-2.5 mb-1.5 flex items-center gap-2.5 border border-gray-100 cursor-pointer hover:border-primary/30 transition-colors">
            <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center text-base">👤</div>
            <div>
              <div className="text-xs font-semibold text-gray-800">{c.name}</div>
              <div className="text-xs text-gray-400">{c.email}</div>
            </div>
            <div className="ml-auto text-xs text-gray-400">{c.date}</div>
          </div>
        ))}
      </div>
      <CartPanel cart={cart} setCart={setCart} discount={discount} setDiscount={setDiscount} onProceed={onProceed} onHold={onHold} t={(key) => key} />
    </div>
  );
}

function OrdersScreen() {
  const [activeTab, setActiveTab] = useState("Order History");
  const TABS = ["Order History", "Order On Hold", "Offline Order"];
  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
        <div className="flex border-b border-gray-200 mb-3">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-3.5 py-2 text-xs border-b-2 transition-colors
                ${activeTab === t ? "border-primary text-primary font-bold" : "border-transparent text-gray-400 hover:text-gray-600"}`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="relative mb-3">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">🔍</span>
          <input className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-xs outline-none bg-white focus:border-primary/40" placeholder="Search Order Id or Customers." />
        </div>
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-3 px-3 py-2 bg-gray-50 border-b border-gray-100">
            {["Order ID", "Date", "Total Sales"].map((h) => (
              <span key={h} className="text-xs font-bold text-gray-400">
                {h}
              </span>
            ))}
          </div>
          {Array(10)
            .fill("")
            .map((_, i) => (
              <div key={i} className="grid grid-cols-3 px-3 py-2.5 border-b border-gray-50 cursor-pointer hover:bg-primary/5 transition-colors">
                <span className="text-xs text-gray-600">#4587198751</span>
                <span className="text-xs text-gray-600">28 Feb 2024, 12:30</span>
                <span className="text-xs text-gray-600">$345.29</span>
              </div>
            ))}
        </div>
      </div>
      {/* Order Detail */}
      <div className="bg-white border-l border-gray-100 p-4 flex flex-col flex-shrink-0" style={{ width: 272 }}>
        <div className="text-sm font-black text-gray-800 mb-0.5">Order ID #0542145</div>
        <div className="text-xs text-gray-400 mb-0.5">Vincent Lobo</div>
        <div className="text-xs text-gray-400 mb-3">Dine-In · T-34</div>
        <div className="flex-1 overflow-y-auto border-t border-gray-100 pt-2">
          {[
            { qty: 1, name: "Schezwan Egg Noodles", price: "$25.00" },
            { qty: 2, name: "Spicy Shrimp Soup", price: "$40.00", note: "Medium- Half Grilled", disc: "10% Disc · $10 · $50.00" },
            { qty: 1, name: "Fried Basil", price: "$25.00" },
          ].map((item, i) => (
            <div key={i} className="flex justify-between mb-2.5 text-xs">
              <div className="flex-1">
                <span className="text-gray-400 mr-1">{item.qty}</span>
                <span className="text-gray-700">{item.name}</span>
                {item.note && <div className="text-gray-400 mt-0.5">{item.note}</div>}
                {item.disc && <div className="text-primary/70">{item.disc}</div>}
              </div>
              <div className="font-bold text-gray-800 flex-shrink-0">{item.price}</div>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-100 pt-2.5 mt-2">
          {[
            ["Subtotal", "$200.00"],
            ["Tax", "$45.00"],
            ["Discount", "-$50.00"],
          ].map(([l, v]) => (
            <div key={l} className="flex justify-between text-xs text-gray-500 mb-1">
              <span>{l}</span>
              <span>{v}</span>
            </div>
          ))}
          <div className="flex justify-between text-sm font-black text-gray-800 my-1.5">
            <span>Grand Total</span>
            <span>$195.00</span>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Cash</span>
            <span>$195.00</span>
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>Balance</span>
            <span>$0.00</span>
          </div>
        </div>
        <button className="w-full mt-3 mb-4 py-2.5 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 transition-colors">🖨 Print Invoice</button>
      </div>
    </div>
  );
}

function CashierScreen({ onBack, onConfirm }) {
  const [npRaw, setNpRaw] = useState("20000");
  const [activePayTab, setActivePayTab] = useState("Cash");

  const dollars = (parseInt(npRaw) / 100).toFixed(2);
  const payable = 195;
  const balance = parseInt(npRaw) / 100 - payable;

  const npKey = (k) =>
    setNpRaw((prev) => {
      if (k === "del") return prev.length > 1 ? prev.slice(0, -1) : "0";
      if (k === "00") return prev + "00";
      return prev === "0" ? k : prev + k;
    });

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left - Order Summary */}
      <div className="flex-1 p-5 overflow-y-auto bg-gray-50 flex flex-col gap-3">
        <button onClick={onBack} className="flex items-center gap-1 text-primary text-sm font-bold w-fit">
          <ChevronLeft size={14} /> Back
        </button>

        <div>
          <div className="text-sm font-black text-gray-800">Order ID #0542145</div>
          <div className="text-xs text-gray-400 mt-0.5">Vincent Lobo · Dine-In · T-34</div>
        </div>

        {/* Items Card */}
        <div className="bg-white rounded-xl border border-gray-100 p-3.5">
          {/* items... */}
          <div className="pt-2.5 mt-1 border-t border-gray-100 flex flex-col gap-1.5">
            {[
              ["Subtotal", "$200.00"],
              ["Tax", "$45.00"],
              ["Discount", "-$50.00"],
            ].map(([l, v]) => (
              <div key={l} className="flex justify-between text-xs text-gray-500">
                <span>{l}</span>
                <span>{v}</span>
              </div>
            ))}
            <div className="flex justify-between text-sm font-black text-gray-800 pt-1.5 border-t border-gray-100">
              <span>Grand Total</span>
              <span>$195.00</span>
            </div>
          </div>
        </div>

        {/* Credit/Balance */}
        <div className="bg-white rounded-xl border border-gray-100 p-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Credit</span>
            <span>${dollars}</span>
          </div>
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-gray-500">Balance</span>
            <span className={balance >= 0 ? "text-green-600" : "text-red-500"}>
              {balance >= 0 ? "+" : ""}
              {balance.toFixed(2)}
            </span>
          </div>
        </div>

        <Button size={"2xl"} onClick={() => onConfirm(activePayTab, dollars)}>
          <Check size={16} /> Confirm Payment
        </Button>
      </div>

      {/* Right - Numpad */}
      <div style={{ width: 450 }} className=" bg-white border-l border-gray-100 p-4 flex flex-col">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="text-xs text-gray-400 mb-0.5">Payable Amount</div>
            <div className="text-2xl font-black text-green-600">${payable.toFixed(2)}</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">VL</div>
            <div>
              <div className="text-xs font-bold text-gray-800">Vincent Lobo</div>
              <div className="text-xs text-gray-400">#542845</div>
            </div>
            <button className="text-gray-300">
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        <div className="flex border-b border-gray-100 mb-3">
          {["Cash", "Other Modes"].map((t) => (
            <button key={t} onClick={() => setActivePayTab(t)} className={`flex-1 py-2 text-sm border-b-2 transition-colors ${activePayTab === t ? "border-primary text-primary font-black" : "border-transparent text-gray-400"}`}>
              {t}
            </button>
          ))}
        </div>

        <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-right text-2xl font-black text-gray-800 mb-3">${dollars}</div>

        <div className="grid grid-cols-3 gap-1.5 flex-1">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "00", "0", "del"].map((k) => (
            <button key={k} onClick={() => npKey(k)} className={`rounded-lg text-base font-bold border transition-colors ${k === "del" ? "bg-primary/5 text-primary border-primary/20 hover:bg-primary/10" : "bg-white text-gray-700 border-gray-100 hover:bg-gray-50"}`} style={{ minHeight: 44 }}>
              {k === "del" ? <Delete size={16} className="mx-auto" /> : k}
            </button>
          ))}
        </div>

        <button onClick={onBack} className="mt-2 py-2.5 bg-gray-100 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-200">
          Cancel
        </button>
      </div>
    </div>
  );
}

// Table Card Component
function TableCard({ table, selected, onClick }) {
  const STATUS_COLOR = { vacant: "bg-green-500", occupied: "bg-red-500", hold: "bg-blue-500" };

  return (
    <div
      onClick={onClick} // border الكارد المختار
      className={`bg-white rounded-xl overflow-hidden cursor-pointer transition-all border h-fit 
  ${selected ? "border-primary border-2" : "border-gray-100 hover:border-primary/30"}`}
    >
      {" "}
      <div className="p-4 flex items-center justify-center">
        <div className="flex flex-col items-center">
          {/* Top chairs */}
          <div className="flex gap-2 mb-1">
            <div className="h-2.5 w-24 bg-gray-300 rounded-full" />
          </div>

          {/* Middle row */}
          <div className="flex items-center gap-1">
            {/* Left chairs */}
            <div className="flex flex-col gap-2">
              <div className="w-2.5 h-24 bg-gray-300 rounded-full" />
            </div>

            {/* Table surface */}
            <div className="w-40 h-36 bg-gray-200 rounded-xl flex flex-col items-center justify-center">
              <span className="text-sm font-black text-gray-700">{table.id}</span>
              {table.order && <span className="text-[10px] font-bold text-gray-500">{table.order}</span>}
            </div>

            {/* Right chairs */}
            <div className="flex flex-col gap-2">
              <div className="w-2.5 h-24 bg-gray-300 rounded-full" />
            </div>
          </div>

          {/* Bottom chairs */}
          {/* Bottom chairs */}
          <div className="flex gap-2 mt-1">
            <div className="h-2.5 w-24 bg-gray-300 rounded-full" />
          </div>
        </div>
      </div>
      <div className={`h-1.5 ${STATUS_COLOR[table.status]}`} />
    </div>
  );
}

function TablesScreen() {
  const TABLES = [
    { id: "T43", status: "vacant", order: null },
    { id: "T45", status: "hold", order: "#457841" },
    { id: "T46", status: "vacant", order: null },
    { id: "T47", status: "occupied", order: "#457875" },
    { id: "T51", status: "occupied", order: "#457894" },
    { id: "T52", status: "vacant", order: null },
  ];

  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "vacant" | "occupied" | "disabled">("all");

  const filtered = TABLES.filter((t) => {
    if (filter === "all") return true;
    if (filter === "vacant") return t.status === "vacant";
    if (filter === "occupied") return t.status === "occupied";
    return false;
  });

  return (
    <div className="flex-1 flex flex-col bg-gray-100 overflow-hidden">
      {/* Filter */}
      <div className="bg-white border-b border-gray-100 p-3 flex flex-col gap-2.5">
        <Tabs value={filter} onValueChange={(val) => setFilter(val as any)}>
          <TabsList className="bg-transparent gap-2 p-0">
            <TabsTrigger value="all" className="rounded-lg border border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none! text-gray-500 text-xs">
              All Tables
            </TabsTrigger>
            <TabsTrigger value="vacant" className="rounded-lg border border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none! text-gray-500 text-xs">
              Vacant
            </TabsTrigger>
            <TabsTrigger value="occupied" className="rounded-lg border border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none! text-gray-500 text-xs">
              Occupied
            </TabsTrigger>
            <TabsTrigger value="disabled" className="rounded-lg border border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none! text-gray-500 text-xs">
              Disabled
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-primary">
            <div className="w-4 h-4 rounded-full border-2 border-primary flex items-center justify-center text-[10px] font-bold">i</div>
            Tables visible are for 4–6 guests occupancy.
          </div>
          <button className="text-xs font-bold text-primary">Show all tables</button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-5 gap-3 p-4 flex-1 overflow-y-auto">
        {filtered.map((t) => (
          <TableCard key={t.id} table={t} selected={selectedTable === t.id} onClick={() => setSelectedTable(selectedTable === t.id ? null : t.id)} />
        ))}
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {[
            ["bg-red-500", "Occupied"],
            ["bg-blue-500", "Order on hold"],
            ["bg-green-500", "Vacant"],
          ].map(([c, l]) => (
            <div key={l} className="flex items-center gap-1.5 text-xs text-gray-500">
              <div className={`size-6 rounded-full ${c}`} />
              {l}
            </div>
          ))}
        </div>
        {selectedTable && (
          <div className="flex items-center gap-3">
            <div>
              <div className="text-sm font-black text-gray-800">Table {selectedTable}</div>
              <div className="text-xs text-gray-400">{TABLES.find((t) => t.id === selectedTable)?.order ?? "Vacant"}</div>
            </div>
            <Button size={"xl"}>Select & Place Order</Button>
            {/* <button className="bg-orange-500 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-orange-600"></button> */}
          </div>
        )}
      </div>
    </div>
  );
}

function SuccessScreen({ method, amount, onNewOrder }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 gap-3">
      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-3xl">✅</div>
      <div className="text-lg font-black text-green-600">Payment Successful!</div>
      <div className="text-sm text-gray-500">Order #0542145 · $195.00 received</div>
      <div className="text-sm font-bold text-primary">
        {method} · ${amount} paid
      </div>
      <button onClick={onNewOrder} className="mt-2 px-8 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors">
        + New Order
      </button>
    </div>
  );
}

function HoldListScreen({ heldCarts, onRestore, onNewOrder }) {
  return (
    <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
      <div className="flex justify-between items-center mb-4">
        <span className="text-base font-black text-gray-800">⏸ On Hold Carts</span>
        <button onClick={onNewOrder} className="px-3.5 py-2 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary/90 transition-colors">
          + New Order
        </button>
      </div>
      {heldCarts.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">No held carts yet</div>
      ) : (
        heldCarts.map((h, i) => (
          <div key={i} className="bg-white rounded-xl p-3.5 border-2 border-dashed border-primary/30 mb-2.5 flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-gray-800">
                🛒 {h.items.length} item{h.items.length !== 1 ? "s" : ""} · ${h.total.toFixed(2)}
              </div>
              <div className="text-xs text-gray-400 mt-0.5">
                Note: {h.note} · Held at {h.time}
              </div>
            </div>
            <button onClick={() => onRestore(i)} className="px-3.5 py-1.5 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary/90 transition-colors">
              Restore
            </button>
          </div>
        ))
      )}
    </div>
  );
}

function PlaceholderScreen({ label }) {
  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50">
      <div className="text-center text-gray-400">
        <div className="text-4xl mb-3">🚧</div>
        <div className="font-bold text-sm">{label} — Coming Soon</div>
      </div>
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────
export default function RestroPos() {
  const { t, direction } = useLanguage();
  const [screen, setScreen] = useState("home");
  const [cart, setCart] = useState(INITIAL_CART);
  const [discount, setDiscount] = useState(0);
  const [heldCarts, setHeldCarts] = useState([]);
  const [showHoldModal, setShowHoldModal] = useState(false);
  const [successInfo, setSuccessInfo] = useState({ method: "Cash", amount: "0.00" });

  const handleHold = () => setShowHoldModal(true);

  const confirmHold = (note) => {
    const { pay } = calcTotals(cart, discount);
    setHeldCarts((prev) => [...prev, { note, items: [...cart], total: pay, time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) }]);
    setCart([]);
    setDiscount(0);
    setShowHoldModal(false);
    setScreen("hold-list");
  };

  const restoreHold = (idx) => {
    setCart([...heldCarts[idx].items]);
    setHeldCarts((prev) => prev.filter((_, i) => i !== idx));
    setDiscount(0);
    setScreen("home");
  };

  const handleConfirmPayment = (method, amount) => {
    setSuccessInfo({ method, amount });
    setCart([]);
    setDiscount(0);
    setScreen("success");
  };
  // ── في RestroPos ──
  const [orderType, setOrderType] = useState<"takeaway" | "dine-in" | "delivery">("takeaway");
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [selectedDelivery, setSelectedDelivery] = useState<string | null>(null);

  const TABLES = ["T-01", "T-02", "T-03", "T-04", "T-05", "T-06", "T-07", "T-08"];
  const DELIVERY_COMPANIES = ["Talabat", "Careem", "Noon Food", "Deliveroo"];

  const [networkSpeed, setNetworkSpeed] = useState<"slow" | "medium" | "fast">("fast");

  useEffect(() => {
    const connection = (navigator as any).connection;
    if (!connection) return;

    const update = () => {
      const mbps = connection.downlink;
      if (mbps < 1) setNetworkSpeed("slow");
      else if (mbps < 5) setNetworkSpeed("medium");
      else setNetworkSpeed("fast");
    };

    update();
    connection.addEventListener("change", update);
    return () => connection.removeEventListener("change", update);
  }, []);

  return (
    <div className="relative flex h-screen bg-gray-100 overflow-hidden rounded-xl border border-gray-200" style={{ minHeight: 600 }}>
      {showHoldModal && <HoldModal onClose={() => setShowHoldModal(false)} onConfirm={confirmHold} />}

      {/* ── SIDEBAR ── */}
      <div className="w-16 bg-white border-r border-gray-100 flex flex-col items-center py-3 gap-0.5 shrink-0">
        <div className="flex-1" />

        {NAV_ITEMS.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setScreen(id)}
            className={`py-2.5 rounded-xl flex flex-col items-center gap-1
              transition-all duration-200 ease-in-out
              ${screen === id ? "bg-primary/10 border border-primary/20" : "bg-transparent hover:bg-primary/5 border border-transparent"}`}
            style={{ width: 52 }}
          >
            <Icon size={18} strokeWidth={screen === id ? 2.5 : 1.8} className={`transition-colors duration-200 ${screen === id ? "text-primary" : "text-gray-300"}`} />
            <span className={`transition-colors duration-200 ${screen === id ? "text-primary font-bold" : "text-gray-300"}`} style={{ fontSize: 9 }}>
              {label}
            </span>
          </button>
        ))}

        <div className="flex-1" />

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-primary/20 mb-1">
          <img src="https://i.pravatar.cc/32" alt="user" className="w-full h-full object-cover"
            onError={e => { const target = e.target as HTMLImageElement; if (target.style) target.style.display = "none"; if (target.parentElement) target.parentElement.innerHTML = '<div style="width:100%;height:100%;background:#f3f4f6;display:flex;align-items:center;justify-content:center;font-size:14px">👤</div>'; }} />
        </div>

        {/* Logout */}
        <button className="flex flex-col items-center gap-0.5 py-2 hover:bg-primary/5 rounded-xl border border-transparent transition-all duration-200" style={{ width: 52 }}>
          <LogOut size={16} strokeWidth={1.8} className="text-primary/30" />
          <span className="text-primary/40" style={{ fontSize: 9 }}>
            Logout
          </span>
        </button>
      </div>

      {/* ── MAIN ── */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Topbar */}
        <div className="h-14 bg-white border-b border-gray-100 flex items-center px-5 gap-4 flex-shrink-0">
          <span className="text-base font-black text-gray-900 whitespace-nowrap mr-2">Restro POS</span>
          <div className="relative flex-1">
            <input className="w-full pl-4 pr-10 py-2 border border-gray-200 rounded-xl text-sm outline-none bg-white focus:border-primary/40 text-gray-500" placeholder="Search products....." />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
            </span>
          </div>
          <button className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" />
            </svg>
          </button>
          <button className="text-green-500 hover:text-green-600 transition-colors">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M5 12.55a11 11 0 0 1 14.08 0" /><path d="M1.42 9a16 16 0 0 1 21.16 0" />
              <path d="M8.53 16.11a6 6 0 0 1 6.95 0" /><circle cx="12" cy="20" r="1" fill="currentColor" />
            </svg>
          </button>

          <div className="flex items-center gap-1">
            <span className={`text-xs font-bold ${networkSpeed === "slow" ? "text-red-500" : networkSpeed === "medium" ? "text-yellow-500" : "text-green-500"}`}>{networkSpeed === "slow" ? "Slow" : networkSpeed === "medium" ? "Medium" : "Fast"}</span>
            <button className={networkSpeed === "slow" ? "text-red-500" : networkSpeed === "medium" ? "text-yellow-500" : "text-green-500"}>
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M5 12.55a11 11 0 0 1 14.08 0" strokeOpacity={networkSpeed === "slow" ? 0.3 : 1} />
                <path d="M1.42 9a16 16 0 0 1 21.16 0" strokeOpacity={networkSpeed === "fast" ? 1 : 0.3} />
                <path d="M8.53 16.11a6 6 0 0 1 6.95 0" strokeOpacity={networkSpeed !== "slow" ? 1 : 0.3} />
                <circle cx="12" cy="20" r="1" fill="currentColor" />
              </svg>
            </button>
          </div>

          {/* ── ضيف هنا بدل Select Table ── */}
          <div className="flex items-center gap-2 shrink-0">
            <ComboboxField
              items={[
                { label: "سفري", value: "takeaway" },
                { label: "محلي", value: "dine-in" },
                { label: "توصيل", value: "delivery" }
              ]}
              value={orderType}
              onValueChange={(val: any) => {
                setOrderType(val);
                setSelectedTable(null);
                setSelectedDelivery(null);
              }}
            />

            {orderType === "dine-in" && (
              <ComboboxField
                items={TABLES}
                value={selectedTable ?? ""}
                onValueChange={setSelectedTable}
                placeholder="اختر الطاولة"
              />
            )}

            {orderType === "delivery" && (
              <ComboboxField
                items={DELIVERY_COMPANIES}
                value={selectedDelivery ?? ""}
                onValueChange={setSelectedDelivery}
                placeholder="شركة التوصيل"
              />
            )}
          </div>
        </div>
        {/* Screen Content */}
        <div className="flex flex-1 overflow-hidden">
          {screen === "home" && <HomeScreen cart={cart} setCart={setCart} discount={discount} setDiscount={setDiscount} onProceed={() => setScreen("cashier")} onHold={handleHold} />}
          {screen === "customers" && <CustomersScreen cart={cart} setCart={setCart} discount={discount} setDiscount={setDiscount} onProceed={() => setScreen("cashier")} onHold={handleHold} />}
          {screen === "orders" && <OrdersScreen />}
          {screen === "cashier" && <CashierScreen onBack={() => setScreen("home")} onConfirm={handleConfirmPayment} />}
          {screen === "success" && <SuccessScreen method={successInfo.method} amount={successInfo.amount} onNewOrder={() => setScreen("home")} />}
          {screen === "hold-list" && <HoldListScreen heldCarts={heldCarts} onRestore={restoreHold} onNewOrder={() => setScreen("home")} />}
          {screen === "tables" && <PlaceholderScreen label="Tables" />}
          {screen === "reports" && <PlaceholderScreen label="Reports" />}
          {screen === "settings" && <PlaceholderScreen label="Settings" />}
        </div>
      </div>
    </div>
  );
}
