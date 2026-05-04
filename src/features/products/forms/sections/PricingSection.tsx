import { Controller, useFormContext } from "react-hook-form";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormValues } from "../../types/products.types";
import { useSettingsStore } from "@/features/settings/store/settingsStore";

interface PricingSectionProps {
  taxesData?: { id: number; name: string; amount: number }[];
  summary: {
    basePrice: string;
    taxAmount: string;
    finalPrice: string;
    taxName: string;
    taxPercentage: number;
  };
  isPrepared?: boolean;
}

export function PricingSection({ taxesData, summary, isPrepared = false }: PricingSectionProps) {
  const { control } = useFormContext<FormValues>();
  const taxSetting = useSettingsStore((state) => state.settings.taxSetting?.taxSetting);
  const isFirstStage = taxSetting === "FirstStage";
  const isSecondStage = taxSetting === "SecondStage";
  const isExempt = taxSetting === "Exempt";
  

  return (
    <>
      {/* Cost Price */}
      <Controller
        name="CostPrice"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>التكلفة</FieldLabel>
            <Input {...field} value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))} type="number" placeholder="ادخل التكلفة *" readOnly={isPrepared} className={isPrepared ? "bg-gray-100 cursor-not-allowed" : ""} />
            {isPrepared && <p className="text-xs text-gray-400 mt-1">يتم حساب التكلفة تلقائياً بناءً على الخامات المضافة</p>}
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      {/* Selling Price */}
      <Controller
        name="SellingPrice"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>
              سعر البيع <span className="text-red-500">*</span>
            </FieldLabel>
            <Input {...field} value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))} type="number" placeholder="ادخل السعر *" />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      {/* Tax */}
      {!isExempt && (
        <>
          <Controller
            name="TaxId"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>
                  الضريبة المطبقة <span className="text-red-500">*</span>
                </FieldLabel>
                <Select key={field.value} value={field.value ? String(field.value) : ""} onValueChange={(value) => field.onChange(Number(value))}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="اختر الضريبة" />
                  </SelectTrigger>
                  <SelectContent side="bottom">
                    <SelectGroup>
                      {taxesData?.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          {/* Tax Calculation */}
          <Controller
            name="TaxCalculation"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>
                  طريقة حساب الضريبة <span className="text-red-500">*</span>
                </FieldLabel>
                <Select key={field.value} value={field.value ? String(field.value) : ""} onValueChange={(value) => field.onChange(Number(value))}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="اختر طريقة الحساب" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value={"1"}>لا يوجد ضريبة</SelectItem>
                      <SelectItem value={"2"}>السعر شامل الضريبة</SelectItem>
                      <SelectItem value={"3"}>السعر غير شامل الضريبة</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          {/* Price Summary Card */}
          <div className="lg:col-span-2">
            <div className="w-full bg-card border border-border rounded-xl p-5">
              <div className="flex flex-col space-y-3.5">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-[15px]">السعر قبل الضريبة</span>
                  <span className="text-muted-foreground text-[15px]">{summary.basePrice}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-primary text-[15px]">
                    ضريبة ({summary.taxPercentage}%) {summary.taxName}
                  </span>
                  <span className="text-primary text-[15px]">{summary.taxAmount} +</span>
                </div>

                <div className="border-t border-border my-0.5" />

                <div className="flex justify-between items-center pt-1">
                  <span className="text-foreground font-bold text-lg">السعر النهائي</span>
                  <span className="text-foreground font-bold text-lg">{summary.finalPrice}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
