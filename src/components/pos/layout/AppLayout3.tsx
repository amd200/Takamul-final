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

export default function AppLayout3() {
  useEffect(() => {
    const init = async () => {
      try {
        await initQZ();
      } catch (err) {
        console.error("QZ init error:", err);
      }
    };

    init();
  }, []);
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
