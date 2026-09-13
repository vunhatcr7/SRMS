import { getStageLabel, getStageColor } from '../../utils/formatters';

interface StatusBadgeProps {
  stage: string;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ stage, size = 'sm' }: StatusBadgeProps) {
  const label = getStageLabel(stage);
  const colorClass = getStageColor(stage);

  const sizeClass = size === 'sm'
    ? 'text-[11px] px-2 py-0.5'
    : 'text-xs px-2.5 py-1';

  return (
    <span className={`inline-flex items-center rounded border font-medium ${colorClass} ${sizeClass}`}>
      {label}
    </span>
  );
}
