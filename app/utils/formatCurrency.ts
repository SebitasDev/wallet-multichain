export const formatCurrency = (value: number, decimals: number = 2) => {
  // Used to avoid rounding up (e.g. 4.999 -> 5.00). We want 4.99.
  // Adding epsilon to avoid floating point issues
  const factor = Math.pow(10, decimals);
  const floored = Math.floor(value * factor + 0.00001) / factor;

  return floored.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: decimals
  });
};
