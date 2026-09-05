import { useEffect, useState } from 'react';
import { ArrowRight, BriefcaseBusiness, CheckCircle2, Clock3, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { formatDate, getScoreColor, getStageColor, getStageLabel } from '../../utils/formatters';

interface RecentApplication { id: string; stage: string; matchingScore?: number; createdAt: string; job: { title: string; location: string } }
interface DashboardData { summary: { totalApplications: number; pendingApplications: number; hiredCount: number; applicationsByStage: Record<string, number> }; recentApplications: RecentApplication[] }

export default function CandidateDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api.get('/dashboard')
      .then((response) => { if (active) setData(response.data as DashboardData); })
      .catch(() => { if (active) setError('Không thể tải dữ liệu dashboard.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  if (loading) return <div className="flex min-h-[320px] items-center justify-center text-sm text-slate-500"><RefreshCw className="mr-3 h-5 w-5 animate-spin text-indigo-600" />Đang tải dashboard...</div>;
  if (error || !data) return <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">{error || 'Không có dữ liệu dashboard.'}</div>;

  const { summary, recentApplications } = data;
  return <div className="space-y-6"><header><p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">Candidate workspace</p><h1 className="mt-2 text-3xl font-black text-slate-900">Welcome back</h1><p className="mt-2 text-sm text-slate-600">Keep track of your applications and recruitment progress.</p></header><div className="grid gap-4 sm:grid-cols-3"><div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Applications</p><p className="mt-2 text-3xl font-black text-slate-900">{summary.totalApplications}</p></div><div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500"><Clock3 className="h-4 w-4" />In progress</p><p className="mt-2 text-3xl font-black text-amber-500">{summary.pendingApplications}</p></div><div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500"><CheckCircle2 className="h-4 w-4" />Hired</p><p className="mt-2 text-3xl font-black text-emerald-600">{summary.hiredCount}</p></div></div><section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center justify-between gap-3"><div><h2 className="text-lg font-bold text-slate-900">Recent applications</h2><p className="mt-1 text-sm text-slate-500">Your latest application activity.</p></div><button type="button" onClick={() => navigate('/candidate/applications')} className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600">View all <ArrowRight className="h-4 w-4" /></button></div>{recentApplications.length === 0 ? <div className="py-10 text-center"><BriefcaseBusiness className="mx-auto h-8 w-8 text-slate-400" /><p className="mt-2 text-sm text-slate-500">No applications yet.</p><button type="button" onClick={() => navigate('/candidate/jobs')} className="mt-4 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white">Browse jobs</button></div> : <div className="mt-5 divide-y divide-slate-100">{recentApplications.map((application) => <button type="button" key={application.id} onClick={() => navigate(`/candidate/applications/${application.id}`)} className="flex w-full flex-col justify-between gap-3 py-4 text-left first:pt-0 sm:flex-row sm:items-center"><div><p className="font-semibold text-slate-900">{application.job.title}</p><p className="mt-1 text-xs text-slate-500">{application.job.location} · Applied {formatDate(application.createdAt)}</p></div><div className="flex items-center gap-3"><span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getStageColor(application.stage)}`}>{getStageLabel(application.stage)}</span>{typeof application.matchingScore === 'number' && <span className={`text-sm font-bold ${getScoreColor(application.matchingScore)}`}>{Math.round(application.matchingScore)}%</span>}</div></button>)}</div>}</section></div>;
}
