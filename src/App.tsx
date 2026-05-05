import { Routes, Route } from "react-router-dom";
import Login from "@/pages/Login";
import ForgotPassword from "@/pages/ForgotPassword";
import VerifyOTP from "@/pages/VerifyOTP";
import ResetPassword from "@/pages/ResetPassword";
import Dashboard from "@/pages/Dashboard";
import ImportProducts from "@/pages/ImportProducts";
import A4Sales from "@/pages/A4Sales";
import CreateA4Invoice from "@/pages/CreateA4Invoice";

import AllSales from "@/pages/AllSales";
import QuotesList from "@/pages/QuotesList";

import ViewQuote from "@/pages/ViewQuote";
import CreateSalesInvoice from "@/pages/CreateSalesInvoice";
import Units from "@/pages/Units";
import QuantityAdjustments from "@/pages/QuantityAdjustments";
import AddQuantityAdjustment from "@/pages/AddQuantityAdjustment";
import ImportQuantityAdjustment from "@/pages/ImportQuantityAdjustment";
import Layout from "@/components/layout/Layout";
import ReturnSale from "@/pages/ReturnSale";
import POS from "@/pages/POS";
import POSInvoices from "@/pages/POSInvoices";
import POSInvoiceDetails from "@/pages/POSInvoiceDetails";
import ReturnPOSSale from "@/pages/ReturnPOSSale";
import GiftCards from "@/pages/GiftCards";
import Deliveries from "@/pages/Deliveries";
import PurchasesList from "@/pages/PurchasesList";
import EditPurchase from "@/pages/EditPurchase";
import AddPurchaseCSV from "@/pages/AddPurchaseCSV";
import CustomersList from "@/pages/CustomersList";
import SuppliersList from "@/pages/SuppliersList";

import AddTaxInvoice from "@/pages/AddTaxInvoice";
import AddSimplifiedTaxInvoice from "@/pages/AddSimplifiedTaxInvoice";
import ImportSales from "@/pages/ImportSales";
import ViewQuantityAdjustment from "@/pages/ViewQuantityAdjustment";
import CategoriesList from "./pages/CategoriesList";
import Additions from "./pages/Additions";
import AddProduct from "./pages/AddProduct";
import ProductsList from "./pages/ProductsList";

// Users
import AddUser from "@/pages/AddUser";
import EditUser from "@/pages/EditUser";
import UsersList from "@/pages/UsersList";
import UserGroups from "@/pages/UserGroups";
import InvoiceDevices from "@/pages/InvoiceDevices";

// Settings
import Groups from "@/pages/Groups";
import GroupPermissions from "@/pages/GroupPermissions";
import ExternalTransfersList from "@/pages/ExternalTransfersList";
import InternalTransfersList from "@/pages/InternalTransfersList";
import SystemSettings from "@/pages/SystemSettings";
import SiteSettings from "@/pages/settings/SiteSettings";
import ItemsSettings from "@/pages/settings/ItemsSettings";
import SalesSettings from "@/pages/settings/SalesSettings";
import BarcodeSettings from "@/pages/settings/BarcodeSettings";
import EmailSettings from "@/pages/settings/EmailSettings";
import DeliveryCompanies from "@/pages/DeliveryCompanies";
import Currencies from "@/pages/Currencies";
import CategoryDiscount from "@/pages/CategoryDiscount";

import Tables from "@/pages/Tables";

import LowStockReport from "@/pages/reports/LowStockReport";
import StockBalanceReport from "@/pages/reports/StockBalanceReport";
import ItemMovementReport from "@/pages/reports/ItemMovementReport";
import PurchasesReport from "@/pages/reports/PurchasesReport";
import ItemSalesReport from "@/pages/reports/ItemSalesReport";
import SalesByInvoiceReport from "@/pages/reports/SalesByInvoiceReport";
import SalesByDayReport from "@/pages/reports/SalesByDayReport";
import PurchasesByInvoiceReport from "@/pages/reports/PurchasesByInvoiceReport";
import PurchasesByDayReport from "@/pages/reports/PurchasesByDayReport";
import ItemPurchasesReport from "@/pages/reports/ItemPurchasesReport";
import CustomerStatementReport from "@/pages/reports/CustomerStatementReport";
import SupplierStatementReport from "@/pages/reports/SupplierStatementReport";
import ExpensesDetailReport from "@/pages/reports/ExpensesDetailReport";
import ProfitReport from "@/pages/reports/ProfitReport";
import BestSellersChart from "@/pages/reports/BestSellersChart";
import ShiftsReport from "@/pages/reports/ShiftsReport";
import SalesReport from "@/pages/reports/SalesReport";
import ItemsReportsCategory from "@/pages/reports/ItemsReportsCategory";
import SalesReportsCategory from "@/pages/reports/SalesReportsCategory";
import PurchasesReportsCategory from "@/pages/reports/PurchasesReportsCategory";
import CustomersReportsCategory from "@/pages/reports/CustomersReportsCategory";
import SuppliersReportsCategory from "@/pages/reports/SuppliersReportsCategory";
import ExpensesReportsCategory from "@/pages/reports/ExpensesReportsCategory";
import ProfitsReportsCategory from "@/pages/reports/ProfitsReportsCategory";
import SalesReturnsReport from "@/pages/reports/SalesReturnsReport";
import EmployeeSalesReport from "@/pages/reports/EmployeeSalesReport";

import Revenues from "@/pages/revenues-and-expenses/Revenues";
import Expenses from "@/pages/revenues-and-expenses/Expenses";
import Items from "@/pages/revenues-and-expenses/ItemsList";

// Print Context
import { PrintProvider, usePrint } from "@/context/PrintContext";
import ThermalReceipt from "@/components/ThermalReceipt";
import TreasurysList from "./pages/TreasurysList";
import CreateQuote from "./pages/CreateQuote";
import CreatePurchaseInvoice from "./pages/CreatePurchasesInvoice";
import SupplierPaymentsList from "./pages/SupplierPaymentsList";
import CustomerCollectionsList from "./pages/CustomerCollectionsList";
import BranchesList from "./pages/BranchesList";
import AddBranch from "@/pages/AddBranch";
import WarehousesList from "./pages/WarehousesList";
import AppLayout from "./components/pos/layout/AppLayout";
import HomePage from "./components/pos/pages/HomePage";
import EmployeesList from "./pages/EmployeesList";
import ProtectedRoute from "./lib/ProtectedRoute";
import AppLayout2 from "./components/pos/layout/AppLayout2";
import CreateReturnSalesInvoice from "./pages/CreateReturnSalesInvoice";
import CreateReturnPurchasesInvoice from "./pages/CreateReturnPurchasesInvoice";
import PosSales from "./pages/PosSales";
import TableLayout from "./pages/AddRoles";
import PermissionsTree from "./pages/AddRoles";
import RolesPage from "./pages/RolesPage";
import SalesReturn from "./pages/SalesReturn";
import { useGetAllSettings } from "./features/settings/hooks/useGetAllSettings";
import POSDevicesList from "./pages/POSDevicesList";
import ShiftsList from "./pages/ShiftsList";
import CertificatesPosDevices from "./pages/CertificatesPosDevices";
import { useEffect } from "react";
import { authChannel } from "./utils/authChannel";
import { useAuthStore } from "./store/authStore";

function AppRoutes() {
  return (
    <>
      <div>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          {/* <Route path="/pos" element={<POSPage />} /> */}
          <Route path="/pos" element={<AppLayout />} />
          <Route path="/pos2" element={<AppLayout2 />} />

          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            {/* المنتجات */}
            <Route path="/products" element={<ProductsList />} />
            <Route path="/products/create" element={<AddProduct />} />
            <Route path="/products/edit/:id" element={<AddProduct />} />
            <Route path="/products/import" element={<ImportProducts />} />
            <Route path="/products/units" element={<Units />} />
            <Route path="/products/additions" element={<Additions />} />
            <Route path="/products/groups" element={<CategoriesList />} />
            <Route path="/products/quantity-adjustments" element={<QuantityAdjustments />} />
            <Route path="/products/quantity-adjustments/create" element={<AddQuantityAdjustment />} />
            <Route path="/products/quantity-adjustments/import" element={<ImportQuantityAdjustment />} />
            <Route path="/products/quantity-adjustments/edit/:id" element={<AddQuantityAdjustment />} />
            <Route path="/products/quantity-adjustments/:mode/:id" element={<AddQuantityAdjustment />} />

            {/* المبيعات */}
            <Route path="/sales/a4-invoices" element={<A4Sales />} />
            <Route path="/sales/a4-invoices/create" element={<CreateA4Invoice />} />
            <Route path="/sales/add-tax-invoice" element={<AddTaxInvoice />} />
            <Route path="/sales/add-simplified-tax-invoice" element={<AddSimplifiedTaxInvoice />} />
            <Route path="/sales/import-csv" element={<ImportSales />} />
            <Route path="/sales/create" element={<CreateSalesInvoice />} />
            <Route path="/sales/edit/:id" element={<CreateSalesInvoice />} />
            <Route path="/sales/all" element={<AllSales />} />
            <Route path="/sales/pos-invoices" element={<PosSales />} />
            <Route path="/sales/pos-invoices/:id" element={<POSInvoiceDetails />} />
            <Route path="/sales/:id" element={<POSInvoiceDetails />} />
            <Route path="/sales/pos-invoices/return/:id" element={<ReturnPOSSale />} />
            <Route path="/sales/gift-cards" element={<GiftCards />} />
            <Route path="/sales/deliveries" element={<Deliveries />} />
            <Route path="/sales/create-from-quote" element={<CreateSalesInvoice />} />
            <Route path="/sales/return" element={<SalesReturn />} />
            <Route path="/sales/return/view/:id" element={<CreateReturnSalesInvoice />} />
            <Route path="/sales/return/:id" element={<CreateReturnSalesInvoice />} />
            <Route path="/sales/pos" element={<POS />} />
            <Route path="/pos-devices" element={<POSDevicesList />} />
            <Route path="/certificatesPosDevices" element={<CertificatesPosDevices />} />
            {/* العروض */}
            <Route path="/quotes" element={<QuotesList />} />
            <Route path="/quotes/create" element={<CreateQuote />} />
            <Route path="/quotes/edit/:id" element={<CreateQuote />} />

            {/* المشتريات */}
            <Route path="/purchases" element={<PurchasesList />} />
            <Route path="/purchases/return" element={<CreateReturnPurchasesInvoice />} />
            <Route path="/purchases/create" element={<CreatePurchaseInvoice />} />
            <Route path="/purchases/edit/:id" element={<CreatePurchaseInvoice />} />
            <Route path="/purchases/import-csv" element={<AddPurchaseCSV />} />
            <Route path="/purchases/expenses" element={<Expenses />} />
            <Route path="/suppliers" element={<SuppliersList />} />
            <Route path="/suppliers/payments" element={<SupplierPaymentsList />} />
            <Route path="/expenses" element={<Expenses />} />

            {/* العملاء */}
            <Route path="/customers" element={<CustomersList />} />
            <Route path="/customers/collections" element={<CustomerCollectionsList />} />

            <Route path="/employyes" element={<EmployeesList />} />

            {/* المستخدمين */}
            <Route path="/users" element={<UsersList />} />
            <Route path="/users/groups" element={<UserGroups />} />
            <Route path="/users/create" element={<AddUser />} />
            <Route path="/users/edit/:id" element={<EditUser />} />
            <Route path="/users/pos-devices" element={<InvoiceDevices />} />
            <Route path="/add-roles" element={<PermissionsTree />} />
            <Route path="/roles" element={<RolesPage />} />
            <Route path="/roles/:id" element={<PermissionsTree />} />

            {/* الإعدادات */}
            <Route path="/settings/groups" element={<Groups />} />
            <Route path="/settings/group-permissions/:id" element={<GroupPermissions />} />
            <Route path="/treasurys" element={<TreasurysList />} />
            <Route path="/treasury/external-transfers" element={<ExternalTransfersList />} />
            <Route path="/treasury/internal-transfers" element={<InternalTransfersList />} />
            <Route path="/settings/system" element={<SystemSettings />} />
            <Route path="/settings/site" element={<SiteSettings />} />
            <Route path="/settings/items" element={<ItemsSettings />} />
            <Route path="/settings/sales" element={<SalesSettings />} />
            <Route path="/settings/barcode" element={<BarcodeSettings />} />
            <Route path="/settings/email" element={<EmailSettings />} />
            <Route path="/settings/delivery-companies" element={<DeliveryCompanies />} />
            <Route path="/settings/currencies" element={<Currencies />} />
            <Route path="/settings/category-discounts" element={<CategoryDiscount />} />
            <Route path="/settings/tables" element={<Tables />} />

            <Route path="/reports/low-stock" element={<LowStockReport />} />
            <Route path="/reports/stock-balance" element={<StockBalanceReport />} />
            <Route path="/reports/item-movement" element={<ItemMovementReport />} />
            <Route path="/reports/purchases" element={<PurchasesReport />} />
            <Route path="/reports/best-sellers" element={<BestSellersChart />} />
            <Route path="/reports/shifts" element={<ShiftsReport />} />
            <Route path="/shifts" element={<ShiftsList />} />
            {/* <Route path="/reports/customers" element={<CustomersReport />} /> */}
            {/* <Route path="/reports/customer-aging" element={<CustomerAgingReport />} /> */}

            <Route path="/reports/sales" element={<SalesReport />} />
            <Route path="/reports/item-sales" element={<ItemSalesReport />} />
            <Route path="/reports/sales-by-invoice" element={<SalesByInvoiceReport />} />
            <Route path="/reports/sales-by-day" element={<SalesByDayReport />} />
            <Route path="/reports/purchases-by-invoice" element={<PurchasesByInvoiceReport />} />
            <Route path="/reports/purchases-by-day" element={<PurchasesByDayReport />} />
            <Route path="/reports/item-purchases" element={<ItemPurchasesReport />} />
            <Route path="/reports/customer-statement" element={<CustomerStatementReport />} />
            <Route path="/reports/supplier-statement" element={<SupplierStatementReport />} />
            <Route path="/reports/expenses-detail" element={<ExpensesDetailReport />} />
            <Route path="/reports/profit" element={<ProfitReport />} />
            <Route path="/reports/item-movement" element={<ItemMovementReport />} />
            <Route path="/reports/sales-returns" element={<SalesReturnsReport />} />
            <Route path="/reports/employee-sales" element={<EmployeeSalesReport />} />

            {/* New Report Categories */}
            <Route path="/reports/category/items" element={<ItemsReportsCategory />} />
            <Route path="/reports/category/sales" element={<SalesReportsCategory />} />
            <Route path="/reports/category/purchases" element={<PurchasesReportsCategory />} />
            <Route path="/reports/category/customers" element={<CustomersReportsCategory />} />

            <Route path="/reports/category/suppliers" element={<SuppliersReportsCategory />} />
            <Route path="/reports/category/expenses" element={<ExpensesReportsCategory />} />
            <Route path="/reports/category/profits" element={<ProfitsReportsCategory />} />

            <Route path="/revenues" element={<Revenues />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/items" element={<Items />} />
            <Route path="/branches" element={<BranchesList />} />
            <Route path="/branches/create" element={<AddBranch />} />
            <Route path="/branches/edit/:id" element={<AddBranch />} />
            <Route path="/branches/:mode/:id" element={<AddBranch />} />
            <Route path="/warehouses" element={<WarehousesList />} />
          </Route>
        </Routes>
      </div>
    </>
  );
}

export default function App() {
  // useEffect(() => {
  //   const channel = new BroadcastChannel("auth");
  //   channel.onmessage = (e) => {
  //     if (e.data === "logout") {
  //       useAuthStore.getState().clearAuth();
  //       window.location.href = "/login";
  //     }
  //   };
  //   return () => channel.close();
  // }, []);

  useGetAllSettings();
  return (
    <PrintProvider>
      <AppRoutes />
    </PrintProvider>
  );
}
