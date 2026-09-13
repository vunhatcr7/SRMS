interface SkillTagProps {
  skill: string;
  variant?: 'default' | 'matched' | 'missing' | 'neutral';
}

export default function SkillTag({ skill, variant = 'default' }: SkillTagProps) {
  const variantClass = {
    default: 'bg-brand-muted text-brand-light border-brand/20',
    matched: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    missing: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    neutral: 'bg-navy-700 text-slate-300 border-navy-600',
  }[variant];

  const icon = {
    matched: '+ ',
    missing: '- ',
    default: '',
    neutral: '',
  }[variant];

  return (
    <span
      className={`inline-flex items-center rounded border px-2.5 py-0.5 text-xs font-medium ${variantClass}`}
    >
      {icon}{skill}
    </span>
  );
}
