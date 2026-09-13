import { useEffect, useState } from 'react';
import { ArrowRight, BriefcaseBusiness, CheckCircle2, Clock3, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../api/axios';
import { getStageColor, getStageLabel } from '../../utils/formatters';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';

interface RecentApplication { id: string; stage: string; matchingScore?: number; createdAt: string; job: { title: string; location: string; company?: { name: string } } }
interface DashboardData { summary: { totalApplications: number; pendingApplications: number; hiredCount: number; applicationsByStage: Record<string, number> }; recentApplications: RecentApplication[] }

export default function CandidateDashboard() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const userName = typeof localStorage !== 'undefined' ? (() => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return user.fullName || user.email?.split('@')[0] || 'there';
    } catch { return 'there'; }
  })() : 'there';

  useEffect(() => {
    let active = true;
    api.get('/dashboard')
      .then((response) => { if (active) setData(response.data as DashboardData); })
      .catch(() => { if (active) setError('Unable to load dashboard.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  if (loading) return (
    <div className="flex min-h-[320px] items-center justify-center">
      <RefreshCw className="mr-3 h-5 w-5 animate-spin text-brand" />
      <span className="text-sm text-slate-500">Loading dashboard...</span>
    </div>
  );
  if (error || !data) return (
    <Card className="text-sm text-rose-600 dark:text-rose-400">{error || 'No dashboard data.'}</Card>
  );

  const { summary, recentApplications } = data;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">Candidate workspace</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">Good morning, {userName}</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Keep your profile current and make your next move with clarity.</p>
        <button type="button" onClick={() => navigate('/candidate/profile')} className="mt-4 text-sm font-semibold text-brand hover:text-brand-light">
          Edit profile
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Applications</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{summary.totalApplications}</p>
        </Card>
        <Card>
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <Clock3 className="h-4 w-4" /> In progress
          </p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{summary.pendingApplications}</p>
        </Card>
        <Card>
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <CheckCircle2 className="h-4 w-4" /> Hired
          </p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{summary.hiredCount}</p>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Application activity</h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{summary.totalApplications} active applications</p>
          </div>
          <button type="button" onClick={() => navigate('/candidate/applications')} className="inline-flex items-center gap-1 text-sm font-semibold text-brand hover:text-brand-light">
            View all <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {recentApplications.length === 0 ? (
          <EmptyState
            icon={<BriefcaseBusiness className="h-8 w-8" />}
            title="No applications yet"
            description="Browse jobs and start applying to track your progress."
            action={
              <button type="button" onClick={() => navigate('/candidate/jobs')} className="mt-4 rounded-md bg-brand px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand-dark">
                Browse jobs
              </button>
            }
          />
        ) : (
          <div className="mt-5 space-y-2">
            {recentApplications.map((app) => (
              <div key={app.id} onClick={() => navigate(`/candidate/applications/${app.id}`)} className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 transition hover:border-slate-300 dark:hover:border-navy-600 ${isDark ? 'border-navy-700 bg-navy-800' : 'border-slate-200 bg-white'}`}>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{app.job.title}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{app.job.company?.name || app.job.location}</div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-xs font-semibold ${getStageColor(app.stage)}`}>
                    {getStageLabel(app.stage)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
