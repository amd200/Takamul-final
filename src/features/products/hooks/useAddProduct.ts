import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useGetAllTaxes } from "@/features/taxes/hooks/useGetAllTaxes";
import { useGetAllMainCategories } from "@/features/categories/hooks/useGetAllMainCategories";
import { useGetAllProductsDirect } from "@/features/products/hooks/useGetAllProductsDirect";
import { useGetAllProductsRawMatrial } from "@/features/products/hooks/useGetAllProductsRawMatrial";
import { useGetAllUnits } from "@/features/units/hooks/useGetAllUnits";

import { useCreateProductDirect } from "@/features/products/hooks/useCreateProductDirect";
import { useCreateProductBranched } from "@/features/products/hooks/useCreateProductBranched";
import { useCreateProductPrepared } from "@/features/products/hooks/useCreateProductPrepared";
import { useCreateProductRawMaterial } from "@/features/products/hooks/useCreateProductRawMaterial";

import { useGetProductBranchedById } from "@/features/products/hooks/useGetProductBranchedById";
import { useGetProductDirectById } from "@/features/products/hooks/useGetProductDirectById";
import { useGetProductPreparedById } from "@/features/products/hooks/useGetProductPreparedById";
import { useGetProductRawMaterialtById } from "@/features/products/hooks/useGetProductRawMaterialtById";

import { useUpdateProductBranched } from "@/features/products/hooks/useUpdateProductBranched";
import { useUpdateProductDirect } from "@/features/products/hooks/useUpdateProductDirect";
import { useUpdateProductPrepared } from "@/features/products/hooks/useUpdateProductPrepared";
import { useUpdateProductRawMatrial } from "@/features/products/hooks/useUpdateProductRawMaterial";

import useToast from "@/hooks/useToast";
import { createProductSchema, createBranchedProductSchema, createPreparedProductSchema, createRawMaterialSchema, baseDefaultValues } from "../schemas";
import { FormValues, ProductType } from "../types/products.types";
import { useSettingsStore } from "@/features/settings/store/settingsStore";

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function generateRandomBarcode() {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
}

export function createFileValidator(options: { maxFiles: number; maxSizeMB?: number; allowedTypes?: string[] }) {
  return (file: File, currentFiles: File[]) => {
    if (currentFiles.length >= options.maxFiles) return `مسموح بـ ${options.maxFiles} ملفات فقط`;
    if (options.allowedTypes && !options.allowedTypes.some((type) => file.type.startsWith(type))) return "نوع الملف غير مدعوم";
    const maxSize = (options.maxSizeMB || 200) * 1024 * 1024;
    if (file.size > maxSize) return `حجم الملف يجب أن يكون أقل من ${options.maxSizeMB || 2}MB`;
    return null;
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAddProduct() {
  const navigate = useNavigate();
  const { notifyError } = useToast();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const type = searchParams.get("type") as ProductType;

  const isEditMode = !!id;

  const [productType, setProductType] = useState<ProductType>("Direct");
  const [submitType, setSubmitType] = useState<"save" | "saveAndNew">("save");
  const [fileError, setFileError] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);

  // ── Data hooks ─────────────────────────────────────────────────────────────
  const { data: taxesData } = useGetAllTaxes();
  const { data: mainCategories } = useGetAllMainCategories();
  const { data: productsDirect } = useGetAllProductsDirect({ page: 1, limit: 100 }, { enabled: productType === "Branched" });
  const { data: productRawMatrial } = useGetAllProductsRawMatrial({ page: 1, limit: 100 }, { enabled: productType === "Prepared" });
  const { data: units } = useGetAllUnits({ page: 1, size: 100 });

  // ── Edit data hooks ────────────────────────────────────────────────────────
  const { data: productDataBranched } = useGetProductBranchedById(Number(id), {
    enabled: isEditMode && type === "Branched",
  });
  const { data: productDataDirect } = useGetProductDirectById(Number(id), {
    enabled: isEditMode && type === "Direct",
  });
  const { data: productDataPrepared } = useGetProductPreparedById(Number(id), {
    enabled: isEditMode && type === "Prepared",
  });
  const { data: productDataRawMaterial } = useGetProductRawMaterialtById(Number(id), { enabled: isEditMode && type === "RawMatrial" });

  // ── Mutation hooks ─────────────────────────────────────────────────────────
  const { mutateAsync: createProductDirect, isPending: isDirectLoading } = useCreateProductDirect();
  const { mutateAsync: createProductBranched, isPending: isBranchedLoading } = useCreateProductBranched();
  const { mutateAsync: createProductPrepared, isPending: isPreparedLoading } = useCreateProductPrepared();
  const { mutateAsync: createRawMaterial, isPending: isRawLoading } = useCreateProductRawMaterial();
  const { mutateAsync: updateProductBranched } = useUpdateProductBranched();
  const { mutateAsync: updateProductDirect } = useUpdateProductDirect();
  const { mutateAsync: updateProductPrepared } = useUpdateProductPrepared();
  const { mutateAsync: updateProductRawMatrial } = useUpdateProductRawMatrial();

  const isLoading = isDirectLoading || isBranchedLoading || isPreparedLoading || isRawLoading;
  const taxSetting = useSettingsStore((state) => state.settings.taxSetting?.taxSetting);

  // ── Form ───────────────────────────────────────────────────────────────────
  const activeSchema = productType === "Branched" ? createBranchedProductSchema : productType === "Prepared" ? createPreparedProductSchema : productType === "RawMatrial" ? createRawMaterialSchema : createProductSchema;

  const methods = useForm<FormValues>({
    resolver: zodResolver(activeSchema),
    defaultValues: baseDefaultValues,
    mode: "onChange",
    shouldFocusError: true,
  });

  const { watch, setValue, reset } = methods;

  // ── Default value side-effects ─────────────────────────────────────────────
  useEffect(() => {
    if (!isEditMode && units?.items?.length > 0) {
      setValue("BaseUnitId", units.items[0].id);
    }
  }, [units?.items, isEditMode]);

  useEffect(() => {
    if (!isEditMode && taxesData?.length > 0 && taxesData[0]?.id) {
      setValue("TaxId", taxesData[0].id);
    }
  }, [taxesData, isEditMode]);

  useEffect(() => {
    if (!isEditMode) {
      setValue("TaxCalculation", 1);
    }
  }, [isEditMode]);

  // ── Watched values ─────────────────────────────────────────────────────────
  const CostPrice = watch("CostPrice");
  const SellingPrice = watch("SellingPrice");
  const TaxId = watch("TaxId");
  const TaxCalculation = watch("TaxCalculation");
  const ImageField = watch("Image");
  const rawMaterials = watch("RawMaterials");

  // ── Price summary ──────────────────────────────────────────────────────────
  const summary = useMemo(() => {
    const selectedTax = (taxesData || []).find((t) => String(t.id) === String(TaxId)) || { id: 1, name: "بدون ضريبة", amount: 0 };

    const taxRate = (selectedTax.amount || 0) / 100;
    const inputPrice = Number(SellingPrice) || 0;

    let basePrice = inputPrice;
    let taxAmount = 0;
    let finalPrice = inputPrice;

    if (TaxCalculation === 2) {
      basePrice = inputPrice / (1 + taxRate);
      taxAmount = inputPrice - basePrice;
      finalPrice = inputPrice;
    } else if (TaxCalculation === 3) {
      basePrice = inputPrice;
      taxAmount = inputPrice * taxRate;
      finalPrice = inputPrice + taxAmount;
    }

    const cost = Number(CostPrice) || 0;
    const profit = basePrice - cost;
    const profitMargin = basePrice > 0 ? (profit / basePrice) * 100 : 0;

    return {
      basePrice: basePrice.toFixed(2),
      taxAmount: taxAmount.toFixed(2),
      finalPrice: finalPrice.toFixed(2),
      profit: profit.toFixed(2),
      profitMargin: profitMargin.toFixed(1),
      taxName: selectedTax.name,
      taxPercentage: selectedTax.amount || 0,
    };
  }, [CostPrice, SellingPrice, TaxId, TaxCalculation, taxesData]);

  useEffect(() => {
    if (productType !== "Prepared") return;

    const totalCost =
      rawMaterials?.reduce((acc, material) => {
        const selected = productRawMatrial?.items?.find((item) => item.id === material.rawMaterialId);
        const costPrice = selected?.costPrice ?? 0;
        const quantity = material.quantity ?? 0;
        return acc + costPrice * quantity;
      }, 0) ?? 0;

    setValue("CostPrice", totalCost, { shouldValidate: true });
  }, [rawMaterials, productRawMatrial?.items, productType, setValue]);

  useEffect(() => {
    if (!id) return;

    switch (type) {
      case "Direct": {
        if (!productDataDirect || !units?.items?.length) return;
        setProductType("Direct");
        reset({
          ProductNameAr: productDataDirect.productNameAr,
          ProductNameEn: productDataDirect.productNameEn,
          ProductNameUr: productDataDirect.productNameUr,
          Description: productDataDirect.description || "",
          Barcode: productDataDirect.barcode,
          SellingPrice: productDataDirect?.taxCalculation === 2 ? productDataDirect.priceAfterTax : productDataDirect.priceBeforeTax,
          CostPrice: productDataDirect.costPrice,
          MinStockLevel: productDataDirect.minStockLevel,
          TaxId: productDataDirect?.taxId,
          TaxCalculation: productDataDirect?.taxCalculation,
          CategoryId: productDataDirect?.categoryId,
          BaseUnitId: productDataDirect.baseUnitId,
          Image: productDataDirect.imageUrl ?? undefined,
        });
        break;
      }

      case "Branched": {
        if (!productDataBranched) return;
        setProductType("Branched");
        reset({
          ProductNameAr: productDataBranched.productNameAr,
          ProductNameEn: productDataBranched.productNameEn,
          ProductNameUr: productDataBranched.productNameUr,
          Description: productDataBranched.description || "",
          ChildrenIds: productDataBranched.children?.map((c) => c?.id)?.filter((id): id is number => typeof id === "number") || [],
          CategoryId: productDataDirect?.categoryId,
        });
        break;
      }

      case "Prepared": {
        if (!productDataPrepared) return;
        setProductType("Prepared");
        reset({
          ProductNameAr: productDataPrepared.productNameAr,
          ProductNameEn: productDataPrepared.productNameEn,
          ProductNameUr: productDataPrepared.productNameUr,
          Description: productDataPrepared.description || "",
          Barcode: productDataPrepared.barcode,
          SellingPrice: productDataPrepared?.taxCalculation === 2 ? productDataPrepared.priceAfterTax : productDataPrepared.priceBeforeTax,
          CostPrice: productDataPrepared.costPrice,
          TaxCalculation: productDataPrepared?.taxCalculation,
          CategoryId: productDataPrepared?.categoryId,
          TaxId: productDataPrepared?.taxId,
          BaseUnitId: productDataPrepared?.baseUnitId,
          RawMaterials:
            productDataPrepared.components?.map((c) => ({
              rawMaterialId: c.componentProductId,
              quantity: c.quantity,
              unitId: c?.unitId,
            })) || [],
        });
        break;
      }

      case "RawMatrial": {
        if (!productDataRawMaterial) return;
        setProductType("RawMatrial");
        reset({
          ProductNameAr: productDataRawMaterial.productNameAr,
          ProductNameEn: productDataRawMaterial.productNameEn,
          ProductNameUr: productDataRawMaterial.productNameUr,
          Description: productDataRawMaterial.description || "",
          ConversionFactor: productDataRawMaterial.conversionFactor,
          CostPrice: productDataRawMaterial?.costPrice,
          PurchaseUnitId: productDataRawMaterial?.purchaseUnitId,
          BaseUnitId: productDataRawMaterial?.baseUnitId,
        });
        break;
      }

      default:
        break;
    }
  }, [id, type, reset, productDataDirect, productDataBranched, productDataPrepared, productDataRawMaterial]);

  // ── FormData builder ───────────────────────────────────────────────────────
  const buildFormData = useCallback(
    (data: FormValues): FormData => {
      const formData = new FormData();
      const skipKeys = new Set(["Image", "image", "ChildrenIds", "RawMaterials", "PurchaseUnitId", "ConversionFactor", "TaxId", "TaxCalculation"]);

      Object.entries(data).forEach(([key, value]) => {
        if (skipKeys.has(key) || value === undefined || value === null) return;
        formData.append(key, String(value));
      });

      if (productType === "Branched" && Array.isArray(data.ChildrenIds)) {
        data.ChildrenIds.forEach((childId) => formData.append("ChildrenIds[]", String(childId)));
      }

      if (productType === "Prepared" && Array.isArray(data.RawMaterials)) {
        formData.append(
          "Components",
          JSON.stringify(
            data.RawMaterials.map((m) => ({
              componentProductId: m.rawMaterialId,
              quantity: m.quantity,
              unitId: m.unitId,
            })),
          ),
        );
      }

      if (taxSetting === "Exempt") {
        formData.append("TaxId", "2");
        formData.append("TaxCalculation", "1");
      } else {
        if (data.TaxId !== undefined && data.TaxId !== null) {
          formData.append("TaxId", String(data.TaxId));
        }
        if (data.TaxCalculation !== undefined && data.TaxCalculation !== null) {
          formData.append("TaxCalculation", String(data.TaxCalculation));
        }
      }

      if (data.Image instanceof File) {
        formData.append("Image", data.Image);
      } else if (data.Image === undefined || data.Image === null) {
        formData.append("Image", "");
      }

      return formData;
    },
    [productType, taxSetting],
  );

  const buildRawMaterialJson = useCallback(
    (data: FormValues): Record<string, unknown> => ({
      productNameAr: data.ProductNameAr,
      productNameEn: data.ProductNameEn,
      productNameUr: data.ProductNameUr,
      costPrice: data.CostPrice,
      baseUnitId: data.BaseUnitId,
      purchaseUnitId: data.PurchaseUnitId,
      conversionFactor: data.ConversionFactor,
    }),
    [],
  );

  // ── Submit ─────────────────────────────────────────────────────────────────
  const onSubmit = async (data: FormValues) => {
    try {
      if (isEditMode && id) {
        if (productType === "RawMatrial") {
          const body = { ...buildRawMaterialJson(data), id: Number(id) };
          await updateProductRawMatrial({ id: Number(id), data: body });
        } else {
          const formData = buildFormData(data);
          formData.append("Id", id);
          switch (productType) {
            case "Branched":
              await updateProductBranched({ id: Number(id), data: formData });
              break;
            case "Direct":
              await updateProductDirect({ id: Number(id), data: formData });
              break;
            case "Prepared":
              await updateProductPrepared({ id: Number(id), data: formData });
              break;
            default:
              notifyError(`نوع منتج غير معروف للتعديل: ${productType}`);
          }
        }
      } else {
        if (productType === "RawMatrial") {
          await createRawMaterial(buildRawMaterialJson(data));
        } else {
          const formData = buildFormData(data);
          switch (productType) {
            case "Branched":
              await createProductBranched(formData);
              break;
            case "Prepared":
              await createProductPrepared(formData);
              break;
            default:
              await createProductDirect(formData);
          }
        }
      }

      if (submitType === "save") {
        navigate("/products");
      } else {
        reset();
      }
    } catch (error) {}
  };

  return {
    // State
    productType,
    setProductType,
    submitType,
    setSubmitType,
    fileError,
    setFileError,
    files,
    setFiles,
    isEditMode,
    isLoading,
    // Form
    methods,
    // Computed
    summary,
    // Data
    taxesData,
    mainCategories,
    productsDirect,
    productRawMatrial,
    units,
    // Actions
    navigate,
    onSubmit,
    generateRandomBarcode,
  };
}
