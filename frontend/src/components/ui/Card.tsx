import { type ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingStyles = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
};

export default function Card({ children, className = '', padding = 'md' }: CardProps) {
  return (
    <div className={`rounded-lg border bg-white dark:bg-navy-800 border-slate-200 dark:border-navy-700 ${paddingStyles[padding]} ${className}`}>
      {children}
    </div>
  );
}
