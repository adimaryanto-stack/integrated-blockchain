'use client';

import { getPctBgColor, fmtPct } from '@/lib/utils/formatters';

interface PctBadgeProps {
  value: number;
  size?: 'sm' | 'md';
}

export default function PctBadge({ value, size = 'sm' }: PctBadgeProps) {
  const v = Number(value) || 0;
  const emoji = v >= 80 ? '🟢' : v >= 50 ? '🟡' : '🔴';
  
  return (
    <span className={`badge ${getPctBgColor(value)} ${size === 'md' ? 'text-xs px-3 py-1' : ''}`}>
      <span>{emoji}</span>
      <span>{fmtPct(value)}</span>
    </span>
  );
}
