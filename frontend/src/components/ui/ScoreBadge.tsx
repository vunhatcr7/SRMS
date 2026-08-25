import { getScoreBgColor } from '../../utils/formatters';

interface ScoreBadgeProps {
  score: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

/** Badge hiển thị điểm AI với màu theo ngưỡng (đỏ/vàng/xanh) */
export default function ScoreBadge({ score, label, size = 'md' }: ScoreBadgeProps) {
  const colorClass = getScoreBgColor(score);

  const sizeClass = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5 font-black',
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-bold ${colorClass} ${sizeClass}`}
      title={label}
    >
      {score}%
      {label && <span className="font-normal opacity-70 text-[10px] hidden sm:inline">{label}</span>}
    </span>
  );
}
