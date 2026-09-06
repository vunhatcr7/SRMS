import { useEffect, useState } from 'react';
import { BriefcaseBusiness, Building2, Edit3, Eye, MapPin, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { formatDate } from '../../utils/formatters';

interface Job { id: string; title: string; location: string; salaryRange?: string | null; isActive: boolean; createdAt: string; company?: { name: string }; _count?: { applications: number } }

export default function RecruiterJobs() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => localStorage.getItem('srms-theme') === 'light' ? 'light' : 'dark');

  useEffect(() => {
    let active = true;
    api.get('/job/manage').then((response) => { if (active) setJobs(Array.isArray(response.data) ? response.data : []); }).catch(() => { if (active) setError('Không thể tải danh sách công việc.'); }).finally(() => { if (active) setLoading(false); });
    const syncTheme = () => setTheme(localStorage.getItem('srms-theme') === 'light' ? 'light' : 'dark');
    window.addEventListener('srms-theme-change', syncTheme);
    return () => { active = false; window.removeEventListener('srms-theme-change', syncTheme); };
  }, []);

  const isDark = theme === 'dark';
  if (loading) return <div className="flex min-h-[320px] items-center justify-center text-sm text-slate-500"><RefreshCw className="mr-3 h-5 w-5 animate-spin text-blue-500" />Đang tải công việc...</div>;

  return <div className={`space-y-6 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-500">Recruiter workspace</p><h1 className="mt-2 text-3xl font-black">My jobs</h1><p className={`mt-2 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Manage the roles owned by your recruiter account.</p></div><button type="button" onClick={() => navigate('/recruiter/jobs/create')} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">Create job</button></div>{error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}{!error && jobs.length === 0 && <div className={`rounded-2xl border border-dashed p-12 text-center ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white'}`}><BriefcaseBusiness className="mx-auto h-9 w-9 text-slate-400" /><h2 className="mt-3 font-bold">No jobs yet</h2><p className="mt-1 text-sm text-slate-500">Create your first role to start recruiting.</p></div>}<div className="grid gap-4 lg:grid-cols-2">{jobs.map((job) => <article key={job.id} className={`rounded-2xl border p-5 shadow-sm ${isDark ? 'border-white/10 bg-[#111d34]' : 'border-slate-200 bg-white'}`}><div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-start gap-3"><div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${isDark ? 'bg-blue-500/15 text-blue-300' : 'bg-blue-50 text-blue-600'}`}><Building2 className="h-5 w-5" /></div><div className="min-w-0"><h2 className="truncate text-lg font-bold">{job.title}</h2><p className={`mt-1 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{job.company?.name || 'Company'}</p></div></div><span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${job.isActive ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-100 text-slate-600'}`}>{job.isActive ? 'Active' : 'Closed'}</span></div><div className={`mt-5 grid grid-cols-2 gap-3 text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}><span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-blue-500" />{job.location}</span><span>{job.salaryRange || 'Salary not specified'}</span><span>Created {formatDate(job.createdAt)}</span><span>{job._count?.applications ?? 0} applications</span></div><div className="mt-5 flex gap-2 border-t border-slate-200/20 pt-4"><button type="button" onClick={() => navigate(`/recruiter/jobs/${job.id}`)} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"><Eye className="h-4 w-4" />View</button><button type="button" onClick={() => navigate(`/recruiter/jobs/${job.id}/edit`)} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"><Edit3 className="h-4 w-4" />Edit</button></div></article>)}</div></div>;
}
