export function isFreeSalePrice(salePrice: string | null | undefined) {
  return (salePrice ?? "").trim() === "0";
}

export function formatSalePriceDisplay(salePrice: string | null | undefined) {
  const trimmed = (salePrice ?? "").trim();
  if (trimmed === "0") return "Free";
  return trimmed;
}
