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
    <section className={`rounded-2xl border p-8 shadow-sm ${isDarkTheme ? 'border-white/10 bg-[#111d34]' : 'border-slate-200 bg-white'}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">SRMS</p>
      <h1 className={`mt-2 text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>{title}</h1>
      <p className={`mt-2 text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>{description}</p>
    </section>
  );
}
