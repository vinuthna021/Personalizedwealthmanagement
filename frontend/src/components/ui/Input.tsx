import React from 'react';
import { twMerge } from 'tailwind-merge';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', label, error, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs font-semibold uppercase tracking-wider text-wealth-textSecondary mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          type={type}
          className={twMerge(
            "w-full bg-slate-900 border border-wealth-border rounded-lg px-3.5 py-2.5 text-sm text-wealth-textPrimary placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-wealth-accent focus:border-transparent transition-all duration-200",
            error && "border-wealth-rose focus:ring-wealth-rose",
            className
          )}
          {...props}
        />
        {error && <span className="block mt-1 text-xs font-medium text-wealth-rose">{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
