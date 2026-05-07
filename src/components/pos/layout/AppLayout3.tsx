import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { usePos } from "@/context/PosContext";

// ─── Page imports ─────────────────────────────────────────────────────────────
// import CustomersPage from "@/pages/CustomersPage";
// import TablesPage from "@/pages/TablesPage";
// import OrdersPage from "@/pages/OrdersPage";
// import CashierPage from "@/pages/CashierPage";
// import SuccessPage from "@/pages/SuccessPage";
// import HoldListPage from "@/pages/HoldListPage";
// import PlaceholderPage from "@/pages/PlaceholderPage";
import RightPanel from "./RightPanel";
import HoldModal from "../modals/HoldModal";
import HomePage from "../pages/HomePage";
import TablesPage from "../pages/TablesPage";
import OrdersPage from "../pages/Orderspage";
import CashierPage from "../pages/Cashierpage";
import { PlaceholderPage } from "../pages/PlaceholderPage";
import { ToastContainer } from "react-toastify";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect, useState } from "react";
import HomePage2 from "../pages/HomePage2";
import RightPanel2 from "./RightPanel2";
import Topbar2 from "./Topbar2";
import { initQZ } from "@/lib/qzService";
import { useGetAllWareHouses } from "@/features/wareHouse/hooks/useGetAllWareHouses";
import CartPanel2 from "../cart/CartPanel2";
import { useBranchStore } from "@/store/employeeStore";
import CartPanel3 from "../cart/CartPanel3";
import Topbar3 from "./Topbar3";
import { useParams } from "react-router-dom";
import { useGetPurchaseOrderById } from "@/features/purchases/hooks/useGetPurchaseOrderById";
import { usePurchaseStore } from "@/features/pos/store/usePurchaseStore";
import { useGetAllSuppliers } from "@/features/suppliers/hooks/useGetAllSuppliers";
import { useGetAllTaxes } from "@/features/taxes/hooks/useGetAllTaxes";
import { useGetAllUnits } from "@/features/units/hooks/useGetAllUnits";
import { useGetAllProducts } from "@/features/products/hooks/useGetAllProducts";

export default function AppLayout3() {
  const { id } = useParams();
  const { data: purchaseOrder } = useGetPurchaseOrderById(Number(id));
  const { setCart, setSelectedSupplier, setDiscount, setOrderNote, resetCart } = usePurchaseStore();
  const { data: suppliers } = useGetAllSuppliers();
  const { data: taxes } = useGetAllTaxes();
  const { data: units } = useGetAllUnits({});
  const { data: products } = useGetAllProducts({ page: 1, limit: 10000 });

  useEffect(() => {
    const init = async () => {
      try {
        await initQZ();
      } catch (err) {
        console.error("QZ init error:", err);
      }
    };

    init();
    
    // Reset cart when component unmounts
    return () => {
      resetCart();
    };
  }, []);

  useEffect(() => {
    if (purchaseOrder && suppliers && taxes && units && products) {
      const supplier = suppliers.items.find((s) => s.id === purchaseOrder.supplierId);
      if (supplier) setSelectedSupplier(supplier);
      
      setOrderNote(purchaseOrder.notes || "");
      
      const mappedItems = purchaseOrder.items.map((item) => {
        const tax = taxes.find((t) => t.id === item.taxId);
        const unit = units.items.find((u) => u.id === item.unitId);
        const product = products.items.find((p) => p.id === item.productId);
        
        return {
          productId: item.productId,
          name: product?.productNameAr || "", 
          price: item.unitPrice,
          qty: item.quantity,
          taxId: item.taxId,
          taxamount: (item.unitPrice * (tax?.amount || 0)) / 100,
          taxPercentage: tax?.amount,
          taxCalculation: 2, 
          unitId: item.unitId,
          itemDiscount: item.discountValue ? { type: "flat" as const, value: item.discountValue } : item.discountPercentage ? { type: "pct" as const, value: item.discountPercentage } : null,
          isNew: false
        };
      });
      
      setCart(mappedItems);
    }
  }, [purchaseOrder, suppliers, taxes, units, products]);
  return (
    <div className="relative flex h-screen bg-gray-100 overflow-hidden rounded-xl border border-gray-200" style={{ minHeight: 600 }}>
      <ToastContainer pauseOnHover={false} />

      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Topbar3 />

        <TooltipProvider>
          <div className="flex flex-1 flex-col overflow-hidden p-4  space-y-5">
            <CartPanel3 />
          </div>
        </TooltipProvider>
      </div>
    </div>
  );
}
