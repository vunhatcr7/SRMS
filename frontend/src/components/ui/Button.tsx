import { type ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}

const baseStyles = 'inline-flex items-center justify-center gap-2 rounded-md font-medium transition focus:outline-none focus:ring-2 focus:ring-brand/40 disabled:opacity-50 disabled:cursor-not-allowed';

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-dark',
  secondary: 'bg-navy-800 text-slate-200 hover:bg-navy-700 border border-navy-700',
  ghost: 'bg-transparent text-slate-400 hover:text-slate-200 hover:bg-navy-800',
  danger: 'bg-rose-600 text-white hover:bg-rose-500',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'text-xs px-3 py-1.5',
  md: 'text-sm px-4 py-2',
  lg: 'text-base px-5 py-2.5',
};

export default function Button({ variant = 'primary', size = 'md', children, className = '', ...props }: ButtonProps) {
  const classes = [baseStyles, variantStyles[variant], sizeStyles[size], className].filter(Boolean).join(' ');
  return <button className={classes} {...props}>{children}</button>;
}
