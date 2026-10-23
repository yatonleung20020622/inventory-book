/** Parse the first number from a free-text price like "1,200 HKD" or "120". */
export function parsePriceAmount(value: string): number {
  const match = value.trim().replace(/,/g, "").match(/-?\d+(?:\.\d+)?/);
  if (!match) {
    return 0;
  }
  const amount = Number(match[0]);
  return Number.isFinite(amount) ? amount : 0;
}

export function itemLineValue(price: string, quantity: number): number {
  const qty = Number.isFinite(quantity) ? Math.max(0, quantity) : 0;
  return parsePriceAmount(price) * qty;
}

export function sumItemValues(
  items: { estimatedPrice: string; actualPrice: string; quantity: number }[],
): { estimatedTotal: number; actualTotal: number } {
  let estimatedTotal = 0;
  let actualTotal = 0;
  for (const item of items) {
    estimatedTotal += itemLineValue(item.estimatedPrice, item.quantity);
    actualTotal += itemLineValue(item.actualPrice, item.quantity);
  }
  return { estimatedTotal, actualTotal };
}

export function formatHkdTotal(amount: number): string {
  return `${amount.toLocaleString("en-HK", {
    maximumFractionDigits: 2,
  })} HKD`;
}
