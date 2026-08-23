import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Briefcase, 
  Kanban, 
  PlusCircle,
  Search, 
  Bell, 
  LogOut,
  ChevronLeft,
  Menu,
  ChevronDown,
  User as UserIcon,
  Sparkles
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

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const menuItems = [
    { text: 'Việc làm công ty', path: '/job/list', icon: Briefcase, roles: ['CANDIDATE', 'RECRUITER', 'ADMIN'] },
    { text: 'AI phân tích CV', path: '/candidate/ai', icon: Sparkles, roles: ['CANDIDATE'] },
    { text: 'Đăng tin tuyển dụng', path: '/job/create', icon: PlusCircle, roles: ['RECRUITER', 'ADMIN'] },
    { text: 'Dashboard duyệt đơn', path: '/dashboard/recruiter', icon: Kanban, roles: ['RECRUITER', 'ADMIN'] },
  ];

  // Khởi tạo một User giả lập chất lượng cao nếu LocalStorage hoàn toàn trống dữ liệu để bạn luôn thấy UI đẹp mắt khi Dev
  const activeUser = {
    fullName: user?.fullName?.trim() || user?.email?.split('@')[0] || 'Người dùng',
    role: user?.role || 'GUEST',
    email: user?.email || 'guest@srms.com',
  };

  return (
    <div className="flex h-screen bg-slate-50/50 overflow-hidden font-sans antialiased text-slate-800">
      
      {/* 1. SIDEBAR CO GIÃN THÔNG MINH */}
      <aside className={`${isCollapsed ? 'w-16' : 'w-60'} bg-white border-r border-slate-100 flex flex-col justify-between z-20 transition-all duration-300 relative flex-shrink-0`}>
        <div className="py-4 px-3 space-y-6">
          
          {/* Brand Logo */}
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'px-3'} mb-2 h-7`}>
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center font-black text-white text-xs shadow-md shadow-indigo-100 flex-shrink-0">
              S
            </div>
            {!isCollapsed && (
              <div className="ml-2.5">
                <h1 className="text-sm font-bold text-slate-900 tracking-tight leading-none">SRMS</h1>
                <span className="text-[10px] font-medium text-slate-400 block mt-1">AI Recruitment</span>
              </div>
            )}
          </div>

          {/* Cụm Menu */}
          <div className="space-y-1">
            {!isCollapsed && (
              <span className="px-3 text-[11px] font-semibold text-slate-400/80 tracking-wider block mb-1.5 uppercase">
                Hệ thống
              </span>
            )}
            
            {menuItems
              .filter(item => item.roles.includes(activeUser.role) || activeUser.role === 'GUEST')
              .map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`w-full flex items-center py-2 rounded-lg transition-all duration-150 group text-left ${
                      isCollapsed ? 'justify-center px-0' : 'px-3'
                    } ${
                      isActive
                        ? 'bg-slate-100 text-slate-900 font-bold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                    title={isCollapsed ? item.text : undefined}
                  >
                    <Icon className={`w-4 h-4 stroke-[1.8] flex-shrink-0 ${isCollapsed ? 'mr-0' : 'mr-3'} ${isActive ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-600'}`} />
                    {!isCollapsed && <span className="flex-1 truncate text-xs">{item.text}</span>}
                  </button>
                );
              })}
          </div>
        </div>
      </aside>

      {/* 2. KHU VỰC BÊN PHẢI (HEADER MỚI + CONTENT WORKSPACE) */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Header tích hợp Nút đóng mở, Ô tìm kiếm và Khối Dropdown User */}
        <header className="h-14 bg-white border-b border-slate-100 flex items-center justify-between px-6 z-30">
          
          <div className="flex items-center space-x-4">
            {/* Nút Toggle Sidebar */}
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 border border-slate-200/60 shadow-sm transition-all duration-200"
              title={isCollapsed ? "Mở rộng menu" : "Thu gọn menu"}
            >
              {isCollapsed ? <Menu className="w-4 h-4 stroke-[2]" /> : <ChevronLeft className="w-4 h-4 stroke-[2]" />}
            </button>

            {/* Ô tìm kiếm */}
            <div className="relative w-72 hidden sm:block">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 stroke-[1.8]" />
              <input 
                type="text" 
                placeholder="Search candidates, jobs..." 
                className="w-full bg-slate-50/50 border border-slate-200/80 rounded-lg pl-9 pr-3 py-1.5 text-xs font-medium placeholder-slate-400 focus:outline-none focus:border-indigo-500/50 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Nút Chuông Thông báo */}
            <button className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 relative transition-colors mr-1">
              <Bell className="w-4 h-4 stroke-[1.8]" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-indigo-600 rounded-full"></span>
            </button>

            {/* 🔥 KHỐI DROPDOWN THÔNG TIN USER PROFILE HOÀN CHỈNH */}
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-2.5 pl-4 border-l border-slate-100 focus:outline-none group py-1"
              >
                {/* Avatar Tròn Gradient */}
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-sm border border-indigo-100 flex-shrink-0">
                  {activeUser.fullName.charAt(0).toUpperCase()}
                </div>
                
                {/* Tên & Quyền tài khoản */}
                <div className="text-left hidden md:block">
                  <p className="text-xs font-bold text-slate-800 leading-tight group-hover:text-slate-900 transition-colors">{activeUser.fullName}</p>
                  <span className="inline-block bg-slate-100 text-slate-600 text-[9px] font-bold px-1.5 py-0.2 rounded-md mt-0.5 uppercase tracking-wider scale-95 origin-left">
                    {activeUser.role === 'RECRUITER' ? 'HR Manager' : activeUser.role}
                  </span>
                </div>

                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* 🔥 MENU THẢ XUỐNG KHI BẤM VÀO USER PROFILE */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-xl shadow-xl py-1 z-40 origin-top-right transition-all animate-in fade-in slide-in-from-top-1">
                  <div className="px-4 py-2 border-b border-slate-50">
                    <p className="text-[10px] font-medium text-slate-400">Đăng nhập với</p>
                    <p className="text-xs font-semibold text-slate-700 truncate mt-0.5">{activeUser.email}</p>
                  </div>
                  
                  {/* Option Xem hồ sơ */}
                  <button 
                    onClick={() => { setIsDropdownOpen(false); navigate('/profile'); }}
                    className="w-full flex items-center px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 text-left"
                  >
                    <UserIcon className="w-3.5 h-3.5 mr-2.5 text-slate-400" />
                    Hồ sơ của tôi
                  </button>

                  {/* Option Đăng xuất */}
                  <button 
                    onClick={() => { setIsDropdownOpen(false); handleLogout(); }}
                    className="w-full flex items-center px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50/50 text-left border-t border-slate-50"
                  >
                    <LogOut className="w-3.5 h-3.5 mr-2.5 text-rose-500" />
                    Đăng xuất tài khoản
                  </button>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* 3. WORKSPACE CHỨA NỘI DUNG TRANG CHÍNH */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
          <div className="max-w-5xl mx-auto">
            {children}
          </div>
        </main>
      </div>

    </div>
  );
}