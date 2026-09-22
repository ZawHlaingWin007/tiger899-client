/**
 * Format a number with thousand separators (e.g. 10000 -> "10,000").
 * @param {number|string} value - Amount to format
 * @param {number} maxDecimals - Max decimal places (default 2)
 * @returns {string} Formatted string
 */
export function formatAmount(value, maxDecimals = 2) {
  const n = Number(value);
  if (isNaN(n)) return "0";
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals,
  });
}

export function useFormatAmount() {
  return { formatAmount };
}
