import { useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { ChevronLeft, Folder, FileText, ArrowLeft } from "lucide-react";
import { useCreateRole } from "@/features/roles/hooks/useCreateRole";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useGetRoleById } from "@/features/roles/hooks/useGetRoleById";
import { useUpdateRole } from "@/features/roles/hooks/useUpdateRole";
import { Permissions } from "@/lib/permissions";


export interface SubPermission {
  id: string;
  label: string;
  value: string;
}

export interface Permission {
  id: string;
  label: string;
  value?: string;
  subPermissions?: SubPermission[];
}

export interface Page {
  id: string;
  label: string;
  permissions: Permission[];
}

export interface Group {
  id: string;
  label: string;
  pages: Page[];
  permissions?: Permission[];
}


const GROUPS: Group[] = [
  {
    id: "dashboard",
    label: "لوحة التحكم",
    pages: [
      {
        id: "dashboard_stats",
        label: "إحصائيات لوحة التحكم",
        permissions: [
          { id: "view_sales", label: "عرض إحصائيات المبيعات", value: Permissions?.dashboard?.viewSales },
          { id: "view_expenses", label: "عرض إحصائيات المصروفات", value: Permissions?.dashboard?.viewExpenses },
          { id: "view_purchases", label: "عرض إحصائيات المشتريات", value: Permissions?.dashboard?.viewPurchases },
          { id: "view_profit", label: "عرض إحصائيات الأرباح", value: Permissions?.dashboard?.viewProfit },
       
        ],
      },
    ],
  },
  {
    id: "products",
    label: "الأصناف",
    pages: [
      {
        id: "products_list",
        label: "قائمة الاصناف",
        permissions: [
          {
            id: "view",
            label: "عرض",
            subPermissions: [
              { id: "view_direct", label: " مباشرة", value: "المنتجات.عرض الاصناف المباشرة" },
              { id: "view_raw", label: "  خام", value: "المنتجات.عرض الخامات" },
              { id: "view_variant", label: " متفرع", value: "المنتجات.عرض الاصناف المتفرعه" },
              { id: "view_ready", label: "جاهز", value: "المنتجات.عرض الاصناف المجهزة" },
            ],
          },
          {
            id: "edit",
            label: "تعديل",
            subPermissions: [
              { id: "edit_direct", label: " مباشر", value: "المنتجات.تعديل مباشر" },
              { id: "edit_raw", label: " مواد خام", value: "المنتجات.تعديل مواد خام" },
              { id: "edit_variant", label: " متفرع", value: "المنتجات.تعديل متفرعة" },
              { id: "edit_ready", label: " جاهز", value: "المنتجات.تعديل جاهزة" },
            ],
          },
          {
            id: "delete",
            label: "حذف",
            subPermissions: [
              { id: "delete_direct", label: " مباشر", value: "المنتجات.حذف" },
              { id: "delete_raw", label: "  خام", value: "المنتجات.حذف" },
              { id: "delete_variant", label: " متفرع", value: "المنتجات.حذف" },
              { id: "delete_ready", label: " جاهز", value: "المنتجات.حذف" },
            ],
          },
        ],
      },
      {
        id: "products_add",
        label: "إضافة صنف",
        permissions: [
          {
            id: "add",
            label: "إضافة",
            subPermissions: [
              { id: "add_direct", label: " مباشر", value: "المنتجات.إضافة مباشرة" },
              { id: "add_raw", label: "  خام", value: "المنتجات.إضافة مواد خام" },
              { id: "add_variant", label: " متفرع", value: "المنتجات.إضافة متفرعة" },
              { id: "add_ready", label: " جاهز", value: "المنتجات.إضافة جاهزة" },
            ],
          },
        ],
      },
      {
        id: "stock_adjustments",
        label: "تعديلات الكمية",
        permissions: [
          { id: "view", label: "عرض", value: Permissions?.stockInventory?.view },
          { id: "add", label: "إضافة", value: Permissions?.stockInventory?.bulkAdjust },
          { id: "edit", label: "تعديل", value: Permissions?.stockInventory?.editAdjustment },
          { id: "delete", label: "حذف", value: Permissions?.stockInventory?.deleteAdjustment },
        ],
      },
      {
        id: "product_categories",
        label: "تصنيفات الأصناف",
        permissions: [
          { id: "view", label: "عرض", value: "تصنيفات المنتجات.عرض" },
          { id: "add", label: "إضافة", value: "تصنيفات المنتجات.إضافة" },
          { id: "edit", label: "تعديل", value: "تصنيفات المنتجات.تعديل" },
          { id: "delete", label: "حذف", value: "تصنيفات المنتجات.حذف" },
        ],
      },
      {
        id: "units",
        label: "الوحدات",
        permissions: [
          { id: "view", label: "عرض", value: "وحدات القياس.عرض" },
          { id: "add", label: "إضافة", value: "وحدات القياس.إضافة" },
          { id: "edit", label: "تعديل", value: "وحدات القياس.تعديل" },
          { id: "delete", label: "حذف", value: "وحدات القياس.حذف" },
        ],
      },
      {
        id: "additions",
        label: "الإضافات",
        permissions: [
          { id: "view", label: "عرض", value: "الإضافات.عرض" },
          { id: "add", label: "إضافة", value: "الإضافات.إضافة" },
          { id: "edit", label: "تعديل", value: "الإضافات.تعديل" },
          { id: "delete", label: "حذف", value: "الإضافات.حذف" },
        ],
      },
    ],
  },
  {
    id: "sales",
    label: "المبيعات",
    pages: [
      {
        id: "invoices_a4",
        label: "فواتير ال a4",
        permissions: [
          { id: "view", label: "عرض", value: Permissions?.salesOrders?.view },
          { id: "add", label: "إضافة", value: Permissions?.salesOrders?.addA4 },
        ],
      },
      {
        id: "invoices_pos",
        label: "فواتير ال pos",
        permissions: [
          { id: "view", label: "عرض", value: Permissions?.salesOrders?.pos },
          { id: "add", label: "إضافة", value: Permissions?.salesOrders?.addpos },
        ],
      },
      {
        id: "gift_cards",
        label: "بطاقات الهدايا",
        permissions: [
          { id: "view", label: "عرض", value: Permissions?.giftCards?.view },
          { id: "add", label: "إضافة", value: Permissions?.giftCards?.add },
          { id: "edit", label: "تعديل", value: Permissions?.giftCards?.edit },
          { id: "delete", label: "حذف", value: Permissions?.giftCards?.delete },
        ],
      },
      {
        id: "sales_returns",
        label: "المرتجعات",
        permissions: [
          { id: "view", label: "عرض", value: Permissions?.salesReturns?.view },
          { id: "add", label: "إضافة", value: Permissions?.salesReturns?.add },
        ],
      },
    ],
  },
  {
    id: "quotations",
    label: "عروض الاسعار",
    pages: [
      {
        id: "quotations_list",
        label: "قائمة عروض الاسعار",
        permissions: [
          { id: "view", label: "عرض", value: Permissions?.quotations?.add },
          { id: "edit", label: "تعديل", value: Permissions?.quotations?.edit },
          { id: "delete", label: "حذف", value: Permissions?.quotations?.delete },
        ],
      },
      {
        id: "quotations_add",
        label: "إضافة عرض سعر",
        permissions: [{ id: "add", label: "إضافة", value: "عروض الأسعار.إضافة" }],
      },
    ],
  },
  {
    id: "purchases",
    label: "المشتريات",
    pages: [
      {
        id: "purchases_list",
        label: "قائمة المشتريات",
        permissions: [
          {
            id: "view",
            label: "عرض",
            value: "أوامر الشراء.عرض",
          },
          { id: "edit", label: "تعديل", value: "أوامر الشراء.تعديل" },
          { id: "delete", label: "حذف", value: "أوامر الشراء.إلغاء" },
        ],
      },
      {
        id: "purchases_add",
        label: "إضافة مشتريات",
        permissions: [
          {
            id: "add",
            label: "إضافة",
            value: "أوامر الشراء.إضافة",
          },
        ],
      },
    ],
  },
  {
    id: "users",
    label: "المستخدمين",
    pages: [
      {
        id: "users_list",
        label: "قائمة المستخدمين",
        permissions: [
          {
            id: "view",
            label: "عرض",
            value: "المستخدمين.عرض",
          },

          {
            id: "add",
            label: "إضافة",
            value: "المستخدمين.إضافة",
          },
          {
            id: "edit",
            label: "تعديل",
            value: "المستخدمين.تعديل",
          },
          {
            id: "delete",
            label: "حذف ",
            value: "المستخدمين.حذف",
          },
        ],
      },
      {
        id: "roles",
        label: "الصلاحيات",
        permissions: [
          {
            id: "view",
            label: "عرض الصلاحيات",
            value: Permissions?.roles?.view,
          },
          {
            id: "add",
            label: "إضافة صلاحيات",
            value: Permissions?.roles?.add,
          },
          {
            id: "edit",
            label: "تعديل الصلاحيات",
            value: Permissions?.roles?.edit,
          },
          {
            id: "delete",
            label: "حذف الصلاحيات",
            value: Permissions?.roles?.delete,
          },
        ],
      },
      {
        id: "employees",
        label: "الموظفين",
        permissions: [
          {
            id: "view",
            label: "عرض",
            value: Permissions?.employees?.view,
          },

          {
            id: "add",
            label: "إضافة",
            value: Permissions?.employees?.add,
          },
          {
            id: "edit",
            label: "تعديل",
            value: Permissions?.employees?.edit,
          },
          {
            id: "delete",
            label: "حذف ",
            value: Permissions?.employees?.delete,
          },
        ],
      },
    ],
  },
   {
    id: "shifts",
    label: "الورديات",
    pages: [
      {
        id: "shifts_list",
        label: "قائمة الورديات",
        permissions: [
          {
            id: "view",
            label: "عرض",
            value: Permissions?.shifts?.view,
          },

          {
            id: "add",
            label: "فتح",
            value: Permissions?.shifts?.open,
          },
          {
            id: "edit",
            label: "غلق",
            value: Permissions?.shifts?.close,
          },
         
        ],
      },
    ],
  },
  {
    id: "customers",
    label: "العملاء",
    pages: [
      {
        id: "customers_list",
        label: "قائمة العملاء",
        permissions: [
          { id: "view", label: "عرض", value: "العملاء.عرض" },
          { id: "add", label: "إضافة", value: "العملاء.إضافة" },
          { id: "edit", label: "تعديل", value: "العملاء.تعديل" },
          { id: "delete", label: "حذف", value: "العملاء.تعطيل" },
        ],
      },
      {
        id: "collections",
        label: "سندات القبض",
        permissions: [
          { id: "view", label: "عرض", value: "معاملات العملاء.عرض" },
          { id: "add", label: "إضافة", value: "معاملات العملاء.إضافة" },
          { id: "edit", label: "تعديل", value: "معاملات العملاء.تعديل" },
          { id: "delete", label: "حذف", value: "معاملات العملاء.حذف" },
        ],
      },
    ],
  },
  {
    id: "suppliers",
    label: "الموردين",
    pages: [
      {
        id: "suppliers_list",
        label: "قائمة الموردين",
        permissions: [
          { id: "view", label: "عرض", value: "الموردين.عرض" },
          { id: "add", label: "إضافة", value: "الموردين.إضافة" },
          { id: "edit", label: "تعديل", value: "الموردين.تعديل" },
          { id: "delete", label: "حذف", value: "الموردين.حذف" },
        ],
      },
      {
        id: "supplier_transactions",
        label: "سندات صرف",
        permissions: [
          { id: "view", label: "عرض", value: "معاملات الموردين.عرض" },
          { id: "add", label: "إضافة", value: "معاملات الموردين.إضافة" },
          { id: "edit", label: "تعديل", value: "معاملات الموردين.تعديل" },
          { id: "delete", label: "حذف", value: "معاملات الموردين.حذف" },
        ],
      },
    ],
  },
  {
    id: "treasury",
    label: "الخزائن",
    pages: [
      {
        id: "treasury_list",
        label: "قائمة الخزائن",
        permissions: [
          { id: "view", label: "عرض", value: "الخزائن.عرض" },
          { id: "add", label: "إضافة", value: "الخزائن.إضافة" },
          { id: "edit", label: "تعديل", value: "الخزائن.تعديل" },
          { id: "delete", label: "حذف", value: "الخزائن.حذف" },
        ],
      },
      {
        id: "treasury_statement",
        label: "كشف حساب خزينة",
        permissions: [{ id: "view", label: "عرض", value: "الخزائن.عرض الكشف" }],
      },
      {
        id: "internal_transfers",
        label: "تحويلات داخلية",
        permissions: [
          { id: "view", label: "عرض", value: "الخزائن.عرض التحويلات" },
          { id: "add", label: "إضافة", value: "الخزائن.تحويل" },
          { id: "edit", label: "تعديل", value: "الخزائن.تحويل" },
          { id: "delete", label: "حذف", value: "الخزائن.سحب" },
        ],
      },
    ],
  },
  {
    id: "branches",
    label: "الفروع",
    pages: [
      {
        id: "branches_list",
        label: "قائمة الفروع",
        permissions: [
          { id: "view", label: "عرض", value: "الفروع.عرض" },
          { id: "add", label: "إضافة", value: "الفروع.إضافة" },
          { id: "edit", label: "تعديل", value: "الفروع.تعديل" },
        ],
      },
    ],
  },
  {
    id: "warehouses",
    label: "المخازن",
    pages: [],
    permissions: [
      { id: "view", label: "عرض", value: "المستودعات.عرض" },
      { id: "add", label: "إضافة", value: "المستودعات.إضافة" },
      { id: "edit", label: "تعديل", value: "المستودعات.تعديل" },
      { id: "delete", label: "حذف", value: "المستودعات.حذف" },
    ],
  },
  {
    id: "expenses",
    label: "المصروفات",
    pages: [],
    permissions: [
      { id: "view", label: "عرض", value: "المصروفات.عرض" },
      { id: "add", label: "إضافة", value: "المصروفات.إضافة" },
      { id: "edit", label: "تعديل", value: "المصروفات.تعديل" },
      { id: "delete", label: "حذف", value: "المصروفات.حذف" },
    ],
  },
  {
    id: "items",
    label: "البنود",
    pages: [],
    permissions: [
      { id: "view", label: "عرض", value: "البنود.عرض" },
      { id: "add", label: "إضافة", value: "البنود.إضافة" },
      { id: "edit", label: "تعديل", value: "البنود.تعديل" },
      { id: "delete", label: "حذف", value: "البنود.حذف" },
    ],
  },
  {
    id: "reports",
    label: "التقارير",
    pages: [
      {
        id: "items_reports",
        label: "تقارير الأصناف",
        permissions: [
          { id: "inventory", label: "تقرير جرد الأصناف", value: Permissions?.reports?.products?.inventory },
          { id: "stockAlerts", label: "تقرير تنبيهات المخزون", value: Permissions?.reports?.products?.stockAlerts },
          { id: "movement", label: "تقرير حركة الصنف", value: Permissions?.reports?.products?.movement },
          { id: "topSelling", label: "تقرير المنتج الأكثر مبيعًا", value: Permissions?.reports?.products?.topSelling },
        ],
      },
      {
        id: "sales_reports",
        label: "تقارير المبيعات",
        permissions: [
          { id: "daily", label: "إجمالي المبيعات على مستوى الأيام", value: "التقارير.مبيعات على مستوى الايام" },
          { id: "invoices", label: "إجمالي المبيعات على مستوى الفواتير", value: "التقارير.مبيعات على مستوى ارقام الفواتير" },
          { id: "returns", label: "تقرير مرتجع المبيعات", value: "التقارير.مرتجع المبيعات" },
          { id: "employee", label: "تقرير مبيعات موظف", value: "التقارير.مبيعات موظف" },
          { id: "sales", label: "تقرير مبيعات صنف", value: Permissions?.reports?.products?.sales },
        ],
      },
      {
        id: "purchase_reports",
        label: "تقارير المشتريات",
        permissions: [
          { id: "daily", label: "تقرير مشتريات على مستوى الأيام", value: "التقارير.مشتريات على مستوى الايام" },
          { id: "invoices", label: "تقرير مشتريات على مستوى الفواتير", value: "التقارير.مشتريات على مستوى ارقام الفواتير" },
          { id: "purchases", label: "تقرير مشتريات صنف", value: Permissions?.reports?.products?.purchases },
        ],
      },
      {
        id: "customer_reports",
        label: "تقارير العملاء",
        permissions: [{ id: "list", label: "تقرير كشف حساب عميل", value: "التقارير.العملاء" }],
      },
      {
        id: "supplier_reports",
        label: "تقارير الموردين",
        permissions: [{ id: "list", label: "تقرير كشف حساب مورد", value: "التقارير.الموردين" }],
      },
      {
        id: "expenses_reports",
        label: "تقارير المصروفات",
        permissions: [{ id: "list", label: "تقرير المصروفات", value: "التقارير.المصروفات" }],
      },
      {
        id: "profits_reports",
        label: "تقارير الأرباح",
        permissions: [{ id: "list", label: "تقرير الأرباح", value: Permissions?.reports?.profits?.list }],
      },
    ],
  },
];


type CheckedMap = Record<string, boolean>;

function leafKey(gIdx: number, pIdx: number, permIdx: number, subIdx?: number): string {
  return subIdx !== undefined ? `${gIdx}_${pIdx}_${permIdx}_${subIdx}` : `${gIdx}_${pIdx}_${permIdx}`;
}

function buildInitialState(groups: Group[]): CheckedMap {
  const map: CheckedMap = {};
  groups.forEach((g, gi) => {
    g.pages.forEach((page, pi) => {
      page.permissions.forEach((perm, ri) => {
        if ((perm.subPermissions ?? []).length > 0) {
          perm.subPermissions!.forEach((_, si) => {
            map[leafKey(gi, pi, ri, si)] = false;
          });
        } else {
          map[leafKey(gi, pi, ri)] = false;
        }
      });
    });

    (g.permissions ?? []).forEach((_, ri) => {
      map[leafKey(gi, -1, ri)] = false;
    });
  });
  return map;
}

function getStatus(keys: string[], map: CheckedMap): "none" | "some" | "all" {
  if (keys.length === 0) return "none";
  const checked = keys.filter((k) => map[k]).length;
  if (checked === 0) return "none";
  if (checked === keys.length) return "all";
  return "some";
}

function keysForGroup(groups: Group[], gi: number): string[] {
  const g = groups[gi];

  const pageKeys = g.pages.flatMap((page, pi) => page.permissions.flatMap((perm, ri) => ((perm.subPermissions ?? []).length > 0 ? perm.subPermissions!.map((_, si) => leafKey(gi, pi, ri, si)) : [leafKey(gi, pi, ri)])));

  const directKeys = (g.permissions ?? []).map((_, ri) => leafKey(gi, -1, ri));

  return [...pageKeys, ...directKeys];
}

function keysForPage(gi: number, pi: number, page: Page): string[] {
  return page.permissions.flatMap((perm, ri) => ((perm.subPermissions ?? []).length > 0 ? perm.subPermissions!.map((_, si) => leafKey(gi, pi, ri, si)) : [leafKey(gi, pi, ri)]));
}

function keysForPerm(gi: number, pi: number, ri: number, perm: Permission): string[] {
  return (perm.subPermissions ?? []).length > 0 ? perm.subPermissions!.map((_, si) => leafKey(gi, pi, ri, si)) : [leafKey(gi, pi, ri)];
}

function collectSelectedPermissions(groups: Group[], checked: CheckedMap): string[] {
  const result = new Set<string>();
  groups.forEach((g, gi) => {
    g.pages.forEach((page, pi) => {
      page.permissions.forEach((perm, ri) => {
        if ((perm.subPermissions ?? []).length > 0) {
          perm.subPermissions!.forEach((sub, si) => {
            if (checked[leafKey(gi, pi, ri, si)]) {
              result.add(sub.value);
            }
          });
        } else {
          if (checked[leafKey(gi, pi, ri)]) {
            result.add(perm.value!);
          }
        }
      });
    });
    (g.permissions ?? []).forEach((perm, ri) => {
      if (checked[leafKey(gi, -1, ri)] && perm.value) {
        result.add(perm.value);
      }
    });
  });
  return Array.from(result);
}

function TreeCheckbox({ status, onChange }: { status: "none" | "some" | "all"; onChange: () => void }) {
  return <Checkbox checked={status === "all"} data-state={status === "some" ? "indeterminate" : status === "all" ? "checked" : "unchecked"} onCheckedChange={onChange} className="shrink-0" />;
}

export default function PermissionsTree() {
  const [checked, setChecked] = useState<CheckedMap>(buildInitialState(GROUPS));
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());
  const [openPages, setOpenPages] = useState<Set<string>>(new Set());
  const [openPerms, setOpenPerms] = useState<Set<string>>(new Set());
  const [roleName, setRoleName] = useState("");
  const navigate = useNavigate();
  const { mutateAsync: createRole } = useCreateRole();
  const { mutateAsync: updateRole } = useUpdateRole();
  const { id } = useParams();
  const { data: detailsRole } = useGetRoleById(id);
  const isEditMode = !!id;
  useEffect(() => {
    if (id && detailsRole) {
      setRoleName(detailsRole?.roleName);
    }
  }, [id, detailsRole]);
  useEffect(() => {
    if (!detailsRole?.permissions) return;

    const permissionsSet = new Set(detailsRole.permissions);

    const newChecked: CheckedMap = {};

    GROUPS.forEach((g, gi) => {
      g.pages.forEach((page, pi) => {
        page.permissions.forEach((perm, ri) => {
          if ((perm.subPermissions ?? []).length > 0) {
            perm.subPermissions!.forEach((sub, si) => {
              const key = leafKey(gi, pi, ri, si);
              newChecked[key] = permissionsSet.has(sub.value);
            });
          } else {
            const key = leafKey(gi, pi, ri);
            newChecked[key] = permissionsSet.has(perm.value!);
          }
        });
      });

      (g.permissions ?? []).forEach((perm, ri) => {
        const key = leafKey(gi, -1, ri);
        newChecked[key] = permissionsSet.has(perm.value!);
      });
    });

    setChecked(newChecked);
  }, [detailsRole]);

  const toggle = (set: Set<string>, key: string) => {
    const next = new Set(set);
    next.has(key) ? next.delete(key) : next.add(key);
    return next;
  };

  const setKeys = (keys: string[], val: boolean) => {
    setChecked((prev) => {
      const next = { ...prev };
      keys.forEach((k) => (next[k] = val));
      return next;
    });
  };

  const toggleSub = (key: string) => {
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const selectedPermissions = collectSelectedPermissions(GROUPS, checked);
  const handleSubmit = async () => {
    console.log(selectedPermissions);
    console.log(roleName);
    if (isEditMode) {
      await updateRole({ roleId: id, permissions: selectedPermissions });
    } else {
      await createRole({ roleName: roleName, permissions: selectedPermissions });
    }
    navigate("/roles");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>إضافة صلاحية جديدة</CardTitle>
        <CardDescription>حدد الصفحات والأذونات المناسبة</CardDescription>
        <CardAction>
          <Button size="xl" variant="outline" asChild>
            <Link to="/roles">
              الرجوع لقائمة الصلاحيات
              <ArrowLeft size={16} />
            </Link>
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="rounded-lg border  p-5">
          <Label htmlFor="role-name" className="mb-2 block">
            اسم الصلاحية
          </Label>
          <Input id="role-name" value={roleName} onChange={(e) => setRoleName(e.target.value)} placeholder="مثال: مدير المبيعات" />
        </div>
        <div className="rounded-lg border p-5 overflow-hidden">
          <div className="mb-2 text-sm font-medium text-foreground">
            الصفحات <span className="text-destructive">*</span>
          </div>

          <div className="rounded-xl border border-border overflow-hidden bg-card">
            {GROUPS.map((group, gi) => {
              const gKeys = keysForGroup(GROUPS, gi);
              const gStatus = getStatus(gKeys, checked);
              const gOpen = openGroups.has(`g_${gi}`);

              return (
                <div key={`g_${gi}`} className={cn(gi !== GROUPS.length - 1 && "border-b border-border")}>
                  <div className={cn("flex items-center gap-2 px-3 py-2.5 hover:bg-muted/70 cursor-pointer select-none", gStatus === "some" ? "bg-primary/5" : "bg-muted/40")} onClick={() => setOpenGroups(toggle(openGroups, `g_${gi}`))}>
                    <div onClick={(e) => e.stopPropagation()}>
                      {" "}
                      <TreeCheckbox status={gStatus} onChange={() => setKeys(gKeys, gStatus !== "all")} />
                    </div>{" "}
                    <Folder className={cn("w-4 h-4 shrink-0", gStatus !== "none" ? "text-primary" : "text-amber-500")} />
                    <span className={cn("flex-1 text-sm font-medium", gStatus !== "none" ? "text-primary" : "text-foreground")}>{group.label}</span>
                    {gStatus === "some" && <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">جزئي</span>}
                    <ChevronLeft className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform", gOpen && "-rotate-90")} />
                  </div>

                  {gOpen && (
                    <div>
                      {group.pages.map((page, pi) => {
                        const pKeys = keysForPage(gi, pi, page);
                        const pStatus = getStatus(pKeys, checked);
                        const pageKey = `p_${gi}_${pi}`;
                        const pOpen = openPages.has(pageKey);

                        return (
                          <div key={pageKey} className={cn(pi !== group.pages.length - 1 && "border-b border-border")}>
                            <div
                              className={cn(
                                "flex items-center gap-2 px-3 py-2 pr-7 cursor-pointer select-none",
                                pStatus === "some" ? "bg-primary/5 hover:bg-primary/10" : "bg-background hover:bg-muted/40", // ← هنا
                              )}
                              onClick={() => setOpenPages(toggle(openPages, pageKey))}
                            >
                              <div onClick={(e) => e.stopPropagation()}>
                                {" "}
                                <TreeCheckbox status={pStatus} onChange={() => setKeys(pKeys, pStatus !== "all")} />
                              </div>{" "}
                              <Folder className={cn("w-3.5 h-3.5 shrink-0", pStatus !== "none" ? "text-primary" : "text-amber-400")} />
                              <span className={cn("flex-1 text-sm", pStatus !== "none" ? "text-primary font-medium" : "text-foreground")}>{page.label}</span>
                              <ChevronLeft className={cn("w-3 h-3 text-muted-foreground transition-transform", pOpen && "-rotate-90")} />
                            </div>

                            {pOpen && (
                              <div>
                                {page.permissions.map((perm, ri) => {
                                  const permKeys = keysForPerm(gi, pi, ri, perm);
                                  const hasSubs = (perm.subPermissions ?? []).length > 0;
                                  const permStatus = hasSubs ? getStatus(permKeys, checked) : "none";
                                  const permKey = `r_${gi}_${pi}_${ri}`;
                                  const permOpen = openPerms.has(permKey);
                                  const singleKey = leafKey(gi, pi, ri);

                                  return (
                                    <div key={permKey} className={cn(ri !== page.permissions.length - 1 && "border-b border-border")}>
                                      <div className="flex items-center gap-2 px-3 py-2 pr-12 bg-muted/10 select-none">
                                        {hasSubs ? (
                                          <div onClick={(e) => e.stopPropagation()}>
                                            <TreeCheckbox status={permStatus} onChange={() => setKeys(permKeys, permStatus !== "all")} />
                                          </div>
                                        ) : (
                                          <Checkbox checked={checked[singleKey] ?? false} onCheckedChange={() => toggleSub(singleKey)} />
                                        )}
                                        <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                        <span className={cn("flex-1 text-sm text-muted-foreground", hasSubs && "cursor-pointer hover:text-foreground")} onClick={() => hasSubs && setOpenPerms(toggle(openPerms, permKey))}>
                                          {perm.label}
                                        </span>
                                        {hasSubs && <ChevronLeft className={cn("w-3 h-3 text-muted-foreground transition-transform cursor-pointer", permOpen && "-rotate-90")} onClick={() => setOpenPerms(toggle(openPerms, permKey))} />}
                                      </div>

                                      {permOpen && hasSubs && (
                                        <div className="bg-background">
                                          {perm.subPermissions!.map((sub, si) => {
                                            const subKey = leafKey(gi, pi, ri, si);
                                            const isChecked = checked[subKey] ?? false;
                                            return (
                                              <div key={subKey} className={cn("flex items-center gap-2 px-3 py-1.5 pr-16 cursor-pointer hover:bg-muted/20 select-none", si !== perm.subPermissions!.length - 1 && "border-b border-border/50")} onClick={() => toggleSub(subKey)}>
                                                <Checkbox checked={isChecked} onCheckedChange={() => toggleSub(subKey)} onClick={(e) => e.stopPropagation()} className="shrink-0" />
                                                <span className={cn("text-xs", isChecked ? "text-foreground font-medium" : "text-muted-foreground")}>{sub.label}</span>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {(group.permissions ?? []).map((perm, ri) => {
                        const key = leafKey(gi, -1, ri);
                        return (
                          <div key={key} className={cn("flex items-center gap-2 px-3 py-2 pr-7 bg-background border-t border-border select-none")}>
                            <Checkbox checked={checked[key] ?? false} onCheckedChange={() => toggleSub(key)} />
                            <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <span className="flex-1 text-sm text-foreground">{perm.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* {selectedPermissions.length > 0 && (
            <div className="mt-4 p-3 rounded-lg bg-muted/30 border border-border">
              <p className="text-xs font-medium text-muted-foreground mb-2">الصلاحيات المختارة:</p>
              <div className="flex flex-wrap gap-1">
                {selectedPermissions.map((p) => (
                  <span key={p} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )} */}
        </div>
        <div className="flex gap-3 justify-end">
          <Button size="2xl" variant="outline">
            إلغاء
          </Button>
          <Button size="2xl" onClick={() => handleSubmit()} disabled={!roleName.trim()}>
            حفظ الصلاحية
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
