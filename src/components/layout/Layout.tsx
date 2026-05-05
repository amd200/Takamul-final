import React, { useState } from "react";
import { useNavigate, useLocation, Outlet, Link } from "react-router-dom";
import { LayoutDashboard, ShoppingCart, Package, FileText, Users, Settings, ChevronDown, ChevronLeft, Menu, X, LogOut, Bell, Search, Globe, List, LayoutGrid, PlusCircle, Tag, SlidersHorizontal, Factory, RefreshCcw, Gift, Share2, CornerUpLeft, Plus, DollarSign, RefreshCw, Monitor, User, Truck, Landmark, Banknote, Briefcase, Building, CreditCard, Store, Percent, Upload, Coins, Link as LinkIcon, Folder, Wrench, Layers, Tags, Map, Grid3x3, Key, BarChart, Moon, Sun, Check, ArrowUpRight, ArrowLeftRight, HandCoins, Calculator, Shield, Barcode, Mail, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import { useSettingsStore } from "@/features/settings/store/settingsStore";
import Logo from "@/components/Logo";
import WelcomeBanner from "@/components/WelcomeBanner";
import LogoModal from "@/components/modals/LogoModal";
import { ToastContainer } from "react-toastify";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/authStore";
import { Permissions } from "@/lib/permissions";
import ChangePasswordDialog from "../modals/Changepassworddialog";
import { useLogout } from "@/features/auth/hooks/useLogout";
import { Toaster } from "../ui/sonner";

interface SidebarItemProps {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  hasSubmenu?: boolean;
  isOpen?: boolean;
  isSidebarOpen?: boolean;
  onClick?: () => void;
  path?: string;
}

interface SubmenuItemProps {
  label: string;
  icon: LucideIcon;
  path?: string;
  state?: any;
  onClick?: () => void;
}

const SidebarItem = ({ icon: Icon, label, active, hasSubmenu, isOpen, isSidebarOpen = true, onClick, path }: SidebarItemProps) => {
  const content = (
    <>
      <div className="flex items-center gap-4">
        <Icon size={24} />
        {isSidebarOpen && <span className="font-bold text-base tracking-wide">{label}</span>}
      </div>

      {hasSubmenu && isSidebarOpen && <ChevronLeft size={16} className={cn("transition-transform", isOpen && "-rotate-90")} />}
    </>
  );

  const commonClasses = cn("w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-200", active ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-md scale-[1.02]" : "text-[var(--text-main)] hover:bg-[var(--bg-main)] hover:text-[var(--primary)] hover:scale-[1.02]", !isSidebarOpen && "justify-center");

  if (path) {
    return (
      <Link
        to={path}
        onClick={(e) => {
          if (hasSubmenu) {
            e.preventDefault();
            onClick?.();
          } else {
            onClick?.();
          }
        }}
        className={commonClasses}
        title={!isSidebarOpen ? label : undefined}
      >
        {content}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={commonClasses} title={!isSidebarOpen ? label : undefined}>
      {content}
    </button>
  );
};

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { mutateAsync: logout } = useLogout();

  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  const { language, direction, setLanguage, t } = useLanguage();
  const systemSettings = useSettingsStore((s) => s.settings);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const [openNestedSubmenu, setOpenNestedSubmenu] = useState<string | null>(null);

  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);

  React.useEffect(() => {
    const path = location.pathname;
    if (path.startsWith("/products")) setOpenSubmenu("products");
    else if (path.startsWith("/sales") || path.startsWith("/return")) setOpenSubmenu("sales");
    else if (path.startsWith("/quotes")) setOpenSubmenu("quotes");
    else if (path.startsWith("/purchases")) setOpenSubmenu("purchases");
    else if (path.startsWith("/users") || path === "/pos-devices" || path === "/certificatesPosDevices" || path === "/roles" || path === "/employyes") setOpenSubmenu("users");
    else if (path.startsWith("/shifts")) setOpenSubmenu("shifts");
    else if (path.startsWith("/customers")) setOpenSubmenu("customers");
    else if (path.startsWith("/suppliers")) setOpenSubmenu("suppliers");
    else if (path.startsWith("/treasurys") || path.startsWith("/treasury")) setOpenSubmenu("treasurys");
    else if (path.startsWith("/branches")) setOpenSubmenu("branches");
    else if (path.startsWith("/warehouses")) setOpenSubmenu("warehouses");
    else if (path.startsWith("/expenses") || path.startsWith("/items")) setOpenSubmenu("revenues_and_expenses");
    else if (path.startsWith("/reports")) setOpenSubmenu("reports");
    else if (path.startsWith("/settings") || path === "/promotions") setOpenSubmenu("settings");
    else setOpenSubmenu(null);
  }, [location.pathname]);

  const headerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const userId = useAuthStore((s) => s.userId);
  const email = useAuthStore((s) => s.email);
  const userName = useAuthStore((s) => s.userName);
  const accessToken = useAuthStore((s) => s.accessToken);
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const hasAnyPermission = useAuthStore((s) => s.hasAnyPermission);
  const hasAllPermissions = useAuthStore((s) => s.hasAllPermissions);
  const permissions = useAuthStore((s) => s.permissions);

  const allReportPermissions = React.useMemo(() => [...Object.values(Permissions?.reports?.products || {}), ...Object.values(Permissions?.reports?.customers || {}), ...Object.values(Permissions?.reports?.suppliers || {}), ...Object.values(Permissions?.reports?.expenses || {}), ...Object.values(Permissions?.reports?.sales || {}), ...Object.values(Permissions?.reports?.purchases || {}), ...Object.values(Permissions?.reports?.profits || {})], []);

  const toggleSubmenu = (menu: string) => {
    if (!isSidebarOpen && !isMobile) {
      setIsSidebarOpen(true);
      setTimeout(() => setOpenSubmenu(menu), 150);
    } else {
      setOpenSubmenu(openSubmenu === menu ? null : menu);
    }
  };

  const toggleNestedSubmenu = (menu: string) => {
    setOpenNestedSubmenu(openNestedSubmenu === menu ? null : menu);
  };

  const showSidebarContent = isMobile ? true : isSidebarOpen;

  const closeAllMenus = () => {
    setActiveDropdown(null);
    setOpenSubmenu(null);
    setOpenNestedSubmenu(null);
    if (isMobile) setIsMobileMenuOpen(false);
  };

  const SubmenuItem = ({ label, icon: Icon, path, state, onClick }: SubmenuItemProps) => {
    const isActive = path ? location.pathname === path : false;

    const content = (
      <div className="flex items-center gap-2 w-full">
        <Icon size={16} className={cn(isActive ? "text-[var(--primary-foreground)]" : "text-[var(--text-main)] group-hover:text-[var(--primary)]")} />
        <span>{label}</span>
      </div>
    );

    const commonClasses = cn("w-full flex items-center justify-between p-2 text-sm rounded-md transition-colors group", isActive ? "bg-[var(--primary)] text-[var(--primary-foreground)]" : "text-[var(--text-main)] hover:text-[var(--primary)] hover:bg-[var(--bg-main)]");

    if (path) {
      return (
        <Link to={path} onClick={onClick} className={commonClasses}>
          {content}
        </Link>
      );
    }

    return (
      <button onClick={onClick} className={commonClasses}>
        {content}
      </button>
    );
  };

  const NestedSubmenu = ({ label, icon: Icon, children, isOpen, onToggle }: any) => {
    return (
      <div className="w-full">
        <button onClick={onToggle} className={cn("w-full p-2 text-sm text-[var(--text-main)] hover:text-[var(--primary)] rounded-md hover:bg-[var(--bg-main)] flex items-center justify-between transition-colors group", direction === "rtl" ? "text-right" : "text-left")}>
          <div className="flex items-center gap-2">
            <Icon size={16} className="text-[var(--text-main)] group-hover:text-[var(--primary)]" />
            <span>{label}</span>
          </div>
          <ChevronLeft size={14} className={cn("transition-transform text-[var(--text-main)] group-hover:text-[var(--primary)]", isOpen && "-rotate-90")} />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className={cn("overflow-hidden space-y-1 mt-1", direction === "rtl" ? "mr-4 border-r border-[var(--border)] pr-2" : "ml-4 border-l border-[var(--border)] pl-2")}>
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const handleThemeChange = (value: string) => {
    if (typeof setTheme === "function") {
      setTheme(value as any);
    }
    setActiveDropdown(null);
  };

  return (
    <div className="min-h-screen flex transition-colors duration-300 font-cairo" dir={direction}>
      <ToastContainer pauseOnHover={false} />
      <Toaster
        position="bottom-center"
        dir="rtl"
        style={{ fontFamily: "inherit" }}
        toastOptions={{
          classNames: {
            toast: "!bg-[var(--bg-card)] !border !border-[var(--border)] !text-[var(--text-main)] !shadow-md !rounded-xl !font-sans",
            title: "!text-[var(--text-main)] !font-medium !text-sm",
            description: "!text-[var(--text-muted)] !text-xs",
            actionButton: "!bg-[var(--primary)] !text-white hover:!bg-[var(--primary-hover)] !rounded-lg !text-xs !font-medium !px-3 !py-1.5",
            cancelButton: "!bg-transparent !text-[var(--text-muted)] hover:!text-[var(--text-main)] !text-xs",
            success: "!border-l-4 !border-l-[var(--primary)]",
            error: "!border-l-4 !border-l-red-500",
            warning: "!border-l-4 !border-l-amber-500",
            info: "!border-l-4 !border-l-blue-500",
          },
        }}
      />
      <AnimatePresence>{isMobileMenuOpen && isMobile && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMobileMenuOpen(false)} className="fixed inset-0 bg-black/50 z-40 lg:hidden" />}</AnimatePresence>

      <motion.aside
        data-theme={theme}
        className={cn("fixed lg:sticky top-0 h-screen bg-[var(--bg-card)] z-50 overflow-y-auto hide-scrollbar transition-colors duration-300", direction === "rtl" ? "right-0 border-l border-[var(--border)]" : "left-0 border-r border-[var(--border)]")}
        initial={false}
        animate={{
          x: isMobile ? (isMobileMenuOpen ? 0 : direction === "rtl" ? "100%" : "-100%") : 0,
          width: isMobile ? 280 : isSidebarOpen ? 270 : 80,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-[var(--border)]">
          <div className={cn("flex items-center justify-center overflow-hidden flex-1")}>{showSidebarContent ? <Logo className={isDark ? "h-15" : "h-15"} onClick={closeAllMenus} /> : <Logo showText={false} className={isDark ? "h-24" : "h-20"} onClick={closeAllMenus} />}</div>

          {isMobile && (
            <button onClick={() => setIsMobileMenuOpen(false)} className="text-[var(--text-muted)] hover:text-red-500 transition-colors p-1">
              <X size={20} />
            </button>
          )}
        </div>

        <div className="p-3 space-y-1">
          <SidebarItem
            icon={LayoutDashboard}
            label={t("dashboard")}
            isSidebarOpen={showSidebarContent}
            active={location.pathname === "/dashboard"}
            path="/dashboard"
            onClick={() => {
              setOpenSubmenu(null);
              setOpenNestedSubmenu(null);
            }}
          />
          {hasAnyPermission(Object.values(Permissions?.products)) && <SidebarItem icon={Package} label={t("products")} hasSubmenu isSidebarOpen={showSidebarContent} isOpen={openSubmenu === "products"} onClick={() => toggleSubmenu("products")} path="/products" />}
          <AnimatePresence>
            {openSubmenu === "products" && showSidebarContent && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className={cn("overflow-hidden space-y-1 pr-2", direction === "rtl" ? "mr-4 border-r border-gray-100" : "ml-4 border-l border-gray-100 pl-2 pr-0")}>
                {hasAnyPermission([Permissions?.products?.BranchedView, Permissions?.products?.DirectView, Permissions?.products?.PreparedView, Permissions?.products?.RawMaterialView, Permissions?.products?.view]) && <SubmenuItem label={t("products_list")} icon={List} path="/products" />}
                {(hasPermission(Permissions?.products?.addDirect) || hasPermission(Permissions?.products?.addBranch) || hasPermission(Permissions?.products?.addPrepared) || hasPermission(Permissions?.products?.addRaw)) && <SubmenuItem label={t("add_product")} icon={PlusCircle} path="/products/create" />}
                {/* <SubmenuItem label={t("print_barcode")} icon={Tag} path="/products/barcode" /> */}
                {hasAnyPermission([Permissions?.stockInventory?.view, Permissions?.stockInventory?.view]) && <SubmenuItem label={t("quantity_adjustments")} icon={SlidersHorizontal} path="/products/quantity-adjustments" />}
                {hasAnyPermission([Permissions?.productCategories?.view, Permissions?.productCategories?.all]) && <SubmenuItem label={t("groups")} icon={Folder} path="/products/groups" />}
                {(hasPermission(Permissions?.units?.all) || hasPermission(Permissions?.units?.view)) && <SubmenuItem label={t("units")} icon={Wrench} path="/products/units" />}
                {hasAnyPermission([Permissions?.additions?.view, Permissions?.additions?.all]) && <SubmenuItem label={t("additions")} icon={Folder} path="/products/additions" />}
              </motion.div>
            )}
          </AnimatePresence>
          {hasAnyPermission([...Object.values(Permissions?.salesOrders), ...Object.values(Permissions?.salesReturns), ...Object.values(Permissions?.giftCards)]) && <SidebarItem icon={ShoppingCart} label={t("sales")} hasSubmenu isSidebarOpen={showSidebarContent} isOpen={openSubmenu === "sales"} onClick={() => toggleSubmenu("sales")} path="/sales/a4-invoices" />}
          <AnimatePresence>
            {openSubmenu === "sales" && showSidebarContent && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className={cn("overflow-hidden space-y-1 pr-2", direction === "rtl" ? "mr-4 border-r border-gray-100" : "ml-4 border-l border-gray-100 pl-2 pr-0")}>
                {/* {hasPermission(Permissions?.salesOrders?.all) && <SubmenuItem label={t("all_sales")} icon={List} path="/sales/all" />} */}
                {hasPermission(Permissions?.salesOrders?.view) && <SubmenuItem label={t("invoices_a4")} icon={FileText} path="/sales/a4-invoices" />}
                {hasPermission(Permissions?.salesOrders?.pos) && <SubmenuItem label={t("invoices_pos")} icon={RefreshCcw} path="/sales/pos-invoices" />}
                {hasPermission(Permissions?.giftCards?.view) && <SubmenuItem label={t("gift_cards")} icon={Gift} path="/sales/gift-cards" />}
                {hasPermission(Permissions?.salesReturns?.view) && <SubmenuItem label={"المرتجعات"} icon={FileText} path="/sales/return" />}
              </motion.div>
            )}
          </AnimatePresence>
          {hasAnyPermission(Object.values(Permissions?.quotations)) && <SidebarItem icon={Share2} label={t("quotes")} hasSubmenu isSidebarOpen={showSidebarContent} isOpen={openSubmenu === "quotes"} onClick={() => toggleSubmenu("quotes")} path="/quotes" />}
          <AnimatePresence>
            {openSubmenu === "quotes" && showSidebarContent && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className={cn("overflow-hidden space-y-1 pr-2", direction === "rtl" ? "mr-4 border-r border-gray-100" : "ml-4 border-l border-gray-100 pl-2 pr-0")}>
                {hasPermission(Permissions?.quotations?.view) && <SubmenuItem label={t("quotes_list")} icon={List} path="/quotes" />}
                {hasPermission(Permissions?.quotations?.add) && <SubmenuItem label={t("add_quote")} icon={PlusCircle} path="/quotes/create" />}
              </motion.div>
            )}
          </AnimatePresence>
          {hasAnyPermission(Object.values(Permissions?.purchaseOrders)) && <SidebarItem icon={CornerUpLeft} label={t("purchases")} hasSubmenu isSidebarOpen={showSidebarContent} isOpen={openSubmenu === "purchases"} onClick={() => toggleSubmenu("purchases")} path="/purchases" />}
          <AnimatePresence>
            {openSubmenu === "purchases" && showSidebarContent && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className={cn("overflow-hidden space-y-1 pr-2", direction === "rtl" ? "mr-4 border-r border-gray-100" : "ml-4 border-l border-gray-100 pl-2 pr-0")}>
                {hasAnyPermission([Permissions?.purchaseOrders?.all, Permissions?.purchaseOrders?.view]) && <SubmenuItem label={t("purchases_list")} icon={List} path="/purchases" />}
                {hasAnyPermission([Permissions?.purchaseOrders?.all, Permissions?.purchaseOrders?.add]) && <SubmenuItem label={t("add_purchase")} icon={Plus} path="/purchases/create" />}
              </motion.div>
            )}
          </AnimatePresence>
          {hasAnyPermission([...Object.values(Permissions?.users), ...Object.values(Permissions?.roles), ...Object.values(Permissions?.employees)]) && <SidebarItem icon={Users} label={t("users")} hasSubmenu isSidebarOpen={showSidebarContent} isOpen={openSubmenu === "users"} onClick={() => toggleSubmenu("users")} path="/users" />}
          <AnimatePresence>
            {openSubmenu === "users" && showSidebarContent && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className={cn("overflow-hidden space-y-1 pr-2", direction === "rtl" ? "mr-4 border-r border-gray-100" : "ml-4 border-l border-gray-100 pl-2 pr-0")}>
                {hasPermission(Permissions?.users?.view) && <SubmenuItem label={t("users_list")} icon={List} path="/users" />}
                {/* <SubmenuItem label={t("user_groups")} icon={Users} path="/users/groups" /> */}
                <SubmenuItem label={t("pos_devices")} icon={Monitor} path="/pos-devices" />
                <SubmenuItem label={"الشهادات"} icon={ShieldCheck} path="/certificatesPosDevices" />
                {hasPermission(Permissions?.roles?.view) && <SubmenuItem label={"الصلاحيات"} icon={Shield} path="/roles" />}
                {hasPermission(Permissions?.employees?.view) && <SubmenuItem label={"الموظفين"} icon={Users} path="/employyes" />}
              </motion.div>
            )}
          </AnimatePresence>
          {hasAnyPermission(Object.values(Permissions?.shifts)) && <SidebarItem icon={RefreshCw} label={t("shifts")} hasSubmenu isSidebarOpen={showSidebarContent} isOpen={openSubmenu === "shifts"} onClick={() => toggleSubmenu("shifts")} path="/shifts" />}
          <AnimatePresence>
            {openSubmenu === "shifts" && showSidebarContent && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className={cn("overflow-hidden space-y-1 pr-2", direction === "rtl" ? "mr-4 border-r border-gray-100" : "ml-4 border-l border-gray-100 pl-2 pr-0")}>
                <SubmenuItem label={t("shifts_list")} icon={List} path="/shifts" />
              </motion.div>
            )}
          </AnimatePresence>
          {hasAnyPermission([...Object.values(Permissions?.customers), Object.values(Permissions?.customerTransactions)]) && <SidebarItem icon={User} label={t("customers")} hasSubmenu isSidebarOpen={showSidebarContent} isOpen={openSubmenu === "customers"} onClick={() => toggleSubmenu("customers")} path="/customers" />}
          <AnimatePresence>
            {openSubmenu === "customers" && showSidebarContent && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className={cn("overflow-hidden space-y-1 pr-2", direction === "rtl" ? "mr-4 border-r border-gray-100" : "ml-4 border-l border-gray-100 pl-2 pr-0")}>
                {hasAnyPermission([Permissions?.customers?.all, Permissions?.customers?.view]) && <SubmenuItem label={t("customers_list")} icon={List} path="/customers" />}
                <SubmenuItem label={t("cash_receipt_bond")} icon={HandCoins} path="/customers/collections" />
              </motion.div>
            )}
          </AnimatePresence>
          {hasAnyPermission([...Object.values(Permissions?.suppliers), Object.values(Permissions?.supplierTransactions)]) && <SidebarItem icon={Truck} label={t("suppliers")} hasSubmenu isSidebarOpen={showSidebarContent} isOpen={openSubmenu === "suppliers"} onClick={() => toggleSubmenu("suppliers")} path="/suppliers" />}
          <AnimatePresence>
            {openSubmenu === "suppliers" && showSidebarContent && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className={cn("overflow-hidden space-y-1 pr-2", direction === "rtl" ? "mr-4 border-r border-gray-100" : "ml-4 border-l border-gray-100 pl-2 pr-0")}>
                {hasAnyPermission([Permissions?.suppliers?.all, Permissions?.suppliers?.view]) && <SubmenuItem label={t("suppliers_list")} icon={LayoutGrid} path="/suppliers" />}
                <SubmenuItem label={t("cash_payment_bond")} icon={Truck} path="/suppliers/payments" />
              </motion.div>
            )}
          </AnimatePresence>
          {hasAnyPermission(Object.values(Permissions?.treasury)) && <SidebarItem icon={Landmark} label={t("treasuries")} hasSubmenu isSidebarOpen={showSidebarContent} isOpen={openSubmenu === "treasurys"} onClick={() => toggleSubmenu("treasurys")} path="/treasurys" />}
          <AnimatePresence>
            {openSubmenu === "treasurys" && showSidebarContent && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className={cn("overflow-hidden space-y-1 pr-2", direction === "rtl" ? "mr-4 border-r border-gray-100" : "ml-4 border-l border-gray-100 pl-2 pr-0")}>
                {hasPermission(Permissions?.treasury?.view) && <SubmenuItem label={t("treasuries_list")} icon={List} path="/treasurys" />}
                {hasPermission(Permissions?.treasury?.viewStatement) && <SubmenuItem label={t("treasury_statement")} icon={ArrowUpRight} path="/treasury/external-transfers" />}
                {hasPermission(Permissions?.treasury?.viewTransfers) && <SubmenuItem label={t("internal_transfers")} icon={ArrowLeftRight} path="/treasury/internal-transfers" />}
              </motion.div>
            )}
          </AnimatePresence>
          {hasAnyPermission(Object?.values(Permissions?.branches)) && <SidebarItem icon={Building} label={t("branches")} hasSubmenu isSidebarOpen={showSidebarContent} isOpen={openSubmenu === "branches"} onClick={() => toggleSubmenu("branches")} path="/branches" />}
          <AnimatePresence>
            {openSubmenu === "branches" && showSidebarContent && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className={cn("overflow-hidden space-y-1 pr-2", direction === "rtl" ? "mr-4 border-r border-gray-100" : "ml-4 border-l border-gray-100 pl-2 pr-0")}>
                {hasAnyPermission([Permissions?.branches?.view, Permissions?.branches?.all]) && <SubmenuItem label={t("branches_list")} icon={List} path="/branches" />}
              </motion.div>
            )}
          </AnimatePresence>
          {userName == "superadmin" && <SidebarItem icon={Store} label={t("warehouses")} hasSubmenu isSidebarOpen={showSidebarContent} isOpen={openSubmenu === "warehouses"} onClick={() => toggleSubmenu("warehouses")} path="/warehouses" />}
          <AnimatePresence>
            {openSubmenu === "warehouses" && showSidebarContent && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className={cn("overflow-hidden space-y-1 pr-2", direction === "rtl" ? "mr-4 border-r border-gray-100" : "ml-4 border-l border-gray-100 pl-2 pr-0")}>
                {userName == "superadmin" && <SubmenuItem label={t("warehouses_list")} icon={List} path="/warehouses" />}
              </motion.div>
            )}
          </AnimatePresence>
          {hasAnyPermission([...Object.values(Permissions?.expenses), ...Object.values(Permissions?.items)]) && <SidebarItem icon={Banknote} label={t("expenses")} hasSubmenu isSidebarOpen={showSidebarContent} isOpen={openSubmenu === "revenues_and_expenses"} onClick={() => toggleSubmenu("revenues_and_expenses")} path="/expenses" />}
          <AnimatePresence>
            {openSubmenu === "revenues_and_expenses" && showSidebarContent && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className={cn("overflow-hidden space-y-1 pr-2", direction === "rtl" ? "mr-4 border-r border-gray-100" : "ml-4 border-l border-gray-100 pl-2 pr-0")}>
                {/* <SubmenuItem label={t("revenues")} icon={ArrowUpRight} path="/revenues" /> */}
                {hasPermission(Permissions?.expenses?.view) && <SubmenuItem label={t("expenses")} icon={DollarSign} path="/expenses" />}
                {hasPermission(Permissions?.items?.view) && <SubmenuItem label={t("items")} icon={List} path="/items" />}
              </motion.div>
            )}
          </AnimatePresence>
          {hasAnyPermission(allReportPermissions) && <SidebarItem icon={BarChart} label={t("reports")} hasSubmenu isSidebarOpen={showSidebarContent} isOpen={openSubmenu === "reports"} onClick={() => toggleSubmenu("reports")} path="/reports/category/items" />}
          <AnimatePresence>
            {openSubmenu === "reports" && showSidebarContent && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className={cn("overflow-hidden space-y-1 pr-2", direction === "rtl" ? "mr-4 border-r border-gray-100" : "ml-4 border-l border-gray-100 pl-2 pr-0")}>
                {hasAnyPermission(Object.values(Permissions?.reports?.products || {})) && <SubmenuItem label={t("item_reports")} icon={Package} path="/reports/category/items" />}
                {hasAnyPermission(Object.values(Permissions?.reports?.sales || {})) && <SubmenuItem label={t("sales_reports")} icon={ShoppingCart} path="/reports/category/sales" />}
                {hasAnyPermission(Object.values(Permissions?.reports?.purchases || {})) && <SubmenuItem label={t("purchase_reports")} icon={CornerUpLeft} path="/reports/category/purchases" />}
                {hasPermission(Permissions?.reports?.customers?.list) && <SubmenuItem label={t("customer_reports")} icon={User} path="/reports/category/customers" />}
                {hasPermission(Permissions?.reports?.suppliers?.list) && <SubmenuItem label={t("suppliers_reports", "تقارير الموردين")} icon={Truck} path="/reports/category/suppliers" />}
                {hasPermission(Permissions?.reports?.expenses?.list) && <SubmenuItem label={t("expense_reports")} icon={DollarSign} path="/reports/category/expenses" />}
                {hasPermission(Permissions?.reports?.profits?.list) && <SubmenuItem label={t("profits_reports")} icon={Calculator} path="/reports/category/profits" />}

                <div className="h-px bg-gray-100 my-1 mx-2" />

                {/* <SubmenuItem label={t("sales_report_by_category")} icon={List} path="/reports/sales-by-category" /> */}
              </motion.div>
            )}
          </AnimatePresence>
          {userName == "superadmin" && <SidebarItem icon={Settings} label={t("settings")} hasSubmenu isSidebarOpen={showSidebarContent} isOpen={openSubmenu === "settings"} onClick={() => toggleSubmenu("settings")} path="/settings/system" />}
          {userName == "superadmin" && (
            <AnimatePresence>
              {openSubmenu === "settings" && showSidebarContent && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className={cn("overflow-hidden space-y-1 pr-2", direction === "rtl" ? "mr-4 border-r border-gray-100" : "ml-4 border-l border-gray-100 pl-2 pr-0")}>
                  <SubmenuItem label={t("system_settings")} icon={Settings} path="/settings/system" />
                  <SubmenuItem label={t("site_settings") || "إعدادات الموقع"} icon={Settings} path="/settings/site" />
                  <SubmenuItem label={t("items_settings") || "إعدادات الأصناف"} icon={Package} path="/settings/items" />
                  <SubmenuItem label={t("sales_settings") || "إعدادات المبيعات"} icon={ShoppingCart} path="/settings/sales" />
                  <SubmenuItem label={t("barcode_scale") || "ميزان الباركود"} icon={Barcode} path="/settings/barcode" />
                  <SubmenuItem label={t("email_settings") || "البريد الإلكتروني"} icon={Mail} path="/settings/email" />
                  {/* <SubmenuItem label={t("customer_groups")} icon={Users} path="/settings/customer-groups" />
                  <SubmenuItem label={t("price_groups")} icon={DollarSign} path="/settings/price-groups" /> */}
                  {/* <SubmenuItem
                  label={t("change_logo")}
                  icon={Upload}
                  onClick={() => {
                    setIsLogoModalOpen(true);
                    if (isMobile) setIsMobileMenuOpen(false);
                  }}
                /> */}
                  {/* <SubmenuItem label={t("currencies")} icon={Coins} path="/settings/currencies" />
                <SubmenuItem label={t("customer_groups")} icon={LinkIcon} path="/settings/customer-groups" />
                <SubmenuItem label={t("pricing_groups")} icon={DollarSign} path="/settings/price-groups" />
                <SubmenuItem label={t("basic_categories")} icon={Briefcase} path="/settings/basic-categories" />
                <SubmenuItem label={t("expense_categories")} icon={Folder} path="/settings/expense-categories" />
                <SubmenuItem label={t("units")} icon={Wrench} path="/products/units" />
                <SubmenuItem label={t("brands")} icon={Layers} path="/settings/brands" />
                <SubmenuItem label={t("variants")} icon={Tags} path="/settings/variants" />
                <SubmenuItem label={t("tax_rates")} icon={DollarSign} path="/settings/tax-rates" />
                <SubmenuItem label={t("regions")} icon={Map} path="/settings/regions" />
                <SubmenuItem label={t("delegates")} icon={Users} path="/settings/delegates" />
                <SubmenuItem label={t("tables")} icon={Grid3x3} path="/settings/tables" />
                <SubmenuItem label={t("warehouses")} icon={Building} path="/settings/warehouses" />
                <SubmenuItem label={t("branches")} icon={Building} path="/settings/branches" />
                <SubmenuItem label={t("production_machines")} icon={Factory} path="/settings/production-machines" />
                <SubmenuItem label={t("group_permissions")} icon={Key} path="/settings/groups" />
                <SubmenuItem label={t("site_logins")} icon={FileText} />
                <SubmenuItem label={t("reports")} icon={BarChart} path="/reports" /> */}
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </motion.aside>

      <div className="flex-1 flex flex-col min-w-0 relative">
        <header ref={headerRef} data-theme={theme} className="bg-[var(--bg-card)] h-16 border-b border-[var(--border)] flex items-center justify-between px-4 lg:px-8 shadow-sm z-50 transition-colors duration-300 relative">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2 text-[var(--text-muted)] hover:bg-[var(--bg-main)] rounded-lg">
              <Menu size={24} />
            </button>

            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="hidden lg:block p-2 text-[var(--text-muted)] hover:bg-[var(--bg-main)] rounded-lg">
              <Menu size={24} />
            </button>

            <div className="hidden md:flex items-center bg-[var(--input-bg)] rounded-full px-3 py-1.5 w-60 border border-[var(--border)] focus-within:border-[var(--primary)] focus-within:ring-1 focus-within:ring-[var(--primary)]/20 transition-all">
              <Search size={16} className="text-[var(--text-muted)]" />
              <Input type="text" placeholder={t("search")} className="bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 h-7 text-xs w-full text-[var(--text-main)] placeholder-[var(--text-muted)] px-2" dir={direction} />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2">
              {hasPermission(Permissions?.salesOrders?.addA4) && (
                <Link to="/sales/create" className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-full transition-all duration-200 hover:shadow-sm active:scale-95">
                  <LayoutGrid size={16} />
                  <span>{t("sales_a4_quick")}</span>
                </Link>
              )}
              {hasPermission(Permissions?.salesOrders?.addpos) &&
                (() => {
                  const posSetting = systemSettings.location.postype;
                  const isPos2 = posSetting === "POS2" || posSetting === "Pos2" || String(posSetting) === "2";
                  return (
                    <Link to={isPos2 ? "/pos2" : "/pos"} className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded-full transition-all duration-200 hover:shadow-sm active:scale-95">
                      <ShoppingCart size={16} />
                      <span>{t("pos_quick")}</span>
                    </Link>
                  );
                })()}

              {hasAnyPermission([Permissions?.products?.addDirect, Permissions?.products?.addBranch, Permissions?.products?.addPrepared, Permissions?.products?.addRaw]) && (
                <Link to="/products/create" className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 rounded-full transition-all duration-200 hover:shadow-sm active:scale-95">
                  <Package size={16} />
                  <span>{t("add_product")}</span>
                </Link>
              )}
            </div>

            <div className="relative">
              <button onClick={() => setActiveDropdown(activeDropdown === "notifications" ? null : "notifications")} className="p-2 text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--bg-main)] rounded-full relative">
                <Bell size={20} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              <AnimatePresence>
                {activeDropdown === "notifications" && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className={cn("absolute mt-2 w-80 bg-[var(--bg-card)] rounded-lg shadow-lg border border-[var(--border)] py-2 z-50", "fixed inset-x-4 top-20 sm:absolute sm:inset-auto sm:mt-2 sm:w-80", direction === "rtl" ? "sm:left-0" : "sm:right-0")}>
                    <div className="px-4 py-2 border-b border-[var(--border)] flex justify-between items-center">
                      <h3 className="font-bold text-[var(--text-main)]">{t("notifications")}</h3>
                      <span className="text-xs text-[var(--text-muted)] cursor-pointer hover:text-[var(--primary)]">{t("view_all")}</span>
                    </div>

                    <div className="max-h-64 overflow-y-auto">
                      <div className="px-4 py-3 hover:bg-[var(--bg-main)] cursor-pointer border-b border-[var(--border)] last:border-0">
                        <div className="flex items-start gap-3">
                          <div className="bg-blue-100 p-2 rounded-full text-blue-600 mt-1">
                            <ShoppingCart size={16} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[var(--text-main)]">{t("new_order")}</p>
                            <p className="text-xs text-[var(--text-muted)] mt-1">{t("order_desc")}</p>
                          </div>
                        </div>
                      </div>

                      <div className="px-4 py-3 hover:bg-[var(--bg-main)] cursor-pointer border-b border-[var(--border)] last:border-0">
                        <div className="flex items-start gap-3">
                          <div className="bg-green-100 p-2 rounded-full text-green-600 mt-1">
                            <RefreshCw size={16} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[var(--text-main)]">{t("system_update")}</p>
                            <p className="text-xs text-[var(--text-muted)] mt-1">{t("update_desc")}</p>
                          </div>
                        </div>
                      </div>

                      <div className="px-4 py-3 hover:bg-[var(--bg-main)] cursor-pointer border-b border-[var(--border)] last:border-0">
                        <div className="flex items-start gap-3">
                          <div className="bg-yellow-100 p-2 rounded-full text-yellow-600 mt-1">
                            <Package size={16} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[var(--text-main)]">{t("low_stock")}</p>
                            <p className="text-xs text-[var(--text-muted)] mt-1">{t("stock_desc")}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="relative">
              <button onClick={() => setActiveDropdown(activeDropdown === "theme" ? null : "theme")} className="p-2 text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--bg-main)] rounded-full">
                {theme === "dark" ? <Moon size={20} /> : <Sun size={20} />}
              </button>

              <AnimatePresence>
                {activeDropdown === "theme" && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className={cn("absolute mt-2 w-44 bg-[var(--bg-card)] rounded-lg shadow-lg border border-[var(--border)] py-1 z-50", "fixed inset-x-4 top-20 sm:absolute sm:inset-auto sm:mt-2 sm:w-44", direction === "rtl" ? "sm:left-0" : "sm:right-0")}>
                    <button onClick={() => handleThemeChange("light")} className="w-full text-right px-4 py-2 text-sm text-[var(--text-main)] hover:bg-[var(--bg-main)] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sun size={16} />
                        <span>{t("light_mode")}</span>
                      </div>
                      {theme === "light" && <Check size={16} className="text-[var(--primary)]" />}
                    </button>

                    <button onClick={() => handleThemeChange("dark")} className="w-full text-right px-4 py-2 text-sm text-[var(--text-main)] hover:bg-[var(--bg-main)] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Moon size={16} />
                        <span>{t("dark_mode")}</span>
                      </div>
                      {theme === "dark" && <Check size={16} className="text-[var(--primary)]" />}
                    </button>

                    <button onClick={() => handleThemeChange("red")} className="w-full text-right px-4 py-2 text-sm text-[var(--text-main)] hover:bg-[var(--bg-main)] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-red-500" />
                        <span>{t("red_theme")}</span>
                      </div>
                      {theme === "red" && <Check size={16} className="text-[var(--primary)]" />}
                    </button>

                    <button onClick={() => handleThemeChange("blue")} className="w-full text-right px-4 py-2 text-sm text-[var(--text-main)] hover:bg-[var(--bg-main)] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-blue-500" />
                        <span>{t("blue_theme")}</span>
                      </div>
                      {theme === "blue" && <Check size={16} className="text-[var(--primary)]" />}
                    </button>

                    <button onClick={() => handleThemeChange("yellow")} className="w-full text-right px-4 py-2 text-sm text-[var(--text-main)] hover:bg-[var(--bg-main)] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-yellow-500" />
                        <span>{t("yellow_theme")}</span>
                      </div>
                      {theme === "yellow" && <Check size={16} className="text-[var(--primary)]" />}
                    </button>

                    <button onClick={() => handleThemeChange("high-contrast")} className="w-full text-right px-4 py-2 text-sm text-[var(--text-main)] hover:bg-[var(--bg-main)] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-black border border-white" />
                        <span>{t("high_contrast")}</span>
                      </div>
                      {theme === "high-contrast" && <Check size={16} className="text-[var(--primary)]" />}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="relative">
              <button onClick={() => setActiveDropdown(activeDropdown === "language" ? null : "language")} className="p-2 text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--bg-main)] rounded-full">
                <Globe size={20} />
              </button>

              <AnimatePresence>
                {activeDropdown === "language" && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className={cn("absolute mt-2 w-40 bg-[var(--bg-card)] rounded-lg shadow-lg border border-[var(--border)] py-1 z-50", "fixed inset-x-4 top-20 sm:absolute sm:inset-auto sm:mt-2 sm:w-40", direction === "rtl" ? "sm:left-0" : "sm:right-0")}>
                    <button
                      onClick={() => {
                        setLanguage("ar");
                        setActiveDropdown(null);
                      }}
                      className="w-full text-right px-4 py-2 text-sm text-[var(--text-main)] hover:bg-[var(--bg-main)] flex items-center justify-between"
                    >
                      <span>{t("arabic")}</span>
                      {language === "ar" && <Check size={16} className="text-[var(--primary)]" />}
                    </button>

                    <button
                      onClick={() => {
                        setLanguage("en");
                        setActiveDropdown(null);
                      }}
                      className="w-full text-right px-4 py-2 text-sm text-[var(--text-main)] hover:bg-[var(--bg-main)] flex items-center justify-between"
                    >
                      <span>{t("english")}</span>
                      {language === "en" && <Check size={16} className="text-[var(--primary)]" />}
                    </button>

                    <button
                      onClick={() => {
                        setLanguage("ur");
                        setActiveDropdown(null);
                      }}
                      className="w-full text-right px-4 py-2 text-sm text-[var(--text-main)] hover:bg-[var(--bg-main)] flex items-center justify-between"
                    >
                      <span>{t("urdu")}</span>
                      {language === "ur" && <Check size={16} className="text-[var(--primary)]" />}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="h-8 w-px bg-[var(--border)] mx-1"></div>

            <div className="relative">
              <button onClick={() => setActiveDropdown(activeDropdown === "user" ? null : "user")} className="flex items-center gap-2 p-1 hover:bg-[var(--bg-main)] rounded-lg">
                <div className="w-8 h-8 rounded-full border border-[var(--border)] flex items-center justify-center bg-[var(--bg-main)]">
                  <User size={18} className="text-[var(--text-muted)]" />
                </div>
                <div className="hidden md:block text-right">
                  <p className="text-sm font-medium text-[var(--text-main)]">{userName}</p>
                </div>
                <ChevronDown size={16} className="text-[var(--text-muted)]" />
              </button>

              <AnimatePresence>
                {activeDropdown === "user" && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className={cn("absolute mt-2 w-48 bg-[var(--bg-card)] rounded-lg shadow-lg border border-[var(--border)] py-1 z-50", direction === "rtl" ? "left-0" : "right-0")}>
                    <button
                      onClick={() => {
                        setIsChangePasswordOpen(true);
                        closeAllMenus();
                      }}
                      className="w-full text-right px-4 py-2 text-sm text-[var(--text-main)] hover:bg-[var(--bg-main)] flex items-center gap-2"
                    >
                      <Users size={16} />
                      تغير كلمة المرور
                    </button>

                    <div className="h-px bg-[var(--border)] my-1"></div>

                    <button
                      type="button"
                      onClick={async () => {
                        await logout();
                        closeAllMenus();
                      }}
                      className="w-full text-right px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-2 transition-colors"
                    >
                      <LogOut size={16} />
                      {t("logout")}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <main className={cn("flex-1 bg-[var(--bg-main)] transition-colors duration-300", location.pathname === "/dashboard" ? "p-3 overflow-hidden" : "p-4 lg:p-8 overflow-y-auto")}>
          {location.pathname === "/dashboard" && <WelcomeBanner />}
          <Outlet />
        </main>
      </div>

      <LogoModal isOpen={isLogoModalOpen} onClose={() => setIsLogoModalOpen(false)} />
      <ChangePasswordDialog isOpen={isChangePasswordOpen} onClose={() => setIsChangePasswordOpen(false)} />
    </div>
  );
}
