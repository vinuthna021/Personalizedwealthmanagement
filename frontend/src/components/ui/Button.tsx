import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  isLoading,
  disabled,
  ...props
}) => {
  const baseStyle = "flex items-center justify-center px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-wealth-bg disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-wealth-accent hover:bg-wealth-accentHover text-wealth-textPrimary focus:ring-wealth-accent",
    secondary: "bg-wealth-border hover:bg-slate-700 text-wealth-textPrimary focus:ring-wealth-border",
    danger: "bg-wealth-rose hover:bg-rose-600 text-white focus:ring-wealth-rose",
    success: "bg-wealth-emerald hover:bg-emerald-600 text-wealth-textPrimary focus:ring-wealth-emerald"
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={twMerge(baseStyle, variants[variant], className)}
      {...props}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4.5 w-4.5 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading...
        </>
      ) : (
        children
      )}
    </button>
  );
};
