import type { ReactNode } from 'react';
import { Bell, LogOut, Sun, Moon } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';

interface CandidateLayoutProps {
  children: ReactNode;
}

const navigation = [
  { label: 'Jobs', path: '/candidate/jobs' },
  { label: 'Applications', path: '/candidate/applications' },
  { label: 'Interviews', path: '/candidate/interviews' },
  { label: 'Profile', path: '/candidate/profile' },
];

export default function CandidateLayout({ children }: CandidateLayoutProps) {
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';

  const logout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 ${isDark ? 'bg-navy-900 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <header className={`sticky top-0 z-30 border-b ${isDark ? 'border-navy-700 bg-navy-900' : 'border-slate-200 bg-white'}`}>
        <div className="mx-auto flex min-h-14 max-w-7xl items-center justify-between gap-6 px-5">
          <button type="button" onClick={() => navigate('/candidate')} className="flex items-center gap-2 text-sm font-bold">
            <span className="grid h-7 w-7 place-items-center rounded bg-brand text-xs text-white">S</span>
            <span className={isDark ? 'text-white' : 'text-slate-900'}>SRMS</span>
          </button>

          <nav className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto">
            {navigation.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/candidate'}
                className={({ isActive }) => `whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'bg-brand text-white'
                    : isDark
                      ? 'text-slate-400 hover:bg-navy-800 hover:text-slate-200'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-1.5">
            <button type="button" onClick={toggle} className={`grid h-8 w-8 place-items-center rounded-md border transition ${
              isDark ? 'border-navy-700 bg-navy-800 text-slate-400 hover:text-slate-200' : 'border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900'
            }`} aria-label="Toggle theme">
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button type="button" className={`grid h-8 w-8 place-items-center rounded-md border transition ${
              isDark ? 'border-navy-700 bg-navy-800 text-slate-400 hover:text-slate-200' : 'border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900'
            }`} aria-label="Notifications">
              <Bell className="h-4 w-4" />
            </button>
            <button type="button" onClick={logout} className={`grid h-8 w-8 place-items-center rounded-md border transition ${
              isDark ? 'border-navy-700 bg-navy-800 text-slate-400 hover:text-slate-200' : 'border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900'
            }`} aria-label="Log out">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-6">{children}</main>
    </div>
  );
}
