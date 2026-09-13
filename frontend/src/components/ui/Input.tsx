import { type InputHTMLAttributes, type ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export default function Input({ label, error, leftIcon, rightIcon, className = '', id, ...props }: InputProps) {
  const inputId = id || props.name;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{leftIcon}</div>}
        <input
          id={inputId}
          className={`w-full rounded-md border bg-white dark:bg-navy-900 px-3 py-2 text-sm outline-none transition placeholder:text-slate-400 dark:placeholder:text-slate-500 ${
            error
              ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/30'
              : 'border-slate-300 dark:border-navy-700 focus:border-brand focus:ring-brand/30'
          } ${leftIcon ? 'pl-9' : ''} ${rightIcon ? 'pr-9' : ''} ${className}`}
          {...props}
        />
        {rightIcon && <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{rightIcon}</div>}
      </div>
      {error && <p className="mt-1 text-xs text-rose-500">{error}</p>}
    </div>
  );
}
