import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Clock } from 'lucide-react';
import { ConfidenceStatus, CandidateStatus } from '../../types';

export const StatusBadge: React.FC<{ 
  status: ConfidenceStatus | CandidateStatus | 'PASSED' | 'FAILED';
  showIcon?: boolean;
  size?: 'sm' | 'md';
}> = ({ status, showIcon = true, size = 'md' }) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  switch (status) {
    case 'CONFIDENT':
    case 'PASSED':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-md font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 ${sizeClasses}`}>
          {showIcon && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
          <span>{status === 'CONFIDENT' ? 'CONFIDENT' : 'PASSED'}</span>
        </span>
      );

    case 'REVIEW':
    case 'REVIEW_REQUIRED':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-md font-bold bg-amber-50 text-amber-800 border border-amber-300 ${sizeClasses}`}>
          {showIcon && <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
          <span>REVIEW REQUIRED</span>
        </span>
      );

    case 'UNREADABLE':
    case 'FAILED':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-md font-bold bg-red-50 text-red-700 border border-red-200 ${sizeClasses}`}>
          {showIcon && <XCircle className="w-3.5 h-3.5 text-red-600" />}
          <span>{status === 'UNREADABLE' ? 'UNREADABLE' : 'FAILED'}</span>
        </span>
      );

    case 'READY':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-md font-bold bg-slate-100 text-slate-700 border border-slate-300 ${sizeClasses}`}>
          {showIcon && <Clock className="w-3.5 h-3.5 text-slate-500" />}
          <span>READY</span>
        </span>
      );

    case 'EVALUATED':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-md font-bold bg-slate-100 text-slate-800 border border-slate-300 ${sizeClasses}`}>
          {showIcon && <CheckCircle2 className="w-3.5 h-3.5 text-slate-600" />}
          <span>EVALUATED</span>
        </span>
      );

    default:
      return null;
  }
};