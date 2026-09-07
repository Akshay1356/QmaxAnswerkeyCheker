import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useAssessment } from '../../context/AssessmentContext';

export const NotificationToast: React.FC = () => {
  const { notification, dismissNotification } = useAssessment();

  if (!notification) return null;

  const { message, type } = notification;

  const typeConfig = {
    success: {
      bg: 'bg-white border-emerald-300 text-emerald-900 shadow-lg',
      icon: CheckCircle2,
      iconColor: 'text-emerald-600'
    },
    error: {
      bg: 'bg-white border-red-300 text-red-900 shadow-lg',
      icon: AlertCircle,
      iconColor: 'text-red-600'
    },
    warning: {
      bg: 'bg-white border-amber-300 text-amber-900 shadow-lg',
      icon: AlertTriangle,
      iconColor: 'text-amber-600'
    },
    info: {
      bg: 'bg-white border-slate-300 text-slate-900 shadow-lg',
      icon: Info,
      iconColor: 'text-slate-700'
    }
  }[type];

  const Icon = typeConfig.icon;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200 max-w-md">
      <div className={`flex items-start gap-3 p-4 rounded-xl border ${typeConfig.bg}`}>
        <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${typeConfig.iconColor}`} />
        <p className="text-xs font-semibold leading-relaxed">{message}</p>
        <button
          onClick={dismissNotification}
          className="text-slate-400 hover:text-slate-700 transition p-0.5 shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};