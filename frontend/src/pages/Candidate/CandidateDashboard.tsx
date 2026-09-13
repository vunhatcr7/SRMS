import { useEffect, useState } from 'react';
import { ArrowRight, BriefcaseBusiness, CheckCircle2, Clock3, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { getScoreColor, getStageColor, getStageLabel } from '../../utils/formatters';

interface RecentApplication { id: string; stage: string; matchingScore?: number; createdAt: string; job: { title: string; location: string } }
interface DashboardData { summary: { totalApplications: number; pendingApplications: number; hiredCount: number; applicationsByStage: Record<string, number> }; recentApplications: RecentApplication[] }

export default function CandidateDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => localStorage.getItem('srms-theme') === 'light' ? 'light' : 'dark');

  useEffect(() => {
    const syncTheme = () => setTheme(localStorage.getItem('srms-theme') === 'light' ? 'light' : 'dark');
    window.addEventListener('srms-theme-change', syncTheme);
    return () => window.removeEventListener('srms-theme-change', syncTheme);
  }, []);

  const isDark = theme === 'dark';

  useEffect(() => {
    let active = true;
    api.get('/dashboard')
      .then((response) => { if (active) setData(response.data as DashboardData); })
      .catch(() => { if (active) setError('Unable to load dashboard.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  if (loading) return <div className="flex min-h-[320px] items-center justify-center text-sm text-slate-500"><RefreshCw className="mr-3 h-5 w-5 animate-spin text-brand" />Loading dashboard...</div>;
  if (error || !data) return <div className={`rounded-lg border p-6 text-sm ${isDark ? 'border-rose-500/30 bg-rose-500/10 text-rose-400' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>{error || 'No dashboard data.'}</div>;

  const { summary, recentApplications } = data;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-brand">Candidate workspace</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-100">Welcome back</h1>
        <p className="mt-2 text-sm text-slate-400">Keep track of your applications and recruitment progress.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className={`rounded-lg border p-5 ${isDark ? 'border-navy-700 bg-navy-800' : 'border-slate-200 bg-white'}`}>
          <p className={`text-[11px] font-semibold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Applications</p>
          <p className={`mt-2 text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{summary.totalApplications}</p>
        </div>
        <div className={`rounded-lg border p-5 ${isDark ? 'border-navy-700 bg-navy-800' : 'border-slate-200 bg-white'}`}>
          <p className={`flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
            <Clock3 className="h-4 w-4" /> In progress
          </p>
          <p className={`mt-2 text-3xl font-bold text-amber-400`}>{summary.pendingApplications}</p>
        </div>
        <div className={`rounded-lg border p-5 ${isDark ? 'border-navy-700 bg-navy-800' : 'border-slate-200 bg-white'}`}>
          <p className={`flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
            <CheckCircle2 className="h-4 w-4" /> Hired
          </p>
          <p className={`mt-2 text-3xl font-bold text-emerald-400`}>{summary.hiredCount}</p>
        </div>
      </div>

      <section className={`rounded-lg border p-5 ${isDark ? 'border-navy-700 bg-navy-800' : 'border-slate-200 bg-white'}`}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-100">Recent applications</h2>
            <p className="mt-1 text-xs text-slate-400">Your latest application activity.</p>
          </div>
          <button type="button" onClick={() => navigate('/candidate/applications')} className="inline-flex items-center gap-1 text-sm font-semibold text-brand hover:text-brand-light">
            View all <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {recentApplications.length === 0 ? (
          <div className="py-10 text-center">
            <BriefcaseBusiness className="mx-auto h-8 w-8 text-slate-500" />
            <p className="mt-2 text-sm text-slate-400">No applications yet.</p>
            <button type="button" onClick={() => navigate('/candidate/jobs')} className="mt-4 rounded bg-brand px-4 py-2 text-xs font-bold text-white transition hover:bg-brand-dark">
              Browse jobs
            </button>
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            {recentApplications.map((app) => (
              <div key={app.id} className={`flex items-center justify-between rounded-lg border p-3 ${isDark ? 'border-navy-700 bg-navy-850' : 'border-slate-200 bg-slate-50'}`}>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-slate-200 truncate">{app.job.title}</div>
                  <div className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{app.job.location}</div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-xs font-semibold ${getScoreColor(app.matchingScore || 0)}`}>
                    {Math.round(app.matchingScore || 0)}%
                  </span>
                  <span className={`rounded border px-2 py-0.5 text-[11px] font-semibold ${getStageColor(app.stage)}`}>
                    {getStageLabel(app.stage)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
