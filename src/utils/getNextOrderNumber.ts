export const getNextOrderNumber = (items?: { orderNumber?: string; purchaseOrderNumber?: string }[]) => {
  if (!items?.length) return "SO-D1-000001";

  const lastOrder = [...items].sort((a, b) => b.orderNumber.localeCompare(a.orderNumber || a.purchaseOrderNumber))[0];

  const lastNumber = lastOrder.orderNumber || lastOrder.purchaseOrderNumber;
  const prefix = lastNumber.slice(0, lastNumber.lastIndexOf("-") + 1);
  const numPart = parseInt(lastNumber.split("-").pop() || "0", 10);
  const nextNum = String(numPart + 1).padStart(6, "0");

  return `${prefix}${nextNum}`;
};
