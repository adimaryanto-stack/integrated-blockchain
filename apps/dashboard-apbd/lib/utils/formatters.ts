/**
 * Format currency and numerical helpers for APBD Dashboard
 */

export function formatRupiah(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) return 'Rp 0';
  const num = Number(amount);
  return 'Rp ' + num.toLocaleString('id-ID', { maximumFractionDigits: 0 });
}

export function fmtTriliun(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) return 'Rp 0';
  const num = Number(amount);
  if (Math.abs(num) >= 1_000_000_000_000) {
    return `Rp ${(num / 1_000_000_000_000).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} T`;
  }
  if (Math.abs(num) >= 1_000_000_000) {
    return `Rp ${(num / 1_000_000_000).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} M`;
  }
  if (Math.abs(num) >= 1_000_000) {
    return `Rp ${(num / 1_000_000).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} Jt`;
  }
  return formatRupiah(num);
}

export function fmtMiliar(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) return 'Rp 0 M';
  const num = Number(amount);
  return `Rp ${(num / 1_000_000_000).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} M`;
}

export function fmtPct(pct: number | string | null | undefined): string {
  if (pct === null || pct === undefined || isNaN(Number(pct))) return '0.0%';
  const num = Number(pct);
  return `${num.toFixed(1)}%`;
}

export function parseNumberInput(val: string): number {
  if (!val) return 0;
  const clean = val.replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? 0 : parsed;
}
