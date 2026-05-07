// src/pages/ProductsList.tsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { createPortal, prefetchDNS } from "react-dom";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Search, Edit2, Trash2, Plus, Box, Package, Layers, X, Link2, FolderPlus, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn, getProductsApiBase } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import { DataTable, type DataTableFilterMeta, type DataTablePageEvent } from "primereact/datatable";
import { Column } from "primereact/column";
import type { Product } from "@/features/products/types/products.types";
import { useGetAllProducts } from "@/features/products/hooks/useGetAllProducts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGetAllProductsDirect } from "@/features/products/hooks/useGetAllProductsDirect";
import { useGetAllProductsBranched } from "@/features/products/hooks/useGetAllProductsBranched";
import { useGetAllProductsRawMatrial } from "@/features/products/hooks/useGetAllProductsRawMatrial";
import { useGetAllProductsPrepared } from "@/features/products/hooks/useGetAllProductsPrepared";
import { useDeleteProduct } from "@/features/products/hooks/useDeleteProduct";
import { useAuthStore } from "@/store/authStore";
import { Permission, Permissions } from "@/lib/permissions";
import { Input } from "@/components/ui/input";
import { selectRowsPerPage, useSettingsStore } from "@/features/settings/store/settingsStore";

export default function ProductsList() {
  const { direction, t } = useLanguage();
  const rows = useSettingsStore(selectRowsPerPage);

  const [currentPage, setCurrentPage] = useState(1);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const hasAnyPermission = useAuthStore((s) => s.hasAnyPermission);
  const hasAllPermissions = useAuthStore((s) => s.hasAllPermissions);
  type ProductType = "Direct" | "Branched" | "Prepared" | "RawMatrial";
  const getInitialTab = (): ProductType | "allProducts" => {
    if (hasAllPermissions([Permissions?.products?.DirectView, Permissions?.products?.BranchedView, Permissions?.products?.PreparedView, Permissions?.products?.RawMaterialView])) return "allProducts";

    if (hasPermission(Permissions?.products?.DirectView)) return "Direct";
    if (hasPermission(Permissions?.products?.BranchedView)) return "Branched";
    if (hasPermission(Permissions?.products?.PreparedView)) return "Prepared";
    if (hasPermission(Permissions?.products?.RawMaterialView)) return "RawMatrial";

    return "allProducts";
  };

  const [activeTab, setActiveTab] = useState<ProductType | "allProducts">(getInitialTab);
  const entriesPerPage = rows ?? 5;
  const { mutateAsync: deleteProduct } = useDeleteProduct();
  const { data: products, isLoading } = useGetAllProducts(
    {
      page: currentPage,
      limit: entriesPerPage,
      SearchTerm: globalFilterValue,
    },
    {
      enabled: activeTab === "allProducts",
    },
  );

  const { data: productsDirect } = useGetAllProductsDirect(
    {
      page: currentPage,
      limit: entriesPerPage,
      SearchTerm: globalFilterValue,
    },
    {
      enabled: activeTab === "Direct",
    },
  );

  const { data: productsBranched } = useGetAllProductsBranched(
    {
      page: currentPage,
      limit: entriesPerPage,
      SearchTerm: globalFilterValue,
    },
    {
      enabled: activeTab === "Branched",
    },
  );
  const { data: productsPrepared } = useGetAllProductsPrepared(
    {
      page: currentPage,
      limit: entriesPerPage,
      SearchTerm: globalFilterValue,
    },
    {
      enabled: activeTab === "Prepared",
    },
  );

  const { data: productsRawMaterials } = useGetAllProductsRawMatrial(
    {
      page: currentPage,
      limit: entriesPerPage,
      SearchTerm: globalFilterValue,
    },
    {
      enabled: activeTab === "RawMatrial",
    },
  );
  const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setGlobalFilterValue(value);
    setCurrentPage(1);
  };
  const handleTabChange = (newTab: typeof activeTab) => {
    console.log(activeTab);
    setActiveTab(newTab);
    setGlobalFilterValue("");
    setCurrentPage(1);
  };
  const renderHeader = () => {
    return (
      <div className="flex flex-col md:flex-row gap-4  items-center">
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <Input type="text" value={globalFilterValue} onChange={onGlobalFilterChange} placeholder={t("search_placeholder")} className=" pr-11 " />
        </div>
      </div>
    );
  };
  const productEditPermissionMap: Record<ProductType, Permission> = {
    Direct: Permissions.products.editDirect,
    Branched: Permissions.products.editVariant,
    Prepared: Permissions.products.editReady,
    RawMatrial: Permissions.products.editRaw,
  };

  const header = useMemo(() => renderHeader(), [globalFilterValue, t]);
  const currentTableData = useMemo(() => {
    switch (activeTab) {
      case "allProducts":
        return {
          items: products?.items || [],
          total: products?.totalCount || 0,
          loading: !products?.items,
        };

      case "Direct":
        return {
          items: productsDirect?.items || [],
          total: productsDirect?.totalCount || 0,
          loading: !productsDirect?.items,
        };

      case "Branched":
        return {
          items: productsBranched?.items || [],
          total: productsBranched?.totalCount || 0,
          loading: !productsBranched?.items,
        };

      case "Prepared":
        return {
          items: productsPrepared?.items || [],
          total: productsPrepared?.totalCount || 0,
          loading: !productsPrepared?.items,
        };

      case "RawMatrial":
        return {
          items: productsRawMaterials?.items || [],
          total: productsRawMaterials?.totalCount || 0,
          loading: !productsRawMaterials?.items,
        };
      default:
        return { items: [], total: 0, loading: false };
    }
  }, [activeTab, products, productsDirect, productsBranched, productsPrepared, productsRawMaterials]);

  return (
    <>
      <Card>
        <CardHeader className="max-md:flex max-md:flex-col">
          <CardTitle>إدارة الاصناف</CardTitle>
          <CardDescription>إدارة الأصناف المباشرة والمتفرعة والمجهزة والخامات</CardDescription>
          <CardAction className="max-md:flex max-md:justify-end max-md:mt-2">
            {(hasPermission(Permissions?.products?.add) || hasPermission(Permissions?.products?.all)) && (
              <Button size={"xl"} variant={"default"} asChild>
                <Link to={"/products/create"}>إضافة صنف</Link>
              </Button>
            )}
          </CardAction>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={handleTabChange} className="border border-gray-200 rounded-t-md overflow-hidden">
            <TabsList variant={"line"} className="flex overflow-x-auto justify-start gap-x-2 md:gap-x-8 h-fit! pb-1 max-lg:w-full [&::-webkit-scrollbar]:hidden">
              {hasAllPermissions([Permissions?.products?.DirectView, Permissions?.products?.BranchedView, Permissions?.products?.PreparedView, Permissions?.products?.RawMaterialView]) && (
                <TabsTrigger className="py-2! whitespace-nowrap shrink-0" value="allProducts">
                  جميع الأصناف
                </TabsTrigger>
              )}
              {hasPermission(Permissions?.products?.DirectView) && (
                <TabsTrigger className="py-2! whitespace-nowrap shrink-0" value="Direct">
                  الأصناف المباشرة
                </TabsTrigger>
              )}
              {hasPermission(Permissions?.products?.BranchedView) && (
                <TabsTrigger className="py-2! whitespace-nowrap shrink-0" value="Branched">
                  الأصناف المتفرعة
                </TabsTrigger>
              )}
              {hasPermission(Permissions?.products?.PreparedView) && (
                <TabsTrigger className="py-2! whitespace-nowrap shrink-0" value="Prepared">
                  الأصناف المجهزة
                </TabsTrigger>
              )}
              {hasPermission(Permissions?.products?.RawMaterialView) && (
                <TabsTrigger className="py-2! whitespace-nowrap shrink-0" value="RawMatrial">
                  الخامات
                </TabsTrigger>
              )}
            </TabsList>
          </Tabs>

          <DataTable
            value={currentTableData.items}
            totalRecords={currentTableData.total}
            loading={currentTableData.loading}
            lazy
            paginator
            rows={entriesPerPage}
            first={(currentPage - 1) * entriesPerPage}
            onPage={(e: DataTablePageEvent) => {
              if (e.page === undefined) return;
              setCurrentPage(e.page + 1);
            }}
            header={header}
            responsiveLayout="stack"
            className="custom-green-table custom-compact-table"
            dataKey="id"
          >
            <Column header={t("name")} sortable field="productNameAr" />
            <Column field="categoryName" sortable header={"التصنيف"} />
            <Column field="balance" sortable header={"الكمية"} />
            <Column field="barcode" sortable header={"الباركود"} />
            <Column field="costPrice" sortable header={"سعر الشراء"} />

            <Column field="sellingPrice" sortable header={"سعر البيع"} />

            {activeTab == "allProducts" && (
              <Column
                field="productType"
                body={(raw: Product) => {
                  if (raw?.productType == "Direct") {
                    return "مباشر";
                  } else if (raw?.productType == "Branched") {
                    return "متفرع";
                  } else if (raw?.productType == "Prepared") {
                    return "مجهز";
                  } else if (raw?.productType == "RawMatrial") {
                    return "خامات";
                  }
                }}
                sortable
                header={"النوع"}
              />
            )}
            <Column
              header={t("actions")}
              body={(product: Product) => {
                const editPermission = activeTab === "allProducts" ? (hasPermission(Permissions.products.edit) ? Permissions.products.edit : productEditPermissionMap[product.productType]) : hasPermission(Permissions.products.edit) ? Permissions.products.edit : productEditPermissionMap[activeTab as ProductType];
                return (
                  <div className="space-x-2">
                    {(hasPermission(editPermission) || hasPermission(Permissions?.products?.all)) && (
                      <Link to={`/products/edit/${product?.id}?type=${activeTab == "allProducts" ? product?.productType : activeTab}`} className="btn-minimal-action btn-edit">
                        <Edit2 size={16} />
                      </Link>
                    )}
                    {(hasPermission(Permissions.products.delete) || hasPermission(Permissions?.products?.all)) && (
                      <button onClick={async () => await deleteProduct(product?.id)} className="btn-minimal-action btn-delete">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                );
              }}
            />
          </DataTable>
        </CardContent>
      </Card>
      <style>
        {`
    .p-datatable-header {
      border-top:none !important;
       border-top-left-radius: 0px;
  border-top-right-radius: 0px;
    }
  `}
      </style>{" "}
    </>
  );
}
