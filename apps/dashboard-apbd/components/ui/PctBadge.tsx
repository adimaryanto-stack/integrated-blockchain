import React from 'react';

interface PctBadgeProps {
  value: number;
  size?: 'sm' | 'md';
}

export default function PctBadge({ value, size = 'sm' }: PctBadgeProps) {
  let colorClasses = '';

  if (value >= 80) {
    colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (value >= 50) {
    colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
  } else {
    colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
  }

  const sizeClasses = size === 'md' ? 'text-xs px-2.5 py-1' : 'text-[11px] px-2 py-0.5';

  return (
    <span className={`badge ${sizeClasses} ${colorClasses} font-mono font-medium`}>
      <span className={`w-1.5 h-1.5 rounded-full ${
        value >= 80 ? 'bg-emerald-500' : value >= 50 ? 'bg-amber-500' : 'bg-rose-500'
      }`} />
      {value.toFixed(1)}%
    </span>
  );
}
