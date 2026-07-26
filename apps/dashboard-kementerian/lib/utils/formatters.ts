// ============================================
// Number Formatting Utilities
// ============================================

/**
 * Convert any value safely to number
 */
function toNum(val: any): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const parsed = Number(val);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Format number to Triliun (T) display
 */
export function fmtTriliun(value: any): string {
  const num = toNum(value);
  if (num >= 1_000_000_000_000_000) {
    return `${(num / 1_000_000_000_000_000).toFixed(1)} Kuadriliun`;
  }
  if (num >= 1_000_000_000_000) {
    return `${(num / 1_000_000_000_000).toFixed(1)} T`;
  }
  if (num >= 1_000_000_000) {
    return `${(num / 1_000_000_000).toFixed(1)} M`;
  }
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)} Jt`;
  }
  return fmtRupiah(num);
}

/**
 * Format number to Rupiah currency format
 */
export function fmtRupiah(value: any): string {
  const num = toNum(value);
  return new Intl.NumberFormat('id-ID', {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * Format percentage
 */
export function fmtPct(value: any): string {
  const num = toNum(value);
  return `${num.toFixed(1)}%`;
}

/**
 * Parse formatted string back to number
 */
export function parseNumber(value: any): number {
  if (typeof value === 'number') return isNaN(value) ? 0 : value;
  if (!value) return 0;
  return Number(String(value).replace(/[^0-9.-]/g, '')) || 0;
}

/**
 * Get color class based on percentage
 */
export function getPctColor(pct: any): string {
  const num = toNum(pct);
  if (num >= 80) return 'text-emerald-600';
  if (num >= 50) return 'text-amber-600';
  return 'text-rose-600';
}

export function getPctBgColor(pct: any): string {
  const num = toNum(pct);
  if (num >= 80) return 'bg-emerald-100 text-emerald-700 border-emerald-300';
  if (num >= 50) return 'bg-amber-100 text-amber-700 border-amber-300';
  return 'bg-rose-100 text-rose-700 border-rose-300';
}

export function getPctEmoji(pct: any): string {
  const num = toNum(pct);
  if (num >= 80) return '🟢';
  if (num >= 50) return '🟡';
  return '🔴';
}
