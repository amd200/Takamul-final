import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Edit2, Trash2, Printer } from "lucide-react";
import { usePrint } from "@/context/PrintContext";
import { getPurchaseOrderById } from "@/features/purchases/services/purchases";
import { DataTable, type DataTablePageEvent } from "primereact/datatable";
import { Column } from "primereact/column";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGetAllPurchases } from "@/features/purchases/hooks/useGetAllPurchases";
import type { Purchase } from "@/features/purchases/types/purchase.types";
import { useLanguage } from "@/context/LanguageContext";
import formatDate from "@/lib/formatDate";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { useDeletePurchaseOrder } from "@/features/purchases/hooks/useDeletePurchaseOrder";
import { useAuthStore } from "@/store/authStore";
import { Permissions } from "@/lib/permissions";

function DeletePurchaseButton({ purchase, onDelete }: { purchase: Purchase; onDelete: (id: number) => void }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button className="btn-minimal-action btn-delete" title="حذف">
          <Trash2 size={16} />
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent size="default" className="shadow-none">
        <AlertDialogTitle className="text-base font-bold text-red-500 text-right">حذف الفاتورة {purchase.purchaseOrderNumber}</AlertDialogTitle>
        <AlertDialogDescription className="text-sm text-right mt-1 mb-6">هل أنت متأكد من حذف هذه الفاتورة؟ لا يمكن التراجع عن هذا الإجراء.</AlertDialogDescription>
        <div className="flex items-center gap-2 justify-end">
          <AlertDialogCancel className="bg-transparent hover:bg-[var(--table-row-hover)] px-5 py-5 text-sm font-medium transition-colors">إلغاء</AlertDialogCancel>
          <AlertDialogAction variant="destructive" className="px-5 py-5 text-sm font-medium transition-colors" onClick={() => onDelete(purchase.id)}>
            تأكيد الحذف
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default function PurchasesList() {
  const { t, direction } = useLanguage();
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const { mutate: deletePurchaseOrder } = useDeletePurchaseOrder();
  const { printInvoice } = usePrint();

  const { data: purchases } = useGetAllPurchases({
    page: currentPage,
    limit: entriesPerPage,
    searchTerm: globalFilterValue,
  });

  const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setGlobalFilterValue(value);
    setCurrentPage(1);
  };

  const renderHeader = () => {
    return (
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <Input type="text" value={globalFilterValue} onChange={onGlobalFilterChange} placeholder={t("search_placeholder")} className="placeholder:font-normal w-full border border-gray-200 hover:border-gray-200 focus:border-[var(--primary)] focus:bg-white text-gray-700 text-sm rounded-lg py-2 pr-11 pl-4 transition-all outline-none" />
        </div>
      </div>
    );
  };

  const header = useMemo(() => renderHeader(), [globalFilterValue, t]);

  const hasPermission = useAuthStore((state) => state.hasPermission);
  const hasAnyPermission = useAuthStore((state) => state.hasAnyPermission);

  return (
    <Card dir={direction}>
      <CardHeader>
        <CardTitle>{t("purchases_management")}</CardTitle>
        <CardDescription>{t("purchases_management_desc")}</CardDescription>
      </CardHeader>

      <CardContent>
        <DataTable
          value={purchases?.items}
          totalRecords={purchases?.totalCount}
          loading={!purchases?.items}
          lazy
          paginator
          rows={entriesPerPage}
          first={(currentPage - 1) * entriesPerPage}
          onPage={(e: DataTablePageEvent) => {
            if (e.page === undefined) return;
            setCurrentPage(e.page + 1);
            setEntriesPerPage(e.rows);
          }}
          header={header}
          responsiveLayout="stack"
          className="custom-green-table custom-compact-table"
          dataKey="id"
          emptyMessage={t("no_data")}
        >
          <Column header={t("invoice_number")} field="purchaseOrderNumber" sortable />
          <Column header={t("date")} sortable body={(purchase: Purchase) => formatDate(purchase.orderDate)} />
          <Column header={t("supplier_name")} field="supplierName" sortable />
          <Column header={"إجمالي الفاتورة"} field="grandTotal" sortable />
          <Column
            header={t("actions")}
            body={(purchase) => (
              <div className="flex gap-2 justify-center items-center">
                <button
                  onClick={async () => {
                    try {
                      const fullData = await getPurchaseOrderById(purchase.id);
                      printInvoice(fullData, "purchase");
                    } catch (err) {
                      console.error("Print failed", err);
                    }
                  }}
                  className="btn-minimal-action btn-compact-action text-blue-500"
                >
                  <Printer size={16} />
                </button>
                {hasPermission(Permissions?.purchaseOrders?.edit) && (
                  <Link to={`/purchases/edit/${purchase?.id}`} className="btn-minimal-action btn-edit">
                    <Edit2 size={16} />
                  </Link>
                )}
                {hasPermission(Permissions?.purchaseOrders?.cancel) && <DeletePurchaseButton purchase={purchase} onDelete={deletePurchaseOrder} />}
              </div>
            )}
          />
        </DataTable>
      </CardContent>
    </Card>
  );
}
