import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.FC<{ className?: string }>;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  highlight?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  highlight = false
}) => {
  return (
    <div className={`p-5 rounded-xl border transition-all ${
      highlight 
        ? 'bg-red-50/70 border-red-200 shadow-xs' 
        : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
    }`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase font-bold tracking-wider text-slate-500">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl md:text-3xl font-extrabold ${highlight ? 'text-red-700' : 'text-slate-900'}`}>
              {value}
            </span>
            {trend && (
              <span className={`text-xs font-bold ${
                trend.isPositive ? 'text-emerald-600' : 'text-red-600'
              }`}>
                {trend.isPositive ? '↑' : '↓'} {trend.value}
              </span>
            )}
          </div>
          {subtitle && <p className="mt-1 text-xs text-slate-500 font-medium">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-xl border ${
          highlight 
            ? 'bg-red-100 border-red-200 text-red-600' 
            : 'bg-slate-100 border-slate-200 text-slate-700'
        }`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};