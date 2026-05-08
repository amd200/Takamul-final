export const getNextOrderNumber = (items?: { orderNumber?: string; purchaseOrderNumber?: string }[]) => {
  if (!items?.length) return "SO-D1-000001";

  const lastOrder = [...items].sort((a, b) => {
    const aNum = a.orderNumber ?? a.purchaseOrderNumber ?? "";
    const bNum = b.orderNumber ?? b.purchaseOrderNumber ?? "";
    return bNum.localeCompare(aNum);
  })[0];

  const lastNumber = lastOrder?.orderNumber ?? lastOrder?.purchaseOrderNumber;
  if (!lastNumber) return "SO-D1-000001";

  const prefix = lastNumber.slice(0, lastNumber.lastIndexOf("-") + 1);
  const numPart = parseInt(lastNumber.split("-").pop() || "0", 10);
  const nextNum = String(numPart + 1).padStart(6, "0");

  return `${prefix}${nextNum}`;
};
