import * as React from "react";
import { LayoutDashboard, ShoppingCart, Package, FileText, Users, Settings, ChevronDown, LogOut, BarChart, User, Truck, Landmark, Building, Store, RefreshCw, Share2, CornerUpLeft, List, PlusCircle, Plus, Monitor, Shield, DollarSign, Calculator, CreditCard, Percent, Coins, Folder, Wrench, Layers, Tags, Map, Grid3x3, Key, ArrowUpRight, ArrowLeftRight, HandCoins, SlidersHorizontal, Gift, LayoutGrid, Briefcase } from "lucide-react";

import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem, SidebarProvider, SidebarRail, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

// ─── Nav data ─────────────────────────────────────────────────────────
const NAV_ITEMS = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/dashboard",
  },
  {
    id: "sales",
    label: "Sales",
    icon: ShoppingCart,
    children: [
      { label: "All Sales", icon: List, path: "/sales/all" },
      { label: "A4 Invoices", icon: FileText, path: "/sales/a4-invoices" },
      { label: "POS Invoices", icon: RefreshCw, path: "/sales/pos-invoices" },
      { label: "Gift Cards", icon: Gift, path: "/sales/gift-cards" },
    ],
  },
  {
    id: "purchases",
    label: "Purchases",
    icon: CornerUpLeft,
    children: [
      { label: "Purchases List", icon: List, path: "/purchases" },
      { label: "Add Purchase", icon: Plus, path: "/purchases/create" },
    ],
  },
  {
    id: "inventory",
    label: "Inventory",
    icon: Package,
    children: [
      { label: "Products List", icon: List, path: "/products" },
      { label: "Add Product", icon: PlusCircle, path: "/products/create" },
      { label: "Qty Adjustments", icon: SlidersHorizontal, path: "/products/quantity-adjustments" },
      { label: "Groups", icon: Folder, path: "/products/groups" },
      { label: "Units", icon: Wrench, path: "/products/units" },
      { label: "Additions", icon: Folder, path: "/products/additions" },
    ],
  },
  {
    id: "finance",
    label: "Finance",
    icon: Landmark,
    children: [
      { label: "Treasuries", icon: List, path: "/treasurys" },
      { label: "Treasury Statement", icon: ArrowUpRight, path: "/treasury/external-transfers" },
      { label: "Internal Transfers", icon: ArrowLeftRight, path: "/treasury/internal-transfers" },
      { label: "Expenses", icon: DollarSign, path: "/expenses" },
      { label: "Expense Items", icon: List, path: "/items" },
    ],
  },
  {
    id: "hr",
    label: "HR",
    icon: Users,
    children: [
      { label: "Users List", icon: List, path: "/users" },
      { label: "POS Devices", icon: Monitor, path: "/users/pos-devices" },
      { label: "Roles", icon: Shield, path: "/roles" },
      { label: "Employees", icon: Users, path: "/employyes" },
      { label: "Shifts List", icon: RefreshCw, path: "/shifts" },
    ],
  },
  {
    id: "crm",
    label: "CRM",
    icon: User,
    children: [
      { label: "Customers", icon: List, path: "/customers" },
      { label: "Cash Receipt", icon: HandCoins, path: "/customers/collections" },
      { label: "Suppliers", icon: LayoutGrid, path: "/suppliers" },
      { label: "Cash Payment", icon: Truck, path: "/suppliers/payments" },
      { label: "Quotes", icon: Share2, path: "/quotes" },
    ],
  },
  {
    id: "projects",
    label: "Projects",
    icon: Briefcase,
    path: "/projects",
  },
  {
    id: "reports",
    label: "Reports",
    icon: BarChart,
    children: [
      { label: "Item Reports", icon: Package, path: "/reports/category/items" },
      { label: "Sales Reports", icon: ShoppingCart, path: "/reports/category/sales" },
      { label: "Purchase Reports", icon: CornerUpLeft, path: "/reports/category/purchases" },
      { label: "Customer Reports", icon: User, path: "/reports/category/customers" },
      { label: "Supplier Reports", icon: Truck, path: "/reports/category/suppliers" },
      { label: "Expense Reports", icon: DollarSign, path: "/reports/category/expenses" },
      { label: "Profit Reports", icon: Calculator, path: "/reports/category/profits" },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    children: [
      { label: "System Settings", icon: Settings, path: "/settings/system" },
      { label: "Payment Companies", icon: CreditCard, path: "/settings/payment-companies" },
      { label: "Payment Methods", icon: CreditCard, path: "/settings/payment-methods" },
      { label: "POS Settings", icon: Store, path: "/settings/pos" },
      { label: "Promotions", icon: Percent, path: "/promotions" },
      { label: "Currencies", icon: Coins, path: "/settings/currencies" },
      { label: "Brands", icon: Layers, path: "/settings/brands" },
      { label: "Variants", icon: Tags, path: "/settings/variants" },
      { label: "Tax Rates", icon: DollarSign, path: "/settings/tax-rates" },
      { label: "Regions", icon: Map, path: "/settings/regions" },
      { label: "Tables", icon: Grid3x3, path: "/settings/tables" },
      { label: "Warehouses", icon: Building, path: "/settings/warehouses" },
      { label: "Branches", icon: Building, path: "/settings/branches" },
      { label: "Permissions", icon: Key, path: "/settings/groups" },
    ],
  },
];

// ─── Logo ──────────────────────────────────────────────────────────────
function NexoraLogo() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <div className={`flex items-center gap-2.5 ${isCollapsed ? "justify-center" : ""}`}>
      <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/30">
        <span className="text-white font-black text-sm leading-none">N</span>
      </div>
      {!isCollapsed && (
        <div className="flex items-baseline gap-1.5 overflow-hidden">
          <span className="text-white font-bold text-[15px] tracking-tight whitespace-nowrap">NEXORA</span>
          <span className="text-emerald-400 text-[9px] font-bold tracking-[0.2em] uppercase">ERP</span>
        </div>
      )}
    </div>
  );
}

// ─── Single item (no children) ─────────────────────────────────────────
function NavItemSingle({ item, activePath, onNavigate }) {
  const isActive = activePath === item.path;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton isActive={isActive} tooltip={item.label} onClick={() => onNavigate(item.path)} className={isActive ? "bg-emerald-500 text-white hover:bg-emerald-600 hover:text-white shadow-md shadow-emerald-500/25 font-medium" : "text-slate-300 hover:bg-slate-700/60 hover:text-white font-medium"}>
        <item.icon className={isActive ? "text-white" : "text-slate-400"} />
        <span>{item.label}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

// ─── Collapsible item (with children) ─────────────────────────────────
function NavItemCollapsible({ item, activePath, onNavigate }) {
  const isChildActive = item.children?.some((c) => c.path === activePath);
  const [open, setOpen] = React.useState(isChildActive ?? false);
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="group/collapsible">
      <SidebarMenuItem>
        {/* Trigger */}
        <CollapsibleTrigger asChild>
          <SidebarMenuButton tooltip={item.label} isActive={isChildActive} className={isChildActive ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 font-medium" : "text-slate-300 hover:bg-slate-700/60 hover:text-white font-medium"}>
            <item.icon className={isChildActive ? "text-emerald-400" : "text-slate-400"} />
            <span>{item.label}</span>
            {!isCollapsed && (
              <ChevronDown
                className={`
                  ml-auto h-4 w-4 flex-shrink-0 transition-transform duration-200
                  group-data-[state=open]/collapsible:rotate-180
                  ${isChildActive ? "text-emerald-400" : "text-slate-500"}
                `}
              />
            )}
          </SidebarMenuButton>
        </CollapsibleTrigger>

        {/* Sub items */}
        <CollapsibleContent>
          <SidebarMenuSub className="border-slate-700/60 ml-0">
            {item.children.map((child) => {
              const childActive = activePath === child.path;
              return (
                <SidebarMenuSubItem key={child.path}>
                  <SidebarMenuSubButton isActive={childActive} onClick={() => onNavigate(child.path)} className={childActive ? "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/20 cursor-pointer" : "text-slate-400 hover:bg-slate-700/50 hover:text-slate-200 cursor-pointer"}>
                    <child.icon className={`h-3.5 w-3.5 flex-shrink-0 ${childActive ? "text-emerald-400" : "text-slate-500"}`} />
                    <span>{child.label}</span>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              );
            })}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

// ─── AppSidebar ────────────────────────────────────────────────────────
export function AppSidebar({ activePath, onNavigate }) {
  return (
    <Sidebar
      collapsible="icon"
      // Override CSS vars to match dark slate theme

      className="border-r-0 [&>[data-sidebar=sidebar]]:bg-slate-900 [&>[data-sidebar=sidebar]]:border-r [&>[data-sidebar=sidebar]]:border-slate-800"
    >
      {/* Header */}
      <SidebarHeader className="h-14 flex justify-center border-b border-slate-800 px-3">
        <NexoraLogo />
      </SidebarHeader>

      {/* Nav */}
      <SidebarContent className="py-2 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:transparent [&::-webkit-scrollbar-thumb]:bg-slate-700">
        <SidebarGroup className="px-2 py-0">
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">{NAV_ITEMS.map((item) => (item.children ? <NavItemCollapsible key={item.id} item={item} activePath={activePath} onNavigate={onNavigate} /> : <NavItemSingle key={item.id} item={item} activePath={activePath} onNavigate={onNavigate} />))}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t border-slate-800 p-2 gap-1">
        {/* User dropdown */}
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton tooltip="Ahmed Mohamed" className="text-slate-300 hover:bg-slate-800 hover:text-white h-auto py-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-[10px] font-bold leading-none">A</span>
                  </div>
                  <div className="flex flex-col items-start overflow-hidden min-w-0">
                    <span className="text-slate-200 text-xs font-semibold truncate leading-tight">Ahmed Mohamed</span>
                    <span className="text-slate-500 text-[10px] truncate leading-tight">System Administrator</span>
                  </div>
                  <ChevronDown className="ml-auto h-4 w-4 text-slate-500 flex-shrink-0" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-52 bg-slate-800 border-slate-700 text-slate-200">
                <DropdownMenuItem className="hover:bg-slate-700 focus:bg-slate-700 cursor-pointer gap-2 text-slate-200">
                  <User className="h-4 w-4 text-slate-400" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem className="hover:bg-slate-700 focus:bg-slate-700 cursor-pointer gap-2 text-red-400 focus:text-red-300">
                  <LogOut className="h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* Collapse trigger */}
        <SidebarTrigger className="w-full justify-start gap-2.5 rounded-md px-3 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors h-auto [&>svg]:h-4 [&>svg]:w-4">
          <span className="group-data-[collapsible=icon]:hidden">Collapse</span>
        </SidebarTrigger>
      </SidebarFooter>

      <SidebarRail className="hover:after:bg-slate-700" />
    </Sidebar>
  );
}

// ─── Demo wrapper ──────────────────────────────────────────────────────
export default function NexoraSidebarDemo() {
  const [activePath, setActivePath] = React.useState("/dashboard");

  const activeLabel = NAV_ITEMS.find((m) => m.path === activePath)?.label || NAV_ITEMS.flatMap((m) => m.children || []).find((c) => c.path === activePath)?.label || "Dashboard";

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden bg-slate-100">
        <AppSidebar activePath={activePath} onNavigate={setActivePath} />

        {/* Page content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <header className="h-14 bg-white border-b border-slate-200 flex items-center px-4 gap-3 flex-shrink-0">
            <SidebarTrigger className="text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md p-1.5 transition-colors" />
            <div className="h-4 w-px bg-slate-200" />
            <h1 className="text-slate-700 font-semibold text-sm">{activeLabel}</h1>
            <span className="ml-auto text-slate-400 text-xs">Nexora ERP v2.0</span>
          </header>

          <div className="flex-1 overflow-auto p-8">
            <div className="max-w-sm">
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center mb-4">
                  <LayoutDashboard className="h-5 w-5 text-emerald-500" />
                </div>
                <h2 className="text-slate-800 font-semibold text-base mb-2">Welcome back, Ahmed 👋</h2>
                <p className="text-slate-500 text-sm leading-relaxed">الـ sidebar ده مبني بـ shadcn Sidebar primitives الحقيقية. كل menu بيفتح بـ Collapsible، وفيه SidebarRail للـ collapse.</p>
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <span className="text-xs text-slate-400">Active path: </span>
                  <code className="text-xs bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded font-mono">{activePath}</code>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
