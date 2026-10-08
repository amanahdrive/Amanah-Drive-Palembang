export const formatRupiah = (value: number): string => {
  if (value == null || isNaN(value)) return "Rp 0";
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(Math.round(value));
  const parts = abs.toString().split("");
  const grouped: string[] = [];
  for (let i = parts.length - 1, c = 0; i >= 0; i--, c++) {
    if (c > 0 && c % 3 === 0) grouped.unshift(".");
    grouped.unshift(parts[i]);
  }
  return `${sign}Rp ${grouped.join("")}`;
};

export const formatRupiahShort = (value: number): string => {
  if (value == null || isNaN(value)) return "Rp 0";
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1_000_000_000) return `${sign}Rp ${(abs / 1_000_000_000).toFixed(1)}M`;
  if (abs >= 1_000_000) return `${sign}Rp ${(abs / 1_000_000).toFixed(1)}jt`;
  if (abs >= 1_000) return `${sign}Rp ${(abs / 1_000).toFixed(0)}rb`;
  return formatRupiah(value);
};

export const parseNumberInput = (raw: string): number => {
  const cleaned = raw.replace(/[^\d]/g, "");
  return cleaned.length === 0 ? 0 : parseInt(cleaned, 10);
};

export const formatDateID = (iso: string): string => {
  try {
    const d = new Date(iso);
    const months = [
      "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
      "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
    ];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return iso;
  }
};

export const formatDateTimeID = (iso: string): string => {
  try {
    const d = new Date(iso);
    const date = formatDateID(iso);
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${date} • ${hh}:${mm}`;
  } catch {
    return iso;
  }
};
