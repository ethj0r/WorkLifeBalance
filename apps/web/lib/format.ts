export function formatIDR(value: number) {
  return "Rp " + value.toLocaleString("id-ID");
}

export function formatIDRShort(value: number) {
  if (!value) return "—";
  return "Rp " + (value / 1_000_000).toFixed(1).replace(".", ",") + " jt";
}

export function decimalID(value: number, digits = 1) {
  return value.toLocaleString("id-ID", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}
