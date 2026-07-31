'use client';

import { getPctBgColor, fmtPct, getPctEmoji } from '@/lib/utils/formatters';

interface PctBadgeProps {
  value: number | string | null | undefined;
  size?: 'sm' | 'md';
}

export default function PctBadge({ value, size = 'sm' }: PctBadgeProps) {
  const emoji = getPctEmoji(value);
  
  return (
    <span className={`badge ${getPctBgColor(value)} ${size === 'md' ? 'text-xs px-3 py-1' : ''}`}>
      <span>{emoji}</span>
      <span>{fmtPct(value)}</span>
    </span>
  );
}
