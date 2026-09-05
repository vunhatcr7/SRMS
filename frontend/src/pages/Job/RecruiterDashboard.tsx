import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Briefcase, CheckCircle2, AlertCircle } from 'lucide-react';
import CreateJobModal from '../../components/CreateJobModal';

export default function RecruiterDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [toast, setToast] = useState<{ message: string; isSuccess: boolean } | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const savedTheme = localStorage.getItem('srms-theme');
    return savedTheme === 'light' ? 'light' : 'dark';
  });

  const showToast = (message: string, isSuccess: boolean) => {
    setToast({ message, isSuccess });
    window.setTimeout(() => setToast(null), 3500);
  };

  const openCreateJob = () => {
    if (searchParams.get('createJob') !== '1') {
      const next = new URLSearchParams(searchParams);
      next.set('createJob', '1');
      setSearchParams(next, { replace: true });
    }
  };

  const closeCreateJob = () => {
    if (searchParams.has('createJob')) {
      const next = new URLSearchParams(searchParams);
      next.delete('createJob');
      setSearchParams(next, { replace: true });
    }
  };

  useEffect(() => {
    const syncTheme = () => {
      const savedTheme = localStorage.getItem('srms-theme');
      setTheme(savedTheme === 'light' ? 'light' : 'dark');
    };

    syncTheme();
    window.addEventListener('srms-theme-change', syncTheme as EventListener);
    return () => window.removeEventListener('srms-theme-change', syncTheme as EventListener);
  }, []);

  const overviewCards = [
    { label: 'Open roles', value: '24', change: '+12.5% this month', tone: 'text-blue-300' },
    { label: 'Active candidates', value: '186', change: '+8.4% this month', tone: 'text-emerald-300' },
    { label: 'Interviews this week', value: '32', change: '+6 scheduled', tone: 'text-violet-300' },
    { label: 'Offers pending', value: '08', change: '+2 need review', tone: 'text-amber-300' },
  ];

  const pipelineStages = [
    { name: 'Applied', count: 86, color: 'bg-sky-500' },
    { name: 'Screening', count: 42, color: 'bg-indigo-500' },
    { name: 'Interview', count: 28, color: 'bg-purple-500' },
    { name: 'Offer', count: 12, color: 'bg-yellow-500' },
  ];

  const upcomingInterviews = [
    { name: 'Nguyễn Minh Anh', role: 'Senior Frontend Engineer', time: 'Today · 09:30', mode: 'Video call' },
    { name: 'Lê Hoàng Nam', role: 'Backend Engineer', time: 'Today · 14:00', mode: 'On-site' },
    { name: 'Phạm Khánh Linh', role: 'Product Designer', time: 'Wed · 10:15', mode: 'Video call' },
  ];

  const recentActivity = [
    { name: 'Trần Gia Huy', role: 'Product Designer', stage: 'Screening', time: '12 min ago' },
    { name: 'Đỗ Thùy Dương', role: 'Data Analyst', stage: 'Interview', time: '38 min ago' },
    { name: 'Bùi Quang Minh', role: 'Product Manager', stage: 'Offer', time: '1 hr ago' },
    { name: 'Nguyễn Hà My', role: 'Marketing Lead', stage: 'Applied', time: '2 hrs ago' },
  ];

  const isDarkTheme = theme === 'dark';

  return (
    <div className={`space-y-6 pb-8 ${isDarkTheme ? 'text-slate-100' : 'text-slate-800'}`}>
      {toast && (
        <div
          className={`fixed right-5 top-5 z-50 flex items-center gap-2 rounded-xl border px-4 py-3 text-xs font-semibold shadow-lg ${
            toast.isSuccess
              ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200'
              : 'border-rose-500/20 bg-rose-500/10 text-rose-200'
          }`}
        >
          {toast.isSuccess ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {toast.message}
        </div>
      )}

      <div className={`rounded-[20px] border p-6 shadow-2xl ${isDarkTheme ? 'border-white/10 bg-gradient-to-br from-[#111d34] via-[#121f38] to-[#0d1830] shadow-slate-950/30' : 'border-slate-200 bg-white shadow-slate-200'}`}>
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div className="space-y-2">
            <p className={`text-[10px] font-bold uppercase tracking-[0.24em] ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>Monday, August 31, 2026</p>
            <h2 className={`text-4xl font-semibold tracking-tight ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Good morning, Minh</h2>
            <p className={`text-sm ${isDarkTheme ? 'text-slate-300' : 'text-slate-600'}`}>Here&apos;s what&apos;s happening across your hiring pipeline.</p>
          </div>

          <button
            type="button"
            onClick={openCreateJob}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#3a7afe] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:bg-[#2d64ff]"
          >
            <Briefcase className="h-4 w-4" />
            Create a job
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {overviewCards.map((card) => (
            <div key={card.label} className={`rounded-2xl border p-4 backdrop-blur-sm ${isDarkTheme ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50'}`}>
              <div className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>{card.label}</div>
              <div className={`mt-3 text-4xl font-bold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>{card.value}</div>
              <div className={`mt-2 flex items-center gap-1 text-[11px] font-medium ${card.tone}`}>
                <span className="inline-block h-2 w-2 rounded-full bg-current" />
                {card.change}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className={`rounded-[20px] border p-5 shadow-xl ${isDarkTheme ? 'border-white/10 bg-[#111d34] shadow-slate-950/20' : 'border-slate-200 bg-white shadow-slate-200'}`}>
          <div className="flex items-center justify-between">
            <h3 className={`text-[15px] font-semibold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Hiring pipeline</h3>
            <button className="text-xs font-semibold text-[#6aa7ff] hover:text-[#8fb8ff]">View details</button>
          </div>

          <div className="mt-5 space-y-4">
            {pipelineStages.map((stage) => (
              <div key={stage.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`h-2.5 w-2.5 rounded-full ${stage.color}`} />
                  <span className={`text-sm ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>{stage.name}</span>
                </div>
                <span className={`text-sm font-semibold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>{stage.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={`rounded-[20px] border p-5 shadow-xl ${isDarkTheme ? 'border-white/10 bg-[#111d34] shadow-slate-950/20' : 'border-slate-200 bg-white shadow-slate-200'}`}>
          <div className="flex items-center justify-between">
            <h3 className={`text-[15px] font-semibold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Upcoming interviews</h3>
            <button className="text-xs font-semibold text-[#6aa7ff] hover:text-[#8fb8ff]">View calendar</button>
          </div>

          <div className="mt-5 space-y-3">
            {upcomingInterviews.map((person) => (
              <div key={person.name} className={`flex items-center gap-3 rounded-2xl border p-3 ${isDarkTheme ? 'border-white/5 bg-white/5' : 'border-slate-200 bg-slate-50'}`}>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#5d88ff] to-[#7a56ff] text-xs font-bold text-white">
                  {person.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className={`truncate text-sm font-semibold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>{person.name}</div>
                  <div className={`truncate text-xs ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>{person.role}</div>
                </div>
                <div className={`text-right text-[11px] ${isDarkTheme ? 'text-slate-300' : 'text-slate-600'}`}>
                  <div className="font-medium">{person.time}</div>
                  <div className={isDarkTheme ? 'text-slate-400' : 'text-slate-500'}>{person.mode}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
            <span className="font-semibold">AI matching pulse</span>
            <span className="ml-2 text-emerald-100">84% of active roles have strong matches</span>
          </div>
        </div>
      </div>

      <div className={`rounded-[20px] border p-5 shadow-xl ${isDarkTheme ? 'border-white/10 bg-[#111d34] shadow-slate-950/20' : 'border-slate-200 bg-white shadow-slate-200'}`}>
        <div className="flex items-center justify-between">
          <h3 className={`text-[15px] font-semibold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Recent activity</h3>
          <button className="text-xs font-semibold text-[#6aa7ff] hover:text-[#8fb8ff]">View all candidates</button>
        </div>

        <div className={`mt-5 overflow-hidden rounded-xl border ${isDarkTheme ? 'border-white/10' : 'border-slate-200'}`}>
          <table className="min-w-full border-collapse text-left text-sm">
            <thead className={isDarkTheme ? 'bg-slate-900/60 text-[10px] uppercase tracking-[0.2em] text-slate-400' : 'bg-slate-100 text-[10px] uppercase tracking-[0.2em] text-slate-500'}>
              <tr>
                <th className="px-4 py-3 font-medium">Candidate</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Stage</th>
                <th className="px-4 py-3 font-medium">Updated</th>
              </tr>
            </thead>
            <tbody>
              {recentActivity.length > 0 ? (
                recentActivity.map((item, index) => (
                  <tr key={`${item.name}-${index}`} className={`border-t ${isDarkTheme ? 'border-white/10 text-slate-200' : 'border-slate-200 text-slate-700'}`}>
                    <td className={`px-4 py-3 font-semibold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>{item.name}</td>
                    <td className={`px-4 py-3 ${isDarkTheme ? 'text-slate-300' : 'text-slate-600'}`}>{item.role}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-sky-200">
                        {item.stage}
                      </span>
                    </td>
                    <td className={`px-4 py-3 ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>{item.time}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-slate-400">
                    No recent activity to display.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {searchParams.get('createJob') === '1' && (
        <CreateJobModal
          open
          onClose={closeCreateJob}
          onCreated={() => showToast('Đăng tin tuyển dụng thành công!', true)}
        />
      )}
    </div>
  );
}