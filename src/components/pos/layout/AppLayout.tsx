import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

import RightPanel from "./RightPanel";
import HoldModal from "../modals/HoldModal";
import HomePage from "../pages/HomePage";
import TablesPage from "../pages/TablesPage";
import OrdersPage from "../pages/Orderspage";
import CashierPage from "../pages/Cashierpage";
import { PlaceholderPage } from "../pages/PlaceholderPage";
import { ToastContainer } from "react-toastify";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ItemNumPadPanel } from "../cart/Itemnumpadpanel";
import { useEffect } from "react";
import { initQZ } from "@/lib/qzService";
import { usePosStore } from "@/features/pos/store/usePosStore";
import { useBranchStore } from "@/store/employeeStore";
import { useGetAllCustomers } from "@/features/customers/hooks/useGetAllCustomers";

function PageContent() {
  const { screen } = usePosStore();

  switch (screen) {
    case "home":
      return <HomePage />;
    case "cashier":
      return <CashierPage />;
    case "tables":
      return <TablesPage />;
    case "orders":
      return <OrdersPage />;
    case "settings":
      return <PlaceholderPage label="Settings" />;
    default:
      return <PlaceholderPage label="Coming Soon" />;
  }
}

export default function AppLayout() {
  const { setScreen, resetCart } = usePosStore();
  const { data: customers } = useGetAllCustomers();

  useEffect(() => {
    setScreen("home");
    resetCart(customers);
  }, []);

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
    <div
      className="relative flex h-screen overflow-hidden py-2 bg-sidebar
  [.light_&]:bg-[#000052] 
  [.dark_&]:bg-[#000052]
"
    >
      <ToastContainer pauseOnHover={false} />
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden min-w-0 bg-sidebar rounded-tr-[28px] rounded-lg">
        <div className="flex flex-1 overflow-hidden">
          <TooltipProvider>
            <div className="flex-1 overflow-y-auto min-w-0 flex flex-col bg-[var(--bg-main)]">
              <div className="rounded-tr-[28px] overflow-hidden bg-[var(--bg-main)]">
                <Topbar />
              </div>
              <PageContent />
            </div>
            <RightPanel />
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
}
