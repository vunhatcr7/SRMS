interface SkillTagProps {
  skill: string;
  variant?: 'default' | 'matched' | 'missing' | 'neutral';
}

/** Badge kỹ năng tái sử dụng với màu theo trạng thái */
export default function SkillTag({ skill, variant = 'default' }: SkillTagProps) {
  const variantClass = {
    default: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    matched: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    missing: 'bg-rose-50 text-rose-600 border-rose-200',
    neutral: 'bg-slate-100 text-slate-600 border-slate-200',
  }[variant];

  const icon = {
    matched: '✓ ',
    missing: '✗ ',
    default: '',
    neutral: '',
  }[variant];

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${variantClass}`}
    >
      {icon}{skill}
    </span>
  );
}
