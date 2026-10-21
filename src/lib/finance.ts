// Return on what a broker spends on leads, the same way everywhere:
//   ROI = (revenue - spent) / spent      e.g. +1 900 %
//   lead cost share = spent / revenue     e.g. 5 % of the revenue
// Both are null when they can't be computed (nothing spent / nothing earned).

export const roi = (spent: number, revenue: number) => (spent > 0 ? (revenue - spent) / spent : null);
export const costShare = (spent: number, revenue: number) => (revenue > 0 ? spent / revenue : null);

const PCT = new Intl.NumberFormat("fr-FR", { style: "percent", maximumFractionDigits: 0, signDisplay: "exceptZero" });
const SHARE = new Intl.NumberFormat("fr-FR", { style: "percent", maximumFractionDigits: 1 });
export const pct = (x: number | null) => (x === null ? "—" : PCT.format(x));
export const share = (x: number | null) => (x === null ? "—" : SHARE.format(x));
