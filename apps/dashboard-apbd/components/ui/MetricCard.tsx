import React from 'react';

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: React.ReactNode;
  accent?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'blue';
  trend?: {
    value: number;
    label: string;
  };
  badge?: React.ReactNode;
}

export default function MetricCard({
  title,
  value,
  subtitle,
  icon,
  accent = 'indigo',
  trend,
  badge,
}: MetricCardProps) {
  return (
    <div className={`metric-card accent-${accent}`}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">{title}</p>
          <div className="flex items-baseline gap-2">
            <h2 className="text-2xl font-bold text-text-primary tracking-tight">{value}</h2>
            {badge && <div>{badge}</div>}
          </div>
          {subtitle && <p className="text-xs text-text-muted">{subtitle}</p>}
        </div>
        {icon && (
          <div className="p-2.5 rounded-xl bg-white/80 shadow-sm border border-border/50 backdrop-blur-sm">
            {icon}
          </div>
        )}
      </div>

      {trend && (
        <div className="mt-3 pt-3 border-t border-border/40 flex items-center gap-1.5 text-xs">
          <span className={`font-semibold ${trend.value >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {trend.value >= 0 ? `+${trend.value}%` : `${trend.value}%`}
          </span>
          <span className="text-text-muted">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
