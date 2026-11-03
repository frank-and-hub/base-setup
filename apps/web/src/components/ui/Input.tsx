'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', label, error, helperText, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || props.name || generatedId;

    return (
      <div className="w-full space-y-1">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
            {label}
          </label>
        )}
        <input
          id={inputId}
          type={type}
          ref={ref}
          className={cn(
            'w-full px-3 py-2 text-sm bg-white border rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-0',
            error
              ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200 text-rose-900 placeholder-rose-300'
              : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-100 text-slate-900 placeholder-slate-400',
            className,
          )}
          {...props}
        />
        {error && <p className="text-xs text-rose-600 mt-1">{error}</p>}
        {helperText && !error && <p className="text-xs text-slate-500 mt-1">{helperText}</p>}
      </div>
    );
  },
);

Input.displayName = 'Input';

