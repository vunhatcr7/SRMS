import { useRef, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Briefcase,
  LayoutGrid,
  Users,
  ClipboardList,
  Search,
  Bell,
  LogOut,
  ChevronLeft,
  ChevronDown,
  User as UserIcon,
  Sun,
  Moon,
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import Avatar from '../ui/Avatar';

interface MainLayoutProps {
  children: React.ReactNode;
}

interface UserData {
  fullName?: string;
  role: string;
  email: string;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [user, setUser] = useState<UserData | null>(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch {
        return null;
      }
    }
    return null;
  });

  useEffect(() => {
    const handleStorageChange = () => {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch {
          setUser(null);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const activeUser = {
    fullName: user?.fullName?.trim() || user?.email?.split('@')[0] || 'User',
    role: user?.role || 'GUEST',
    email: user?.email || 'guest@srms.com',
  };

  const menuItems =
    activeUser.role === 'ADMIN'
      ? [
          { text: 'Dashboard', path: '/admin', icon: LayoutGrid },
          { text: 'Users', path: '/admin/users', icon: Users },
          { text: 'Jobs', path: '/admin/jobs', icon: Briefcase },
          { text: 'Settings', path: '/admin/settings', icon: ClipboardList },
        ]
      : [
          { text: 'Overview', path: '/recruiter', icon: LayoutGrid },
          { text: 'Jobs', path: '/recruiter/jobs', icon: Briefcase },
          { text: 'Candidates', path: '/recruiter/candidates', icon: Users },
          { text: 'Pipeline', path: '/recruiter/pipeline', icon: ClipboardList },
          { text: 'Interviews', path: '/recruiter/interviews', icon: ClipboardList },
        ];

  const activeMenu = location.pathname.startsWith('/admin/users')
    ? 'Users'
    : location.pathname.startsWith('/admin/jobs')
      ? 'Jobs'
      : location.pathname.startsWith('/admin/settings')
        ? 'Settings'
        : location.pathname.startsWith('/admin')
          ? 'Dashboard'
          : location.pathname.startsWith('/recruiter/jobs')
            ? 'Jobs'
            : location.pathname.startsWith('/recruiter/candidates')
              ? 'Candidates'
              : location.pathname.startsWith('/recruiter/pipeline')
                ? 'Pipeline'
                : location.pathname.startsWith('/recruiter/interviews')
                  ? 'Interviews'
                  : 'Overview';

  return (
    <div className={`flex h-screen overflow-hidden antialiased ${isDark ? 'bg-navy-900 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <aside
        className={`${isCollapsed ? 'w-16' : 'w-56'} flex flex-col justify-between border-r transition-all duration-200 ${
          isDark ? 'border-navy-700 bg-navy-900' : 'border-slate-200 bg-white'
        }`}
      >
        <div className="px-3 py-3">
          <div className={`mb-5 flex items-center ${isCollapsed ? 'justify-center' : 'px-2'} h-9`}>
            <div className="flex h-7 w-7 items-center justify-center rounded bg-brand text-[11px] font-bold text-white">
              S
            </div>
            {!isCollapsed && (
              <div className="ml-2.5 leading-none">
                <div className={`text-[13px] font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  SRMS
                </div>
              </div>
            )}
          </div>

          <nav className="space-y-0.5">
            {menuItems.map((item) => {
              const isActive = activeMenu === item.text;
              const Icon = item.icon;

              return (
                <button
                  key={item.path + item.text}
                  onClick={() => navigate(item.path)}
                  className={`flex w-full items-center rounded-md px-3 py-2 text-left transition ${
                    isCollapsed ? 'justify-center px-0' : ''
                  } ${
                    isActive
                      ? 'bg-brand text-white'
                      : isDark
                        ? 'text-slate-400 hover:bg-navy-800 hover:text-slate-200'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                  title={isCollapsed ? item.text : undefined}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${isCollapsed ? '' : 'mr-3'}`} />
                  {!isCollapsed && <span className="truncate text-[13px] font-medium">{item.text}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="px-3 py-3">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`flex w-full items-center justify-center rounded-md border px-3 py-2 text-xs transition ${
              isDark ? 'border-navy-700 bg-navy-800 text-slate-400 hover:text-slate-200' : 'border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900'
            }`}
            title={isCollapsed ? 'Expand menu' : 'Collapse menu'}
          >
            <ChevronLeft className={`h-3.5 w-3.5 transition ${isCollapsed ? 'rotate-180' : ''}`} />
            {!isCollapsed && <span className="ml-2">Collapse</span>}
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header
          className={`flex h-14 items-center justify-between border-b px-5 ${
            isDark ? 'border-navy-700 bg-navy-900' : 'border-slate-200 bg-white'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="relative w-64 hidden sm:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                className={`w-full rounded-md border py-2 pl-9 pr-3 text-sm outline-none transition ${
                  isDark
                    ? 'border-navy-700 bg-navy-800 text-slate-200 placeholder:text-slate-500 focus:border-brand'
                    : 'border-slate-200 bg-slate-50 text-slate-700 placeholder:text-slate-400 focus:border-brand'
                }`}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggle}
              className={`flex h-8 w-8 items-center justify-center rounded-md border transition ${
                isDark ? 'border-navy-700 bg-navy-800 text-slate-400 hover:text-slate-200' : 'border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900'
              }`}
              aria-label="Toggle theme"
              title={isDark ? 'Light mode' : 'Dark mode'}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <button
              className={`relative rounded-md border p-2 transition ${
                isDark ? 'border-navy-700 bg-navy-800 text-slate-400 hover:text-slate-200' : 'border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900'
              }`}
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-brand" />
            </button>

            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`flex items-center gap-2.5 rounded-md border px-2 py-1.5 text-left transition ${
                  isDark ? 'border-navy-700 bg-navy-800 hover:bg-navy-750' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <Avatar initials={activeUser.fullName.charAt(0).toUpperCase()} size="sm" />
                <div className="hidden text-left md:block">
                  <div className={`text-xs font-semibold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                    {activeUser.fullName}
                  </div>
                  <div className={`text-[10px] uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                    {activeUser.role}
                  </div>
                </div>
                <ChevronDown className={`h-3 w-3 transition ${isDropdownOpen ? 'rotate-180' : ''} ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
              </button>

              {isDropdownOpen && (
                <div
                  className={`absolute right-0 z-40 mt-2 w-48 rounded-md border p-1 shadow-lg ${
                    isDark ? 'border-navy-700 bg-navy-800' : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className={`border-b px-3 py-2 ${isDark ? 'border-navy-700' : 'border-slate-200'}`}>
                    <div className={`text-[10px] uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      Signed in as
                    </div>
                    <div className={`mt-1 truncate text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      {activeUser.email}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      navigate('/recruiter');
                    }}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition ${
                      isDark ? 'text-slate-300 hover:bg-navy-750 hover:text-slate-100' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <UserIcon className="h-3.5 w-3.5 text-slate-400" />
                    Profile
                  </button>

                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      handleLogout();
                    }}
                    className={`flex w-full items-center gap-2 border-t px-3 py-2 text-left text-xs font-semibold transition ${
                      isDark ? 'border-navy-700 text-rose-400 hover:bg-rose-500/10' : 'border-slate-200 text-rose-600 hover:bg-rose-50'
                    }`}
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className={`flex-1 overflow-y-auto ${isDark ? 'bg-navy-900' : 'bg-slate-50'}`}>
          <div className="mx-auto max-w-[1200px] p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
