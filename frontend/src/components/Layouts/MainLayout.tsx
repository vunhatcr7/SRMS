import React, { useState, useEffect, useRef } from 'react';
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
  Menu,
  ChevronDown,
  User as UserIcon,
  Sun,
  Moon
} from 'lucide-react';

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

  // State quản lý đóng/mở Sidebar
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // 🔥 State quản lý đóng/mở Dropdown User Profile trên Header
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const savedTheme = localStorage.getItem('srms-theme');
    return savedTheme === 'light' ? 'light' : 'dark';
  });
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  // State quản lý thông tin User đọc trực tiếp từ LocalStorage
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

  // 🔥 Lắng nghe thay đổi của localStorage để đồng bộ dữ liệu liên tục nếu có thay đổi
  useEffect(() => {
    const handleStorageChange = () => {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        try { setUser(JSON.parse(savedUser)); } catch { setUser(null); }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // 🔥 Tự động đóng Dropdown Profile khi click ra ngoài vùng menu (Click Outside)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    localStorage.setItem('srms-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    window.dispatchEvent(new CustomEvent('srms-theme-change', { detail: theme }));
  }, [theme]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const activeUser = {
    fullName: user?.fullName?.trim() || user?.email?.split('@')[0] || 'Người dùng',
    role: user?.role || 'GUEST',
    email: user?.email || 'guest@srms.com',
  };

  const menuItems = activeUser.role === 'ADMIN'
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

  const isDarkTheme = theme === 'dark';

  return (
    <div className={`flex h-screen overflow-hidden antialiased transition-colors duration-200 ${isDarkTheme ? 'bg-[#0b1324] text-slate-100' : 'bg-slate-100 text-slate-800'}`}>
      <aside className={`${isCollapsed ? 'w-20' : 'w-64'} flex flex-col justify-between border-r transition-all duration-300 ${isDarkTheme ? 'border-white/10 bg-[#0f172a]' : 'border-slate-200 bg-white'}`}>
        <div className="px-3 py-3">
          <div className={`mb-5 flex items-center ${isCollapsed ? 'justify-center' : 'px-2'} h-10`}>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#3c6dfc] text-[11px] font-black text-white shadow-sm shadow-blue-500/20">
              S
            </div>
            {!isCollapsed && (
              <div className="ml-2.5 leading-none">
                <div className={`text-[13px] font-bold tracking-tight ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>SRMS</div>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            {menuItems
              .map((item) => {
                const isActive = activeMenu === item.text;
                const Icon = item.icon;

                return (
                  <button
                    key={item.path + item.text}
                    onClick={() => {
                      navigate(item.path);
                    }}
                    className={`flex w-full items-center rounded-xl px-3 py-2 text-left transition ${
                      isCollapsed ? 'justify-center px-0' : ''
                    } ${
                      isActive
                        ? 'bg-[#2d64ff] text-white shadow-md shadow-blue-500/20'
                        : isDarkTheme
                          ? 'text-slate-300 hover:bg-white/5 hover:text-white'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                    title={isCollapsed ? item.text : undefined}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${isCollapsed ? '' : 'mr-3'} ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    {!isCollapsed && <span className="truncate text-[13px] font-medium">{item.text}</span>}
                  </button>
                );
              })}
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className={`flex h-16 items-center justify-between border-b px-5 ${isDarkTheme ? 'border-white/10 bg-[#0d1b2d]' : 'border-slate-200 bg-white'}`}>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={`flex h-8 w-8 items-center justify-center rounded-lg border ${isDarkTheme ? 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10' : 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              title={isCollapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
            >
              {isCollapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>

            <div className="relative w-[320px] hidden sm:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search anything"
                className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-sm text-slate-100 placeholder:text-slate-400 focus:border-blue-500/60 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
              className={`flex h-9 w-9 items-center justify-center rounded-lg border ${isDarkTheme ? 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10' : 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              aria-label="Toggle theme"
              title={isDarkTheme ? 'Chuyển sang light mode' : 'Chuyển sang dark mode'}
            >
              {isDarkTheme ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <button className={`relative rounded-lg border p-2 ${isDarkTheme ? 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10' : 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
              <Bell className="h-4 w-4" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#3a7afe]" />
            </button>

            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`flex items-center gap-3 rounded-xl border px-2 py-1.5 text-left ${isDarkTheme ? 'border-white/10 bg-white/5 hover:bg-white/10' : 'border-slate-200 bg-slate-100 hover:bg-slate-200'}`}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#7c4dff] to-[#3f7ef9] text-xs font-bold text-white">
                  {activeUser.fullName.charAt(0).toUpperCase()}
                </div>
                <div className="hidden text-left md:block">
                  <div className={`text-xs font-semibold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>{activeUser.fullName}</div>
                  <div className={`text-[9px] uppercase tracking-[0.12em] ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
                    {activeUser.role === 'RECRUITER' ? 'HR Manager' : activeUser.role}
                  </div>
                </div>
                <ChevronDown className={`h-3.5 w-3.5 transition ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'} ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isDropdownOpen && (
                <div className={`absolute right-0 z-40 mt-2 w-48 rounded-xl border p-1 shadow-2xl ${isDarkTheme ? 'border-white/10 bg-[#121b2d]' : 'border-slate-200 bg-white'}`}>
                  <div className={`border-b px-3 py-2 ${isDarkTheme ? 'border-white/10' : 'border-slate-200'}`}>
                    <div className={`text-[10px] uppercase tracking-[0.12em] ${isDarkTheme ? 'text-slate-500' : 'text-slate-400'}`}>Signed in as</div>
                    <div className={`mt-1 truncate text-xs font-medium ${isDarkTheme ? 'text-slate-200' : 'text-slate-700'}`}>{activeUser.email}</div>
                  </div>

                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      navigate(activeUser.role === 'CANDIDATE' ? '/candidate/profile' : activeUser.role === 'ADMIN' ? '/admin' : '/recruiter');
                    }}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs ${isDarkTheme ? 'text-slate-200 hover:bg-white/5' : 'text-slate-700 hover:bg-slate-100'}`}
                  >
                    <UserIcon className="h-3.5 w-3.5 text-slate-400" />
                    Hồ sơ của tôi
                  </button>

                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      handleLogout();
                    }}
                    className="flex w-full items-center gap-2 border-t border-white/10 px-3 py-2 text-left text-xs font-semibold text-rose-300 hover:bg-rose-500/10"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Đăng xuất tài khoản
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className={`flex-1 overflow-y-auto p-6 ${isDarkTheme ? 'bg-[#0b162d]' : 'bg-slate-100'}`}>
          <div className="mx-auto max-w-[1180px]">{children}</div>
        </main>
      </div>
    </div>
  );
}