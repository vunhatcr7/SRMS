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
    { label: 'Open roles', value: '24', change: '+12.5% this month', tone: 'text-brand-light' },
    { label: 'Active candidates', value: '186', change: '+8.4% this month', tone: 'text-emerald-400' },
    { label: 'Interviews this week', value: '32', change: '+6 scheduled', tone: 'text-sky-400' },
    { label: 'Offers pending', value: '08', change: '+2 need review', tone: 'text-amber-400' },
  ];

  const pipelineStages = [
    { name: 'Applied', count: 86 },
    { name: 'Screening', count: 42 },
    { name: 'Interview', count: 28 },
    { name: 'Offer', count: 12 },
    { name: 'Hired', count: 8 },
    { name: 'Rejected', count: 5 },
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

  const activeUser = {
    fullName: 'Minh',
  };

  return (
    <div className="space-y-6 pb-8">
      {toast && (
        <div
          className={`fixed right-5 top-5 z-50 flex items-center gap-2 rounded border px-4 py-3 text-xs font-semibold shadow-card ${
            toast.isSuccess
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
              : 'border-rose-500/30 bg-rose-500/10 text-rose-400'
          }`}
        >
          {toast.isSuccess ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {toast.message}
        </div>
      )}

      <div className={`rounded-lg border p-6 ${isDarkTheme ? 'border-navy-700 bg-navy-800' : 'border-slate-200 bg-white'}`}>
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div className="space-y-2">
            <p className={`text-[11px] font-semibold uppercase tracking-wider ${isDarkTheme ? 'text-slate-500' : 'text-slate-500'}`}>
              Good morning
            </p>
            <h2 className={`text-2xl font-bold tracking-tight ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
              {activeUser.fullName}
            </h2>
            <p className={`text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
              Here&apos;s what&apos;s happening across your hiring pipeline.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateJob}
            className="inline-flex items-center justify-center gap-2 rounded bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark"
          >
            <Briefcase className="h-4 w-4" />
            Create job
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {overviewCards.map((card) => (
            <div key={card.label} className={`rounded-lg border p-4 ${isDarkTheme ? 'border-navy-700 bg-navy-850' : 'border-slate-200 bg-slate-50'}`}>
              <div className={`text-[11px] font-semibold uppercase tracking-wider ${isDarkTheme ? 'text-slate-500' : 'text-slate-500'}`}>
                {card.label}
              </div>
              <div className={`mt-2 text-3xl font-bold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>{card.value}</div>
              <div className={`mt-2 flex items-center gap-1.5 text-[11px] font-medium ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-current" />
                {card.change}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className={`rounded-lg border p-5 ${isDarkTheme ? 'border-navy-700 bg-navy-800' : 'border-slate-200 bg-white'}`}>
          <div className="flex items-center justify-between">
            <h3 className={`text-sm font-semibold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Hiring pipeline</h3>
            <button className="text-xs font-semibold text-brand hover:text-brand-light">View details</button>
          </div>

          <div className="mt-5 space-y-3">
            {pipelineStages.map((stage) => (
              <div key={stage.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`h-2 w-2 rounded-full ${
                    stage.name === 'Applied' ? 'bg-sky-500' :
                    stage.name === 'Screening' ? 'bg-indigo-500' :
                    stage.name === 'Interview' ? 'bg-amber-500' :
                    stage.name === 'Offer' ? 'bg-pink-500' :
                    stage.name === 'Hired' ? 'bg-emerald-500' : 'bg-rose-500'
                  }`} />
                  <span className={`text-sm ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>{stage.name}</span>
                </div>
                <span className={`text-sm font-semibold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>{stage.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={`rounded-lg border p-5 ${isDarkTheme ? 'border-navy-700 bg-navy-800' : 'border-slate-200 bg-white'}`}>
          <div className="flex items-center justify-between">
            <h3 className={`text-sm font-semibold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Upcoming interviews</h3>
            <button className="text-xs font-semibold text-brand hover:text-brand-light">View calendar</button>
          </div>

          <div className="mt-5 space-y-2">
            {upcomingInterviews.map((person) => (
              <div key={person.name} className={`flex items-center gap-3 rounded-lg border p-3 ${isDarkTheme ? 'border-navy-700 bg-navy-850' : 'border-slate-200 bg-slate-50'}`}>
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded text-xs font-bold ${isDarkTheme ? 'bg-navy-700 text-slate-300' : 'bg-slate-200 text-slate-700'}`}>
                  {person.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className={`truncate text-sm font-semibold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>{person.name}</div>
                  <div className={`truncate text-xs ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>{person.role}</div>
                </div>
                <div className={`text-right text-[11px] ${isDarkTheme ? 'text-slate-300' : 'text-slate-600'}`}>
                  <div className="font-medium">{person.time}</div>
                  <div className={isDarkTheme ? 'text-slate-500' : 'text-slate-400'}>{person.mode}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={`rounded-lg border p-5 ${isDarkTheme ? 'border-navy-700 bg-navy-800' : 'border-slate-200 bg-white'}`}>
        <div className="flex items-center justify-between">
          <h3 className={`text-sm font-semibold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Recent activity</h3>
          <button className="text-xs font-semibold text-brand hover:text-brand-light">View all candidates</button>
        </div>

        <div className={`mt-5 overflow-hidden rounded-lg border ${isDarkTheme ? 'border-navy-700' : 'border-slate-200'}`}>
          <table className="min-w-full border-collapse text-left text-sm">
            <thead className={isDarkTheme ? 'bg-navy-900 text-[11px] uppercase tracking-wider text-slate-500' : 'bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500'}>
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
                  <tr key={`${item.name}-${index}`} className={`border-t ${isDarkTheme ? 'border-navy-700 text-slate-300' : 'border-slate-200 text-slate-700'}`}>
                    <td className={`px-4 py-3 font-semibold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>{item.name}</td>
                    <td className={`px-4 py-3 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>{item.role}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded border px-2 py-1 text-[10px] font-semibold uppercase tracking-wider ${
                        item.stage === 'Applied' ? 'border-sky-500/30 bg-sky-500/10 text-sky-400' :
                        item.stage === 'Screening' ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-400' :
                        item.stage === 'Interview' ? 'border-amber-500/30 bg-amber-500/10 text-amber-400' :
                        item.stage === 'Offer' ? 'border-pink-500/30 bg-pink-500/10 text-pink-400' :
                        'border-slate-500/30 bg-slate-500/10 text-slate-400'
                      }`}>
                        {item.stage}
                      </span>
                    </td>
                    <td className={`px-4 py-3 ${isDarkTheme ? 'text-slate-500' : 'text-slate-500'}`}>{item.time}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-slate-500">
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
          onCreated={() => showToast('Job created successfully!', true)}
        />
      )}
    </div>
  );
}
