import { useTheme } from '../contexts/ThemeContext';

interface PlaceholderPageProps {
  title: string;
  description: string;
}

export default function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <section className={`rounded-lg border p-6 ${isDark ? 'border-navy-700 bg-navy-800' : 'border-slate-200 bg-white'}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-brand">SRMS</p>
      <h1 className={`mt-2 text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{title}</h1>
      <p className={`mt-2 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{description}</p>
    </section>
  );
}
