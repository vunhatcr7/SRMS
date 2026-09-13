import { useTheme } from '../../contexts/ThemeContext';
import { RefreshCw } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-8 w-8',
};

export default function LoadingSpinner({ message = 'Loading...', size = 'md' }: LoadingSpinnerProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className={`flex items-center justify-center gap-3 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
      <RefreshCw className={`${sizeClasses[size]} animate-spin text-brand`} />
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
}
