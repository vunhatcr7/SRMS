import type { ReactNode } from 'react';
import { Bell, LogOut, Moon, Sun } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

interface CandidateLayoutProps {
  children: ReactNode;
}

const navigation = [
  { label: 'Home', path: '/candidate', end: true },
  { label: 'Jobs', path: '/candidate/jobs' },
  { label: 'Applications', path: '/candidate/applications' },
  { label: 'Interviews', path: '/candidate/interviews' },
  { label: 'Profile', path: '/candidate/profile' },
];

export default function CandidateLayout({ children }: CandidateLayoutProps) {
  const navigate = useNavigate();
  const [theme, setTheme] = useState<'dark' | 'light'>(() => (
    localStorage.getItem('srms-theme') === 'light' ? 'light' : 'dark'
  ));

  useEffect(() => {
    const syncTheme = () => setTheme(localStorage.getItem('srms-theme') === 'light' ? 'light' : 'dark');
    window.addEventListener('srms-theme-change', syncTheme);
    return () => window.removeEventListener('srms-theme-change', syncTheme);
  }, []);

  const isDarkTheme = theme === 'dark';
  const toggleTheme = () => {
    const nextTheme = isDarkTheme ? 'light' : 'dark';
    localStorage.setItem('srms-theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    window.dispatchEvent(new CustomEvent('srms-theme-change', { detail: nextTheme }));
    setTheme(nextTheme);
  };

  const logout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 ${isDarkTheme ? 'bg-[#0b1324] text-slate-100' : 'bg-slate-100 text-slate-800'}`}>
      <header className={`sticky top-0 z-30 border-b ${isDarkTheme ? 'border-white/10 bg-[#0d1b2d]' : 'border-slate-200 bg-white'}`}>
        <div className="mx-auto flex min-h-16 max-w-7xl items-center gap-6 px-5">
          <button type="button" onClick={() => navigate('/candidate')} className="flex items-center gap-2 text-sm font-bold">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-blue-600 text-xs text-white">S</span>
            <span className={isDarkTheme ? 'text-white' : 'text-slate-900'}>SRMS</span>
          </button>

          <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
            {navigation.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) => `whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition ${isActive ? 'bg-blue-600 text-white' : isDarkTheme ? 'text-slate-300 hover:bg-white/5 hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button type="button" onClick={toggleTheme} className={`grid h-9 w-9 place-items-center rounded-lg border ${isDarkTheme ? 'border-white/10 bg-white/5 text-slate-300' : 'border-slate-200 bg-slate-100 text-slate-700'}`} aria-label="Toggle theme">
              {isDarkTheme ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button type="button" className={`grid h-9 w-9 place-items-center rounded-lg border ${isDarkTheme ? 'border-white/10 bg-white/5 text-slate-300' : 'border-slate-200 bg-slate-100 text-slate-700'}`} aria-label="Notifications">
              <Bell className="h-4 w-4" />
            </button>
            <button type="button" onClick={logout} className={`grid h-9 w-9 place-items-center rounded-lg border ${isDarkTheme ? 'border-white/10 bg-white/5 text-slate-300' : 'border-slate-200 bg-slate-100 text-slate-700'}`} aria-label="Log out">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-6">{children}</main>
    </div>
  );
}
