import { useState } from "react";
import { useGetAllProducts } from "@/features/products/hooks/useGetAllProducts";
import { useLanguage } from "@/context/LanguageContext";
import { Popover, PopoverContent, PopoverAnchor } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Product } from "@/features/products/types/products.types";
import { usePos } from "@/context/PosContext";
import { usePosStore } from "@/features/pos/store/usePosStore";
import { Maximize } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGetAllSales } from "@/features/sales/hooks/useGetAllSales";

export default function Topbar() {
  const [search, setSearch] = useState("");
  const { data: products } = useGetAllProducts({ page: 1, limit: 10000, SearchTerm: search });
  const { t } = useLanguage();
  const { setCart } = usePosStore();
  const [open, setOpen] = useState(false);

  const filteredProducts =
    search.trim().length > 0
      ? (products?.items ?? []).filter((p: Product) => {
          const searchLower = search.toLowerCase();
          return p.productNameAr?.includes(search) || p.productNameEn?.toLowerCase().includes(searchLower) || p.barcode?.includes(searchLower);
        })
      : [];

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  };

  return (
    <div className="bg-card border-b border-border px-3 md:px-5 py-3 flex items-center gap-3">
      <Popover open={open && filteredProducts.length > 0} onOpenChange={setOpen}>
        <PopoverAnchor asChild>
          <div className="relative w-full">
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              onBlur={() => setTimeout(() => setOpen(false), 200)}
              placeholder={t("search_products")}
              className="w-full pl-5 pr-12 h-10 bg-[#f6f6f6] focus:border-primary/40"
            />
            <span className="absolute inset-y-0 right-3 flex items-center text-gray-400 pointer-events-none">
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </span>
          </div>
        </PopoverAnchor>

        <PopoverContent className="p-0" style={{ width: "var(--radix-popover-trigger-width)" }} onOpenAutoFocus={(e) => e.preventDefault()} side="bottom" align="start" sideOffset={4}>
          <div className="max-h-64 overflow-y-auto">
            {filteredProducts.map((product: Product) => (
              <div
                key={product.id}
                onMouseDown={() => {
                  setOpen(false);
                  setCart((prev) => {
                    const existing = prev.find((i) => i.productId === product.id);

                    if (existing) {
                      return prev.map((i) => (i.productId === product.id ? { ...i, qty: i.qty + 1 } : i));
                    }

                    return [
                      ...prev,
                      {
                        name: product.productNameAr,
                        productNameEn: product.productNameEn,
                        productNameUr: product.productNameUr,
                        price: product.sellingPrice,
                        qty: 1,
                        note: "",
                        op: null,
                        taxamount: product.taxAmount,
                        productId: product.id,
                        taxCalculation: product.taxCalculation,
                      },
                    ];
                  });
                }}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                {/* {product.image && (
                  <img
                    src={product.image}
                    alt={product.productNameAr}
                    className="w-8 h-8 rounded object-cover flex-shrink-0"
                  />
                )} */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{product.productNameAr}</p>
                  {product.productNameEn && <p className="text-xs text-muted-foreground truncate">{product.productNameEn}</p>}
                </div>
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <Button onClick={toggleFullScreen} variant="outline" size="icon" className="w-10 h-10 border-[#000052] text-[#000052] hover:bg-[#000052] hover:text-white dark:border-border dark:text-foreground dark:hover:bg-muted dark:hover:text-foreground transition-colors duration-200 shrink-0" title="ملء الشاشة">
        <Maximize size={18} />
      </Button>
    </div>
  );
}
