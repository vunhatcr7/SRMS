import { useTheme } from '../../contexts/ThemeContext';

interface SkeletonProps {
  className?: string;
}

export default function Skeleton({ className = '' }: SkeletonProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div
      className={`animate-pulse rounded-md ${isDark ? 'bg-navy-700' : 'bg-slate-200'} ${className}`}
    />
  );
}
