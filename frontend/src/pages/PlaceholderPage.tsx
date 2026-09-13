import { useEffect, useState } from 'react';

interface PlaceholderPageProps {
  title: string;
  description: string;
}

export default function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  const [isDarkTheme, setIsDarkTheme] = useState(() => localStorage.getItem('srms-theme') !== 'light');

  useEffect(() => {
    const syncTheme = () => setIsDarkTheme(localStorage.getItem('srms-theme') !== 'light');
    window.addEventListener('srms-theme-change', syncTheme);
    return () => window.removeEventListener('srms-theme-change', syncTheme);
  }, []);

  return (
    <section className={`rounded-lg border p-6 ${isDarkTheme ? 'border-navy-700 bg-navy-800' : 'border-slate-200 bg-white'}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-brand">SRMS</p>
      <h1 className={`mt-2 text-lg font-bold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>{title}</h1>
      <p className={`mt-2 text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>{description}</p>
    </section>
  );
}
