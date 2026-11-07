'use client';

import React from 'react';
import { Badge } from '@/components/ui/Badge';
import { CheckCircle2, XCircle, Clock, Star, ShieldCheck } from 'lucide-react';

interface ProviderConnectionStatusProps {
  isVerified: boolean;
  isActive: boolean;
  isDefault?: boolean;
  lastTestedAt?: string | null;
  lastError?: string | null;
  className?: string;
}

export const ProviderConnectionStatus: React.FC<ProviderConnectionStatusProps> = ({
  isVerified,
  isActive,
  isDefault = false,
  lastTestedAt,
  lastError,
  className = '',
}) => {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {isVerified ? (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800">
          <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
          Verified
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800">
          <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
          Unverified
        </span>
      )}

      {isDefault && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800">
          <Star className="w-3 h-3 fill-current text-indigo-600 dark:text-indigo-400" />
          Default
        </span>
      )}

      {!isActive && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400">
          Inactive
        </span>
      )}

      {lastError && (
        <span className="inline-flex items-center gap-1 text-[11px] text-rose-600 dark:text-rose-400 font-medium truncate max-w-xs" title={lastError}>
          <XCircle className="w-3 h-3 flex-shrink-0" />
          {lastError}
        </span>
      )}
    </div>
  );
};
