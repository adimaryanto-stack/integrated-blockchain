// ============================================
// Number Formatting Utilities
// ============================================

/**
 * Format number to Triliun (T) display
 */
export function fmtTriliun(value: number | null | undefined): string {
  return fmtRupiah(value);
}

/**
 * Format number to Rupiah currency format
 */
export function fmtRupiah(value: number | null | undefined): string {
  const v = Number(value) || 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(v);
}

/**
 * Format percentage
 */
export function fmtPct(value: number | null | undefined): string {
  const v = Number(value) || 0;
  return `${v.toFixed(1)}%`;
}

/**
 * Parse formatted string back to number
 */
export function parseNumber(value: string): number {
  return Number(value.replace(/[^0-9.-]/g, '')) || 0;
}

/**
 * Get color class based on percentage
 */
export function getPctColor(pct: number | null | undefined): string {
  const v = Number(pct) || 0;
  if (v >= 80) return 'text-emerald-600';
  if (v >= 50) return 'text-amber-600';
  return 'text-rose-600';
}

export function getPctBgColor(pct: number | null | undefined): string {
  const v = Number(pct) || 0;
  if (v >= 80) return 'bg-emerald-100 text-emerald-700 border-emerald-300';
  if (v >= 50) return 'bg-amber-100 text-amber-700 border-amber-300';
  return 'bg-rose-100 text-rose-700 border-rose-300';
}

export function getPctEmoji(pct: number | null | undefined): string {
  const v = Number(pct) || 0;
  if (v >= 80) return '🟢';
  if (v >= 50) return '🟡';
  return '🔴';
}
